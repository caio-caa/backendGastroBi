import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RedisService } from '../common/redis/redis.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderType, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockOrder = {
    id: '1',
    restaurantId: 'r1',
    customerId: null,
    tableId: null,
    type: OrderType.BALCAO,
    status: OrderStatus.OPEN,
    subtotal: 50.00,
    discount: 0,
    deliveryFee: 0,
    total: 50.00,
    paymentMethod: null,
    notes: null,
    deliveryAddress: null,
    comandaNumber: null,
    waiterName: null,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    items: [
      {
        id: 'item1',
        productId: 'p1',
        productName: 'Test Product',
        price: 25.00,
        quantity: 2,
        observations: null,
        extras: [],
        variation: null,
        status: 'pending',
      },
    ],
  };

  const mockProduct = {
    id: 'p1',
    restaurantId: 'r1',
    name: 'Test Product',
    price: 25.00,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
            },
            customer: {
              update: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            table: {
              findFirst: jest.fn(),
            },
            restaurant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getIdempotencyKey: jest.fn(),
            setIdempotencyKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      jest.spyOn(redis, 'getIdempotencyKey').mockResolvedValue(null);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct] as any);
      jest.spyOn(prisma.order, 'create').mockResolvedValue(mockOrder);

      const result = await service.create(
        {
          type: OrderType.BALCAO,
          items: [{ productId: 'p1', quantity: 2 }],
        },
        'r1',
        'user-id',
      );

      expect(result.type).toBe(OrderType.BALCAO);
      expect(result.total).toBe(50.00);
    });

    it('should return cached response for duplicate idempotency key', async () => {
      jest.spyOn(redis, 'getIdempotencyKey').mockResolvedValue(JSON.stringify(mockOrder));

      const result = await service.create(
        {
          type: OrderType.BALCAO,
          items: [{ productId: 'p1', quantity: 2 }],
        },
        'r1',
        'user-id',
        'idempotency-key',
      );

      expect(result.id).toBe(mockOrder.id);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if products not found', async () => {
      jest.spyOn(redis, 'getIdempotencyKey').mockResolvedValue(null);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      await expect(
        service.create(
          {
            type: OrderType.BALCAO,
            items: [{ productId: 'non-existent', quantity: 1 }],
          },
          'r1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([mockOrder]);
      jest.spyOn(prisma.order, 'count').mockResolvedValue(1);

      const result = await service.findAll('r1', {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by type and status', async () => {
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.order, 'count').mockResolvedValue(0);

      await service.findAll('r1', { type: OrderType.DELIVERY, status: OrderStatus.COMPLETED });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: 'r1',
            type: OrderType.DELIVERY,
            status: OrderStatus.COMPLETED,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder);

      const result = await service.findOne('1', 'r1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder);
      jest.spyOn(prisma.order, 'update').mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PREPARING,
      });

      const result = await service.updateStatus('1', 'r1', OrderStatus.PREPARING);

      expect(result.status).toBe(OrderStatus.PREPARING);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder);
      jest.spyOn(prisma.order, 'update').mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel('1', 'r1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('getKitchenOrders', () => {
    it('should return kitchen orders', async () => {
      jest.spyOn(prisma.order, 'findMany').mockResolvedValue([mockOrder]);

      const result = await service.getKitchenOrders('r1');

      expect(result).toHaveLength(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [OrderStatus.OPEN, OrderStatus.PREPARING] },
          }),
        }),
      );
    });
  });
});
