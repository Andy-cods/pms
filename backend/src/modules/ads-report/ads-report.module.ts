import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdsReportService } from './ads-report.service.js';
import { AdsReportController } from '../../presentation/controllers/ads-report.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdsReportController],
  providers: [AdsReportService],
  exports: [AdsReportService],
})
export class AdsReportModule {}
