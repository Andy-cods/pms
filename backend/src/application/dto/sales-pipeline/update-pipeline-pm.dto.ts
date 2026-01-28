import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientTier } from '@prisma/client';

export class UpdatePipelinePmDto {
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
