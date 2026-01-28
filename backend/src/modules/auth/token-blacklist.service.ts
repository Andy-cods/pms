import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redis: Redis | null = null;
  private readonly useRedis: boolean;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.useRedis = !!redisUrl;

    if (this.useRedis && redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', (err) => {
          this.logger.error(`Redis connection error: ${err.message}`);
        });

        this.redis.on('connect', () => {
          this.logger.log('Connected to Redis for token blacklist');
        });

        this.redis.connect().catch((err) => {
          this.logger.warn(
            `Failed to connect to Redis: ${err.message}. Token blacklist will use in-memory fallback.`,
          );
          this.redis = null;
        });
      } catch (error) {
        this.logger.warn(
          `Redis initialization failed: ${error}. Using in-memory fallback.`,
        );
        this.redis = null;
      }
    } else {
      this.logger.warn(
        'REDIS_URL not configured. Token blacklist will use in-memory storage (not suitable for production).',
      );
    }
  }

  // In-memory fallback storage (for development only)
  private readonly inMemoryBlacklist = new Map<string, number>();

  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   * @param expiresInSeconds - TTL in seconds (should match token's remaining lifetime)
   */
  async blacklist(token: string, expiresInSeconds: number): Promise<void> {
    const key = this.getKey(token);

    if (this.redis) {
      try {
        await this.redis.setex(key, expiresInSeconds, '1');
        this.logger.debug(`Token blacklisted with TTL ${expiresInSeconds}s`);
      } catch (error) {
        this.logger.error(`Failed to blacklist token in Redis: ${error}`);
        // Fallback to in-memory
        this.inMemoryBlacklist.set(key, Date.now() + expiresInSeconds * 1000);
      }
    } else {
      // In-memory fallback
      this.inMemoryBlacklist.set(key, Date.now() + expiresInSeconds * 1000);
      this.cleanupExpiredEntries();
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.getKey(token);

    if (this.redis) {
      try {
        const result = await this.redis.get(key);
        return result !== null;
      } catch (error) {
        this.logger.error(`Failed to check blacklist in Redis: ${error}`);
        // Fallback to in-memory check
        return this.checkInMemory(key);
      }
    }

    return this.checkInMemory(key);
  }

  private getKey(token: string): string {
    // Use a hash of the token to reduce key size
    // For simplicity, we use the last 32 characters of the token
    const tokenSuffix = token.slice(-32);
    return `bl:${tokenSuffix}`;
  }

  private checkInMemory(key: string): boolean {
    const expiry = this.inMemoryBlacklist.get(key);
    if (expiry === undefined) {
      return false;
    }
    if (Date.now() > expiry) {
      this.inMemoryBlacklist.delete(key);
      return false;
    }
    return true;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, expiry] of this.inMemoryBlacklist.entries()) {
      if (now > expiry) {
        this.inMemoryBlacklist.delete(key);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
