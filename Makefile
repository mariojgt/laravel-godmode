# Full-stack Application Manager
# Root Makefile for development and project management

# Load environment variables from .env file if it exists
ifneq (,$(wildcard ./.env))
    include .env
    export $(shell sed 's/=.*//' .env)
endif

# Set default ports if not defined in .env
BACKEND_PORT ?= 5000
FRONTEND_PORT ?= 3000

.PHONY: help install start stop restart build clean dev status logs deps check check-ports kill-ports config force-stop

# Colors for output
GREEN = \033[32m
CYAN = \033[36m
YELLOW = \033[33m
RED = \033[31m
RESET = \033[0m
BOLD = \033[1m

# Default target
.DEFAULT_GOAL := help

## Help - Show available commands
help:
	@echo "$(BOLD)🚀 Full-stack Application Manager$(RESET)"
	@echo ""

## Show current configuration
config:
	@echo "$(BOLD)⚙️ Current Configuration$(RESET)"
	@echo ""
	@echo "$(GREEN)Ports:$(RESET)"
	@echo "  Backend:  $(BACKEND_PORT)"
	@echo "  Frontend: $(FRONTEND_PORT)"
	@echo ""
	@echo "$(GREEN)Environment file:$(RESET)"
	@if [ -f .env ]; then \
		echo "  ✅ .env file found"; \
		echo ""; \
		echo "$(GREEN)Current .env settings:$(RESET)"; \
		cat .env | grep -E '^[A-Z]' | sed 's/^/  /' || true; \
	else \
		echo "  ❌ .env file not found (using defaults)"; \
	fi
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo ""
	@echo "$(CYAN)  make install$(RESET)     - Install all dependencies"
	@echo "$(CYAN)  make start$(RESET)       - Start the application"
	@echo "$(CYAN)  make stop$(RESET)        - Stop the application"
	@echo "$(CYAN)  make force-stop$(RESET)  - Force stop all related processes"
	@echo "$(CYAN)  make restart$(RESET)     - Restart the application"
	@echo "$(CYAN)  make dev$(RESET)         - Start in development mode"
	@echo "$(CYAN)  make build$(RESET)       - Build the application"
	@echo "$(CYAN)  make clean$(RESET)       - Clean build artifacts"
	@echo "$(CYAN)  make status$(RESET)      - Show application status"
	@echo "$(CYAN)  make logs$(RESET)        - Show application logs"
	@echo "$(CYAN)  make deps$(RESET)        - Check dependencies"
	@echo "$(CYAN)  make check$(RESET)       - Run health checks"
	@echo "$(CYAN)  make check-ports$(RESET) - Check if ports are available"
	@echo "$(CYAN)  make kill-ports$(RESET)  - Kill processes on configured ports"
	@echo "$(CYAN)  make config$(RESET)      - Show current configuration"
	@echo ""

## Check if Node.js is installed
check-node:
	@if ! command -v node >/dev/null 2>&1; then \
		echo "$(RED)❌ Node.js is not installed$(RESET)"; \
		echo "$(YELLOW)Please install Node.js from https://nodejs.org/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Node.js $(shell node --version) is installed$(RESET)"

## Check if Docker is installed
check-docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(RED)❌ Docker is not installed$(RESET)"; \
		echo "$(YELLOW)Please install Docker from https://docker.com/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Docker $(shell docker --version | cut -d' ' -f3 | cut -d',' -f1) is installed$(RESET)"

## Check all dependencies
deps: check-node check-docker
	@echo "$(GREEN)✅ All dependencies are installed$(RESET)"

## Install all dependencies
install: deps
	@echo "$(CYAN)📦 Installing backend dependencies...$(RESET)"
	@cd backend && npm install
	@echo "$(CYAN)📦 Installing frontend dependencies...$(RESET)"
	@cd frontend && npm install
	@echo "$(GREEN)✅ All dependencies installed successfully$(RESET)"

## Check if ports are available
check-ports:
	@echo "$(CYAN)🔍 Checking port availability...$(RESET)"
	@if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(RED)❌ Port 5001 is already in use$(RESET)"; \
		echo "$(YELLOW)Running process on port 5001:$(RESET)"; \
		lsof -Pi :5001 -sTCP:LISTEN; \
		echo "$(YELLOW)To kill the process: sudo kill -9 \$(lsof -ti:5001)$(RESET)"; \
		exit 1; \
	fi
	@if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(RED)❌ Port 3000 is already in use$(RESET)"; \
		echo "$(YELLOW)Running process on port 3000:$(RESET)"; \
		lsof -Pi :3000 -sTCP:LISTEN; \
		echo "$(YELLOW)To kill the process: sudo kill -9 \$(lsof -ti:3000)$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Ports 3000 and 5000 are available$(RESET)"

## Kill processes on default ports
kill-ports:
	@echo "$(CYAN)🔪 Killing processes on ports 3000 and 5000...$(RESET)"
	@if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Killing process on port 5000...$(RESET)"; \
		sudo kill -9 $(lsof -ti:5000) 2>/dev/null || true; \
	fi
	@if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Killing process on port 3000...$(RESET)"; \
		sudo kill -9 $(lsof -ti:3000) 2>/dev/null || true; \
	fi
	@echo "$(GREEN)✅ Ports cleared$(RESET)"

## Start the application
start: deps check-ports
	@echo "$(CYAN)🚀 Starting Full-stack Application Manager...$(RESET)"
	@cd backend && npm start &
	@sleep 3
	@cd frontend && npm start &
	@echo "$(GREEN)✅ Application started successfully$(RESET)"
	@echo "$(CYAN)🌐 Frontend: http://localhost:$(FRONTEND_PORT)$(RESET)"
	@echo "$(CYAN)🔧 Backend: http://localhost:$(BACKEND_PORT)$(RESET)"

## Stop the application
stop:
	@echo "$(CYAN)⏹️ Stopping Application Manager...$(RESET)"
	@echo "$(YELLOW)Killing Node.js processes on configured ports...$(RESET)"
	@# Kill processes by port
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Stopping backend on port $(BACKEND_PORT)...$(RESET)"; \
		kill -TERM $(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
		sleep 2; \
		if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(YELLOW)Force killing backend...$(RESET)"; \
			kill -9 $(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
		fi \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Stopping frontend on port $(FRONTEND_PORT)...$(RESET)"; \
		kill -TERM $(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
		sleep 2; \
		if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(YELLOW)Force killing frontend...$(RESET)"; \
			kill -9 $(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
		fi \
	fi
	@# Kill processes by name pattern
	@echo "$(YELLOW)Killing remaining app-manager processes...$(RESET)"
	@pkill -f "app-manager-backend" 2>/dev/null || true
	@pkill -f "app-manager-frontend" 2>/dev/null || true
	@pkill -f "node.*backend.*server" 2>/dev/null || true
	@pkill -f "node.*frontend.*server" 2>/dev/null || true
	@# Kill any node processes in backend/frontend directories
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print $2}' | xargs -r kill -TERM 2>/dev/null || true
	@sleep 1
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
	@echo "$(GREEN)✅ Application stopped$(RESET)"

## Force stop all related processes
force-stop:
	@echo "$(CYAN)💀 Force stopping all Application Manager processes...$(RESET)"
	@echo "$(RED)⚠️ This will kill ALL Node.js processes that might be related$(RESET)"
	@# Kill by port (force)
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Force killing processes on port $(BACKEND_PORT)...$(RESET)"; \
		sudo kill -9 $(lsof -ti:$(BACKEND_PORT)) 2>/dev/null || true; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)Force killing processes on port $(FRONTEND_PORT)...$(RESET)"; \
		sudo kill -9 $(lsof -ti:$(FRONTEND_PORT)) 2>/dev/null || true; \
	fi
	@# Kill by process name patterns
	@echo "$(YELLOW)Killing all app-manager processes...$(RESET)"
	@sudo pkill -9 -f "app-manager" 2>/dev/null || true
	@sudo pkill -9 -f "node.*backend" 2>/dev/null || true
	@sudo pkill -9 -f "node.*frontend" 2>/dev/null || true
	@sudo pkill -9 -f "node.*server.js" 2>/dev/null || true
	@# Kill any node processes in project directories
	@ps aux | grep -E "node.*$(PWD)" | grep -v grep | awk '{print $2}' | xargs -r sudo kill -9 2>/dev/null || true
	@echo "$(GREEN)✅ All processes forcefully stopped$(RESET)"
	@echo "$(YELLOW)💡 Run 'make status' to verify all processes are stopped$(RESET)"

## Restart the application
restart:
	@echo "$(CYAN)🔄 Restarting Application Manager...$(RESET)"
	@$(MAKE) stop
	@echo "$(YELLOW)Waiting for processes to fully stop...$(RESET)"
	@sleep 3
	@$(MAKE) start

## Start in development mode
dev: deps check-ports
	@echo "$(CYAN)🔧 Starting in development mode...$(RESET)"
	@cd backend && npm run dev &
	@sleep 3
	@cd frontend && npm run dev &
	@echo "$(GREEN)✅ Development mode started$(RESET)"
	@echo "$(CYAN)🌐 Frontend: http://localhost:$(FRONTEND_PORT)$(RESET)"
	@echo "$(CYAN)🔧 Backend: http://localhost:$(BACKEND_PORT)$(RESET)"

## Build the application
build: deps
	@echo "$(CYAN)🔨 Building application...$(RESET)"
	@cd frontend && npm run build
	@cd backend && npm run build
	@echo "$(GREEN)✅ Application built successfully$(RESET)"

## Clean build artifacts
clean:
	@echo "$(CYAN)🧹 Cleaning build artifacts...$(RESET)"
	@rm -rf backend/node_modules
	@rm -rf frontend/node_modules
	@rm -rf backend/dist
	@rm -rf frontend/dist
	@echo "$(GREEN)✅ Clean completed$(RESET)"

## Show application status
status:
	@echo "$(CYAN)📊 Application Status:$(RESET)"
	@echo ""
	@echo "$(GREEN)Port Status:$(RESET)"
	@if lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "  ✅ Backend ($(BACKEND_PORT)): Running"; \
		lsof -Pi :$(BACKEND_PORT) -sTCP:LISTEN | grep LISTEN | awk '{print "     PID: " $2 ", Command: " $1}'; \
	else \
		echo "  ❌ Backend ($(BACKEND_PORT)): Not running"; \
	fi
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "  ✅ Frontend ($(FRONTEND_PORT)): Running"; \
		lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN | grep LISTEN | awk '{print "     PID: " $2 ", Command: " $1}'; \
	else \
		echo "  ❌ Frontend ($(FRONTEND_PORT)): Not running"; \
	fi
	@echo ""
	@echo "$(GREEN)Related Node.js Processes:$(RESET)"
	@ps aux | grep -E "node.*(backend|frontend)" | grep -v grep | awk '{print "  PID: " $2 ", Command: " $11 " " $12 " " $13}' || echo "  No related Node.js processes found"
	@echo ""
	@echo "$(GREEN)Application Manager Processes:$(RESET)"
	@ps aux | grep -E "app-manager-(backend|frontend)" | grep -v grep | awk '{print "  PID: " $2 ", Command: " $11 " " $12}' || echo "  No Application Manager processes found"
	@echo ""

## Show application logs
logs:
	@echo "$(CYAN)📋 Application Logs:$(RESET)"
	@echo "$(YELLOW)Backend logs:$(RESET)"
	@tail -f backend/logs/app.log 2>/dev/null || echo "No backend logs found"
	@echo "$(YELLOW)Frontend logs:$(RESET)"
	@tail -f frontend/logs/app.log 2>/dev/null || echo "No frontend logs found"

## Run health checks
check: deps
	@echo "$(CYAN)🔍 Running health checks...$(RESET)"
	@echo "$(YELLOW)Checking backend health...$(RESET)"
	@curl -s http://localhost:$(BACKEND_PORT)/health > /dev/null && echo "$(GREEN)✅ Backend: Healthy$(RESET)" || echo "$(RED)❌ Backend: Unhealthy$(RESET)"
	@echo "$(YELLOW)Checking frontend health...$(RESET)"
	@curl -s http://localhost:$(FRONTEND_PORT) > /dev/null && echo "$(GREEN)✅ Frontend: Healthy$(RESET)" || echo "$(RED)❌ Frontend: Unhealthy$(RESET)"

## Create project structure
init:
	@echo "$(CYAN)🏗️ Creating project structure...$(RESET)"
	@mkdir -p backend/src/{routes,controllers,utils,config}
	@mkdir -p backend/logs
	@mkdir -p frontend/src/{components,views,utils,styles}
	@mkdir -p frontend/public
	@mkdir -p templates
	@mkdir -p data
	@mkdir -p backups
	@echo "$(GREEN)✅ Project structure created$(RESET)"

## Show project information
info:
	@echo "$(BOLD)📋 Full-stack Application Manager$(RESET)"
	@echo ""
	@echo "$(GREEN)📁 Project Structure:$(RESET)"
	@echo "  📂 backend/         - Node.js backend server"
	@echo "  📂 frontend/        - Vanilla JS frontend"
	@echo "  📂 templates/       - Project templates"
	@echo "  📂 data/           - Application data"
	@echo "  📂 backups/        - Project backups"
	@echo "  📄 Makefile        - This command interface"
	@echo ""
	@echo "$(GREEN)🛠️ Available Commands:$(RESET)"
	@echo "  make help          - Show this help"
	@echo "  make dev           - Start development mode"
	@echo "  make install       - Install dependencies"
	@echo "  make status        - Check application status"
	@echo ""
	@echo "$(GREEN)🌐 Default URLs:$(RESET)"
	@echo "  Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "  Backend:  http://localhost:$(BACKEND_PORT)"
	@echo ""
