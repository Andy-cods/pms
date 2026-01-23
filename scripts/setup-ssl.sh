#!/bin/bash
# BC Agency PMS - SSL Certificate Setup Script
# Usage: ./scripts/setup-ssl.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.production"

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
    error ".env.production not found. Please create it first."
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    error "DOMAIN not set in .env.production"
    exit 1
fi

if [ -z "$SSL_EMAIL" ]; then
    error "SSL_EMAIL not set in .env.production"
    exit 1
fi

log "Setting up SSL for domain: $DOMAIN"

# Create directories
mkdir -p "$PROJECT_DIR/certbot/conf"
mkdir -p "$PROJECT_DIR/certbot/www"

# Create a temporary nginx config for initial certificate
cat > "$PROJECT_DIR/nginx/nginx.init.conf" << 'NGINX'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'SSL setup in progress';
            add_header Content-Type text/plain;
        }
    }
}
NGINX

log "Starting nginx with temporary configuration..."

# Start nginx with temporary config
docker run -d --name bc-nginx-init \
    -p 80:80 \
    -v "$PROJECT_DIR/nginx/nginx.init.conf:/etc/nginx/nginx.conf:ro" \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot:ro" \
    nginx:alpine

# Wait for nginx to start
sleep 5

log "Requesting SSL certificate from Let's Encrypt..."

# Request certificate
docker run --rm \
    -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
    -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Stop temporary nginx
docker stop bc-nginx-init
docker rm bc-nginx-init

# Clean up temporary config
rm -f "$PROJECT_DIR/nginx/nginx.init.conf"

log "SSL certificate installed successfully!"
log ""
log "Certificate files:"
log "  - /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
log "  - /etc/letsencrypt/live/$DOMAIN/privkey.pem"
log ""
log "You can now start the full application with:"
log "  ./scripts/deploy.sh"
