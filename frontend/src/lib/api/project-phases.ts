import { api } from './index';

export interface ProjectPhaseItem {
  id: string;
  phaseId: string;
  name: string;
  description: string | null;
  weight: number;
  isComplete: boolean;
  taskId: string | null;
  task: { id: string; title: string; status: string } | null;
  orderIndex: number;
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

  addItem: async (
    projectId: string,
    phaseId: string,
    data: { name: string; description?: string; weight?: number },
  ): Promise<ProjectPhaseItem> => {
    const res = await api.post(`/projects/${projectId}/phases/${phaseId}/items`, data);
    return res.data;
  },

  updateItem: async (
    projectId: string,
    phaseId: string,
    itemId: string,
    data: { name?: string; description?: string; weight?: number; isComplete?: boolean },
  ): Promise<ProjectPhaseItem> => {
    const res = await api.patch(
      `/projects/${projectId}/phases/${phaseId}/items/${itemId}`,
      data,
    );
    return res.data;
  },

  deleteItem: async (
    projectId: string,
    phaseId: string,
    itemId: string,
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/phases/${phaseId}/items/${itemId}`);
  },

  linkTask: async (
    projectId: string,
    phaseId: string,
    itemId: string,
    taskId: string | null,
  ): Promise<ProjectPhaseItem> => {
    const res = await api.patch(
      `/projects/${projectId}/phases/${phaseId}/items/${itemId}/link-task`,
      { taskId },
    );
    return res.data;
  },
};
