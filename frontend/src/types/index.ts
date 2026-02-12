// Type definitions for BC Agency PMS
// Aligned with backend Prisma schema (unified Project entity)

// ============================================
// USER & AUTH
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TECHNICAL = 'TECHNICAL',
  NVKD = 'NVKD',           // Sales
  PM = 'PM',               // Project Manager
  PLANNER = 'PLANNER',
  ACCOUNT = 'ACCOUNT',
  CONTENT = 'CONTENT',
  DESIGN = 'DESIGN',
  MEDIA = 'MEDIA',
}

// Role display names for UI
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.TECHNICAL]: 'Technical',
  [UserRole.NVKD]: 'Sales (NVKD)',
  [UserRole.PM]: 'Project Manager',
  [UserRole.PLANNER]: 'Planner',
  [UserRole.ACCOUNT]: 'Account',
  [UserRole.CONTENT]: 'Content',
  [UserRole.DESIGN]: 'Design',
  [UserRole.MEDIA]: 'Media',
};

// ============================================
// PROJECT - Unified Lifecycle & Health
// ============================================

export enum HealthStatus {
  STABLE = 'STABLE',       // Green - On track
  WARNING = 'WARNING',     // Yellow - At risk
  CRITICAL = 'CRITICAL',   // Red - Delayed/Critical
}

export const HealthStatusLabels: Record<HealthStatus, string> = {
  [HealthStatus.STABLE]: 'On Track',
  [HealthStatus.WARNING]: 'At Risk',
  [HealthStatus.CRITICAL]: 'Critical',
};

export enum ProjectLifecycle {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  EVALUATION = 'EVALUATION',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  PLANNING = 'PLANNING',
  ONGOING = 'ONGOING',
  OPTIMIZING = 'OPTIMIZING',
  CLOSED = 'CLOSED',
}

export const ProjectLifecycleLabels: Record<ProjectLifecycle, string> = {
  [ProjectLifecycle.LEAD]: 'Lead',
  [ProjectLifecycle.QUALIFIED]: 'Qualified',
  [ProjectLifecycle.EVALUATION]: 'Evaluation',
  [ProjectLifecycle.NEGOTIATION]: 'Negotiation',
  [ProjectLifecycle.WON]: 'Won',
  [ProjectLifecycle.LOST]: 'Lost',
  [ProjectLifecycle.PLANNING]: 'Planning',
  [ProjectLifecycle.ONGOING]: 'Ongoing',
  [ProjectLifecycle.OPTIMIZING]: 'Optimizing',
  [ProjectLifecycle.CLOSED]: 'Closed',
};

export enum PipelineDecision {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

// ============================================
// PROJECT PHASE GROUP (4 giai đoạn lớn)
// ============================================

export enum ProjectPhaseGroup {
  INTAKE = 'INTAKE',           // Tiếp nhận (LEAD, QUALIFIED)
  EVALUATION = 'EVALUATION',   // Đánh giá (EVALUATION, NEGOTIATION)
  OPERATIONS = 'OPERATIONS',   // Vận hành (WON, PLANNING, ONGOING, OPTIMIZING)
  COMPLETED = 'COMPLETED',     // Hoàn thành (CLOSED)
  LOST = 'LOST',               // Từ chối (LOST)
}

export type ProjectTab =
  | 'overview' | 'brief' | 'plan'
  | 'tasks' | 'files' | 'media-plans' | 'team'
  | 'budget' | 'kpis' | 'ads-report' | 'journal' | 'history';

export interface WeeklyNote {
  week: number;
  date: string;
  note: string;
  authorId: string;
}

// ============================================
// TASK
// ============================================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ============================================
// APPROVAL
// ============================================

export enum ApprovalType {
  PLAN = 'PLAN',
  CONTENT = 'CONTENT',
  BUDGET = 'BUDGET',
  FILE = 'FILE',
  MEDIA_PLAN = 'MEDIA_PLAN',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

// ============================================
// FILE
// ============================================

export enum FileCategory {
  BRIEF = 'BRIEF',
  PLAN = 'PLAN',
  PROPOSAL = 'PROPOSAL',
  REPORT = 'REPORT',
  CREATIVE = 'CREATIVE',
  RAW_DATA = 'RAW_DATA',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

// ============================================
// EVENT
// ============================================

export enum EventType {
  MEETING = 'MEETING',
  DEADLINE = 'DEADLINE',
  MILESTONE = 'MILESTONE',
  REMINDER = 'REMINDER',
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  isActive: boolean;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokensDto;
}

export interface ClientAuthResponse {
  client: {
    id: string;
    companyName: string;
    contactName?: string | null;
  };
  tokens: TokensDto;
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// PROJECT TYPES (Unified)
// ============================================

export interface ProjectTeamMember {
  id: string;
  userId: string;
  role: string;
  isPrimary: boolean;
  joinedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  workload?: {
    projectTasks: number;
    projectTasksDone: number;
    projectTasksOverdue: number;
    totalTasks: number;
  };
}

export interface Project {
  id: string;
  dealCode: string;
  projectCode: string | null;
  name: string;
  description: string | null;
  productType: string | null;
  lifecycle: ProjectLifecycle;
  healthStatus: HealthStatus;
  stageProgress: number;
  startDate: string | null;
  endDate: string | null;
  timelineProgress: number;
  driveLink: string | null;
  planLink: string | null;
  trackingLink: string | null;
  clientId: string | null;
  client: { id: string; companyName: string } | null;
  // Team refs
  nvkdId: string;
  nvkd?: { id: string; name: string } | null;
  pmId: string | null;
  pm?: { id: string; name: string } | null;
  plannerId: string | null;
  planner?: { id: string; name: string } | null;
  // Sales data
  clientType: string | null;
  campaignObjective: string | null;
  initialGoal: string | null;
  upsellOpportunity: string | null;
  licenseLink: string | null;
  // Budget/Fees
  totalBudget: number | null;
  monthlyBudget: number | null;
  spentAmount: number | null;
  fixedAdFee: number | null;
  adServiceFee: number | null;
  contentFee: number | null;
  designFee: number | null;
  mediaFee: number | null;
  otherFee: number | null;
  budgetPacing: number | null;
  // PM Evaluation / Cost
  costNSQC: number | null;
  costDesign: number | null;
  costMedia: number | null;
  costKOL: number | null;
  costOther: number | null;
  cogs: number | null;
  grossProfit: number | null;
  profitMargin: number | null;
  // Evaluation fields
  marketSize: string | null;
  competitionLevel: string | null;
  productUSP: string | null;
  averageScore: number | null;
  audienceSize: string | null;
  productLifecycle: string | null;
  scalePotential: string | null;
  clientTier: string | null;
  // Decision
  decision: PipelineDecision;
  decisionDate: string | null;
  decisionNote: string | null;
  weeklyNotes: WeeklyNote[] | null;
  // Relations
  team: ProjectTeamMember[];
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  strategicBrief?: { id: string; status: string; completionPct: number } | null;
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

export interface CreateProjectInput {
  name: string;
  description?: string;
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

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  productType?: string;
  healthStatus?: HealthStatus;
  stageProgress?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  driveLink?: string;
  planLink?: string;
  trackingLink?: string;
  stageChangeReason?: string;
}

export interface ProjectListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  healthStatus?: HealthStatus;
  lifecycle?: ProjectLifecycle[];
  search?: string;
  clientId?: string;
  nvkdId?: string;
  decision?: PipelineDecision;
}

export interface AddTeamMemberInput {
  userId: string;
  role: string;
  isPrimary?: boolean;
}

// ============================================
// TASK TYPES
// ============================================

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'Cần làm',
  [TaskStatus.IN_PROGRESS]: 'Đang làm',
  [TaskStatus.PENDING]: 'Chờ xử lý',
  [TaskStatus.REVIEW]: 'Chờ review',
  [TaskStatus.DONE]: 'Hoàn thành',
  [TaskStatus.BLOCKED]: 'Bị chặn',
  [TaskStatus.CANCELLED]: 'Đã hủy',
};

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Thấp',
  [TaskPriority.MEDIUM]: 'Trung bình',
  [TaskPriority.HIGH]: 'Cao',
  [TaskPriority.URGENT]: 'Khẩn cấp',
};

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface Task {
  id: string;
  projectId: string;
  parentId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  deadline?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  reviewerId?: string | null;
  createdById: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    dealCode: string;
    name: string;
  };
  parent?: {
    id: string;
    title: string;
  } | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignees?: TaskAssignee[];
}

export interface TaskListResponse {
  data: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateTaskInput {
  projectId: string;
  parentId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  deadline?: string;
  reviewerId?: string;
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number | null;
  actualHours?: number | null;
  deadline?: string | null;
  reviewerId?: string | null;
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  parentIdNull?: string | null;
}

export interface KanbanColumn {
  status: TaskStatus;
  tasks: Task[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface TaskCountByStatus {
  TODO: number;
  IN_PROGRESS: number;
  REVIEW: number;
  DONE: number;
  BLOCKED: number;
  CANCELLED: number;
}

export interface ReorderTaskInput {
  taskId: string;
  newStatus: TaskStatus;
  newIndex: number;
}

// ============================================
// BUDGET EVENT
// ============================================

export enum BudgetEventCategory {
  FIXED_AD = 'FIXED_AD',
  AD_SERVICE = 'AD_SERVICE',
  CONTENT = 'CONTENT',
  DESIGN = 'DESIGN',
  MEDIA = 'MEDIA',
  OTHER = 'OTHER',
}

export enum BudgetEventStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

// ============================================
// STAGE HISTORY
// ============================================

export interface StageHistoryEntry {
  id: string;
  projectId: string;
  fromStage: ProjectLifecycle | null;
  toStage: ProjectLifecycle;
  fromProgress: number;
  toProgress: number;
  changedById: string;
  changedBy?: { id: string; name: string };
  reason: string | null;
  createdAt: string;
}
