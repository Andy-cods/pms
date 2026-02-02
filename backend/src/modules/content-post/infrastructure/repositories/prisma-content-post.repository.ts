import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma.service';
import type { ContentPostRevision } from '@prisma/client';
import type {
  IContentPostRepository,
  ContentPostWithRelations,
  ContentPostListResult,
  ContentPostQueryParams,
  CreateContentPostData,
  UpdateContentPostData,
} from '../../domain/interfaces/content-post.repository.interface';

const INCLUDE_RELATIONS = {
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  revisions: { orderBy: { createdAt: 'desc' as const } },
  _count: { select: { files: true } },
};

@Injectable()
export class PrismaContentPostRepository implements IContentPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: ContentPostQueryParams,
  ): Promise<ContentPostListResult> {
    const { mediaPlanItemId, status, search, page, limit, sortBy, sortOrder } =
      params;

    const where: Record<string, unknown> = { mediaPlanItemId };
    if (status) where.status = status;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.contentPost.findMany({
        where,
        include: INCLUDE_RELATIONS,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contentPost.count({ where }),
    ]);

    return { data: data as ContentPostWithRelations[], total };
  }

  async findById(id: string): Promise<ContentPostWithRelations | null> {
    const post = await this.prisma.contentPost.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });
    return post as ContentPostWithRelations | null;
  }

  async create(data: CreateContentPostData): Promise<ContentPostWithRelations> {
    const maxOrder = await this.prisma.contentPost.aggregate({
      where: { mediaPlanItemId: data.mediaPlanItemId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const post = await this.prisma.contentPost.create({
      data: {
        mediaPlanItemId: data.mediaPlanItemId,
        title: data.title,
        content: data.content,
        postType: data.postType,
        scheduledDate: data.scheduledDate,
        assigneeId: data.assigneeId,
        notes: data.notes,
        createdById: data.createdById,
        orderIndex,
      },
      include: INCLUDE_RELATIONS,
    });
    return post as ContentPostWithRelations;
  }

  async update(
    id: string,
    data: UpdateContentPostData,
  ): Promise<ContentPostWithRelations> {
    const post = await this.prisma.contentPost.update({
      where: { id },
      data,
      include: INCLUDE_RELATIONS,
    });
    return post as ContentPostWithRelations;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contentPost.delete({ where: { id } });
  }

  async createRevision(data: {
    contentPostId: string;
    title: string;
    content?: string | null;
    revisionNote?: string;
    revisedById: string;
  }): Promise<ContentPostRevision> {
    return this.prisma.contentPostRevision.create({ data });
  }

  async reorder(_mediaPlanItemId: string, postIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      postIds.map((id, index) =>
        this.prisma.contentPost.update({
          where: { id },
          data: { orderIndex: index },
        }),
      ),
    );
  }

  async duplicate(
    sourceId: string,
    targetItemId: string,
    createdById: string,
  ): Promise<ContentPostWithRelations> {
    const source = await this.prisma.contentPost.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error('Source post not found');
    }

    const maxOrder = await this.prisma.contentPost.aggregate({
      where: { mediaPlanItemId: targetItemId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const post = await this.prisma.contentPost.create({
      data: {
        mediaPlanItemId: targetItemId,
        title: source.title,
        content: source.content,
        postType: source.postType,
        notes: source.notes,
        status: 'DRAFT',
        createdById,
        orderIndex,
      },
      include: INCLUDE_RELATIONS,
    });
    return post as ContentPostWithRelations;
  }
}
