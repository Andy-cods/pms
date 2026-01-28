import { api } from './index';

export type BudgetEventType = 'ALLOC' | 'SPEND' | 'ADJUST';
export type BudgetEventCategory = 'FIXED_AD' | 'AD_SERVICE' | 'CONTENT' | 'DESIGN' | 'MEDIA' | 'OTHER';
export type BudgetEventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export const BudgetEventCategoryLabels: Record<BudgetEventCategory, string> = {
  FIXED_AD: 'Chi phí cố định',
  AD_SERVICE: 'Dịch vụ quảng cáo',
  CONTENT: 'Content',
  DESIGN: 'Design',
  MEDIA: 'Media',
  OTHER: 'Khác',
};

export const BudgetEventStatusLabels: Record<BudgetEventStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã thanh toán',
};

export const BudgetEventTypeLabels: Record<BudgetEventType, string> = {
  ALLOC: 'Phân bổ',
  SPEND: 'Chi tiêu',
  ADJUST: 'Điều chỉnh',
};

export const CATEGORY_COLORS: Record<BudgetEventCategory, string> = {
  FIXED_AD: '#0071e3',
  AD_SERVICE: '#5856d6',
  CONTENT: '#34c759',
  DESIGN: '#af52de',
  MEDIA: '#ff9f0a',
  OTHER: '#8e8e93',
};

export interface BudgetEvent {
  id: string;
  projectId: string;
  mediaPlanId?: string | null;
  stage?: string | null;
  amount: number;
  type: BudgetEventType;
  category: BudgetEventCategory;
  status: BudgetEventStatus;
  note?: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface CreateBudgetEventInput {
  type: BudgetEventType;
  category: BudgetEventCategory;
  amount: number;
  stage?: string;
  note?: string;
  mediaPlanId?: string;
}

export interface BudgetThreshold {
  level: 'ok' | 'warning' | 'critical';
  percent: number;
}

export const budgetEventsApi = {
  list: async (projectId: string, params?: { stage?: string; category?: BudgetEventCategory; status?: BudgetEventStatus }): Promise<BudgetEvent[]> => {
    const { data } = await api.get(`/projects/${projectId}/budget-events`, { params });
    return data;
  },
  create: async (projectId: string, input: CreateBudgetEventInput): Promise<BudgetEvent> => {
    const { data } = await api.post(`/projects/${projectId}/budget-events`, input);
    return data;
  },
  updateStatus: async (projectId: string, eventId: string, status: BudgetEventStatus): Promise<BudgetEvent> => {
    const { data } = await api.patch(`/projects/${projectId}/budget-events/${eventId}/status`, { status });
    return data;
  },
  getThreshold: async (projectId: string): Promise<BudgetThreshold> => {
    const { data } = await api.get(`/projects/${projectId}/budget-events/threshold`);
    return data;
  },
};
