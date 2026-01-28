import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from '../../presentation/controllers/project.controller';
import { BudgetController } from '../../presentation/controllers/budget.controller';
import { KpiController } from '../../presentation/controllers/kpi.controller';
import { LogController } from '../../presentation/controllers/log.controller';
import { BudgetEventController } from '../../presentation/controllers/budget-event.controller.js';
import { BudgetEventService } from './budget-event.service.js';
import { IntegrationController } from '../../presentation/controllers/integration.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ProjectController,
    BudgetController,
    KpiController,
    LogController,
    BudgetEventController,
    IntegrationController,
  ],
  providers: [BudgetEventService],
  exports: [BudgetEventService],
})
export class ProjectModule {}
