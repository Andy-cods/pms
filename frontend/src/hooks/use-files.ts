'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  filesApi,
  type FileInfo,
  type FileListResponse,
  type FileListParams,
  type UploadFileInput,
  type UpdateFileInput,
} from '@/lib/api/files';

// Query keys factory
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (params?: FileListParams) => [...fileKeys.lists(), params] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
  projectFiles: (projectId: string) => [...fileKeys.all, 'project', projectId] as const,
  taskFiles: (taskId: string) => [...fileKeys.all, 'task', taskId] as const,
};

// List files
export function useFiles(params?: FileListParams) {
  return useQuery<FileListResponse>({
    queryKey: fileKeys.list(params),
    queryFn: () => filesApi.list(params),
  });
}

// Get single file
export function useFile(id: string) {
  return useQuery<FileInfo>({
    queryKey: fileKeys.detail(id),
    queryFn: () => filesApi.getById(id),
    enabled: !!id,
  });
}

// Get project files
export function useProjectFiles(
  projectId: string,
  params?: Omit<FileListParams, 'projectId'>
) {
  return useQuery<FileListResponse>({
    queryKey: [...fileKeys.projectFiles(projectId), params],
    queryFn: () => filesApi.getProjectFiles(projectId, params),
    enabled: !!projectId,
  });
}

// Get task files
export function useTaskFiles(
  taskId: string,
  params?: Omit<FileListParams, 'taskId'>
) {
  return useQuery<FileListResponse>({
    queryKey: [...fileKeys.taskFiles(taskId), params],
    queryFn: () => filesApi.getTaskFiles(taskId, params),
    enabled: !!taskId,
  });
}

// Upload file
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadFileInput) => filesApi.upload(input),
    onSuccess: (file) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
      if (file.project?.id) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.projectFiles(file.project.id),
        });
      }
      if (file.task?.id) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.taskFiles(file.task.id),
        });
      }
      toast.success('Tải tệp lên thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Tải tệp thất bại');
    },
  });
}

// Update file
export function useUpdateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFileInput }) =>
      filesApi.update(id, input),
    onSuccess: (file) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fileKeys.detail(file.id) });
      if (file.project?.id) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.projectFiles(file.project.id),
        });
      }
      toast.success('Cập nhật tệp thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Cập nhật tệp thất bại');
    },
  });
}

// Delete file
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
      toast.success('Đã xóa tệp');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Xóa tệp thất bại');
    },
  });
}

// Download file helper hook
export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      filesApi.downloadFile(id, filename),
    onError: (error: Error) => {
      toast.error(error.message || 'Tải tệp xuống thất bại');
    },
  });
}
