import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums matching Prisma schema
export enum ProjectStatus {
  STABLE = 'STABLE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum ProjectStage {
  INTAKE = 'INTAKE',
  DISCOVERY = 'DISCOVERY',
  PLANNING = 'PLANNING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PROPOSAL_PITCH = 'PROPOSAL_PITCH',
  ONGOING = 'ONGOING',
  OPTIMIZATION = 'OPTIMIZATION',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

// Create Project DTO
export class CreateProjectDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  driveLink?: string;

  @IsOptional()
  @IsString()
  planLink?: string;

  @IsOptional()
  @IsString()
  trackingLink?: string;
}

// Update Project DTO
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  stageProgress?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  driveLink?: string;

  @IsOptional()
  @IsString()
  planLink?: string;

  @IsOptional()
  @IsString()
  trackingLink?: string;
}

// Query params for listing projects
export class ProjectListQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsString()
  clientId?: string;

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
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Response DTOs
export class ProjectTeamMemberDto {
  id!: string;
  userId!: string;
  role!: string;
  isPrimary!: boolean;
  user!: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export class ProjectResponseDto {
  id!: string;
  code!: string;
  name!: string;
  description!: string | null;
  productType!: string | null;
  status!: ProjectStatus;
  stage!: ProjectStage;
  stageProgress!: number;
  startDate!: string | null;
  endDate!: string | null;
  timelineProgress!: number;
  driveLink!: string | null;
  planLink!: string | null;
  trackingLink!: string | null;
  clientId!: string | null;
  client!: {
    id: string;
    companyName: string;
  } | null;
  team!: ProjectTeamMemberDto[];
  taskStats!: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  createdAt!: string;
  updatedAt!: string;
  archivedAt!: string | null;
}

export class ProjectListResponseDto {
  projects!: ProjectResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

// Team management DTOs
export class AddTeamMemberDto {
  @IsString()
  userId!: string;

  @IsString()
  role!: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  isPrimary?: boolean;
}
