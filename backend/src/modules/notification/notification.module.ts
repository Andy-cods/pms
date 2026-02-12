import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationController } from '../../presentation/controllers/notification.controller.js';
import { CommentController } from '../../presentation/controllers/comment.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationController, CommentController],
  providers: [],
  exports: [],
})
export class NotificationModule {}
