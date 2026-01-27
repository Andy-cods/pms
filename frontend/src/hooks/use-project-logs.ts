import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  logApi,
  type ProjectLog,
  type CreateLogInput,
  type UpdateLogInput,
} from '@/lib/api/log';

// Query Keys
export const logKeys = {
  all: ['logs'] as const,
  list: (projectId: string) => [...logKeys.all, projectId] as const,
};

// List project logs
export function useProjectLogs(projectId: string) {
  return useQuery<ProjectLog[]>({
    queryKey: logKeys.list(projectId),
    queryFn: () => logApi.list(projectId),
    enabled: !!projectId,
  });
}

// Create log
export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: CreateLogInput;
    }) => logApi.create(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: logKeys.list(variables.projectId),
      });
    },
  });
}

// Update log
export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      logId,
      input,
    }: {
      projectId: string;
      logId: string;
      input: UpdateLogInput;
    }) => logApi.update(projectId, logId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: logKeys.list(variables.projectId),
      });
    },
  });
}

// Delete log
export function useDeleteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      logId,
    }: {
      projectId: string;
      logId: string;
    }) => logApi.delete(projectId, logId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: logKeys.list(variables.projectId),
      });
    },
  });
}
