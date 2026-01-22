import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ProjectModule } from './modules/project/project.module.js';
import { TaskModule } from './modules/task/task.module.js';
import { FileModule } from './modules/file/file.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    AuthModule,
    UsersModule,
    ProjectModule,
    TaskModule,
    FileModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
