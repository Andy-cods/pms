import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EventController } from '../../presentation/controllers/event.controller.js';
import { RRuleService } from './rrule.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EventController],
  providers: [RRuleService],
  exports: [RRuleService],
})
export class CalendarModule {}
