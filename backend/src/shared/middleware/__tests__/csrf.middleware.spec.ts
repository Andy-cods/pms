import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CsrfMiddleware } from '../csrf.middleware';

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let configService: ConfigService;

  const createMockReqRes = (
    overrides: {
      method?: string;
      path?: string;
      cookies?: Record<string, string>;
      headers?: Record<string, string>;
    } = {},
  ) => {
    const req = {
      method: overrides.method ?? 'GET',
      path: overrides.path ?? '/api/projects',
      cookies: overrides.cookies ?? {},
      headers: overrides.headers ?? {},
    };
    const res = {
      cookie: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    middleware = new CsrfMiddleware(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('excluded paths', () => {
    it('should skip CSRF for /api/auth/login', () => {
      const { req, res, next } = createMockReqRes({
        path: '/api/auth/login',
        method: 'POST',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should skip CSRF for /api/auth/client-login', () => {
      const { req, res, next } = createMockReqRes({
        path: '/api/auth/client-login',
        method: 'POST',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should skip CSRF for /api/auth/refresh', () => {
      const { req, res, next } = createMockReqRes({
        path: '/api/auth/refresh',
        method: 'POST',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should skip CSRF for /api/metrics', () => {
      const { req, res, next } = createMockReqRes({
        path: '/api/metrics',
        method: 'GET',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should skip CSRF for /api/health', () => {
      const { req, res, next } = createMockReqRes({
        path: '/api/health',
        method: 'GET',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should skip CSRF for paths containing /auth/login', () => {
      const { req, res, next } = createMockReqRes({
        path: '/v2/auth/login',
        method: 'POST',
      });
      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('safe methods', () => {
    it('should set cookie and call next for GET requests', () => {
      const { req, res, next } = createMockReqRes({
        method: 'GET',
        path: '/api/projects',
      });
      middleware.use(req as any, res as any, next);
      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(next).toHaveBeenCalled();
    });

    it('should set cookie and call next for HEAD requests', () => {
      const { req, res, next } = createMockReqRes({ method: 'HEAD' });
      middleware.use(req as any, res as any, next);
      expect(res.cookie).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should set cookie and call next for OPTIONS requests', () => {
      const { req, res, next } = createMockReqRes({ method: 'OPTIONS' });
      middleware.use(req as any, res as any, next);
      expect(res.cookie).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('CSRF token validation', () => {
    it('should throw ForbiddenException when POST without CSRF token', () => {
      const { req, res, next } = createMockReqRes({
        method: 'POST',
        path: '/api/projects',
      });

      expect(() => middleware.use(req as any, res as any, next)).toThrow(
        ForbiddenException,
      );
      expect(() => middleware.use(req as any, res as any, next)).toThrow(
        'Invalid CSRF token',
      );
    });

    it('should throw ForbiddenException when header token does not match cookie', () => {
      const { req, res, next } = createMockReqRes({
        method: 'POST',
        path: '/api/projects',
        cookies: { 'XSRF-TOKEN': 'token-abc' },
        headers: { 'x-xsrf-token': 'token-xyz' },
      });

      expect(() => middleware.use(req as any, res as any, next)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow POST when header token matches cookie', () => {
      const { req, res, next } = createMockReqRes({
        method: 'POST',
        path: '/api/projects',
        cookies: { 'XSRF-TOKEN': 'matching-token' },
        headers: { 'x-xsrf-token': 'matching-token' },
      });

      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should validate CSRF for PUT requests', () => {
      const { req, res, next } = createMockReqRes({
        method: 'PUT',
        path: '/api/projects/1',
        cookies: { 'XSRF-TOKEN': 'valid-token' },
        headers: { 'x-xsrf-token': 'valid-token' },
      });

      middleware.use(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should validate CSRF for PATCH requests', () => {
      const { req, res, next } = createMockReqRes({
        method: 'PATCH',
        path: '/api/projects/1',
      });

      expect(() => middleware.use(req as any, res as any, next)).toThrow(
        ForbiddenException,
      );
    });

    it('should validate CSRF for DELETE requests', () => {
      const { req, res, next } = createMockReqRes({
        method: 'DELETE',
        path: '/api/projects/1',
      });

      expect(() => middleware.use(req as any, res as any, next)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('token generation', () => {
    it('should generate new token when no cookie exists', () => {
      const { req, res, next } = createMockReqRes({ method: 'GET' });
      middleware.use(req as any, res as any, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.any(Object),
      );
      const token = res.cookie.mock.calls[0][1];
      expect(token.length).toBe(64); // 32 bytes hex = 64 chars
    });

    it('should reuse existing cookie token', () => {
      const { req, res, next } = createMockReqRes({
        method: 'GET',
        cookies: { 'XSRF-TOKEN': 'existing-token' },
      });
      middleware.use(req as any, res as any, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        'existing-token',
        expect.any(Object),
      );
    });

    it('should set secure cookie in production', () => {
      const prodConfigService = {
        get: jest.fn().mockReturnValue('production'),
      } as unknown as ConfigService;
      const prodMiddleware = new CsrfMiddleware(prodConfigService);

      const { req, res, next } = createMockReqRes({ method: 'GET' });
      prodMiddleware.use(req as any, res as any, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({ secure: true }),
      );
    });

    it('should not set secure cookie in development', () => {
      const { req, res, next } = createMockReqRes({ method: 'GET' });
      middleware.use(req as any, res as any, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({ secure: false }),
      );
    });
  });
});
