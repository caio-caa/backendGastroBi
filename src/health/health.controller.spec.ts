import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return ok status', async () => {
      const result = await controller.health();

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
    });
  });

  describe('ready', () => {
    it('should return ok status when all dependencies are healthy', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      jest.spyOn(redis, 'exists').mockResolvedValue(false);

      const result = await controller.ready();

      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe(true);
      expect(result.checks.redis).toBe(true);
    });

    it('should return degraded status when database is down', async () => {
      jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('DB error'));
      jest.spyOn(redis, 'exists').mockResolvedValue(false);

      const result = await controller.ready();

      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe(false);
    });

    it('should return degraded status when redis is down', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      jest.spyOn(redis, 'exists').mockRejectedValue(new Error('Redis error'));

      const result = await controller.ready();

      expect(result.status).toBe('degraded');
      expect(result.checks.redis).toBe(false);
    });
  });

  describe('live', () => {
    it('should return ok status', async () => {
      const result = await controller.live();

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
