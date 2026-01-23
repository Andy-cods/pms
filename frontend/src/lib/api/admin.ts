import { api } from './index';

export interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

// Enhanced System Settings
export interface NotificationDefaults {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  taskAssignment: boolean;
  taskDueReminder: boolean;
  approvalRequest: boolean;
  projectUpdate: boolean;
  commentMention: boolean;
}

export interface SystemSettings {
  companyName: string;
  companyLogo: string | null;
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  defaultNotifications: NotificationDefaults;
}

export interface UpdateSystemSettingsInput {
  companyName?: string;
  companyLogo?: string | null;
  emailEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  telegramEnabled?: boolean;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  defaultNotifications?: Partial<NotificationDefaults>;
}

// Audit Log Types
export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user: AuditLogUser | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogsQueryParams {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
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

  // Enhanced system settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/settings/system');
    return response.data;
  },

  updateSystemSettings: async (input: UpdateSystemSettingsInput): Promise<SystemSettings> => {
    const response = await api.patch('/settings/system', input);
    return response.data;
  },
};

export const auditLogsApi = {
  list: async (params?: AuditLogsQueryParams): Promise<AuditLogsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.entityType) searchParams.append('entityType', params.entityType);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await api.get(`/admin/audit-logs${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get(`/admin/audit-logs/${id}`);
    return response.data;
  },

  getActions: async (): Promise<{ actions: string[] }> => {
    const response = await api.get('/admin/audit-logs/actions');
    return response.data;
  },

  getEntityTypes: async (): Promise<{ entityTypes: string[] }> => {
    const response = await api.get('/admin/audit-logs/entity-types');
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
