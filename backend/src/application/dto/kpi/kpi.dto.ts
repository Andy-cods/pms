import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKpiDto {
  @IsString()
  kpiType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  periodLabel?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class UpdateKpiDto {
  @IsOptional()
  @IsString()
  kpiType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  periodLabel?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export interface KpiResponseDto {
  id: string;
  projectId: string;
  kpiType: string;
  targetValue: number | null;
  actualValue: number | null;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  periodStart: string | null;
  periodEnd: string | null;
  periodLabel: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}
