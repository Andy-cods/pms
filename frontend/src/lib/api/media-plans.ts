import { api } from './index';

// ============================================
// TYPES
// ============================================

export type MediaPlanType = 'ADS' | 'DESIGN' | 'CONTENT';

export type MediaPlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MediaPlanItem {
  id: string;
  mediaPlanId: string;
  channel: string;
  campaignType: string;
  objective: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetReach: number | null;
  targetClicks: number | null;
  targetLeads: number | null;
  targetCPL: number | null;
  targetCPC: number | null;
  targetROAS: number | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPlan {
  id: string;
  projectId: string;
  name: string;
  type: MediaPlanType;
  month: number;
  year: number;
  version: number;
  status: MediaPlanStatus;
  totalBudget: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  items: MediaPlanItem[];
  itemCount: number;
  allocatedBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPlanListResponse {
  data: MediaPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaPlanListParams {
  status?: MediaPlanStatus;
  type?: MediaPlanType;
  month?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMediaPlanInput {
  name: string;
  type?: MediaPlanType;
  month: number;
  year: number;
  totalBudget: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateMediaPlanInput {
  name?: string;
  month?: number;
  year?: number;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: MediaPlanStatus;
}

export interface CreateMediaPlanItemInput {
  channel: string;
  campaignType: string;
  objective: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetReach?: number;
  targetClicks?: number;
  targetLeads?: number;
  targetCPL?: number;
  targetCPC?: number;
  targetROAS?: number;
}

export interface UpdateMediaPlanItemInput {
  channel?: string;
  campaignType?: string;
  objective?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  targetReach?: number;
  targetClicks?: number;
  targetLeads?: number;
  targetCPL?: number;
  targetCPC?: number;
  targetROAS?: number;
  status?: string;
}

export interface ReorderMediaPlanItemsInput {
  itemIds: string[];
}

// ============================================
// API FUNCTIONS
// ============================================

export const mediaPlansApi = {
  list: async (
    projectId: string,
    params?: MediaPlanListParams,
  ): Promise<MediaPlanListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.month) searchParams.append('month', String(params.month));
    if (params?.year) searchParams.append('year', String(params.year));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await api.get(
      `/projects/${projectId}/media-plans${query ? `?${query}` : ''}`,
    );
    return response.data;
  },

  getById: async (projectId: string, planId: string): Promise<MediaPlan> => {
    const response = await api.get(
      `/projects/${projectId}/media-plans/${planId}`,
    );
    return response.data;
  },

  create: async (
    projectId: string,
    input: CreateMediaPlanInput,
  ): Promise<MediaPlan> => {
    const response = await api.post(
      `/projects/${projectId}/media-plans`,
      input,
    );
    return response.data;
  },

  update: async (
    projectId: string,
    planId: string,
    input: UpdateMediaPlanInput,
  ): Promise<MediaPlan> => {
    const response = await api.patch(
      `/projects/${projectId}/media-plans/${planId}`,
      input,
    );
    return response.data;
  },

  delete: async (projectId: string, planId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/media-plans/${planId}`);
  },

  addItem: async (
    projectId: string,
    planId: string,
    input: CreateMediaPlanItemInput,
  ): Promise<MediaPlan> => {
    const response = await api.post(
      `/projects/${projectId}/media-plans/${planId}/items`,
      input,
    );
    return response.data;
  },

  updateItem: async (
    projectId: string,
    planId: string,
    itemId: string,
    input: UpdateMediaPlanItemInput,
  ): Promise<MediaPlan> => {
    const response = await api.patch(
      `/projects/${projectId}/media-plans/${planId}/items/${itemId}`,
      input,
    );
    return response.data;
  },

  deleteItem: async (
    projectId: string,
    planId: string,
    itemId: string,
  ): Promise<void> => {
    await api.delete(
      `/projects/${projectId}/media-plans/${planId}/items/${itemId}`,
    );
  },

  reorderItems: async (
    projectId: string,
    planId: string,
    input: ReorderMediaPlanItemsInput,
  ): Promise<MediaPlan> => {
    const response = await api.patch(
      `/projects/${projectId}/media-plans/${planId}/items/reorder`,
      input,
    );
    return response.data;
  },
};

// ============================================
// CONSTANTS
// ============================================

export const MediaPlanTypeLabels: Record<MediaPlanType, string> = {
  ADS: 'Ads',
  DESIGN: 'Design',
  CONTENT: 'Content',
};

export const MediaPlanTypeColors: Record<MediaPlanType, string> = {
  ADS: 'bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]',
  DESIGN: 'bg-[#af52de]/10 text-[#af52de] dark:bg-[#bf5af2]/15 dark:text-[#bf5af2]',
  CONTENT: 'bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ff9f0a]/15 dark:text-[#ffd60a]',
};

export const MediaPlanStatusLabels: Record<MediaPlanStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ACTIVE: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const MediaPlanStatusColors: Record<MediaPlanStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING_APPROVAL: 'bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ff9f0a]/15 dark:text-[#ffd60a]',
  APPROVED: 'bg-[#30d158]/10 text-[#30d158] dark:bg-[#30d158]/15 dark:text-[#30d158]',
  ACTIVE: 'bg-[#007aff]/10 text-[#007aff] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]',
  COMPLETED: 'bg-[#34c759]/10 text-[#34c759] dark:bg-[#30d158]/15 dark:text-[#30d158]',
  CANCELLED: 'bg-[#ff3b30]/10 text-[#ff3b30] dark:bg-[#ff453a]/15 dark:text-[#ff453a]',
};

// --- Type-specific item options ---

export const MEDIA_CHANNELS_BY_TYPE: Record<MediaPlanType, readonly { value: string; label: string }[]> = {
  ADS: [
    { value: 'facebook', label: 'Facebook Ads' },
    { value: 'google', label: 'Google Ads' },
    { value: 'tiktok', label: 'TikTok Ads' },
    { value: 'youtube', label: 'YouTube Ads' },
    { value: 'instagram', label: 'Instagram Ads' },
    { value: 'linkedin', label: 'LinkedIn Ads' },
    { value: 'zalo', label: 'Zalo Ads' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'sms', label: 'SMS Marketing' },
    { value: 'seo', label: 'SEO' },
    { value: 'other', label: 'Khác' },
  ],
  DESIGN: [
    { value: 'social_media', label: 'Social Media' },
    { value: 'website', label: 'Website' },
    { value: 'display_ads', label: 'Display Ads' },
    { value: 'video', label: 'Video / Motion' },
    { value: 'brand', label: 'Brand Identity' },
    { value: 'print', label: 'In ấn' },
    { value: 'other', label: 'Khác' },
  ],
  CONTENT: [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'blog', label: 'Blog / SEO' },
    { value: 'email', label: 'Email' },
    { value: 'ads_copy', label: 'Ads Copy' },
    { value: 'video_script', label: 'Video Script' },
    { value: 'pr', label: 'PR / Báo chí' },
    { value: 'other', label: 'Khác' },
  ],
};

export const CAMPAIGN_TYPES_BY_TYPE: Record<MediaPlanType, readonly { value: string; label: string }[]> = {
  ADS: [
    { value: 'awareness', label: 'Awareness' },
    { value: 'traffic', label: 'Traffic' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'leads', label: 'Lead Generation' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'app_install', label: 'App Install' },
    { value: 'video_views', label: 'Video Views' },
    { value: 'retargeting', label: 'Retargeting' },
    { value: 'branding', label: 'Branding' },
    { value: 'other', label: 'Khác' },
  ],
  DESIGN: [
    { value: 'post_design', label: 'Post Design' },
    { value: 'banner', label: 'Banner / Ad Creative' },
    { value: 'key_visual', label: 'Key Visual' },
    { value: 'motion_graphics', label: 'Motion Graphics' },
    { value: 'video_production', label: 'Video Production' },
    { value: 'brand_guidelines', label: 'Brand Guidelines' },
    { value: 'print_material', label: 'Print Material' },
    { value: 'ui_design', label: 'UI / Landing Page' },
    { value: 'other', label: 'Khác' },
  ],
  CONTENT: [
    { value: 'social_post', label: 'Social Post' },
    { value: 'blog_article', label: 'Blog / SEO Article' },
    { value: 'ad_copy', label: 'Ad Copy' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'video_script', label: 'Video Script' },
    { value: 'pr_article', label: 'PR Article' },
    { value: 'story_script', label: 'Story / Reels Script' },
    { value: 'other', label: 'Khác' },
  ],
};

export const CAMPAIGN_OBJECTIVES_BY_TYPE: Record<MediaPlanType, readonly { value: string; label: string }[]> = {
  ADS: [
    { value: 'brand_awareness', label: 'Nhận diện thương hiệu' },
    { value: 'reach', label: 'Tiếp cận' },
    { value: 'traffic', label: 'Tăng traffic' },
    { value: 'engagement', label: 'Tương tác' },
    { value: 'leads', label: 'Thu thập leads' },
    { value: 'sales', label: 'Bán hàng' },
    { value: 'app_promotion', label: 'Quảng bá ứng dụng' },
    { value: 'other', label: 'Khác' },
  ],
  DESIGN: [
    { value: 'quantity', label: 'Số lượng sản phẩm' },
    { value: 'brand_refresh', label: 'Làm mới thương hiệu' },
    { value: 'campaign_assets', label: 'Tài liệu chiến dịch' },
    { value: 'other', label: 'Khác' },
  ],
  CONTENT: [
    { value: 'quantity', label: 'Số lượng bài viết' },
    { value: 'seo_ranking', label: 'SEO Ranking' },
    { value: 'engagement', label: 'Tương tác' },
    { value: 'conversion', label: 'Chuyển đổi' },
    { value: 'other', label: 'Khác' },
  ],
};

// --- Type-specific metric field config ---
// Reuses the same DB columns (targetReach..targetROAS) with contextual labels per plan type

export interface MetricFieldConfig {
  key: keyof Pick<MediaPlanItem, 'targetReach' | 'targetClicks' | 'targetLeads' | 'targetCPL' | 'targetCPC' | 'targetROAS'>;
  label: string;
  /** Column header (shorter) */
  shortLabel: string;
  placeholder?: string;
  step?: number;
  /** If true, format as VND in tables */
  isCurrency?: boolean;
}

export const METRIC_FIELDS_BY_TYPE: Record<MediaPlanType, readonly MetricFieldConfig[]> = {
  ADS: [
    { key: 'targetReach', label: 'Target Reach', shortLabel: 'Reach', placeholder: '0' },
    { key: 'targetClicks', label: 'Target Clicks', shortLabel: 'Clicks', placeholder: '0' },
    { key: 'targetLeads', label: 'Target Leads', shortLabel: 'Leads', placeholder: '0' },
    { key: 'targetCPL', label: 'Target CPL (VND)', shortLabel: 'CPL', placeholder: '0', isCurrency: true },
    { key: 'targetCPC', label: 'Target CPC (VND)', shortLabel: 'CPC', placeholder: '0', isCurrency: true },
    { key: 'targetROAS', label: 'Target ROAS', shortLabel: 'ROAS', placeholder: '0', step: 0.1 },
  ],
  DESIGN: [
    { key: 'targetReach', label: 'Số lượng sản phẩm', shortLabel: 'SL sản phẩm', placeholder: '0' },
    { key: 'targetClicks', label: 'Số round revision', shortLabel: 'Revisions', placeholder: '2' },
    { key: 'targetLeads', label: 'Ngày hoàn thành (số ngày)', shortLabel: 'Ngày HT', placeholder: '7' },
  ],
  CONTENT: [
    { key: 'targetReach', label: 'Số lượng bài viết', shortLabel: 'SL bài', placeholder: '0' },
    { key: 'targetClicks', label: 'Target Views', shortLabel: 'Views', placeholder: '0' },
    { key: 'targetLeads', label: 'Target Engagement', shortLabel: 'Engagement', placeholder: '0' },
    { key: 'targetCPL', label: 'Tần suất đăng (bài/tuần)', shortLabel: 'Tần suất', placeholder: '3', step: 1 },
  ],
};

// Legacy - kept for backward compatibility with existing code
export const MEDIA_CHANNELS = MEDIA_CHANNELS_BY_TYPE.ADS;
export const CAMPAIGN_TYPES = CAMPAIGN_TYPES_BY_TYPE.ADS;
export const CAMPAIGN_OBJECTIVES = CAMPAIGN_OBJECTIVES_BY_TYPE.ADS;

export const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
] as const;

// VND formatter
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} triệu`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return formatVND(amount);
}
