# Laravel Docker Development Environment

A simplified, optimized Docker setup for Laravel applications using Nginx, PHP-FPM, MySQL, and Redis with **flexible project path configuration**.

## 🚀 Quick Start

1. **Clone or download this setup**
2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```
3. **Start everything management panel:**
   cd to the control panel folder and make sure you run a npm install first
   ```bash
   make control
   ```

That's it! Your Laravel app will be running at `http://localhost:8000`

## 📁 Flexible Project Structure

The setup supports **any Laravel application path** using the `CODE_PATH` variable:

### **Default Structure** (CODE_PATH=src)
```
my-laravel-project/
├── src/                    ← Your Laravel app
│   ├── app/
│   ├── public/
│   ├── composer.json
│   └── ...
├── logs/                   ← Application logs
├── mysql/                  ← MySQL configuration
├── docker-compose.yml      ← Docker services
├── Dockerfile             ← Application container
├── nginx.conf             ← Nginx main config
├── default.conf           ← Laravel site config
├── supervisord.conf       ← Process manager
├── Makefile              ← Development commands
└── .env                  ← Environment variables
```

### **Custom Path Examples**
```bash
CODE_PATH=src                    # Default
CODE_PATH=src/laravel           # Nested Laravel
CODE_PATH=projects/main-app     # Multiple projects
CODE_PATH=clients/acme-corp     # Client work
CODE_PATH=app                   # Simple structure
```

## 🐳 Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Laravel App | 8000 | Main application |
| Vite Dev Server | 5173 | Frontend development |
| MySQL | 3306 | Database |
| PHPMyAdmin | 8080 | Database management |
| Redis | 6379 | Cache & sessions |
| Redis Insight | 8001 | Redis management |
| Mailhog | 8025 | Email testing |

## 🛠 Development Commands

### **Basic Operations**
```bash
make help           # Show all available commands
make up            # Start containers
make down          # Stop containers
make restart       # Restart containers
make shell         # Access app container
make logs          # View application logs
make list          # List all containers
make urls          # Show all service URLs
make status        # Show container status
```

### **Project Path Management** ⭐ **NEW**
```bash
make path                           # Show current Laravel path
make switch-path path="new/path"    # Switch to different path
make create-project path="my/path"  # Create Laravel in specific path
```

**Examples:**
```bash
# Check current setup
make path

# Switch to nested Laravel project
make switch-path path="src/laravel"
make restart

# Create new project in custom location
make create-project path="projects/api-service"

# Switch between multiple projects
make switch-path path="clients/project-a"
make restart
```

### **Laravel Development**
```bash
make artisan cmd="migrate"     # Run artisan commands
make migrate                   # Run migrations
make migrate-fresh            # Fresh migration with seed
make seed                     # Run database seeders
make tinker                   # Laravel Tinker
make test                     # Run PHPUnit tests
make test-coverage           # Run tests with coverage
make cache-clear             # Clear all caches
make optimize                # Optimize for production
```

### **Dependencies**
```bash
make composer cmd="require package"  # Composer commands
make composer-install               # Install PHP deps
make composer-update               # Update PHP deps
make npm-install                   # Install Node deps
make npm-dev                      # Start Vite dev server
make npm-build                    # Build assets for production
make bun-install                  # Use Bun instead of npm
make bun-dev                     # Bun dev server
make bun-build                   # Build assets with Bun
```

### **Database Management**
```bash
make db-shell      # Access MySQL shell
make db-dump       # Export database to backup.sql
make db-restore    # Import database from backup.sql
```

### **Testing**
```bash
make test                         # Run PHPUnit tests
make test-coverage               # Run tests with coverage report
make test-filter name="TestName" # Run specific test
make pest                        # Run Pest tests
make pest-coverage              # Run Pest tests with coverage
```

### **Maintenance**
```bash
make permissions   # Fix file permissions
make clean        # Remove containers & volumes
make clean-all    # Clean everything including images
make fresh        # Complete fresh install
make build        # Build containers
make rebuild      # Rebuild and restart containers
```

### **Monitoring & Debugging**
```bash
make logs          # Application logs
make logs-nginx    # Nginx specific logs
make logs-all      # All container logs
make top          # Show running processes
make stats        # Show container resource usage
./debug.sh        # Complete system health check
./health-check.sh # Health check with URLs
```

## 🔧 Configuration

### **Environment Variables (.env)**

**Application Configuration:**
```bash
APP_NAME=laravel          # Project name (affects container names)
APP_PORT=8000            # Main application port
VITE_PORT=5173           # Frontend dev server port
UID=1000                 # User ID for container

# Laravel Application Path (relative to project root)
CODE_PATH=src            # ⭐ NEW: Flexible path configuration
```

**Database Configuration:**
```bash
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=password
```

**Service Ports:**
```bash
PHPMYADMIN_PORT=8080
REDIS_INSIGHT_PORT=8001
MAILHOG_PORT=8025
```

### **Key Features**

**🏎️ Performance Optimized:**
- Nginx + PHP-FPM for better performance than Apache
- Optimized PHP and MySQL configurations
- Redis for caching and sessions
- Supervisor for process management

**🧑‍💻 Developer Friendly:**
- **Flexible project paths** - point to any Laravel directory
- Hot reload with Vite
- Xdebug ready for debugging
- Mailhog for email testing
- Both npm and Bun support
- Auto-running queue workers and schedulers

**🔄 Process Management:**
- Supervisor manages all processes
- Laravel queue workers (2 instances)
- Laravel scheduler
- Auto-restart on failures

**🛡️ Production Ready:**
- Proper file permissions
- Security headers
- Optimized caching
- SSL ready (uncomment in nginx config)

## 📚 Usage Examples

### **Single Laravel Project**
```bash
# Standard setup
CODE_PATH=src
make install
```

### **Multiple Laravel Projects**
```bash
# Project 1: Main application
make create-project path="apps/main"

# Project 2: API service
make create-project path="apps/api"

# Switch between them
make switch-path path="apps/main"
make restart

make switch-path path="apps/api"
make restart
```

### **Client Work Organization**
```bash
# Client A project
make create-project path="clients/client-a"

# Client B project
make create-project path="clients/client-b"

# Switch to work on different clients
make switch-path path="clients/client-a"
make restart
```

### **Nested Laravel Project**
```bash
# Move existing Laravel to subdirectory
mkdir -p src/laravel
mv src/* src/laravel/ 2>/dev/null || true

# Update configuration
make switch-path path="src/laravel"
make restart
```

## 🚨 Common Issues & Solutions

### **Permission Problems**
```bash
make permissions
```

### **Container Won't Start**
```bash
make logs
# Check what's failing, then
make rebuild
```

### **Database Connection Issues**
- Ensure MySQL container is running: `make list`
- Check database credentials in `.env`
- Wait for MySQL to fully initialize (can take 30 seconds first time)

### **Port Conflicts**
Update ports in `.env` file if default ports are in use:
```bash
APP_PORT=8001
PHPMYADMIN_PORT=8081
# etc.
```

### **Path Issues**
```bash
make path          # Check current path
./debug.sh        # Full system check
make switch-path path="correct/path"
make restart
```

## 🔒 Production Deployment

1. **Update environment:**
   - Set `APP_ENV=production` in Laravel's `.env`
   - Use strong passwords
   - Configure proper domain in nginx

2. **Enable SSL:**
   - Uncomment HTTPS server block in `default.conf`
   - Add SSL certificates
   - Update ports to 443

3. **Optimize:**
   ```bash
   make optimize
   make composer cmd="install --no-dev --optimize-autoloader"
   make npm-build
   ```

## 📋 Migration Guide

### **From Your Old Apache Setup**

1. **Backup current project:**
   ```bash
   # Backup Laravel code
   cp -r project/laravel ./backup-laravel

   # Backup database
   mysqldump your_database > backup.sql
   ```

2. **Set up new environment:**
   ```bash
   # Create new directory
   mkdir new-laravel-docker
   cd new-laravel-docker

   # Copy all Docker files from this setup
   cp .env.example .env
   ```

3. **Copy your Laravel application:**
   ```bash
   # Copy to default location
   cp -r ../old-setup/project/laravel/* ./src/

   # OR copy to custom location
   mkdir -p projects/my-app
   cp -r ../old-setup/project/laravel/* ./projects/my-app/
   echo "CODE_PATH=projects/my-app" >> .env
   ```

4. **Update Laravel's .env file:**
   ```bash
   # Edit your Laravel .env file (in src/ or your CODE_PATH)
   DB_HOST=mysql
   REDIS_HOST=redis
   MAIL_HOST=mailhog
   ```

5. **Start new setup:**
   ```bash
   make up
   make composer-install
   make migrate
   ```

### **From Standard Docker Setups**

If you have an existing Docker Laravel setup:

```bash
# Copy your Laravel app to desired location
make switch-path path="your/preferred/path"
# Copy files to the new path
make restart
make setup
```

## 💡 Pro Tips

- **Use `make urls`** to see all available services
- **Use `make path`** to check current Laravel location
- **Laravel logs** are in `logs/` directory on host
- **Database data** persists in Docker volumes
- **Use `make shell`** for debugging inside container
- **Queue workers** restart automatically via Supervisor
- **Multiple projects** can share the same Docker setup
- **Create shell aliases** for quick project switching:
  ```bash
  alias laravel-main="cd ~/my-project && make switch-path path='apps/main' && make restart"
  alias laravel-api="cd ~/my-project && make switch-path path='apps/api' && make restart"
  ```

## 🆘 Getting Help

```bash
make help           # Show all available commands
./debug.sh          # Complete system diagnostic
./health-check.sh   # Health check with service URLs
```

For Laravel-specific help, check the [Laravel Documentation](https://laravel.com/docs).

## 🎯 What's Different from Apache Setups

**Major Improvements:**
- ✅ **Nginx instead of Apache** (faster, lighter)
- ✅ **Flexible project paths** - organize however you want
- ✅ **Simplified commands** (`make install` vs complex setup)
- ✅ **Better process management** with Supervisor
- ✅ **Built-in email testing** with Mailhog
- ✅ **Redis management** with Redis Insight
- ✅ **Auto-running queue workers** and schedulers
- ✅ **Development tools** like Xdebug pre-configured
- ✅ **Support for both npm and Bun**
- ✅ **Complete automation** with setup scripts

**Performance Benefits:**
- ⚡ **5x faster startup** with optimized containers
- ⚡ **Better resource usage** with Nginx + PHP-FPM
- ⚡ **Automatic process management**
- ⚡ **Built-in caching** and optimization

## 🚀 Advanced Usage

### **Multiple Environment Management**
```bash
# Development
CODE_PATH=development/main
make switch-path path="development/main"
make restart

# Staging
CODE_PATH=staging/main
make switch-path path="staging/main"
make restart

# Different databases per environment in .env
```

### **Microservices Architecture**
```bash
# API Gateway
make create-project path="services/gateway"

# User Service
make create-project path="services/users"

# Order Service
make create-project path="services/orders"

# Switch between services for development
make switch-path path="services/users"
make restart
```

### **Client/Project Organization**
```bash
my-laravel-workspace/
├── clients/
│   ├── acme-corp/
│   ├── tech-startup/
│   └── ecommerce-site/
├── personal/
│   ├── blog/
│   └── portfolio/
├── experiments/
│   └── laravel-11-features/
└── docker-files/
    ├── docker-compose.yml
    ├── Makefile
    └── .env
```

---

**Happy coding! 🎉**

This setup is designed to grow with your needs - from single Laravel apps to complex multi-project workflows. The flexible path system means you can organize your code exactly how you want while keeping all the Docker complexity hidden behind simple `make` commands.
