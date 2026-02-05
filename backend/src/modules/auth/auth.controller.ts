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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, ClientLoginDto, RefreshTokenDto } from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { RequestWithUser } from './guards/jwt-auth.guard.js';

// Cookie configuration constants
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Strict rate limiting for auth endpoints: 3 attempts per 15 minutes
@ApiTags('Auth')
@Throttle({ default: { limit: 3, ttl: 900000 } })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Set httpOnly cookies for JWT tokens
   */
  private setTokenCookies(
    isSecure: boolean,
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = isSecure;

    // Set access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // Set refresh token cookie - only sent to refresh endpoint
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
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

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns user and tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Request()
    req: { secure?: boolean; get: (name: string) => string | undefined },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    const isSecure = !!req.secure || req.get('x-forwarded-proto') === 'https';

    // Set httpOnly cookies for tokens
    this.setTokenCookies(
      isSecure,
      res,
      result.tokens.accessToken,
      result.tokens.refreshToken,
    );

    // Return user info (tokens are now in cookies)
    return {
      user: result.user,
      // Still include tokens in body for backward compatibility with API clients
      tokens: result.tokens,
    };
  }

  @ApiOperation({ summary: 'Login as client with access code' })
  @ApiResponse({ status: 200, description: 'Client login successful' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials' })
  @Post('client-login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(
    @Body() dto: ClientLoginDto,
    @Request()
    req: { secure?: boolean; get: (name: string) => string | undefined },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.clientLogin(dto);
    const isSecure = !!req.secure || req.get('x-forwarded-proto') === 'https';

    // Set httpOnly cookies for tokens
    this.setTokenCookies(
      isSecure,
      res,
      result.tokens.accessToken,
      result.tokens.refreshToken,
    );

    // Return client info (tokens are now in cookies)
    return {
      client: result.client,
      // Still include tokens in body for backward compatibility with API clients
      tokens: result.tokens,
    };
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Request()
    req: {
      secure?: boolean;
      get: (name: string) => string | undefined;
      cookies?: Record<string, string>;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, fallback to body
    const refreshToken = req.cookies?.refresh_token || dto.refreshToken;

    const tokens = await this.authService.refreshToken({
      refreshToken,
    });

    // Set new httpOnly cookies
    const isSecure = !!req.secure || req.get('x-forwarded-proto') === 'https';
    this.setTokenCookies(
      isSecure,
      res,
      tokens.accessToken,
      tokens.refreshToken,
    );

    // Return tokens for backward compatibility with API clients
    return tokens;
  }

  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
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

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns current user profile' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return { user: req.user };
  }
}
