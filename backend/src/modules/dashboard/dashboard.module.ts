import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { DashboardController } from '../../presentation/controllers/dashboard.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
