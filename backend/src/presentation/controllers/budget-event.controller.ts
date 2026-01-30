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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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

@ApiTags('Budget Events')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/budget-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetEventController {
  constructor(private readonly budgetEventService: BudgetEventService) {}

  @ApiOperation({ summary: 'List budget events for a project' })
  @ApiResponse({ status: 200, description: 'Returns budget event list' })
  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query() query: BudgetEventQueryDto,
  ): Promise<BudgetEventResponse[]> {
    return this.budgetEventService.list(projectId, query);
  }

  @ApiOperation({ summary: 'Get budget threshold for a project' })
  @ApiResponse({ status: 200, description: 'Returns budget threshold info' })
  @Get('threshold')
  async getThreshold(
    @Param('projectId') projectId: string,
  ): Promise<BudgetThresholdResponse> {
    return this.budgetEventService.getThreshold(projectId);
  }

  @ApiOperation({ summary: 'Create a budget event (spend/adjustment)' })
  @ApiResponse({ status: 201, description: 'Budget event created' })
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBudgetEventDto,
    @Req() req: { user: { sub: string } },
  ): Promise<BudgetEventResponse> {
    return this.budgetEventService.create(projectId, req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Update budget event status' })
  @ApiResponse({ status: 200, description: 'Budget event status updated' })
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
