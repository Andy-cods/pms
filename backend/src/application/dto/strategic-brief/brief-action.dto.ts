import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class RequestRevisionDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  comment!: string;
}
