import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StrategicBriefController } from '../../presentation/controllers/strategic-brief.controller';
import { StrategicBriefService } from './strategic-brief.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StrategicBriefController],
  providers: [StrategicBriefService],
  exports: [StrategicBriefService],
})
export class StrategicBriefModule {}
