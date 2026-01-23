import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, ClientLoginDto, RefreshTokenDto } from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { RequestWithUser } from './guards/jwt-auth.guard.js';

// Cookie configuration constants
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Stricter rate limiting for auth endpoints: 5 requests per minute
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  /**
   * Set httpOnly cookies for JWT tokens
   */
  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    // Set access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // Set refresh token cookie - only sent to refresh endpoint
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // Set httpOnly cookies for tokens
    this.setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    // Return user info (tokens are now in cookies)
    return {
      user: result.user,
      // Still include tokens in body for backward compatibility with API clients
      tokens: result.tokens,
    };
  }

  @Post('client-login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(
    @Body() dto: ClientLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.clientLogin(dto);

    // Set httpOnly cookies for tokens
    this.setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    // Return client info (tokens are now in cookies)
    return {
      client: result.client,
      // Still include tokens in body for backward compatibility with API clients
      tokens: result.tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Request() req: RequestWithUser & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, fallback to body
    const refreshToken = req.cookies?.refresh_token || dto.refreshToken;

    const tokens = await this.authService.refreshToken({
      refreshToken,
    });

    // Set new httpOnly cookies
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    // Return tokens for backward compatibility with API clients
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: RequestWithUser & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get token from cookie or extract from request (set by JwtStrategy)
    const token = req.cookies?.access_token || '';

    await this.authService.logout(req.user.id, token);

    // Clear authentication cookies
    this.clearTokenCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    return { user: req.user };
  }
}
