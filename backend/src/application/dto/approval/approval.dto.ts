import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums matching Prisma schema
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

// Create Approval DTO (Submit for approval)
export class CreateApprovalDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEnum(ApprovalType)
  type!: ApprovalType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}

// Update Approval DTO (for resubmission)
export class UpdateApprovalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}

// Action DTOs
export class ApproveApprovalDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectApprovalDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export class RequestChangesDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

// Query params for listing approvals
export class ApprovalListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsEnum(ApprovalType)
  type?: ApprovalType;

  @IsOptional()
  @IsString()
  search?: string;

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

  @IsOptional()
  @IsString()
  sortBy?: string = 'submittedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Response DTOs
export class ApprovalHistoryItemDto {
  id!: string;
  fromStatus!: ApprovalStatus;
  toStatus!: ApprovalStatus;
  comment!: string | null;
  changedBy!: {
    id: string;
    name: string;
    avatar: string | null;
  };
  changedAt!: string;
}

export class ApprovalFileDto {
  id!: string;
  name!: string;
  mimeType!: string;
  size!: number;
  url?: string;
}

export class ApprovalResponseDto {
  id!: string;
  projectId!: string;
  project!: {
    id: string;
    code: string;
    name: string;
  };
  type!: ApprovalType;
  status!: ApprovalStatus;
  title!: string;
  description!: string | null;
  comment!: string | null;
  deadline!: string | null;
  escalationLevel!: number;
  escalatedAt!: string | null;
  submittedBy!: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  approvedBy!: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  files!: ApprovalFileDto[];
  history!: ApprovalHistoryItemDto[];
  submittedAt!: string;
  respondedAt!: string | null;
}

export class ApprovalListResponseDto {
  approvals!: ApprovalResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

// Stats for dashboard
export class ApprovalStatsDto {
  total!: number;
  pending!: number;
  approved!: number;
  rejected!: number;
  changesRequested!: number;
}

// Status labels and colors for frontend
export const ApprovalStatusLabels: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.REJECTED]: 'Rejected',
  [ApprovalStatus.CHANGES_REQUESTED]: 'Changes Requested',
};

export const ApprovalStatusColors: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'yellow',
  [ApprovalStatus.APPROVED]: 'green',
  [ApprovalStatus.REJECTED]: 'red',
  [ApprovalStatus.CHANGES_REQUESTED]: 'orange',
};

export const ApprovalTypeLabels: Record<ApprovalType, string> = {
  [ApprovalType.PLAN]: 'Plan',
  [ApprovalType.CONTENT]: 'Content',
  [ApprovalType.BUDGET]: 'Budget',
  [ApprovalType.FILE]: 'File',
};
