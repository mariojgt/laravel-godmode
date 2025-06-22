#!/bin/bash

# Quick setup script for Laravel Docker environment
# This script automates the entire setup process

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if make is installed
check_make() {
    if ! command -v make &> /dev/null; then
        print_error "Make is not installed. Please install make first."
        exit 1
    fi
}

# Create directory structure
create_structure() {
    print_status "Creating directory structure..."

    mkdir -p logs/nginx
    mkdir -p logs/supervisor
    mkdir -p mysql
    mkdir -p src

    print_success "Directory structure created"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating environment file..."

        # Get current user ID
        USER_ID=$(id -u)

        cat > .env << EOF
# Application Configuration
APP_NAME=laravel
APP_PORT=8000
VITE_PORT=5173
UID=$USER_ID

# Laravel Application Path (relative to project root)
# Examples: src, src/laravel, projects/my-app, code, app
CODE_PATH=src

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Service Ports
PHPMYADMIN_PORT=8080
REDIS_INSIGHT_PORT=8001
MAILHOG_PORT=8025

# Mail Configuration (for development)
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
EOF

        print_success "Environment file created"
    else
        print_warning "Environment file already exists, skipping..."
    fi
}

# Setup MySQL configuration
setup_mysql_config() {
    if [ ! -f mysql/my.cnf ]; then
        print_status "Creating MySQL configuration..."

        cat > mysql/my.cnf << 'EOF'
[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
default-authentication-plugin = mysql_native_password

# Performance settings
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 200
wait_timeout = 28800
interactive_timeout = 28800

[client]
default-character-set = utf8mb4
EOF

        print_success "MySQL configuration created"
    else
        print_warning "MySQL configuration already exists, skipping..."
    fi
}

# Check if Laravel project exists
check_laravel() {
    if [ -f "${CODE_PATH:-src}/composer.json" ]; then
        print_success "Existing Laravel project found in ${CODE_PATH:-src}"
        return 0
    else
        print_status "Laravel project not found in ${CODE_PATH:-src}. Will create new Laravel project..."
        return 1
    fi
}

# Main setup function
main() {
    echo ""
    echo "🚀 Laravel Docker Environment Quick Setup"
    echo "========================================"
    echo ""

    # Pre-flight checks
    print_status "Running pre-flight checks..."
    check_docker
    check_make
    print_success "Pre-flight checks passed"

    # Setup
    create_structure
    setup_env
    setup_mysql_config

    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi

    # Build containers
    print_status "Building Docker containers (this may take a few minutes)..."
    docker compose build --no-cache
    print_success "Containers built successfully"

    # Start services
    print_status "Starting services..."
    docker compose up -d
    print_success "Services started"

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15

    # Check if app container is responding
    print_status "Checking application container..."
    for i in {1..10}; do
        if docker compose exec -T app echo "Container is ready" > /dev/null 2>&1; then
            print_success "Application container is ready"
            break
        else
            print_status "Waiting for application container... ($i/10)"
            sleep 3
        fi
    done

    # Setup Laravel
    if ! check_laravel; then
        print_status "Creating new Laravel project in ${CODE_PATH:-src}..."
        mkdir -p "${CODE_PATH:-src}"
        docker compose exec app composer create-project laravel/laravel .
        print_success "Laravel project created"
    fi

    # Install dependencies
    print_status "Installing PHP dependencies..."
    docker compose exec app composer install

    # Setup Laravel environment
    if [ ! -f src/.env ]; then
        print_status "Setting up Laravel environment..."
        docker compose exec app cp .env.example .env
        docker compose exec app php artisan key:generate
    fi

    # Create storage link
    print_status "Creating storage link..."
    docker compose exec app php artisan storage:link || true

    # Fix permissions
    print_status "Fixing permissions..."
    docker compose exec -u root app chown -R devuser:www-data /var/www/html
    docker compose exec -u root app chmod -R 775 /var/www/html/storage
    docker compose exec -u root app chmod -R 775 /var/www/html/bootstrap/cache

    # Update Laravel .env for Docker
    print_status "Updating Laravel configuration for Docker..."
    docker compose exec app sed -i 's/DB_HOST=127.0.0.1/DB_HOST=mysql/' .env
    docker compose exec app sed -i 's/REDIS_HOST=127.0.0.1/REDIS_HOST=redis/' .env
    docker compose exec app sed -i 's/MAIL_HOST=mailpit/MAIL_HOST=mailhog/' .env
    docker compose exec app sed -i 's/MAIL_PORT=1025/MAIL_PORT=1025/' .env

    # Run migrations (if any exist)
    print_status "Running database migrations..."
    docker compose exec app php artisan migrate --force || print_warning "No migrations found or migration failed"

    print_success "Setup completed successfully!"

    echo ""
    echo "🎉 Your Laravel application is ready!"
    echo "====================================="
    echo ""
    echo "🌐 Application URL: http://localhost:${APP_PORT:-8000}"
    echo "📊 PHPMyAdmin:      http://localhost:${PHPMYADMIN_PORT:-8080}"
    echo "🔴 Redis Insight:   http://localhost:${REDIS_INSIGHT_PORT:-8001}"
    echo "📧 Mailhog:         http://localhost:${MAILHOG_PORT:-8025}"
    echo ""
    echo "💡 Useful commands:"
    echo "   make help           - Show all available commands"
    echo "   make shell          - Access application container"
    echo "   make logs           - View application logs"
    echo "   make test           - Run tests"
    echo "   ./health-check.sh   - Check system health"
    echo ""
    echo "🚀 Happy coding!"
}

# Run the main function
main
