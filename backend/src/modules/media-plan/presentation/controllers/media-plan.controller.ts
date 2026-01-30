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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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

@ApiTags('Media Plans')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/media-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaPlanController {
  constructor(private readonly mediaPlanService: MediaPlanService) {}

  @ApiOperation({ summary: 'List media plans for a project' })
  @ApiResponse({ status: 200, description: 'Returns media plan list' })
  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: MediaPlanListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.findAll(projectId, query, req.user);
  }

  @ApiOperation({ summary: 'Get media plan by ID' })
  @ApiResponse({ status: 200, description: 'Returns media plan details' })
  @Get(':id')
  async findById(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.findById(projectId, id, req.user);
  }

  @ApiOperation({ summary: 'Create a new media plan' })
  @ApiResponse({ status: 201, description: 'Media plan created' })
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMediaPlanDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.create(projectId, dto, req.user);
  }

  @ApiOperation({ summary: 'Update a media plan' })
  @ApiResponse({ status: 200, description: 'Media plan updated' })
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMediaPlanDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.update(projectId, id, dto, req.user);
  }

  @ApiOperation({ summary: 'Delete a media plan' })
  @ApiResponse({ status: 200, description: 'Media plan deleted' })
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async delete(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.delete(projectId, id, req.user);
  }

  @ApiOperation({ summary: 'Add item to media plan' })
  @ApiResponse({ status: 201, description: 'Item added' })
  @Post(':id/items')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async addItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Body() dto: CreateMediaPlanItemDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.addItem(projectId, mediaPlanId, dto, req.user);
  }

  @ApiOperation({ summary: 'Update a media plan item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @Patch(':id/items/:itemId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async updateItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMediaPlanItemDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.updateItem(
      projectId,
      mediaPlanId,
      itemId,
      dto,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Delete a media plan item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  @Delete(':id/items/:itemId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async deleteItem(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Param('itemId') itemId: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.deleteItem(
      projectId,
      mediaPlanId,
      itemId,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Reorder media plan items' })
  @ApiResponse({ status: 200, description: 'Items reordered' })
  @Patch(':id/items/reorder')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.MEDIA,
    UserRole.PLANNER,
  )
  async reorderItems(
    @Param('projectId') projectId: string,
    @Param('id') mediaPlanId: string,
    @Body() dto: ReorderMediaPlanItemsDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.mediaPlanService.reorderItems(
      projectId,
      mediaPlanId,
      dto,
      req.user,
    );
  }
}
