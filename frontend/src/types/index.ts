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
