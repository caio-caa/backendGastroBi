import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface FindAllAlertsOptions {
  isRead?: boolean;
  type?: string;
  limit?: number;
}

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(restaurantId: string, options: FindAllAlertsOptions) {
    const { isRead, type, limit = 50 } = options;

    const where: any = {
      restaurantId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    const unreadCount = await this.prisma.alert.count({
      where: {
        restaurantId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return {
      data: alerts,
      meta: {
        total: alerts.length,
        unreadCount,
      },
    };
  }

  async markAsRead(restaurantId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        restaurantId,
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(restaurantId: string) {
    await this.prisma.alert.updateMany({
      where: {
        restaurantId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { message: 'All alerts marked as read' };
  }

  // Helper method to create alerts programmatically
  async createAlert(data: {
    restaurantId: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    actionUrl?: string;
    expiresAt?: Date;
  }) {
    return this.prisma.alert.create({
      data: {
        restaurantId: data.restaurantId,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        expiresAt: data.expiresAt,
      },
    });
  }
}
