import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: PrismaService;

  const mockSubscription = {
    id: '1',
    restaurantId: 'r1',
    plan: SubscriptionPlan.PREMIUM,
    status: SubscriptionStatus.ACTIVE,
    period: 'monthly',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    payments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            payment: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscription', () => {
    it('should return subscription for a restaurant', async () => {
      jest.spyOn(prisma.subscription, 'findUnique').mockResolvedValue(mockSubscription);

      const result = await service.getSubscription('r1');

      expect(result.restaurantId).toBe('r1');
    });

    it('should throw NotFoundException', async () => {
      jest.spyOn(prisma.subscription, 'findUnique').mockResolvedValue(null);

      await expect(service.getSubscription('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePlan', () => {
    it('should update subscription plan', async () => {
      jest.spyOn(prisma.subscription, 'update').mockResolvedValue({
        ...mockSubscription,
        plan: SubscriptionPlan.ENTERPRISE,
      });

      const result = await service.updatePlan('r1', SubscriptionPlan.ENTERPRISE);

      expect(result.plan).toBe(SubscriptionPlan.ENTERPRISE);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      jest.spyOn(prisma.subscription, 'update').mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      const result = await service.cancelSubscription('r1');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([mockSubscription]);
      jest.spyOn(prisma.subscription, 'count').mockResolvedValue(1);

      const result = await service.getAllSubscriptions({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.subscription, 'count').mockResolvedValue(0);

      await service.getAllSubscriptions({ status: SubscriptionStatus.TRIAL });

      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SubscriptionStatus.TRIAL,
          }),
        }),
      );
    });

    it('should filter by plan', async () => {
      jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.subscription, 'count').mockResolvedValue(0);

      await service.getAllSubscriptions({ plan: SubscriptionPlan.ENTERPRISE });

      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            plan: SubscriptionPlan.ENTERPRISE,
          }),
        }),
      );
    });
  });

  describe('getAllPayments', () => {
    it('should return paginated payments', async () => {
      jest.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.payment, 'count').mockResolvedValue(0);

      const result = await service.getAllPayments({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
