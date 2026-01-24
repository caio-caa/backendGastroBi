import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

interface SubscriptionResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  amount: number;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private getPlanAmount(plan: SubscriptionPlan): number {
    const prices = {
      [SubscriptionPlan.BASIC]: 99.00,
      [SubscriptionPlan.PREMIUM]: 299.00,
      [SubscriptionPlan.ENTERPRISE]: 599.00,
    };
    return prices[plan];
  }

  async getSubscription(restaurantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: {
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        restaurant: {
          select: { name: true },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      id: subscription.id,
      restaurantId: subscription.restaurantId,
      restaurantName: subscription.restaurant.name,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.currentPeriodStart?.toISOString() || subscription.createdAt.toISOString(),
      nextBillingDate: subscription.currentPeriodEnd?.toISOString() || '',
      amount: this.getPlanAmount(subscription.plan),
      paymentHistory: subscription.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.createdAt.toISOString(),
      })),
    };
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

    const [subscriptions, total] = await Promise.all([
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

    const data: SubscriptionResponse[] = subscriptions.map((sub) => ({
      id: sub.id,
      restaurantId: sub.restaurantId,
      restaurantName: sub.restaurant.name,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.currentPeriodStart?.toISOString() || sub.createdAt.toISOString(),
      nextBillingDate: sub.currentPeriodEnd?.toISOString() || '',
      amount: this.getPlanAmount(sub.plan),
    }));

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
