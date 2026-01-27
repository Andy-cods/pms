import { IsString, IsInt, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class CreateMediaPlanDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2035)
  year!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalBudget!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  notes?: string;
}
