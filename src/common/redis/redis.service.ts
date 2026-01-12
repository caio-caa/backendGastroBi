import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.client = new Redis(redisUrl);
      this.logger.log('Redis connected');
    } else {
      this.logger.warn('Redis URL not configured, using memory cache');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Idempotency support
  async getIdempotencyKey(key: string): Promise<string | null> {
    return this.get(`idempotency:${key}`);
  }

  async setIdempotencyKey(
    key: string,
    response: unknown,
    ttlHours = 24,
  ): Promise<void> {
    await this.set(
      `idempotency:${key}`,
      JSON.stringify(response),
      ttlHours * 60 * 60,
    );
  }
}
