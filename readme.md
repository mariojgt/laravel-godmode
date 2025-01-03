# Docker Laravel SSL Setup

This repository provides a complete Docker setup for Laravel applications with SSL support, MySQL, Redis, and PHPMyAdmin.

## Prerequisites

- Docker and Docker Compose installed
- Domain name pointing to your server (for SSL setup)
- Git installed
- Make installed

## Project Structure

Make sure to update the apache config with you website domain
```
.
├── project/
│   ├── apache/
│   │   └── conf/
│   │       ├── ports.conf
│   │       └── your-domain.conf
│   ├── laravel/        # Your Laravel application
│   ├── ssl/
│   │   └── letsencrypt/
│   ├── Dockerfile
│   ├── supervisord.conf
│   └── start.sh
├── docker-compose.yml
├── Makefile
└── .env
```

## Initial Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Create `.env` file from template and adjust values:
```bash
cp .env.example .env
```

Required environment variables:
```dotenv
DOCKER_PREFIX=gamedev            # Prefix for Docker containers
NETWORK_NAME=laravel-app         # Docker network name
CONTAINER_NAME=myapp            # Base container name
CODE_PATH=laravel               # Laravel application folder name
PACKAGES_FOLDER=../../packages:/var/www/html/packages

# Ports
REDIS_PORT=6379
MYAPP_NODE_PORT_EXPOSE=5173
MYAPP_NODE_PORT=5173
MYAPP_PORT=80
MYAPP_SSL_PORT=443
PHPMYADMIN_PORT=7002
REDIS_INSIGHT_PORT=7003
```

3. Create necessary directories:
```bash
mkdir -p project/apache/conf
mkdir -p project/ssl/letsencrypt
```

## First Time Installation

1. Create Docker network:
```bash
make network
```

2. Install Laravel (if starting a new project):
```bash
make install-laravel
```

3. Build Docker containers:
```bash
make build
```

4. Start containers:
```bash
make start
```

5. Install dependencies:
```bash
make composer    # Install PHP dependencies
make bun        # Install Node.js dependencies
```

6. Fix permissions:
```bash
make fix-permissions
```

## SSL Setup

1. Update your domain information in the Makefile:
```makefile
DOMAIN := your-domain.com
EMAIL := your-email@domain.com
```

2. Install SSL certificate:
```bash
make ssl-setup
```

3. After container restarts, reload SSL configuration:
```bash
make ssl-reload
```

4. Verify SSL status:
```bash
make ssl-status
```

## Common Commands

### Docker Management
- `make start` - Start containers
- `make stop` - Stop containers
- `make build` - Rebuild containers
- `make list` - List running containers
- `make volume` - List Docker volumes
- `make destroy` - Remove containers
- `make prune` - Clean up Docker system

### Development
- `make exe` - Enter PHP container
- `make composer` - Run composer update
- `make bun` - Run bun install and dev
- `make fix-permissions` - Fix Laravel directory permissions

### SSL Management
- `make ssl-setup` - Initial SSL setup
- `make ssl-reload` - Reload SSL configuration
- `make ssl-status` - Check SSL certificates status

### Supervisor
- `make status-supervisor` - Check supervisor status
- `make start-supervisor` - Start all supervisor processes
- `make stop-supervisor` - Stop all supervisor processes
- `make restart-supervisor` - Restart all supervisor processes

## Services Access

- Main application: https://your-domain.com
- PHPMyAdmin: http://your-domain.com:7002
- Redis Insight: http://your-domain.com:7003

## Database Configuration

MySQL credentials:
```
Database: laravel
User: laravel_user
Password: laravel_password
Root Password: laravel_password
```

## Troubleshooting

1. Permission Issues:
```bash
make fix-permissions
```

2. SSL Certificate Issues:
```bash
make ssl-status
make ssl-reload
```

3. Apache Logs:
```bash
make apache-logs
```

4. Supervisor Issues:
```bash
make restart-supervisor
make status-supervisor
```

## Security Notes

1. Change default database credentials in production
2. Secure PHPMyAdmin and Redis Insight access
3. Keep SSL certificates up to date
4. Regularly update dependencies

## Production Deployment

Additional steps for production:

1. Update environment variables for production
2. Set appropriate file permissions
3. Configure proper SSL renewal
4. Set up backup strategy
5. Configure proper supervisor settings

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
