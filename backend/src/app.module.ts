import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './infrastructure/persistence/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ClientModule } from './modules/client/client.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ProjectModule } from './modules/project/project.module.js';
import { TaskModule } from './modules/task/task.module.js';
import { FileModule } from './modules/file/file.module.js';
import { MinioModule } from './infrastructure/external-services/minio/minio.module.js';
import { ApprovalModule } from './modules/approval/approval.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MinioModule,
    AuthModule,
    UsersModule,
    ClientModule,
    AdminModule,
    DashboardModule,
    ProjectModule,
    TaskModule,
    FileModule,
    ApprovalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
