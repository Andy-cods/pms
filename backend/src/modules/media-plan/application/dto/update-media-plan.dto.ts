import { IsString, IsInt, IsNumber, IsOptional, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';
import { MediaPlanStatus } from '@prisma/client';

export class UpdateMediaPlanDto {
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2035)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(MediaPlanStatus)
  status?: MediaPlanStatus;
}
