import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(restaurantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: {
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updatePlan(restaurantId: string, plan: SubscriptionPlan) {
    return this.prisma.subscription.update({
      where: { restaurantId },
      data: { plan },
    });
  }

  async cancelSubscription(restaurantId: string) {
    return this.prisma.subscription.update({
      where: { restaurantId },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  async getAllSubscriptions(params: {
    skip?: number;
    take?: number;
    status?: SubscriptionStatus;
    plan?: SubscriptionPlan;
  }) {
    const { skip = 0, take = 50, status, plan } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async getAllPayments(params: { skip?: number; take?: number }) {
    const { skip = 0, take = 50 } = params;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              restaurant: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return { data, total, skip, take };
  }
}
