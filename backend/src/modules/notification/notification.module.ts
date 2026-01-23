import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { NotificationController } from '../../presentation/controllers/notification.controller.js';
import { CommentController } from '../../presentation/controllers/comment.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController, CommentController],
  providers: [],
  exports: [],
})
export class NotificationModule {}
