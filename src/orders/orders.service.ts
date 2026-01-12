import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RedisService } from '../common/redis/redis.service';
import { AuditAction, UserType, OrderType, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private redisService: RedisService,
  ) {}

  async create(dto: {
    type: OrderType;
    customerId?: string;
    tableId?: string;
    items: Array<{
      productId: string;
      quantity: number;
      observations?: string;
      extras?: Prisma.InputJsonValue;
      variation?: Prisma.InputJsonValue;
    }>;
    notes?: string;
    deliveryAddress?: unknown;
    comandaNumber?: string;
    waiterName?: string;
  }, restaurantId: string, userId?: string, idempotencyKey?: string) {
    // Check idempotency
    if (idempotencyKey) {
      const existingResponse = await this.redisService.getIdempotencyKey(idempotencyKey);
      if (existingResponse) {
        return JSON.parse(existingResponse);
      }
    }

    // Fetch products and calculate totals
    const productIds = dto.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = dto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      
      return {
        product: { connect: { id: product.id } },
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        observations: item.observations,
        extras: item.extras ?? [],
        variation: item.variation ?? Prisma.JsonNull,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity ?? 1)), 0);

    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        type: dto.type,
        customerId: dto.customerId,
        tableId: dto.tableId,
        subtotal,
        total: subtotal,
        notes: dto.notes,
        deliveryAddress: dto.deliveryAddress ? JSON.parse(JSON.stringify(dto.deliveryAddress)) : undefined,
        comandaNumber: dto.comandaNumber,
        waiterName: dto.waiterName,
        idempotencyKey,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Update customer stats if customer exists
    if (dto.customerId) {
      await this.prisma.customer.update({
        where: { id: dto.customerId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: order.total },
          points: { increment: Math.floor(order.total) },
        },
      });
    }

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Order',
        entityId: order.id,
        newValue: { type: order.type, total: order.total },
      });
    }

    // Store idempotency key
    if (idempotencyKey) {
      await this.redisService.setIdempotencyKey(idempotencyKey, order, 24);
    }

    return order;
  }

  async findAll(restaurantId: string, params: {
    skip?: number;
    take?: number;
    type?: OrderType;
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip = 0, take = 50, type, status, startDate, endDate } = params;

    const where: Record<string, unknown> = { restaurantId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          customer: true,
          table: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string, restaurantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, restaurantId },
      include: {
        items: true,
        customer: true,
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, restaurantId: string, status: OrderStatus, userId?: string) {
    const order = await this.findOne(id, restaurantId);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Order',
        entityId: id,
        oldValue: { status: order.status },
        newValue: { status: updated.status },
      });
    }

    return updated;
  }

  async cancel(id: string, restaurantId: string, userId?: string) {
    return this.updateStatus(id, restaurantId, OrderStatus.CANCELLED, userId);
  }

  async getKitchenOrders(restaurantId: string) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: [OrderStatus.OPEN, OrderStatus.PREPARING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: true,
        table: true,
      },
    });
  }

  async getReports(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { items: true },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Best sellers
    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { name: item.productName, count: 0, revenue: 0 };
        }
        productCounts[item.productId].count += item.quantity;
        productCounts[item.productId].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.entries(productCounts)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      bestSellers,
    };
  }

  // Public order creation
  async createPublicOrder(slug: string, dto: {
    type: OrderType;
    tableNumber?: string;
    items: Array<{
      productId: string;
      quantity: number;
      observations?: string;
      extras?: Prisma.InputJsonValue;
      variation?: Prisma.InputJsonValue;
    }>;
    customer?: {
      name: string;
      phone: string;
      address?: Prisma.InputJsonValue;
    };
  }) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let customerId: string | undefined;
    let tableId: string | undefined;

    // Find or create customer
    if (dto.customer?.phone) {
      let customer = await this.prisma.customer.findFirst({
        where: { restaurantId: restaurant.id, phone: dto.customer.phone },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            restaurantId: restaurant.id,
            name: dto.customer.name,
            phone: dto.customer.phone,
          },
        });
      }

      customerId = customer.id;
    }

    // Find table
    if (dto.tableNumber) {
      const table = await this.prisma.table.findFirst({
        where: { restaurantId: restaurant.id, number: dto.tableNumber },
      });
      if (table) tableId = table.id;
    }

    return this.create({
      ...dto,
      customerId,
      tableId,
      deliveryAddress: dto.customer?.address,
    }, restaurant.id);
  }
}
