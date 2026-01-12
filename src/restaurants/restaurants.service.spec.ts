import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RestaurantStatus } from '@prisma/client';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prisma: PrismaService;

  const mockRestaurant = {
    id: '1',
    slug: 'test-restaurant',
    name: 'Test Restaurant',
    cnpj: null,
    phone: null,
    email: null,
    address: null,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    status: RestaurantStatus.ACTIVE,
    settings: {},
    openingHours: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
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
            subscription: {
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

    service = module.get<RestaurantsService>(RestaurantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.restaurant, 'create').mockResolvedValue(mockRestaurant);
      jest.spyOn(prisma.subscription, 'create').mockResolvedValue({} as any);

      const result = await service.create(
        { name: 'Test Restaurant', slug: 'test-restaurant' },
        'admin-id',
      );

      expect(result.name).toBe('Test Restaurant');
    });

    it('should throw ConflictException if slug exists', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant);

      await expect(
        service.create(
          { name: 'Test Restaurant', slug: 'test-restaurant' },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated restaurants', async () => {
      jest.spyOn(prisma.restaurant, 'findMany').mockResolvedValue([mockRestaurant]);
      jest.spyOn(prisma.restaurant, 'count').mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      jest.spyOn(prisma.restaurant, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.restaurant, 'count').mockResolvedValue(0);

      await service.findAll({ status: RestaurantStatus.ACTIVE });

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: RestaurantStatus.ACTIVE },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a restaurant by id', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant);

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException for non-existent restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a restaurant by slug', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant);

      const result = await service.findBySlug('test-restaurant');

      expect(result.slug).toBe('test-restaurant');
    });
  });

  describe('update', () => {
    it('should update a restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant);
      jest.spyOn(prisma.restaurant, 'update').mockResolvedValue({
        ...mockRestaurant,
        name: 'Updated Name',
      });

      const result = await service.update('1', { name: 'Updated Name' }, 'admin-id');

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('suspend', () => {
    it('should suspend a restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'update').mockResolvedValue({
        ...mockRestaurant,
        status: RestaurantStatus.SUSPENDED,
      });

      const result = await service.suspend('1', 'admin-id');

      expect(result.status).toBe(RestaurantStatus.SUSPENDED);
    });
  });

  describe('activate', () => {
    it('should activate a restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'update').mockResolvedValue({
        ...mockRestaurant,
        status: RestaurantStatus.ACTIVE,
      });

      const result = await service.activate('1', 'admin-id');

      expect(result.status).toBe(RestaurantStatus.ACTIVE);
    });
  });
});
