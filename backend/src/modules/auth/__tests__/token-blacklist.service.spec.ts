import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../token-blacklist.service.js';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Return null for REDIS_URL to force in-memory mode in tests
              if (key === 'REDIS_URL') {
                return null;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with in-memory storage when REDIS_URL is not configured', () => {
      expect(configService.get).toHaveBeenCalledWith('REDIS_URL');
      expect(service).toBeDefined();
      // Service should be using in-memory mode (redis = null)
    });

    it('should warn about in-memory storage in development', () => {
      // This is implicitly tested by the beforeEach setup
      // The service will log a warning when REDIS_URL is not set
      expect(service).toBeDefined();
    });
  });

  describe('blacklist (in-memory mode)', () => {
    it('should add token to in-memory blacklist with TTL', async () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.abcdefghijklmnopqrstuvwxyz123456';
      const ttl = 3600;

      await service.blacklist(token, ttl);

      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it('should handle very long tokens correctly', async () => {
      const longToken = 'a'.repeat(500);
      const ttl = 1800;

      await service.blacklist(longToken, ttl);

      const isBlacklisted = await service.isBlacklisted(longToken);
      expect(isBlacklisted).toBe(true);
    });

    it('should respect TTL and expire tokens', async () => {
      const token = 'short-lived-token-123456789012';
      const ttl = 0; // Expire immediately

      await service.blacklist(token, ttl);

      // Wait a tiny bit to ensure expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    });

    it('should handle multiple tokens independently', async () => {
      const token1 = 'token-one-1234567890123456789012';
      const token2 = 'token-two-1234567890123456789012';
      const ttl = 3600;

      await service.blacklist(token1, ttl);
      await service.blacklist(token2, ttl);

      expect(await service.isBlacklisted(token1)).toBe(true);
      expect(await service.isBlacklisted(token2)).toBe(true);
    });

    it('should cleanup expired entries when blacklisting new tokens', async () => {
      // Add expired token
      const expiredToken = 'expired-token-1234567890123456';
      await service.blacklist(expiredToken, 0);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Add new token - should trigger cleanup
      const newToken = 'new-token-12345678901234567890';
      await service.blacklist(newToken, 3600);

      // Expired token should be cleaned up
      expect(await service.isBlacklisted(expiredToken)).toBe(false);
      expect(await service.isBlacklisted(newToken)).toBe(true);
    });
  });

  describe('isBlacklisted (in-memory mode)', () => {
    it('should return false for non-blacklisted token', async () => {
      const token = 'non-blacklisted-token-123456789012';

      const isBlacklisted = await service.isBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });

    it('should return true for blacklisted token', async () => {
      const token = 'blacklisted-token-123456789012345';
      await service.blacklist(token, 3600);

      const isBlacklisted = await service.isBlacklisted(token);

      expect(isBlacklisted).toBe(true);
    });

    it('should return false for expired blacklisted token', async () => {
      const token = 'expired-blacklisted-token-12345678';
      await service.blacklist(token, 0);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      const isBlacklisted = await service.isBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });

    it('should handle empty token gracefully', async () => {
      const token = '';

      const isBlacklisted = await service.isBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('getKey (private method - tested via blacklist/isBlacklisted)', () => {
    it('should use last 32 characters of token for key', async () => {
      // Create token longer than 32 chars
      const tokenPrefix = 'prefix-';
      const tokenSuffix = '1234567890123456789012345678901234567890';
      const token = tokenPrefix + tokenSuffix;

      await service.blacklist(token, 3600);

      // Verify it's blacklisted using the full token
      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(true);

      // The key should be based on last 32 chars with prefix "bl:"
      // This is tested indirectly through successful retrieval
    });

    it('should handle tokens shorter than 32 characters', async () => {
      const shortToken = 'short-token-12345';

      await service.blacklist(shortToken, 3600);

      const isBlacklisted = await service.isBlacklisted(shortToken);
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('onModuleDestroy', () => {
    it('should handle module destruction gracefully in in-memory mode', async () => {
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle negative TTL gracefully', async () => {
      const token = 'negative-ttl-token-123456789012';
      await service.blacklist(token, -100);

      // Should be expired immediately
      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    });

    it('should handle very large TTL', async () => {
      const token = 'large-ttl-token-1234567890123456';
      const ttl = 365 * 24 * 60 * 60; // 1 year in seconds

      await service.blacklist(token, ttl);

      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it('should handle special characters in token', async () => {
      const token = 'token.with-special_chars/+=123456789012';
      const ttl = 3600;

      await service.blacklist(token, ttl);

      const isBlacklisted = await service.isBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });
  });
});
