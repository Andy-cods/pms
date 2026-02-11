import { api } from './index';
import {
  type Project,
  type ProjectListResponse,
  type ProjectListQuery,
  type CreateProjectInput,
  type UpdateProjectInput,
  type AddTeamMemberInput,
  type ProjectTeamMember,
  type StageHistoryEntry,
  type HealthStatus,
  ProjectLifecycle,
  ProjectPhaseGroup,
  type ProjectTab,
} from '@/types';

// Re-export types for convenience
export type {
  Project,
  ProjectListResponse,
  CreateProjectInput,
  UpdateProjectInput,
  AddTeamMemberInput,
  ProjectTeamMember,
  StageHistoryEntry,
};

export type ProjectListParams = ProjectListQuery;

export interface UpdateTeamMemberInput {
  role?: string;
  isPrimary?: boolean;
}

export interface MemberWorkload {
  projectTasks: number;
  projectTasksDone: number;
  projectTasksOverdue: number;
  totalTasks: number;
}

export interface UpdateSaleFieldsInput {
  clientType?: string;
  productType?: string;
  licenseLink?: string;
  campaignObjective?: string;
  initialGoal?: string;
  totalBudget?: number;
  monthlyBudget?: number;
  fixedAdFee?: number;
  adServiceFee?: number;
  contentFee?: number;
  designFee?: number;
  mediaFee?: number;
  otherFee?: number;
  upsellOpportunity?: string;
  clientId?: string;
}

export interface EvaluateProjectInput {
  costNSQC?: number;
  costDesign?: number;
  costMedia?: number;
  costKOL?: number;
  costOther?: number;
  marketSize?: string;
  competitionLevel?: string;
  productUSP?: string;
  audienceSize?: string;
  productLifecycle?: string;
  scalePotential?: string;
}

export interface UpdateBudgetInput {
  totalBudget?: number;
  monthlyBudget?: number;
  spentAmount?: number;
  fixedAdFee?: number;
  adServiceFee?: number;
  contentFee?: number;
  designFee?: number;
  mediaFee?: number;
  otherFee?: number;
  budgetPacing?: number;
}

// API Functions
export const projectsApi = {
  // List projects with filters
  list: async (params?: ProjectListParams): Promise<ProjectListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.healthStatus) searchParams.append('healthStatus', params.healthStatus);
    if (params?.lifecycle?.length) {
      params.lifecycle.forEach((l) => searchParams.append('lifecycle', l));
    }
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.nvkdId) searchParams.append('nvkdId', params.nvkdId);
    if (params?.decision) searchParams.append('decision', params.decision);
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

  // Create project (NVKD creates deal)
  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await api.post('/projects', input);
    return response.data;
  },

  // Update project (general)
  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const response = await api.patch(`/projects/${id}`, input);
    return response.data;
  },

  // Archive (soft delete) project
  archive: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // --- Sale fields (NVKD) ---
  updateSaleFields: async (id: string, input: UpdateSaleFieldsInput): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/sale`, input);
    return response.data;
  },

  // --- Evaluation (PM/Planner) ---
  evaluate: async (id: string, input: EvaluateProjectInput): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/evaluate`, input);
    return response.data;
  },

  // --- Lifecycle transition ---
  updateLifecycle: async (id: string, lifecycle: ProjectLifecycle, reason?: string): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/lifecycle`, { lifecycle, reason });
    return response.data;
  },

  // --- Weekly note ---
  addWeeklyNote: async (id: string, note: string): Promise<Project> => {
    const response = await api.post(`/projects/${id}/weekly-note`, { note });
    return response.data;
  },

  updateWeeklyNote: async (id: string, weekIndex: number, note: string): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/weekly-note/${weekIndex}`, { note });
    return response.data;
  },

  deleteWeeklyNote: async (id: string, weekIndex: number): Promise<Project> => {
    const response = await api.delete(`/projects/${id}/weekly-note/${weekIndex}`);
    return response.data;
  },

  // --- Decision (Accept/Decline) ---
  decide: async (id: string, decision: string, decisionNote?: string): Promise<Project> => {
    const response = await api.post(`/projects/${id}/decide`, { decision, decisionNote });
    return response.data;
  },

  // --- Stage history ---
  getStageHistory: async (id: string): Promise<StageHistoryEntry[]> => {
    const response = await api.get(`/projects/${id}/stage-history`);
    return response.data;
  },

  // --- Budget ---
  getBudget: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}/budget`);
    return response.data;
  },

  updateBudget: async (projectId: string, input: UpdateBudgetInput): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}/budget`, input);
    return response.data;
  },

  // --- Team management ---
  getTeam: async (id: string): Promise<ProjectTeamMember[]> => {
    const response = await api.get(`/projects/${id}/team`);
    return response.data;
  },

  addTeamMember: async (
    projectId: string,
    input: AddTeamMemberInput,
  ): Promise<ProjectTeamMember> => {
    const response = await api.post(`/projects/${projectId}/team`, input);
    return response.data;
  },

  updateTeamMember: async (
    projectId: string,
    memberId: string,
    input: UpdateTeamMemberInput,
  ): Promise<ProjectTeamMember> => {
    const response = await api.patch(
      `/projects/${projectId}/team/${memberId}`,
      input,
    );
    return response.data;
  },

  removeTeamMember: async (
    projectId: string,
    memberId: string,
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/team/${memberId}`);
  },
};

// Health status colors for UI - Apple HIG inspired
export const HealthStatusColors: Record<HealthStatus, string> = {
  STABLE: 'bg-[#34c759]/10 text-[#34c759] dark:bg-[#30d158]/15 dark:text-[#30d158]',
  WARNING: 'bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ff9f0a]/15 dark:text-[#ffd60a]',
  CRITICAL: 'bg-[#ff3b30]/10 text-[#ff3b30] dark:bg-[#ff453a]/15 dark:text-[#ff453a]',
};

export const HealthStatusDotColors: Record<HealthStatus, string> = {
  STABLE: 'bg-[#34c759] dark:bg-[#30d158]',
  WARNING: 'bg-[#ff9f0a] dark:bg-[#ffd60a]',
  CRITICAL: 'bg-[#ff3b30] dark:bg-[#ff453a]',
};

export const HealthStatusLabels: Record<HealthStatus, string> = {
  STABLE: 'On Track',
  WARNING: 'At Risk',
  CRITICAL: 'Critical',
};

export const ProjectLifecycleLabels: Record<ProjectLifecycle, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  EVALUATION: 'Evaluation',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
  PLANNING: 'Planning',
  ONGOING: 'Ongoing',
  OPTIMIZING: 'Optimizing',
  CLOSED: 'Closed',
};

// Lifecycle stage colors
export const ProjectLifecycleColors: Record<ProjectLifecycle, string> = {
  LEAD: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  QUALIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  EVALUATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  WON: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  PLANNING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  ONGOING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  OPTIMIZING: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  CLOSED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

// Fee labels for UI
export const FeeLabels: Record<string, string> = {
  fixedAdFee: 'Phí quảng cáo cố định',
  adServiceFee: 'Phí dịch vụ quảng cáo',
  contentFee: 'Phí content',
  designFee: 'Phí thiết kế',
  mediaFee: 'Phí media',
  otherFee: 'Phí khác',
};

// Format currency in VND
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format compact currency
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toString();
}

// Deal stages (pre-WON) for kanban
export const DEAL_STAGES: ProjectLifecycle[] = [
  ProjectLifecycle.LEAD,
  ProjectLifecycle.QUALIFIED,
  ProjectLifecycle.EVALUATION,
  ProjectLifecycle.NEGOTIATION,
  ProjectLifecycle.WON,
  ProjectLifecycle.LOST,
];

// Project stages (post-WON) for project list
export const PROJECT_STAGES: ProjectLifecycle[] = [
  ProjectLifecycle.PLANNING,
  ProjectLifecycle.ONGOING,
  ProjectLifecycle.OPTIMIZING,
  ProjectLifecycle.CLOSED,
];

// ============================================
// PHASE GROUP MAPPING & CONFIG
// ============================================

// Map each lifecycle stage → phase group
export const LIFECYCLE_TO_PHASE: Record<ProjectLifecycle, ProjectPhaseGroup> = {
  [ProjectLifecycle.LEAD]: ProjectPhaseGroup.INTAKE,
  [ProjectLifecycle.QUALIFIED]: ProjectPhaseGroup.INTAKE,
  [ProjectLifecycle.EVALUATION]: ProjectPhaseGroup.EVALUATION,
  [ProjectLifecycle.NEGOTIATION]: ProjectPhaseGroup.EVALUATION,
  [ProjectLifecycle.WON]: ProjectPhaseGroup.OPERATIONS,
  [ProjectLifecycle.PLANNING]: ProjectPhaseGroup.OPERATIONS,
  [ProjectLifecycle.ONGOING]: ProjectPhaseGroup.OPERATIONS,
  [ProjectLifecycle.OPTIMIZING]: ProjectPhaseGroup.OPERATIONS,
  [ProjectLifecycle.CLOSED]: ProjectPhaseGroup.COMPLETED,
  [ProjectLifecycle.LOST]: ProjectPhaseGroup.LOST,
};

// Lifecycle stages belonging to each phase group
export const PHASE_LIFECYCLES: Record<ProjectPhaseGroup, ProjectLifecycle[]> = {
  [ProjectPhaseGroup.INTAKE]: [ProjectLifecycle.LEAD, ProjectLifecycle.QUALIFIED],
  [ProjectPhaseGroup.EVALUATION]: [ProjectLifecycle.EVALUATION, ProjectLifecycle.NEGOTIATION],
  [ProjectPhaseGroup.OPERATIONS]: [ProjectLifecycle.WON, ProjectLifecycle.PLANNING, ProjectLifecycle.ONGOING, ProjectLifecycle.OPTIMIZING],
  [ProjectPhaseGroup.COMPLETED]: [ProjectLifecycle.CLOSED],
  [ProjectPhaseGroup.LOST]: [ProjectLifecycle.LOST],
};

// Tab unlock rules per phase group
export const PHASE_TABS: Record<ProjectPhaseGroup, ProjectTab[]> = {
  [ProjectPhaseGroup.INTAKE]: ['overview', 'brief'],
  [ProjectPhaseGroup.EVALUATION]: ['overview', 'brief', 'plan'],
  [ProjectPhaseGroup.OPERATIONS]: [
    'overview', 'brief', 'plan', 'tasks', 'files', 'media-plans',
    'team', 'budget', 'kpis', 'ads-report', 'journal', 'history',
  ],
  [ProjectPhaseGroup.COMPLETED]: [
    'overview', 'brief', 'plan', 'tasks', 'files', 'media-plans',
    'team', 'budget', 'kpis', 'ads-report', 'journal', 'history',
  ],
  [ProjectPhaseGroup.LOST]: ['overview', 'brief'],
};

// Vietnamese labels for phase groups
export const PhaseGroupLabels: Record<ProjectPhaseGroup, string> = {
  [ProjectPhaseGroup.INTAKE]: 'Tiếp nhận',
  [ProjectPhaseGroup.EVALUATION]: 'Đánh giá',
  [ProjectPhaseGroup.OPERATIONS]: 'Vận hành',
  [ProjectPhaseGroup.COMPLETED]: 'Hoàn thành',
  [ProjectPhaseGroup.LOST]: 'Từ chối',
};

// Phase group colors (Tailwind classes)
export const PhaseGroupColors: Record<ProjectPhaseGroup, string> = {
  [ProjectPhaseGroup.INTAKE]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [ProjectPhaseGroup.EVALUATION]: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  [ProjectPhaseGroup.OPERATIONS]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [ProjectPhaseGroup.COMPLETED]: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  [ProjectPhaseGroup.LOST]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// Phase group dot colors (for indicators)
export const PhaseGroupDotColors: Record<ProjectPhaseGroup, string> = {
  [ProjectPhaseGroup.INTAKE]: 'bg-blue-500 dark:bg-blue-400',
  [ProjectPhaseGroup.EVALUATION]: 'bg-amber-500 dark:bg-amber-400',
  [ProjectPhaseGroup.OPERATIONS]: 'bg-green-500 dark:bg-green-400',
  [ProjectPhaseGroup.COMPLETED]: 'bg-gray-400 dark:bg-gray-500',
  [ProjectPhaseGroup.LOST]: 'bg-red-500 dark:bg-red-400',
};

// Ordered phase groups (for kanban columns, progress bar)
export const PHASE_GROUP_ORDER: ProjectPhaseGroup[] = [
  ProjectPhaseGroup.INTAKE,
  ProjectPhaseGroup.EVALUATION,
  ProjectPhaseGroup.OPERATIONS,
  ProjectPhaseGroup.COMPLETED,
];

// Helper: get phase group from lifecycle
export function getProjectPhaseGroup(lifecycle: ProjectLifecycle): ProjectPhaseGroup {
  return LIFECYCLE_TO_PHASE[lifecycle];
}

// Helper: get available tabs for a lifecycle stage
export function getAvailableTabs(lifecycle: ProjectLifecycle): ProjectTab[] {
  const phase = LIFECYCLE_TO_PHASE[lifecycle];
  return PHASE_TABS[phase];
}

// Helper: check if a tab is available
export function isTabAvailable(tab: ProjectTab, lifecycle: ProjectLifecycle): boolean {
  return getAvailableTabs(lifecycle).includes(tab);
}

// Helper: get phase group index (0-3) for progress bar
export function getPhaseGroupIndex(phaseGroup: ProjectPhaseGroup): number {
  const idx = PHASE_GROUP_ORDER.indexOf(phaseGroup);
  return idx >= 0 ? idx : -1;
}
