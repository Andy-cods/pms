import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminUsersApi,
  type AdminUser,
  type CreateUserInput,
  type UpdateUserInput,
  type UserListResponse,
  type ResetPasswordResponse,
  type ListUsersParams,
} from '@/lib/api/admin-users';
import { toast } from 'sonner';

// List users with optional filters
export function useAdminUsers(params?: ListUsersParams) {
  return useQuery<UserListResponse>({
    queryKey: ['admin-users', params],
    queryFn: () => adminUsersApi.list(params),
  });
}

// Get single user by ID
export function useAdminUser(id: string) {
  return useQuery<AdminUser>({
    queryKey: ['admin-user', id],
    queryFn: () => adminUsersApi.get(id),
    enabled: !!id,
  });
}

// Create user mutation
export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => adminUsersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Người dùng đã được tạo');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Không thể tạo người dùng';
      toast.error(message);
    },
  });
}

// Update user mutation
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      adminUsersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Người dùng đã được cập nhật');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Không thể cập nhật người dùng';
      toast.error(message);
    },
  });
}

// Deactivate user mutation
export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Người dùng đã bị vô hiệu hóa');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Không thể vô hiệu hóa người dùng';
      toast.error(message);
    },
  });
}

// Reset password mutation
export function useResetAdminUserPassword() {
  const queryClient = useQueryClient();

  return useMutation<ResetPasswordResponse, Error & { response?: { data?: { message?: string } } }, string>({
    mutationFn: (id: string) => adminUsersApi.resetPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Không thể đặt lại mật khẩu';
      toast.error(message);
    },
  });
}
