import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
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
  private readonly csrfCookieName = 'XSRF-TOKEN';
  private readonly csrfHeaderName = 'x-xsrf-token';

  // Safe methods that don't require CSRF protection
  private readonly safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  // Paths that don't require CSRF (no existing session to protect)
  private readonly excludedPaths = new Set([
    '/api/auth/login',
    '/api/auth/client-login',
    '/api/auth/refresh',
    '/api/metrics',
    '/api/health',
    '/auth/login',
    '/auth/client-login',
    '/auth/refresh',
    '/metrics',
    '/health',
  ]);

  use(req: Request, res: Response, next: NextFunction): void {
    // Use originalUrl for path matching (NestJS middleware sees relative req.path)
    const requestPath = req.originalUrl?.split('?')[0] || req.path;

    // Skip CSRF for excluded paths (auth endpoints don't need CSRF protection)
    const isExcluded = Array.from(this.excludedPaths).some(
      (path) => requestPath === path || requestPath.startsWith(path + '/'),
    );
    if (isExcluded) {
      return next();
    }

    // Also skip auth and webhook paths regardless of prefix
    if (
      requestPath.includes('/auth/login') ||
      requestPath.includes('/auth/client-login') ||
      requestPath.includes('/auth/refresh') ||
      requestPath.includes('/webhook') ||
      requestPath.includes('/integrations/')
    ) {
      return next();
    }

    // Generate or retrieve CSRF token
    let csrfToken = req.cookies?.[this.csrfCookieName] as string | undefined;

    if (!csrfToken) {
      // Generate a new token if one doesn't exist
      csrfToken = this.generateToken();
    }

    // Always set/refresh the CSRF token cookie
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie(this.csrfCookieName, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: isHttps,
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
