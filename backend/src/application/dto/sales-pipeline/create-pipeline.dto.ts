import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class CreatePipelineDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  projectName!: string;

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
