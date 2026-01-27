import { api } from './index';

// Types
export interface StageHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  fromProgress: number;
  toProgress: number;
  changedBy: {
    id: string;
    name: string;
  };
  reason: string | null;
  createdAt: string;
}

// API Functions
export const stageHistoryApi = {
  list: async (projectId: string): Promise<StageHistoryEntry[]> => {
    const response = await api.get(`/projects/${projectId}/stage-history`);
    return response.data;
  },
};
