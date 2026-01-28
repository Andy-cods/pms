import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SalesPipelineController } from '../../presentation/controllers/sales-pipeline.controller';
import { SalesPipelineService } from './sales-pipeline.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SalesPipelineController],
  providers: [SalesPipelineService],
  exports: [SalesPipelineService],
})
export class SalesPipelineModule {}
