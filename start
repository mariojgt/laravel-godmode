#!/bin/bash

# Startup script for Laravel Docker container
set -e

# Create necessary directories
mkdir -p /var/run/supervisor
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Set proper permissions
chown -R devuser:www-data /var/www/html
chmod -R 775 /var/www/html/storage 2>/dev/null || true
chmod -R 775 /var/www/html/bootstrap/cache 2>/dev/null || true

# Enable nginx site
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
