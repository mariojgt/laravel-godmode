#!/bin/bash

# Health check script for Laravel Docker environment
# Usage: ./health-check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🏥 Laravel Docker Environment Health Check"
echo "========================================"

# Check if Docker is running
echo -n "🐳 Docker daemon: "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    exit 1
fi

# Check if containers are running
echo -n "📦 Containers: "
RUNNING_CONTAINERS=$(docker compose ps --services --filter "status=running" | wc -l)
TOTAL_SERVICES=$(docker compose ps --services | wc -l)

if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_SERVICES" ]; then
    echo -e "${GREEN}✓ All $TOTAL_SERVICES services running${NC}"
else
    echo -e "${YELLOW}⚠ $RUNNING_CONTAINERS/$TOTAL_SERVICES services running${NC}"
fi

# Check application health
echo -n "🌐 Laravel app: "
if curl -f -s "http://localhost:${APP_PORT:-8000}" > /dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi

# Check database connection
echo -n "🗄️  MySQL: "
if docker compose exec -T mysql mysqladmin ping -h localhost -u root -p${DB_PASSWORD:-password} > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
fi

# Check Redis
echo -n "🔴 Redis: "
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
fi

# Check PHPMyAdmin
echo -n "📊 PHPMyAdmin: "
if curl -f -s "http://localhost:${PHPMYADMIN_PORT:-8080}" > /dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${YELLOW}⚠ Not accessible${NC}"
fi

# Check Mailhog
echo -n "📧 Mailhog: "
if curl -f -s "http://localhost:${MAILHOG_PORT:-8025}" > /dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${YELLOW}⚠ Not accessible${NC}"
fi

# Check Laravel specific health
echo ""
echo "🎯 Laravel Application Health:"
echo "================================"

# Check if Laravel is properly installed
if docker compose exec -T app test -f "/var/www/html/artisan"; then
    echo -e "📋 Laravel installation: ${GREEN}✓ Found${NC}"

    # Check Laravel app key
    if docker compose exec -T app php artisan --version > /dev/null 2>&1; then
        echo -e "🔑 Laravel artisan: ${GREEN}✓ Working${NC}"
    else
        echo -e "🔑 Laravel artisan: ${RED}✗ Error${NC}"
    fi

    # Check database migration status
    MIGRATION_STATUS=$(docker compose exec -T app php artisan migrate:status 2>/dev/null | grep -c "Yes" || echo "0")
    if [ "$MIGRATION_STATUS" -gt 0 ]; then
        echo -e "📊 Database migrations: ${GREEN}✓ $MIGRATION_STATUS migrations run${NC}"
    else
        echo -e "📊 Database migrations: ${YELLOW}⚠ No migrations found${NC}"
    fi

else
    echo -e "📋 Laravel installation: ${RED}✗ Not found${NC}"
fi

# Check storage permissions
echo -n "📁 Storage permissions: "
if docker compose exec -T app test -w "/var/www/html/storage"; then
    echo -e "${GREEN}✓ Writable${NC}"
else
    echo -e "${RED}✗ Not writable${NC}"
fi

# Show useful URLs
echo ""
echo "🔗 Service URLs:"
echo "================"
echo "📱 Main Application:  http://localhost:${APP_PORT:-8000}"
echo "⚡ Vite Dev Server:   http://localhost:${VITE_PORT:-5173}"
echo "🗄️  PHPMyAdmin:       http://localhost:${PHPMYADMIN_PORT:-8080}"
echo "🔴 Redis Insight:     http://localhost:${REDIS_INSIGHT_PORT:-8001}"
echo "📧 Mailhog:           http://localhost:${MAILHOG_PORT:-8025}"

echo ""
echo "✅ Health check complete!"
echo "💡 Run 'make help' for available commands"
