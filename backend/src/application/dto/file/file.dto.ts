import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// Matches Prisma FileCategory enum
export enum FileCategory {
  BRIEF = 'BRIEF',
  PLAN = 'PLAN',
  PROPOSAL = 'PROPOSAL',
  REPORT = 'REPORT',
  CREATIVE = 'CREATIVE',
  RAW_DATA = 'RAW_DATA',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export class UploadFileDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class FileListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// Response DTOs
export interface FileResponseDto {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  version: number;
  tags: string[];
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    code: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface FileListResponseDto {
  files: FileResponseDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface PresignedUrlResponseDto {
  url: string;
  expiresIn: number;
}
