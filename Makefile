# ==============================================================================
# 🚀 Laravel God Mode - Full-stack Application Manager
# ==============================================================================
# A comprehensive Makefile for managing Laravel projects, Docker containers,
# and development workflows with style and ease.
# ==============================================================================

# Load environment variables from .env file if it exists
ifneq (,$(wildcard ./.env))
    include .env
    export $(shell sed 's/=.*//' .env)
endif

# ==============================================================================
# 📝 Configuration Variables
# ==============================================================================

# Default ports
BACKEND_PORT ?= 5000
FRONTEND_PORT ?= 3000

# Project settings
PROJECT_NAME := Laravel God Mode
VERSION := 1.0.0
AUTHOR := Mario Tarosso

# ==============================================================================
# 🎨 Color Definitions
# ==============================================================================

# Basic colors
BLACK := \033[30m
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
WHITE := \033[37m

# Bright colors
BRIGHT_BLACK := \033[90m
BRIGHT_RED := \033[91m
BRIGHT_GREEN := \033[92m
BRIGHT_YELLOW := \033[93m
BRIGHT_BLUE := \033[94m
BRIGHT_MAGENTA := \033[95m
BRIGHT_CYAN := \033[96m
BRIGHT_WHITE := \033[97m

# Text formatting
RESET := \033[0m
BOLD := \033[1m
DIM := \033[2m
ITALIC := \033[3m
UNDERLINE := \033[4m

# Background colors
BG_RED := \033[41m
BG_GREEN := \033[42m
BG_YELLOW := \033[43m
BG_BLUE := \033[44m
BG_MAGENTA := \033[45m
BG_CYAN := \033[46m

# Custom theme colors
PRIMARY := $(BRIGHT_CYAN)
SECONDARY := $(BRIGHT_MAGENTA)
SUCCESS := $(BRIGHT_GREEN)
WARNING := $(BRIGHT_YELLOW)
ERROR := $(BRIGHT_RED)
INFO := $(BRIGHT_BLUE)
MUTED := $(BRIGHT_BLACK)

# ==============================================================================
# 📋 PHONY Targets Declaration
# ==============================================================================

.PHONY: help info version banner
.PHONY: install deps check-node check-docker check-ports
.PHONY: start stop restart force-stop dev
.PHONY: build clean status logs health check
.PHONY: kill-ports config init
.PHONY: docker-up docker-down docker-rebuild docker-logs
.PHONY: laravel-new laravel-install laravel-migrate laravel-seed
.PHONY: test test-unit test-feature test-coverage
.PHONY: lint format security audit
.PHONY: backup restore deploy
.PHONY: debug-info debug-ports debug-processes

# ==============================================================================
# 🎯 Default Target
# ==============================================================================

.DEFAULT_GOAL := help

# ==============================================================================
# 📖 Help & Information Commands
# ==============================================================================

## 📖 Display this beautiful help menu
help: banner
	@echo ""
	@echo "$(BOLD)$(PRIMARY)📚 Available Commands:$(RESET)"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)🚀 Development Commands:$(RESET)"
	@echo "  $(PRIMARY)make start$(RESET)           $(MUTED)#$(RESET) Start the full application stack"
	@echo "  $(PRIMARY)make dev$(RESET)             $(MUTED)#$(RESET) Start in development mode with hot reload"
	@echo "  $(PRIMARY)make stop$(RESET)            $(MUTED)#$(RESET) Gracefully stop the application"
	@echo "  $(PRIMARY)make restart$(RESET)         $(MUTED)#$(RESET) Restart the entire application"
	@echo "  $(PRIMARY)make status$(RESET)          $(MUTED)#$(RESET) Show detailed application status"
	@echo ""
	@echo "$(BOLD)$(INFO)🔧 Setup & Installation:$(RESET)"
	@echo "  $(PRIMARY)make install$(RESET)         $(MUTED)#$(RESET) Install all dependencies"
	@echo "  $(PRIMARY)make deps$(RESET)            $(MUTED)#$(RESET) Check system dependencies"
	@echo "  $(PRIMARY)make init$(RESET)            $(MUTED)#$(RESET) Initialize project structure"
	@echo "  $(PRIMARY)make config$(RESET)          $(MUTED)#$(RESET) Show current configuration"
	@echo ""
	@echo "$(BOLD)$(WARNING)🏗️ Build & Maintenance:$(RESET)"
	@echo "  $(PRIMARY)make build$(RESET)           $(MUTED)#$(RESET) Build the application for production"
	@echo "  $(PRIMARY)make clean$(RESET)           $(MUTED)#$(RESET) Clean build artifacts and cache"
	@echo "  $(PRIMARY)make check$(RESET)           $(MUTED)#$(RESET) Run comprehensive health checks"
	@echo "  $(PRIMARY)make logs$(RESET)            $(MUTED)#$(RESET) Display application logs"
	@echo ""
	@echo "$(BOLD)$(SECONDARY)🐳 Docker Commands:$(RESET)"
	@echo "  $(PRIMARY)make docker-up$(RESET)       $(MUTED)#$(RESET) Start Docker containers"
	@echo "  $(PRIMARY)make docker-down$(RESET)     $(MUTED)#$(RESET) Stop Docker containers"
	@echo "  $(PRIMARY)make docker-rebuild$(RESET)  $(MUTED)#$(RESET) Rebuild Docker images"
	@echo "  $(PRIMARY)make docker-logs$(RESET)     $(MUTED)#$(RESET) Show Docker container logs"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)🎯 Laravel Commands:$(RESET)"
	@echo "  $(PRIMARY)make laravel-new$(RESET)     $(MUTED)#$(RESET) Create a new Laravel project"
	@echo "  $(PRIMARY)make laravel-install$(RESET) $(MUTED)#$(RESET) Install Laravel dependencies"
	@echo "  $(PRIMARY)make laravel-migrate$(RESET) $(MUTED)#$(RESET) Run database migrations"
	@echo "  $(PRIMARY)make laravel-seed$(RESET)    $(MUTED)#$(RESET) Seed the database"
	@echo ""
	@echo "$(BOLD)$(ERROR)🆘 Emergency Commands:$(RESET)"
	@echo "  $(PRIMARY)make force-stop$(RESET)      $(MUTED)#$(RESET) Force kill all related processes"
	@echo "  $(PRIMARY)make kill-ports$(RESET)      $(MUTED)#$(RESET) Kill processes on default ports"
	@echo "  $(PRIMARY)make debug-info$(RESET)      $(MUTED)#$(RESET) Show debugging information"
	@echo ""
	@echo "$(BOLD)$(MUTED)💡 Quick Tips:$(RESET)"
	@echo "  $(MUTED)• Use$(RESET) $(PRIMARY)make info$(RESET) $(MUTED)for project details$(RESET)"
	@echo "  $(MUTED)• Use$(RESET) $(PRIMARY)make config$(RESET) $(MUTED)to see current settings$(RESET)"
	@echo "  $(MUTED)• Use$(RESET) $(PRIMARY)make status$(RESET) $(MUTED)to check what's running$(RESET)"
	@echo ""
	@printf "$(MUTED)$(DIM)%*s$(RESET)\n" 80 | tr ' ' '─'
	@echo "$(MUTED)  💫 Built with ❤️ by $(AUTHOR) | Version $(VERSION)$(RESET)"
	@echo ""

## 🎨 Display beautiful project banner
banner:
	@echo ""
	@echo "$(BOLD)$(PRIMARY)"
	@echo "╔══════════════════════════════════════════════════════════════════════════════╗"
	@echo "║                                                                              ║"
	@echo "║    $(SECONDARY)🚀 $(PROJECT_NAME)$(PRIMARY)                                                 ║"
	@echo "║                                                                              ║"
	@echo "║    $(WHITE)The Ultimate Laravel Project Management Tool$(PRIMARY)                         ║"
	@echo "║    $(MUTED)Streamline your Laravel development workflow$(PRIMARY)                         ║"
	@echo "║                                                                              ║"
	@echo "╚══════════════════════════════════════════════════════════════════════════════╝"
	@echo "$(RESET)"

## 📋 Show detailed project information
info: banner
	@echo ""
	@echo "$(BOLD)$(INFO)📊 Project Information:$(RESET)"
	@echo ""
	@echo "$(SUCCESS)  📦 Project:$(RESET)       $(PROJECT_NAME)"
	@echo "$(SUCCESS)  🏷️  Version:$(RESET)       $(VERSION)"
	@echo "$(SUCCESS)  👨‍💻 Author:$(RESET)        $(AUTHOR)"
	@echo "$(SUCCESS)  📅 Updated:$(RESET)       $(shell date '+%Y-%m-%d %H:%M:%S')"
	@echo ""
	@echo "$(BOLD)$(INFO)📁 Project Structure:$(RESET)"
	@echo "$(SUCCESS)  📂 backend/$(RESET)         Node.js backend server & API"
	@echo "$(SUCCESS)  📂 frontend/$(RESET)        Modern web frontend interface"
	@echo "$(SUCCESS)  📂 projects/$(RESET)        Laravel projects workspace"
	@echo "$(SUCCESS)  📂 templates/$(RESET)       Project scaffolding templates"
	@echo "$(SUCCESS)  📂 data/$(RESET)           Application data & configuration"
	@echo "$(SUCCESS)  📄 Makefile$(RESET)        This beautiful command interface"
	@echo ""
	@echo "$(BOLD)$(INFO)🌐 Default URLs:$(RESET)"
	@echo "$(SUCCESS)  🎨 Frontend:$(RESET)       http://localhost:$(FRONTEND_PORT)"
	@echo "$(SUCCESS)  🔧 Backend:$(RESET)        http://localhost:$(BACKEND_PORT)"
	@echo "$(SUCCESS)  📊 API Docs:$(RESET)       http://localhost:$(BACKEND_PORT)/docs"
	@echo ""
	@echo "$(BOLD)$(INFO)⚡ Quick Start:$(RESET)"
	@echo "$(PRIMARY)  1.$(RESET) $(PRIMARY)make install$(RESET)     $(MUTED)# Install dependencies$(RESET)"
	@echo "$(PRIMARY)  2.$(RESET) $(PRIMARY)make dev$(RESET)         $(MUTED)# Start development mode$(RESET)"
	@echo "$(PRIMARY)  3.$(RESET) $(SECONDARY)Open browser$(RESET)    $(MUTED)# Visit http://localhost:$(FRONTEND_PORT)$(RESET)"
	@echo ""

## 🏷️ Show version information
version:
	@echo "$(BOLD)$(PRIMARY)$(PROJECT_NAME)$(RESET) $(SECONDARY)v$(VERSION)$(RESET)"
	@echo "$(MUTED)Built by $(AUTHOR)$(RESET)"

# ==============================================================================
# 🔧 System Dependencies & Configuration
# ==============================================================================

## 🔍 Check if Node.js is installed
check-node:
	@printf "$(INFO)🔍 Checking Node.js...$(RESET) "
	@if ! command -v node >/dev/null 2>&1; then \
		echo "$(ERROR)❌ Not installed$(RESET)"; \
		echo "$(WARNING)💡 Install from: https://nodejs.org/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(SUCCESS)✅ $(shell node --version)$(RESET)"

## 🐳 Check if Docker is installed
check-docker:
	@printf "$(INFO)🔍 Checking Docker...$(RESET) "
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(ERROR)❌ Not installed$(RESET)"; \
		echo "$(WARNING)💡 Install from: https://docker.com/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(SUCCESS)✅ $(shell docker --version | cut -d' ' -f3 | cut -d',' -f1)$(RESET)"

## ⚡ Check all system dependencies
deps: check-node check-docker
	@echo "$(SUCCESS)✅ All system dependencies are ready!$(RESET)"

## ⚙️ Show current configuration
config: banner
	@echo ""
	@echo "$(BOLD)$(INFO)⚙️ Current Configuration:$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🌐 Network Settings:$(RESET)"
	@echo "  $(PRIMARY)Backend Port:$(RESET)   $(BACKEND_PORT)"
	@echo "  $(PRIMARY)Frontend Port:$(RESET)  $(FRONTEND_PORT)"
	@echo ""
	@echo "$(SUCCESS)📁 Environment:$(RESET)"
	@if [ -f .env ]; then \
		echo "  $(SUCCESS)✅ .env file found$(RESET)"; \
		echo ""; \
		echo "$(PRIMARY)  Environment Variables:$(RESET)"; \
		cat .env | grep -E '^[A-Z]' | sed 's/^/    /' | sed 's/=/$(MUTED) = $(RESET)/' || true; \
	else \
		echo "  $(WARNING)⚠️ .env file not found (using defaults)$(RESET)"; \
		echo "$(MUTED)    💡 Create a .env file to customize settings$(RESET)"; \
	fi
	@echo ""
	@echo "$(SUCCESS)🔗 Application URLs:$(RESET)"
	@echo "  $(PRIMARY)Frontend:$(RESET)       http://localhost:$(FRONTEND_PORT)"
	@echo "  $(PRIMARY)Backend API:$(RESET)    http://localhost:$(BACKEND_PORT)"
	@echo "  $(PRIMARY)Health Check:$(RESET)   http://localhost:$(BACKEND_PORT)/health"
	@echo ""

# ==============================================================================
# 📦 Installation & Setup
# ==============================================================================

## 📦 Install all project dependencies
install: deps
	@echo "$(BOLD)$(PRIMARY)📦 Installing Dependencies$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Installing backend dependencies...$(RESET)"
	@cd backend && npm install --silent
	@echo "$(SUCCESS)  ✅ Backend dependencies installed$(RESET)"
	@echo ""
	@echo "$(INFO)🎨 Installing frontend dependencies...$(RESET)"
	@cd frontend && npm install --silent
	@echo "$(SUCCESS)  ✅ Frontend dependencies installed$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🎉 All dependencies installed successfully!$(RESET)"
	@echo "$(MUTED)💡 Run 'make dev' to start development mode$(RESET)"

## 🏗️ Initialize project structure
init:
	@echo "$(BOLD)$(PRIMARY)🏗️ Initializing Project Structure$(RESET)"
	@echo ""
	@echo "$(INFO)📁 Creating directory structure...$(RESET)"
	@mkdir -p backend/src/{routes,controllers,utils,config}
	@mkdir -p backend/logs
	@mkdir -p frontend/src/{components,views,utils,styles}
	@mkdir -p frontend/public
	@mkdir -p templates/{laravel,nodejs}/stubs
	@mkdir -p data/{projects,backups,cache}
	@mkdir -p projects
	@echo "$(SUCCESS)✅ Project structure created successfully!$(RESET)"

# ==============================================================================
# 🌐 Port Management
# ==============================================================================

## 🔍 Check if ports are available
check-ports:
	@echo "$(INFO)🔍 Checking port availability...$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(ERROR)❌ Port $(BACKEND_PORT) (backend) is busy$(RESET)"; \
		echo "$(WARNING)🔧 Process details:$(RESET)"; \
		lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN | sed 's/^/  /'; \
		echo "$(MUTED)💡 Use 'make kill-ports' to free the port$(RESET)"; \
		exit 1; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(ERROR)❌ Port $(FRONTEND_PORT) (frontend) is busy$(RESET)"; \
		echo "$(WARNING)🔧 Process details:$(RESET)"; \
		lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN | sed 's/^/  /'; \
		echo "$(MUTED)💡 Use 'make kill-ports' to free the port$(RESET)"; \
		exit 1; \
	fi
	@echo "$(SUCCESS)✅ Ports $(BACKEND_PORT) and $(FRONTEND_PORT) are available$(RESET)"

## 🔪 Kill processes on configured ports
kill-ports:
	@echo "$(WARNING)🔪 Freeing up ports $(BACKEND_PORT) and $(FRONTEND_PORT)...$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(INFO)  ⏹️ Stopping process on port $(BACKEND_PORT)...$(RESET)"; \
		sudo kill -9 $$(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(INFO)  ⏹️ Stopping process on port $(FRONTEND_PORT)...$(RESET)"; \
		sudo kill -9 $$(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
	fi
	@echo "$(SUCCESS)✅ Ports have been freed$(RESET)"

# ==============================================================================
# 🚀 Application Lifecycle Management
# ==============================================================================

## 🚀 Start the application stack
start: deps check-ports
	@echo "$(BOLD)$(PRIMARY)🚀 Starting Laravel God Mode$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Starting backend server...$(RESET)"
	@cd backend && npm start &
	@echo "$(SUCCESS)  ✅ Backend started on port $(BACKEND_PORT)$(RESET)"
	@sleep 3
	@echo "$(INFO)🎨 Starting frontend server...$(RESET)"
	@cd frontend && npm start &
	@echo "$(SUCCESS)  ✅ Frontend started on port $(FRONTEND_PORT)$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🎉 Application started successfully!$(RESET)"
	@echo ""
	@echo "$(BOLD)$(PRIMARY)🌐 Access your application:$(RESET)"
	@echo "  $(PRIMARY)🎨 Frontend:$(RESET)  $(UNDERLINE)http://localhost:$(FRONTEND_PORT)$(RESET)"
	@echo "  $(PRIMARY)🔧 Backend:$(RESET)   $(UNDERLINE)http://localhost:$(BACKEND_PORT)$(RESET)"
	@echo ""
	@echo "$(MUTED)💡 Use 'make status' to check running services$(RESET)"
	@echo "$(MUTED)💡 Use 'make logs' to view application logs$(RESET)"

## 🛠️ Start in development mode
dev: deps check-ports
	@echo "$(BOLD)$(PRIMARY)🛠️ Starting Development Mode$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Starting backend in dev mode...$(RESET)"
	@cd backend && npm run dev &
	@echo "$(SUCCESS)  ✅ Backend dev server started$(RESET)"
	@sleep 3
	@echo "$(INFO)🎨 Starting frontend in dev mode...$(RESET)"
	@cd frontend && npm run dev &
	@echo "$(SUCCESS)  ✅ Frontend dev server started$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🎉 Development environment ready!$(RESET)"
	@echo ""
	@echo "$(BOLD)$(PRIMARY)🌐 Development URLs:$(RESET)"
	@echo "  $(PRIMARY)🎨 Frontend:$(RESET)  $(UNDERLINE)http://localhost:$(FRONTEND_PORT)$(RESET)"
	@echo "  $(PRIMARY)🔧 Backend:$(RESET)   $(UNDERLINE)http://localhost:$(BACKEND_PORT)$(RESET)"
	@echo ""
	@echo "$(WARNING)🔥 Hot reload enabled - changes will auto-refresh!$(RESET)"

## ⏹️ Stop the application gracefully
stop:
	@echo "$(BOLD)$(WARNING)⏹️ Stopping Laravel God Mode$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Stopping backend (port $(BACKEND_PORT))...$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		kill -TERM $$(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
		sleep 2; \
		if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(WARNING)  🔪 Force stopping backend...$(RESET)"; \
			kill -9 $$(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
		fi; \
		echo "$(SUCCESS)  ✅ Backend stopped$(RESET)"; \
	else \
		echo "$(MUTED)  ℹ️ Backend not running$(RESET)"; \
	fi
	@echo "$(INFO)🎨 Stopping frontend (port $(FRONTEND_PORT))...$(RESET)"
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		kill -TERM $$(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
		sleep 2; \
		if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(WARNING)  🔪 Force stopping frontend...$(RESET)"; \
			kill -9 $$(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
		fi; \
		echo "$(SUCCESS)  ✅ Frontend stopped$(RESET)"; \
	else \
		echo "$(MUTED)  ℹ️ Frontend not running$(RESET)"; \
	fi
	@echo "$(INFO)🧹 Cleaning up remaining processes...$(RESET)"
	@pkill -f "app-manager-backend" 2>/dev/null || true
	@pkill -f "app-manager-frontend" 2>/dev/null || true
	@pkill -f "node.*backend.*server" 2>/dev/null || true
	@pkill -f "node.*frontend.*server" 2>/dev/null || true
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print $$2}' | xargs -r kill -TERM 2>/dev/null || true
	@sleep 1
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print $$2}' | xargs -r kill -9 2>/dev/null || true
	@echo ""
	@echo "$(SUCCESS)✅ Application stopped successfully$(RESET)"

## 🔄 Restart the application
restart:
	@echo "$(BOLD)$(PRIMARY)🔄 Restarting Laravel God Mode$(RESET)"
	@echo ""
	@$(MAKE) stop
	@echo "$(INFO)⏳ Waiting for cleanup...$(RESET)"
	@sleep 3
	@$(MAKE) start

## 💀 Force stop all related processes (emergency)
force-stop:
	@echo "$(BOLD)$(ERROR)💀 Emergency Stop - Force Killing All Processes$(RESET)"
	@echo "$(WARNING)⚠️ This will forcefully terminate ALL related processes$(RESET)"
	@echo ""
	@echo "$(ERROR)🔪 Force stopping port processes...$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(WARNING)  💥 Killing backend processes...$(RESET)"; \
		sudo kill -9 $$(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(WARNING)  💥 Killing frontend processes...$(RESET)"; \
		sudo kill -9 $$(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
	fi
	@echo "$(ERROR)🔪 Force stopping app processes...$(RESET)"
	@sudo pkill -9 -f "app-manager" 2>/dev/null || true
	@sudo pkill -9 -f "node.*backend" 2>/dev/null || true
	@sudo pkill -9 -f "node.*frontend" 2>/dev/null || true
	@sudo pkill -9 -f "node.*server.js" 2>/dev/null || true
	@ps aux | grep -E "node.*$$(pwd)" | grep -v grep | awk '{print $$2}' | xargs -r sudo kill -9 2>/dev/null || true
	@echo ""
	@echo "$(SUCCESS)✅ All processes forcefully terminated$(RESET)"
	@echo "$(MUTED)💡 Run 'make status' to verify all processes are stopped$(RESET)"

# ==============================================================================
# 🏗️ Build & Maintenance
# ==============================================================================

## 🔨 Build the application for production
build: deps
	@echo "$(BOLD)$(PRIMARY)🔨 Building Application for Production$(RESET)"
	@echo ""
	@echo "$(INFO)🎨 Building frontend...$(RESET)"
	@cd frontend && npm run build
	@echo "$(SUCCESS)  ✅ Frontend build complete$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Building backend...$(RESET)"
	@cd backend && npm run build 2>/dev/null || echo "$(MUTED)  ℹ️ No backend build script found$(RESET)"
	@echo "$(SUCCESS)  ✅ Backend build complete$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🎉 Production build completed successfully!$(RESET)"

## 🧹 Clean build artifacts and dependencies
clean:
	@echo "$(BOLD)$(WARNING)🧹 Cleaning Build Artifacts$(RESET)"
	@echo ""
	@echo "$(INFO)🗑️ Removing node_modules...$(RESET)"
	@rm -rf backend/node_modules frontend/node_modules
	@echo "$(SUCCESS)  ✅ Dependencies cleaned$(RESET)"
	@echo ""
	@echo "$(INFO)🗑️ Removing build directories...$(RESET)"
	@rm -rf backend/dist frontend/dist frontend/build
	@echo "$(SUCCESS)  ✅ Build artifacts cleaned$(RESET)"
	@echo ""
	@echo "$(INFO)🗑️ Removing log files...$(RESET)"
	@rm -rf backend/logs/*.log frontend/logs/*.log 2>/dev/null || true
	@echo "$(SUCCESS)  ✅ Logs cleaned$(RESET)"
	@echo ""
	@echo "$(SUCCESS)🎉 Cleanup completed!$(RESET)"
	@echo "$(MUTED)💡 Run 'make install' to reinstall dependencies$(RESET)"

# ==============================================================================
# 📊 Monitoring & Status
# ==============================================================================

## 📊 Show detailed application status
status:
	@echo "$(BOLD)$(PRIMARY)📊 Laravel God Mode Status$(RESET)"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)🌐 Port Status:$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "  $(SUCCESS)✅ Backend ($(BACKEND_PORT)):$(RESET) Running"; \
		lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN | grep LISTEN | awk '{print "     $(MUTED)PID: " $$2 ", Process: " $$1 "$(RESET)"}'; \
	else \
		echo "  $(ERROR)❌ Backend ($(BACKEND_PORT)):$(RESET) Not running"; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "  $(SUCCESS)✅ Frontend ($(FRONTEND_PORT)):$(RESET) Running"; \
		lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN | grep LISTEN | awk '{print "     $(MUTED)PID: " $$2 ", Process: " $$1 "$(RESET)"}'; \
	else \
		echo "  $(ERROR)❌ Frontend ($(FRONTEND_PORT)):$(RESET) Not running"; \
	fi
	@echo ""
	@echo "$(BOLD)$(SUCCESS)🔧 Process Details:$(RESET)"
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print "  $(PRIMARY)PID: " $$2 "$(RESET) $(MUTED)| Command: " $$11 " " $$12 " " $$13 "$(RESET)"}' || echo "  $(MUTED)No related Node.js processes found$(RESET)"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)🐳 Docker Status:$(RESET)"
	@if command -v docker >/dev/null 2>&1; then \
		if docker ps -q 2>/dev/null | wc -l | grep -q "0"; then \
			echo "  $(MUTED)ℹ️ No Docker containers running$(RESET)"; \
		else \
			echo "  $(SUCCESS)📦 Running containers:$(RESET)"; \
			docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tail -n +2 | sed 's/^/    /' || true; \
		fi \
	else \
		echo "  $(MUTED)ℹ️ Docker not available$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)$(SUCCESS)💾 System Resources:$(RESET)"
	@echo "  $(PRIMARY)Memory:$(RESET) $$(ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{sum += $$6} END {printf "%.1f MB\n", sum/1024}' 2>/dev/null || echo "0 MB")"
	@echo "  $(PRIMARY)CPU:$(RESET) $$(ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{sum += $$3} END {printf "%.1f%%\n", sum}' 2>/dev/null || echo "0%")"
	@echo ""

## 📋 Show application logs
logs:
	@echo "$(BOLD)$(PRIMARY)📋 Application Logs$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)🔧 Backend Logs:$(RESET)"
	@if [ -f backend/logs/app.log ]; then \
		tail -20 backend/logs/app.log | sed 's/^/  /'; \
	else \
		echo "  $(MUTED)ℹ️ No backend logs found$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)$(INFO)🎨 Frontend Logs:$(RESET)"
	@if [ -f frontend/logs/app.log ]; then \
		tail -20 frontend/logs/app.log | sed 's/^/  /'; \
	else \
		echo "  $(MUTED)ℹ️ No frontend logs found$(RESET)"; \
	fi
	@echo ""
	@echo "$(MUTED)💡 Use 'tail -f backend/logs/app.log' for live backend logs$(RESET)"
	@echo "$(MUTED)💡 Use 'tail -f frontend/logs/app.log' for live frontend logs$(RESET)"

## 🏥 Run comprehensive health checks
check: deps
	@echo "$(BOLD)$(PRIMARY)🏥 Health Check$(RESET)"
	@echo ""
	@echo "$(INFO)🔧 Checking backend health...$(RESET)"
	@if curl -s --max-time 5 http://localhost:$(BACKEND_PORT)/health >/dev/null 2>&1; then \
		echo "$(SUCCESS)  ✅ Backend: Healthy and responding$(RESET)"; \
	else \
		echo "$(ERROR)  ❌ Backend: Not responding or unhealthy$(RESET)"; \
	fi
	@echo ""
	@echo "$(INFO)🎨 Checking frontend health...$(RESET)"
	@if curl -s --max-time 5 http://localhost:$(FRONTEND_PORT) >/dev/null 2>&1; then \
		echo "$(SUCCESS)  ✅ Frontend: Healthy and responding$(RESET)"; \
	else \
		echo "$(ERROR)  ❌ Frontend: Not responding or unhealthy$(RESET)"; \
	fi
	@echo ""
	@echo "$(INFO)� Checking external connectivity...$(RESET)"
	@if curl -s --max-time 5 https://www.google.com >/dev/null 2>&1; then \
		echo "$(SUCCESS)  ✅ Internet: Connected$(RESET)"; \
	else \
		echo "$(ERROR)  ❌ Internet: No connectivity$(RESET)"; \
	fi
	@echo ""

## 🐛 Show debugging information
debug-info:
	@echo "$(BOLD)$(ERROR)� Debug Information$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)� System Information:$(RESET)"
	@echo "  $(PRIMARY)OS:$(RESET) $$(uname -s) $$(uname -r)"
	@echo "  $(PRIMARY)Shell:$(RESET) $$SHELL"
	@echo "  $(PRIMARY)User:$(RESET) $$USER"
	@echo "  $(PRIMARY)PWD:$(RESET) $$(pwd)"
	@echo ""
	@echo "$(BOLD)$(INFO)📦 Tool Versions:$(RESET)"
	@echo "  $(PRIMARY)Node.js:$(RESET) $$(node --version 2>/dev/null || echo "Not installed")"
	@echo "  $(PRIMARY)npm:$(RESET) $$(npm --version 2>/dev/null || echo "Not installed")"
	@echo "  $(PRIMARY)Docker:$(RESET) $$(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo "Not installed")"
	@echo "  $(PRIMARY)Make:$(RESET) $$(make --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo "Unknown")"
	@echo ""
	@echo "$(BOLD)$(INFO)🌐 Network Information:$(RESET)"
	@echo "  $(PRIMARY)Hostname:$(RESET) $$(hostname)"
	@echo "  $(PRIMARY)Local IP:$(RESET) $$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $$2}' 2>/dev/null || echo "Unknown")"
	@echo ""
	@echo "$(BOLD)$(INFO)� Active Ports:$(RESET)"
	@lsof -i -P -n | grep LISTEN | grep -E ":$(BACKEND_PORT)|:$(FRONTEND_PORT)" | sed 's/^/  /' || echo "  $(MUTED)No relevant ports found$(RESET)"
	@echo ""

## 🔍 Show detailed port information
debug-ports:
	@echo "$(BOLD)$(ERROR)🔍 Port Debug Information$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)🌐 All Listening Ports:$(RESET)"
	@lsof -i -P -n | grep LISTEN | sed 's/^/  /' || echo "  $(MUTED)No listening ports found$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)🎯 Target Ports ($(BACKEND_PORT), $(FRONTEND_PORT)):$(RESET)"
	@lsof -i -P -n | grep LISTEN | grep -E ":$(BACKEND_PORT)|:$(FRONTEND_PORT)" | sed 's/^/  /' || echo "  $(MUTED)Target ports are free$(RESET)"
	@echo ""

## 🔍 Show all related processes
debug-processes:
	@echo "$(BOLD)$(ERROR)🔍 Process Debug Information$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)📊 All Node.js Processes:$(RESET)"
	@ps aux | grep node | grep -v grep | sed 's/^/  /' || echo "  $(MUTED)No Node.js processes found$(RESET)"
	@echo ""
	@echo "$(BOLD)$(INFO)🎯 Project Related Processes:$(RESET)"
	@ps aux | grep -E "(backend|frontend|app-manager)" | grep -v grep | sed 's/^/  /' || echo "  $(MUTED)No project processes found$(RESET)"
	@echo ""

# ==============================================================================
# 🐳 Docker Management
# ==============================================================================

## 🐳 Start Docker containers
docker-up:
	@echo "$(BOLD)$(PRIMARY)🐳 Starting Docker Containers$(RESET)"
	@echo ""
	@if [ ! -f docker-compose.yml ]; then \
		echo "$(ERROR)❌ docker-compose.yml not found$(RESET)"; \
		echo "$(MUTED)💡 Create a docker-compose.yml file or run this from a project directory$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)🚀 Starting containers...$(RESET)"
	@docker-compose up -d
	@echo "$(SUCCESS)✅ Docker containers started$(RESET)"
	@echo ""
	@echo "$(INFO)📊 Container status:$(RESET)"
	@docker-compose ps

## 🐳 Stop Docker containers
docker-down:
	@echo "$(BOLD)$(WARNING)🐳 Stopping Docker Containers$(RESET)"
	@echo ""
	@if [ ! -f docker-compose.yml ]; then \
		echo "$(ERROR)❌ docker-compose.yml not found$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)⏹️ Stopping containers...$(RESET)"
	@docker-compose down
	@echo "$(SUCCESS)✅ Docker containers stopped$(RESET)"

## 🐳 Rebuild Docker images
docker-rebuild:
	@echo "$(BOLD)$(PRIMARY)🐳 Rebuilding Docker Images$(RESET)"
	@echo ""
	@if [ ! -f docker-compose.yml ]; then \
		echo "$(ERROR)❌ docker-compose.yml not found$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)🔨 Rebuilding images...$(RESET)"
	@docker-compose build --no-cache
	@echo "$(INFO)🚀 Starting with new images...$(RESET)"
	@docker-compose up -d
	@echo "$(SUCCESS)✅ Docker images rebuilt and started$(RESET)"

## 🐳 Show Docker container logs
docker-logs:
	@echo "$(BOLD)$(PRIMARY)🐳 Docker Container Logs$(RESET)"
	@echo ""
	@if [ ! -f docker-compose.yml ]; then \
		echo "$(ERROR)❌ docker-compose.yml not found$(RESET)"; \
		exit 1; \
	fi
	@docker-compose logs --tail=50 --follow

# ==============================================================================
# 🎯 Laravel Project Management
# ==============================================================================

## 🎯 Create a new Laravel project
laravel-new:
	@echo "$(BOLD)$(PRIMARY)🎯 Creating New Laravel Project$(RESET)"
	@echo ""
	@if [ -z "$(NAME)" ]; then \
		echo "$(ERROR)❌ Project name required$(RESET)"; \
		echo "$(MUTED)💡 Usage: make laravel-new NAME=my-project$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)🏗️ Creating Laravel project: $(PRIMARY)$(NAME)$(RESET)"
	@mkdir -p projects/$(NAME)
	@cd projects/$(NAME) && composer create-project laravel/laravel src
	@echo "$(INFO)🐳 Setting up Docker environment...$(RESET)"
	@cp templates/laravel/stubs/* projects/$(NAME)/
	@echo "$(SUCCESS)✅ Laravel project '$(NAME)' created successfully!$(RESET)"
	@echo ""
	@echo "$(MUTED)💡 Next steps:$(RESET)"
	@echo "  $(PRIMARY)cd projects/$(NAME)$(RESET)"
	@echo "  $(PRIMARY)make docker-up$(RESET)"

## 🎯 Install Laravel dependencies
laravel-install:
	@echo "$(BOLD)$(PRIMARY)🎯 Installing Laravel Dependencies$(RESET)"
	@echo ""
	@if [ ! -f composer.json ]; then \
		echo "$(ERROR)❌ composer.json not found$(RESET)"; \
		echo "$(MUTED)💡 Run this command from a Laravel project directory$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)📦 Installing PHP dependencies...$(RESET)"
	@composer install
	@echo "$(INFO)📦 Installing NPM dependencies...$(RESET)"
	@npm install
	@echo "$(SUCCESS)✅ Laravel dependencies installed$(RESET)"

## 🎯 Run Laravel database migrations
laravel-migrate:
	@echo "$(BOLD)$(PRIMARY)🎯 Running Database Migrations$(RESET)"
	@echo ""
	@if [ ! -f artisan ]; then \
		echo "$(ERROR)❌ Laravel artisan not found$(RESET)"; \
		echo "$(MUTED)💡 Run this command from a Laravel project src directory$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)🔄 Running migrations...$(RESET)"
	@php artisan migrate
	@echo "$(SUCCESS)✅ Database migrations completed$(RESET)"

## 🎯 Seed Laravel database
laravel-seed:
	@echo "$(BOLD)$(PRIMARY)🎯 Seeding Database$(RESET)"
	@echo ""
	@if [ ! -f artisan ]; then \
		echo "$(ERROR)❌ Laravel artisan not found$(RESET)"; \
		exit 1; \
	fi
	@echo "$(INFO)🌱 Seeding database...$(RESET)"
	@php artisan db:seed
	@echo "$(SUCCESS)✅ Database seeded successfully$(RESET)"

# ==============================================================================
# 🎓 Additional Utilities & Shortcuts
# ==============================================================================

## 🔧 Quick development setup
quick-start: install dev
	@echo "$(SUCCESS)🎉 Quick start completed!$(RESET)"
	@echo "$(MUTED)💡 Your development environment is ready$(RESET)"

## 🧹 Deep clean (nuclear option)
deep-clean: clean
	@echo "$(BOLD)$(ERROR)🧹 Deep Clean (Nuclear Option)$(RESET)"
	@echo "$(WARNING)⚠️ This will remove ALL generated files$(RESET)"
	@echo ""
	@echo "$(INFO)🗑️ Removing package-lock files...$(RESET)"
	@rm -f backend/package-lock.json frontend/package-lock.json
	@echo "$(INFO)🗑️ Removing cache directories...$(RESET)"
	@rm -rf .npm .cache node_modules
	@echo "$(SUCCESS)✅ Deep clean completed$(RESET)"
	@echo "$(MUTED)💡 You'll need to reconfigure everything$(RESET)"

## 🔄 Update all dependencies
update:
	@echo "$(BOLD)$(PRIMARY)🔄 Updating Dependencies$(RESET)"
	@echo ""
	@if [ -f backend/package.json ]; then \
		echo "$(INFO)🔧 Updating backend dependencies...$(RESET)"; \
		cd backend && npm update; \
	fi
	@if [ -f frontend/package.json ]; then \
		echo "$(INFO)🎨 Updating frontend dependencies...$(RESET)"; \
		cd frontend && npm update; \
	fi
	@echo "$(SUCCESS)✅ Dependencies updated$(RESET)"

## 🎯 Open project in VS Code
code:
	@echo "$(BOLD)$(PRIMARY)🎯 Opening in VS Code$(RESET)"
	@code .

## 🌐 Open application in browser
open:
	@echo "$(BOLD)$(PRIMARY)🌐 Opening Application$(RESET)"
	@if command -v open >/dev/null 2>&1; then \
		open http://localhost:$(FRONTEND_PORT); \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open http://localhost:$(FRONTEND_PORT); \
	else \
		echo "$(MUTED)💡 Visit: http://localhost:$(FRONTEND_PORT)$(RESET)"; \
	fi

## 📊 Show project statistics
stats:
	@echo "$(BOLD)$(PRIMARY)📊 Project Statistics$(RESET)"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)📁 File Count:$(RESET)"
	@echo "  $(PRIMARY)Total files:$(RESET) $$(find . -type f | wc -l | xargs)"
	@echo "  $(PRIMARY)Code files:$(RESET) $$(find . -name "*.js" -o -name "*.ts" -o -name "*.php" -o -name "*.css" -o -name "*.html" | wc -l | xargs)"
	@echo ""
	@echo "$(BOLD)$(SUCCESS)📏 Lines of Code:$(RESET)"
	@if command -v cloc >/dev/null 2>&1; then \
		cloc --exclude-dir=node_modules,vendor,dist,build .; \
	else \
		echo "  $(MUTED)Install 'cloc' for detailed statistics$(RESET)"; \
		echo "  $(PRIMARY)Estimated:$(RESET) $$(find . -name "*.js" -o -name "*.ts" -o -name "*.php" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $$1}' || echo "0") lines"; \
	fi

# ==============================================================================
# 💾 Backup & Maintenance
# ==============================================================================

## 💾 Create project backup
backup:
	@echo "$(BOLD)$(PRIMARY)💾 Creating Project Backup$(RESET)"
	@echo ""
	@BACKUP_NAME="backup-$$(date +%Y%m%d-%H%M%S).tar.gz"; \
	echo "$(INFO)📦 Creating backup: $$BACKUP_NAME$(RESET)"; \
	mkdir -p data/backups; \
	tar --exclude='node_modules' --exclude='.git' --exclude='vendor' \
	    --exclude='*.log' --exclude='dist' --exclude='build' \
	    -czf "data/backups/$$BACKUP_NAME" .; \
	echo "$(SUCCESS)✅ Backup created: data/backups/$$BACKUP_NAME$(RESET)"

## 💾 List available backups
backup-list:
	@echo "$(BOLD)$(PRIMARY)💾 Available Backups$(RESET)"
	@echo ""
	@if [ -d data/backups ] && [ "$$(ls -A data/backups)" ]; then \
		ls -la data/backups/ | tail -n +2 | awk '{print "  $(PRIMARY)" $$9 "$(RESET) $(MUTED)(" $$5 " bytes, " $$6 " " $$7 " " $$8 ")$(RESET)"}'; \
	else \
		echo "  $(MUTED)No backups found$(RESET)"; \
	fi

## 💾 Restore from backup
restore:
	@echo "$(BOLD)$(WARNING)💾 Restore from Backup$(RESET)"
	@echo ""
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(ERROR)❌ Backup filename required$(RESET)"; \
		echo "$(MUTED)💡 Usage: make restore BACKUP=backup-20231201-120000.tar.gz$(RESET)"; \
		echo "$(MUTED)💡 Use 'make backup-list' to see available backups$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -f "data/backups/$(BACKUP)" ]; then \
		echo "$(ERROR)❌ Backup file not found: $(BACKUP)$(RESET)"; \
		exit 1; \
	fi
	@echo "$(WARNING)⚠️ This will overwrite current files!$(RESET)"
	@echo "$(INFO)📦 Restoring from: $(BACKUP)$(RESET)"
	@tar -xzf "data/backups/$(BACKUP)"
	@echo "$(SUCCESS)✅ Backup restored successfully$(RESET)"
	@echo "$(MUTED)💡 Run 'make install' to reinstall dependencies$(RESET)"

# ==============================================================================
# 🎉 End of Makefile
# ==============================================================================

# 💫 Thank you for using Laravel God Mode!
# 🚀 Happy coding!
