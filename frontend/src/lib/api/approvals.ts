import { api } from './index';

// Enums
export type ApprovalType = 'PLAN' | 'CONTENT' | 'BUDGET' | 'FILE';
export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

// Types
export interface ApprovalHistoryItem {
  id: string;
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  comment: string | null;
  changedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  changedAt: string;
}

export interface ApprovalFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface Approval {
  id: string;
  projectId: string;
  project: {
    id: string;
    code: string;
    name: string;
  };
  type: ApprovalType;
  status: ApprovalStatus;
  title: string;
  description: string | null;
  comment: string | null;
  deadline: string | null;
  escalationLevel: number;
  escalatedAt: string | null;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  approvedBy: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  files: ApprovalFile[];
  history: ApprovalHistoryItem[];
  submittedAt: string;
  respondedAt: string | null;
}

export interface ApprovalListResponse {
  approvals: Approval[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApprovalListParams {
  projectId?: string;
  status?: ApprovalStatus;
  type?: ApprovalType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  changesRequested: number;
}

export interface CreateApprovalInput {
  projectId: string;
  type: ApprovalType;
  title: string;
  description?: string;
  deadline?: string;
  fileIds?: string[];
}

export interface UpdateApprovalInput {
  title?: string;
  description?: string;
  deadline?: string;
  fileIds?: string[];
}

export interface ApproveApprovalInput {
  comment?: string;
}

export interface RejectApprovalInput {
  comment: string;
}

export interface RequestChangesInput {
  comment: string;
}

// API Functions
export const approvalsApi = {
  // List approvals with filters
  list: async (params?: ApprovalListParams): Promise<ApprovalListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.append('projectId', params.projectId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await api.get(`/approvals${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Get pending approvals (for approvers)
  getPending: async (): Promise<Approval[]> => {
    const response = await api.get('/approvals/pending');
    return response.data;
  },

  // Get approval stats
  getStats: async (): Promise<ApprovalStats> => {
    const response = await api.get('/approvals/stats');
    return response.data;
  },

  // Get single approval with history
  getById: async (id: string): Promise<Approval> => {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  },

  // Submit for approval
  create: async (input: CreateApprovalInput): Promise<Approval> => {
    const response = await api.post('/approvals', input);
    return response.data;
  },

  // Update/resubmit approval
  update: async (id: string, input: UpdateApprovalInput): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}`, input);
    return response.data;
  },

  // Approve
  approve: async (id: string, input?: ApproveApprovalInput): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}/approve`, input || {});
    return response.data;
  },

  // Reject
  reject: async (id: string, input: RejectApprovalInput): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}/reject`, input);
    return response.data;
  },

  // Request changes
  requestChanges: async (
    id: string,
    input: RequestChangesInput
  ): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}/request-changes`, input);
    return response.data;
  },
};

// Status colors for UI (Tailwind classes)
export const ApprovalStatusColors: Record<ApprovalStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CHANGES_REQUESTED:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export const ApprovalStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
};

export const ApprovalTypeLabels: Record<ApprovalType, string> = {
  PLAN: 'Plan',
  CONTENT: 'Content',
  BUDGET: 'Budget',
  FILE: 'File',
};

export const ApprovalTypeColors: Record<ApprovalType, string> = {
  PLAN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONTENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  BUDGET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  FILE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

// Escalation level labels
export const EscalationLevelLabels: Record<number, string> = {
  0: 'Normal',
  1: 'Reminder Sent',
  2: 'Escalated to PM',
  3: 'Escalated to Admin',
};

export const EscalationLevelColors: Record<number, string> = {
  0: '',
  1: 'text-yellow-600',
  2: 'text-orange-600',
  3: 'text-red-600',
};
