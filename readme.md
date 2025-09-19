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

Laravel God Mode provides comprehensive Laravel project management capabilities that rival and exceed those of Laravel Herd. Here's everything you can do:

### 🏗️ **Project Creation & Setup**

<details>
<summary><strong>🚀 Smart Project Creation</strong></summary>

Create Laravel projects with intelligent defaults and customization options:

```bash
# Web Interface Method (Recommended)
# 1. Open http://localhost:3000
# 2. Click "Create New Project"
# 3. Configure options through beautiful UI
# 4. Watch real-time progress

# Command Line Method
make laravel-new NAME=my-awesome-project

# Advanced Configuration
# Projects are created in: projects/my-awesome-project/
# Includes: Docker setup, Laravel installation, service configuration
```

**Available Configurations:**
- **PHP Versions**: 7.4, 8.0, 8.1, 8.2, 8.3
- **Services**: MySQL, PostgreSQL, Redis, MailHog, phpMyAdmin
- **Development Tools**: Xdebug, Composer, Node.js
- **Custom Ports**: Automatic or manual port assignment

</details>

### 📊 **Service Dashboard & Monitoring**

<details>
<summary><strong>🌐 Real-Time Service Dashboard</strong></summary>

**Container Status Monitoring:**
- ✅ **Live Status Indicators** - Visual health checks for all containers
- 📊 **Resource Usage** - Real-time CPU, memory, and disk monitoring
- 🌐 **Port Information** - Quick access links to all services
- ⚡ **Performance Metrics** - Response times and throughput tracking

**Service Health Checks:**
- **Web Server** (Nginx/Apache) - HTTP response monitoring
- **Database** (MySQL/PostgreSQL) - Connection and query performance
- **Cache** (Redis) - Memory usage and hit rates
- **Queue Workers** - Job processing status and backlog
- **Mail** (MailHog) - Email capture and debugging

</details>

<details>
<summary><strong>📈 Performance Monitoring</strong></summary>

**Resource Tracking:**
```bash
# View detailed container stats
make status

# Monitor resource usage
docker stats

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Performance Metrics:**
- CPU usage per container
- Memory consumption tracking
- Disk I/O monitoring
- Network traffic analysis
- Database query performance
- Cache hit/miss ratios

</details>

### 🛠️ **Artisan Command Integration**

<details>
<summary><strong>⚡ One-Click Artisan Commands</strong></summary>

**Migration Management:**
```bash
# Run pending migrations
make laravel-migrate

# Fresh install with seeders
php artisan migrate:fresh --seed

# Rollback migrations
php artisan migrate:rollback
```

**Cache Management:**
```bash
# Clear all caches
php artisan optimize:clear

# Selective cache clearing
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

**Development Commands:**
```bash
# Laravel Tinker
php artisan tinker

# Route debugging
php artisan route:list

# View compiled views
php artisan view:cache

# Generate app key
php artisan key:generate
```

</details>

<details>
<summary><strong>🎯 Custom Artisan Runner</strong></summary>

**Web Interface Features:**
- **Command History** - Previously run commands with one-click repeat
- **Parameter Builder** - Visual form for complex commands
- **Output Streaming** - Real-time command output display
- **Error Handling** - Beautiful error formatting and suggestions

**Common Quick Actions:**
- Generate models, controllers, migrations
- Run specific seeders
- Clear specific caches
- Queue management commands
- Maintenance mode toggle

</details>

### 🔄 **Queue & Job Management**

<details>
<summary><strong>⚡ Advanced Queue Monitoring</strong></summary>

**Worker Management:**
```bash
# Start queue workers
php artisan queue:work

# Restart workers (after code changes)
php artisan queue:restart

# Monitor failed jobs
php artisan queue:failed
```

**Real-Time Monitoring:**
- **Job Processing Dashboard** - Live view of job execution
- **Queue Statistics** - Pending, processing, completed, failed counts
- **Worker Status** - See which workers are active
- **Performance Metrics** - Jobs per minute, average processing time
- **Memory Usage** - Worker memory consumption tracking

</details>

<details>
<summary><strong>🔧 Job Management Tools</strong></summary>

**Failed Job Recovery:**
- **Retry Individual Jobs** - One-click retry for specific failed jobs
- **Bulk Retry** - Retry all failed jobs at once
- **Job Inspection** - Detailed view of job payload and error details
- **Delete Failed Jobs** - Clean up old failed jobs

**Queue Monitoring:**
- **Multiple Queue Support** - Monitor different queue connections
- **Priority Queues** - Visual indicators for job priorities
- **Delayed Jobs** - See jobs scheduled for future execution
- **Job Payload Inspection** - Debug job data and parameters

</details>

### 🗄️ **Database Management Tools**

<details>
<summary><strong>🔍 phpMyAdmin Integration</strong></summary>

**Full Database Management:**
- **Direct Access** - One-click access to phpMyAdmin interface
- **Multiple Databases** - Manage all project databases
- **Import/Export** - SQL file import/export with progress tracking
- **Query Builder** - Visual query construction tools
- **Table Designer** - Visual table structure editing

**Database Tools:**
```bash
# Access phpMyAdmin
# Available at: http://localhost:8080 (default)
# Or click "Database" in the project dashboard

# Database backups
mysqldump -u root -p database_name > backup.sql

# Import SQL files
mysql -u root -p database_name < backup.sql
```

</details>

<details>
<summary><strong>📊 Migration & Seeder Tools</strong></summary>

**Migration Management:**
- **Visual Migration Runner** - See migration progress in real-time
- **Rollback Tools** - Safely rollback migrations with confirmation
- **Migration Status** - View which migrations have been run
- **Batch Operations** - Run multiple migrations at once

**Seeder Management:**
- **Individual Seeders** - Run specific seeders from the UI
- **Seeder Chains** - Execute multiple seeders in sequence
- **Data Validation** - Verify seeded data integrity
- **Custom Seeders** - Support for complex seeding operations

</details>

### 💾 **Cache Management System**

<details>
<summary><strong>🚀 Intelligent Cache Control</strong></summary>

**Cache Operations:**
```bash
# Clear all caches (recommended)
make laravel-cache-clear

# Selective cache clearing
php artisan config:clear    # Configuration cache
php artisan view:clear      # Compiled views
php artisan route:clear     # Route cache
php artisan cache:clear     # Application cache
```

**Cache Monitoring:**
- **Cache Driver Status** - See which cache driver is active (file, Redis, etc.)
- **Cache Size Tracking** - Monitor cache storage usage
- **Hit Rate Analysis** - Cache effectiveness metrics
- **Key Management** - View and manage cache keys

</details>

<details>
<summary><strong>📈 Redis Monitoring (When Enabled)</strong></summary>

**Redis Dashboard:**
- **Memory Usage** - Real-time Redis memory consumption
- **Key Statistics** - Number of keys, expiration tracking
- **Command Statistics** - Most used Redis commands
- **Slow Query Log** - Identify performance bottlenecks
- **Client Connections** - Monitor active Redis connections

</details>

### 📋 **Development Tools & Utilities**

<details>
<summary><strong>💻 Integrated Development Environment</strong></summary>

**In-Browser Tools:**
- **Container Terminal** - Execute commands directly in containers
- **File Explorer** - Browse project files through web interface
- **Log Viewer** - Real-time streaming of all container logs
- **Environment Editor** - Edit .env files with syntax highlighting

**Editor Integration:**
```bash
# Open in VS Code
make code

# Open in PhpStorm
phpstorm .

# Open in WebStorm
webstorm .
```

</details>

<details>
<summary><strong>📊 Project Analytics</strong></summary>

**Development Insights:**
```bash
# Project statistics
make stats

# Detailed project info
make info

# Health check report
make check
```

**Analytics Dashboard:**
- **Code Metrics** - Lines of code, file counts, project size
- **Performance Metrics** - Average response times, memory usage
- **Development Activity** - Git commit activity, file change frequency
- **Service Uptime** - Container uptime and restart history

</details>

### 🔧 **Advanced Configuration**

<details>
<summary><strong>⚙️ Environment Management</strong></summary>

**Configuration Tools:**
- **Visual .env Editor** - Edit environment variables with validation
- **Configuration Templates** - Quick setup for different environments
- **Secret Management** - Secure handling of sensitive data
- **Validation Tools** - Real-time validation of configuration values

**Environment Presets:**
- **Development** - Debug enabled, local services
- **Testing** - Test database, mock services
- **Staging** - Production-like with debug tools
- **Production** - Optimized for performance and security

</details>

<details>
<summary><strong>🐳 Docker Configuration</strong></summary>

**Container Customization:**
- **Service Selection** - Enable/disable services per project
- **Version Management** - Choose specific PHP, MySQL, Node.js versions
- **Resource Limits** - Set CPU and memory limits for containers
- **Port Configuration** - Custom port assignments and SSL setup

**Docker Compose Features:**
- **Override Files** - Project-specific Docker configurations
- **Volume Management** - Persistent data storage configuration
- **Network Configuration** - Custom network setups for complex projects
- **Health Checks** - Container health monitoring configuration

</details>

## 📖 Documentation

### 🏗️ **Architecture Overview**

Laravel God Mode follows a modern, scalable architecture designed for both simplicity and power:

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 Web Interface                         │
│               (Frontend - Port 3000)                       │
├─────────────────────────────────────────────────────────────┤
│                    🔧 REST API                              │
│               (Backend - Port 5001)                        │
├─────────────────────────────────────────────────────────────┤
│                  🐳 Docker Engine                           │
│             (Project Containers)                           │
├─────────────────────────────────────────────────────────────┤
│                 💾 File System                              │
│          (Projects, Templates, Data)                       │
└─────────────────────────────────────────────────────────────┘
```

<details>
<summary><strong>🧩 Component Details</strong></summary>

**Frontend (Vanilla JavaScript + Modern CSS)**
- Progressive Web App (PWA) capabilities
- Real-time WebSocket connections
- Responsive design with dark theme
- Component-based architecture
- Service worker for offline functionality

**Backend (Node.js + Express)**
- RESTful API design
- WebSocket server for real-time updates
- Docker management integration
- File system operations
- Process management utilities

**Container Management**
- Docker Compose orchestration
- Dynamic port allocation
- Health monitoring
- Resource management
- Network isolation

</details>

### 📁 **Project Structure**

```
laravel-godmode/
├── 📂 backend/                 # Node.js API server
│   ├── 📂 src/
│   │   ├── 📂 routes/          # API route definitions
│   │   ├── 📂 utils/           # Utility functions
│   │   └── 📄 server.js        # Main server file
│   └── 📄 package.json
├── 📂 frontend/                # Web interface
│   ├── 📂 public/
│   │   ├── 📂 js/
│   │   │   ├── 📂 components/  # UI components
│   │   │   ├── 📂 views/       # Page views
│   │   │   └── 📂 utils/       # Frontend utilities
│   │   ├── 📂 styles/          # CSS stylesheets
│   │   └── 📄 index.html       # Main HTML file
│   └── 📄 package.json
├── 📂 projects/                # Laravel projects workspace
│   ├── 📂 project-name-1/      # Individual Laravel projects
│   └── 📂 project-name-2/
├── 📂 templates/               # Project templates
│   ├── 📂 laravel/             # Laravel project templates
│   └── 📂 nodejs/              # Node.js project templates
├── 📂 data/                    # Application data
│   ├── 📂 backups/            # Project backups
│   └── 📄 projects.json        # Project registry
└── 📄 Makefile                 # Command automation
```

### 🔧 **Configuration & Customization**

<details>
<summary><strong>⚙️ Environment Configuration</strong></summary>

**Main Configuration (.env)**
```bash
# Application Settings
NODE_ENV=development
LOG_LEVEL=info

# Network Configuration
BACKEND_PORT=5001
FRONTEND_PORT=3000
BACKEND_HOST=localhost
FRONTEND_HOST=localhost

# WebSocket Configuration
WS_PORT=5001

# Docker Settings
DOCKER_SOCKET=/var/run/docker.sock
DEFAULT_NETWORK=laravel-godmode

# Development Settings
HOT_RELOAD=true
DEBUG_MODE=true
```

**Project Template Configuration (templates/laravel/config.json)**
```json
{
  "name": "Laravel Project",
  "description": "Full-stack Laravel application with Docker",
  "services": {
    "web": {
      "image": "nginx:alpine",
      "ports": ["80:80"]
    },
    "app": {
      "build": "./docker/php",
      "volumes": ["./src:/var/www/html"]
    },
    "database": {
      "image": "mysql:8.0",
      "environment": {
        "MYSQL_ROOT_PASSWORD": "root",
        "MYSQL_DATABASE": "laravel"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>🎨 UI Customization</strong></summary>

**Theme Configuration (frontend/public/styles/main.css)**
```css
:root {
  /* Primary Brand Colors */
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --accent-color: #06d6a0;

  /* Status Colors */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  /* Dark Theme */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
}
```

**Component Customization**
- Modify individual components in `frontend/public/js/components/`
- Custom styles in `frontend/public/styles/`
- Brand customization through CSS variables
- Layout modifications through HTML templates

</details>

### 🚀 **API Reference**

<details>
<summary><strong>📡 REST API Endpoints</strong></summary>

**Project Management**
```http
GET    /api/projects           # List all projects
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project

GET    /api/projects/:id/status    # Get project status
POST   /api/projects/:id/start     # Start project containers
POST   /api/projects/:id/stop      # Stop project containers
POST   /api/projects/:id/restart   # Restart project containers
```

**Service Management**
```http
GET    /api/services           # List all services
GET    /api/services/:id/logs  # Get service logs
POST   /api/services/:id/restart # Restart specific service
```

**System Information**
```http
GET    /api/system/health      # System health check
GET    /api/system/stats       # System statistics
GET    /api/system/docker      # Docker information
```

**Template Management**
```http
GET    /api/templates          # List available templates
GET    /api/templates/:id      # Get template details
POST   /api/templates          # Create custom template
```

</details>

<details>
<summary><strong>🔌 WebSocket Events</strong></summary>

**Real-Time Updates**
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5001');

// Listen for events
ws.on('project:status', (data) => {
    // Project status changed
    console.log('Project status:', data);
});

ws.on('container:log', (data) => {
    // New log entry
    console.log('Container log:', data);
});

ws.on('system:stats', (data) => {
    // System statistics update
    console.log('System stats:', data);
});
```

**Available Events**
- `project:created` - New project created
- `project:status` - Project status changed
- `container:log` - New container log entry
- `service:health` - Service health update
- `system:stats` - System resource update

</details>

### 🛠️ **Development Guide**

<details>
<summary><strong>🧱 Adding New Features</strong></summary>

**Backend Development**
```bash
# Add new API route
# 1. Create route file in backend/src/routes/
# 2. Implement business logic
# 3. Add to main server.js

# Example: New service management route
touch backend/src/routes/services.js
```

**Frontend Development**
```bash
# Add new UI component
# 1. Create component in frontend/public/js/components/
# 2. Add styles in frontend/public/styles/
# 3. Import in main.js

# Example: New monitoring widget
touch frontend/public/js/components/monitoring-widget.js
```

**Template Development**
```bash
# Create new project template
# 1. Create template directory in templates/
# 2. Add config.json and stub files
# 3. Update template registry

mkdir templates/my-framework
touch templates/my-framework/config.json
```

</details>

<details>
<summary><strong>🧪 Testing & Debugging</strong></summary>

**Testing Commands**
```bash
# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run integration tests
npm run test:integration
```

**Debugging Tools**
```bash
# Debug mode (verbose logging)
NODE_ENV=development DEBUG=* make dev

# Check system health
make check

# View detailed system info
make debug-info

# Monitor resource usage
make status
```

**Log Analysis**
```bash
# View application logs
make logs

# View specific service logs
docker logs laravel-godmode-backend

# Follow logs in real-time
tail -f backend/logs/app.log
```

</details>

### 🔌 **Integration Guide**

<details>
<summary><strong>🔗 Third-Party Integrations</strong></summary>

**IDE Integration**
```bash
# VS Code integration
# Add to .vscode/settings.json:
{
  "laravel-godmode.autoStart": true,
  "laravel-godmode.defaultPort": 3000
}

# PhpStorm integration
# Configure external tools for Make commands
```

**CI/CD Integration**
```yaml
# GitHub Actions example
name: Laravel God Mode
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Laravel God Mode
        run: |
          make install
          make test
```

**Monitoring Integration**
```bash
# Prometheus metrics
curl http://localhost:5001/metrics

# Health check endpoint
curl http://localhost:5001/health
```

</details>

<details>
<summary><strong>⚡ Performance Optimization</strong></summary>

**Backend Optimization**
- Enable Node.js clustering for multi-core utilization
- Implement Redis caching for frequently accessed data
- Use connection pooling for database operations
- Enable gzip compression for API responses

**Frontend Optimization**
- Implement service worker for offline functionality
- Use lazy loading for components
- Optimize images and assets
- Enable browser caching

**Container Optimization**
- Use multi-stage Docker builds
- Implement health checks for all services
- Optimize resource limits
- Use Docker layer caching

</details>

## 🔧 Troubleshooting

### 🚨 **Common Issues & Solutions**

<details>
<summary><strong>🔌 Port Conflict Issues</strong></summary>

**Problem**: "Port already in use" errors when starting the application.

**Solutions**:
```bash
# Quick fix: Kill processes on default ports
make kill-ports

# Check what's using the ports
make debug-ports

# Use different ports (modify .env file)
BACKEND_PORT=5002
FRONTEND_PORT=3001

# Force stop all related processes
make force-stop
```

**Prevention**:
- Always use `make stop` to gracefully shut down
- Check `make status` before starting
- Use the built-in port conflict detection

</details>

<details>
<summary><strong>🐳 Docker-Related Issues</strong></summary>

**Problem**: Docker containers won't start or behave unexpectedly.

**Solutions**:
```bash
# Clean Docker system
docker system prune -f

# Restart Docker daemon (macOS/Windows)
# Docker Desktop: Settings → Restart

# Check Docker health
make check

# Rebuild containers from scratch
make docker-rebuild
```

**Common Docker Issues**:
- **Insufficient disk space**: Run `docker system prune -f`
- **Network conflicts**: Restart Docker daemon
- **Permission issues**: Check Docker socket permissions
- **Memory limits**: Increase Docker memory allocation

</details>

<details>
<summary><strong>📦 Dependency & Installation Issues</strong></summary>

**Problem**: Installation fails or dependencies are missing.

**Solutions**:
```bash
# Check system dependencies
make deps

# Clean install
make clean
make install

# Manual dependency check
node --version    # Should be 18+
docker --version  # Should be latest
npm --version     # Should be latest
```

**Node.js Issues**:
```bash
# Update Node.js to latest LTS
# Use nvm (recommended)
nvm install --lts
nvm use --lts

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

</details>

<details>
<summary><strong>🌐 Network & Connection Issues</strong></summary>

**Problem**: Frontend can't connect to backend or services are unreachable.

**Solutions**:
```bash
# Check if backend is running
curl http://localhost:5001/health

# Verify WebSocket connection
# Check browser developer console for errors

# Check firewall settings
# Ensure ports 3000 and 5001 are not blocked

# Network troubleshooting
make status
make debug-info
```

**Browser Issues**:
- **CORS errors**: Check backend CORS configuration
- **WebSocket errors**: Verify WS_PORT in .env file
- **Cache issues**: Hard refresh (Ctrl+Shift+R) or clear browser cache

</details>

<details>
<summary><strong>🎯 Laravel Project Issues</strong></summary>

**Problem**: Laravel project won't start or containers fail.

**Solutions**:
```bash
# Navigate to project directory
cd projects/your-project

# Check container logs
make docker-logs

# Rebuild project containers
make docker-rebuild

# Check Laravel configuration
# Verify .env file in project/src/
```

**Common Laravel Issues**:
- **Database connection**: Check database container status
- **Permission issues**: Ensure proper file permissions in Laravel project
- **Missing APP_KEY**: Run `php artisan key:generate`
- **Cache issues**: Run `php artisan optimize:clear`

</details>

### 🏥 **Health Check & Diagnostics**

<details>
<summary><strong>🔍 System Health Checks</strong></summary>

**Comprehensive Health Check**:
```bash
# Run full health check
make check

# Expected output:
# ✅ Backend: Healthy and responding
# ✅ Frontend: Healthy and responding
# ✅ Internet: Connected
```

**Individual Service Checks**:
```bash
# Backend health
curl http://localhost:5001/health

# Frontend accessibility
curl http://localhost:3000

# Docker service status
docker ps

# System resources
make status
```

</details>

<details>
<summary><strong>📊 Debug Information Collection</strong></summary>

**System Debug Info**:
```bash
# Comprehensive debug information
make debug-info

# Includes:
# - OS and shell information
# - Tool versions (Node.js, Docker, etc.)
# - Network configuration
# - Active ports and processes
```

**Process Debugging**:
```bash
# Show all related processes
make debug-processes

# Show port usage
make debug-ports

# Monitor resource usage
top -p $(pgrep -d',' node)
```

</details>

### 🛠️ **Advanced Troubleshooting**

<details>
<summary><strong>🔧 Performance Issues</strong></summary>

**High CPU/Memory Usage**:
```bash
# Monitor resource usage
make status

# Check individual container resources
docker stats

# Optimize container resources
# Edit docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

**Slow Performance**:
- **Backend slow**: Check Node.js event loop lag
- **Frontend slow**: Check browser developer tools
- **Docker slow**: Increase Docker memory/CPU allocation
- **Database slow**: Check MySQL/PostgreSQL logs

</details>

<details>
<summary><strong>🔄 Recovery Procedures</strong></summary>

**Complete Reset (Nuclear Option)**:
```bash
# WARNING: This will remove all data
make force-stop
make deep-clean
make install
make dev
```

**Partial Reset**:
```bash
# Clean build artifacts only
make clean
make install

# Reset specific project
cd projects/problematic-project
make docker-down
rm -rf .docker-data
make docker-up
```

**Backup & Restore**:
```bash
# Create backup before troubleshooting
make backup

# Restore from backup if needed
make restore BACKUP=backup-20231201-120000.tar.gz
```

</details>

### 📞 **Getting Help**

<details>
<summary><strong>🆘 Support Resources</strong></summary>

**Before Asking for Help**:
1. Run `make check` and share the output
2. Run `make debug-info` for system information
3. Check the logs with `make logs`
4. Try the common solutions above

**Information to Include**:
- Operating system and version
- Docker version (`docker --version`)
- Node.js version (`node --version`)
- Error messages (full text)
- Steps to reproduce the issue
- Output of `make debug-info`

**Community Support**:
- GitHub Issues: Report bugs and feature requests
- Discussions: Ask questions and share tips
- Wiki: Community-maintained documentation
- Discord: Real-time chat support

</details>

<details>
<summary><strong>🐛 Bug Reporting</strong></summary>

**Bug Report Template**:
```markdown
**Environment**:
- OS: [e.g., macOS 12.0, Ubuntu 20.04]
- Docker: [docker --version output]
- Node.js: [node --version output]
- Laravel God Mode: [make version output]

**Description**:
Brief description of the issue

**Steps to Reproduce**:
1. Step one
2. Step two
3. See error

**Expected Behavior**:
What you expected to happen

**Actual Behavior**:
What actually happened

**Error Logs**:
```
Paste relevant error logs here
```

**Additional Context**:
Any other relevant information
```

</details>

### ⚡ **Quick Fix Commands**

| Issue | Quick Fix Command | Description |
|-------|------------------|-------------|
| Port conflicts | `make kill-ports` | Free up stuck ports |
| Stuck processes | `make force-stop` | Force kill all processes |
| Cache issues | `make clean && make install` | Clean reinstall |
| Docker issues | `docker system prune -f` | Clean Docker system |
| Permission issues | `sudo chown -R $USER:$USER .` | Fix file permissions |
| Network issues | `make restart` | Restart all services |
| Database issues | `make laravel-migrate` | Re-run migrations |
| Build issues | `make deep-clean && make install` | Nuclear reset |

---

## 🤝 Contributing

We welcome contributions from the Laravel community! Laravel God Mode is built by developers, for developers.

### 🚀 **How to Contribute**

<details>
<summary><strong>🐛 Bug Reports</strong></summary>

Found a bug? Please help us fix it:

1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** (see Troubleshooting section)
3. **Include detailed information**:
   - System information (`make debug-info`)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs and screenshots

</details>

<details>
<summary><strong>✨ Feature Requests</strong></summary>

Have an idea for a new feature?

1. **Check the roadmap** to see if it's already planned
2. **Open a discussion** to gather community feedback
3. **Create a detailed feature request** with:
   - Use case and benefits
   - Proposed implementation
   - UI/UX mockups (if applicable)

</details>

<details>
<summary><strong>💻 Code Contributions</strong></summary>

Ready to contribute code?

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/laravel-godmode.git
cd laravel-godmode

# 2. Create a feature branch
git checkout -b feature/amazing-new-feature

# 3. Set up development environment
make install
make dev

# 4. Make your changes and test
make test
make check

# 5. Commit with descriptive messages
git commit -m "Add amazing new feature for better UX"

# 6. Push and create pull request
git push origin feature/amazing-new-feature
```

**Contribution Guidelines**:
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Keep pull requests focused and atomic

</details>

### 🎯 **Development Roadmap**

<details>
<summary><strong>🔮 Upcoming Features</strong></summary>

**v1.1.0 - Enhanced Monitoring**
- [ ] Advanced performance metrics dashboard
- [ ] Container resource usage graphs
- [ ] Database query analysis tools
- [ ] Custom alert configurations

**v1.2.0 - Multi-Framework Support**
- [ ] Node.js/Express project templates
- [ ] Vue.js/Nuxt.js project support
- [ ] React/Next.js project templates
- [ ] Python/Django integration

**v1.3.0 - Advanced DevOps**
- [ ] Built-in CI/CD pipeline management
- [ ] Kubernetes deployment support
- [ ] Cloud provider integrations (AWS, DigitalOcean)
- [ ] Automated backup and restore

**v2.0.0 - Enterprise Features**
- [ ] Multi-user authentication and authorization
- [ ] Team collaboration features
- [ ] Project sharing and templates marketplace
- [ ] Advanced security scanning and compliance

</details>

<details>
<summary><strong>🛠️ Technical Improvements</strong></summary>

**Performance Optimizations**
- [ ] Backend caching layer with Redis
- [ ] Frontend service worker implementation
- [ ] Docker image optimization
- [ ] Database query optimization

**Developer Experience**
- [ ] VS Code extension for Laravel God Mode
- [ ] CLI tool for project management
- [ ] IDE integrations (PhpStorm, WebStorm)
- [ ] Advanced debugging tools

**Infrastructure**
- [ ] Automated testing pipeline
- [ ] Performance benchmarking
- [ ] Security audit automation
- [ ] Documentation automation

</details>

---

## 📄 License

Laravel God Mode is open-source software licensed under the [MIT License](LICENSE).

### 🎯 **What this means for you:**

✅ **Commercial Use** - Use in commercial projects
✅ **Modification** - Modify the source code
✅ **Distribution** - Distribute copies of the software
✅ **Private Use** - Use for personal/private projects
✅ **Patent Grant** - Express grant of patent rights from contributors

⚠️ **Requirements**:
- Include the original license and copyright notice
- Changes must be documented if distributing

❌ **Limitations**:
- No warranty provided
- No liability for damages
- Trademark rights not granted

---

## 🙏 Acknowledgments

Laravel God Mode stands on the shoulders of giants. We're grateful to:

### 🚀 **Core Technologies**
- **[Laravel](https://laravel.com/)** - The elegant PHP framework that inspired this project
- **[Docker](https://docker.com/)** - Container technology that powers our isolation
- **[Node.js](https://nodejs.org/)** - JavaScript runtime for our backend
- **[Express.js](https://expressjs.com/)** - Web framework for our API

### 🎨 **Design & UI**
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework inspiration
- **[Heroicons](https://heroicons.com/)** - Beautiful SVG icons
- **[Inter Font](https://rsms.me/inter/)** - Typography that enhances readability

### 🛠️ **Development Tools**
- **[Make](https://www.gnu.org/software/make/)** - Build automation tool
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** - Real-time communication
- **[Docker Compose](https://docs.docker.com/compose/)** - Multi-container orchestration

### 💡 **Inspiration**
- **[Laravel Herd](https://herd.laravel.com/)** - The premium Laravel development environment
- **[XAMPP](https://www.apachefriends.org/)** - The classic local development solution
- **[Local by Flywheel](https://localwp.com/)** - WordPress local development inspiration

### 🤝 **Community**
- **Laravel Community** - For building amazing tools and sharing knowledge
- **Docker Community** - For container technology and best practices
- **Open Source Contributors** - For making the web a better place

---

<div align="center">

## 💫 **Built with ❤️ by the Community**

**Laravel God Mode** - *Because everyone deserves a great development experience, for free.*

### 🌟 **Star us on GitHub** | 🐛 **Report Issues** | 💬 **Join Discussions**

---

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open-Source-blue?style=for-the-badge)
![Community Driven](https://img.shields.io/badge/Community-Driven-green?style=for-the-badge)

**[⬆️ Back to Top](#-laravel-god-mode)**

</div>
