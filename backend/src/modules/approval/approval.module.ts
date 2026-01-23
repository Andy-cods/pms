import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ApprovalController } from '../../presentation/controllers/approval.controller.js';
import { ApprovalEscalationService } from './approval-escalation.service.js';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), AuthModule],
  controllers: [ApprovalController],
  providers: [ApprovalEscalationService],
  exports: [ApprovalEscalationService],
})
export class ApprovalModule {}
