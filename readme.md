# 🚀 Laravel God Mode - The Free Laravel Herd Alternative

> **A powerful, Docker-based Laravel development environment manager that brings Laravel Herd-like features to any system, completely free!**

Laravel God Mode is designed to be the ultimate free alternative to Laravel Herd, providing a beautiful interface to manage Laravel projects with Docker. It offers all the convenience features you love about Laravel Herd but runs entirely on Docker containers.

## ✨ Features

### 🎯 **Laravel Herd-like Experience**
- **One-click project creation** with Laravel templates
- **Real-time service monitoring** - see what's running at a glance
- **Queue management** - start/stop workers, monitor jobs
- **Database tools** - phpMyAdmin integration, migrations, seeders
- **Cache management** - clear caches with one click
- **Artisan commands** - run commands directly from the UI
- **Logs viewer** - real-time container and Laravel logs

### 🐳 **Docker-Powered**
- **Full isolation** - each project runs in its own containers
- **Port management** - automatic port conflict detection
- **Service health monitoring** - database, Redis, queue workers
- **Resource monitoring** - CPU, memory usage per container
- **One-command setup** - `make dev` gets everything running

### 🛠️ **Developer Tools**
- **Integrated terminal** - run commands in project containers
- **Environment editor** - edit .env files with syntax highlighting
- **SQL import/export** - drag & drop SQL file imports
- **Multiple editors** - VS Code, PhpStorm, WebStorm support
- **Hot reload** - changes reflect immediately

### 🌐 **Modern UI**
- **Dark theme** with beautiful gradients
- **Responsive design** - works on all screen sizes
- **Real-time updates** - WebSocket-powered live updates
- **Toast notifications** - clear feedback on all actions
- **Keyboard shortcuts** - power user friendly

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (latest versions recommended)
- **Node.js 18+**
- **Make** (for convenient commands)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd laravel-godmode
   ```

2. **Install dependencies and start**
   ```bash
   make install  # Install all dependencies
   make dev      # Start in development mode
   ```

3. **Open your browser**
   ```
   Frontend: http://localhost:3000
   Backend:  http://localhost:5000
   ```

### First Laravel Project

1. Click **"Create Project"** in the dashboard
2. Choose **Laravel** template
3. Configure your settings:
   - PHP version (7.4 - 8.3)
   - Node.js version
   - Enable Redis, phpMyAdmin, MailHog as needed
   - Set custom ports or use defaults
4. Click **"Create Project"**
5. Watch the magic happen! ✨

## 📋 Available Commands

### Global Commands
```bash
make help          # Show all available commands
make install       # Install all dependencies
make dev           # Start in development mode
make start         # Start the application
make stop          # Stop the application
make restart       # Restart the application
make status        # Show application status
make clean         # Clean build artifacts
```

### Development
```bash
make logs          # Show application logs
make deps          # Check dependencies
make check         # Run health checks
```

## 🎯 Laravel Project Management

Once you've created a Laravel project, you get:

### **Service Dashboard**
- **Container Status** - See which services are running
- **Health Indicators** - Real-time health monitoring
- **Port Information** - Quick access to all services
- **Resource Usage** - Monitor CPU and memory

### **Artisan Integration**
Quick access to common commands:
- `migrate` - Run database migrations
- `migrate:fresh --seed` - Fresh install with sample data
- `cache:clear` - Clear all caches
- `route:list` - View all routes
- `tinker` - Open Laravel Tinker
- **Custom commands** - Run any artisan command

### **Queue Management**
- **Start/Stop Workers** - Control queue processing
- **Job Monitoring** - See pending, processing, failed jobs
- **Failed Job Recovery** - Retry failed jobs
- **Real-time Updates** - Watch jobs being processed

### **Database Tools**
- **Migration Runner** - Run migrations with one click
- **Fresh Migrations** - Reset database with seeders
- **phpMyAdmin Access** - Direct database management
- **SQL Import** - Drag & drop SQL files to import
- **Backup Tools** - Create database backups

### **Cache Management**
- **Clear All Caches** - One-click cache clearing
- **Selective Clearing** - Clear config, views, routes separately
- **Cache Status** - See which cache driver is active
- **Redis Monitoring** - Monitor Redis when enabled

### **Development Tools**
- **Live Logs** - Real-time Laravel, Nginx, MySQL logs
- **Container Terminal** - Run commands in containers
- **Environment Editor** - Edit .env files in-browser
- **Editor Integration** - Open projects in VS Code, PhpStorm, etc.

## 🎯 Laravel Herd Comparison

| Feature | Laravel Herd | Laravel God Mode |
|---------|--------------|------------------|
| **Price** | $99/year | **Free** |
| **Platform** | macOS only | **Any OS with Docker** |
| **Project Isolation** | Shared environment | **Full Docker isolation** |
| **Service Management** | ✅ | ✅ |
| **Queue Monitoring** | ✅ | ✅ |
| **Database Tools** | ✅ | ✅ |
| **Custom PHP Versions** | ✅ | ✅ |
| **Port Management** | ✅ | ✅ |
| **Editor Integration** | ✅ | ✅ |
| **Real-time Logs** | ✅ | ✅ |
| **Cache Management** | ✅ | ✅ |
| **Terminal Access** | ✅ | ✅ |
| **Open Source** | ❌ | ✅ |
| **Customizable** | ❌ | ✅ |

## � Troubleshooting

### Common Issues

**Port conflicts**
```bash
make kill-ports  # Kill processes on default ports
make status      # Check application status
```

**Docker issues**
```bash
docker system prune -f  # Clean Docker system
make restart            # Restart application
```

**Project won't start**
```bash
cd projects/your-project
make logs               # Check container logs
make build              # Rebuild containers
```

**Frontend not connecting to backend**
- Check `window.BACKEND_PORT` in `frontend/public/index.html`
- Verify backend is running on port 5000
- Check browser console for errors

### Health Checks
```bash
make check       # Run application health checks
make status      # Show service status
make deps        # Verify dependencies
```

---

**Made with ❤️ for the Laravel community**

*Laravel God Mode - Because everyone deserves a great development experience, for free.*
