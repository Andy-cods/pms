import type { MediaPlan, MediaPlanItem, MediaPlanStatus, MediaPlanType } from '@prisma/client';

export interface MediaPlanWithItems extends MediaPlan {
  items: MediaPlanItem[];
  createdBy: { id: string; name: string; email: string };
}

export interface MediaPlanListResult {
  data: MediaPlanWithItems[];
  total: number;
}

export interface MediaPlanQueryParams {
  projectId: string;
  status?: MediaPlanStatus;
  type?: MediaPlanType;
  month?: number;
  year?: number;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CreateMediaPlanData {
  projectId: string;
  name: string;
  type?: MediaPlanType;
  month: number;
  year: number;
  totalBudget: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
  createdById: string;
}

export interface UpdateMediaPlanData {
  name?: string;
  month?: number;
  year?: number;
  totalBudget?: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string | null;
  status?: MediaPlanStatus;
}

export interface CreateMediaPlanItemData {
  mediaPlanId: string;
  channel: string;
  campaignType: string;
  objective: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  targetReach?: number;
  targetClicks?: number;
  targetLeads?: number;
  targetCPL?: number;
  targetCPC?: number;
  targetROAS?: number;
  orderIndex?: number;
}

export interface UpdateMediaPlanItemData {
  channel?: string;
  campaignType?: string;
  objective?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  targetReach?: number | null;
  targetClicks?: number | null;
  targetLeads?: number | null;
  targetCPL?: number | null;
  targetCPC?: number | null;
  targetROAS?: number | null;
  status?: string;
  orderIndex?: number;
}

export const MEDIA_PLAN_REPOSITORY = 'MEDIA_PLAN_REPOSITORY';

export interface IMediaPlanRepository {
  findAll(params: MediaPlanQueryParams): Promise<MediaPlanListResult>;
  findById(id: string, projectId: string): Promise<MediaPlanWithItems | null>;
  create(data: CreateMediaPlanData): Promise<MediaPlanWithItems>;
  update(id: string, data: UpdateMediaPlanData): Promise<MediaPlanWithItems>;
  delete(id: string): Promise<void>;
  createItem(data: CreateMediaPlanItemData): Promise<MediaPlanItem>;
  updateItem(id: string, data: UpdateMediaPlanItemData): Promise<MediaPlanItem>;
  deleteItem(id: string): Promise<void>;
  reorderItems(mediaPlanId: string, itemIds: string[]): Promise<void>;
}
