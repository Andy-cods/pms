import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class CreateContentPostDto {
  @Transform(({ value }: { value: string }) => sanitizeInput(value))
  @IsString()
  title!: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  content?: string;

  @Transform(({ value }: { value: string }) => sanitizeInput(value))
  @IsString()
  postType!: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? sanitizeInput(value) : value,
  )
  @IsString()
  notes?: string;
}
