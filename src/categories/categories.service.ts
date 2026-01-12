import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    name: string;
    description?: string;
    image?: string;
    order?: number;
  }, restaurantId: string, userId?: string) {
    const maxOrder = await this.prisma.category.findFirst({
      where: { restaurantId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const category = await this.prisma.category.create({
      data: {
        restaurantId,
        name: dto.name,
        description: dto.description,
        image: dto.image,
        order: dto.order ?? (maxOrder?.order ?? 0) + 1,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Category',
        entityId: category.id,
        newValue: { name: category.name },
      });
    }

    return category;
  }

  async findAll(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, restaurantId },
      include: {
        products: { orderBy: { order: 'asc' } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, restaurantId: string, dto: Partial<{
    name: string;
    description: string;
    image: string;
    order: number;
    isActive: boolean;
  }>, userId?: string) {
    await this.findOne(id, restaurantId);

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Category',
        entityId: id,
        newValue: { name: updated.name },
      });
    }

    return updated;
  }

  async remove(id: string, restaurantId: string, userId?: string) {
    const category = await this.findOne(id, restaurantId);

    await this.prisma.category.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'Category',
        entityId: id,
        oldValue: { name: category.name },
      });
    }
  }

  async reorder(restaurantId: string, categoryIds: string[]) {
    const updates = categoryIds.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);
    return this.findAll(restaurantId);
  }
}
