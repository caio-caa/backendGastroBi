import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, LoyaltyRuleType, LoyaltyRewardType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Rules
  async createRule(dto: {
    name: string;
    type: LoyaltyRuleType;
    points: number;
    description?: string;
    conditions?: unknown;
  }, restaurantId: string, userId?: string) {
    const rule = await this.prisma.loyaltyRule.create({
      data: {
        restaurantId,
        name: dto.name,
        type: dto.type,
        points: dto.points,
        description: dto.description,
        conditions: dto.conditions ? JSON.parse(JSON.stringify(dto.conditions)) : undefined,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'LoyaltyRule',
        entityId: rule.id,
        newValue: { name: rule.name, type: rule.type },
      });
    }

    return rule;
  }

  async findAllRules(restaurantId: string) {
    return this.prisma.loyaltyRule.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRule(id: string, restaurantId: string, dto: Partial<{
    name: string;
    points: number;
    description: string;
    isActive: boolean;
  }>, userId?: string) {
    const rule = await this.prisma.loyaltyRule.findFirst({
      where: { id, restaurantId },
    });

    if (!rule) throw new NotFoundException('Rule not found');

    const updated = await this.prisma.loyaltyRule.update({
      where: { id },
      data: dto,
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'LoyaltyRule',
        entityId: id,
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async deleteRule(id: string, restaurantId: string, userId?: string) {
    const rule = await this.prisma.loyaltyRule.findFirst({
      where: { id, restaurantId },
    });

    if (!rule) throw new NotFoundException('Rule not found');

    await this.prisma.loyaltyRule.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'LoyaltyRule',
        entityId: id,
        oldValue: { name: rule.name },
      });
    }
  }

  // Rewards
  async createReward(dto: {
    name: string;
    pointsCost: number;
    type: LoyaltyRewardType;
    value?: number;
    productId?: string;
    description?: string;
  }, restaurantId: string, userId?: string) {
    const reward = await this.prisma.loyaltyReward.create({
      data: {
        restaurantId,
        name: dto.name,
        pointsCost: dto.pointsCost,
        type: dto.type,
        value: dto.value,
        productId: dto.productId,
        description: dto.description,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'LoyaltyReward',
        entityId: reward.id,
        newValue: { name: reward.name, pointsCost: reward.pointsCost },
      });
    }

    return reward;
  }

  async findAllRewards(restaurantId: string) {
    return this.prisma.loyaltyReward.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async updateReward(id: string, restaurantId: string, dto: Partial<{
    name: string;
    pointsCost: number;
    value: number;
    description: string;
    isActive: boolean;
  }>, userId?: string) {
    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id, restaurantId },
    });

    if (!reward) throw new NotFoundException('Reward not found');

    const updated = await this.prisma.loyaltyReward.update({
      where: { id },
      data: dto,
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'LoyaltyReward',
        entityId: id,
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async deleteReward(id: string, restaurantId: string, userId?: string) {
    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id, restaurantId },
    });

    if (!reward) throw new NotFoundException('Reward not found');

    await this.prisma.loyaltyReward.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'LoyaltyReward',
        entityId: id,
        oldValue: { name: reward.name },
      });
    }
  }

  // Redemption
  async redeem(dto: {
    customerId: string;
    rewardId: string;
  }, restaurantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, restaurantId },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id: dto.rewardId, restaurantId, isActive: true },
    });

    if (!reward) throw new NotFoundException('Reward not found');

    if (customer.points < reward.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points
    await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: { points: { decrement: reward.pointsCost } },
    });

    // Create history
    const history = await this.prisma.loyaltyHistory.create({
      data: {
        customerId: dto.customerId,
        type: 'REDEMPTION',
        points: -reward.pointsCost,
        rewardId: dto.rewardId,
        notes: `Redeemed: ${reward.name}`,
      },
    });

    return { history, reward };
  }

  async getHistory(customerId: string, restaurantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, restaurantId },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.loyaltyHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { reward: true },
    });
  }
}
