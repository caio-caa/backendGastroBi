import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(restaurantId: string, period: string = 'today') {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = startDate;
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    }

    // Current period orders
    const currentOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
        deletedAt: null,
      },
    });

    // Previous period orders
    const previousOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: previousStartDate, lt: previousEndDate },
        deletedAt: null,
      },
    });

    // Today's orders
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: todayStart },
        deletedAt: null,
      },
    });

    // Customers
    const totalCustomers = await this.prisma.customer.count({
      where: { restaurantId, deletedAt: null },
    });

    const activeCustomers = await this.prisma.customer.count({
      where: {
        restaurantId,
        deletedAt: null,
        orders: { some: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
      },
    });

    const newCustomers = await this.prisma.customer.count({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
        deletedAt: null,
      },
    });

    const previousNewCustomers = await this.prisma.customer.count({
      where: {
        restaurantId,
        createdAt: { gte: previousStartDate, lt: previousEndDate },
        deletedAt: null,
      },
    });

    const vipCustomers = await this.prisma.customer.count({
      where: {
        restaurantId,
        level: { in: ['GOLD', 'SILVER'] },
        deletedAt: null,
      },
    });

    // Loyalty
    const loyaltyStats = await this.prisma.customer.aggregate({
      where: { restaurantId, deletedAt: null },
      _sum: { points: true },
      _avg: { points: true },
    });

    const redemptions = await this.prisma.loyaltyHistory.count({
      where: {
        customer: { restaurantId },
        type: 'REDEEM',
        createdAt: { gte: startDate },
      },
    });

    // Calculate metrics
    const currentRevenue = currentOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);
    
    const previousRevenue = previousOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);

    const todayRevenue = todayOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const completedOrders = currentOrders.filter(o => o.status === 'COMPLETED');
    const avgTicket = completedOrders.length > 0 
      ? currentRevenue / completedOrders.length 
      : 0;

    const previousCompletedOrders = previousOrders.filter(o => o.status === 'COMPLETED');
    const previousAvgTicket = previousCompletedOrders.length > 0
      ? previousRevenue / previousCompletedOrders.length
      : 0;

    return {
      revenue: {
        total: currentRevenue,
        daily: todayRevenue,
        weekly: period === 'week' ? currentRevenue : 0,
        monthly: period === 'month' ? currentRevenue : 0,
        previousPeriodChange: calculateChange(currentRevenue, previousRevenue),
      },
      orders: {
        total: currentOrders.length,
        today: todayOrders.length,
        pending: currentOrders.filter(o => o.status === 'OPEN').length,
        preparing: currentOrders.filter(o => o.status === 'PREPARING').length,
        completed: completedOrders.length,
        cancelled: currentOrders.filter(o => o.status === 'CANCELLED').length,
        previousPeriodChange: calculateChange(currentOrders.length, previousOrders.length),
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers,
        new: newCustomers,
        vip: vipCustomers,
        previousPeriodChange: calculateChange(newCustomers, previousNewCustomers),
      },
      averageTicket: {
        value: Number(avgTicket.toFixed(2)),
        previousPeriodChange: calculateChange(avgTicket, previousAvgTicket),
      },
      loyalty: {
        totalPoints: loyaltyStats._sum.points || 0,
        averagePoints: Math.round(loyaltyStats._avg.points || 0),
        redemptions,
      },
    };
  }

  async getMonthlyData(restaurantId: string, year: number, months: number) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let yearOffset = 0;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        yearOffset = -1;
      }

      const startDate = new Date(year + yearOffset, monthIndex, 1);
      const endDate = new Date(year + yearOffset, monthIndex + 1, 0, 23, 59, 59);

      const orders = await this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
          deletedAt: null,
        },
      });

      const customers = await this.prisma.customer.count({
        where: {
          restaurantId,
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      });

      const revenue = orders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        month: monthNames[monthIndex],
        year: year + yearOffset,
        revenue: Number(revenue.toFixed(2)),
        orders: orders.length,
        customers,
        averageTicket: orders.length > 0 ? Number((revenue / orders.length).toFixed(2)) : 0,
      });
    }

    return { data };
  }

  async getTopProducts(restaurantId: string, limit: number, period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: startDate },
          status: 'COMPLETED',
          deletedAt: null,
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    // Aggregate by product
    const productStats = new Map<string, {
      id: string;
      name: string;
      category: string;
      image: string | null;
      price: number;
      salesCount: number;
      revenue: number;
    }>();

    for (const item of orderItems) {
      const existing = productStats.get(item.productId);
      if (existing) {
        existing.salesCount += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productStats.set(item.productId, {
          id: item.productId,
          name: item.product.name,
          category: item.product.category.name,
          image: item.product.image,
          price: item.product.price,
          salesCount: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    }

    const sorted = Array.from(productStats.values())
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, limit);

    return { data: sorted };
  }

  async getRecentOrders(restaurantId: string, limit: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        deletedAt: null,
      },
      include: {
        customer: { select: { id: true, name: true } },
        table: { select: { number: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      data: orders.map((order, index) => ({
        id: order.id,
        orderNumber: 1000 + index, // You can implement proper order numbering
        type: order.type,
        tableNumber: order.table?.number || null,
        status: order.status,
        total: order.total,
        itemsCount: order.items.length,
        createdAt: order.createdAt,
        customer: order.customer,
      })),
    };
  }
}
