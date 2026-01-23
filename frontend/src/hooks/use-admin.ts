import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  clientsApi,
  auditLogsApi,
  type SystemSetting,
  type SystemSettings,
  type UpdateSystemSettingsInput,
  type Client,
  type CreateClientInput,
  type UpdateClientInput,
  type AuditLog,
  type AuditLogsResponse,
  type AuditLogsQueryParams,
} from '@/lib/api/admin';
import { toast } from 'sonner';

// Settings Hooks
export function useSettings() {
  return useQuery<{ settings: SystemSetting[] }>({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
  });
}

export function useSetting(key: string) {
  return useQuery<SystemSetting | null>({
    queryKey: ['setting', key],
    queryFn: () => settingsApi.get(key),
    enabled: !!key,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      settingsApi.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Cài đặt đã được cập nhật');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt');
    },
  });
}

// Enhanced System Settings Hooks
export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ['systemSettings'],
    queryFn: () => settingsApi.getSystemSettings(),
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSystemSettingsInput) => settingsApi.updateSystemSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Cài đặt hệ thống đã được cập nhật');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt hệ thống');
    },
  });
}

// Audit Logs Hooks
export function useAuditLogs(params?: AuditLogsQueryParams) {
  return useQuery<AuditLogsResponse>({
    queryKey: ['auditLogs', params],
    queryFn: () => auditLogsApi.list(params),
  });
}

export function useAuditLog(id: string) {
  return useQuery<AuditLog>({
    queryKey: ['auditLog', id],
    queryFn: () => auditLogsApi.getById(id),
    enabled: !!id,
  });
}

export function useAuditLogActions() {
  return useQuery<{ actions: string[] }>({
    queryKey: ['auditLogActions'],
    queryFn: () => auditLogsApi.getActions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAuditLogEntityTypes() {
  return useQuery<{ entityTypes: string[] }>({
    queryKey: ['auditLogEntityTypes'],
    queryFn: () => auditLogsApi.getEntityTypes(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Clients Hooks
export function useClients(params?: { search?: string; isActive?: boolean }) {
  return useQuery<{ clients: Client[]; total: number }>({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.list(params),
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client đã được tạo');
    },
    onError: () => {
      toast.error('Không thể tạo client');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      clientsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client đã được cập nhật');
    },
    onError: () => {
      toast.error('Không thể cập nhật client');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client đã được xóa');
    },
    onError: () => {
      toast.error('Không thể xóa client');
    },
  });
}

export function useRegenerateClientCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.regenerateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Mã truy cập đã được tạo mới');
    },
    onError: () => {
      toast.error('Không thể tạo mã truy cập mới');
    },
  });
}
