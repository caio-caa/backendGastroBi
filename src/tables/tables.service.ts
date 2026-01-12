import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, UserType, TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: {
    number: string;
    capacity?: number;
  }, restaurantId: string, userId?: string) {
    const table = await this.prisma.table.create({
      data: {
        restaurantId,
        number: dto.number,
        capacity: dto.capacity || 4,
      },
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.CREATE,
        entity: 'Table',
        entityId: table.id,
        newValue: { number: table.number },
      });
    }

    return table;
  }

  async findAll(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async update(id: string, restaurantId: string, dto: Partial<{
    number: string;
    capacity: number;
    status: TableStatus;
  }>, userId?: string) {
    await this.findOne(id, restaurantId);

    const updated = await this.prisma.table.update({
      where: { id },
      data: dto,
    });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.UPDATE,
        entity: 'Table',
        entityId: id,
        newValue: { number: updated.number },
      });
    }

    return updated;
  }

  async remove(id: string, restaurantId: string, userId?: string) {
    const table = await this.findOne(id, restaurantId);

    await this.prisma.table.delete({ where: { id } });

    if (userId) {
      await this.auditLogsService.create({
        userId,
        userType: UserType.RESTAURANT,
        action: AuditAction.DELETE,
        entity: 'Table',
        entityId: id,
        oldValue: { number: table.number },
      });
    }
  }

  async updateStatus(id: string, restaurantId: string, status: TableStatus) {
    await this.findOne(id, restaurantId);
    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  async generateQRCode(id: string, restaurantId: string, baseUrl: string) {
    const table = await this.findOne(id, restaurantId);
    
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    const qrCodeUrl = `${baseUrl}/menu/${restaurant?.slug}?table=${table.number}`;

    await this.prisma.table.update({
      where: { id },
      data: { qrCodeUrl },
    });

    return { qrCodeUrl };
  }
}
