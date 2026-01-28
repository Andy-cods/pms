import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PipelineStage, PipelineDecision } from '@prisma/client';

export class PipelineListQueryDto {
  @IsOptional()
  @IsEnum(PipelineStage)
  status?: PipelineStage;

  @IsOptional()
  @IsEnum(PipelineDecision)
  decision?: PipelineDecision;

  @IsOptional()
  @IsString()
  nvkdId?: string;

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
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
