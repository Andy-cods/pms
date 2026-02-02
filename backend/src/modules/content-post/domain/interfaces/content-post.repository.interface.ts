import type {
  ContentPost,
  ContentPostRevision,
  ContentPostStatus,
} from '@prisma/client';

export interface ContentPostWithRelations extends ContentPost {
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  createdBy: { id: string; name: string; email: string };
  revisions: ContentPostRevision[];
  _count: { files: number };
}

export interface ContentPostListResult {
  data: ContentPostWithRelations[];
  total: number;
}

export interface ContentPostQueryParams {
  mediaPlanItemId: string;
  status?: ContentPostStatus;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CreateContentPostData {
  mediaPlanItemId: string;
  title: string;
  content?: string;
  postType: string;
  scheduledDate?: Date;
  assigneeId?: string;
  notes?: string;
  createdById: string;
}

export interface UpdateContentPostData {
  title?: string;
  content?: string | null;
  postType?: string;
  scheduledDate?: Date | null;
  publishedDate?: Date | null;
  postUrl?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
  status?: ContentPostStatus;
}

export const CONTENT_POST_REPOSITORY = 'CONTENT_POST_REPOSITORY';

export interface IContentPostRepository {
  findAll(params: ContentPostQueryParams): Promise<ContentPostListResult>;
  findById(id: string): Promise<ContentPostWithRelations | null>;
  create(data: CreateContentPostData): Promise<ContentPostWithRelations>;
  update(
    id: string,
    data: UpdateContentPostData,
  ): Promise<ContentPostWithRelations>;
  delete(id: string): Promise<void>;
  createRevision(data: {
    contentPostId: string;
    title: string;
    content?: string | null;
    revisionNote?: string;
    revisedById: string;
  }): Promise<ContentPostRevision>;
  reorder(mediaPlanItemId: string, postIds: string[]): Promise<void>;
  duplicate(
    sourceId: string,
    targetItemId: string,
    createdById: string,
  ): Promise<ContentPostWithRelations>;
}
