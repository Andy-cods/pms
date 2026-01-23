import { api } from './index';

export interface ClientProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export interface ClientTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: {
    id: string;
    name: string;
  } | null;
}

export interface ClientFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface ClientProjectDetail extends ClientProject {
  tasks: ClientTask[];
  files: ClientFile[];
}

export interface ClientProjectListResponse {
  projects: ClientProject[];
  total: number;
}

export interface ClientProgress {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  recentActivity: {
    type: string;
    description: string;
    date: string;
  }[];
}

export const clientProjectsApi = {
  list: async (params?: { status?: string; search?: string }): Promise<ClientProjectListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString();
    const response = await api.get(`/client/projects${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<ClientProjectDetail> => {
    const response = await api.get(`/client/projects/${id}`);
    return response.data;
  },

  getFiles: async (id: string): Promise<ClientFile[]> => {
    const response = await api.get(`/client/projects/${id}/files`);
    return response.data;
  },

  getProgress: async (id: string): Promise<ClientProgress> => {
    const response = await api.get(`/client/projects/${id}/progress`);
    return response.data;
  },
};
