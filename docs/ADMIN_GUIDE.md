# BC Agency PMS - Admin Operations Guide

## Table of Contents

1. [User Management](#user-management)
2. [Client Management](#client-management)
3. [System Settings](#system-settings)
4. [Audit Logs](#audit-logs)
5. [Data Migration](#data-migration)
6. [Security & Permissions](#security--permissions)
7. [Maintenance Tasks](#maintenance-tasks)

---

## User Management

### Access Control

Only **SUPER_ADMIN** and **ADMIN** roles can access user management.

**Role Hierarchy:**
- **SUPER_ADMIN**: Full system access, can manage admins
- **ADMIN**: System administration, cannot manage SUPER_ADMIN
- **PM**: Project Manager - create/manage projects
- **PLANNER**: Project planning
- **ACCOUNT**: Client account management
- **DESIGNER**: Design tasks
- **DEVELOPER**: Development tasks
- **NVKD**: Business staff - approval authority

### Viewing Users

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role (SUPER_ADMIN, ADMIN, PM, etc.)
- `isActive` - Filter by status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response includes:**
- User ID, email, name
- Role and status
- Avatar URL
- Created date
- Last login timestamp

### Creating Users

**Endpoint:** `POST /api/admin/users`

**Required Fields:**
- `email` - Unique email address
- `name` - Full name
- `password` - Minimum 8 characters
- `role` - User role (SUPER_ADMIN, ADMIN, PM, etc.)

**Validation Rules:**
- Email must be unique
- Password hashed with bcrypt (10 rounds)
- Only SUPER_ADMIN can create ADMIN users
- Action logged to audit log

**Example Request:**
```json
{
  "email": "user@bcagency.com",
  "name": "John Doe",
  "password": "SecurePass123!",
  "role": "PM"
}
```

### Updating Users

**Endpoint:** `PATCH /api/admin/users/:id`

**Updateable Fields:**
- `name` - Update display name
- `role` - Change user role
- `isActive` - Activate/deactivate user

**Restrictions:**
- Only SUPER_ADMIN can change to/from ADMIN role
- Cannot change email address
- Password changes require separate reset endpoint

### Deactivating Users

**Endpoint:** `PATCH /api/admin/users/:id/deactivate`

**Effects:**
- User cannot log in
- Existing sessions invalidated
- User data preserved
- Can be reactivated later

**Restrictions:**
- Users cannot deactivate themselves
- Only SUPER_ADMIN can deactivate ADMIN users
- Action logged to audit log

### Password Reset

**Endpoint:** `POST /api/admin/users/:id/reset-password`

**Process:**
1. System generates cryptographically secure temporary password
2. Password hashed and stored
3. Temporary password returned to admin
4. Admin must securely communicate password to user
5. User should change password on first login

**Security Notes:**
- Uses `crypto.randomBytes()` for secure generation
- 12 characters: letters (no ambiguous), numbers, symbols
- Only SUPER_ADMIN can reset ADMIN passwords
- Action logged to audit log

---

## Client Management

### Client Portal Access

Clients have limited access to:
- View their projects only
- View project files
- Comment on tasks
- Submit approval requests

### Creating Client Accounts

**Endpoint:** `POST /api/admin/clients`

**Required Fields:**
- `email` - Client email (unique)
- `password` - Initial password
- `companyName` - Company name
- `contactName` - Primary contact name
- `phone` - Contact phone number
- `address` - Company address (optional)
- `taxCode` - Tax ID (optional)

**Example Request:**
```json
{
  "email": "client@company.com",
  "password": "TempPass123!",
  "companyName": "ABC Corporation",
  "contactName": "Jane Smith",
  "phone": "+84-123-456-789",
  "address": "123 Main St, Hanoi",
  "taxCode": "0123456789"
}
```

### Updating Clients

**Endpoint:** `PATCH /api/admin/clients/:id`

**Updateable Fields:**
- Company information
- Contact details
- Active status

### Viewing Client Projects

**Endpoint:** `GET /api/admin/clients/:id/projects`

Returns all projects associated with the client.

### Deactivating Clients

**Endpoint:** `PATCH /api/admin/clients/:id/deactivate`

**Effects:**
- Client cannot access portal
- Projects remain visible to internal staff
- Can be reactivated

---

## System Settings

### Environment Configuration

**Critical Settings (`.env.production`):**

```bash
# Application
NODE_ENV=production
DOMAIN=pms.bcagency.com
FRONTEND_URL=https://pms.bcagency.com
API_URL=https://pms.bcagency.com/api

# Security
JWT_SECRET=<64-character-secret>  # Generate: openssl rand -base64 64
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_SECRET=<32-character>  # Generate: openssl rand -base64 32
ENCRYPTION_SALT=<16-character>    # Generate: openssl rand -base64 16

# Database
POSTGRES_USER=bc_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=bc_pms
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# MinIO Storage
MINIO_ACCESS_KEY=<strong-key>
MINIO_SECRET_KEY=<strong-secret>
MINIO_BUCKET=bc-agency-files
MINIO_PUBLIC_URL=https://pms.bcagency.com/storage

# Notifications
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_ALERT_CHAT_ID=<chat-id>

# Rate Limiting
RATE_LIMIT_TTL=60       # Seconds
RATE_LIMIT_MAX=100      # Requests per TTL
```

### Application Settings

**Endpoint:** `GET/PATCH /api/admin/settings`

**Configurable Settings:**
- System name and branding
- Email templates
- Notification preferences
- Default project stages
- File upload limits
- Session timeout

### Notification Configuration

**Telegram Integration:**
1. Create bot via @BotFather
2. Get bot token
3. Add bot to alert channel
4. Get chat ID
5. Update environment variables
6. Restart backend service

**Notification Types:**
- New approval requests
- Deadline approaching
- Project status changes
- System errors and alerts

---

## Audit Logs

### Viewing Audit Logs

**Endpoint:** `GET /api/admin/audit-logs`

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action type
- `entityType` - Filter by entity (User, Project, Task, etc.)
- `startDate` / `endDate` - Date range
- `page` / `limit` - Pagination

**Logged Actions:**
- `CREATE_USER` - User account created
- `UPDATE_USER` - User details updated
- `DEACTIVATE_USER` - User deactivated
- `RESET_PASSWORD` - Password reset
- `LOGIN` - User login
- `LOGOUT` - User logout
- `CREATE_PROJECT` - Project created
- `UPDATE_PROJECT` - Project updated
- `DELETE_PROJECT` - Project archived
- `APPROVE_APPROVAL` - Approval approved
- `REJECT_APPROVAL` - Approval rejected

**Log Entry Structure:**
```json
{
  "id": "log-id",
  "userId": "user-id",
  "action": "CREATE_USER",
  "entityType": "User",
  "entityId": "entity-id",
  "metadata": {},
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-01-23T10:00:00Z"
}
```

### Audit Log Retention

**Default Policy:**
- Logs retained for 1 year
- Critical actions retained indefinitely
- Automatic archival to cold storage after 90 days

**Compliance:**
- Logs immutable (cannot be modified/deleted by admins)
- Access logged
- Regular backup

---

## Data Migration

### Database Backup

**Manual Backup:**
```bash
# SSH into server
ssh admin@pms.bcagency.com

# Create backup
docker exec bc-postgres-prod pg_dump -U bc_user bc_pms > /backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /backups/backup_*.sql
```

**Automated Backup:**
- Daily backup at 2 AM (configured in cron)
- Retention: 30 daily, 12 monthly
- Stored in `/backups` volume
- Synced to remote storage (AWS S3/GCS)

### Database Restore

**From Backup:**
```bash
# Stop backend service
docker-compose -f docker-compose.prod.yml stop backend

# Restore database
gunzip -c /backups/backup_20260123.sql.gz | docker exec -i bc-postgres-prod psql -U bc_user -d bc_pms

# Restart services
docker-compose -f docker-compose.prod.yml start backend
```

**Verification:**
1. Check data integrity
2. Verify user login
3. Test critical operations
4. Check audit logs

### File Storage Migration

**MinIO Backup:**
```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# Configure alias
mc alias set bcminio http://localhost:9000 minioadmin minioadmin

# Mirror bucket to backup location
mc mirror bcminio/bc-agency-files /backups/files/
```

**Restore Files:**
```bash
mc mirror /backups/files/ bcminio/bc-agency-files
```

### Data Export

**Export Projects (CSV/Excel):**
```bash
# Export all projects
curl -H "Authorization: Bearer <admin-token>" \
  https://pms.bcagency.com/api/admin/export/projects \
  -o projects_export.xlsx
```

**Export Users:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  https://pms.bcagency.com/api/admin/export/users \
  -o users_export.xlsx
```

### Data Import

**Bulk Import Users:**
1. Prepare CSV file with columns: email, name, role, password
2. Upload via Admin Panel → Import Users
3. System validates data
4. Preview import
5. Confirm import
6. Users created with encrypted passwords

**Bulk Import Projects:**
1. Prepare Excel template
2. Upload via Admin Panel → Import Projects
3. Validate data
4. Map fields
5. Confirm import

---

## Security & Permissions

### Role-Based Access Control (RBAC)

**Permission Matrix:**

| Feature | SUPER_ADMIN | ADMIN | PM | PLANNER | ACCOUNT | DESIGNER | DEVELOPER | NVKD |
|---------|-------------|-------|-----|---------|---------|----------|-----------|------|
| Manage Admins | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Clients | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Create Projects | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View All Projects | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit Project | ✓ | ✓ | PM only | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create Tasks | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve Requests | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| View Audit Logs | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| System Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Authentication Security

**JWT Configuration:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- HttpOnly cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)

**Password Policy:**
- Minimum 8 characters
- Bcrypt hashing (10 rounds)
- No password in logs/responses
- Temporary passwords expire on first login

**Session Management:**
- Redis-based session storage
- Automatic logout after 24h inactivity
- Single logout invalidates all sessions
- Concurrent session limit: 3 per user

### Rate Limiting

**Default Limits:**
- Authentication endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- File upload: 10 requests/minute

**Configuration:**
```env
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

**Bypass:**
- Admins can whitelist IPs
- Trusted services can use API keys

### Security Headers

**Nginx Configuration:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; ..." always;
```

---

## Maintenance Tasks

### Regular Maintenance

**Daily Tasks:**
- Monitor disk space
- Check error logs
- Review failed login attempts
- Verify backup completion

**Weekly Tasks:**
- Review audit logs
- Check system performance
- Update security patches
- Clean temporary files

**Monthly Tasks:**
- Database optimization
- Review user access
- Security audit
- Capacity planning

### Database Maintenance

**Vacuum Database (PostgreSQL):**
```bash
docker exec bc-postgres-prod vacuumdb -U bc_user -d bc_pms --analyze
```

**Reindex:**
```bash
docker exec bc-postgres-prod reindexdb -U bc_user -d bc_pms
```

**Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size('bc_pms'));
```

### Redis Cache Maintenance

**Clear Cache:**
```bash
docker exec bc-redis-prod redis-cli -a <password> FLUSHDB
```

**Monitor Memory:**
```bash
docker exec bc-redis-prod redis-cli -a <password> INFO memory
```

### MinIO Maintenance

**Check Storage:**
```bash
mc admin info bcminio
```

**Clean Incomplete Uploads:**
```bash
mc admin heal -r bcminio/bc-agency-files
```

### Log Management

**View Backend Logs:**
```bash
docker logs -f bc-backend-prod --tail 100
```

**View Nginx Logs:**
```bash
docker logs -f bc-nginx-prod --tail 100
```

**Rotate Logs:**
- Configured in docker-compose
- Daily rotation
- Keep 30 days
- Compress old logs

### Monitoring Alerts

**Health Checks:**
- Backend: `https://pms.bcagency.com/api/health`
- Database: PostgreSQL healthcheck
- Redis: Redis ping
- MinIO: MinIO ready check

**Telegram Alerts:**
- Service down
- High CPU/memory usage
- Disk space low (>80%)
- Failed backups
- Security incidents

---

## Troubleshooting

### Common Issues

**Issue: Users cannot log in**
- Check user `isActive` status
- Verify password not expired
- Check rate limiting
- Review audit logs for lockout

**Issue: File upload fails**
- Check MinIO service status
- Verify bucket exists
- Check file size limit (50MB)
- Review MinIO logs

**Issue: Slow performance**
- Check database connections
- Review slow query log
- Check Redis cache hit rate
- Monitor server resources

**Issue: Email notifications not sending**
- Verify SMTP configuration
- Check email queue
- Review email service logs

### Support Escalation

**Level 1:** Admin Panel diagnostics
**Level 2:** SSH access, log review
**Level 3:** Database direct access
**Level 4:** Developer intervention

---

## Contact

**Technical Support:**
- Email: tech@bcagency.com
- Telegram: @bcagency_tech
- Emergency: +84-xxx-xxx-xxx

**System Administrator:**
- admin@bcagency.com

---

**Version:** 1.0.0
**Last Updated:** 2026-01-23
