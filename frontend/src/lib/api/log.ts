import { api } from './index';

// Types
export interface ProjectLog {
  id: string;
  projectId: string;
  logDate: string;
  rootCause: string | null;
  action: string | null;
  nextAction: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateLogInput {
  logDate: string;
  rootCause?: string;
  action?: string;
  nextAction?: string;
  notes?: string;
}

export interface UpdateLogInput {
  logDate?: string;
  rootCause?: string;
  action?: string;
  nextAction?: string;
  notes?: string;
}

// API Functions
export const logApi = {
  list: async (projectId: string, limit?: number): Promise<ProjectLog[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/projects/${projectId}/logs${params}`);
    return response.data;
  },

  create: async (
    projectId: string,
    input: CreateLogInput
  ): Promise<ProjectLog> => {
    const response = await api.post(`/projects/${projectId}/logs`, input);
    return response.data;
  },

  update: async (
    projectId: string,
    logId: string,
    input: UpdateLogInput
  ): Promise<ProjectLog> => {
    const response = await api.patch(
      `/projects/${projectId}/logs/${logId}`,
      input
    );
    return response.data;
  },

  delete: async (projectId: string, logId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/logs/${logId}`);
  },
};
