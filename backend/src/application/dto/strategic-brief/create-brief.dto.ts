import { IsString } from 'class-validator';

export class CreateBriefDto {
  @IsString()
  projectId!: string;
}
