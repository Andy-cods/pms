# Scout Report: Docker Compose Production Patterns - BC Agency PMS

**Date:** 2026-01-22  
**Status:** Complete  
**Scope:** Docker infrastructure setup for Phase 1 Foundation

---

## 1. Files to Create & Locations

```
project-root/
├── docker-compose.yml                    # Main orchestration
├── docker-compose.override.yml           # Dev overrides (auto-loaded)
├── docker-compose.prod.yml               # Production config
├── .dockerignore                         # Build exclusions
├── .env.example                          # Template
├── .env.development                      # Dev values
├── backend/
│   └── Dockerfile                        # Node 20-alpine
├── frontend/
│   └── Dockerfile                        # Node 20-alpine, Next.js build
├── nginx/
│   ├── nginx.conf                        # Reverse proxy config
│   └── ssl/                              # SSL certs placeholder
├── certbot/
│   ├── conf/                             # Let's Encrypt certs
│   └── www/                              # ACME challenge
├── monitoring/                           # For Phase 2+ (optional)
│   ├── prometheus/
│   ├── grafana/
│   └── alertmanager/
└── backups/                              # PostgreSQL backups
```

---

## 2. Core Services Setup

### Database (PostgreSQL 16-alpine)
- **Port:** 5432 (internal: postgres:5432)
- **Healthcheck:** `pg_isready` every 10s
- **Volume:** `postgres_data:/var/lib/postgresql/data` (persistent)
- **Backup mount:** `./backups:/backups`
- **Credentials:** From `.env` (bc_user, bc_password)

### Cache (Redis 7-alpine)
- **Port:** 6379 (internal: redis:6379)
- **Healthcheck:** `redis-cli ping` every 10s
- **Volume:** `redis_data:/data` with AOF persistence
- **Command:** `redis-server --appendonly yes`

### File Storage (MinIO)
- **Port:** 9000 (API), 9001 (Console)
- **Healthcheck:** MinIO health endpoint every 30s
- **Volume:** `minio_data:/data` (persistent)
- **Credentials:** From `.env` (MINIO_ROOT_USER/PASSWORD)
- **Console:** Accessible via `/minio-console/` through Nginx

### Backend (NestJS)
- **Port:** 3001 (internal: backend:3001)
- **Build:** `context: ./backend dockerfile: Dockerfile`
- **Depends on:** postgres, redis (with healthchecks)
- **Env vars:** DATABASE_URL, REDIS_URL, MINIO_*, JWT_SECRET, TELEGRAM_BOT_TOKEN
- **Restart:** unless-stopped

### Frontend (Next.js)
- **Port:** 3000 (internal: frontend:3000)
- **Build:** `context: ./frontend dockerfile: Dockerfile`
- **Depends on:** backend
- **Env vars:** NEXT_PUBLIC_API_URL (http://backend:3001), NEXT_PUBLIC_MINIO_URL
- **Restart:** unless-stopped

### Reverse Proxy (Nginx-alpine)
- **Port:** 80, 443 (external)
- **Config:** `./nginx/nginx.conf` (read-only)
- **SSL:** Let's Encrypt via Certbot
- **Rate limiting:** 10r/s (general API), 5r/m (auth endpoints)
- **Client body size:** 20MB (file uploads)
- **Security headers:** HSTS, X-Frame-Options, X-Content-Type-Options

### SSL Certificate (Certbot)
- **Image:** certbot/certbot
- **Mode:** Auto-renewal every 12h
- **Volumes:** Shared with Nginx
- **Domain:** pms.bcagency.com (configurable)

---

## 3. Environment Variables Required

```bash
# .env (NEVER commit to git)
NODE_ENV=production
DATABASE_URL=postgresql://bc_user:bc_password@postgres:5432/bc_pms
REDIS_URL=redis://redis:6379

MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_ENDPOINT=minio
MINIO_PORT=9000

JWT_SECRET=your-256-char-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
NEXT_PUBLIC_API_URL=http://backend:3001
NEXT_PUBLIC_MINIO_URL=http://minio:9000
GRAFANA_PASSWORD=admin123
```

---

## 4. Recommended Deployment Order

1. **Infrastructure Layer**
   - `docker-compose up -d postgres redis` → Wait for healthchecks
   - `docker-compose up -d minio` → Verify console at :9001
   - Verify volumes created: `docker volume ls`

2. **Application Layer**
   - `docker-compose up -d backend` → Verify logs, health
   - `docker-compose up -d frontend` → Build & run
   - Test via `curl localhost:3000` (should redirect to Nginx)

3. **Reverse Proxy & SSL**
   - `docker-compose up -d nginx` → Verify routing
   - `docker-compose up -d certbot` → Initial cert issue
   - Monitor Certbot logs for renewal

4. **Verification**
   ```bash
   docker-compose ps                           # All healthy?
   docker-compose logs -f backend              # No errors?
   curl -H "Host: pms.bcagency.com" localhost # Frontend ok?
   ```

---

## 5. Production Patterns Implemented

- **Health checks:** All services have defined healthchecks
- **Volume persistence:** Named volumes for data services
- **Network isolation:** Custom `bc-agency-net` bridge network
- **Restart policy:** `unless-stopped` for auto-recovery
- **Environment variables:** Externalized, not hardcoded
- **Compose file override:** `compose.override.yml` for dev/prod split
- **Logging:** Default JSON driver with size limits (add to service)
- **SSL/TLS:** Let's Encrypt via Certbot with auto-renewal
- **Rate limiting:** Nginx configured per endpoint
- **File upload:** Max 20MB via Nginx `client_max_body_size`

---

## 6. Commands Reference

```bash
# Development
docker-compose up                           # Includes override.yml
docker-compose up -d                        # Background

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Maintenance
docker-compose down                         # Stop & remove containers
docker-compose down -v                      # Also remove volumes
docker-compose ps                           # Service status
docker-compose logs -f [service]            # Stream logs
docker-compose exec postgres psql -U bc_user  # Database shell
docker-compose restart backend              # Restart service
```

---

## Notes

- **Windows Users:** Use WSL2 backend for Docker Desktop (volume performance)
- **Secrets:** Never commit `.env` → use `.env.example` template
- **Backups:** Implement `pg_dump` in backup volume weekly
- **Monitoring:** Phase 2+ will add Prometheus/Grafana via `docker-compose.monitoring.yml`
- **Database Migrations:** Run `npm run prisma:migrate` inside backend container
- **Certificate:** First run may take 5-10m for Let's Encrypt validation

