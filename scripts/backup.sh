#!/bin/bash
# BC Agency PMS - Database Backup Script
# Usage: ./scripts/backup.sh [--restore <backup-file>]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"
BACKUP_DIR="$PROJECT_DIR/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    error ".env.production not found"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

backup_database() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/db-backup-$timestamp.sql"

    log "Creating database backup..."

    # Check if postgres is running
    if ! docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
        exit 1
    fi

    # Create backup
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean \
        --if-exists \
        > "$backup_file"

    # Compress backup
    gzip "$backup_file"
    log "Backup created: ${backup_file}.gz"

    # Calculate size
    local size=$(du -h "${backup_file}.gz" | cut -f1)
    log "Backup size: $size"

    # Cleanup old backups (keep last 30)
    local count=$(ls -1 "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null | wc -l)
    if [ "$count" -gt 30 ]; then
        log "Cleaning up old backups..."
        ls -tp "$BACKUP_DIR"/db-backup-*.sql.gz | tail -n +31 | xargs -I {} rm -- {}
    fi

    log "Backup completed successfully!"
}

restore_database() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        # List available backups
        log "Available backups:"
        ls -lht "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null || echo "No backups found"
        echo ""
        error "Please specify a backup file to restore"
        echo "Usage: $0 --restore <backup-file>"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi

    warn "WARNING: This will overwrite the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    log "Restoring database from: $backup_file"

    # Check if postgres is running
    if ! docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
        exit 1
    fi

    # Restore backup
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB"
    else
        docker compose -f "$COMPOSE_FILE" exec -T postgres psql \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" < "$backup_file"
    fi

    log "Database restored successfully!"
}

# Main
case "$1" in
    --restore)
        restore_database "$2"
        ;;
    --list)
        log "Available backups:"
        ls -lht "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null || echo "No backups found"
        ;;
    *)
        backup_database
        ;;
esac
