import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditAction, UserType } from '@prisma/client';

interface CreateAuditLogDto {
  userId?: string;
  userType?: UserType;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        userType: dto.userType,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        oldValue: dto.oldValue ? JSON.parse(JSON.stringify(dto.oldValue)) : undefined,
        newValue: dto.newValue ? JSON.parse(JSON.stringify(dto.newValue)) : undefined,
        ip: dto.ip,
        userAgent: dto.userAgent,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    userId?: string;
    action?: AuditAction;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip = 0, take = 50, userId, action, entity, startDate, endDate } = params;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, actionCounts] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
      }),
    ]);

    return {
      totalLogs,
      todayLogs,
      actionCounts: actionCounts.reduce(
        (acc, item) => {
          acc[item.action] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
