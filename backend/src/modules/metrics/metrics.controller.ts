import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
