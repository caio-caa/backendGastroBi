import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserType, UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let auditLogsService: AuditLogsService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    fullName: 'Test User',
    phone: null,
    type: UserType.RESTAURANT,
    role: UserRole.OWNER,
    isActive: true,
    avatar: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    restaurantUsers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            restaurantUser: {
              create: jest.fn(),
            },
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

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(
        {
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          type: UserType.RESTAURANT,
          role: UserRole.OWNER,
        },
        'admin-id',
      );

      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.create(
          {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
            type: UserType.RESTAURANT,
            role: UserRole.OWNER,
          },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user with restaurant association', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(prisma.restaurantUser, 'create').mockResolvedValue({} as any);

      await service.create(
        {
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          type: UserType.RESTAURANT,
          role: UserRole.OWNER,
          restaurantId: 'restaurant-id',
        },
        'admin-id',
      );

      expect(prisma.restaurantUser.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([mockUser]);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by user type', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([mockUser]);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      await service.findAll({ type: UserType.RESTAURANT });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: UserType.RESTAURANT },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        fullName: 'Updated Name',
      });

      const result = await service.update(
        '1',
        { fullName: 'Updated Name' },
        'admin-id',
      );

      expect(result.fullName).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'delete').mockResolvedValue(mockUser);

      await service.remove('1', 'admin-id');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('ban', () => {
    it('should deactivate a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.ban('1', 'admin-id');

      expect(result.isActive).toBe(false);
    });
  });

  describe('unban', () => {
    it('should activate a user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      const result = await service.unban('1', 'admin-id');

      expect(result.isActive).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return temp password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);

      const result = await service.resetPassword('1', 'admin-id');

      expect(result).toHaveProperty('tempPassword');
      expect(result.tempPassword.length).toBeGreaterThan(0);
    });
  });
});
