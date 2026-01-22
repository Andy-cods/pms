// Type definitions for BC Agency PMS

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  SENIOR = 'SENIOR',
  MEMBER = 'MEMBER',
  INTERN = 'INTERN',
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT',
  VIEWER = 'VIEWER',
}

export enum ProjectStatus {
  STABLE = 'STABLE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  PENDING = 'PENDING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  HIGHEST = 'HIGHEST',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  LOWEST = 'LOWEST',
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
