import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockCategory = {
    id: '1',
    restaurantId: 'r1',
    name: 'Test Category',
    description: 'Test description',
    image: null,
    order: 1,
    isActive: true,
    schedule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            product: {
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditLogsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      jest.spyOn(prisma.category, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.category, 'create').mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Test Category' }, 'r1');

      expect(result.name).toBe('Test Category');
    });
  });

  describe('findAll', () => {
    it('should return categories for a restaurant', async () => {
      jest.spyOn(prisma.category, 'findMany').mockResolvedValue([mockCategory]);

      const result = await service.findAll('r1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      jest.spyOn(prisma.category, 'findFirst').mockResolvedValue(mockCategory);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(prisma.category, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('x', 'r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      jest.spyOn(prisma.category, 'findFirst').mockResolvedValue(mockCategory);
      jest.spyOn(prisma.category, 'update').mockResolvedValue({
        ...mockCategory,
        name: 'Updated',
      });

      const result = await service.update('1', 'r1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      jest.spyOn(prisma.category, 'findFirst').mockResolvedValue(mockCategory);
      jest.spyOn(prisma.category, 'delete').mockResolvedValue(mockCategory);

      await service.remove('1', 'r1');

      expect(prisma.category.delete).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should reorder categories', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockCategory]);
      jest.spyOn(prisma.category, 'findMany').mockResolvedValue([mockCategory]);

      const result = await service.reorder('r1', ['1']);

      expect(result).toHaveLength(1);
    });
  });
});
