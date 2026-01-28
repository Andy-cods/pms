import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class CreateMediaPlanItemDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  channel!: string;

  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  campaignType!: string;

  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  objective!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetReach?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetClicks?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetLeads?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetCPL?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetCPC?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetROAS?: number;
}

export class UpdateMediaPlanItemDto {
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  channel?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  campaignType?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  objective?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetReach?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetClicks?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetLeads?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetCPL?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetCPC?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetROAS?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  status?: string;
}

export class ReorderMediaPlanItemsDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];
}
