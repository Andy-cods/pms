import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { API_PREFIX, APP_NAME } from './shared/constants/index.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3001);
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disabled for API compatibility
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Cookie parser middleware - required for httpOnly JWT cookies
  app.use(cookieParser());

  // Global prefix for all routes
  app.setGlobalPrefix(API_PREFIX);

  // Enable CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-XSRF-TOKEN',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation (non-production only)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BC Agency PMS API')
      .setDescription(
        'API documentation for BC Agency Project Management System. ' +
          'Internal advertising project management platform.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication & session management')
      .addTag('Projects', 'Project management')
      .addTag('Tasks', 'Task management')
      .addTag('Approvals', 'Approval workflows')
      .addTag('Calendar', 'Events & scheduling')
      .addTag('Files', 'File upload & management')
      .addTag('Admin', 'System administration')
      .addTag('Reports', 'Report generation')
      .addTag('Dashboard', 'Dashboard & statistics')
      .addTag('Client Portal', 'Client-facing portal')
      .addTag('Media Plans', 'Media planning')
      .addTag('Strategic Brief', 'Strategic briefs')
      .addTag('Ads Reports', 'Advertising performance reports')
      .addTag('Notifications', 'Notification management')
      .addTag('Metrics', 'Monitoring metrics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'BC Agency PMS - API Docs',
    });

    logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`${APP_NAME} Backend running on port ${port}`);
  logger.log(`API available at http://localhost:${port}/${API_PREFIX}`);
}
void bootstrap();
