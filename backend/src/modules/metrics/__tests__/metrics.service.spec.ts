import { MetricsService } from '../metrics.service';
import { Counter, Histogram, Gauge } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor initialization', () => {
    it('should initialize httpRequestsTotal as Counter', () => {
      expect(service.httpRequestsTotal).toBeDefined();
      expect(service.httpRequestsTotal).toBeInstanceOf(Counter);
      expect((service.httpRequestsTotal as any).name).toBe(
        'http_requests_total',
      );
    });

    it('should initialize httpRequestDuration as Histogram', () => {
      expect(service.httpRequestDuration).toBeDefined();
      expect(service.httpRequestDuration).toBeInstanceOf(Histogram);
      expect((service.httpRequestDuration as any).name).toBe(
        'http_request_duration_seconds',
      );
    });

    it('should initialize activeConnections as Gauge', () => {
      expect(service.activeConnections).toBeDefined();
      expect(service.activeConnections).toBeInstanceOf(Gauge);
      expect((service.activeConnections as any).name).toBe(
        'active_connections',
      );
    });

    it('should initialize dbQueryDuration as Histogram', () => {
      expect(service.dbQueryDuration).toBeDefined();
      expect(service.dbQueryDuration).toBeInstanceOf(Histogram);
      expect((service.dbQueryDuration as any).name).toBe(
        'db_query_duration_seconds',
      );
    });

    it('should configure httpRequestsTotal with correct labels', () => {
      const counter = service.httpRequestsTotal as any;
      expect(counter.labelNames).toEqual(['method', 'path', 'status']);
      expect(counter.help).toBe('Total HTTP requests');
    });

    it('should configure httpRequestDuration with buckets', () => {
      const histogram = service.httpRequestDuration as any;
      expect(histogram.labelNames).toEqual(['method', 'path', 'status']);
      expect(histogram.help).toBe('HTTP request duration in seconds');
      expect(histogram.upperBounds).toEqual([0.01, 0.05, 0.1, 0.5, 1, 2, 5]);
    });

    it('should configure dbQueryDuration with operation label and buckets', () => {
      const histogram = service.dbQueryDuration as any;
      expect(histogram.labelNames).toEqual(['operation']);
      expect(histogram.help).toBe('Database query duration in seconds');
      expect(histogram.upperBounds).toEqual([
        0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1,
      ]);
    });
  });

  describe('onModuleInit', () => {
    it('should not throw when called', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should initialize default metrics collection', () => {
      service.onModuleInit();

      // After initialization, the registry should have default metrics
      const registry = (service as any).registry;
      expect(registry).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return a string', async () => {
      const result = await service.getMetrics();

      expect(typeof result).toBe('string');
    });

    it('should include custom metrics in output', async () => {
      const result = await service.getMetrics();

      expect(result).toContain('http_requests_total');
      expect(result).toContain('http_request_duration_seconds');
      expect(result).toContain('active_connections');
      expect(result).toContain('db_query_duration_seconds');
    });

    it('should include default metrics after onModuleInit', async () => {
      service.onModuleInit();

      const result = await service.getMetrics();

      // Default metrics from prom-client (e.g., process_cpu, nodejs_)
      expect(result).toContain('process_');
      expect(result.length).toBeGreaterThan(100); // Default metrics add significant content
    });

    it('should return metrics in Prometheus exposition format', async () => {
      const result = await service.getMetrics();

      // Prometheus format includes HELP and TYPE declarations
      expect(result).toContain('# HELP');
      expect(result).toContain('# TYPE');
    });
  });

  describe('metric interactions', () => {
    it('should allow incrementing httpRequestsTotal', () => {
      expect(() => {
        service.httpRequestsTotal.inc({
          method: 'GET',
          path: '/test',
          status: '200',
        });
      }).not.toThrow();
    });

    it('should allow observing httpRequestDuration', () => {
      expect(() => {
        service.httpRequestDuration.observe(
          { method: 'GET', path: '/test', status: '200' },
          0.123,
        );
      }).not.toThrow();
    });

    it('should allow setting activeConnections gauge', () => {
      expect(() => {
        service.activeConnections.set(10);
        service.activeConnections.inc();
        service.activeConnections.dec();
      }).not.toThrow();
    });

    it('should allow observing dbQueryDuration', () => {
      expect(() => {
        service.dbQueryDuration.observe({ operation: 'SELECT' }, 0.005);
      }).not.toThrow();
    });
  });
});
