# Scout Report: Authentication System Implementation
**Date:** 2026-01-22  
**Project:** BC Agency PMS (Project Management System)  
**Phase:** Phase 2 - Core Features - Week 2

## Executive Summary

BC Agency PMS has solid foundational scaffolding with all auth dependencies installed. Week 1 established Docker, NestJS backend, Next.js frontend, and Prisma schema. Week 2 requires implementing JWT authentication across backend and frontend. All infrastructure supports auth but implementation layer is missing.

## Current State Inventory

### Backend (NestJS)

**Auth Dependencies Installed:**
- @nestjs/jwt@^11.0.2
- @nestjs/passport@^11.0.5
- passport@^0.7.0
- passport-jwt@^4.0.1
- bcrypt@^6.0.0

**Auth Module Structure:**
- Location: backend/src/modules/auth/auth.module.ts
- Status: Empty scaffold
- File size: 10 lines, no providers/controllers

**Presentation Layer:**
- Guards: backend/src/presentation/guards/index.ts (empty)
- Decorators: backend/src/presentation/decorators/index.ts (empty)
- Controllers: barrel exists

**Shared Infrastructure:**
- Constants: backend/src/shared/constants/index.ts (APP_NAME, API_VERSION, API_PREFIX only)
- Decorators: empty
- Exceptions: empty
- Utils: empty
- DTOs: empty

**Database Schema (Prisma):**
- User model complete: id, email, password, name, avatar, role, isActive, lastLoginAt
- Session model: id, userId, token, expiresAt, userAgent, ipAddress
- UserRole enum: 9 roles (SUPER_ADMIN, ADMIN, TECHNICAL, NVKD, PM, PLANNER, ACCOUNT, CONTENT, DESIGN, MEDIA)
- Location: backend/prisma/schema.prisma

**Configuration:**
- CORS enabled for frontend
- Global ValidationPipe configured
- Port: 3001
- API prefix: 'api'
- JWT_SECRET configured in .env.development
- JWT_EXPIRES_IN: 1h
- JWT_REFRESH_EXPIRES_IN: 7d

### Frontend (Next.js)

**Auth Dependencies:**
- zustand@^5.0.10 - State management
- axios@^1.13.2 - HTTP client
- @tanstack/react-query@^5.90.19 - Query management
- Missing: jwt-decode

**Auth Store (Zustand):**
- Location: frontend/src/stores/auth/index.ts
- State: user, accessToken, refreshToken, isAuthenticated, isLoading
- Persistence: Enabled ('auth-storage' key)
- Methods: setUser, setTokens, login, logout, setLoading

**API Client:**
- Location: frontend/src/lib/api/index.ts
- Base URL: http://localhost:3001/api
- Request interceptor: Adds Bearer token from localStorage
- Response interceptor: 401 redirects to login (incomplete refresh logic)

**Types:**
- Location: frontend/src/types/index.ts
- User: id, email, fullName, role, avatarUrl, createdAt
- UserRole enum: SUPER_ADMIN, ADMIN, MANAGER, TEAM_LEAD, SENIOR, MEMBER, INTERN, FREELANCER, CLIENT, VIEWER
- Issue: Mismatches backend enum (9 roles vs 10)

**Layout:**
- Location: frontend/src/app/layout.tsx
- No auth-specific layout groups
- No AuthProvider

**Environment:**
- NEXT_PUBLIC_API_URL configured

## Gaps & Missing Implementation

### Backend Gaps

1. PrismaService - Database access layer
2. JWT Strategy - Passport JWT configuration
3. Auth Guards - JwtAuthGuard, RoleGuard
4. Auth Decorators - @CurrentUser(), @Roles()
5. Auth Controller - login, register, refresh endpoints
6. Auth Service - credential validation, token generation
7. DTOs - LoginDto, RegisterDto, RefreshTokenDto, AuthResponseDto
8. Custom Exceptions - UnauthorizedException, InvalidCredentialsException
9. Password Utils - hash, verify functions
10. UserService - CreateUser, FindByEmail

### Frontend Gaps

1. UserRole enum alignment with backend
2. API Hooks - useLogin, useRegister, useRefresh, useLogout
3. Protected Route component
4. Auth Provider - session initialization
5. Login page
6. Auth pages layout group (auth)
7. JWT decode utility
8. Token refresh logic in interceptor
9. jwt-decode dependency

## Existing Patterns

### Backend
- Clean Architecture (Domain, Application, Infrastructure, Presentation)
- Module-based organization with barrel files
- Global validation pipe
- CORS configured
- Environment-based configuration
- Prisma ORM ready

### Frontend
- Zustand state with persistence
- Axios with interceptors
- React Query ready
- Tailwind CSS with utilities
- Vietnamese locale formatting

## Recommended Implementation

**Backend (Days 1-4):**
1. PrismaService (30 min)
2. JWT Strategy (30 min)
3. Auth DTOs (1 hour)
4. Password utilities (1 hour)
5. AuthService (2 hours)
6. AuthController (1.5 hours)
7. Guards and Decorators (1.5 hours)
8. UserService (1.5 hours)

**Frontend (Day 5):**
1. Fix UserRole enum (30 min)
2. AuthProvider & hooks (1.5 hours)
3. ProtectedRoute (1 hour)
4. Login page (1.5 hours)
5. Enhance interceptor (1 hour)

Total: 14.5 hours estimated

## Backend Files to Create

- backend/src/infrastructure/persistence/prisma.service.ts
- backend/src/infrastructure/strategies/jwt.strategy.ts
- backend/src/application/dto/auth/login.dto.ts
- backend/src/application/dto/auth/register.dto.ts
- backend/src/application/dto/auth/refresh-token.dto.ts
- backend/src/application/dto/auth/auth-response.dto.ts
- backend/src/shared/exceptions/auth.exceptions.ts
- backend/src/shared/utils/password.util.ts
- backend/src/modules/auth/services/auth.service.ts
- backend/src/modules/auth/controllers/auth.controller.ts
- backend/src/presentation/guards/jwt-auth.guard.ts
- backend/src/presentation/guards/role.guard.ts
- backend/src/presentation/decorators/current-user.decorator.ts
- backend/src/presentation/decorators/roles.decorator.ts
- backend/src/modules/users/services/user.service.ts

## Backend Files to Modify

- backend/src/modules/auth/auth.module.ts - Add providers, controllers
- backend/src/app.module.ts - Ensure PrismaService available
- backend/src/shared/constants/index.ts - Add auth constants

## Frontend Files to Create

- frontend/src/hooks/auth/useLogin.ts
- frontend/src/hooks/auth/useRegister.ts
- frontend/src/hooks/auth/useRefresh.ts
- frontend/src/components/auth/ProtectedRoute.tsx
- frontend/src/providers/AuthProvider.tsx
- frontend/src/app/(auth)/layout.tsx
- frontend/src/app/(auth)/login/page.tsx
- frontend/src/types/auth.ts

## Frontend Files to Modify

- frontend/src/types/index.ts - Align UserRole
- frontend/src/lib/api/index.ts - Add token refresh
- frontend/src/app/layout.tsx - Wrap with AuthProvider
- frontend/package.json - Add jwt-decode

## Key Decisions

- Token storage: localStorage with Zustand persistence
- Refresh strategy: Call refresh endpoint on 401
- User roles: Align frontend to backend (9 roles)
- Password hashing: bcrypt 10 rounds
- Session tracking: Populate Session table on login
- Refresh token: 7-day expiry, stored in database

## Unresolved Questions

1. Password strength requirements?
2. 2FA/MFA for Phase 2?
3. OAuth/SSO implementation timeline?
4. Email verification required?
5. Password reset Phase 2 or later?
6. Rate limiting on login?
7. Remember me functionality?
8. Active session invalidation on logout?
9. HttpOnly cookies vs localStorage?
10. Proactive or reactive token refresh?

## Week 2 Completion Checklist

- [ ] PrismaService implemented
- [ ] JWT strategy configured
- [ ] Auth DTOs created with validation
- [ ] AuthService with login/register/refresh
- [ ] AuthController with endpoints
- [ ] Guards and decorators working
- [ ] UserService implemented
- [ ] Frontend UserRole aligned
- [ ] AuthProvider with initialization
- [ ] Protected routes working
- [ ] Login page complete
- [ ] Auth hooks working (useLogin, useRefresh)
- [ ] Token refresh in interceptor
- [ ] Integration tests passing
- [ ] E2E login flow working

