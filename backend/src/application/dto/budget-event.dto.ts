import { IsNumber, IsOptional, IsString, IsIn, Min } from 'class-validator';

export const BudgetEventTypes = ['ALLOC', 'SPEND', 'ADJUST'] as const;
export type BudgetEventType = (typeof BudgetEventTypes)[number];

export const BudgetEventCategories = ['FIXED_AD', 'AD_SERVICE', 'CONTENT', 'DESIGN', 'MEDIA', 'OTHER'] as const;
export type BudgetEventCategory = (typeof BudgetEventCategories)[number];

export const BudgetEventStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] as const;
export type BudgetEventStatus = (typeof BudgetEventStatuses)[number];

export class CreateBudgetEventDto {
  @IsIn(BudgetEventTypes)
  type!: BudgetEventType;

  @IsIn(BudgetEventCategories)
  category!: BudgetEventCategory;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  mediaPlanId?: string;
}

export class BudgetEventQueryDto {
  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsIn(BudgetEventCategories)
  category?: BudgetEventCategory;

  @IsOptional()
  @IsIn(BudgetEventStatuses)
  status?: BudgetEventStatus;
}

export class UpdateBudgetEventStatusDto {
  @IsIn(BudgetEventStatuses)
  status!: BudgetEventStatus;
}

export interface BudgetEventResponse {
  id: string;
  projectId: string;
  mediaPlanId?: string | null;
  stage?: string | null;
  amount: number;
  type: BudgetEventType;
  category: BudgetEventCategory;
  status: BudgetEventStatus;
  note?: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface BudgetThresholdResponse {
  level: 'ok' | 'warning' | 'critical';
  percent: number;
}
