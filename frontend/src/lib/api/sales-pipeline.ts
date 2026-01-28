import { api } from './index';
import type { SalesPipeline } from '@/types';

export interface PipelineListParams {
  status?: string;
  decision?: string;
  nvkdId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PipelineListResponse {
  data: SalesPipeline[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const salesPipelineApi = {
  list: async (params?: PipelineListParams): Promise<PipelineListResponse> => {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.decision) sp.append('decision', params.decision);
    if (params?.nvkdId) sp.append('nvkdId', params.nvkdId);
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.sortBy) sp.append('sortBy', params.sortBy);
    if (params?.sortOrder) sp.append('sortOrder', params.sortOrder);
    const q = sp.toString();
    const res = await api.get(`/sales-pipeline${q ? `?${q}` : ''}`);
    return res.data;
  },

  getById: async (id: string): Promise<SalesPipeline> => {
    const res = await api.get(`/sales-pipeline/${id}`);
    return res.data;
  },

  create: async (input: Record<string, unknown>): Promise<SalesPipeline> => {
    const res = await api.post('/sales-pipeline', input);
    return res.data;
  },

  updateSaleFields: async (id: string, input: Record<string, unknown>): Promise<SalesPipeline> => {
    const res = await api.patch(`/sales-pipeline/${id}/sale`, input);
    return res.data;
  },

  evaluate: async (id: string, input: Record<string, unknown>): Promise<SalesPipeline> => {
    const res = await api.patch(`/sales-pipeline/${id}/evaluate`, input);
    return res.data;
  },

  updateStage: async (id: string, stage: string): Promise<SalesPipeline> => {
    const res = await api.patch(`/sales-pipeline/${id}/stage`, { stage });
    return res.data;
  },

  addWeeklyNote: async (id: string, note: string): Promise<SalesPipeline> => {
    const res = await api.post(`/sales-pipeline/${id}/weekly-note`, { note });
    return res.data;
  },

  decide: async (id: string, decision: string, decisionNote?: string): Promise<SalesPipeline> => {
    const res = await api.post(`/sales-pipeline/${id}/decide`, { decision, decisionNote });
    return res.data;
  },
};
