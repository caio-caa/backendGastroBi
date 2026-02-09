import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditAction, UserType } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateUserDto, adminId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        type: dto.type,
        role: dto.role,
      },
    });

    // If creating a restaurant user with a restaurant, create the association
    if (dto.type === UserType.RESTAURANT && dto.restaurantId) {
      await this.prisma.restaurantUser.create({
        data: {
          userId: user.id,
          restaurantId: dto.restaurantId,
          role: dto.role,
          isDefault: true,
        },
      });
    }

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.CREATE,
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, fullName: user.fullName, type: user.type },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(params: { skip?: number; take?: number; type?: UserType }) {
    const { skip = 0, take = 50, type } = params;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          type: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          restaurantUsers: {
            include: {
              restaurant: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        restaurantUsers: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, twoFactorSecret, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  async update(id: string, dto: UpdateUserDto, adminId: string) {
    const user = await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: id,
      oldValue: { fullName: user.fullName, isActive: user.isActive },
      newValue: { fullName: updatedUser.fullName, isActive: updatedUser.isActive },
    });

    const { passwordHash, twoFactorSecret, ...userWithoutSecrets } = updatedUser;
    return userWithoutSecrets;
  }

  async remove(id: string, adminId: string) {
    const user = await this.findOne(id);

    // Delete avatar from Cloudinary if it exists
    if (user.avatar) {
      const publicId = this.cloudinaryService.extractPublicId(user.avatar);
      if (publicId) await this.cloudinaryService.delete(publicId);
    }

    await this.prisma.user.delete({ where: { id } });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.DELETE,
      entity: 'User',
      entityId: id,
      oldValue: { email: user.email, fullName: user.fullName },
    });
  }

  async updateAvatar(id: string, avatarUrl: string, adminId: string) {
    const user = await this.findOne(id);

    // Delete old avatar from Cloudinary if it exists
    if (user.avatar) {
      const publicId = this.cloudinaryService.extractPublicId(user.avatar);
      if (publicId) await this.cloudinaryService.delete(publicId);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
    });

    await this.auditLogsService.create({
      userId: adminId,
      userType: UserType.ADMIN,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: id,
      oldValue: { avatar: user.avatar },
      newValue: { avatar: avatarUrl },
    });

    const { passwordHash, twoFactorSecret, ...userWithoutSecrets } = updatedUser;
    return userWithoutSecrets;
  }

  async ban(id: string, adminId: string) {
    return this.update(id, { isActive: false }, adminId);
  }

  async unban(id: string, adminId: string) {
    return this.update(id, { isActive: true }, adminId);
  }

  async resetPassword(id: string, adminId: string) {
    const tempPassword = Math.random().toString(36).slice(-8);
    await this.update(id, { password: tempPassword }, adminId);
    return { tempPassword };
  }

  async switchRestaurant(userId: string, restaurantId: string) {
    const user = await this.findOne(userId);

    // Check if user has access to this restaurant
    const restaurantAccess = await this.prisma.restaurantUser.findFirst({
      where: {
        userId,
        restaurantId,
      },
    });

    if (!restaurantAccess) {
      throw new NotFoundException('Restaurant not found or access denied');
    }

    // Get restaurant details
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      success: true,
      message: 'Restaurant switched successfully',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          currentRestaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            cnpj: restaurant.cnpj,
            status: restaurant.status,
            phone: restaurant.phone,
            email: restaurant.email,
            address: restaurant.address,
            timezone: restaurant.timezone,
          },
        },
      },
    };
  }

  async createWaiter(
    dto: { fullName: string; email: string; password: string; restaurantId: string },
    restaurantOwnerId: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Verify restaurant exists and user is owner/manager
    const restaurantUser = await this.prisma.restaurantUser.findFirst({
      where: {
        userId: restaurantOwnerId,
        restaurantId: dto.restaurantId,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });

    if (!restaurantUser) {
      throw new ForbiddenException(
        'You do not have permission to create waiters for this restaurant',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        type: UserType.RESTAURANT,
        role: 'WAITER',
      },
    });

    // Create association with restaurant
    await this.prisma.restaurantUser.create({
      data: {
        userId: user.id,
        restaurantId: dto.restaurantId,
        role: 'WAITER',
        isDefault: true,
      },
    });

    await this.auditLogsService.create({
      userId: restaurantOwnerId,
      userType: UserType.RESTAURANT,
      action: AuditAction.CREATE,
      entity: 'Waiter',
      entityId: user.id,
      newValue: { email: user.email, fullName: user.fullName },
    });

    const { passwordHash: _, twoFactorSecret, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }
}
