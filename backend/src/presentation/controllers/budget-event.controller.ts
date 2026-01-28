import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { Roles } from '../../modules/auth/decorators/roles.decorator.js';
import { BudgetEventService } from '../../modules/project/budget-event.service.js';
import {
  BudgetEventQueryDto,
  CreateBudgetEventDto,
  UpdateBudgetEventStatusDto,
  BudgetEventResponse,
  BudgetThresholdResponse,
} from '../../application/dto/budget-event.dto.js';

@Controller('projects/:projectId/budget-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetEventController {
  constructor(private readonly budgetEventService: BudgetEventService) {}

  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query() query: BudgetEventQueryDto,
  ): Promise<BudgetEventResponse[]> {
    return this.budgetEventService.list(projectId, query);
  }

  @Get('threshold')
  async getThreshold(
    @Param('projectId') projectId: string,
  ): Promise<BudgetThresholdResponse> {
    return this.budgetEventService.getThreshold(projectId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBudgetEventDto,
    @Req() req: { user: { sub: string } },
  ): Promise<BudgetEventResponse> {
    return this.budgetEventService.create(projectId, req.user.sub, dto);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PM', 'NVKD')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetEventStatusDto,
  ): Promise<BudgetEventResponse> {
    return this.budgetEventService.updateStatus(id, projectId, dto);
  }
}
