import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, CampaignType, CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    name: string;
    type: CampaignType;
    message: string;
    segmentation?: unknown;
    scheduledFor?: Date;
  }, restaurantId: string, userId?: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        restaurantId,
        name: dto.name,
        type: dto.type,
        message: dto.message,
        segmentation: dto.segmentation ? JSON.parse(JSON.stringify(dto.segmentation)) : {},
        scheduledFor: dto.scheduledFor,
        status: dto.scheduledFor ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Campaign',
        entityId: campaign.id,
        newValue: { name: campaign.name, type: campaign.type },
      });
    }

    return campaign;
  }

  async findAll(restaurantId: string, params: {
    skip?: number;
    take?: number;
    status?: CampaignStatus;
    type?: CampaignType;
  }) {
    const { skip = 0, take = 50, status, type } = params;

    const where: Record<string, unknown> = { restaurantId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string, restaurantId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, restaurantId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(id: string, restaurantId: string, dto: Partial<{
    name: string;
    message: string;
    segmentation: unknown;
    scheduledFor: Date;
    status: CampaignStatus;
  }>, userId?: string) {
    await this.findOne(id, restaurantId);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...dto,
        segmentation: dto.segmentation ? JSON.parse(JSON.stringify(dto.segmentation)) : undefined,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Campaign',
        entityId: id,
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async remove(id: string, restaurantId: string, userId?: string) {
    const campaign = await this.findOne(id, restaurantId);

    await this.prisma.campaign.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'Campaign',
        entityId: id,
        oldValue: { name: campaign.name },
      });
    }
  }

  async schedule(id: string, restaurantId: string, scheduledFor: Date) {
    await this.findOne(id, restaurantId);
    return this.prisma.campaign.update({
      where: { id },
      data: { scheduledFor, status: CampaignStatus.SCHEDULED },
    });
  }

  async pause(id: string, restaurantId: string) {
    await this.findOne(id, restaurantId);
    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async getMetrics(id: string, restaurantId: string) {
    const campaign = await this.findOne(id, restaurantId);
    return campaign.metrics;
  }
}
