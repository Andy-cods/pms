import { api } from './index';

// Enums
export type FileCategory =
  | 'BRIEF'
  | 'PLAN'
  | 'PROPOSAL'
  | 'REPORT'
  | 'CREATIVE'
  | 'RAW_DATA'
  | 'CONTRACT'
  | 'OTHER';

export const FileCategoryLabels: Record<FileCategory, string> = {
  BRIEF: 'Tóm tắt',
  PLAN: 'Kế hoạch',
  PROPOSAL: 'Đề xuất',
  REPORT: 'Báo cáo',
  CREATIVE: 'Sáng tạo',
  RAW_DATA: 'Dữ liệu thô',
  CONTRACT: 'Hợp đồng',
  OTHER: 'Khác',
};

export const FileCategoryColors: Record<FileCategory, string> = {
  BRIEF: 'bg-blue-100 text-blue-800',
  PLAN: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-orange-100 text-orange-800',
  REPORT: 'bg-green-100 text-green-800',
  CREATIVE: 'bg-pink-100 text-pink-800',
  RAW_DATA: 'bg-gray-100 text-gray-800',
  CONTRACT: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-600',
};

// Types
export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  version: number;
  tags: string[];
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    code: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileListParams {
  projectId?: string;
  taskId?: string;
  category?: FileCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UploadFileInput {
  file: File;
  projectId: string;
  taskId?: string;
  category?: FileCategory;
  tags?: string[];
}

export interface UpdateFileInput {
  name?: string;
  category?: FileCategory;
  tags?: string[];
}

export interface PresignedUrlResponse {
  url: string;
  expiresIn: number;
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
  return '📎';
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/')
  );
}

// API
export const filesApi = {
  list: async (params?: FileListParams): Promise<FileListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.append('projectId', params.projectId);
    if (params?.taskId) searchParams.append('taskId', params.taskId);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const query = searchParams.toString();
    const response = await api.get(`/files${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<FileInfo> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  getDownloadUrl: async (id: string): Promise<PresignedUrlResponse> => {
    const response = await api.get(`/files/${id}/download`);
    return response.data;
  },

  getProjectFiles: async (projectId: string, params?: Omit<FileListParams, 'projectId'>): Promise<FileListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const query = searchParams.toString();
    const response = await api.get(`/files/project/${projectId}${query ? `?${query}` : ''}`);
    return response.data;
  },

  getTaskFiles: async (taskId: string, params?: Omit<FileListParams, 'taskId'>): Promise<FileListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const query = searchParams.toString();
    const response = await api.get(`/files/task/${taskId}${query ? `?${query}` : ''}`);
    return response.data;
  },

  upload: async (input: UploadFileInput): Promise<FileInfo> => {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('projectId', input.projectId);
    if (input.taskId) formData.append('taskId', input.taskId);
    if (input.category) formData.append('category', input.category);
    if (input.tags && input.tags.length > 0) {
      input.tags.forEach((tag) => formData.append('tags', tag));
    }

    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, input: UpdateFileInput): Promise<FileInfo> => {
    const response = await api.patch(`/files/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },

  // Helper: Download file
  downloadFile: async (id: string, filename: string): Promise<void> => {
    const { url } = await filesApi.getDownloadUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
