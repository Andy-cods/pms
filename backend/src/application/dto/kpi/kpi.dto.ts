import { IsString, IsOptional, IsNumber } from 'class-validator';
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
}

export interface KpiResponseDto {
  id: string;
  projectId: string;
  kpiType: string;
  targetValue: number | null;
  actualValue: number | null;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
