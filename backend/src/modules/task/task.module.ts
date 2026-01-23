import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TaskController } from '../../presentation/controllers/task.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaskController],
  providers: [],
  exports: [],
})
export class TaskModule {}
