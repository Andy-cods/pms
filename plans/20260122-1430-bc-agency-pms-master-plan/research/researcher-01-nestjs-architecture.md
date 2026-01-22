# NestJS Clean Architecture Research - PMS System
**Date:** 2026-01-22 | **Focus:** Backend Architecture for Project Management System

---

## 1. NestJS Module Organization (Clean Architecture)

**Standard Layered Structure per Module:**
```
src/
├── modules/
│   ├── projects/
│   │   ├── domain/           # Business logic, entities, rules
│   │   ├── application/      # Use cases, DTOs, business orchestration
│   │   ├── infrastructure/   # Prisma repos, external integrations
│   │   └── presentation/     # Controllers, HTTP handling
│   ├── tasks/
│   ├── users/
│   └── auth/
├── common/                    # Shared utilities, constants
└── shared/                    # Reusable services, guards, interceptors
```

**Key Principle:** Domain layer has zero external dependencies; application layer depends on domain; infrastructure implements contracts defined in domain.

**Reference:** Clean Architecture implementations widely adopted ([GitHub: wesleey/nest-clean-architecture](https://github.com/wesleey/nest-clean-architecture), [Medium: Nairi Abgaryan](https://medium.com/@nairi.abgaryan/stop-the-chaos-clean-folder-file-naming-guide-for-backend-nest-js-and-node-331fdc6400cb))

---

## 2. Prisma ORM Integration Patterns

**Service Abstraction Pattern:**
```typescript
// prisma.service.ts
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect(); }
  async enableShutdownHooks(app: INestApplication) {
    app.enableShutdownHooks();
    this.$on('beforeExit', async () => { await this.$disconnect(); });
  }
}

// project.repository.ts - Implement domain interface
@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private prisma: PrismaService) {}
  async findById(id: string): Promise<Project> {
    return this.prisma.project.findUnique({ where: { id } });
  }
}
```

**Best Practices:**
- Create repository pattern layer abstracting Prisma queries
- Leverage Prisma's type safety with auto-generated types
- Use runtime configuration for multi-environment setups (Prisma v5+)
- Implement soft deletes via Prisma middleware or application logic

**Reference:** [Prisma NestJS Guide](https://www.prisma.io/docs/guides/nestjs), [NestJS Recipes](https://docs.nestjs.com/recipes/prisma)

---

## 3. Authentication/Authorization (JWT + RBAC)

**Guard Execution Flow:**
```typescript
// auth.guard.ts - Validates JWT token
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    const payload = this.jwtService.verify(token);
    request.user = payload; // User available in controller
    return true;
  }
}

// roles.guard.ts - Validates user roles
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// usage
@Post()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'PROJECT_MANAGER')
createProject(@Body() dto: CreateProjectDto) { }
```

**RBAC Strategy:** Store roles in JWT payload; validate against required roles before route execution; avoid database calls in guards for performance.

**Reference:** [Permit.io RBAC Guide](https://www.permit.io/blog/how-to-protect-a-url-inside-a-nestjs-app-using-rbac-authorization), [DEV: Role-Based Access Control](https://dev.to/luffy_p1r4t3/role-based-access-control-in-nestjs-2cl2)

---

## 4. File Upload with MinIO Integration

**Recommended Implementation Pattern:**
```typescript
// minio.service.ts
@Injectable()
export class MinioService {
  private client: Client;

  constructor(private config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get('MINIO_ENDPOINT'),
      port: this.config.get('MINIO_PORT'),
      useSSL: this.config.get('MINIO_USE_SSL'),
      accessKey: this.config.get('MINIO_ACCESS_KEY'),
      secretKey: this.config.get('MINIO_SECRET_KEY'),
    });
  }

  async uploadFile(bucket: string, filename: string, file: Express.Multer.File) {
    await this.client.putObject(bucket, filename, file.buffer, file.size);
  }

  async getPresignedUrl(bucket: string, filename: string, expiry = 3600) {
    return this.client.presignedGetObject(bucket, filename, expiry);
  }
}

// file-upload.controller.ts
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  const filename = `${Date.now()}-${file.originalname}`;
  await this.minioService.uploadFile('projects', filename, file);
  return { url: await this.minioService.getPresignedUrl('projects', filename) };
}
```

**Key Points:** AWS SDK S3Client pointed at MinIO endpoint improves compatibility; generate unique filenames with timestamps; use presigned URLs for secure downloads.

**Reference:** [Dev.to: MinIO Integration](https://dev.to/manuchehr/minio-integration-with-nestjs-file-upload-retrieve-f41), [GitHub: nestjs-minio](https://github.com/efd1006/nestjs-file-upload-minio)

---

## 5. Monorepo Structure (Frontend + Backend)

**Turborepo + pnpm Workspace Setup (Recommended 2025):**
```
pms-monorepo/
├── apps/
│   ├── backend/          # NestJS @pms/backend
│   ├── frontend/         # Next.js @pms/frontend
├── packages/
│   ├── shared-types/     # Common TypeScript types, enums
│   ├── api-client/       # Generated fetch client from backend
│   └── ui-components/    # Shared React components
├── turbo.json            # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

**Turborepo Benefits:** Incremental builds with task caching, parallel execution across apps, remote caching for CI/CD pipelines, dependency graph visualization.

**Workspace Communication:** Use shared-types package for DTOs; generate API client from NestJS Swagger/OpenAPI; monorepo allows atomic commits across frontend-backend changes.

**Reference:** [DEV: Next.js + NestJS Monorepo](https://dev.to/shaqdeff/how-to-setup-a-nextjs-and-nestjs-monorepo-for-dummies-176f), [GitHub: vndevteam/nestjs-turbo](https://github.com/vndevteam/nestjs-turbo)

---

## Implementation Roadmap

1. **Phase 1:** Scaffold NestJS with modular structure, setup Prisma with PostgreSQL
2. **Phase 2:** Implement JWT auth, RBAC guards, role seeding
3. **Phase 3:** MinIO integration for file uploads (avatars, attachments, documents)
4. **Phase 4:** Setup Turborepo monorepo, share types between frontend/backend
5. **Phase 5:** Implement observability (Prometheus), API documentation (Swagger)

---

## Unresolved Considerations

- Database choice: PostgreSQL (relational) vs MongoDB (document-based) - impacts Prisma schema design
- API style: REST vs GraphQL - affects controller/resolver structure
- Event handling strategy for async operations (tasks, notifications)
- Testing strategy for integration tests with Prisma mocks
