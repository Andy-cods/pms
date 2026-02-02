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
import { ContentPostService } from '../../application/services/content-post.service';
import { CreateContentPostDto } from '../../application/dto/create-content-post.dto';
import {
  UpdateContentPostDto,
  ChangeContentPostStatusDto,
  DuplicateContentPostDto,
  ReorderContentPostsDto,
} from '../../application/dto/update-content-post.dto';
import { ContentPostListQueryDto } from '../../application/dto/content-post-query.dto';

@ApiTags('Content Posts')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/media-plans/:planId/items/:itemId/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentPostController {
  constructor(private readonly contentPostService: ContentPostService) {}

  @ApiOperation({ summary: 'List content posts for a channel' })
  @ApiResponse({ status: 200, description: 'Returns content post list' })
  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Query() query: ContentPostListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.findAll(
      projectId,
      planId,
      itemId,
      query,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Get content post by ID' })
  @ApiResponse({ status: 200, description: 'Returns content post details' })
  @Get(':postId')
  async findById(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Param('postId') postId: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.findById(
      projectId,
      planId,
      itemId,
      postId,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Create a new content post' })
  @ApiResponse({ status: 201, description: 'Content post created' })
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.CONTENT,
  )
  async create(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CreateContentPostDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.create(
      projectId,
      planId,
      itemId,
      dto,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Update a content post' })
  @ApiResponse({ status: 200, description: 'Content post updated' })
  @Patch(':postId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.CONTENT,
  )
  async update(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdateContentPostDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.update(
      projectId,
      planId,
      itemId,
      postId,
      dto,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Delete a content post' })
  @ApiResponse({ status: 200, description: 'Content post deleted' })
  @Delete(':postId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PM)
  async delete(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Param('postId') postId: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.delete(
      projectId,
      planId,
      itemId,
      postId,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Change content post status' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  @Patch(':postId/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.CONTENT,
  )
  async changeStatus(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Param('postId') postId: string,
    @Body() dto: ChangeContentPostStatusDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.changeStatus(
      projectId,
      planId,
      itemId,
      postId,
      dto.status,
      dto.revisionNote,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Duplicate post to another channel' })
  @ApiResponse({ status: 201, description: 'Post duplicated' })
  @Post(':postId/duplicate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.CONTENT,
  )
  async duplicate(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Param('postId') postId: string,
    @Body() dto: DuplicateContentPostDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.duplicate(
      projectId,
      planId,
      itemId,
      postId,
      dto.targetItemId,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Reorder content posts' })
  @ApiResponse({ status: 200, description: 'Posts reordered' })
  @Patch('reorder')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PM,
    UserRole.PLANNER,
    UserRole.CONTENT,
  )
  async reorder(
    @Param('projectId') projectId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ReorderContentPostsDto,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    return this.contentPostService.reorder(
      projectId,
      planId,
      itemId,
      dto.postIds,
      req.user,
    );
  }
}
