import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectPhasesApi, type ProjectPhase } from '@/lib/api/project-phases';
import { projectKeys } from './use-projects';

export const phaseKeys = {
  all: ['project-phases'] as const,
  list: (projectId: string) => [...phaseKeys.all, projectId] as const,
};

export function useProjectPhases(projectId: string) {
  return useQuery<ProjectPhase[]>({
    queryKey: phaseKeys.list(projectId),
    queryFn: () => projectPhasesApi.getPhases(projectId),
    enabled: !!projectId,
  });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      phaseId,
      data,
    }: {
      projectId: string;
      phaseId: string;
      data: { startDate?: string; endDate?: string };
    }) => projectPhasesApi.updatePhase(projectId, phaseId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: phaseKeys.list(vars.projectId) });
    },
  });
}

export function useUpdatePhaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      phaseId,
      itemId,
      data,
    }: {
      projectId: string;
      phaseId: string;
      itemId: string;
      data: { name?: string; description?: string; weight?: number; isComplete?: boolean; pic?: string; support?: string; expectedOutput?: string };
    }) => projectPhasesApi.updateItem(projectId, phaseId, itemId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: phaseKeys.list(vars.projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}

export function useLinkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      phaseId,
      itemId,
      taskId,
      action = 'connect',
    }: {
      projectId: string;
      phaseId: string;
      itemId: string;
      taskId: string;
      action?: 'connect' | 'disconnect';
    }) => projectPhasesApi.linkTask(projectId, phaseId, itemId, taskId, action),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: phaseKeys.list(vars.projectId) });
    },
  });
}
