import { api } from './index';

// Enums
export type ProjectStatus = 'STABLE' | 'WARNING' | 'CRITICAL';
export type ProjectStage =
  | 'INTAKE'
  | 'DISCOVERY'
  | 'PLANNING'
  | 'UNDER_REVIEW'
  | 'PROPOSAL_PITCH'
  | 'ONGOING'
  | 'OPTIMIZATION'
  | 'COMPLETED'
  | 'CLOSED';

// Types
export interface MemberWorkload {
  projectTasks: number;
  projectTasksDone: number;
  projectTasksOverdue: number;
  totalTasks: number;
}

export interface ProjectTeamMember {
  id: string;
  userId: string;
  role: string;
  isPrimary: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  workload?: MemberWorkload;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productType: string | null;
  status: ProjectStatus;
  stage: ProjectStage;
  stageProgress: number;
  startDate: string | null;
  endDate: string | null;
  timelineProgress: number;
  driveLink: string | null;
  planLink: string | null;
  trackingLink: string | null;
  clientId: string | null;
  client: {
    id: string;
    companyName: string;
  } | null;
  team: ProjectTeamMember[];
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectListParams {
  status?: ProjectStatus;
  stage?: ProjectStage;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectInput {
  code?: string;
  name: string;
  description?: string;
  productType?: string;
  status?: ProjectStatus;
  stage?: ProjectStage;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  driveLink?: string;
  planLink?: string;
  trackingLink?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  productType?: string;
  status?: ProjectStatus;
  stage?: ProjectStage;
  stageProgress?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  driveLink?: string;
  planLink?: string;
  trackingLink?: string;
  stageChangeReason?: string;
}

export interface AddTeamMemberInput {
  userId: string;
  role: string;
  isPrimary?: boolean;
}

export interface UpdateTeamMemberInput {
  role?: string;
  isPrimary?: boolean;
}

// API Functions
export const projectsApi = {
  // List projects with filters
  list: async (params?: ProjectListParams): Promise<ProjectListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.stage) searchParams.append('stage', params.stage);
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const response = await api.get(`/projects${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Get single project
  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create project
  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await api.post('/projects', input);
    return response.data;
  },

  // Update project
  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const response = await api.patch(`/projects/${id}`, input);
    return response.data;
  },

  // Archive (soft delete) project
  archive: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Team management
  getTeam: async (id: string): Promise<ProjectTeamMember[]> => {
    const response = await api.get(`/projects/${id}/team`);
    return response.data;
  },

  addTeamMember: async (
    projectId: string,
    input: AddTeamMemberInput
  ): Promise<ProjectTeamMember> => {
    const response = await api.post(`/projects/${projectId}/team`, input);
    return response.data;
  },

  updateTeamMember: async (
    projectId: string,
    memberId: string,
    input: UpdateTeamMemberInput
  ): Promise<ProjectTeamMember> => {
    const response = await api.patch(
      `/projects/${projectId}/team/${memberId}`,
      input
    );
    return response.data;
  },

  removeTeamMember: async (
    projectId: string,
    memberId: string
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/team/${memberId}`);
  },
};

// Status colors for UI - Apple HIG inspired
export const ProjectStatusColors: Record<ProjectStatus, string> = {
  STABLE: 'bg-[#34c759]/10 text-[#34c759] dark:bg-[#30d158]/15 dark:text-[#30d158]',
  WARNING: 'bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ff9f0a]/15 dark:text-[#ffd60a]',
  CRITICAL: 'bg-[#ff3b30]/10 text-[#ff3b30] dark:bg-[#ff453a]/15 dark:text-[#ff453a]',
};

// Apple status dot colors
export const ProjectStatusDotColors: Record<ProjectStatus, string> = {
  STABLE: 'bg-[#34c759] dark:bg-[#30d158]',
  WARNING: 'bg-[#ff9f0a] dark:bg-[#ffd60a]',
  CRITICAL: 'bg-[#ff3b30] dark:bg-[#ff453a]',
};

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  STABLE: 'On Track',
  WARNING: 'At Risk',
  CRITICAL: 'Critical',
};

export const ProjectStageLabels: Record<ProjectStage, string> = {
  INTAKE: 'Intake',
  DISCOVERY: 'Discovery',
  PLANNING: 'Planning',
  UNDER_REVIEW: 'Under Review',
  PROPOSAL_PITCH: 'Proposal/Pitch',
  ONGOING: 'Ongoing',
  OPTIMIZATION: 'Optimization',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};
