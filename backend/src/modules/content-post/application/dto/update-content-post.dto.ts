import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';
import { ContentPostStatus } from '@prisma/client';

export class UpdateContentPostDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  content?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  postType?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string | null;

  @IsOptional()
  @IsDateString()
  publishedDate?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  postUrl?: string | null;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  notes?: string | null;
}

export class ChangeContentPostStatusDto {
  @IsEnum(ContentPostStatus)
  status!: ContentPostStatus;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  revisionNote?: string;
}

export class DuplicateContentPostDto {
  @IsString()
  targetItemId!: string;
}

export class ReorderContentPostsDto {
  @IsString({ each: true })
  postIds!: string[];
}
