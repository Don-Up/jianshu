import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('RedisService');
  private client!: Redis;

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');

    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error(`[Redis] Connection failed after ${times} attempts`);
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`[Redis] Connecting to ${host}:${port}...`);
    });

    this.client.on('ready', () => {
      this.logger.log(`[Redis] Connected successfully to ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`[Redis] Connection error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn(`[Redis] Connection closed`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.get(key);
    console.log(`[Redis GET] key: ${key}, hit: ${result !== null}`);
    return result;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
    console.log(`[Redis SET] key: ${key}, ttl: ${ttlSeconds}s, valueLength: ${value.length}`);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
