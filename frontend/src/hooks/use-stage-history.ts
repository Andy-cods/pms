import { useQuery } from '@tanstack/react-query';
import { stageHistoryApi, type StageHistoryEntry } from '@/lib/api/stage-history';
import { projectKeys } from './use-projects';

// Query Keys
export const stageHistoryKeys = {
  all: ['stageHistory'] as const,
  list: (projectId: string) => [...projectKeys.detail(projectId), 'stageHistory'] as const,
};

// List stage history
export function useStageHistory(projectId: string) {
  return useQuery<StageHistoryEntry[]>({
    queryKey: stageHistoryKeys.list(projectId),
    queryFn: () => stageHistoryApi.list(projectId),
    enabled: !!projectId,
  });
}
