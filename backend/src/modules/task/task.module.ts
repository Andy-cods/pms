import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module.js';
import { TaskController } from '../../presentation/controllers/task.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [TaskController],
  providers: [],
  exports: [],
})
export class TaskModule {}
