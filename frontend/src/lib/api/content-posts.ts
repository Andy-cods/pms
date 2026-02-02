import { api } from "./index";

// ============================================
// Types
// ============================================

export type ContentPostStatus =
  | "IDEA"
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "CANCELLED";

export interface ContentPostRevision {
  id: string;
  title: string;
  content: string | null;
  revisionNote: string | null;
  revisedById: string;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  mediaPlanItemId: string;
  title: string;
  content: string | null;
  postType: string;
  status: ContentPostStatus;
  scheduledDate: string | null;
  publishedDate: string | null;
  postUrl: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  notes: string | null;
  orderIndex: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  revisions: ContentPostRevision[];
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPostListResponse {
  data: ContentPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContentPostListParams {
  status?: ContentPostStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateContentPostInput {
  title: string;
  content?: string;
  postType: string;
  scheduledDate?: string;
  assigneeId?: string;
  notes?: string;
}

export interface UpdateContentPostInput {
  title?: string;
  content?: string | null;
  postType?: string;
  scheduledDate?: string | null;
  publishedDate?: string | null;
  postUrl?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
}

export interface ChangeStatusInput {
  status: ContentPostStatus;
  revisionNote?: string;
}

export interface DuplicatePostInput {
  targetItemId: string;
}

export interface ReorderPostsInput {
  postIds: string[];
}

// ============================================
// Status Labels (Vietnamese)
// ============================================

export const STATUS_LABELS: Record<ContentPostStatus, string> = {
  IDEA: "Y tuong",
  DRAFT: "Ban nhap",
  REVIEW: "Cho duyet",
  APPROVED: "Da duyet",
  REVISION_REQUESTED: "Yeu cau sua",
  SCHEDULED: "Da len lich",
  PUBLISHED: "Da dang",
  CANCELLED: "Da huy",
};

export const STATUS_COLORS: Record<ContentPostStatus, string> = {
  IDEA: "bg-gray-100 text-gray-700",
  DRAFT: "bg-blue-100 text-blue-700",
  REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const STATUS_DOT_COLORS: Record<ContentPostStatus, string> = {
  IDEA: "bg-gray-400",
  DRAFT: "bg-blue-400",
  REVIEW: "bg-yellow-400",
  APPROVED: "bg-green-400",
  REVISION_REQUESTED: "bg-orange-400",
  SCHEDULED: "bg-purple-400",
  PUBLISHED: "bg-emerald-500",
  CANCELLED: "bg-red-400",
};

// Valid status transitions
export const STATUS_TRANSITIONS: Record<
  ContentPostStatus,
  ContentPostStatus[]
> = {
  IDEA: ["DRAFT"],
  DRAFT: ["REVIEW", "CANCELLED"],
  REVIEW: ["APPROVED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["DRAFT"],
  APPROVED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: [],
  CANCELLED: ["DRAFT"],
};

// Post type options per channel type
export const POST_TYPE_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  facebook: [
    { value: "image_post", label: "Bai hinh anh" },
    { value: "carousel", label: "Carousel" },
    { value: "video", label: "Video" },
    { value: "reel", label: "Reel" },
    { value: "live_stream", label: "Live stream" },
    { value: "story", label: "Story" },
  ],
  tiktok: [
    { value: "short_video", label: "Video ngan" },
    { value: "live_stream", label: "Live stream" },
    { value: "photo_mode", label: "Che do anh" },
  ],
  instagram: [
    { value: "image_post", label: "Bai hinh anh" },
    { value: "carousel", label: "Carousel" },
    { value: "reel", label: "Reel" },
    { value: "story", label: "Story" },
  ],
  blog: [
    { value: "long_form", label: "Bai viet dai" },
    { value: "listicle", label: "Listicle" },
    { value: "tutorial", label: "Huong dan" },
    { value: "case_study", label: "Case study" },
    { value: "news", label: "Tin tuc" },
  ],
  email: [
    { value: "newsletter", label: "Newsletter" },
    { value: "promo", label: "Email khuyen mai" },
    { value: "drip", label: "Drip campaign" },
  ],
  pr: [
    { value: "pr_article", label: "Bai PR" },
    { value: "press_release", label: "Thong cao bao chi" },
  ],
  ads_copy: [
    { value: "ad_copy", label: "Ad copy" },
    { value: "landing_page", label: "Landing page copy" },
  ],
};

// Fallback for unknown channels
export const DEFAULT_POST_TYPES = [
  { value: "article", label: "Bai viet" },
  { value: "image", label: "Hinh anh" },
  { value: "video", label: "Video" },
];

// ============================================
// API Functions
// ============================================

function basePath(projectId: string, planId: string, itemId: string) {
  return `/projects/${projectId}/media-plans/${planId}/items/${itemId}/posts`;
}

export const contentPostsApi = {
  list: async (
    projectId: string,
    planId: string,
    itemId: string,
    params?: ContentPostListParams,
  ): Promise<ContentPostListResponse> => {
    const { data } = await api.get(basePath(projectId, planId, itemId), {
      params,
    });
    return data;
  },

  getById: async (
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
  ): Promise<ContentPost> => {
    const { data } = await api.get(
      `${basePath(projectId, planId, itemId)}/${postId}`,
    );
    return data;
  },

  create: async (
    projectId: string,
    planId: string,
    itemId: string,
    input: CreateContentPostInput,
  ): Promise<ContentPost> => {
    const { data } = await api.post(basePath(projectId, planId, itemId), input);
    return data;
  },

  update: async (
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    input: UpdateContentPostInput,
  ): Promise<ContentPost> => {
    const { data } = await api.patch(
      `${basePath(projectId, planId, itemId)}/${postId}`,
      input,
    );
    return data;
  },

  delete: async (
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
  ): Promise<void> => {
    await api.delete(`${basePath(projectId, planId, itemId)}/${postId}`);
  },

  changeStatus: async (
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    input: ChangeStatusInput,
  ): Promise<ContentPost> => {
    const { data } = await api.patch(
      `${basePath(projectId, planId, itemId)}/${postId}/status`,
      input,
    );
    return data;
  },

  duplicate: async (
    projectId: string,
    planId: string,
    itemId: string,
    postId: string,
    input: DuplicatePostInput,
  ): Promise<ContentPost> => {
    const { data } = await api.post(
      `${basePath(projectId, planId, itemId)}/${postId}/duplicate`,
      input,
    );
    return data;
  },

  reorder: async (
    projectId: string,
    planId: string,
    itemId: string,
    input: ReorderPostsInput,
  ): Promise<void> => {
    await api.patch(`${basePath(projectId, planId, itemId)}/reorder`, input);
  },
};
