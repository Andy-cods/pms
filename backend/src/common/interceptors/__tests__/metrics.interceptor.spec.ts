import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { MetricsInterceptor } from '../metrics.interceptor';
import { MetricsService } from '../../../modules/metrics/metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: MetricsService;

  const mockInc = jest.fn();
  const mockObserve = jest.fn();

  const createMockContext = (
    method = 'GET',
    path = '/api/test',
  ): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ method, path }),
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      }),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    }) as unknown as ExecutionContext;

  const createMockCallHandler = (returnValue: any = {}): CallHandler => ({
    handle: jest.fn().mockReturnValue(of(returnValue)),
  });

  beforeEach(() => {
    metricsService = {
      httpRequestsTotal: { inc: mockInc },
      httpRequestDuration: { observe: mockObserve },
    } as unknown as MetricsService;

    interceptor = new MetricsInterceptor(metricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should increment httpRequestsTotal counter', (done) => {
    const context = createMockContext('GET', '/api/users');
    const handler = createMockCallHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(mockInc).toHaveBeenCalledWith({
          method: 'GET',
          path: '/api/users',
          status: 200,
        });
        done();
      },
    });
  });

  it('should observe httpRequestDuration histogram', (done) => {
    const context = createMockContext('POST', '/api/projects');
    const handler = createMockCallHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(mockObserve).toHaveBeenCalledWith(
          { method: 'POST', path: '/api/projects', status: 200 },
          expect.any(Number),
        );
        done();
      },
    });
  });

  it('should call next.handle()', (done) => {
    const context = createMockContext();
    const handler = createMockCallHandler({ data: 'test' });

    interceptor.intercept(context, handler).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: 'test' });
        expect(handler.handle).toHaveBeenCalled();
      },
      complete: () => done(),
    });
  });

  it('should record duration in seconds', (done) => {
    const context = createMockContext();
    const handler = createMockCallHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        const duration = mockObserve.mock.calls[0][1];
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(1); // Should complete in less than 1 second
        done();
      },
    });
  });

  it('should handle different HTTP methods', (done) => {
    const context = createMockContext('DELETE', '/api/tasks/123');
    const handler = createMockCallHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(mockInc).toHaveBeenCalledWith({
          method: 'DELETE',
          path: '/api/tasks/123',
          status: 200,
        });
        done();
      },
    });
  });
});
