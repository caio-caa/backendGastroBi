import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
            },
            restaurant: {
              count: jest.fn(),
            },
            payment: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return platform overview', async () => {
      jest.spyOn(prisma.user, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.restaurant, 'count')
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);

      const result = await service.getOverview();

      expect(result.totalUsers).toBe(100);
      expect(result.totalRestaurants).toBe(50);
      expect(result.activeRestaurants).toBe(40);
      expect(result.trialRestaurants).toBe(8);
      expect(result.suspendedRestaurants).toBe(2);
    });
  });

  describe('getRevenue', () => {
    it('should return revenue analytics', async () => {
      jest.spyOn(prisma.payment, 'findMany').mockResolvedValue([
        { amount: 100 },
        { amount: 200 },
        { amount: 300 },
      ] as any);

      const result = await service.getRevenue(new Date(), new Date());

      expect(result.totalRevenue).toBe(600);
      expect(result.paymentCount).toBe(3);
      expect(result.avgPayment).toBe(200);
    });

    it('should handle no payments', async () => {
      jest.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);

      const result = await service.getRevenue(new Date(), new Date());

      expect(result.totalRevenue).toBe(0);
      expect(result.paymentCount).toBe(0);
      expect(result.avgPayment).toBe(0);
    });
  });

  describe('getGrowth', () => {
    it('should return growth analytics', async () => {
      jest.spyOn(prisma.restaurant, 'count')
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(15);

      const result = await service.getGrowth();

      expect(result.lastMonthRestaurants).toBe(10);
      expect(result.thisMonthRestaurants).toBe(15);
      expect(result.growthRate).toBe(50);
    });

    it('should handle zero last month', async () => {
      jest.spyOn(prisma.restaurant, 'count')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5);

      const result = await service.getGrowth();

      expect(result.growthRate).toBe(0);
    });
  });

  describe('getRetention', () => {
    it('should return retention analytics', async () => {
      jest.spyOn(prisma.user, 'count')
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(100);

      const result = await service.getRetention();

      expect(result.activeUsers).toBe(80);
      expect(result.totalUsers).toBe(100);
      expect(result.retentionRate).toBe(80);
    });

    it('should handle zero total users', async () => {
      jest.spyOn(prisma.user, 'count')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRetention();

      expect(result.retentionRate).toBe(0);
    });
  });
});
