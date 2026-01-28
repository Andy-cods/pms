import { api } from './index';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TECHNICAL'
  | 'NVKD'
  | 'PM'
  | 'PLANNER'
  | 'ACCOUNT'
  | 'CONTENT'
  | 'DESIGN'
  | 'MEDIA';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
}

export interface ResetPasswordResponse {
  tempPassword: string;
  message: string;
}

export interface UserWorkload {
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completionPercent: number;
  projectCount: number;
}

export interface AdminUserWithWorkload extends AdminUser {
  workload: UserWorkload;
}

export interface ListUsersParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const adminUsersApi = {
  list: async (params?: ListUsersParams): Promise<UserListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await api.get(`/admin/users${query ? `?${query}` : ''}`);
    return response.data;
  },

  get: async (id: string): Promise<AdminUser> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  create: async (input: CreateUserInput): Promise<AdminUser> => {
    const response = await api.post('/admin/users', input);
    return response.data;
  },

  update: async (id: string, input: UpdateUserInput): Promise<AdminUser> => {
    const response = await api.patch(`/admin/users/${id}`, input);
    return response.data;
  },

  deactivate: async (id: string): Promise<AdminUser> => {
    const response = await api.patch(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  resetPassword: async (id: string): Promise<ResetPasswordResponse> => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  getWorkload: async (): Promise<AdminUserWithWorkload[]> => {
    const response = await api.get('/admin/users/workload');
    return response.data;
  },
};
