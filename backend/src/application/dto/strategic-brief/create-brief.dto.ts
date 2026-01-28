import { IsString, IsOptional } from 'class-validator';

export class CreateBriefDto {
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
