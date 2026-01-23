import { api } from './index';

export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const filesApi = {
  list: async (projectId?: string, taskId?: string): Promise<FileInfo[]> => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (taskId) params.append('taskId', taskId);
    const query = params.toString();
    const response = await api.get(`/files${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<FileInfo> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};
