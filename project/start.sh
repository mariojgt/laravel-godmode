#!/bin/bash

# Create the folder bootstrap/cache and storage in the Laravel project root directory.
mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache

# Set proper permissions for Laravel directories
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
# Set permissions for writable directories
chmod -R ug+rwx /var/www/html/storage /var/www/html/bootstrap/cache
