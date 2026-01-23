import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

// Report Types
export enum ReportType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

// Report Formats
export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

// Generate Report Request DTO
export class GenerateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(ReportFormat)
  format!: ReportFormat;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Report Data Interfaces (for internal use)
export interface ProjectReportData {
  id: string;
  code: string;
  name: string;
  status: string;
  stage: string;
  stageProgress: number;
  startDate: Date | null;
  endDate: Date | null;
  client: { companyName: string } | null;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    blocked: number;
    cancelled: number;
  };
  completionPercentage: number;
}

export interface TaskReportData {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName: string;
  projectCode: string;
  assignees: string[];
  deadline: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ReportSummary {
  generatedAt: Date;
  reportType: ReportType;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  totalProjects: number;
  totalTasks: number;
  projectStatusBreakdown: {
    stable: number;
    warning: number;
    critical: number;
  };
  taskStatusBreakdown: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    blocked: number;
    cancelled: number;
  };
  overallCompletionRate: number;
}

export interface FullReportData {
  summary: ReportSummary;
  projects: ProjectReportData[];
  tasks: TaskReportData[];
}
