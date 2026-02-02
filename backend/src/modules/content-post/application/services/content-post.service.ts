import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ContentPostStatus, UserRole } from '@prisma/client';
import { PAGINATION_DEFAULTS } from '../../../../shared/constants/business-rules';
import { PrismaService } from '../../../../infrastructure/persistence/prisma.service';
import {
  CONTENT_POST_REPOSITORY,
  type IContentPostRepository,
  type ContentPostWithRelations,
} from '../../domain/interfaces/content-post.repository.interface';
import type { CreateContentPostDto } from '../dto/create-content-post.dto';
import type { UpdateContentPostDto } from '../dto/update-content-post.dto';
import type { ContentPostListQueryDto } from '../dto/content-post-query.dto';

/** Valid status transitions: from -> allowed destinations */
const STATUS_TRANSITIONS: Record<ContentPostStatus, ContentPostStatus[]> = {
  IDEA: [ContentPostStatus.DRAFT],
  DRAFT: [ContentPostStatus.REVIEW, ContentPostStatus.CANCELLED],
  REVIEW: [ContentPostStatus.APPROVED, ContentPostStatus.REVISION_REQUESTED],
  REVISION_REQUESTED: [ContentPostStatus.DRAFT],
  APPROVED: [ContentPostStatus.SCHEDULED, ContentPostStatus.CANCELLED],
  SCHEDULED: [ContentPostStatus.PUBLISHED, ContentPostStatus.CANCELLED],
  PUBLISHED: [],
  CANCELLED: [ContentPostStatus.DRAFT],
};

@Injectable()
export class ContentPostService {
  constructor(
    @Inject(CONTENT_POST_REPOSITORY)
    private readonly repository: IContentPostRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    projectId: string,
    planId: string,
    itemId: string,
    query: ContentPostListQueryDto,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user);

    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? 50;

    const { data, total } = await this.repository.findAll({
      mediaPlanItemId: itemId,
      status: query.status,
      search: query.search,
      page,
      limit,
      sortBy: query.sortBy ?? 'orderIndex',
      sortOrder: query.sortOrder ?? 'asc',
    });

    return {
      data: data.map((p) => this.mapToResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user);

    const post = await this.repository.findById(postId);
    if (!post || post.mediaPlanItemId !== itemId) {
      throw new NotFoundException('Content post not found');
    }

    return this.mapToResponse(post);
  }

  async create(
    projectId: string,
    planId: string,
    itemId: string,
    dto: CreateContentPostDto,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);

    const post = await this.repository.create({
      mediaPlanItemId: itemId,
      title: dto.title,
      content: dto.content,
      postType: dto.postType,
      scheduledDate: dto.scheduledDate
        ? new Date(dto.scheduledDate)
        : undefined,
      assigneeId: dto.assigneeId,
      notes: dto.notes,
      createdById: user.sub,
    });

    return this.mapToResponse(post);
  }

  async update(
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    dto: UpdateContentPostDto,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);

    const existing = await this.repository.findById(postId);
    if (!existing || existing.mediaPlanItemId !== itemId) {
      throw new NotFoundException('Content post not found');
    }

    const post = await this.repository.update(postId, {
      title: dto.title,
      content: dto.content,
      postType: dto.postType,
      scheduledDate:
        dto.scheduledDate !== undefined
          ? dto.scheduledDate
            ? new Date(dto.scheduledDate)
            : null
          : undefined,
      publishedDate:
        dto.publishedDate !== undefined
          ? dto.publishedDate
            ? new Date(dto.publishedDate)
            : null
          : undefined,
      postUrl: dto.postUrl,
      assigneeId: dto.assigneeId,
      notes: dto.notes,
    });

    return this.mapToResponse(post);
  }

  async delete(
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);

    const existing = await this.repository.findById(postId);
    if (!existing || existing.mediaPlanItemId !== itemId) {
      throw new NotFoundException('Content post not found');
    }

    await this.repository.delete(postId);
  }

  async changeStatus(
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    newStatus: ContentPostStatus,
    revisionNote: string | undefined,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);

    const existing = await this.repository.findById(postId);
    if (!existing || existing.mediaPlanItemId !== itemId) {
      throw new NotFoundException('Content post not found');
    }

    const allowed = STATUS_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${newStatus}`,
      );
    }

    // Create revision snapshot when requesting revision
    if (newStatus === ContentPostStatus.REVISION_REQUESTED) {
      await this.repository.createRevision({
        contentPostId: postId,
        title: existing.title,
        content: existing.content,
        revisionNote: revisionNote,
        revisedById: user.sub,
      });
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Auto-set publishedDate when published
    if (newStatus === ContentPostStatus.PUBLISHED && !existing.publishedDate) {
      updateData.publishedDate = new Date();
    }

    const post = await this.repository.update(postId, updateData);
    return this.mapToResponse(post);
  }

  async duplicate(
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    targetItemId: string,
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);

    const existing = await this.repository.findById(postId);
    if (!existing || existing.mediaPlanItemId !== itemId) {
      throw new NotFoundException('Content post not found');
    }

    // Validate target item belongs to the same media plan
    const targetItem = await this.prisma.mediaPlanItem.findUnique({
      where: { id: targetItemId },
    });
    if (
      !targetItem ||
      targetItem.mediaPlanId !== (await this.getMediaPlanIdForItem(itemId))
    ) {
      throw new BadRequestException(
        'Target channel must belong to the same media plan',
      );
    }

    const post = await this.repository.duplicate(
      postId,
      targetItemId,
      user.sub,
    );
    return this.mapToResponse(post);
  }

  async reorder(
    projectId: string,
    planId: string,
    itemId: string,
    postIds: string[],
    user: { sub: string; role: string },
  ) {
    await this.checkAccess(projectId, planId, itemId, user, true);
    await this.repository.reorder(itemId, postIds);
  }

  // --- Helpers ---

  private async getMediaPlanIdForItem(itemId: string): Promise<string> {
    const item = await this.prisma.mediaPlanItem.findUnique({
      where: { id: itemId },
      select: { mediaPlanId: true },
    });
    return item!.mediaPlanId;
  }

  private async checkAccess(
    projectId: string,
    planId: string,
    itemId: string,
    user: { sub: string; role: string },
    requireEdit = false,
  ): Promise<void> {
    // Verify project exists and user has access
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

    // Verify plan belongs to project
    const plan = await this.prisma.mediaPlan.findFirst({
      where: { id: planId, projectId },
    });
    if (!plan) {
      throw new NotFoundException('Media plan not found');
    }

    // Verify item belongs to plan
    const item = await this.prisma.mediaPlanItem.findFirst({
      where: { id: itemId, mediaPlanId: planId },
    });
    if (!item) {
      throw new NotFoundException('Media plan item not found');
    }

    if (requireEdit && !isAdmin) {
      const member = project.team.find((m) => m.userId === user.sub);
      const canEdit =
        member &&
        (member.role === UserRole.PM ||
          member.role === UserRole.PLANNER ||
          member.role === UserRole.CONTENT);
      if (!canEdit) {
        throw new ForbiddenException(
          'You do not have permission to edit content posts',
        );
      }
    }
  }

  private mapToResponse(post: ContentPostWithRelations) {
    return {
      id: post.id,
      mediaPlanItemId: post.mediaPlanItemId,
      title: post.title,
      content: post.content,
      postType: post.postType,
      status: post.status,
      scheduledDate: post.scheduledDate?.toISOString() ?? null,
      publishedDate: post.publishedDate?.toISOString() ?? null,
      postUrl: post.postUrl,
      assignee: post.assignee,
      notes: post.notes,
      orderIndex: post.orderIndex,
      createdBy: post.createdBy,
      revisions: post.revisions.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        revisionNote: r.revisionNote,
        revisedById: r.revisedById,
        createdAt: r.createdAt.toISOString(),
      })),
      fileCount: post._count.files,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
