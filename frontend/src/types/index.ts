// Type definitions for BC Agency PMS
// Aligned with backend Prisma schema

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
// PROJECT
// ============================================

export enum ProjectStatus {
  STABLE = 'STABLE',       // Green - On track
  WARNING = 'WARNING',     // Yellow - At risk
  CRITICAL = 'CRITICAL',   // Red - Delayed/Critical
}

export enum ProjectStage {
  INTAKE = 'INTAKE',                     // Tiep nhan brief
  DISCOVERY = 'DISCOVERY',               // Discovery & Audit
  PLANNING = 'PLANNING',                 // Lap ke hoach
  UNDER_REVIEW = 'UNDER_REVIEW',         // Cho duyet
  PROPOSAL_PITCH = 'PROPOSAL_PITCH',     // Proposal/Pitch
  ONGOING = 'ONGOING',                   // Dang trien khai
  OPTIMIZATION = 'OPTIMIZATION',         // Toi uu
  COMPLETED = 'COMPLETED',               // Hoan thanh
  CLOSED = 'CLOSED',                     // Dong
}

export const ProjectStageLabels: Record<ProjectStage, string> = {
  [ProjectStage.INTAKE]: 'Tiếp nhận brief',
  [ProjectStage.DISCOVERY]: 'Discovery & Audit',
  [ProjectStage.PLANNING]: 'Lập kế hoạch',
  [ProjectStage.UNDER_REVIEW]: 'Chờ duyệt',
  [ProjectStage.PROPOSAL_PITCH]: 'Proposal/Pitch',
  [ProjectStage.ONGOING]: 'Đang triển khai',
  [ProjectStage.OPTIMIZATION]: 'Tối ưu',
  [ProjectStage.COMPLETED]: 'Hoàn thành',
  [ProjectStage.CLOSED]: 'Đóng',
};

// ============================================
// TASK
// ============================================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
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
// PROJECT TYPES
// ============================================

export interface ProjectTeamMember {
  id: string;
  userId: string;
  role: string;
  isPrimary: boolean;
  assignedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  stage: ProjectStage;
  startDate?: Date | null;
  endDate?: Date | null;
  clientId?: string | null;
  client?: {
    id: string;
    companyName: string;
    contactName?: string | null;
  } | null;
  team?: ProjectTeamMember[];
  metadata?: Record<string, unknown> | null;
  isArchived: boolean;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectListResponse {
  data: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateProjectInput {
  name: string;
  code?: string;
  description?: string;
  status?: ProjectStatus;
  stage?: ProjectStage;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  stage?: ProjectStage;
  startDate?: string | null;
  endDate?: string | null;
  clientId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ProjectStatus;
  stage?: ProjectStage;
  search?: string;
  clientId?: string;
  isArchived?: boolean;
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
    code: string;
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
