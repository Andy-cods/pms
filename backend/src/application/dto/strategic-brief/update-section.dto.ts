import { IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}
