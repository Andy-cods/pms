import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @ApiOperation({ summary: 'Get Prometheus-compatible metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns metrics in text/plain format',
  })
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
