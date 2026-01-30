import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientAuthGuard } from '../client-auth.guard';

describe('ClientAuthGuard', () => {
  let guard: ClientAuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const createMockContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request: Record<string, any> = { headers: { ...headers } };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    guard = new ClientAuthGuard(jwtService, configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Missing or invalid authorization header',
    );
  });

  it('should throw UnauthorizedException when authorization is not Bearer', async () => {
    const context = createMockContext({ authorization: 'Basic abc123' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should verify token with JWT_SECRET from config', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'client-1',
      role: 'CLIENT',
      companyName: 'Test Company',
    });
    const context = createMockContext({
      authorization: 'Bearer valid-client-token',
    });

    await guard.canActivate(context);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-client-token', {
      secret: 'test-jwt-secret',
    });
  });

  it('should throw UnauthorizedException when role is not CLIENT', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      role: 'ADMIN',
      companyName: 'Test Company',
    });
    const context = createMockContext({ authorization: 'Bearer admin-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach clientUser to request on success', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'client-1',
      role: 'CLIENT',
      companyName: 'Test Company',
    });
    const context = createMockContext({ authorization: 'Bearer valid-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.clientUser).toEqual({
      clientId: 'client-1',
      companyName: 'Test Company',
      role: 'CLIENT',
    });
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('jwt expired'),
    );
    const context = createMockContext({
      authorization: 'Bearer expired-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token is malformed', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('jwt malformed'),
    );
    const context = createMockContext({ authorization: 'Bearer malformed' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
