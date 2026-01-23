import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware using Double-Submit Cookie Pattern
 *
 * How it works:
 * 1. On each response, a CSRF token is set in a readable cookie (XSRF-TOKEN)
 * 2. The frontend reads this cookie and includes it in the X-XSRF-TOKEN header
 * 3. For state-changing requests (POST, PUT, PATCH, DELETE), we verify the header matches the cookie
 *
 * This is secure because:
 * - Attackers cannot read cookies from another origin (same-origin policy)
 * - Attackers cannot set custom headers in cross-origin requests without CORS approval
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly isProduction: boolean;
  private readonly csrfCookieName = 'XSRF-TOKEN';
  private readonly csrfHeaderName = 'x-xsrf-token';

  // Safe methods that don't require CSRF protection
  private readonly safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  constructor(configService: ConfigService) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or retrieve CSRF token
    let csrfToken = req.cookies?.[this.csrfCookieName];

    if (!csrfToken) {
      // Generate a new token if one doesn't exist
      csrfToken = this.generateToken();
    }

    // Always set/refresh the CSRF token cookie
    res.cookie(this.csrfCookieName, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Skip validation for safe methods
    if (this.safeMethods.has(req.method)) {
      return next();
    }

    // Validate CSRF token for state-changing requests
    const headerToken = req.headers[this.csrfHeaderName] as string | undefined;

    if (!headerToken || headerToken !== csrfToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
