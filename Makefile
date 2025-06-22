.PHONY: help install up down build rebuild shell logs clean test npm composer artisan fresh optimize backup restore control setup-control-panel

# Load environment variables
include .env

# Docker commands
COMPOSE = docker compose
EXEC = $(COMPOSE) exec app
EXEC_ROOT = $(COMPOSE) exec -u root app

# Get CODE_PATH from environment, default to src
CODE_PATH ?= src

# Default target
help: ## Show this help message
	@echo "🚀 Laravel Docker Development Commands:"
	@echo ""
	@echo "📋 Quick Start:"
	@echo "  make install          - Complete Laravel setup"
	@echo "  make control          - Start web control panel"
	@echo "  make up              - Start all containers"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# CONTROL PANEL COMMANDS
# ==============================================================================

control: ## Start the web-based control panel
	@echo "🎛️  Starting Laravel Docker Control Panel..."
	@if [ ! -d "control-panel" ]; then \
		echo "📁 Control panel not found. Setting up..."; \
		$(MAKE) setup-control-panel; \
	fi
	@if [ ! -f "control-panel/package.json" ]; then \
		echo "📦 Setting up control panel dependencies..."; \
		$(MAKE) setup-control-panel; \
	fi
	@if [ ! -d "control-panel/node_modules" ]; then \
		echo "📦 Installing dependencies..."; \
		cd control-panel && npm install; \
	fi
	@echo "🌐 Starting control panel at http://localhost:${CONTROL_PANEL_PORT:-9000}"
	@cd control-panel && npm start

setup-control-panel: ## Setup the control panel (one-time setup)
	@echo "⚙️  Setting up Laravel Docker Control Panel..."
	@mkdir -p control-panel/public
	@if [ ! -f "control-panel/package.json" ]; then \
		echo "📦 Creating package.json..."; \
		cd control-panel && npm init -y; \
		cd control-panel && npm install express socket.io axios dotenv fs-extra chokidar dockerode; \
		cd control-panel && npm install --save-dev nodemon; \
	fi
	@echo "✅ Control panel basic setup complete!"
	@echo "📝 Don't forget to copy the HTML and JS files to control-panel/public/"
	@echo "🚀 Run 'make control' to start the panel"

control-dev: ## Start control panel in development mode with auto-reload
	@echo "🔧 Starting control panel in development mode..."
	@cd control-panel && npm run dev

stop-control: ## Stop the control panel
	@echo "⏹️  Stopping control panel..."
	@pkill -f "node.*server.js" || echo "Control panel not running"

control-logs: ## View control panel logs
	@echo "📋 Control panel logs:"
	@pm2 logs control-panel 2>/dev/null || echo "Control panel not running with PM2"

# ==============================================================================
# DOCKER COMMANDS
# ==============================================================================

install: ## Create Laravel project and setup environment
	@if [ ! -f "$(CODE_PATH)/composer.json" ]; then \
		echo "🚀 Creating new Laravel project in $(CODE_PATH)..."; \
		mkdir -p $(CODE_PATH); \
		$(COMPOSE) run --rm app composer create-project laravel/laravel .; \
		$(MAKE) setup; \
	else \
		echo "📦 Laravel project already exists in $(CODE_PATH). Running setup..."; \
		$(MAKE) setup; \
	fi

setup: ## Setup Laravel application
	@echo "⚙️  Setting up Laravel application in $(CODE_PATH)..."
	$(EXEC) composer install
	@if [ ! -f "$(CODE_PATH)/.env" ]; then \
		$(EXEC) cp .env.example .env; \
		$(EXEC) php artisan key:generate; \
	fi
	$(EXEC) php artisan storage:link || true
	$(MAKE) permissions
	@echo "✅ Setup complete! Visit http://localhost:${APP_PORT}"
	@echo "🎛️  Start the control panel with: make control"

up: ## Start all containers
	@echo "🚀 Starting Docker containers..."
	$(COMPOSE) up -d
	@echo "✅ Containers started!"
	@echo "🌐 Laravel App: http://localhost:${APP_PORT}"
	@echo "🎛️  Control Panel: make control"

down: ## Stop all containers
	@echo "⏹️  Stopping Docker containers..."
	$(COMPOSE) down
	@echo "✅ Containers stopped!"

build: ## Build containers
	@echo "🔨 Building Docker containers..."
	$(COMPOSE) build --no-cache
	@echo "✅ Build complete!"

rebuild: ## Rebuild and restart containers
	@echo "🔄 Rebuilding and restarting containers..."
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	@echo "✅ Rebuild complete!"

restart: ## Restart all containers
	@echo "🔄 Restarting containers..."
	$(COMPOSE) restart
	@echo "✅ Containers restarted!"

list: ## List all containers
	@echo "📋 Container status:"
	$(COMPOSE) ps

# ==============================================================================
# DEVELOPMENT COMMANDS
# ==============================================================================

shell: ## Access application container shell
	@echo "💻 Accessing application container..."
	$(EXEC) bash

shell-root: ## Access application container as root
	@echo "💻 Accessing application container as root..."
	$(EXEC_ROOT) bash

shell-mysql: ## Access MySQL container shell
	@echo "💻 Accessing MySQL container..."
	$(COMPOSE) exec mysql bash

shell-redis: ## Access Redis container shell
	@echo "💻 Accessing Redis container..."
	$(COMPOSE) exec redis sh

logs: ## Show application logs
	@echo "📋 Application logs:"
	$(COMPOSE) logs -f app

logs-nginx: ## Show nginx logs
	@echo "📋 Nginx logs:"
	$(EXEC) tail -f /var/log/nginx/error.log

logs-all: ## Show all container logs
	@echo "📋 All container logs:"
	$(COMPOSE) logs -f

logs-mysql: ## Show MySQL logs
	@echo "📋 MySQL logs:"
	$(COMPOSE) logs -f mysql

logs-redis: ## Show Redis logs
	@echo "📋 Redis logs:"
	$(COMPOSE) logs -f redis

# ==============================================================================
# LARAVEL COMMANDS
# ==============================================================================

artisan: ## Run artisan command (usage: make artisan cmd="migrate")
	$(EXEC) php artisan $(cmd)

migrate: ## Run database migrations
	@echo "🗃️  Running database migrations..."
	$(EXEC) php artisan migrate
	@echo "✅ Migrations complete!"

migrate-fresh: ## Fresh migration with seed
	@echo "🗃️  Running fresh migration with seed..."
	$(EXEC) php artisan migrate:fresh --seed
	@echo "✅ Fresh migration complete!"

migrate-rollback: ## Rollback the last migration
	@echo "↩️  Rolling back last migration..."
	$(EXEC) php artisan migrate:rollback
	@echo "✅ Rollback complete!"

seed: ## Run database seeders
	@echo "🌱 Running database seeders..."
	$(EXEC) php artisan db:seed
	@echo "✅ Seeding complete!"

tinker: ## Open Laravel Tinker
	@echo "🔧 Opening Laravel Tinker..."
	$(EXEC) php artisan tinker

queue: ## Start queue worker manually
	@echo "⚡ Starting queue worker..."
	$(EXEC) php artisan queue:work

queue-restart: ## Restart queue workers
	@echo "🔄 Restarting queue workers..."
	$(EXEC) php artisan queue:restart
	@echo "✅ Queue workers restarted!"

schedule: ## Run scheduled tasks (for testing)
	@echo "⏰ Running scheduled tasks..."
	$(EXEC) php artisan schedule:run
	@echo "✅ Scheduled tasks complete!"

cache-clear: ## Clear all caches
	@echo "🧹 Clearing all caches..."
	$(EXEC) php artisan cache:clear
	$(EXEC) php artisan config:clear
	$(EXEC) php artisan route:clear
	$(EXEC) php artisan view:clear
	@echo "✅ Caches cleared!"

optimize: ## Optimize Laravel application
	@echo "⚡ Optimizing Laravel application..."
	$(EXEC) php artisan config:cache
	$(EXEC) php artisan route:cache
	$(EXEC) php artisan view:cache
	$(EXEC) php artisan event:cache
	@echo "✅ Optimization complete!"

key-generate: ## Generate new application key
	@echo "🔑 Generating new application key..."
	$(EXEC) php artisan key:generate
	@echo "✅ New key generated!"

# ==============================================================================
# DEPENDENCY MANAGEMENT
# ==============================================================================

composer: ## Run composer command (usage: make composer cmd="require package")
	$(EXEC) composer $(cmd)

composer-install: ## Install PHP dependencies
	@echo "📦 Installing PHP dependencies..."
	$(EXEC) composer install
	@echo "✅ PHP dependencies installed!"

composer-update: ## Update PHP dependencies
	@echo "📦 Updating PHP dependencies..."
	$(EXEC) composer update
	@echo "✅ PHP dependencies updated!"

composer-dump: ## Dump composer autoload
	@echo "📦 Dumping composer autoload..."
	$(EXEC) composer dump-autoload
	@echo "✅ Autoload dumped!"

npm: ## Run npm command (usage: make npm cmd="install")
	$(EXEC) npm $(cmd)

npm-install: ## Install Node.js dependencies
	@echo "📦 Installing Node.js dependencies..."
	$(EXEC) npm install
	@echo "✅ Node.js dependencies installed!"

npm-update: ## Update Node.js dependencies
	@echo "📦 Updating Node.js dependencies..."
	$(EXEC) npm update
	@echo "✅ Node.js dependencies updated!"

npm-dev: ## Run npm development server
	@echo "⚡ Starting Vite development server..."
	$(EXEC) npm run dev

npm-build: ## Build assets for production
	@echo "🔨 Building assets for production..."
	$(EXEC) npm run build
	@echo "✅ Assets built!"

npm-watch: ## Watch files for changes
	@echo "👀 Watching files for changes..."
	$(EXEC) npm run dev -- --watch

bun: ## Run bun command (usage: make bun cmd="install")
	$(EXEC) bun $(cmd)

bun-install: ## Install dependencies with Bun
	@echo "📦 Installing dependencies with Bun..."
	$(EXEC) bun install
	@echo "✅ Bun dependencies installed!"

bun-update: ## Update dependencies with Bun
	@echo "📦 Updating dependencies with Bun..."
	$(EXEC) bun update
	@echo "✅ Bun dependencies updated!"

bun-dev: ## Run development server with Bun
	@echo "⚡ Starting Bun development server..."
	$(EXEC) bun run dev

bun-build: ## Build assets with Bun
	@echo "🔨 Building assets with Bun..."
	$(EXEC) bun run build
	@echo "✅ Assets built with Bun!"

# ==============================================================================
# TESTING
# ==============================================================================

test: ## Run PHPUnit tests
	@echo "🧪 Running PHPUnit tests..."
	$(EXEC) vendor/bin/phpunit
	@echo "✅ Tests complete!"

test-coverage: ## Run tests with coverage report
	@echo "🧪 Running tests with coverage..."
	$(EXEC) vendor/bin/phpunit --coverage-html coverage
	@echo "✅ Coverage report generated in coverage/"

test-filter: ## Run specific test (usage: make test-filter name="TestName")
	@echo "🧪 Running filtered tests..."
	$(EXEC) vendor/bin/phpunit --filter $(name)

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	$(EXEC) vendor/bin/phpunit --testsuite=Unit
	@echo "✅ Unit tests complete!"

test-feature: ## Run feature tests only
	@echo "🧪 Running feature tests..."
	$(EXEC) vendor/bin/phpunit --testsuite=Feature
	@echo "✅ Feature tests complete!"

pest: ## Run Pest tests
	@echo "🧪 Running Pest tests..."
	$(EXEC) vendor/bin/pest
	@echo "✅ Pest tests complete!"

pest-coverage: ## Run Pest tests with coverage
	@echo "🧪 Running Pest tests with coverage..."
	$(EXEC) vendor/bin/pest --coverage
	@echo "✅ Pest coverage complete!"

# ==============================================================================
# PROJECT PATH MANAGEMENT
# ==============================================================================

path: ## Show current Laravel application path
	@echo "📁 Current Laravel application path: $(CODE_PATH)"
	@echo "🗂️  Full path: $(shell pwd)/$(CODE_PATH)"
	@if [ -f "$(CODE_PATH)/composer.json" ]; then \
		echo "✅ Laravel project found"; \
		if [ -f "$(CODE_PATH)/artisan" ]; then \
			echo "✅ Artisan command available"; \
		fi; \
	else \
		echo "❌ No Laravel project found in $(CODE_PATH)"; \
		echo "💡 Run 'make install' to create a new Laravel project"; \
	fi

switch-path: ## Switch to different Laravel path (usage: make switch-path path="new/path")
	@if [ -z "$(path)" ]; then \
		echo "❌ Usage: make switch-path path=\"your/new/path\""; \
		echo "📝 Example: make switch-path path=\"src/laravel\""; \
		exit 1; \
	fi
	@echo "🔄 Switching CODE_PATH from $(CODE_PATH) to $(path)"
	@sed -i.bak 's|^CODE_PATH=.*|CODE_PATH=$(path)|' .env
	@echo "✅ Updated .env file. New path: $(path)"
	@echo "🔄 Run 'make restart' to apply changes"
	@echo "🎛️  The control panel will automatically detect the new path"

create-project: ## Create Laravel project in specific path (usage: make create-project path="projects/myapp")
	@if [ -z "$(path)" ]; then \
		echo "❌ Usage: make create-project path=\"your/project/path\""; \
		echo "📝 Example: make create-project path=\"projects/myapp\""; \
		exit 1; \
	fi
	@echo "🚀 Creating Laravel project in $(path)..."
	@mkdir -p $(path)
	@sed -i.bak 's|^CODE_PATH=.*|CODE_PATH=$(path)|' .env
	@$(COMPOSE) run --rm -v ./$(path):/var/www/html app composer create-project laravel/laravel .
	@echo "✅ Laravel project created in $(path)"
	@echo "🔄 Run 'make up && make setup' to start"

# ==============================================================================
# MAINTENANCE
# ==============================================================================

permissions: ## Fix file permissions
	@echo "🔧 Fixing file permissions..."
	$(EXEC_ROOT) chown -R devuser:www-data /var/www/html
	$(EXEC_ROOT) chmod -R 775 /var/www/html/storage 2>/dev/null || true
	$(EXEC_ROOT) chmod -R 775 /var/www/html/bootstrap/cache 2>/dev/null || true
	$(EXEC_ROOT) chmod -R 775 /var/www/html/public 2>/dev/null || true
	@echo "✅ Permissions fixed!"

clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up containers and volumes..."
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

clean-all: ## Clean everything including images
	@echo "🧹 Cleaning everything including images..."
	$(COMPOSE) down -v --remove-orphans --rmi all
	docker system prune -a -f
	@echo "✅ Deep cleanup complete!"

fresh: ## Fresh installation
	@echo "🔄 Performing fresh installation..."
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) install
	@echo "✅ Fresh installation complete!"

# ==============================================================================
# DATABASE COMMANDS
# ==============================================================================

db-shell: ## Access MySQL shell
	@echo "💻 Accessing MySQL shell..."
	$(COMPOSE) exec mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE)

db-dump: ## Dump database to file
	@echo "💾 Dumping database..."
	$(COMPOSE) exec mysql mysqldump -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) > backup-$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database dumped to backup-$(shell date +%Y%m%d_%H%M%S).sql"

db-restore: ## Restore database from backup.sql
	@if [ ! -f "backup.sql" ]; then \
		echo "❌ backup.sql file not found"; \
		echo "💡 Create a backup.sql file or specify: make db-restore file=your-backup.sql"; \
		exit 1; \
	fi
	@echo "📥 Restoring database from backup.sql..."
	$(COMPOSE) exec -T mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) < backup.sql
	@echo "✅ Database restored!"

db-reset: ## Reset database (drop and recreate)
	@echo "⚠️  Resetting database (this will delete all data)..."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	$(EXEC) php artisan migrate:fresh --seed
	@echo "✅ Database reset complete!"

# ==============================================================================
# MONITORING & DEBUGGING
# ==============================================================================

status: ## Show container status
	@echo "📊 Container status:"
	$(COMPOSE) ps

top: ## Show running processes
	@echo "📊 Running processes:"
	$(COMPOSE) top

stats: ## Show container resource usage
	@echo "📊 Container resource usage:"
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" --no-stream

health: ## Run health check
	@echo "🏥 Running health check..."
	@if [ -f "health-check.sh" ]; then \
		./health-check.sh; \
	else \
		echo "❌ health-check.sh not found"; \
	fi

debug: ## Run debug script
	@echo "🔍 Running debug script..."
	@if [ -f "debug.sh" ]; then \
		./debug.sh; \
	else \
		echo "❌ debug.sh not found"; \
	fi

# ==============================================================================
# UTILITY COMMANDS
# ==============================================================================

urls: ## Show application URLs
	@echo "🌐 Application URLs:"
	@echo "  Main App:         http://localhost:$(APP_PORT)"
	@echo "  Control Panel:    http://localhost:${CONTROL_PANEL_PORT:-9000}"
	@echo "  Vite Dev:         http://localhost:$(VITE_PORT)"
	@echo "  PHPMyAdmin:       http://localhost:$(PHPMYADMIN_PORT)"
	@echo "  Redis Insight:    http://localhost:$(REDIS_INSIGHT_PORT)"
	@echo "  Mailhog:          http://localhost:$(MAILHOG_PORT)"

info: ## Show environment information
	@echo "ℹ️  Environment Information:"
	@echo "  APP_NAME:         $(APP_NAME)"
	@echo "  CODE_PATH:        $(CODE_PATH)"
	@echo "  APP_PORT:         $(APP_PORT)"
	@echo "  DB_DATABASE:      $(DB_DATABASE)"
	@echo "  CONTROL_PANEL:    ${CONTROL_PANEL_PORT:-9000}"

update: ## Update all dependencies
	@echo "📦 Updating all dependencies..."
	$(MAKE) composer-update
	$(MAKE) npm-update
	@echo "✅ All dependencies updated!"

backup: ## Create full backup
	@echo "💾 Creating full backup..."
	$(MAKE) db-dump
	@tar -czf backup-$(shell date +%Y%m%d_%H%M%S).tar.gz $(CODE_PATH) backup-*.sql
	@echo "✅ Full backup created!"

# ==============================================================================
# DEVELOPMENT HELPERS
# ==============================================================================

ide-helper: ## Generate IDE helper files
	@echo "💡 Generating IDE helper files..."
	$(EXEC) php artisan ide-helper:generate
	$(EXEC) php artisan ide-helper:models
	$(EXEC) php artisan ide-helper:meta
	@echo "✅ IDE helper files generated!"

clear-logs: ## Clear all log files
	@echo "🧹 Clearing log files..."
	$(EXEC) find storage/logs -name "*.log" -delete 2>/dev/null || true
	@echo "✅ Log files cleared!"

restart-workers: ## Restart all background workers
	@echo "🔄 Restarting background workers..."
	$(EXEC) php artisan queue:restart
	$(EXEC) supervisorctl restart all 2>/dev/null || true
	@echo "✅ Workers restarted!"

# Show quick start guide
quick-start: ## Show quick start guide
	@echo "🚀 Laravel Docker Quick Start Guide"
	@echo "===================================="
	@echo ""
	@echo "1. First time setup:"
	@echo "   make install              # Setup Laravel project"
	@echo "   make setup-control-panel  # Setup web control panel"
	@echo ""
	@echo "2. Daily development:"
	@echo "   make up                   # Start containers"
	@echo "   make control              # Start web control panel"
	@echo ""
	@echo "3. Web interfaces:"
	@echo "   http://localhost:${APP_PORT}                # Laravel app"
	@echo "   http://localhost:${CONTROL_PANEL_PORT:-9000}             # Control panel"
	@echo ""
	@echo "4. Common commands:"
	@echo "   make shell                # Access container"
	@echo "   make migrate              # Run migrations"
	@echo "   make test                 # Run tests"
	@echo "   make help                 # Show all commands"
	@echo ""
	@echo "Happy coding! 🎉"
