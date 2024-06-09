#!/bin/bash
set -e

# Ensure the storage and cache directories have the correct permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Execute the original entrypoint command
exec "$@"
