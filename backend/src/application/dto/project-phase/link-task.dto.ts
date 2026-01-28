import { IsString, IsOptional } from 'class-validator';

export class LinkTaskDto {
  @IsOptional()
  @IsString()
  taskId?: string | null;
}
