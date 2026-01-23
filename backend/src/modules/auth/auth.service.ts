import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  LoginDto,
  ClientLoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  ClientAuthResponseDto,
  TokensDto,
} from './dto/index.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import { TokenBlacklistService } from './token-blacklist.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await this.logAuthEvent(user.id, 'LOGIN_FAILED', 'Invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Log successful login
    await this.logAuthEvent(user.id, 'LOGIN_SUCCESS');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
      tokens,
    };
  }

  async clientLogin(dto: ClientLoginDto): Promise<ClientAuthResponseDto> {
    const client = await this.prisma.client.findUnique({
      where: { accessCode: dto.accessCode },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid access code');
    }

    if (!client.isActive) {
      throw new UnauthorizedException('Client account is disabled');
    }

    // Generate tokens for client (using client id as sub)
    const tokens = await this.generateTokens(
      client.id,
      client.accessCode,
      'CLIENT',
    );

    return {
      client: {
        id: client.id,
        companyName: client.companyName,
        contactName: client.contactName,
      },
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokensDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new BadRequestException('Invalid token type');
      }

      // Check if user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or disabled');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    // Blacklist the token
    try {
      // Decode token to get expiry time
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        // Calculate remaining TTL
        const now = Math.floor(Date.now() / 1000);
        const remainingTtl = decoded.exp - now;

        if (remainingTtl > 0) {
          await this.tokenBlacklistService.blacklist(token, remainingTtl);
          this.logger.debug(`Token blacklisted for user ${userId} with TTL ${remainingTtl}s`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error}`);
    }

    // Log logout event
    await this.logAuthEvent(userId, 'LOGOUT');
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokensDto> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const accessExpiresIn = this.configService.get('JWT_EXPIRES_IN', '1h');
    const refreshExpiresIn = this.configService.get(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const secret = this.configService.get<string>('JWT_SECRET');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        accessPayload as unknown as Record<string, unknown>,
        {
          secret,
          expiresIn: accessExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        refreshPayload as unknown as Record<string, unknown>,
        {
          secret,
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    // Parse expiry to seconds
    const expiresIn = this.parseExpiryToSeconds(String(accessExpiresIn));

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // default 1 hour

    const value = parseInt(match[1] ?? '1', 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  private async logAuthEvent(
    userId: string,
    action: string,
    details?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType: 'AUTH',
          entityId: userId,
          newValue: details ? { details } : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log auth event: ${error}`);
    }
  }
}
