import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: { role: string }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when no roles are required (null)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    const context = createMockContext({ role: 'PM' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when no roles are required (undefined)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({ role: 'PM' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when required roles array is empty', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);
    const context = createMockContext({ role: 'PM' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'PM']);
    const context = createMockContext({ role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false when user does not have required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context = createMockContext({ role: 'PM' });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return false when user is not on request', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should check reflector with ROLES_KEY', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    const context = createMockContext({ role: 'PM' });

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
