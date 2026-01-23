import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ReportModule } from './modules/report/report.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor.js';
import { CsrfMiddleware } from './shared/middleware/csrf.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    ScheduleModule.forRoot(),
    // Rate limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute in milliseconds
        limit: 100,
      },
    ]),
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
    CalendarModule,
    ReportModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enable global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Metrics interceptor for Prometheus monitoring
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF middleware to all routes except specific paths
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        // Exclude paths that don't need CSRF (e.g., webhook endpoints)
        'api/metrics', // Prometheus scraping
        'api/health',  // Health check
      )
      .forRoutes('*');
  }
}
