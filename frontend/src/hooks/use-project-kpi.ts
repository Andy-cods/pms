import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  kpiApi,
  type ProjectKPI,
  type CreateKpiInput,
  type UpdateKpiInput,
} from '@/lib/api/kpi';

// Query Keys
export const kpiKeys = {
  all: ['kpis'] as const,
  list: (projectId: string) => [...kpiKeys.all, projectId] as const,
};

// List project KPIs
export function useProjectKpis(projectId: string) {
  return useQuery<ProjectKPI[]>({
    queryKey: kpiKeys.list(projectId),
    queryFn: () => kpiApi.list(projectId),
    enabled: !!projectId,
  });
}

// Create KPI
export function useCreateKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: CreateKpiInput;
    }) => kpiApi.create(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: kpiKeys.list(variables.projectId),
      });
    },
  });
}

// Update KPI
export function useUpdateKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      kpiId,
      input,
    }: {
      projectId: string;
      kpiId: string;
      input: UpdateKpiInput;
    }) => kpiApi.update(projectId, kpiId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: kpiKeys.list(variables.projectId),
      });
    },
  });
}

// Delete KPI
export function useDeleteKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      kpiId,
    }: {
      projectId: string;
      kpiId: string;
    }) => kpiApi.delete(projectId, kpiId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: kpiKeys.list(variables.projectId),
      });
    },
  });
}
