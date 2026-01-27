import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  budgetApi,
  type ProjectBudget,
  type UpsertBudgetInput,
} from '@/lib/api/budget';
import { projectKeys } from './use-projects';

// Query Keys
export const budgetKeys = {
  all: ['budgets'] as const,
  detail: (projectId: string) => [...budgetKeys.all, projectId] as const,
};

// Get project budget
export function useProjectBudget(projectId: string) {
  return useQuery<ProjectBudget | null>({
    queryKey: budgetKeys.detail(projectId),
    queryFn: () => budgetApi.get(projectId),
    enabled: !!projectId,
  });
}

// Upsert budget (create or update)
export function useUpsertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: UpsertBudgetInput;
    }) => budgetApi.upsert(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

// Update budget
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: Partial<UpsertBudgetInput>;
    }) => budgetApi.update(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(variables.projectId),
      });
    },
  });
}

// Delete budget
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => budgetApi.delete(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(projectId),
      });
    },
  });
}
