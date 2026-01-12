import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, JwtPayload } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let auditLogsService: AuditLogsService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: '',
    fullName: 'Test User',
    type: 'RESTAURANT' as const,
    role: 'OWNER' as const,
    isActive: true,
    restaurantUsers: [
      {
        isDefault: true,
        restaurant: { id: 'r1', name: 'Test Restaurant', slug: 'test-restaurant' },
      },
    ],
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('password123', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginRestaurant', () => {
    it('should return tokens and user on successful login', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.loginRestaurant({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.loginRestaurant({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.loginRestaurant({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(
        service.loginRestaurant({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginAdmin', () => {
    it('should return tokens and user on successful admin login', async () => {
      const mockAdmin = {
        ...mockUser,
        type: 'ADMIN' as const,
        role: 'SUPER_ADMIN' as const,
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdmin as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockAdmin as any);

      const result = await service.loginAdmin({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.type).toBe('ADMIN');
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.loginAdmin({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new access token on valid refresh token', async () => {
      const payload: JwtPayload = {
        sub: '1',
        email: 'test@example.com',
        type: 'RESTAURANT',
        role: 'OWNER',
        currentRestaurantId: 'r1',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword';
      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword';
      const hash = await bcrypt.hash(password, 10);

      const result = await service.comparePasswords(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const hash = await bcrypt.hash('correctpassword', 10);

      const result = await service.comparePasswords('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });
});
