import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientModule } from './modules/client/client.module';
import { AdminModule } from './modules/admin/admin.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { FileModule } from './modules/file/file.module';
import { MinioModule } from './infrastructure/external-services/minio/minio.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ReportModule } from './modules/report/report.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { CsrfMiddleware } from './shared/middleware/csrf.middleware';

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
