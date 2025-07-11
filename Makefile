# Simple Laravel Manager - Makefile
.PHONY: help install start stop restart clean dev check setup

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN = \033[32m
CYAN = \033[36m
YELLOW = \033[33m
RED = \033[31m
RESET = \033[0m
BOLD = \033[1m

## Help - Show available commands
help:
	@echo "$(BOLD)🚀 Simple Laravel Manager$(RESET)"
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo ""
	@echo "$(CYAN)  make install$(RESET)  - Install dependencies and setup"
	@echo "$(CYAN)  make start$(RESET)    - Start the Laravel manager"
	@echo "$(CYAN)  make dev$(RESET)      - Start in development mode"
	@echo "$(CYAN)  make stop$(RESET)     - Stop all running projects"
	@echo "$(CYAN)  make restart$(RESET)  - Restart the manager"
	@echo "$(CYAN)  make clean$(RESET)    - Clean up Docker containers"
	@echo "$(CYAN)  make check$(RESET)    - Check system requirements"
	@echo "$(CYAN)  make setup$(RESET)    - Initial setup"
	@echo ""
	@echo "$(YELLOW)💡 Quick start:$(RESET)"
	@echo "  1. $(BOLD)make install$(RESET)"
	@echo "  2. $(BOLD)make start$(RESET)"
	@echo "  3. Open $(BOLD)http://localhost:3000$(RESET)"
	@echo ""

## Check system requirements
check:
	@echo "$(CYAN)🔍 Checking system requirements...$(RESET)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)❌ Node.js is required$(RESET)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)❌ NPM is required$(RESET)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)❌ Docker is required$(RESET)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)❌ Docker Compose is required$(RESET)"; exit 1; }
	@command -v composer >/dev/null 2>&1 || { echo "$(RED)❌ Composer is required$(RESET)"; exit 1; }
	@echo "$(GREEN)✅ All requirements satisfied$(RESET)"

## Setup directories
setup:
	@echo "$(CYAN)📁 Setting up directories...$(RESET)"
	@mkdir -p projects
	@mkdir -p public
	@echo "$(GREEN)✅ Directories created$(RESET)"

## Create index.html file
create-html:
	@echo "$(CYAN)📄 Creating index.html...$(RESET)"
	@cat > public/index.html << 'EOF'

## Install dependencies
install: check setup
	@echo "$(CYAN)📦 Installing dependencies...$(RESET)"
	@npm install
	@echo "$(GREEN)✅ Dependencies installed$(RESET)"
	@echo ""
	@echo "$(YELLOW)🎉 Installation complete!$(RESET)"
	@echo "$(CYAN)Next steps:$(RESET)"
	@echo "  1. Run: $(BOLD)make start$(RESET)"
	@echo "  2. Open: $(BOLD)http://localhost:3000$(RESET)"
	@echo ""

## Start the manager
start:
	@echo "$(CYAN)🚀 Starting Simple Laravel Manager...$(RESET)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(RESET)"
	@npm start

## Start in development mode
dev:
	@echo "$(CYAN)🔧 Starting in development mode...$(RESET)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(RESET)"
	@npm run dev

## Stop all projects
stop:
	@echo "$(CYAN)⏹️ Stopping all Laravel projects...$(RESET)"
	@for dir in projects/*/; do \
		if [ -d "$$dir" ] && [ -f "$$dir/docker-compose.yml" ]; then \
			echo "  Stopping $$(basename $$dir)..."; \
			(cd "$$dir" && docker-compose down 2>/dev/null || true); \
		fi \
	done
	@echo "$(GREEN)✅ All projects stopped$(RESET)"

## Restart the manager
restart: stop
	@echo "$(CYAN)🔄 Restarting...$(RESET)"
	@sleep 2
	@$(MAKE) start

## Clean up Docker containers and images
clean:
	@echo "$(CYAN)🧹 Cleaning up Docker containers...$(RESET)"
	@$(MAKE) stop
	@echo "$(CYAN)🗑️ Removing unused Docker resources...$(RESET)"
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed$(RESET)"

## Show project status
status:
	@echo "$(CYAN)📊 Project Status:$(RESET)"
	@echo ""
	@if [ -d "projects" ] && [ "$$(ls -A projects 2>/dev/null)" ]; then \
		for dir in projects/*/; do \
			if [ -d "$$dir" ]; then \
				project=$$(basename $$dir); \
				if [ -f "$$dir/docker-compose.yml" ]; then \
					status=$$(cd "$$dir" && docker-compose ps -q | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null | head -1); \
					if [ "$$status" = "running" ]; then \
						echo "  📗 $$project - $(GREEN)Running$(RESET)"; \
					else \
						echo "  📕 $$project - $(RED)Stopped$(RESET)"; \
					fi \
				else \
					echo "  📙 $$project - $(YELLOW)No Docker config$(RESET)"; \
				fi \
			fi \
		done \
	else \
		echo "  $(YELLOW)No projects found$(RESET)"; \
	fi
	@echo ""

## Show logs for all projects
logs:
	@echo "$(CYAN)📋 Recent logs from all projects:$(RESET)"
	@echo ""
	@for dir in projects/*/; do \
		if [ -d "$$dir" ] && [ -f "$$dir/docker-compose.yml" ]; then \
			project=$$(basename $$dir); \
			echo "$(BOLD)=== $$project ===$(RESET)"; \
			(cd "$$dir" && docker-compose logs --tail=5 2>/dev/null || echo "No logs available"); \
			echo ""; \
		fi \
	done

## Update dependencies
update:
	@echo "$(CYAN)🔄 Updating dependencies...$(RESET)"
	@npm update
	@echo "$(GREEN)✅ Dependencies updated$(RESET)"

## Backup projects
backup:
	@echo "$(CYAN)💾 Creating backup...$(RESET)"
	@mkdir -p backups
	@backup_name="laravel-manager-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"; \
	tar -czf "backups/$$backup_name" projects/ 2>/dev/null || true; \
	echo "$(GREEN)✅ Backup created: backups/$$backup_name$(RESET)"

## Show system information
info:
	@echo "$(BOLD)🚀 Simple Laravel Manager - System Information$(RESET)"
	@echo ""
	@echo "$(CYAN)📍 Manager:$(RESET)"
	@echo "  URL: http://localhost:3000"
	@echo "  PID: $$(pgrep -f 'node.*server.js' || echo 'Not running')"
	@echo ""
	@echo "$(CYAN)🐳 Docker:$(RESET)"
	@echo "  Version: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "  Compose: $$(docker-compose --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "$(CYAN)📦 Node.js:$(RESET)"
	@echo "  Version: $$(node --version 2>/dev/null || echo 'Not installed')"
	@echo "  NPM: $$(npm --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "$(CYAN)🎼 Composer:$(RESET)"
	@echo "  Version: $$(composer --version 2>/dev/null | head -1 || echo 'Not installed')"
	@echo ""
	@echo "$(CYAN)📁 Projects:$(RESET)"
	@project_count=$$(find projects -maxdepth 1 -type d 2>/dev/null | wc -l | xargs expr -1 + 2>/dev/null || echo "0"); \
	echo "  Count: $$project_count"; \
	echo "  Directory: $$(pwd)/projects/"

## Development tools
test:
	@echo "$(CYAN)🧪 Running basic tests...$(RESET)"
	@echo "Testing server startup..."
	@timeout 10s npm start & \
	sleep 5; \
	curl -s http://localhost:3000/health >/dev/null && echo "$(GREEN)✅ Server responds$(RESET)" || echo "$(RED)❌ Server not responding$(RESET)"; \
	pkill -f 'node.*server.js' 2>/dev/null || true

## Install globally
install-global:
	@echo "$(CYAN)🌍 Installing globally...$(RESET)"
	@npm install -g .
	@echo "$(GREEN)✅ Installed globally as 'laravel-manager'$(RESET)"

## Uninstall globally
uninstall-global:
	@echo "$(CYAN)🗑️ Uninstalling globally...$(RESET)"
	@npm uninstall -g simple-laravel-manager
	@echo "$(GREEN)✅ Uninstalled globally$(RESET)"
