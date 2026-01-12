import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      suspendedRestaurants,
    ] = await Promise.all([
      this.prisma.user.count({ where: { type: 'RESTAURANT' } }),
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.restaurant.count({ where: { status: 'TRIAL' } }),
      this.prisma.restaurant.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      suspendedRestaurants,
    };
  }

  async getRevenue(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentCount = payments.length;

    return {
      totalRevenue,
      paymentCount,
      avgPayment: paymentCount > 0 ? totalRevenue / paymentCount : 0,
    };
  }

  async getGrowth() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [lastMonthRestaurants, thisMonthRestaurants] = await Promise.all([
      this.prisma.restaurant.count({
        where: { createdAt: { lt: thisMonth, gte: lastMonth } },
      }),
      this.prisma.restaurant.count({
        where: { createdAt: { gte: thisMonth } },
      }),
    ]);

    const growthRate = lastMonthRestaurants > 0
      ? ((thisMonthRestaurants - lastMonthRestaurants) / lastMonthRestaurants) * 100
      : 0;

    return {
      lastMonthRestaurants,
      thisMonthRestaurants,
      growthRate,
    };
  }

  async getRetention() {
    // Simplified retention metric
    const activeUsers = await this.prisma.user.count({
      where: {
        type: 'RESTAURANT',
        lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: { type: 'RESTAURANT' },
    });

    return {
      activeUsers,
      totalUsers,
      retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    };
  }
}
