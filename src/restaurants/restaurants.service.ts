import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, RestaurantStatus } from '@prisma/client';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    name: string;
    slug: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    address?: unknown;
    timezone?: string;
    ownerId?: string;
  }, adminId: string) {
    const existingSlug = await this.prisma.restaurant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        cnpj: dto.cnpj,
        phone: dto.phone,
        email: dto.email,
        address: dto.address ? JSON.parse(JSON.stringify(dto.address)) : undefined,
        timezone: dto.timezone || 'America/Sao_Paulo',
        status: RestaurantStatus.TRIAL,
      },
    });

    // If owner is specified, create association
    if (dto.ownerId) {
      await this.prisma.restaurantUser.create({
        data: {
          userId: dto.ownerId,
          restaurantId: restaurant.id,
          role: 'OWNER',
          isDefault: true,
        },
      });
    }

    // Create default subscription
    await this.prisma.subscription.create({
      data: {
        restaurantId: restaurant.id,
        plan: 'BASIC',
        status: 'TRIAL',
      },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.CREATE,
      entity: 'Restaurant',
      entityId: restaurant.id,
      newValue: { name: restaurant.name, slug: restaurant.slug },
    });

    return restaurant;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: RestaurantStatus;
  }) {
    const { skip = 0, take = 50, status } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: true,
          _count: {
            select: {
              customers: true,
              products: true,
              orders: true,
            },
          },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        subscription: true,
        restaurantUsers: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, role: true },
            },
          },
        },
        _count: {
          select: {
            customers: true,
            products: true,
            categories: true,
            orders: true,
            tables: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findBySlug(slug: string) {
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

    return restaurant;
  }

  async update(
    id: string,
    dto: Partial<{
      name: string;
      phone: string;
      email: string;
      address: unknown;
      timezone: string;
      settings: unknown;
      openingHours: unknown;
    }>,
    adminId?: string,
  ) {
    const restaurant = await this.findOne(id);

    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...dto,
        address: dto.address ? JSON.parse(JSON.stringify(dto.address)) : undefined,
        settings: dto.settings ? JSON.parse(JSON.stringify(dto.settings)) : undefined,
        openingHours: dto.openingHours ? JSON.parse(JSON.stringify(dto.openingHours)) : undefined,
      },
    });

    if (adminId) {
      await this.auditLogsService.create({
        userId: adminId,
        userType: UserType.ADMIN,
        action: AuditAction.UPDATE,
        entity: 'Restaurant',
        entityId: id,
        oldValue: { name: restaurant.name },
        newValue: { name: updatedRestaurant.name },
      });
    }

    return updatedRestaurant;
  }

  async remove(id: string, adminId: string) {
    const restaurant = await this.findOne(id);

    await this.prisma.restaurant.delete({ where: { id } });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.DELETE,
      entity: 'Restaurant',
      entityId: id,
      oldValue: { name: restaurant.name, slug: restaurant.slug },
    });
  }

  async suspend(id: string, adminId: string) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.SUSPENDED },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.UPDATE,
      entity: 'Restaurant',
      entityId: id,
      newValue: { status: 'SUSPENDED' },
    });

    return restaurant;
  }

  async activate(id: string, adminId: string) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.ACTIVE },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.UPDATE,
      entity: 'Restaurant',
      entityId: id,
      newValue: { status: 'ACTIVE' },
    });

    return restaurant;
  }

  async findPublic(params: {
    search?: string;
    cuisine?: string;
    isOpen?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, cuisine, isOpen, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      status: RestaurantStatus.ACTIVE,
      deletedAt: null,
    };

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { settings: { path: ['description'], string_contains: search } },
        { settings: { path: ['cuisine'], string_contains: search } },
      ];
    }

    // Filter by cuisine type
    if (cuisine) {
      where.settings = {
        path: ['cuisine'],
        string_contains: cuisine,
      };
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          openingHours: true,
          settings: true,
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    // Process restaurants
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const processedRestaurants = restaurants.map(restaurant => {
      const settings = (restaurant.settings as Record<string, unknown>) || {};
      const openingHours = (restaurant.openingHours as Array<{
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isOpen: boolean;
      }>) || [];

      // Check if restaurant is currently open
      const todayHours = openingHours.find(h => h.dayOfWeek === dayOfWeek);
      let restaurantIsOpen = false;
      
      if (todayHours?.isOpen && todayHours.openTime && todayHours.closeTime) {
        restaurantIsOpen = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
      }

      return {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        description: settings.description || null,
        image: settings.image || settings.cover || null,
        rating: settings.rating || 0,
        reviews: settings.reviewsCount || 0,
        cuisine: settings.cuisine || null,
        deliveryTime: settings.deliveryTime 
          ? `${(settings.deliveryTime as { min: number; max: number }).min}-${(settings.deliveryTime as { min: number; max: number }).max} min`
          : null,
        isOpen: restaurantIsOpen,
      };
    });

    // Filter by isOpen if specified
    const filteredRestaurants = isOpen !== undefined
      ? processedRestaurants.filter(r => r.isOpen === isOpen)
      : processedRestaurants;

    const totalFiltered = isOpen !== undefined
      ? filteredRestaurants.length
      : total;

    return {
      restaurants: filteredRestaurants,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    };
  }
}
