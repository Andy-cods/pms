import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface AuditLogUserDto {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AuditLogResponseDto {
  id: string;
  userId: string | null;
  user: AuditLogUserDto | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponseDto {
  logs: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Predefined action types for filtering
export const AuditLogActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // User management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',

  // Project management
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  PROJECT_DELETE: 'PROJECT_DELETE',
  PROJECT_ARCHIVE: 'PROJECT_ARCHIVE',

  // Task management
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  TASK_COMPLETE: 'TASK_COMPLETE',

  // Settings
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',

  // File management
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DELETE: 'FILE_DELETE',

  // Approval
  APPROVAL_CREATE: 'APPROVAL_CREATE',
  APPROVAL_APPROVE: 'APPROVAL_APPROVE',
  APPROVAL_REJECT: 'APPROVAL_REJECT',

  // Client
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  CLIENT_DELETE: 'CLIENT_DELETE',
} as const;

export const AuditLogEntityTypes = {
  USER: 'User',
  PROJECT: 'Project',
  TASK: 'Task',
  FILE: 'File',
  APPROVAL: 'Approval',
  CLIENT: 'Client',
  SETTING: 'SystemSetting',
  SESSION: 'Session',
} as const;
