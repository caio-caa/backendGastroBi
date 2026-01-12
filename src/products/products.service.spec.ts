import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockProduct = {
    id: '1',
    restaurantId: 'r1',
    categoryId: 'c1',
    name: 'Test Product',
    description: 'Test description',
    price: 29.90,
    cost: 10.00,
    image: null,
    variations: [],
    extras: [],
    allergens: [],
    nutritionalInfo: null,
    preparationTime: 15,
    order: 1,
    isActive: true,
    isAvailable: true,
    isPromotion: false,
    isBestSeller: false,
    isNew: false,
    originalPrice: null,
    tags: [],
    schedule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: { id: 'c1', name: 'Test Category' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            restaurant: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
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

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.product, 'create').mockResolvedValue(mockProduct);

      const result = await service.create(
        { name: 'Test Product', price: 29.90, categoryId: 'c1' },
        'r1',
        'user-id',
      );

      expect(result.name).toBe('Test Product');
    });
  });

  describe('findAll', () => {
    it('should return products for a restaurant', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct]);

      const result = await service.findAll('r1', {});

      expect(result).toHaveLength(1);
    });

    it('should filter by category', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      await service.findAll('r1', { categoryId: 'c1' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: 'r1',
            categoryId: 'c1',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(mockProduct);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException for non-existent product', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(mockProduct);
      jest.spyOn(prisma.product, 'update').mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
      });

      const result = await service.update('1', 'r1', { name: 'Updated Product' });

      expect(result.name).toBe('Updated Product');
    });
  });

  describe('toggle', () => {
    it('should toggle product availability', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(mockProduct);
      jest.spyOn(prisma.product, 'update').mockResolvedValue({
        ...mockProduct,
        isAvailable: false,
      });

      const result = await service.toggle('1', 'r1');

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('getPublicMenu', () => {
    it('should return public menu for a restaurant', async () => {
      const mockRestaurant = {
        id: 'r1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        settings: {},
        openingHours: [],
        categories: [{ id: 'c1', name: 'Category 1', isActive: true }],
        products: [mockProduct],
      };

      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant as any);

      const result = await service.getPublicMenu('test-restaurant');

      expect(result.restaurant.name).toBe('Test Restaurant');
      expect(result.categories).toHaveLength(1);
      expect(result.products).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent restaurant', async () => {
      jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(null);

      await expect(service.getPublicMenu('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
