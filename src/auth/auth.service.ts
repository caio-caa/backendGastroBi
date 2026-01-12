import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';
import { UserType, AuditAction } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  type: UserType;
  role: string;
  currentRestaurantId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    type: UserType;
    role: string;
    currentRestaurant?: {
      id: string;
      name: string;
      slug: string;
    };
    restaurants?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogsService: AuditLogsService,
  ) {}

  async loginRestaurant(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        restaurantUsers: {
          where: { deletedAt: null },
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user || user.type !== UserType.RESTAURANT) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const defaultRestaurant = user.restaurantUsers.find((ru) => ru.isDefault);
    const currentRestaurant = defaultRestaurant?.restaurant || user.restaurantUsers[0]?.restaurant;

    if (!currentRestaurant) {
      throw new BadRequestException('No restaurant associated with this account');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.auditLogsService.create({
      userId: user.id,
      userType: UserType.RESTAURANT,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ip,
      userAgent,
    });

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      type: user.type,
      role: user.role,
      currentRestaurantId: currentRestaurant.id,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type,
        role: user.role,
        currentRestaurant: {
          id: currentRestaurant.id,
          name: currentRestaurant.name,
          slug: currentRestaurant.slug,
        },
        restaurants: user.restaurantUsers.map((ru) => ({
          id: ru.restaurant.id,
          name: ru.restaurant.name,
          slug: ru.restaurant.slug,
        })),
      },
    };
  }

  async loginAdmin(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.type !== UserType.ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.auditLogsService.create({
      userId: user.id,
      userType: UserType.ADMIN,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ip,
      userAgent,
    });

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      type: user.type,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'gastrobi-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          restaurantUsers: {
            where: { deletedAt: null },
            include: { restaurant: true },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      const currentRestaurantId =
        payload.currentRestaurantId ||
        user.restaurantUsers.find((ru) => ru.isDefault)?.restaurantId ||
        user.restaurantUsers[0]?.restaurantId;

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        type: user.type,
        role: user.role,
        currentRestaurantId,
      };

      return this.generateTokens(newPayload);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurantUsers: {
          where: { deletedAt: null },
          include: { restaurant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, twoFactorSecret, ...userWithoutSecrets } = user;

    return {
      ...userWithoutSecrets,
      restaurants: user.restaurantUsers.map((ru) => ({
        id: ru.restaurant.id,
        name: ru.restaurant.name,
        slug: ru.restaurant.slug,
        role: ru.role,
        isDefault: ru.isDefault,
      })),
    };
  }

  async logout(userId: string, ip?: string, userAgent?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.auditLogsService.create({
        userId: user.id,
        userType: user.type,
        action: AuditAction.LOGOUT,
        entity: 'User',
        entityId: user.id,
        ip,
        userAgent,
      });
    }
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'gastrobi-refresh-secret',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
