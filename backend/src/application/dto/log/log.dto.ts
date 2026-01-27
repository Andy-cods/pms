import {
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeRichText } from '@shared/utils/sanitize.util';

export class CreateLogDto {
  @IsDateString()
  logDate!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  rootCause?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  action?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  nextAction?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  notes?: string;
}

export class UpdateLogDto {
  @IsOptional()
  @IsDateString()
  logDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  rootCause?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  action?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  nextAction?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeRichText(value) : value))
  @IsString()
  notes?: string;
}

export interface LogResponseDto {
  id: string;
  projectId: string;
  logDate: string;
  rootCause: string | null;
  action: string | null;
  nextAction: string | null;
  notes: string | null;
  createdAt: string;
}
