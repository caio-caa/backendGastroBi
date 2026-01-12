import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    name: string;
    description?: string;
    price: number;
    cost?: number;
    categoryId: string;
    image?: string;
    variations?: Prisma.InputJsonValue;
    extras?: Prisma.InputJsonValue;
    allergens?: string[];
    preparationTime?: number;
    tags?: string[];
  }, restaurantId: string, userId?: string) {
    const maxOrder = await this.prisma.product.findFirst({
      where: { restaurantId, categoryId: dto.categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const product = await this.prisma.product.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        cost: dto.cost,
        image: dto.image,
        variations: dto.variations || [],
        extras: dto.extras || [],
        allergens: dto.allergens || [],
        preparationTime: dto.preparationTime || 15,
        tags: dto.tags || [],
        order: (maxOrder?.order ?? 0) + 1,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Product',
        entityId: product.id,
        newValue: { name: product.name, price: product.price },
      });
    }

    return product;
  }

  async findAll(restaurantId: string, params: {
    categoryId?: string;
    isActive?: boolean;
  }) {
    const where: Record<string, unknown> = { restaurantId };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return this.prisma.product.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { category: true },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, restaurantId },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, restaurantId: string, dto: Partial<{
    name: string;
    description: string;
    price: number;
    cost: number;
    categoryId: string;
    image: string;
    variations: Prisma.InputJsonValue;
    extras: Prisma.InputJsonValue;
    allergens: string[];
    preparationTime: number;
    isActive: boolean;
    isAvailable: boolean;
    isPromotion: boolean;
    originalPrice: number;
    tags: string[];
  }>, userId?: string) {
    await this.findOne(id, restaurantId);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        variations: dto.variations ? dto.variations : undefined,
        extras: dto.extras ? dto.extras : undefined,
        allergens: dto.allergens ? dto.allergens : undefined,
        tags: dto.tags ? dto.tags : undefined,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Product',
        entityId: id,
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async remove(id: string, restaurantId: string, userId?: string) {
    const product = await this.findOne(id, restaurantId);

    await this.prisma.product.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'Product',
        entityId: id,
        oldValue: { name: product.name },
      });
    }
  }

  async toggle(id: string, restaurantId: string) {
    const product = await this.findOne(id, restaurantId);
    return this.prisma.product.update({
      where: { id },
      data: { isAvailable: !product.isAvailable },
    });
  }

  async reorder(restaurantId: string, categoryId: string, productIds: string[]) {
    const updates = productIds.map((id, index) =>
      this.prisma.product.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);
    return this.findAll(restaurantId, { categoryId });
  }

  // Public menu endpoint
  async getPublicMenu(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        products: {
          where: { isActive: true, isAvailable: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        settings: restaurant.settings,
        openingHours: restaurant.openingHours,
      },
      categories: restaurant.categories,
      products: restaurant.products,
    };
  }

  async getPublicProduct(slug: string, productId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        restaurantId: restaurant.id,
        isActive: true,
        isAvailable: true,
      },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
