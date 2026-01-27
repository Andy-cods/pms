import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MediaPlanController } from './presentation/controllers/media-plan.controller';
import { MediaPlanService } from './application/services/media-plan.service';
import { PrismaMediaPlanRepository } from './infrastructure/repositories/prisma-media-plan.repository';
import { MEDIA_PLAN_REPOSITORY } from './domain/interfaces/media-plan.repository.interface';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MediaPlanController],
  providers: [
    MediaPlanService,
    {
      provide: MEDIA_PLAN_REPOSITORY,
      useClass: PrismaMediaPlanRepository,
    },
  ],
  exports: [MediaPlanService],
})
export class MediaPlanModule {}
