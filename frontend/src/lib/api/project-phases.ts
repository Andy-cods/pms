import { api } from './index';

export interface ProjectPhaseItem {
  id: string;
  phaseId: string;
  name: string;
  description: string | null;
  weight: number;
  isComplete: boolean;
  tasks: { id: string; title: string; status: string }[];
  orderIndex: number;
  pic: string | null;
  support: string | null;
  expectedOutput: string | null;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseType: 'KHOI_TAO_PLAN' | 'SETUP_CHUAN_BI' | 'VAN_HANH_TOI_UU' | 'TONG_KET';
  name: string;
  weight: number;
  progress: number;
  orderIndex: number;
  startDate: string | null;
  endDate: string | null;
  items: ProjectPhaseItem[];
}

export const projectPhasesApi = {
  getPhases: async (projectId: string): Promise<ProjectPhase[]> => {
    const res = await api.get(`/projects/${projectId}/phases`);
    return res.data;
  },

  updatePhase: async (
    projectId: string,
    phaseId: string,
    data: { startDate?: string; endDate?: string },
  ): Promise<ProjectPhase> => {
    const res = await api.patch(`/projects/${projectId}/phases/${phaseId}`, data);
    return res.data;
  },

  updateItem: async (
    projectId: string,
    phaseId: string,
    itemId: string,
    data: { name?: string; description?: string; weight?: number; isComplete?: boolean; pic?: string; support?: string; expectedOutput?: string },
  ): Promise<ProjectPhaseItem> => {
    const res = await api.patch(
      `/projects/${projectId}/phases/${phaseId}/items/${itemId}`,
      data,
    );
    return res.data;
  },

  linkTask: async (
    projectId: string,
    phaseId: string,
    itemId: string,
    taskId: string,
    action: 'connect' | 'disconnect' = 'connect',
  ): Promise<ProjectPhaseItem> => {
    const res = await api.patch(
      `/projects/${projectId}/phases/${phaseId}/items/${itemId}/link-task`,
      { taskId, action },
    );
    return res.data;
  },
};
