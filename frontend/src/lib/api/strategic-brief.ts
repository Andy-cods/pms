import { api } from './index';

export interface BriefSection {
  id: string;
  briefId: string;
  sectionNum: number;
  sectionKey: string;
  title: string;
  data: Record<string, unknown> | null;
  isComplete: boolean;
  updatedAt: string;
}

export interface StrategicBrief {
  id: string;
  projectId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  completionPct: number;
  submittedAt: string | null;
  approvedAt: string | null;
  sections: BriefSection[];
  project?: { id: string; dealCode: string; name: string } | null;
}

export const strategicBriefApi = {
  getById: async (id: string): Promise<StrategicBrief> => {
    const res = await api.get(`/strategic-briefs/${id}`);
    return res.data;
  },

  getByProject: async (projectId: string): Promise<StrategicBrief> => {
    const res = await api.get(`/strategic-briefs/by-project/${projectId}`);
    return res.data;
  },

  create: async (input: { projectId: string }): Promise<StrategicBrief> => {
    const res = await api.post('/strategic-briefs', input);
    return res.data;
  },

  updateSection: async (
    briefId: string,
    sectionNum: number,
    payload: { data?: Record<string, unknown>; isComplete?: boolean },
  ): Promise<BriefSection> => {
    const res = await api.patch(`/strategic-briefs/${briefId}/sections/${sectionNum}`, payload);
    return res.data;
  },

  submit: async (id: string): Promise<StrategicBrief> => {
    const res = await api.post(`/strategic-briefs/${id}/submit`);
    return res.data;
  },

  approve: async (id: string): Promise<StrategicBrief> => {
    const res = await api.post(`/strategic-briefs/${id}/approve`);
    return res.data;
  },

  requestRevision: async (id: string, comment: string): Promise<StrategicBrief> => {
    const res = await api.post(`/strategic-briefs/${id}/request-revision`, { comment });
    return res.data;
  },
};
