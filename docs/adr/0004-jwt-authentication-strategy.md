# ADR-0004: JWT Authentication Strategy

## Status

Accepted

## Context

The PMS application requires secure authentication for both internal staff (7 distinct roles: ADMIN, PM, DESIGNER, COPYWRITER, MEDIA, ACCOUNTANT, SALE) and external clients. The authentication system must support:

- **Multiple User Types**: Internal staff with role-based permissions and external clients with limited access
- **Session Management**: Ability to revoke access (logout, forced logout for security)
- **Scalability**: Support for future mobile app and third-party integrations
- **Security**: Protection against common attacks (XSS, CSRF, token theft)
- **User Experience**: Minimal re-authentication for active users

We evaluated three authentication approaches:

1. **Session-Based Authentication**: Server-side sessions stored in database or Redis
2. **JWT (JSON Web Tokens)**: Stateless tokens with claims, signed by server
3. **OAuth2/OpenID Connect**: Delegated authentication with third-party providers

Key considerations:

- Need for stateless authentication to scale horizontally
- Requirement to revoke tokens on logout or security incidents
- Support for access token refresh without re-login
- Protection against token theft and replay attacks

## Decision

We will use **JWT-based authentication** with the following design:

### Token Strategy

- **Access Token**: Short-lived JWT (1 hour expiry) containing user ID, email, and role
- **Refresh Token**: Long-lived JWT (7 days expiry) used to obtain new access tokens
- **Token Storage**: Both tokens stored in httpOnly, secure cookies (not localStorage)
- **Token Blacklisting**: Redis-based blacklist for revoked tokens (logout, security events)

### Implementation Details

**Access Token Claims**:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "PM",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Refresh Token Claims**:
```json
{
  "sub": "user-id",
  "tokenFamily": "uuid-v4",
  "iat": 1234567890,
  "exp": 1235172690
}
```

**Cookie Configuration**:
- `accessToken`: httpOnly, secure, sameSite=strict, maxAge=1h
- `refreshToken`: httpOnly, secure, sameSite=strict, maxAge=7d

**Token Blacklisting**:
- Store revoked tokens in Redis with TTL matching token expiry
- Check blacklist on every authenticated request
- Clear family tokens on refresh token reuse (rotation attack detection)

### Authentication Flow

1. **Login**: User provides credentials → Server validates → Returns access + refresh tokens in cookies
2. **Authenticated Request**: Client sends cookies → Server verifies access token → Allows access
3. **Token Refresh**: Access token expires → Client sends refresh token → Server issues new access token
4. **Logout**: Client requests logout → Server blacklists both tokens → Clears cookies

## Consequences

### Positive

- **Stateless Verification**: No database lookup required to verify access token (fast)
- **Horizontal Scalability**: Tokens can be verified by any server instance
- **Mobile-Ready**: Can use tokens in Authorization header for mobile apps
- **Fine-Grained Expiry**: Short access token expiry limits damage from token theft
- **httpOnly Cookies**: Prevents XSS attacks from stealing tokens
- **Refresh Rotation**: Reduces risk of long-term token compromise

### Negative

- **Redis Dependency**: Requires Redis for token blacklisting (operational complexity)
- **Revocation Delay**: Revoked access tokens remain valid until expiry (max 1 hour)
- **CSRF Risk**: Cookie-based auth requires CSRF protection (mitigated with sameSite=strict)
- **Storage Overhead**: Blacklist grows with user activity (mitigated with TTL)
- **Token Size**: JWT claims increase cookie size compared to session IDs

### Neutral

- **Logout UX**: Users must wait up to 1 hour for forced logout to take effect (acceptable for business apps)
- **Token Refresh Flow**: Requires client-side logic to handle token refresh (standard pattern)

## Security Measures

### Token Theft Mitigation

1. **httpOnly Cookies**: Prevents JavaScript access to tokens (XSS protection)
2. **Secure Flag**: Ensures tokens only sent over HTTPS
3. **sameSite=strict**: Prevents CSRF attacks
4. **Short Expiry**: Limits window of opportunity for stolen access tokens
5. **Token Rotation**: Refresh tokens rotated on each use

### Token Reuse Detection

- Track token family ID in refresh tokens
- If refresh token reused, blacklist entire token family
- Forces re-authentication for all sessions of that user

### Rate Limiting

- Limit login attempts per IP (5 attempts per 15 minutes)
- Limit refresh token requests (10 per hour)
- Prevent brute force attacks

## Alternatives Considered

### Session-Based Authentication
- **Pros**: Easy to revoke, server controls all state
- **Cons**: Requires session store (database/Redis), less scalable, not suitable for APIs
- **Reason Not Chosen**: Doesn't scale horizontally, requires sticky sessions or shared session store

### OAuth2/OpenID Connect
- **Pros**: Industry standard, delegated authentication, SSO support
- **Cons**: Complex setup, requires identity provider, overkill for internal app
- **Reason Not Chosen**: Unnecessary complexity for internal staff authentication

## Related Decisions

- ADR-0002: NestJS Framework Selection (NestJS Passport integration for JWT)
- ADR-0001: Clean Architecture Pattern (Auth logic in Application layer)

## Notes

### Implementation Using NestJS

- `@nestjs/jwt`: JWT signing and verification
- `@nestjs/passport`: Passport.js integration
- `passport-jwt`: JWT strategy for Passport
- `@nestjs/throttler`: Rate limiting for login endpoints

### Redis Schema for Blacklist

```
Key: `blacklist:access:{tokenId}` | Value: `1` | TTL: 1 hour
Key: `blacklist:refresh:{tokenId}` | Value: `1` | TTL: 7 days
Key: `blacklist:family:{familyId}` | Value: `1` | TTL: 7 days
```

### Future Enhancements

- Add support for OAuth2 providers (Google, Microsoft) for client login
- Implement device tracking and suspicious login detection
- Add support for API keys for third-party integrations
- Consider shorter access token expiry (15 minutes) for higher security environments

The JWT strategy balances security, performance, and user experience while providing a clear path for future enhancements.
