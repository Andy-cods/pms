import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MinioModule } from '../../infrastructure/external-services/minio/minio.module.js';
import { FileController } from '../../presentation/controllers/file.controller.js';

@Module({
  imports: [PrismaModule, AuthModule, MinioModule],
  controllers: [FileController],
  providers: [],
  exports: [],
})
export class FileModule {}
