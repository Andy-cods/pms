import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectPhaseController } from '../../presentation/controllers/project-phase.controller';
import { ProjectPhaseService } from './project-phase.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectPhaseController],
  providers: [ProjectPhaseService],
  exports: [ProjectPhaseService],
})
export class ProjectPhaseModule {}
