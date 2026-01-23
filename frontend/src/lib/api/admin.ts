import { api } from './index';

export interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  accessCode: string;
  isActive: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateClientInput {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export const settingsApi = {
  getAll: async (): Promise<{ settings: SystemSetting[] }> => {
    const response = await api.get('/settings');
    return response.data;
  },

  get: async (key: string): Promise<SystemSetting | null> => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  update: async (key: string, value: Record<string, unknown>): Promise<SystemSetting> => {
    const response = await api.put(`/settings/${key}`, { key, value });
    return response.data;
  },
};

export const clientsApi = {
  list: async (params?: { search?: string; isActive?: boolean }): Promise<{ clients: Client[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    const query = searchParams.toString();
    const response = await api.get(`/admin/clients${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get(`/admin/clients/${id}`);
    return response.data;
  },

  create: async (input: CreateClientInput): Promise<Client> => {
    const response = await api.post('/admin/clients', input);
    return response.data;
  },

  update: async (id: string, input: UpdateClientInput): Promise<Client> => {
    const response = await api.patch(`/admin/clients/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/clients/${id}`);
  },

  regenerateCode: async (id: string): Promise<Client> => {
    const response = await api.post(`/admin/clients/${id}/regenerate-code`);
    return response.data;
  },
};
