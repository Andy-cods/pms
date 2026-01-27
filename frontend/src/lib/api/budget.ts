import { api } from './index';

// Types
export interface ProjectBudget {
  id: string;
  projectId: string;
  totalBudget: number;
  monthlyBudget: number | null;
  spentAmount: number;
  fixedAdFee: number | null;
  adServiceFee: number | null;
  contentFee: number | null;
  designFee: number | null;
  mediaFee: number | null;
  otherFee: number | null;
  budgetPacing: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertBudgetInput {
  totalBudget: number;
  monthlyBudget?: number;
  spentAmount?: number;
  fixedAdFee?: number;
  adServiceFee?: number;
  contentFee?: number;
  designFee?: number;
  mediaFee?: number;
  otherFee?: number;
  budgetPacing?: number;
}

// API Functions
export const budgetApi = {
  get: async (projectId: string): Promise<ProjectBudget | null> => {
    const response = await api.get(`/projects/${projectId}/budget`);
    return response.data;
  },

  upsert: async (
    projectId: string,
    input: UpsertBudgetInput
  ): Promise<ProjectBudget> => {
    const response = await api.post(`/projects/${projectId}/budget`, input);
    return response.data;
  },

  update: async (
    projectId: string,
    input: Partial<UpsertBudgetInput>
  ): Promise<ProjectBudget> => {
    const response = await api.patch(`/projects/${projectId}/budget`, input);
    return response.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/budget`);
  },
};

// Fee labels for UI
export const FeeLabels: Record<string, string> = {
  fixedAdFee: 'Phí quảng cáo cố định',
  adServiceFee: 'Phí dịch vụ quảng cáo',
  contentFee: 'Phí content',
  designFee: 'Phí thiết kế',
  mediaFee: 'Phí media',
  otherFee: 'Phí khác',
};

// Format currency in VND
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format compact currency
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toString();
}
