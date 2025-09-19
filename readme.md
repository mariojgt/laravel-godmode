# 🚀 Laravel God Mode
### *The Ultimate Free Laravel Development Environment*

<div align="center">

![Laravel God Mode Banner](https://img.shields.io/badge/Laravel-God%20Mode-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Powered-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Built-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Free](https://img.shields.io/badge/100%25-Free-00C851?style=for-the-badge)

**A powerful, Docker-based Laravel development environment manager that brings Laravel Herd-like features to any system, completely free!**

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🛠️ Commands](#️-available-commands) • [🎯 Laravel Management](#-laravel-project-management)

</div>

---

## 🌟 Overview

Laravel God Mode is designed to be the **ultimate free alternative to Laravel Herd**, providing a beautiful web interface to manage Laravel projects with Docker containers. It offers all the convenience features you love about Laravel Herd but runs entirely on open-source technologies.

### 🎯 **Why Laravel God Mode?**

- **🆓 Completely Free** - No subscription fees, no limitations
- **🐳 Docker-Based** - Full project isolation and consistency
- **🌐 Web Interface** - Beautiful, modern UI accessible from any browser
- **⚡ Lightning Fast** - Optimized for performance and developer productivity
- **🔧 Full-Featured** - Everything you need for Laravel development
- **🎨 Developer-Friendly** - Built by developers, for developers

## ✨ Features

### 🎯 **Laravel Herd-Like Experience**
<details>
<summary><strong>🔥 One-Click Project Creation</strong></summary>

- **Smart Templates** - Pre-configured Laravel setups with best practices
- **Version Selection** - Choose PHP 7.4, 8.0, 8.1, 8.2, or 8.3
- **Service Integration** - Auto-configure MySQL, Redis, MailHog, phpMyAdmin
- **Custom Configuration** - Tailor each project to your specific needs
- **Instant Setup** - From idea to running Laravel project in under 2 minutes

</details>

<details>
<summary><strong>📊 Real-Time Service Monitoring</strong></summary>

- **Live Status Dashboard** - See all services at a glance
- **Health Indicators** - Visual health checks for all containers
- **Resource Monitoring** - CPU, memory, and disk usage tracking
- **Port Management** - Automatic conflict detection and resolution
- **Performance Metrics** - Response times and throughput monitoring

</details>

<details>
<summary><strong>⚡ Queue & Job Management</strong></summary>

- **Worker Control** - Start/stop/restart queue workers
- **Job Monitoring** - Real-time job processing dashboard
- **Failed Job Recovery** - One-click retry for failed jobs
- **Queue Statistics** - Pending, processing, completed, and failed metrics
- **Multiple Queue Support** - Manage different queue connections

</details>

<details>
<summary><strong>🗄️ Advanced Database Tools</strong></summary>

- **phpMyAdmin Integration** - Full database management interface
- **Migration Runner** - Execute migrations with detailed progress
- **Seeder Management** - Run specific seeders or refresh entire database
- **SQL Import/Export** - Drag & drop SQL files for easy data management
- **Database Backups** - Automated backup creation and restoration

</details>

### 🐳 **Docker-Powered Infrastructure**
<details>
<summary><strong>🔒 Complete Project Isolation</strong></summary>

- **Individual Containers** - Each project runs in its own environment
- **Network Isolation** - Projects can't interfere with each other
- **Custom PHP Configurations** - Different PHP settings per project
- **Environment Variables** - Secure and isolated configuration management

</details>

<details>
<summary><strong>🌐 Intelligent Port Management</strong></summary>

- **Auto Port Detection** - Automatically finds available ports
- **Conflict Resolution** - Smart handling of port conflicts
- **Custom Port Assignment** - Set specific ports for your projects
- **Load Balancing Ready** - Easy nginx/Apache reverse proxy setup

</details>

<details>
<summary><strong>📈 Health & Performance Monitoring</strong></summary>

- **Container Health Checks** - Continuous monitoring of all services
- **Resource Usage Tracking** - Real-time CPU, memory, and disk metrics
- **Performance Alerts** - Notifications when resources exceed thresholds
- **Log Aggregation** - Centralized logging from all containers

</details>

### 🛠️ **Professional Developer Tools**
<details>
<summary><strong>💻 Integrated Development Environment</strong></summary>

- **In-Browser Terminal** - Execute commands directly in containers
- **Code Editor Integration** - VS Code, PhpStorm, WebStorm support
- **File Manager** - Browse and edit project files through the web interface
- **Syntax Highlighting** - Beautiful code highlighting for all major languages

</details>

<details>
<summary><strong>🔧 Environment Management</strong></summary>

- **Visual .env Editor** - Edit environment files with syntax highlighting
- **Configuration Validation** - Real-time validation of configuration values
- **Environment Templates** - Quick setup for development, staging, production
- **Secret Management** - Secure handling of sensitive configuration data

</details>

<details>
<summary><strong>📁 Project Templates & Scaffolding</strong></summary>

- **Laravel Templates** - Various Laravel project templates
- **Custom Stubs** - Create your own project templates
- **Service Presets** - Common service combinations (LAMP, LEMP, etc.)
- **Development Workflows** - Pre-configured CI/CD pipelines

</details>

### 🌐 **Modern Web Interface**
<details>
<summary><strong>🎨 Beautiful & Responsive Design</strong></summary>

- **Dark Theme** - Easy on the eyes for long coding sessions
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Modern UI Components** - Beautiful, accessible interface elements
- **Customizable Dashboard** - Arrange widgets to match your workflow

</details>

<details>
<summary><strong>⚡ Real-Time Updates</strong></summary>

- **WebSocket Integration** - Live updates without page refreshes
- **Progress Indicators** - Real-time feedback for long-running operations
- **Toast Notifications** - Instant feedback for all actions
- **Live Log Streaming** - Watch logs in real-time

</details>

<details>
<summary><strong>⌨️ Power User Features</strong></summary>

- **Keyboard Shortcuts** - Navigate quickly with keyboard commands
- **Bulk Operations** - Manage multiple projects simultaneously
- **Quick Actions** - Common tasks accessible with single clicks
- **Search & Filter** - Find projects and services quickly

</details>

## 🚀 Quick Start

### 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Docker** | Latest | Container runtime | [Get Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | Latest | Multi-container orchestration | [Install Compose](https://docs.docker.com/compose/install/) |
| **Node.js** | 18+ | Frontend and build tools | [Download Node.js](https://nodejs.org/) |
| **Make** | Any | Command automation | Usually pre-installed on macOS/Linux |

### ⚡ Installation

#### **Option 1: Quick Setup (Recommended)**
```bash
# Clone the repository
git clone https://github.com/mariojgt/laravel-godmode.git
cd laravel-godmode

# One-command setup
make quick-start
```

#### **Option 2: Step-by-Step Setup**
```bash
# 1. Clone and enter directory
git clone https://github.com/mariojgt/laravel-godmode.git
cd laravel-godmode

# 2. Check system dependencies
make deps

# 3. Install project dependencies
make install

# 4. Start development environment
make dev
```

#### **Option 3: Manual Setup**
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

### 🌐 Access Your Application

Once installation is complete, your application will be available at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Main web interface |
| **Backend API** | [http://localhost:5001](http://localhost:5001) | REST API endpoints |
| **API Documentation** | [http://localhost:5001/docs](http://localhost:5001/docs) | Swagger/OpenAPI docs |

### 🎯 Create Your First Laravel Project

1. **Open the Dashboard**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll see the beautiful Laravel God Mode dashboard

2. **Create a New Project**
   ```bash
   # Using the web interface (recommended)
   Click "Create New Project" → Choose "Laravel" → Configure & Create
   
   # Or using the command line
   make laravel-new NAME=my-awesome-project
   ```

3. **Configure Your Project**
   - **Project Name**: Choose a meaningful name
   - **PHP Version**: Select from 7.4, 8.0, 8.1, 8.2, or 8.3
   - **Services**: Enable MySQL, Redis, MailHog, phpMyAdmin as needed
   - **Ports**: Use auto-assigned ports or set custom ones

4. **Launch Your Project**
   ```bash
   cd projects/my-awesome-project
   make docker-up
   ```

5. **Access Your Laravel App**
   - Your new Laravel application will be available at the assigned port
   - phpMyAdmin (if enabled) for database management
   - MailHog (if enabled) for email testing

### ⚡ Quick Commands Reference

```bash
# Application Management
make help              # Show all available commands
make status            # Check what's running
make logs              # View application logs
make restart           # Restart everything

# Project Management
make laravel-new NAME=project-name    # Create new Laravel project
make docker-up         # Start project containers
make docker-down       # Stop project containers
make laravel-migrate   # Run database migrations

# Development
make dev               # Start development mode
make build             # Build for production
make clean             # Clean up build artifacts
make update            # Update all dependencies

# Troubleshooting
make check             # Run health checks
make debug-info        # Show system information
make kill-ports        # Free up stuck ports
make force-stop        # Emergency stop all processes
```

## �️ Available Commands

Laravel God Mode comes with a comprehensive set of Make commands to streamline your development workflow. All commands are beautifully formatted and provide clear feedback.

### 🚀 **Development Commands**

| Command | Description | Usage |
|---------|-------------|-------|
| `make start` | Start the full application stack | Production-ready startup |
| `make dev` | Start in development mode with hot reload | Best for active development |
| `make stop` | Gracefully stop the application | Clean shutdown with cleanup |
| `make restart` | Restart the entire application | Quick restart without manual steps |
| `make status` | Show detailed application status | Check what's running and resource usage |

### 🔧 **Setup & Installation**

| Command | Description | When to Use |
|---------|-------------|-------------|
| `make install` | Install all project dependencies | First setup or after dependency changes |
| `make deps` | Check system dependencies | Verify system requirements |
| `make init` | Initialize project structure | Create missing directories |
| `make config` | Show current configuration | Debug configuration issues |

### 🏗️ **Build & Maintenance**

| Command | Description | Purpose |
|---------|-------------|---------|
| `make build` | Build application for production | Prepare for deployment |
| `make clean` | Clean build artifacts and cache | Free up space, fix build issues |
| `make check` | Run comprehensive health checks | Verify application health |
| `make logs` | Display application logs | Debug issues, monitor activity |

### 🐳 **Docker Commands**

| Command | Description | Project Context |
|---------|-------------|-----------------|
| `make docker-up` | Start Docker containers | Run from project directory |
| `make docker-down` | Stop Docker containers | Clean shutdown of project |
| `make docker-rebuild` | Rebuild Docker images | After Dockerfile changes |
| `make docker-logs` | Show Docker container logs | Debug container issues |

### 🎯 **Laravel Project Management**

| Command | Description | Example |
|---------|-------------|---------|
| `make laravel-new NAME=project` | Create new Laravel project | `make laravel-new NAME=blog` |
| `make laravel-install` | Install Laravel dependencies | Run in Laravel project directory |
| `make laravel-migrate` | Run database migrations | Execute pending migrations |
| `make laravel-seed` | Seed the database | Populate with test data |

### 🆘 **Emergency & Debugging**

| Command | Description | When to Use |
|---------|-------------|-------------|
| `make force-stop` | Force kill all related processes | When normal stop doesn't work |
| `make kill-ports` | Kill processes on default ports | Fix port conflict issues |
| `make debug-info` | Show debugging information | System troubleshooting |
| `make debug-ports` | Show detailed port information | Debug port conflicts |
| `make debug-processes` | Show all related processes | Process troubleshooting |

### 🎓 **Additional Utilities**

| Command | Description | Use Case |
|---------|-------------|----------|
| `make quick-start` | Complete setup in one command | New installation |
| `make deep-clean` | Nuclear clean (removes everything) | Reset to fresh state |
| `make update` | Update all dependencies | Keep packages current |
| `make backup` | Create project backup | Before major changes |
| `make restore BACKUP=file.tar.gz` | Restore from backup | Recover from backup |
| `make stats` | Show project statistics | Project overview |

### 🎯 **Productivity Shortcuts**

| Command | Description | Benefit |
|---------|-------------|---------|
| `make code` | Open project in VS Code | Quick IDE access |
| `make open` | Open application in browser | Skip manual navigation |
| `make version` | Show version information | Quick version check |
| `make info` | Show detailed project information | Project overview |

### 💡 **Command Tips**

<details>
<summary><strong>🔍 Getting Help</strong></summary>

```bash
# Beautiful help display
make help

# Show project information
make info

# Check current configuration
make config
```

</details>

<details>
<summary><strong>⚡ Quick Development Workflow</strong></summary>

```bash
# Start development
make dev

# In another terminal, check status
make status

# View logs if needed
make logs

# Stop when done
make stop
```

</details>

<details>
<summary><strong>🐛 Troubleshooting Workflow</strong></summary>

```bash
# Check system health
make check

# View detailed debug info
make debug-info

# Kill stuck processes if needed
make force-stop

# Clean restart
make clean && make install && make dev
```

</details>

<details>
<summary><strong>🎯 Laravel Project Workflow</strong></summary>

```bash
# Create new project
make laravel-new NAME=my-project

# Navigate to project
cd projects/my-project

# Start containers
make docker-up

# Run migrations
make laravel-migrate

# Seed database
make laravel-seed
```

</details>

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
