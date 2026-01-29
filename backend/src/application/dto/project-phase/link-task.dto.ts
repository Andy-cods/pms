import { IsString, IsOptional, IsIn } from 'class-validator';

export class LinkTaskDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsIn(['connect', 'disconnect'])
  action?: 'connect' | 'disconnect';
}
