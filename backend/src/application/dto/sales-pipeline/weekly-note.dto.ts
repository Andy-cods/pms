import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@shared/utils/sanitize.util';

export class AddWeeklyNoteDto {
  @Transform(({ value }) => sanitizeInput(value))
  @IsString()
  note!: string;
}
