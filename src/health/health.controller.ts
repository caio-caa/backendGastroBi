import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check (checks all dependencies)' })
  async ready() {
    const checks: Record<string, boolean> = {};

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    // Check Redis
    try {
      const exists = await this.redis.exists('health-check');
      checks.redis = typeof exists === 'boolean';
    } catch {
      checks.redis = false;
    }

    const allHealthy = Object.values(checks).every((v) => v);

    return {
      status: allHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check' })
  async live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
