import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdsReportService } from './ads-report.service.js';
import { AdsReportMessageService } from './ads-report-message.service.js';
import { AdsReportLeadService } from './ads-report-lead.service.js';
import { AdsReportConversionService } from './ads-report-conversion.service.js';
import { AdsReportController } from '../../presentation/controllers/ads-report.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdsReportController],
  providers: [
    AdsReportService,
    AdsReportMessageService,
    AdsReportLeadService,
    AdsReportConversionService,
  ],
  exports: [
    AdsReportService,
    AdsReportMessageService,
    AdsReportLeadService,
    AdsReportConversionService,
  ],
})
export class AdsReportModule {}
