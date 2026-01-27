import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MediaPlanService } from '../../application/services/media-plan.service';
import { CreateMediaPlanDto } from '../../application/dto/create-media-plan.dto';
import { UpdateMediaPlanDto } from '../../application/dto/update-media-plan.dto';
import { MediaPlanListQueryDto } from '../../application/dto/media-plan-query.dto';
import {
  CreateMediaPlanItemDto,
  UpdateMediaPlanItemDto,
  ReorderMediaPlanItemsDto,
} from '../../application/dto/media-plan-item.dto';

@Controller('projects/:projectId/media-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaPlanController {
  constructor(private readonly mediaPlanService: MediaPlanService) {}

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: MediaPlanListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.findAll(projectId, query, req.user);
  }

  @Get(':id')
  async findById(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.findById(projectId, id, req.user);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMediaPlanDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.create(projectId, dto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMediaPlanDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.update(projectId, id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async delete(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.delete(projectId, id, req.user);
  }

  @Post(':id/items')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async addItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Body() dto: CreateMediaPlanItemDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.addItem(projectId, mediaPlanId, dto, req.user);
  }

  @Patch(':id/items/:itemId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async updateItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMediaPlanItemDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.updateItem(projectId, mediaPlanId, itemId, dto, req.user);
  }

  @Delete(':id/items/:itemId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async deleteItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Param('itemId') itemId: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.deleteItem(projectId, mediaPlanId, itemId, req.user);
  }

  @Patch(':id/items/reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM, UserRole.MEDIA, UserRole.PLANNER)
  async reorderItems(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Body() dto: ReorderMediaPlanItemsDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.reorderItems(projectId, mediaPlanId, dto, req.user);
  }
}
