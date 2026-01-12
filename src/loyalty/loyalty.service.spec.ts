import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoyaltyRuleType, LoyaltyRewardType, CustomerLevel } from '@prisma/client';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: PrismaService;

  const mockRule = {
    id: '1',
    restaurantId: 'r1',
    name: 'Test Rule',
    type: LoyaltyRuleType.PURCHASE,
    points: 10,
    description: 'Test description',
    conditions: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockReward = {
    id: '1',
    restaurantId: 'r1',
    name: 'Test Reward',
    pointsCost: 100,
    type: LoyaltyRewardType.DISCOUNT_PERCENTAGE,
    value: 10,
    productId: null,
    description: 'Test description',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCustomer = {
    id: 'c1',
    restaurantId: 'r1',
    name: 'Test Customer',
    phone: '123456789',
    points: 150,
    level: CustomerLevel.BRONZE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: PrismaService,
          useValue: {
            loyaltyRule: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            loyaltyReward: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            loyaltyHistory: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            customer: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Rules', () => {
    describe('createRule', () => {
      it('should create a new loyalty rule', async () => {
        jest.spyOn(prisma.loyaltyRule, 'create').mockResolvedValue(mockRule);

        const result = await service.createRule({
          name: 'Test Rule',
          type: LoyaltyRuleType.PURCHASE,
          points: 10,
        }, 'r1');

        expect(result.name).toBe('Test Rule');
      });
    });

    describe('findAllRules', () => {
      it('should return loyalty rules', async () => {
        jest.spyOn(prisma.loyaltyRule, 'findMany').mockResolvedValue([mockRule]);

        const result = await service.findAllRules('r1');

        expect(result).toHaveLength(1);
      });
    });

    describe('updateRule', () => {
      it('should update a rule', async () => {
        jest.spyOn(prisma.loyaltyRule, 'findFirst').mockResolvedValue(mockRule);
        jest.spyOn(prisma.loyaltyRule, 'update').mockResolvedValue({
          ...mockRule,
          points: 20,
        });

        const result = await service.updateRule('1', 'r1', { points: 20 });

        expect(result.points).toBe(20);
      });

      it('should throw NotFoundException', async () => {
        jest.spyOn(prisma.loyaltyRule, 'findFirst').mockResolvedValue(null);

        await expect(service.updateRule('x', 'r1', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteRule', () => {
      it('should delete a rule', async () => {
        jest.spyOn(prisma.loyaltyRule, 'findFirst').mockResolvedValue(mockRule);
        jest.spyOn(prisma.loyaltyRule, 'delete').mockResolvedValue(mockRule);

        await service.deleteRule('1', 'r1');

        expect(prisma.loyaltyRule.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Rewards', () => {
    describe('createReward', () => {
      it('should create a new loyalty reward', async () => {
        jest.spyOn(prisma.loyaltyReward, 'create').mockResolvedValue(mockReward);

        const result = await service.createReward({
          name: 'Test Reward',
          pointsCost: 100,
          type: LoyaltyRewardType.DISCOUNT_PERCENTAGE,
        }, 'r1');

        expect(result.name).toBe('Test Reward');
      });
    });

    describe('findAllRewards', () => {
      it('should return loyalty rewards', async () => {
        jest.spyOn(prisma.loyaltyReward, 'findMany').mockResolvedValue([mockReward]);

        const result = await service.findAllRewards('r1');

        expect(result).toHaveLength(1);
      });
    });

    describe('updateReward', () => {
      it('should update a reward', async () => {
        jest.spyOn(prisma.loyaltyReward, 'findFirst').mockResolvedValue(mockReward);
        jest.spyOn(prisma.loyaltyReward, 'update').mockResolvedValue({
          ...mockReward,
          pointsCost: 150,
        });

        const result = await service.updateReward('1', 'r1', { pointsCost: 150 });

        expect(result.pointsCost).toBe(150);
      });
    });
  });

  describe('Redemption', () => {
    describe('redeem', () => {
      it('should redeem a reward', async () => {
        jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(mockCustomer as any);
        jest.spyOn(prisma.loyaltyReward, 'findFirst').mockResolvedValue(mockReward);
        jest.spyOn(prisma.customer, 'update').mockResolvedValue({
          ...mockCustomer,
          points: 50,
        } as any);
        jest.spyOn(prisma.loyaltyHistory, 'create').mockResolvedValue({} as any);

        const result = await service.redeem({
          customerId: 'c1',
          rewardId: '1',
        }, 'r1');

        expect(result).toHaveProperty('reward');
        expect(result).toHaveProperty('history');
      });

      it('should throw if customer not found', async () => {
        jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(null);

        await expect(service.redeem({
          customerId: 'x',
          rewardId: '1',
        }, 'r1')).rejects.toThrow(NotFoundException);
      });

      it('should throw if insufficient points', async () => {
        jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue({
          ...mockCustomer,
          points: 50,
        } as any);
        jest.spyOn(prisma.loyaltyReward, 'findFirst').mockResolvedValue(mockReward);

        await expect(service.redeem({
          customerId: 'c1',
          rewardId: '1',
        }, 'r1')).rejects.toThrow(BadRequestException);
      });
    });

    describe('getHistory', () => {
      it('should return customer loyalty history', async () => {
        jest.spyOn(prisma.customer, 'findFirst').mockResolvedValue(mockCustomer as any);
        jest.spyOn(prisma.loyaltyHistory, 'findMany').mockResolvedValue([]);

        const result = await service.getHistory('c1', 'r1');

        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
