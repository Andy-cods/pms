import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Create Comment DTO
export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

// Update Comment DTO
export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

// Query DTO for listing comments
export class CommentListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// Response DTOs
export interface CommentAuthorDto {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface CommentResponseDto {
  id: string;
  content: string;
  projectId: string | null;
  taskId: string | null;
  parentId: string | null;
  author: CommentAuthorDto;
  replies?: CommentResponseDto[];
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponseDto {
  comments: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Mention parser helper
export function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = content.matchAll(mentionRegex);
  return [...matches].map((m) => m[1]).filter((m): m is string => m !== undefined);
}
