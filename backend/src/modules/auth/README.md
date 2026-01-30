# Authentication & Authorization Module

## Overview

The Auth module implements JWT-based authentication and authorization for the PMS application, supporting both internal staff (7 distinct roles) and external clients. It provides secure, scalable authentication with token blacklisting via Redis and role-based access control (RBAC).

## Architecture

This module is part of the **Infrastructure layer** in Clean Architecture, providing authentication primitives used throughout the application. It integrates with NestJS Passport for strategy-based authentication and uses Redis for token revocation.

**Dependencies:**
- `@nestjs/jwt` - JWT token signing and verification
- `@nestjs/passport` - Passport.js integration
- `passport-jwt` - JWT strategy
- Redis - Token blacklist storage

## Key Components

### Services

**`AuthService`** (`auth.service.ts`)
- Handles login flow for both users and clients
- Generates JWT access and refresh tokens (1h and 7d expiry)
- Implements token refresh mechanism
- Manages logout with token blacklisting
- Validates user credentials with bcrypt
- Tracks login events in audit log

**`TokenBlacklistService`** (`token-blacklist.service.ts`)
- Redis-based token revocation storage
- Stores revoked tokens with TTL matching original token expiry
- Provides `blacklist()` and `isBlacklisted()` methods
- Prevents use of logged-out tokens

### Guards

**`JwtAuthGuard`** (`guards/jwt-auth.guard.ts`)
- Global authentication guard (extends Passport JWT guard)
- Checks token blacklist before validation
- Respects `@Public()` decorator for public endpoints
- Throws `UnauthorizedException` for revoked tokens

**`RolesGuard`** (`guards/roles.guard.ts`)
- Role-based authorization guard
- Works with `@Roles()` decorator
- Supports 7 roles: `SUPER_ADMIN`, `ADMIN`, `PM`, `NVKD`, `PLANNER`, `CONTENT`, `MEDIA`
- Returns `false` if user lacks required role

**`ClientAuthGuard`** (`guards/client-auth.guard.ts`)
- Separate authentication guard for client portal
- Validates JWT tokens with `role: 'CLIENT'`
- Attaches `clientUser` object to request
- Used for client-specific endpoints

### Decorators

**`@Public()`** (`decorators/public.decorator.ts`)
- Marks endpoints as publicly accessible (no authentication required)
- Bypasses `JwtAuthGuard` when applied
- Example: Login, health check endpoints

**`@Roles(...roles)`** (`decorators/roles.decorator.ts`)
- Declares required roles for endpoint access
- Used with `RolesGuard`
- Example: `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`

## API Endpoints

### POST `/auth/login`
**Description:** Authenticate user with email and password
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PM",
    "avatar": "https://...",
    "isActive": true
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### POST `/auth/client/login`
**Description:** Authenticate client with access code
**Request Body:**
```json
{
  "accessCode": "CLIENT-ACCESS-CODE-123"
}
```

### POST `/auth/refresh`
**Description:** Refresh access token using refresh token
**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### POST `/auth/logout`
**Description:** Logout user and blacklist tokens
**Headers:** `Authorization: Bearer {accessToken}`

## Business Rules & Domain Logic

### Authentication Flow
1. User provides credentials (email/password or accessCode)
2. Service validates credentials against database
3. Service checks if account is active (`isActive: true`)
4. Service generates JWT access token (1h expiry) and refresh token (7d expiry)
5. Service updates `lastLoginAt` timestamp
6. Service logs authentication event in audit log
7. Tokens returned in response (recommended: store in httpOnly cookies)

### Token Lifecycle
- **Access Token:** Short-lived (1 hour), used for API requests
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens
- **Token Payload:**
  ```typescript
  {
    sub: string;      // User ID
    email: string;    // User email
    role: string;     // User role (or 'CLIENT')
    type: 'access' | 'refresh';
    iat: number;      // Issued at
    exp: number;      // Expiry
  }
  ```

### Token Blacklisting
- On logout, token is added to Redis blacklist with TTL = remaining expiry time
- `JwtAuthGuard` checks blacklist before allowing request
- Blacklisted tokens cannot be used even if not expired
- Prevents unauthorized access after logout

### Role Hierarchy
```
SUPER_ADMIN (highest privilege)
  └── ADMIN
      └── PM (Project Manager)
          └── NVKD (Sales)
              └── PLANNER
                  └── CONTENT
                      └── MEDIA (lowest privilege)
```

### Authorization Patterns
```typescript
// Public endpoint (no auth required)
@Public()
@Get('health')
async health() { ... }

// Authenticated endpoint (any logged-in user)
@Get('profile')
async getProfile(@Req() req) { ... }

// Role-restricted endpoint
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Delete('users/:id')
async deleteUser() { ... }
```

## Security Features

### CSRF Protection
- Recommended: Use `sameSite=strict` cookies for token storage
- Prevents cross-site request forgery attacks

### Token Theft Mitigation
- Short access token expiry (1h) limits damage window
- Token rotation on refresh prevents long-term compromise
- httpOnly cookies prevent XSS token theft

### Rate Limiting
- Login attempts should be rate-limited (5 attempts per 15 min)
- Refresh token requests limited (10 per hour)
- Implemented at infrastructure/middleware level

### Audit Logging
All authentication events logged to `AuditLog` table:
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt (invalid credentials)
- `LOGOUT` - User logout

## Dependencies

### Internal Dependencies
- `PrismaService` - Database access for user/client lookups
- `ConfigService` - JWT secret and expiry configuration
- `TokenBlacklistService` - Redis-based token revocation

### External Dependencies
- `@nestjs/jwt` - JWT token operations
- `@nestjs/passport` - Authentication strategy framework
- `bcrypt` - Password hashing and comparison
- Redis - Token blacklist storage

## Related ADRs

- **ADR-0004: JWT Authentication Strategy** - Complete authentication architecture and security design
- **ADR-0001: Clean Architecture Pattern** - Auth as infrastructure layer
- **ADR-0002: NestJS Framework Selection** - Passport.js integration

## Usage Examples

### Protecting an Endpoint
```typescript
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {

  @Get()
  @Roles(UserRole.PM, UserRole.ADMIN)
  async listProjects(@Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    // ...
  }
}
```

### Creating a Public Endpoint
```typescript
@Controller('health')
export class HealthController {

  @Get()
  @Public()
  async check() {
    return { status: 'ok' };
  }
}
```

### Accessing Current User
```typescript
@Get('profile')
async getProfile(@Req() req: RequestWithUser) {
  // req.user contains:
  // { id, email, name, role, isActive, avatar }
  return req.user;
}
```

## Configuration

Required environment variables:
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
```
