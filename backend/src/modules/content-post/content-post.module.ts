import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ContentPostController } from './presentation/controllers/content-post.controller';
import { ContentPostService } from './application/services/content-post.service';
import { PrismaContentPostRepository } from './infrastructure/repositories/prisma-content-post.repository';
import { CONTENT_POST_REPOSITORY } from './domain/interfaces/content-post.repository.interface';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContentPostController],
  providers: [
    ContentPostService,
    {
      provide: CONTENT_POST_REPOSITORY,
      useClass: PrismaContentPostRepository,
    },
  ],
  exports: [ContentPostService],
})
export class ContentPostModule {}
