import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { LoginDto, ClientLoginDto, RefreshTokenDto } from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { RequestWithUser } from './guards/jwt-auth.guard.js';

// Stricter rate limiting for auth endpoints: 5 requests per minute
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('client-login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(@Body() dto: ClientLoginDto) {
    return this.authService.clientLogin(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: RequestWithUser,
    @Headers('authorization') authHeader: string,
  ) {
    // Extract token from Bearer header
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    await this.authService.logout(req.user.id, token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    return { user: req.user };
  }
}
