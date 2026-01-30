import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Res,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { MinioService } from '../../infrastructure/external-services/minio/minio.service.js';
import {
  FileCategory,
  UploadFileDto,
  UpdateFileDto,
  FileListQueryDto,
  type FileResponseDto,
  type FileListResponseDto,
  type PresignedUrlResponseDto,
} from '../../application/dto/file/file.dto.js';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  /**
   * Upload a file
   * POST /files/upload
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check project access
    await this.checkProjectAccess(dto.projectId, req.user);

    // Check task if provided
    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
        select: { projectId: true },
      });
      if (!task || task.projectId !== dto.projectId) {
        throw new BadRequestException('Task does not belong to this project');
      }
    }

    // Generate path and upload to MinIO
    const objectPath = this.minioService.generateObjectPath(
      dto.projectId,
      file.originalname,
      dto.taskId,
    );

    const uploaded = await this.minioService.uploadFile(
      file.buffer,
      objectPath,
      file.mimetype,
    );

    // Save file record to database
    const fileRecord = await this.prisma.file.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId || null,
        name: file.originalname,
        originalName: file.originalname,
        path: uploaded.path,
        size: uploaded.size,
        mimeType: file.mimetype,
        category: dto.category || FileCategory.OTHER,
        tags: dto.tags || [],
        uploadedById: req.user.sub,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, dealCode: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return this.mapToResponseDto(fileRecord);
  }

  /**
   * List files
   * GET /files
   */
  @Get()
  async listFiles(
    @Query() query: FileListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileListResponseDto> {
    const {
      projectId,
      taskId,
      category,
      search,
      limit = 50,
      offset = 0,
    } = query;

    const where: Record<string, unknown> = {};

    if (projectId) {
      await this.checkProjectAccess(projectId, req.user);
      where.projectId = projectId;
    } else {
      // Only files from user's projects
      const isAdmin =
        req.user.role === UserRole.SUPER_ADMIN ||
        req.user.role === UserRole.ADMIN;
      if (!isAdmin) {
        const userProjects = await this.prisma.projectTeam.findMany({
          where: { userId: req.user.sub },
          select: { projectId: true },
        });
        where.projectId = { in: userProjects.map((p) => p.projectId) };
      }
    }

    if (taskId) where.taskId = taskId;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, dealCode: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      files: files.map((f) => this.mapToResponseDto(f)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get file by ID
   * GET /files/:id
   */
  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, dealCode: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.projectId) {
      await this.checkProjectAccess(file.projectId, req.user);
    }

    return this.mapToResponseDto(file);
  }

  /**
   * Get download URL (presigned)
   * GET /files/:id/download
   */
  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<PresignedUrlResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true, path: true, projectId: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.projectId) {
      await this.checkProjectAccess(file.projectId, req.user);
    }

    const expiresIn = 3600; // 1 hour
    const url = await this.minioService.getPresignedUrl(file.path, expiresIn);

    return { url, expiresIn };
  }

  /**
   * Stream download (for inline preview)
   * GET /files/:id/stream
   */
  @Get(':id/stream')
  async streamFile(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        projectId: true,
        mimeType: true,
        originalName: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.projectId) {
      await this.checkProjectAccess(file.projectId, req.user);
    }

    const stream = await this.minioService.getFileStream(file.path);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`,
    );

    stream.pipe(res);
  }

  /**
   * Update file metadata
   * PATCH /files/:id
   */
  @Patch(':id')
  async updateFile(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true, projectId: true, uploadedById: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Only uploader or admin can update
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (file.uploadedById !== req.user.sub && !isAdmin) {
      throw new ForbiddenException('Not authorized to update this file');
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        tags: dto.tags,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, dealCode: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete file
   * DELETE /files/:id
   */
  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<{ success: boolean }> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { id: true, path: true, projectId: true, uploadedById: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Only uploader or admin can delete
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (file.uploadedById !== req.user.sub && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this file');
    }

    // Delete from MinIO
    try {
      await this.minioService.deleteFile(file.path);
    } catch (error) {
      this.logger.error('Failed to delete file from MinIO:', error);
      // Continue to delete DB record even if MinIO fails
    }

    // Delete from database
    await this.prisma.file.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Get files by project
   * GET /files/project/:projectId
   */
  @Get('project/:projectId')
  async getProjectFiles(
    @Param('projectId') projectId: string,
    @Query() query: FileListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileListResponseDto> {
    await this.checkProjectAccess(projectId, req.user);

    return this.listFiles({ ...query, projectId }, req);
  }

  /**
   * Get files by task
   * GET /files/task/:taskId
   */
  @Get('task/:taskId')
  async getTaskFiles(
    @Param('taskId') taskId: string,
    @Query() query: FileListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<FileListResponseDto> {
    // Get task and check project access
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkProjectAccess(task.projectId, req.user);

    return this.listFiles({ ...query, taskId }, req);
  }

  // Helper: Check project access
  private async checkProjectAccess(
    projectId: string,
    user: { sub: string; role: string },
  ): Promise<void> {
    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    if (isAdmin) return;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.projectTeam.findFirst({
      where: { projectId, userId: user.sub },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this project');
    }
  }

  // Helper: Map to response DTO
  private mapToResponseDto(file: {
    id: string;
    name: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    category: string;
    version: number;
    tags: string[];
    uploadedAt: Date;
    uploadedBy: { id: string; name: string; email: string };
    project?: { id: string; dealCode: string; name: string } | null;
    task?: { id: string; title: string } | null;
  }): FileResponseDto {
    return {
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      category: file.category as FileCategory,
      version: file.version,
      tags: file.tags,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
      project: file.project || undefined,
      task: file.task || undefined,
    };
  }
}
