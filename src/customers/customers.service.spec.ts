import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException } from '@nestjs/common';
import { CustomerLevel } from '@prisma/client';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  const mockCustomer = {
    id: '1',
    restaurantId: 'r1',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '(11) 99999-9999',
    birthday: null,
    points: 100,
    level: CustomerLevel.BRONZE,
    totalSpent: 500,
    visitCount: 10,
    tags: [],
    notes: null,
    referralCode: 'TEST123',
    referredBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            customer: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            loyaltyHistory: {
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

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      jest.spyOn(prisma.customer, 'create').mockResolvedValue(mockCustomer);

      const result = await service.create(
        { name: 'Test Customer', phone: '(11) 99999-9999' },
        'r1',
        'user-id',
      );

      expect(result.name).toBe('Test Customer');
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      jest.spyOn(prisma.customer, 'findMany').mockResolvedValue([mockCustomer]);
      jest.spyOn(prisma.customer, 'count').mockResolvedValue(1);

      const result = await service.findAll('r1', {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by level', async () => {
      jest.spyOn(prisma.customer, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.customer, 'count').mockResolvedValue(0);

      await service.findAll('r1', { level: CustomerLevel.GOLD });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: 'r1',
            level: CustomerLevel.GOLD,
          }),
        }),
      );
    });

    it('should search by name, email, or phone', async () => {
      jest.spyOn(prisma.customer, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.customer, 'count').mockResolvedValue(0);

      await service.findAll('r1', { search: 'test' });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(mockCustomer);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException for non-existent customer', async () => {
      jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(mockCustomer);
      jest.spyOn(prisma.customer, 'update').mockResolvedValue({
        ...mockCustomer,
        name: 'Updated Name',
      });

      const result = await service.update('1', 'r1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('addPoints', () => {
    it('should add points to customer', async () => {
      jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(mockCustomer);
      jest.spyOn(prisma.customer, 'update').mockResolvedValue({
        ...mockCustomer,
        points: 150,
      });
      jest.spyOn(prisma.loyaltyHistory, 'create').mockResolvedValue({} as any);

      const result = await service.addPoints('1', 'r1', 50, 'Bonus points');

      expect(result.points).toBe(150);
    });
  });
});
