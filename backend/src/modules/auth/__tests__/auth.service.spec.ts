import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service.js';
import { TokenBlacklistService } from '../token-blacklist.service.js';
import {
  createPrismaMock,
  PrismaMock,
} from '../../../test-utils/prisma.mock.js';
import { LoginDto, ClientLoginDto, RefreshTokenDto } from '../dto/index.js';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwtService: JwtService;
  let configService: ConfigService;
  let tokenBlacklistService: TokenBlacklistService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    name: 'Test User',
    role: 'PM',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClient = {
    id: 'client-123',
    accessCode: 'ABC123',
    companyName: 'Test Company',
    contactName: 'John Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '1h',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            blacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should convert email to lowercase when finding user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const dtoWithUppercase: LoginDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      await service.login(dtoWithUppercase);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException when account is disabled', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Account is disabled',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: mockUser.id,
          newValue: { details: 'Invalid password' },
        },
      });
    });

    it('should log auth event on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          action: 'LOGIN_SUCCESS',
          entityType: 'AUTH',
          entityId: mockUser.id,
          newValue: undefined,
        },
      });
    });

    it('should update lastLoginAt timestamp', async () => {
      const beforeLogin = new Date();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });

      const updateCall = prisma.user.update.mock.calls[0];
      const lastLoginAt = updateCall[0].data.lastLoginAt;
      expect(lastLoginAt.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime(),
      );
    });
  });

  describe('clientLogin', () => {
    const clientLoginDto: ClientLoginDto = {
      accessCode: 'ABC123',
    };

    it('should successfully login client with valid access code', async () => {
      prisma.client.findUnique.mockResolvedValue(mockClient);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.clientLogin(clientLoginDto);

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { accessCode: clientLoginDto.accessCode },
      });
      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('tokens');
      expect(result.client.companyName).toBe(mockClient.companyName);
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException when access code not found', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(service.clientLogin(clientLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.clientLogin(clientLoginDto)).rejects.toThrow(
        'Invalid access code',
      );
    });

    it('should throw UnauthorizedException when client account is disabled', async () => {
      const inactiveClient = { ...mockClient, isActive: false };
      prisma.client.findUnique.mockResolvedValue(inactiveClient);

      await expect(service.clientLogin(clientLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.clientLogin(clientLoginDto)).rejects.toThrow(
        'Client account is disabled',
      );
    });

    it('should generate tokens with CLIENT role', async () => {
      prisma.client.findUnique.mockResolvedValue(mockClient);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.clientLogin(clientLoginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'CLIENT' }),
        expect.any(Object),
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      type: 'refresh',
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        { secret: 'test-secret' },
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw BadRequestException when refresh token is missing', async () => {
      const emptyDto: RefreshTokenDto = { refreshToken: '' };

      await expect(service.refreshToken(emptyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refreshToken(emptyDto)).rejects.toThrow(
        'Refresh token is required',
      );
    });

    it('should throw BadRequestException when token type is not refresh', async () => {
      const invalidPayload = { ...mockPayload, type: 'access' };
      (jwtService.verify as jest.Mock).mockReturnValue(invalidPayload);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid token type',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'User not found or disabled',
      );
    });

    it('should throw UnauthorizedException when user is disabled', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'User not found or disabled',
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw UnauthorizedException when token is malformed', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    const userId = 'user-123';
    const token = 'valid-token';

    it('should blacklist token and log logout event', async () => {
      const mockDecoded = {
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      (jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logout(userId, token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(tokenBlacklistService.blacklist).toHaveBeenCalledWith(
        token,
        expect.any(Number),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          action: 'LOGOUT',
          entityType: 'AUTH',
          entityId: userId,
          newValue: undefined,
        },
      });
    });

    it('should calculate correct remaining TTL', async () => {
      const now = Math.floor(Date.now() / 1000);
      const ttl = 1800; // 30 minutes
      const mockDecoded = {
        sub: userId,
        exp: now + ttl,
      };
      (jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logout(userId, token);

      expect(tokenBlacklistService.blacklist).toHaveBeenCalledWith(
        token,
        expect.any(Number),
      );

      const callArgs = (tokenBlacklistService.blacklist as jest.Mock).mock
        .calls[0];
      const remainingTtl = callArgs[1];
      expect(remainingTtl).toBeGreaterThan(0);
      expect(remainingTtl).toBeLessThanOrEqual(ttl);
    });

    it('should not blacklist token if already expired', async () => {
      const mockDecoded = {
        sub: userId,
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      };
      (jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logout(userId, token);

      expect(tokenBlacklistService.blacklist).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should handle decode errors gracefully', async () => {
      (jwtService.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      prisma.auditLog.create.mockResolvedValue({} as any);

      await expect(service.logout(userId, token)).resolves.not.toThrow();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should handle blacklist errors gracefully', async () => {
      const mockDecoded = {
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      (jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      (tokenBlacklistService.blacklist as jest.Mock).mockRejectedValue(
        new Error('Redis error'),
      );
      prisma.auditLog.create.mockResolvedValue({} as any);

      await expect(service.logout(userId, token)).resolves.not.toThrow();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should not blacklist token if exp is missing', async () => {
      const mockDecoded = { sub: userId };
      (jwtService.decode as jest.Mock).mockReturnValue(mockDecoded);
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logout(userId, token);

      expect(tokenBlacklistService.blacklist).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user data when user exists and is active', async () => {
      const expectedUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isActive: mockUser.isActive,
        avatar: mockUser.avatar,
      };
      prisma.user.findUnique.mockResolvedValue(expectedUser as any);

      const result = await service.validateUser(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          avatar: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toBeNull();
    });
  });

  describe('generateTokens (private method via login)', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should generate access and refresh tokens with correct payload', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);

      // Access token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          type: 'access',
        }),
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '1h',
        }),
      );

      // Refresh token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          type: 'refresh',
        }),
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '7d',
        }),
      );
    });

    it('should parse expiry time correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockResolvedValue({} as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.tokens.expiresIn).toBe(3600); // 1 hour in seconds
    });
  });

  describe('logAuthEvent (private method)', () => {
    it('should handle audit log creation errors gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.auditLog.create.mockRejectedValue(new Error('Database error'));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Should not throw even if audit log fails
      await expect(service.login(loginDto)).resolves.toBeDefined();
    });
  });
});
