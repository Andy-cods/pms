import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Create/Update Budget DTO
export class UpsertBudgetDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalBudget!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  spentAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedAdFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adServiceFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contentFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  designFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mediaFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  otherFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetPacing?: number;
}

// Response DTO
export interface BudgetResponseDto {
  id: string;
  projectId: string;
  totalBudget: number;
  monthlyBudget: number | null;
  spentAmount: number;
  fixedAdFee: number | null;
  adServiceFee: number | null;
  contentFee: number | null;
  designFee: number | null;
  mediaFee: number | null;
  otherFee: number | null;
  budgetPacing: number | null;
  createdAt: string;
  updatedAt: string;
}
