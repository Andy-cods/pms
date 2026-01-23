import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from '../../presentation/controllers/dashboard.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
