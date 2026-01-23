#!/bin/bash
# BC Agency PMS - Production Deployment Script
# Usage: ./scripts/deploy.sh [options]
#
# Options:
#   --skip-build    Skip Docker image building
#   --skip-migrate  Skip database migrations
#   --quick         Quick restart without pulling/building
#   --rollback      Rollback to previous deployment

set -e

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_DIR/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)  color=$GREEN ;;
        WARN)  color=$YELLOW ;;
        ERROR) color=$RED ;;
        *)     color=$NC ;;
    esac

    echo -e "${color}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

check_requirements() {
    log INFO "Checking requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log ERROR "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log ERROR "Docker Compose is not installed"
        exit 1
    fi

    # Check .env.production exists
    if [ ! -f "$ENV_FILE" ]; then
        log ERROR ".env.production file not found at $ENV_FILE"
        log WARN "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi

    log INFO "All requirements met"
}

create_directories() {
    log INFO "Creating necessary directories..."
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/backups"
    mkdir -p "$PROJECT_DIR/certbot/conf"
    mkdir -p "$PROJECT_DIR/certbot/www"
}

backup_database() {
    log INFO "Creating database backup..."

    local backup_file="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"

    if docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U "$POSTGRES_USER" \
            "$POSTGRES_DB" > "$backup_file"

        # Compress backup
        gzip "$backup_file"
        log INFO "Database backup created: ${backup_file}.gz"

        # Keep only last 7 backups
        ls -tp "$BACKUP_DIR"/db-backup-*.sql.gz | tail -n +8 | xargs -I {} rm -- {}
    else
        log WARN "PostgreSQL container not running, skipping backup"
    fi
}

pull_latest_code() {
    log INFO "Pulling latest code from git..."

    cd "$PROJECT_DIR"

    # Stash any local changes
    git stash

    # Pull latest code
    git pull origin main || git pull origin master

    # Pop stashed changes if any
    git stash pop 2>/dev/null || true

    log INFO "Code updated successfully"
}

build_images() {
    log INFO "Building Docker images..."

    cd "$PROJECT_DIR"

    # Build all images
    docker compose -f "$COMPOSE_FILE" build --no-cache

    log INFO "Docker images built successfully"
}

run_migrations() {
    log INFO "Running database migrations..."

    # Start only database
    docker compose -f "$COMPOSE_FILE" up -d postgres

    # Wait for database to be ready
    log INFO "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy

    log INFO "Database migrations completed"
}

deploy_services() {
    log INFO "Deploying services..."

    cd "$PROJECT_DIR"

    # Stop existing containers
    docker compose -f "$COMPOSE_FILE" down --remove-orphans

    # Start all services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log INFO "Services started"
}

health_check() {
    log INFO "Running health checks..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log INFO "Health check attempt $attempt/$max_attempts..."

        # Check nginx health
        if docker compose -f "$COMPOSE_FILE" exec -T nginx wget -q --spider http://localhost/health 2>/dev/null; then
            log INFO "Nginx is healthy"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            log ERROR "Health check failed after $max_attempts attempts"
            log WARN "Services may still be starting. Check logs with: docker compose -f $COMPOSE_FILE logs"
            return 1
        fi

        sleep 5
        ((attempt++))
    done

    # Check all service statuses
    log INFO "Checking all services..."
    docker compose -f "$COMPOSE_FILE" ps

    # Check backend health
    if docker compose -f "$COMPOSE_FILE" exec -T nginx wget -q --spider http://backend:3001/api/health 2>/dev/null; then
        log INFO "Backend API is healthy"
    else
        log WARN "Backend API health check failed"
    fi

    # Check frontend health
    if docker compose -f "$COMPOSE_FILE" exec -T nginx wget -q --spider http://frontend:3000 2>/dev/null; then
        log INFO "Frontend is healthy"
    else
        log WARN "Frontend health check failed"
    fi

    log INFO "Health checks completed"
}

cleanup() {
    log INFO "Cleaning up..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful with this in production)
    # docker volume prune -f

    log INFO "Cleanup completed"
}

rollback() {
    log WARN "Rolling back to previous deployment..."

    # Find the most recent backup
    local latest_backup=$(ls -tp "$BACKUP_DIR"/db-backup-*.sql.gz | head -1)

    if [ -z "$latest_backup" ]; then
        log ERROR "No backup found for rollback"
        exit 1
    fi

    log INFO "Restoring from: $latest_backup"

    # Stop services
    docker compose -f "$COMPOSE_FILE" down

    # Start only database
    docker compose -f "$COMPOSE_FILE" up -d postgres
    sleep 10

    # Restore database
    gunzip -c "$latest_backup" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
        -U "$POSTGRES_USER" \
        "$POSTGRES_DB"

    # Start all services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log INFO "Rollback completed"
}

show_status() {
    log INFO "Current deployment status:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log INFO "Recent logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=20
}

setup_ssl() {
    log INFO "Setting up SSL certificates..."

    # Load domain from env
    source "$ENV_FILE"

    if [ -z "$DOMAIN" ]; then
        log ERROR "DOMAIN not set in .env.production"
        exit 1
    fi

    if [ -z "$SSL_EMAIL" ]; then
        log ERROR "SSL_EMAIL not set in .env.production"
        exit 1
    fi

    # Initial certificate request
    docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    # Reload nginx
    docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

    log INFO "SSL certificates installed successfully"
}

# ============================================
# Main Script
# ============================================
main() {
    local skip_build=false
    local skip_migrate=false
    local quick=false
    local do_rollback=false
    local setup_ssl_flag=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-migrate)
                skip_migrate=true
                shift
                ;;
            --quick)
                quick=true
                skip_build=true
                skip_migrate=true
                shift
                ;;
            --rollback)
                do_rollback=true
                shift
                ;;
            --setup-ssl)
                setup_ssl_flag=true
                shift
                ;;
            --status)
                show_status
                exit 0
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-build    Skip Docker image building"
                echo "  --skip-migrate  Skip database migrations"
                echo "  --quick         Quick restart without pulling/building"
                echo "  --rollback      Rollback to previous deployment"
                echo "  --setup-ssl     Setup SSL certificates with Let's Encrypt"
                echo "  --status        Show current deployment status"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log ERROR "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    echo ""
    echo "============================================"
    echo "  BC Agency PMS - Production Deployment"
    echo "============================================"
    echo ""

    create_directories

    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi

    # Handle rollback
    if [ "$do_rollback" = true ]; then
        check_requirements
        rollback
        health_check
        exit 0
    fi

    # Handle SSL setup
    if [ "$setup_ssl_flag" = true ]; then
        check_requirements
        setup_ssl
        exit 0
    fi

    # Normal deployment
    check_requirements

    # Backup before deployment
    backup_database

    if [ "$quick" = false ]; then
        pull_latest_code
    fi

    if [ "$skip_build" = false ]; then
        build_images
    fi

    if [ "$skip_migrate" = false ]; then
        run_migrations
    fi

    deploy_services
    health_check
    cleanup

    echo ""
    log INFO "============================================"
    log INFO "  Deployment completed successfully!"
    log INFO "============================================"
    log INFO ""
    log INFO "Application URL: https://$DOMAIN"
    log INFO "Logs: $LOG_FILE"
    log INFO ""
    log INFO "Useful commands:"
    log INFO "  - View logs: docker compose -f $COMPOSE_FILE logs -f"
    log INFO "  - Status: docker compose -f $COMPOSE_FILE ps"
    log INFO "  - Stop: docker compose -f $COMPOSE_FILE down"
    echo ""
}

# Run main function
main "$@"
