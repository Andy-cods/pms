# BC Agency PMS - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [SSL Setup](#ssl-setup)
5. [Monitoring Setup](#monitoring-setup)
6. [Backup & Restore](#backup--restore)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- OS: Ubuntu 22.04 LTS / Debian 11+ / CentOS 8+
- CPU: 2 cores (4 cores recommended for production)
- RAM: 4GB (8GB recommended for production)
- Disk: 50GB SSD (100GB+ recommended)
- Network: Static IP with domain name

**Software Requirements:**
- Docker Engine 24.0+
- Docker Compose v2.20+
- Git
- Nginx (if using standalone reverse proxy)
- Certbot (for SSL certificates)

### Domain & DNS Setup

1. Purchase domain (e.g., `pms.bcagency.com`)
2. Configure DNS A record:
   ```
   pms.bcagency.com  →  <server-ip>
   ```
3. Wait for DNS propagation (can take up to 48 hours)

### Firewall Configuration

**Required Ports:**
- `80` (HTTP) - for Let's Encrypt validation & redirect
- `443` (HTTPS) - for production traffic
- `22` (SSH) - for server access

**Configure UFW (Ubuntu):**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Environment Setup

### 1. Install Docker

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

**CentOS/RHEL:**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Clone Repository

```bash
# Create app directory
sudo mkdir -p /opt/bc-agency-pms
cd /opt/bc-agency-pms

# Clone repository (or transfer files)
git clone https://github.com/bcagency/pms.git .
# OR: scp -r /local/path user@server:/opt/bc-agency-pms

# Set permissions
sudo chown -R $USER:$USER /opt/bc-agency-pms
```

### 3. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Required Configuration:**

```bash
# ============================================
# DOMAIN & URLs
# ============================================
DOMAIN=pms.bcagency.com
FRONTEND_URL=https://pms.bcagency.com
API_URL=https://pms.bcagency.com/api

# ============================================
# SECURITY - Generate Secure Values!
# ============================================
# Generate JWT secret (64 chars)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Generate encryption keys
ENCRYPTION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
ENCRYPTION_SALT=$(openssl rand -base64 16 | tr -d '\n')

# ============================================
# DATABASE
# ============================================
POSTGRES_USER=bc_user
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=bc_pms

# ============================================
# REDIS
# ============================================
REDIS_PASSWORD=<generate-strong-password>

# ============================================
# MINIO
# ============================================
MINIO_ACCESS_KEY=<generate-strong-key>
MINIO_SECRET_KEY=<generate-strong-secret>
MINIO_BUCKET=bc-agency-files

# ============================================
# NOTIFICATIONS (Optional)
# ============================================
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_ALERT_CHAT_ID=<your-chat-id>

# ============================================
# SSL
# ============================================
SSL_EMAIL=admin@bcagency.com
```

**Generate Strong Passwords:**
```bash
# PostgreSQL password
openssl rand -base64 32

# Redis password
openssl rand -base64 32

# MinIO keys
openssl rand -base64 32
```

### 4. Create Required Directories

```bash
# Create data directories
mkdir -p backups
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p nginx/ssl

# Set permissions
chmod 755 backups certbot nginx
```

---

## Docker Deployment

### Development Deployment

**Start Services:**
```bash
cd /opt/bc-agency-pms

# Build and start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

**Services Started:**
- PostgreSQL (port 5433 → 5432)
- Redis (port 6380 → 6379)
- MinIO (port 9000, 9001)
- Nginx (port 80, 443)

**Initial Setup:**

1. **Initialize Database:**
```bash
# Run migrations
docker compose exec backend npx prisma migrate deploy

# Seed initial data (create super admin)
docker compose exec backend npm run seed
```

2. **Create MinIO Bucket:**
```bash
# Install MinIO client
docker run --rm -it --entrypoint=/bin/sh minio/mc -c "
  mc alias set bcminio http://minio:9000 minioadmin minioadmin
  mc mb bcminio/bc-agency-files
  mc anonymous set download bcminio/bc-agency-files
"
```

3. **Access Application:**
- Frontend: `http://localhost` or `http://<server-ip>`
- Backend API: `http://localhost/api`
- MinIO Console: `http://localhost:9001`

**Default Admin Credentials:**
```
Email: admin@bcagency.com
Password: Admin@123456
```

**⚠️ IMPORTANT:** Change default password immediately after first login!

### Production Deployment

**Build Production Images:**

```bash
cd /opt/bc-agency-pms

# Build backend
cd backend
docker build -t bc-agency-pms-backend:latest -f Dockerfile --target production .

# Build frontend
cd ../frontend
docker build -t bc-agency-pms-frontend:latest -f Dockerfile --target production .

cd ..
```

**Start Production Services:**

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d

# Check health
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend frontend
```

**Verify Services:**

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost:3000

# Check all containers healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Update/Restart Services

**Update Application:**

```bash
# Pull latest code
git pull origin master

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart services (zero downtime with rolling update)
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend frontend

# Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

**Restart Individual Service:**

```bash
# Restart backend only
docker compose -f docker-compose.prod.yml restart backend

# Restart with rebuild
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

---

## SSL Setup

### Option 1: Let's Encrypt (Recommended)

**Install Certbot:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Obtain Certificate:**

```bash
# Stop nginx if running
docker compose stop nginx

# Get certificate (standalone mode)
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --email admin@bcagency.com \
  --agree-tos \
  --no-eff-email \
  -d pms.bcagency.com

# Certificates saved to:
# /etc/letsencrypt/live/pms.bcagency.com/fullchain.pem
# /etc/letsencrypt/live/pms.bcagency.com/privkey.pem
```

**Copy Certificates to Project:**

```bash
sudo cp /etc/letsencrypt/live/pms.bcagency.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/pms.bcagency.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*
```

**Update Nginx Configuration:**

Edit `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name pms.bcagency.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of config
}

server {
    listen 80;
    server_name pms.bcagency.com;
    return 301 https://$server_name$request_uri;
}
```

**Restart Nginx:**

```bash
docker compose restart nginx
```

**Auto-Renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job
sudo crontab -e

# Add this line (renew daily at 2 AM)
0 2 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/pms.bcagency.com/*.pem /opt/bc-agency-pms/nginx/ssl/ && docker compose -f /opt/bc-agency-pms/docker-compose.prod.yml restart nginx"
```

### Option 2: Certbot in Docker

**Using docker-compose.prod.yml:**

```bash
# Initial certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@bcagency.com \
  --agree-tos \
  --no-eff-email \
  -d pms.bcagency.com

# Automatic renewal (already configured in docker-compose)
# Certbot container checks every 12 hours
```

### Option 3: Custom SSL Certificate

If you have a purchased SSL certificate:

```bash
# Copy your certificate files
cp /path/to/certificate.crt nginx/ssl/fullchain.pem
cp /path/to/private.key nginx/ssl/privkey.pem

# Set permissions
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem

# Restart nginx
docker compose restart nginx
```

---

## Monitoring Setup

### Docker Compose Monitoring (Optional)

**Start Monitoring Stack:**

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

**Services:**
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Dashboards (port 3030)
- **Node Exporter**: Server metrics
- **cAdvisor**: Container metrics

**Access Grafana:**
1. Open `http://<server-ip>:3030`
2. Login: `admin` / `admin123` (change immediately!)
3. Add Prometheus data source: `http://prometheus:9090`
4. Import dashboards:
   - Docker Container Metrics: ID `193`
   - Node Exporter Full: ID `1860`

### Application Health Checks

**Health Endpoints:**

```bash
# Backend health
curl https://pms.bcagency.com/api/health

# Database health
docker exec bc-postgres-prod pg_isready -U bc_user

# Redis health
docker exec bc-redis-prod redis-cli -a <password> ping

# MinIO health
docker exec bc-minio-prod curl -f http://localhost:9000/minio/health/live
```

### Log Monitoring

**View Logs:**

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail 100 backend

# Save logs to file
docker compose -f docker-compose.prod.yml logs > logs_$(date +%Y%m%d).txt
```

**Log Rotation:**

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

### Telegram Alerts

**Setup:**

1. Create Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get bot token
3. Create alert channel
4. Add bot to channel
5. Get chat ID: Send message to bot, then visit:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
6. Update `.env`:
   ```
   TELEGRAM_BOT_TOKEN=<your-token>
   TELEGRAM_ALERT_CHAT_ID=<your-chat-id>
   ```
7. Restart backend:
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

**Alert Types:**
- Service health check failures
- High resource usage (CPU > 80%, Memory > 90%)
- Disk space warnings (> 80% full)
- Failed backup jobs
- Security events (multiple failed logins)

---

## Backup & Restore

### Automated Backup Setup

**Create Backup Script:**

```bash
sudo nano /opt/bc-agency-pms/scripts/backup.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/bc-agency-pms/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec bc-postgres-prod pg_dump -U bc_user bc_pms | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup MinIO files
echo "Backing up MinIO files..."
docker exec bc-minio-prod tar czf - /data | cat > $BACKUP_DIR/files_$DATE.tar.gz

# Backup environment files
echo "Backing up configuration..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz .env nginx/ certbot/

# Delete old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Upload to remote storage (optional)
# aws s3 sync $BACKUP_DIR s3://bc-agency-backups/

echo "Backup completed: $DATE"
```

**Make Executable:**

```bash
chmod +x /opt/bc-agency-pms/scripts/backup.sh
```

**Schedule Daily Backup:**

```bash
sudo crontab -e

# Add this line (backup daily at 2 AM)
0 2 * * * /opt/bc-agency-pms/scripts/backup.sh >> /var/log/bc-pms-backup.log 2>&1
```

### Manual Backup

**Database Backup:**

```bash
cd /opt/bc-agency-pms

# Backup database
docker exec bc-postgres-prod pg_dump -U bc_user bc_pms > backups/manual_backup_$(date +%Y%m%d).sql

# Compress
gzip backups/manual_backup_*.sql
```

**Full System Backup:**

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Backup volumes
sudo tar czf /tmp/bc-pms-full-backup.tar.gz \
  /opt/bc-agency-pms \
  /var/lib/docker/volumes/bc-pms-*

# Restart services
docker compose -f docker-compose.prod.yml up -d
```

### Database Restore

**From SQL Backup:**

```bash
cd /opt/bc-agency-pms

# Stop backend to prevent writes
docker compose -f docker-compose.prod.yml stop backend

# Drop existing database (careful!)
docker exec bc-postgres-prod psql -U bc_user -c "DROP DATABASE bc_pms;"
docker exec bc-postgres-prod psql -U bc_user -c "CREATE DATABASE bc_pms;"

# Restore from backup
gunzip -c backups/db_20260123_020000.sql.gz | docker exec -i bc-postgres-prod psql -U bc_user -d bc_pms

# Restart backend
docker compose -f docker-compose.prod.yml start backend

# Verify
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status
```

### File Storage Restore

**Restore MinIO Files:**

```bash
# Extract backup
tar xzf backups/files_20260123_020000.tar.gz -C /tmp/

# Copy to running container
docker cp /tmp/data/. bc-minio-prod:/data/

# Restart MinIO
docker compose -f docker-compose.prod.yml restart minio

# Clean up
rm -rf /tmp/data
```

### Disaster Recovery

**Full System Restore:**

1. **Provision new server** with same specifications
2. **Install Docker** and dependencies
3. **Restore backup:**
   ```bash
   # Extract full backup
   sudo tar xzf /path/to/bc-pms-full-backup.tar.gz -C /

   # Restore Docker volumes
   cd /opt/bc-agency-pms

   # Start services
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Update DNS** to point to new server
5. **Verify functionality**
6. **Test critical operations**

---

## Troubleshooting

### Service Won't Start

**Check Container Status:**

```bash
docker compose ps
```

**View Logs:**

```bash
docker compose logs backend
docker compose logs postgres
```

**Common Issues:**

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker exec bc-postgres-prod pg_isready -U bc_user

# Check DATABASE_URL in .env
docker compose exec backend printenv DATABASE_URL

# Verify credentials
docker exec -it bc-postgres-prod psql -U bc_user -d bc_pms
```

**Issue: Port already in use**
```bash
# Check what's using port 80
sudo lsof -i :80

# Kill process or change port in docker-compose.yml
```

**Issue: Permission denied**
```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/bc-agency-pms

# Fix volume permissions
docker compose down
docker volume rm bc-pms-postgres-data
docker compose up -d
```

### Performance Issues

**Check Resource Usage:**

```bash
# Docker stats
docker stats

# Server resources
htop
df -h
free -h
```

**Optimize Database:**

```bash
# Vacuum and analyze
docker exec bc-postgres-prod vacuumdb -U bc_user -d bc_pms --analyze

# Reindex
docker exec bc-postgres-prod reindexdb -U bc_user -d bc_pms
```

**Clear Redis Cache:**

```bash
docker exec bc-redis-prod redis-cli -a <password> FLUSHDB
```

### SSL Issues

**Certificate Not Working:**

```bash
# Verify certificate files
ls -la nginx/ssl/

# Check nginx configuration
docker compose exec nginx nginx -t

# Check certificate expiry
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates
```

**Renew Certificate:**

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/pms.bcagency.com/*.pem nginx/ssl/
docker compose restart nginx
```

### Database Migration Issues

**Migration Failed:**

```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Rollback last migration
docker compose exec backend npx prisma migrate resolve --rolled-back <migration-name>

# Deploy again
docker compose exec backend npx prisma migrate deploy
```

### File Upload Issues

**MinIO Not Accessible:**

```bash
# Check MinIO status
docker exec bc-minio-prod mc admin info local

# Check bucket exists
docker exec bc-minio-prod mc ls local/bc-agency-files

# Create bucket if missing
docker exec bc-minio-prod mc mb local/bc-agency-files
```

### Emergency Rollback

**Rollback to Previous Version:**

```bash
# Stop current services
docker compose -f docker-compose.prod.yml down

# Restore from backup (see Backup & Restore section)
# ...

# Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## Production Checklist

### Pre-Deployment

- [ ] Server meets minimum specifications
- [ ] Domain DNS configured correctly
- [ ] Firewall rules configured
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Secure passwords generated
- [ ] Backup strategy planned

### Post-Deployment

- [ ] All services running and healthy
- [ ] Database migrated successfully
- [ ] Admin account created
- [ ] Default password changed
- [ ] SSL working (HTTPS)
- [ ] File upload working
- [ ] Email notifications configured
- [ ] Backup script tested
- [ ] Monitoring configured
- [ ] Team access verified
- [ ] Documentation updated

### Security Hardening

- [ ] Change all default passwords
- [ ] Enable firewall
- [ ] Configure rate limiting
- [ ] Set up Fail2Ban for SSH
- [ ] Disable root SSH login
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Use strong JWT secrets
- [ ] Encrypt sensitive data

---

## Support

**For deployment assistance:**
- Email: tech@bcagency.com
- Documentation: https://docs.bcagency.com
- Emergency: +84-xxx-xxx-xxx

---

**Version:** 1.0.0
**Last Updated:** 2026-01-23
