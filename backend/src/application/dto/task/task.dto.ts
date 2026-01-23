import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { sanitizeInput, sanitizeRichText } from '@shared/utils/sanitize.util.js';

// Enums matching Prisma schema
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

// Create Task DTO
export class CreateTaskDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  title!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}

// Update Task DTO
export class UpdateTaskDto {
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

// Update Task Status DTO
export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

// Assign Users DTO
export class AssignUsersDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}

// Reorder Tasks DTO
export class ReorderTasksDto {
  @IsArray()
  tasks!: { id: string; orderIndex: number; status?: TaskStatus }[];
}

// Query params for listing tasks
export class TaskListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

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
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'orderIndex';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

// Response DTOs
export class TaskAssigneeDto {
  id!: string;
  userId!: string;
  user!: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export class TaskResponseDto {
  id!: string;
  projectId!: string;
  parentId!: string | null;
  title!: string;
  description!: string | null;
  status!: TaskStatus;
  priority!: TaskPriority;
  estimatedHours!: number | null;
  actualHours!: number | null;
  deadline!: string | null;
  startedAt!: string | null;
  completedAt!: string | null;
  orderIndex!: number;
  reviewerId!: string | null;
  reviewer!: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdById!: string;
  createdBy!: {
    id: string;
    name: string;
    avatar: string | null;
  };
  assignees!: TaskAssigneeDto[];
  subtaskCount!: number;
  completedSubtaskCount!: number;
  project!: {
    id: string;
    code: string;
    name: string;
  };
  createdAt!: string;
  updatedAt!: string;
}

export class TaskListResponseDto {
  tasks!: TaskResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

// Kanban View Response
export class KanbanColumnDto {
  status!: TaskStatus;
  label!: string;
  tasks!: TaskResponseDto[];
}

export class KanbanResponseDto {
  columns!: KanbanColumnDto[];
  projectId!: string;
}
