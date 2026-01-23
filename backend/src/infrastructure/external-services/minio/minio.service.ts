import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export interface UploadedFile {
  path: string;
  bucket: string;
  size: number;
  etag: string;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>(
      'MINIO_BUCKET',
      'bc-agency-files',
    );

    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL:
        this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created bucket: ${this.bucket}`);
      } else {
        this.logger.log(`Bucket exists: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.warn(
        `MinIO bucket check failed: ${(error as Error).message}`,
      );
      // Don't throw - allow app to start even if MinIO is not available
    }
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    buffer: Buffer,
    objectName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    const result = await this.client.putObject(
      this.bucket,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': mimeType },
    );

    return {
      path: objectName,
      bucket: this.bucket,
      size: buffer.length,
      etag: result.etag,
    };
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async getPresignedUrl(
    objectName: string,
    expirySeconds = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(
      this.bucket,
      objectName,
      expirySeconds,
    );
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getPresignedUploadUrl(
    objectName: string,
    expirySeconds = 3600,
  ): Promise<string> {
    return this.client.presignedPutObject(
      this.bucket,
      objectName,
      expirySeconds,
    );
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(objectNames: string[]): Promise<void> {
    await this.client.removeObjects(this.bucket, objectNames);
  }

  /**
   * Get file stream for streaming downloads
   */
  async getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucket, objectName);
  }

  /**
   * Check if file exists
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(objectName: string): Promise<Minio.BucketItemStat> {
    return this.client.statObject(this.bucket, objectName);
  }

  /**
   * Generate object path for file storage
   * Format: projects/{projectId}/files/{uuid}-{filename}
   */
  generateObjectPath(
    projectId: string,
    filename: string,
    taskId?: string,
  ): string {
    const uuid = this.generateUuid();
    const sanitizedFilename = this.sanitizeFilename(filename);

    if (taskId) {
      return `projects/${projectId}/tasks/${taskId}/${uuid}-${sanitizedFilename}`;
    }
    return `projects/${projectId}/files/${uuid}-${sanitizedFilename}`;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
}
