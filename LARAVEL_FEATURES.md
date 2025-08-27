# 🎯 Laravel God Mode - Quick Start Guide

## ✨ What's New in Laravel God Mode

Your Laravel God Mode has been enhanced with powerful Laravel Herd-like features! Here's what you can do now:

### 🚀 Getting Started

1. **Open Laravel God Mode**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001

2. **Create Your First Laravel Project**
   - Click "Create Project"
   - Choose "Laravel" template
   - Configure your settings:
     - PHP version (8.3 recommended)
     - Enable services: Redis, phpMyAdmin, MailHog
     - Set custom ports or keep defaults
   - Click "Create Project"

### 🎛️ Laravel Management Panel

When you create or select a Laravel project, you'll see a comprehensive management panel with these tabs:

#### **Services Tab** 🏗️
- **Real-time status** of all containers
- **Health indicators** for each service
- **Port information** and quick access
- **Resource monitoring** (CPU/Memory)

#### **Artisan Tab** 🎨
Quick access to common Laravel commands:
- **Migrate** - Run database migrations
- **Fresh & Seed** - Reset DB with sample data
- **Clear Cache** - Clear all Laravel caches
- **Routes** - View all application routes
- **Tinker** - Open Laravel Tinker REPL
- **Custom Commands** - Run any artisan command

#### **Queue Tab** 🚀
Complete queue worker management:
- **Start/Stop Workers** - Control background job processing
- **Real-time Job Monitoring** - See pending, processing, failed jobs
- **Worker Status** - Number of active workers
- **Job Statistics** - Track job performance

#### **Cache Tab** ⚡
Laravel cache management:
- **Clear All Cache** - One-click cache clearing
- **Selective Clearing** - Clear config, views, routes individually
- **Cache Driver Info** - See Redis/file cache status
- **Performance Tools** - Optimize for production

#### **Database Tab** 🗄️
Database operations made easy:
- **Run Migrations** - Execute pending migrations
- **Fresh Migrate** - Reset database structure
- **Fresh + Seed** - Reset with sample data
- **phpMyAdmin** - Direct database management interface

#### **Logs Tab** 📋
Real-time log monitoring:
- **Laravel Application Logs** - Application errors and info
- **Nginx Logs** - Web server access/error logs
- **MySQL Logs** - Database query logs
- **Redis Logs** - Cache operation logs

### 🛠️ Enhanced Project Features

#### **Project Selection**
- Click any Laravel project card to activate the management panel
- Selected projects show with a highlighted border
- Real-time status updates without page refresh

#### **Service Quick Actions**
From each project card, you can:
- **🌐 App** - Open the Laravel application
- **🗄️ DB** - Open phpMyAdmin (if enabled)
- **📧 Mail** - Open MailHog email testing (if enabled)
- **📥 SQL** - Import SQL files with drag & drop
- **⚙️ Ports** - Edit service ports with conflict detection
- **💻 Code** - Open project in your preferred editor

#### **Enhanced Makefile Commands**
Each Laravel project now includes comprehensive make commands:

```bash
# Container Management
make start         # Start all containers
make stop          # Stop all containers
make restart       # Restart containers
make status        # Show container status

# Laravel Development
make artisan CMD='migrate'    # Run artisan commands
make migrate                  # Quick migration
make fresh                    # Fresh install with seeds
make cache-clear             # Clear all caches
make setup                   # Initial Laravel setup

# Queue Management
make queue-work              # Start queue worker
make queue-stop              # Stop all workers
make queue-retry             # Retry failed jobs

# Database Tools
make backup                  # Backup database
make import                  # Import latest SQL file
make db-shell               # Open database shell

# Development Tools
make test                   # Run PHPUnit tests
make pint                   # Laravel Pint formatting
make shell                  # Open container shell
```

### 🎯 Laravel Herd-like Features

#### **Real-time Monitoring** 📊
- **Service Health Checks** - Automatic monitoring of all services
- **Queue Worker Status** - See active workers and job processing
- **Resource Usage** - Monitor CPU and memory per container
- **Connection Status** - Database and cache connectivity

#### **One-click Operations** 🖱️
- **Start/Stop Services** - Control individual or all services
- **Cache Management** - Clear caches without terminal commands
- **Migration Runner** - Run migrations with visual feedback
- **Queue Control** - Start/stop workers from the UI

#### **Development Workflow** 🔄
- **Auto Port Conflict Detection** - Prevent port conflicts
- **Environment Editor** - Edit .env files in-browser
- **SQL Import/Export** - Drag & drop database management
- **Multi-editor Support** - VS Code, PhpStorm, WebStorm, etc.

### 🚨 Tips & Best Practices

#### **Project Management**
- Always check service status before development
- Use the queue tab to monitor background jobs
- Keep database backups using the backup feature
- Monitor logs for debugging issues

#### **Performance**
- Enable Redis for better cache performance
- Use queue workers for background processing
- Clear caches after configuration changes
- Monitor resource usage in the services tab

#### **Development Workflow**
1. **Start your project** from the dashboard
2. **Check service health** in the Laravel panel
3. **Run migrations** if needed
4. **Start queue workers** for background jobs
5. **Monitor logs** during development
6. **Use phpMyAdmin** for database management

### 🔧 Configuration

#### **Custom Ports**
Each service can use custom ports:
- **App**: 8000 (Laravel application)
- **MySQL**: 3306 (database)
- **Redis**: 6379 (cache)
- **phpMyAdmin**: 8080 (database admin)
- **MailHog**: 8025 (email testing)

The system automatically checks for port conflicts and suggests alternatives.

#### **Service Options**
When creating projects, you can:
- Choose PHP versions (7.4 - 8.4)
- Enable/disable Redis caching
- Add phpMyAdmin for database management
- Include MailHog for email testing
- Select Node.js version for frontend tools

### 🎉 You're Ready!

Laravel God Mode now provides a complete Laravel Herd-like experience:
- ✅ **Project isolation** with Docker containers
- ✅ **Service management** with visual controls
- ✅ **Queue monitoring** and worker management
- ✅ **Database tools** and migration runners
- ✅ **Cache management** with one-click clearing
- ✅ **Real-time monitoring** of all services
- ✅ **Development tools** and editor integration

**Happy Laravel development!** 🚀

---

*Need help? Check the logs in the Logs tab or run `make help` in your project directory.*
