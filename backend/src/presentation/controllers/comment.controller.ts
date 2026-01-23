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
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentListQueryDto,
  parseMentions,
  type CommentResponseDto,
  type CommentListResponseDto,
} from '../../application/dto/comment/comment.dto.js';
import { UserRole } from '@prisma/client';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listComments(
    @Query() query: CommentListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<CommentListResponseDto> {
    const { projectId, taskId, page = 1, limit = 50 } = query;

    if (!projectId && !taskId) {
      throw new BadRequestException('Either projectId or taskId is required');
    }

    // Check access to project/task
    if (projectId) {
      await this.checkProjectAccess(projectId, req.user);
    }
    if (taskId) {
      await this.checkTaskAccess(taskId, req.user);
    }

    const where: Record<string, unknown> = {
      parentId: null, // Only top-level comments
    };

    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              _count: { select: { replies: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => this.mapToResponse(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Post()
  async createComment(
    @Body() dto: CreateCommentDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<CommentResponseDto> {
    if (!dto.projectId && !dto.taskId) {
      throw new BadRequestException('Either projectId or taskId is required');
    }

    // Check access to project/task
    if (dto.projectId) {
      await this.checkProjectAccess(dto.projectId, req.user);
    }
    if (dto.taskId) {
      await this.checkTaskAccess(dto.taskId, req.user);
    }

    // Validate parent if replying
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        projectId: dto.projectId,
        taskId: dto.taskId,
        parentId: dto.parentId,
        authorId: req.user.sub,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { replies: true } },
      },
    });

    // Parse mentions and create notifications
    const mentions = parseMentions(dto.content);
    if (mentions.length > 0) {
      await this.createMentionNotifications(mentions, comment, req.user.sub);
    }

    // If this is a reply, notify the parent comment author
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true },
      });
      if (parent && parent.authorId !== req.user.sub) {
        await this.createReplyNotification(
          parent.authorId,
          comment,
          req.user.sub,
        );
      }
    }

    return this.mapToResponse(comment);
  }

  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: { user: { sub: string } },
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== req.user.sub) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { replies: true } },
      },
    });

    return this.mapToResponse(updated);
  }

  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;

    if (comment.authorId !== req.user.sub && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Cascade delete will handle replies
    await this.prisma.comment.delete({ where: { id } });
  }

  // Helper methods
  private async checkProjectAccess(
    projectId: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const isMember = project.team.some((m) => m.userId === user.sub);

    if (!isAdmin && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async checkTaskAccess(
    taskId: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { include: { team: true } },
        assignees: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const isMember = task.project.team.some((m) => m.userId === user.sub);
    const isAssignee = task.assignees.some((a) => a.userId === user.sub);

    if (!isAdmin && !isMember && !isAssignee) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }

  private async createMentionNotifications(
    mentions: string[],
    comment: {
      id: string;
      content: string;
      projectId: string | null;
      taskId: string | null;
    },
    authorId: string,
  ): Promise<void> {
    // Find users by email prefix (the @mention format)
    const users = await this.prisma.user.findMany({
      where: {
        OR: mentions.map((mention) => ({
          email: { startsWith: mention },
        })),
      },
      select: { id: true, email: true },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { name: true },
    });

    // Create notifications for mentioned users (except author)
    const notifications = users
      .filter((u) => u.id !== authorId)
      .map((user) => ({
        userId: user.id,
        type: 'COMMENT_MENTION',
        title: 'Bạn được đề cập trong bình luận',
        content: `${author?.name || 'Ai đó'} đã đề cập bạn trong một bình luận`,
        link: comment.taskId
          ? `/dashboard/tasks?id=${comment.taskId}`
          : `/dashboard/projects/${comment.projectId}`,
      }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications });
    }
  }

  private async createReplyNotification(
    parentAuthorId: string,
    comment: { id: string; projectId: string | null; taskId: string | null },
    replyAuthorId: string,
  ): Promise<void> {
    const author = await this.prisma.user.findUnique({
      where: { id: replyAuthorId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: parentAuthorId,
        type: 'COMMENT_REPLY',
        title: 'Có người trả lời bình luận của bạn',
        content: `${author?.name || 'Ai đó'} đã trả lời bình luận của bạn`,
        link: comment.taskId
          ? `/dashboard/tasks?id=${comment.taskId}`
          : `/dashboard/projects/${comment.projectId}`,
      },
    });
  }

  private mapToResponse(comment: {
    id: string;
    content: string;
    projectId: string | null;
    taskId: string | null;
    parentId: string | null;
    author: { id: string; name: string; email: string; avatar: string | null };
    replies?: Array<{
      id: string;
      content: string;
      projectId: string | null;
      taskId: string | null;
      parentId: string | null;
      author: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
      };
      _count: { replies: number };
      createdAt: Date;
      updatedAt: Date;
    }>;
    _count: { replies: number };
    createdAt: Date;
    updatedAt: Date;
  }): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      projectId: comment.projectId,
      taskId: comment.taskId,
      parentId: comment.parentId,
      author: comment.author,
      replies: comment.replies?.map((r) => ({
        id: r.id,
        content: r.content,
        projectId: r.projectId,
        taskId: r.taskId,
        parentId: r.parentId,
        author: r.author,
        replyCount: r._count.replies,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      replyCount: comment._count.replies,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
