import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class UpdatePhaseItemDto {
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}
