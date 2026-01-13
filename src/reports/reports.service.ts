import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesByCategory(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'COMPLETED',
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      { name: string; totalSales: number; totalQuantity: number; orderCount: number }
    >();

    for (const item of orderItems) {
      const categoryName = item.product?.category?.name || 'Sem Categoria';
      const categoryId = item.product?.categoryId || 'uncategorized';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: categoryName,
          totalSales: 0,
          totalQuantity: 0,
          orderCount: 0,
        });
      }

      const category = categoryMap.get(categoryId)!;
      const itemTotal = Number(item.price) * item.quantity;
      category.totalSales += itemTotal;
      category.totalQuantity += item.quantity;
      category.orderCount += 1;
    }

    const categories = Array.from(categoryMap.entries()).map(([id, data]) => ({
      categoryId: id,
      ...data,
    }));

    const totalSales = categories.reduce((sum, c) => sum + c.totalSales, 0);

    return {
      data: categories.map((c) => ({
        ...c,
        percentage: totalSales > 0 ? ((c.totalSales / totalSales) * 100).toFixed(2) : '0.00',
      })),
      meta: {
        totalSales,
        totalCategories: categories.length,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };
  }

  async getCustomersByLevel(restaurantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { restaurantId },
      select: {
        level: true,
        id: true,
      },
    });

    const levelMap = new Map<string, number>();

    for (const customer of customers) {
      const level = customer.level || 'BRONZE';
      levelMap.set(level, (levelMap.get(level) || 0) + 1);
    }

    const levels = Array.from(levelMap.entries()).map(([level, count]) => ({
      level,
      count,
    }));

    const totalCustomers = customers.length;

    return {
      data: levels.map((l) => ({
        ...l,
        percentage: totalCustomers > 0 ? ((l.count / totalCustomers) * 100).toFixed(2) : '0.00',
      })),
      meta: {
        totalCustomers,
      },
    };
  }

  async getHourlySales(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const hourlyMap = new Map<number, { count: number; revenue: number }>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { count: 0, revenue: 0 });
    }

    for (const order of orders) {
      const hour = order.createdAt.getHours();
      const data = hourlyMap.get(hour)!;
      data.count += 1;
      data.revenue += Number(order.total);
    }

    return {
      data: Array.from(hourlyMap.entries()).map(([hour, data]) => ({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        ...data,
      })),
      meta: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };
  }

  async getProductPerformance(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
  ) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'COMPLETED',
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    const productMap = new Map<
      string,
      { name: string; totalSales: number; totalQuantity: number; orderCount: number }
    >();

    for (const item of orderItems) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          name: item.product?.name || item.productName,
          totalSales: 0,
          totalQuantity: 0,
          orderCount: 0,
        });
      }

      const product = productMap.get(item.productId)!;
      const itemTotal = Number(item.price) * item.quantity;
      product.totalSales += itemTotal;
      product.totalQuantity += item.quantity;
      product.orderCount += 1;
    }

    const products = Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        ...data,
        averagePrice: data.totalQuantity > 0 ? data.totalSales / data.totalQuantity : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);

    return {
      data: products,
      meta: {
        totalProducts: productMap.size,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };
  }

  async exportReport(
    restaurantId: string,
    type: string,
    format: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ buffer: Buffer; filename: string }> {
    let data: any[];
    let headers: string[];

    switch (type) {
      case 'sales': {
        const result = await this.getSalesByCategory(restaurantId, startDate, endDate);
        data = result.data;
        headers = ['Categoria', 'Total Vendas', 'Quantidade', 'Pedidos', 'Porcentagem'];
        break;
      }
      case 'customers': {
        const result = await this.getCustomersByLevel(restaurantId);
        data = result.data;
        headers = ['Nível', 'Quantidade', 'Porcentagem'];
        break;
      }
      case 'products': {
        const result = await this.getProductPerformance(restaurantId, startDate, endDate, 100);
        data = result.data;
        headers = ['Produto', 'Total Vendas', 'Quantidade', 'Pedidos', 'Preço Médio'];
        break;
      }
      case 'orders': {
        const orders = await this.prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        data = orders.map((o) => ({
          id: o.id,
          customer: o.customer?.name || 'Anônimo',
          total: o.total,
          status: o.status,
          type: o.type,
          createdAt: o.createdAt.toISOString(),
        }));
        headers = ['ID', 'Cliente', 'Total', 'Status', 'Tipo', 'Data'];
        break;
      }
      default:
        data = [];
        headers = [];
    }

    if (format === 'csv') {
      return this.generateCsv(data, headers, type, startDate, endDate);
    }

    // For xlsx, we return CSV for now (can be enhanced with exceljs library)
    return this.generateCsv(data, headers, type, startDate, endDate);
  }

  private generateCsv(
    data: any[],
    headers: string[],
    type: string,
    startDate: Date,
    endDate: Date,
  ): { buffer: Buffer; filename: string } {
    const rows: string[] = [];
    rows.push(headers.join(','));

    for (const item of data) {
      const values = Object.values(item).map((v) => {
        if (typeof v === 'string' && v.includes(',')) {
          return `"${v}"`;
        }
        return String(v);
      });
      rows.push(values.join(','));
    }

    const csv = rows.join('\n');
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const filename = `report_${type}_${dateStr}.csv`;

    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename,
    };
  }
}
