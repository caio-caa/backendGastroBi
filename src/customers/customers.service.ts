import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, CustomerLevel } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    name: string;
    phone: string;
    email?: string;
    birthday?: Date;
    tags?: string[];
    notes?: string;
  }, restaurantId: string, userId?: string) {
    const customer = await this.prisma.customer.create({
      data: {
        restaurantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        birthday: dto.birthday,
        tags: dto.tags || [],
        notes: dto.notes,
        referralCode: `${dto.name.split(' ')[0].toUpperCase()}${Date.now().toString().slice(-6)}`,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Customer',
        entityId: customer.id,
        newValue: { name: customer.name, phone: customer.phone },
      });
    }

    return customer;
  }

  async findAll(restaurantId: string, params: {
    skip?: number;
    take?: number;
    search?: string;
    level?: CustomerLevel;
  }) {
    const { skip = 0, take = 50, search, level } = params;

    const where: Record<string, unknown> = { restaurantId };
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string, restaurantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, restaurantId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
        loyaltyHistory: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, restaurantId: string, dto: Partial<{
    name: string;
    phone: string;
    email: string;
    birthday: Date;
    tags: string[];
    notes: string;
  }>, userId?: string) {
    const customer = await this.findOne(id, restaurantId);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        tags: dto.tags ? dto.tags : undefined,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Customer',
        entityId: id,
        oldValue: { name: customer.name },
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async remove(id: string, restaurantId: string, userId?: string) {
    const customer = await this.findOne(id, restaurantId);

    await this.prisma.customer.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'Customer',
        entityId: id,
        oldValue: { name: customer.name },
      });
    }
  }

  async addPoints(id: string, restaurantId: string, points: number, reason: string) {
    const customer = await this.findOne(id, restaurantId);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        points: { increment: points },
      },
    });

    await this.prisma.loyaltyHistory.create({
      data: {
        customerId: id,
        type: 'MANUAL',
        points,
        notes: reason,
      },
    });

    // Update level based on points
    let newLevel: CustomerLevel = CustomerLevel.BRONZE;
    if (updated.points >= 500) newLevel = CustomerLevel.GOLD;
    else if (updated.points >= 200) newLevel = CustomerLevel.SILVER;

    if (newLevel !== updated.level) {
      await this.prisma.customer.update({
        where: { id },
        data: { level: newLevel },
      });
    }

    return updated;
  }

  async getOrders(id: string, restaurantId: string) {
    await this.findOne(id, restaurantId);
    
    return this.prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }
}
