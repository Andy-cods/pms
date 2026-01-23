#!/bin/bash
# BC Agency PMS - Health Check Script
# Usage: ./scripts/health-check.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_service() {
    local service=$1
    local url=$2
    local name=$3

    printf "%-20s" "$name:"

    if docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
        if [ -n "$url" ]; then
            if docker compose -f "$COMPOSE_FILE" exec -T nginx wget -q --spider "$url" 2>/dev/null; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${YELLOW}UP (endpoint not responding)${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}UP${NC}"
            return 0
        fi
    else
        echo -e "${RED}DOWN${NC}"
        return 1
    fi
}

echo ""
echo "============================================"
echo "  BC Agency PMS - Health Check"
echo "============================================"
echo ""

# Check all services
echo "Service Status:"
echo "--------------------------------------------"

healthy=0
total=0

((total++))
if check_service "postgres" "" "PostgreSQL"; then ((healthy++)); fi

((total++))
if check_service "redis" "" "Redis"; then ((healthy++)); fi

((total++))
if check_service "minio" "" "MinIO"; then ((healthy++)); fi

((total++))
if check_service "backend" "http://backend:3001/api/health" "Backend API"; then ((healthy++)); fi

((total++))
if check_service "frontend" "http://frontend:3000" "Frontend"; then ((healthy++)); fi

((total++))
if check_service "nginx" "http://localhost/health" "Nginx"; then ((healthy++)); fi

echo "--------------------------------------------"
echo ""

# Summary
if [ $healthy -eq $total ]; then
    echo -e "${GREEN}All services are healthy ($healthy/$total)${NC}"
else
    echo -e "${YELLOW}Some services have issues ($healthy/$total healthy)${NC}"
fi

echo ""

# Resource usage
echo "Resource Usage:"
echo "--------------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | grep "bc-" || true

echo ""

# Disk usage
echo "Disk Usage (Docker):"
echo "--------------------------------------------"
docker system df 2>/dev/null || true

echo ""

# Recent logs (errors only)
echo "Recent Errors (last 10 minutes):"
echo "--------------------------------------------"
docker compose -f "$COMPOSE_FILE" logs --since "10m" 2>/dev/null | grep -iE "(error|exception|fatal)" | tail -10 || echo "No recent errors"

echo ""
