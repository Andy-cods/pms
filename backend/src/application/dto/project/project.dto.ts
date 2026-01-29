import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { sanitizeInput, sanitizeRichText } from '@shared/utils/sanitize.util';
import {
  ProjectLifecycle,
  HealthStatus,
  PipelineDecision,
  ClientTier,
} from '@prisma/client';

// ─── Create Project DTO (NVKD creates a deal → lifecycle=LEAD) ───
export class CreateProjectDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  clientType?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  licenseLink?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  campaignObjective?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  initialGoal?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedAdFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adServiceFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contentFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  designFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherFee?: number;

  @IsOptional()
  @IsString()
  upsellOpportunity?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}

// ─── Update Project (general fields) ───
export class UpdateProjectDto {
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

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

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  stageChangeReason?: string;
}

// ─── Update Sale Fields (NVKD) ───
export class UpdateProjectSaleDto {
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  clientType?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  licenseLink?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  campaignObjective?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  initialGoal?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedAdFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adServiceFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contentFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  designFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherFee?: number;

  @IsOptional()
  @IsString()
  upsellOpportunity?: string;
}

// ─── PM/Planner Evaluation ───
export class UpdateProjectEvaluationDto {
  @IsOptional()
  @IsString()
  pmId?: string;

  @IsOptional()
  @IsString()
  plannerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costNSQC?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costDesign?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costMedia?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costKOL?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costOther?: number;

  @IsOptional()
  @IsEnum(ClientTier)
  clientTier?: ClientTier;

  @IsOptional()
  @IsString()
  marketSize?: string;

  @IsOptional()
  @IsString()
  competitionLevel?: string;

  @IsOptional()
  @IsString()
  productUSP?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  averageScore?: number;

  @IsOptional()
  @IsString()
  audienceSize?: string;

  @IsOptional()
  @IsString()
  productLifecycle?: string;

  @IsOptional()
  @IsString()
  scalePotential?: string;
}

// ─── Lifecycle Transition ───
export class UpdateLifecycleDto {
  @IsEnum(ProjectLifecycle)
  lifecycle!: ProjectLifecycle;
}

// ─── Weekly Note ───
export class AddWeeklyNoteDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  note!: string;
}

// ─── Decision (Accept/Decline) ───
export class ProjectDecisionDto {
  @IsEnum(PipelineDecision)
  decision!: PipelineDecision;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  decisionNote?: string;
}

// ─── List Query (supports lifecycle filter) ───
export class ProjectListQueryDto {
  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(ProjectLifecycle, { each: true })
  lifecycle?: ProjectLifecycle[];

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  nvkdId?: string;

  @IsOptional()
  @IsEnum(PipelineDecision)
  decision?: PipelineDecision;

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
  @Max(200)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ─── Update Budget Fields (convenience endpoint) ───
export class UpdateBudgetDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  spentAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixedAdFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adServiceFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contentFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  designFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetPacing?: number;
}

// ─── Response DTOs ───
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
  dealCode!: string;
  projectCode!: string | null;
  name!: string;
  description!: string | null;
  productType!: string | null;
  lifecycle!: ProjectLifecycle;
  healthStatus!: HealthStatus;
  stageProgress!: number;
  startDate!: string | null;
  endDate!: string | null;
  timelineProgress!: number;
  driveLink!: string | null;
  planLink!: string | null;
  trackingLink!: string | null;
  clientId!: string | null;
  client!: { id: string; companyName: string } | null;
  // Team refs
  nvkdId!: string;
  nvkd!: { id: string; name: string } | null;
  pmId!: string | null;
  pm!: { id: string; name: string } | null;
  plannerId!: string | null;
  planner!: { id: string; name: string } | null;
  // Sales data
  clientType!: string | null;
  campaignObjective!: string | null;
  initialGoal!: string | null;
  upsellOpportunity!: string | null;
  licenseLink!: string | null;
  // Budget/Fees
  totalBudget!: number | null;
  monthlyBudget!: number | null;
  spentAmount!: number | null;
  fixedAdFee!: number | null;
  adServiceFee!: number | null;
  contentFee!: number | null;
  designFee!: number | null;
  mediaFee!: number | null;
  otherFee!: number | null;
  // PM Evaluation
  costNSQC!: number | null;
  costDesign!: number | null;
  costMedia!: number | null;
  costKOL!: number | null;
  costOther!: number | null;
  cogs!: number | null;
  grossProfit!: number | null;
  profitMargin!: number | null;
  // Client evaluation
  clientTier!: string | null;
  averageScore!: number | null;
  // Decision
  decision!: PipelineDecision;
  decisionDate!: string | null;
  decisionNote!: string | null;
  // Notes
  weeklyNotes!: unknown[] | null;
  // Team
  team!: ProjectTeamMemberDto[];
  // Task stats
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

// ─── Team Management DTOs ───
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
