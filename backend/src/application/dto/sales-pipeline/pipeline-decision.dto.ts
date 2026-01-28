import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';
import { PipelineDecision } from '@prisma/client';

export class PipelineDecisionDto {
  @IsEnum(PipelineDecision)
  decision!: PipelineDecision;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeInput(value) : value))
  @IsString()
  decisionNote?: string;
}
