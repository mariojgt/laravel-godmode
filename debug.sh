#!/bin/bash

# Debug script for Laravel Docker environment
echo "🔍 Laravel Docker Debug Information"
echo "==================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Run: cp .env.example .env"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Environment Check:"
echo "  APP_NAME: ${APP_NAME}"
echo "  APP_PORT: ${APP_PORT}"
echo "  CODE_PATH: ${CODE_PATH}"
echo "  DB_DATABASE: ${DB_DATABASE}"
echo ""

echo "🐳 Docker Status:"
docker compose ps
echo ""

echo "📊 Container Health:"
echo "  App Container:"
if docker compose exec -T app echo "✅ App container is running" 2>/dev/null; then
    echo "    ✅ Running"
else
    echo "    ❌ Not running or not accessible"
fi

echo "  MySQL Container:"
if docker compose exec -T mysql mysqladmin ping -h localhost 2>/dev/null; then
    echo "    ✅ Running"
else
    echo "    ❌ Not running or not accessible"
fi

echo "  Redis Container:"
if docker compose exec -T redis redis-cli ping 2>/dev/null; then
    echo "    ✅ Running"
else
    echo "    ❌ Not running or not accessible"
fi

echo ""
echo "🔗 Port Check:"
echo "  Port ${APP_PORT}:"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}" | grep -q "200\|301\|302"; then
    echo "    ✅ Accessible"
else
    echo "    ❌ Not accessible"
fi

echo ""
echo "📁 File System Check:"
echo "  Laravel path: ${CODE_PATH}"
if docker compose exec -T app test -f "/var/www/html/public/index.php"; then
    echo "  ✅ Laravel public/index.php exists"
else
    echo "  ❌ Laravel public/index.php missing"
fi

if docker compose exec -T app test -w "/var/www/html/storage"; then
    echo "  ✅ Storage directory is writable"
else
    echo "  ❌ Storage directory not writable"
fi

echo ""
echo "🔍 Recent Container Logs:"
echo "App Container Logs (last 10 lines):"
docker compose logs --tail=10 app

echo ""
echo "💡 Quick Fixes:"
echo "  1. Rebuild containers: make rebuild"
echo "  2. Fix permissions: make permissions"
echo "  3. Check full logs: make logs"
echo "  4. Restart everything: make down && make up"
