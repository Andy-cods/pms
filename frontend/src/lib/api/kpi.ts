import { api } from './index';

// Types
export interface ProjectKPI {
  id: string;
  projectId: string;
  kpiType: string;
  targetValue: number | null;
  actualValue: number | null;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiInput {
  kpiType: string;
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateKpiInput {
  kpiType?: string;
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}

// API Functions
export const kpiApi = {
  list: async (projectId: string): Promise<ProjectKPI[]> => {
    const response = await api.get(`/projects/${projectId}/kpis`);
    return response.data;
  },

  create: async (
    projectId: string,
    input: CreateKpiInput
  ): Promise<ProjectKPI> => {
    const response = await api.post(`/projects/${projectId}/kpis`, input);
    return response.data;
  },

  update: async (
    projectId: string,
    kpiId: string,
    input: UpdateKpiInput
  ): Promise<ProjectKPI> => {
    const response = await api.patch(
      `/projects/${projectId}/kpis/${kpiId}`,
      input
    );
    return response.data;
  },

  delete: async (projectId: string, kpiId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/kpis/${kpiId}`);
  },
};

// Predefined KPI types for agency projects
export const KpiTypeOptions = [
  { value: 'REACH', label: 'Reach', unit: 'impressions' },
  { value: 'ENGAGEMENT_RATE', label: 'Engagement Rate', unit: '%' },
  { value: 'CTR', label: 'CTR', unit: '%' },
  { value: 'CPC', label: 'CPC', unit: 'VND' },
  { value: 'CPM', label: 'CPM', unit: 'VND' },
  { value: 'ROAS', label: 'ROAS', unit: 'x' },
  { value: 'CONVERSION_RATE', label: 'Conversion Rate', unit: '%' },
  { value: 'LEADS', label: 'Leads', unit: 'leads' },
  { value: 'REVENUE', label: 'Revenue', unit: 'VND' },
  { value: 'FOLLOWERS', label: 'Followers', unit: 'followers' },
  { value: 'VIDEO_VIEWS', label: 'Video Views', unit: 'views' },
  { value: 'CONTENT_PUBLISHED', label: 'Content Published', unit: 'posts' },
  { value: 'CUSTOM', label: 'Custom', unit: '' },
];

export const KpiTypeLabels: Record<string, string> = Object.fromEntries(
  KpiTypeOptions.map((opt) => [opt.value, opt.label])
);
