.PHONY: help install up down build rebuild restart list setup \
        control setup-control-panel control-dev stop-control \
        shell shell-root shell-mysql shell-redis \
        logs logs-service logs-all \
        artisan migrate migrate-fresh migrate-rollback seed tinker queue queue-restart schedule \
        cache-clear optimize optimize-clear key-generate \
        composer composer-install composer-update composer-dump \
        npm npm-install npm-update npm-dev npm-build npm-watch npm-watch-legacy \
        bun bun-install bun-update bun-dev bun-build \
        test test-coverage test-filter test-unit test-feature pest pest-coverage \
        path switch-path create-project \
        permissions clean clean-all prune fresh \
        db-shell db-dump db-restore db-reset \
        status top stats health debug \
        urls info update backup \
        ide-helper clear-logs restart-workers quick-start

# Load environment variables from the root .env file
include .env

# Docker commands
COMPOSE = docker compose
# Use --no-TTY for non-interactive execution, --quiet for less output
EXEC = $(COMPOSE) exec --no-TTY app
EXEC_ROOT = $(COMPOSE) exec -u root --no-TTY app
# EXEC_INTERACTIVE can be used when a true interactive shell is needed (e.g., `make shell`)
EXEC_INTERACTIVE = $(COMPOSE) exec app

# Get CODE_PATH from environment, default to src
CODE_PATH ?= src

# Default target
help: ## Show this help message
	@echo "🚀 Laravel Docker Development Commands:"
	@echo ""
	@echo "📋 Quick Start:"
	@echo "  make install             - Complete Laravel project setup (first-time)"
	@echo "  make up                  - Start all containers"
	@echo "  make control             - Start web control panel (http://localhost:${CONTROL_PANEL_PORT:-9000})"
	@echo ""
	@echo "🌐 Web Interfaces:"
	@echo "  Laravel App:             http://localhost:${APP_PORT:-8000}"
	@echo "  PHPMyAdmin:              http://localhost:${PHPMYADMIN_PORT:-8080}"
	@echo "  Redis Insight:           http://localhost:${REDIS_INSIGHT_PORT:-8001}"
	@echo "  Mailhog:                 http://localhost:${MAILHOG_PORT:-8025}"
	@echo ""
	@echo "Commands available:"
	@echo "----------------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-28s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# CONTROL PANEL COMMANDS
# ==============================================================================

control: ## Start the web-based control panel
	@echo "🎛️  Starting Laravel Docker Control Panel..."
	@if [ ! -d "control-panel" ] || [ ! -f "control-panel/package.json" ]; then \
		echo "📁 Control panel not found or not initialized. Running setup..."; \
		$(MAKE) setup-control-panel; \
	fi
	@if [ ! -d "control-panel/node_modules" ]; then \
		echo "📦 Installing control panel dependencies..."; \
		cd control-panel && npm install; \
	fi
	@echo "🌐 Control panel starting at http://localhost:${CONTROL_PANEL_PORT:-9000}"
	@cd control-panel && npm start

setup-control-panel: ## Setup the control panel (one-time setup)
	@echo "⚙️  Setting up Laravel Docker Control Panel..."
	@mkdir -p control-panel/public
	@if [ ! -f "control-panel/package.json" ]; then \
		echo "📦 Initializing package.json and installing core dependencies..."; \
		cd control-panel && npm init -y && \
		npm install express socket.io axios dotenv fs-extra chokidar dockerode && \
		npm install --save-dev nodemon; \
	fi
	@echo "✅ Control panel basic setup complete!"
	@echo "📝 Copy the UI files (index.html, app.js) into 'control-panel/public/'"
	@echo "🚀 Run 'make control' to start the panel"

control-dev: ## Start control panel in development mode with auto-reload
	@echo "🔧 Starting control panel in development mode..."
	@cd control-panel && npm run dev

stop-control: ## Stop the control panel
	@echo "⏹️  Attempting to stop control panel process..."
	@pkill -f "node.*server.js" || echo "No control panel process found running."

# Removed control-logs as the UI handles log streaming directly via Socket.IO

# ==============================================================================
# DOCKER COMMANDS
# ==============================================================================

install: ## Create Laravel project and setup environment
	@if [ ! -d "$(CODE_PATH)" ]; then \
		echo "🚀 Creating new Laravel project directory: $(CODE_PATH)..."; \
		mkdir -p $(CODE_PATH); \
	fi
	@if [ ! -f "$(CODE_PATH)/composer.json" ]; then \
		echo "📦 Creating new Laravel project in $(CODE_PATH)..."; \
		$(COMPOSE) run --rm -v $(shell pwd)/$(CODE_PATH):/var/www/html app composer create-project laravel/laravel .; \
		$(MAKE) setup; \
	else \
		echo "✅ Laravel project already exists in $(CODE_PATH). Running setup..."; \
		$(MAKE) setup; \
	fi

setup: ## Setup Laravel application dependencies and configuration
	@echo "⚙️  Setting up Laravel application in $(CODE_PATH)..."
	$(EXEC) composer install --no-interaction --prefer-dist
	@if [ ! -f "$(CODE_PATH)/.env" ]; then \
		echo "📝 Creating .env file and generating app key..."; \
		$(EXEC) cp .env.example .env; \
		$(EXEC) php artisan key:generate; \
	fi
	$(EXEC) php artisan storage:link || true # Use true to prevent exit on error if already linked
	$(MAKE) permissions
	@echo "✅ Laravel setup complete!"
	@echo "🌐 Your Laravel App: http://localhost:${APP_PORT:-8000}"
	@echo "🎛️  Start the control panel with: make control"

up: ## Start all Docker containers
	@echo "🚀 Starting Docker containers..."
	$(COMPOSE) up -d
	@echo "✅ Containers started!"
	@echo "🌐 Laravel App: http://localhost:${APP_PORT:-8000}"
	@echo "🎛️  Control Panel: make control"

down: ## Stop all Docker containers
	@echo "⏹️  Stopping Docker containers..."
	$(COMPOSE) down
	@echo "✅ Containers stopped!"

build: ## Build Docker service images
	@echo "🔨 Building Docker service images (without cache)..."
	$(COMPOSE) build --no-cache
	@echo "✅ Build complete!"

rebuild: ## Rebuild and restart all containers from scratch
	@echo "🔄 Rebuilding and restarting containers from scratch..."
	$(MAKE) down
	$(MAKE) build
	$(MAKE) up
	@echo "✅ Rebuild and restart complete!"

restart: ## Restart all containers
	@echo "🔄 Restarting containers..."
	$(COMPOSE) restart
	@echo "✅ Containers restarted!"

list: ## List all running Docker containers
	@echo "📋 Currently running Docker containers:"
	$(COMPOSE) ps

# ==============================================================================
# DEVELOPMENT SHELL ACCESS
# ==============================================================================

shell: ## Access the main application container shell
	@echo "💻 Accessing application container shell..."
	$(EXEC_INTERACTIVE) bash

shell-root: ## Access the main application container shell as root
	@echo "💻 Accessing application container shell as root..."
	$(COMPOSE) exec -u root app bash

shell-mysql: ## Access the MySQL container shell
	@echo "💻 Accessing MySQL container shell..."
	$(COMPOSE) exec mysql bash

shell-redis: ## Access the Redis container shell
	@echo "💻 Accessing Redis container shell..."
	$(COMPOSE) exec redis sh

# ==============================================================================
# LOGGING
# ==============================================================================

logs: ## Show aggregated application logs (PHP-FPM, Nginx errors)
	@echo "📋 Aggregated application logs:"
	$(EXEC) tail -f /var/www/html/storage/logs/laravel.log /var/log/nginx/error.log /var/log/supervisor/*.log

logs-service: ## Show logs for a specific Docker service (usage: make logs-service service="mysql")
	@if [ -z "$(service)" ]; then \
		echo "❌ Usage: make logs-service service=\"<service_name>\""; \
		echo "💡 Example: make logs-service service=\"app\" or service=\"mysql\""; \
		exit 1; \
	fi
	@echo "📋 Streaming logs for service: $(service)..."
	$(COMPOSE) logs -f $(service)

logs-all: ## Show all container logs
	@echo "📋 Streaming logs for all Docker containers:"
	$(COMPOSE) logs -f

# ==============================================================================
# LARAVEL COMMANDS
# ==============================================================================

artisan: ## Run any Laravel Artisan command (usage: make artisan cmd="migrate --seed")
	@if [ -z "$(cmd)" ]; then \
		echo "❌ Usage: make artisan cmd=\"<your_artisan_command>\""; \
		echo "💡 Example: make artisan cmd=\"migrate --force\""; \
		exit 1; \
	fi
	@echo "Executing artisan: php artisan $(cmd)"
	$(EXEC) php artisan $(cmd)

migrate: ## Run database migrations
	@echo "🗃️  Running database migrations..."
	$(EXEC) php artisan migrate --force
	@echo "✅ Migrations complete!"

migrate-fresh: ## Drop all tables and re-run migrations (WARNING: Data Loss!)
	@echo "🗃️  WARNING: Running fresh migration with seed (THIS WILL DELETE ALL DATA)..."
	@read -p "Are you absolutely sure? (type 'yes' to confirm): " confirm && [ "$$confirm" = "yes" ] || { echo "Operation cancelled."; exit 1; }
	$(EXEC) php artisan migrate:fresh --seed --force
	@echo "✅ Fresh migration complete!"

migrate-rollback: ## Rollback the last database migration batch
	@echo "↩️  Rolling back last migration batch..."
	$(EXEC) php artisan migrate:rollback --force
	@echo "✅ Rollback complete!"

seed: ## Run database seeders
	@echo "🌱 Running database seeders..."
	$(EXEC) php artisan db:seed --force
	@echo "✅ Seeding complete!"

tinker: ## Open Laravel Tinker
	@echo "🔧 Opening Laravel Tinker..."
	$(EXEC_INTERACTIVE) php artisan tinker

queue: ## Start a Laravel queue worker (manual, foreground)
	@echo "⚡ Starting Laravel queue worker (Ctrl+C to stop)..."
	$(EXEC_INTERACTIVE) php artisan queue:work

queue-restart: ## Restart all Laravel queue workers
	@echo "🔄 Restarting Laravel queue workers..."
	$(EXEC) php artisan queue:restart
	@echo "✅ Queue workers restarted!"

schedule: ## Run scheduled tasks (for testing cron jobs)
	@echo "⏰ Running Laravel scheduled tasks..."
	$(EXEC) php artisan schedule:run
	@echo "✅ Scheduled tasks complete!"

cache-clear: ## Clear all Laravel caches (application, config, route, view)
	@echo "🧹 Clearing all Laravel caches..."
	$(EXEC) php artisan cache:clear
	$(EXEC) php artisan config:clear
	$(EXEC) php artisan route:clear
	$(EXEC) php artisan view:clear
	@echo "✅ All Laravel caches cleared!"

optimize: ## Optimize Laravel application for production
	@echo "⚡ Optimizing Laravel application..."
	$(EXEC) php artisan config:cache
	$(EXEC) php artisan route:cache
	$(EXEC) php artisan view:cache
	$(EXEC) php artisan event:cache
	@echo "✅ Optimization complete!"

optimize-clear: ## Clear all caches and then optimize
	@echo "🧹⚡ Clearing and optimizing Laravel application..."
	$(MAKE) cache-clear
	$(MAKE) optimize
	@echo "✅ Caches cleared and optimized!"

key-generate: ## Generate a new Laravel application key
	@echo "🔑 Generating new Laravel application key..."
	$(EXEC) php artisan key:generate
	@echo "✅ New key generated!"

# ==============================================================================
# DEPENDENCY MANAGEMENT
# ==============================================================================

composer: ## Run any Composer command (usage: make composer cmd="require package/name")
	@if [ -z "$(cmd)" ]; then \
		echo "❌ Usage: make composer cmd=\"<your_composer_command>\""; \
		echo "💡 Example: make composer cmd=\"update --no-dev\""; \
		exit 1; \
	fi
	@echo "Executing composer $(cmd)"
	$(EXEC) composer $(cmd)

composer-install: ## Install PHP Composer dependencies
	@echo "📦 Installing PHP Composer dependencies..."
	$(EXEC) composer install --no-interaction --prefer-dist
	@echo "✅ PHP dependencies installed!"

composer-update: ## Update PHP Composer dependencies
	@echo "📦 Updating PHP Composer dependencies..."
	$(EXEC) composer update --no-interaction --prefer-dist
	@echo "✅ PHP dependencies updated!"

composer-dump: ## Dump Composer autoloader files
	@echo "📦 Dumping Composer autoload files..."
	$(EXEC) composer dump-autoload --optimize
	@echo "✅ Autoload dumped!"

npm: ## Run any NPM command (usage: make npm cmd="install")
	@if [ -z "$(cmd)" ]; then \
		echo "❌ Usage: make npm cmd=\"<your_npm_command>\""; \
		echo "💡 Example: make npm cmd=\"run dev\""; \
		exit 1; \
	fi
	@echo "Executing npm $(cmd)"
	$(EXEC) npm $(cmd)

npm-install: ## Install Node.js dependencies with NPM
	@echo "📦 Installing Node.js dependencies with NPM..."
	$(EXEC) npm install
	@echo "✅ Node.js dependencies installed!"

npm-update: ## Update Node.js dependencies with NPM
	@echo "📦 Updating Node.js dependencies with NPM..."
	$(EXEC) npm update
	@echo "✅ Node.js dependencies updated!"

npm-dev: ## Start Vite development server
	@echo "⚡ Starting Vite development server (Ctrl+C to stop)..."
	$(EXEC_INTERACTIVE) npm run dev

npm-build: ## Build frontend assets for production with NPM
	@echo "🔨 Building frontend assets for production with NPM..."
	$(EXEC) npm run build
	@echo "✅ Assets built!"

npm-watch: ## Watch frontend files for changes (Vite)
	@echo "👀 Watching frontend files for changes with Vite..."
	$(EXEC_INTERACTIVE) npm run dev -- --watch

npm-watch-legacy: ## Watch frontend files for changes (Laravel Mix, if applicable)
	@echo "👀 Watching frontend files for changes (Legacy Laravel Mix)..."
	$(EXEC_INTERACTIVE) npm run watch

bun: ## Run any Bun command (usage: make bun cmd="install")
	@if [ -z "$(cmd)" ]; then \
		echo "❌ Usage: make bun cmd=\"<your_bun_command>\""; \
		echo "💡 Example: make bun cmd=\"run dev\""; \
		exit 1; \
	fi
	@echo "Executing bun $(cmd)"
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
	$(EXEC_INTERACTIVE) bun run dev

bun-build: ## Build assets with Bun
	@echo "🔨 Building assets with Bun..."
	$(EXEC) bun run build
	@echo "✅ Assets built with Bun!"

# ==============================================================================
# TESTING
# ==============================================================================

test: ## Run PHPUnit tests
	@echo "🧪 Running PHPUnit tests..."
	$(EXEC_INTERACTIVE) vendor/bin/phpunit
	@echo "✅ PHPUnit tests complete!"

test-coverage: ## Run PHPUnit tests with coverage report
	@echo "🧪 Running PHPUnit tests with coverage..."
	$(EXEC_INTERACTIVE) vendor/bin/phpunit --coverage-html coverage
	@echo "✅ Coverage report generated in coverage/"

test-filter: ## Run specific PHPUnit test (usage: make test-filter name="TestClassName")
	@if [ -z "$(name)" ]; then \
		echo "❌ Usage: make test-filter name=\"<TestName>\""; \
		echo "💡 Example: make test-filter name=\"UserTest\""; \
		exit 1; \
	fi
	@echo "🧪 Running filtered PHPUnit tests for: $(name)..."
	$(EXEC_INTERACTIVE) vendor/bin/phpunit --filter $(name)

test-unit: ## Run only unit tests with PHPUnit
	@echo "🧪 Running unit tests..."
	$(EXEC_INTERACTIVE) vendor/bin/phpunit --testsuite=Unit
	@echo "✅ Unit tests complete!"

test-feature: ## Run only feature tests with PHPUnit
	@echo "🧪 Running feature tests..."
	$(EXEC_INTERACTIVE) vendor/bin/phpunit --testsuite=Feature
	@echo "✅ Feature tests complete!"

pest: ## Run Pest tests
	@echo "🧪 Running Pest tests..."
	$(EXEC_INTERACTIVE) vendor/bin/pest
	@echo "✅ Pest tests complete!"

pest-coverage: ## Run Pest tests with coverage
	@echo "🧪 Running Pest tests with coverage..."
	$(EXEC_INTERACTIVE) vendor/bin/pest --coverage
	@echo "✅ Pest coverage complete!"

# ==============================================================================
# PROJECT PATH MANAGEMENT
# ==============================================================================

path: ## Show current Laravel application path
	@echo "📁 Current Laravel application path: $(CODE_PATH)"
	@echo "🗂️  Full path on host: $(shell pwd)/$(CODE_PATH)"
	@if [ -f "$(CODE_PATH)/composer.json" ]; then \
		echo "✅ Laravel project detected."; \
		if [ -f "$(CODE_PATH)/artisan" ]; then \
			echo "✅ Artisan command is available."; \
		fi; \
	else \
		echo "❌ No Laravel project found in $(CODE_PATH)"; \
		echo "💡 Run 'make install' to create a new Laravel project or 'make switch-path' if it's elsewhere."; \
	fi

switch-path: ## Switch the project directory path in .env (usage: make switch-path path="new/path")
	@if [ -z "$(path)" ]; then \
		echo "❌ Usage: make switch-path path=\"your/new/path\""; \
		echo "📝 Example: make switch-path path=\"src/my_app\""; \
		exit 1; \
	fi
	@echo "🔄 Switching CODE_PATH in .env from '$(CODE_PATH)' to '$(path)'"
	@sed -i.bak 's|^CODE_PATH=.*|CODE_PATH=$(path)|' .env || { echo "Failed to update .env. Make sure .env exists and is writable."; exit 1; }
	@rm -f .env.bak
	@echo "✅ Updated .env file. New CODE_PATH: $(path)"
	@echo "💡 Remember to run 'make rebuild' to apply changes to Docker containers."
	@echo "🎛️  The control panel will automatically detect the new path on next refresh."

create-project: ## Create a new Laravel project in a specified path (usage: make create-project path="projects/myapp")
	@if [ -z "$(path)" ]; then \
		echo "❌ Usage: make create-project path=\"your/project/path\""; \
		echo "📝 Example: make create-project path=\"projects/my_new_app\""; \
		exit 1; \
	fi
	@echo "🚀 Creating Laravel project in $(path)..."
	@mkdir -p $(path)
	# Temporarily set CODE_PATH for this command to create project in specified path
	$(COMPOSE) run --rm -v $(shell pwd)/$(path):/var/www/html app composer create-project laravel/laravel .
	@echo "✅ Laravel project created in $(path)"
	@echo "💡 To use this project, update your .env: CODE_PATH=$(path) and then 'make rebuild && make setup'"

# ==============================================================================
# MAINTENANCE & CLEANUP
# ==============================================================================

permissions: ## Fix Laravel file permissions within the container
	@echo "🔧 Fixing file permissions for Laravel project..."
	$(EXEC_ROOT) chown -R devuser:www-data /var/www/html
	$(EXEC_ROOT) chmod -R 775 /var/www/html/storage 2>/dev/null || true
	$(EXEC_ROOT) chmod -R 775 /var/www/html/bootstrap/cache 2>/dev/null || true
	$(EXEC_ROOT) chmod -R 775 /var/www/html/public 2>/dev/null || true
	@echo "✅ Permissions fixed!"

clean: ## Stop and remove all containers, networks, and volumes associated with this project
	@echo "🧹 Cleaning up project containers and volumes..."
	$(COMPOSE) down -v --remove-orphans
	@echo "✅ Project cleanup complete!"

clean-all: ## Stop and remove all Docker containers, volumes, networks, and images (DANGEROUS!)
	@echo "⚠️  WARNING: This will remove ALL Docker containers, volumes, networks, AND images on your system."
	@echo "This is a full system reset for Docker. Proceed with caution!"
	@read -p "Are you absolutely sure you want to clean ALL Docker data? (type 'yes' to confirm): " confirm && [ "$$confirm" = "yes" ] || { echo "Operation cancelled."; exit 1; }
	$(COMPOSE) down -v --remove-orphans --rmi all
	docker system prune -a -f
	docker volume prune -f
	docker network prune -f
	@echo "✅ Deep Docker cleanup complete!"

prune: ## Prune unused Docker images, containers, volumes, and networks (safer cleanup)
	@echo "🧹 Pruning unused Docker images, containers, volumes, and networks..."
	docker system prune --all --volumes --force
	@echo "✅ Docker system pruned!"

fresh: ## Perform a fresh installation (clean, build, install)
	@echo "🔄 Performing fresh installation (clean -> build -> install)..."
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) install
	@echo "✅ Fresh installation complete! Project is ready."

# ==============================================================================
# DATABASE COMMANDS
# ==============================================================================

db-shell: ## Access the MySQL client shell in the container
	@echo "💻 Accessing MySQL client shell..."
	$(COMPOSE) exec mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE)

db-dump: ## Dump the database to a SQL file on the host (in current directory)
	@echo "💾 Dumping database to a SQL file..."
	@FILENAME="backup-$(shell date +%Y%m%d_%H%M%S).sql"
	$(COMPOSE) exec mysql mysqldump -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) > "$$FILENAME"
	@echo "✅ Database dumped to: $$FILENAME"

db-restore: ## Restore the database from a SQL file (usage: make db-restore file="my-backup.sql")
	@if [ -z "$(file)" ]; then \
		echo "❌ Usage: make db-restore file=\"<your_sql_file.sql>\""; \
		echo "💡 Example: make db-restore file=\"backup-20231027_123456.sql\""; \
		exit 1; \
	fi
	@if [ ! -f "$(file)" ]; then \
		echo "❌ Error: Backup file '$(file)' not found in the current directory."; \
		exit 1; \
	fi
	@echo "📥 Restoring database from $(file)..."
	$(COMPOSE) exec -T mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) < "$(file)"
	@echo "✅ Database restored successfully from $(file)!"

db-reset: ## Reset the database (fresh migrate & seed) with confirmation
	@echo "⚠️  WARNING: This will drop all tables and re-run migrations, potentially deleting ALL database data."
	@read -p "Are you absolutely sure you want to reset the database? (type 'yes' to confirm): " confirm && [ "$$confirm" = "yes" ] || { echo "Operation cancelled."; exit 1; }
	$(EXEC) php artisan migrate:fresh --seed --force
	@echo "✅ Database reset and re-seeded!"

# ==============================================================================
# MONITORING & DEBUGGING
# ==============================================================================

status: ## Show running Docker container status
	@echo "📊 Docker Container Status:"
	$(COMPOSE) ps

top: ## Show running processes within containers
	@echo "📊 Running processes in containers:"
	$(COMPOSE) top

stats: ## Show real-time container resource usage (CPU, Memory, Network, Block I/O)
	@echo "📊 Real-time Container Resource Usage (Ctrl+C to stop):"
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" --no-stream

health: ## Run project-specific health checks (if health-check.sh exists)
	@echo "🏥 Running project health check..."
	@if [ -f "health-check.sh" ]; then \
		./health-check.sh; \
	else \
		echo "❌ health-check.sh not found. Create one to add custom health checks."; \
	fi

debug: ## Run project-specific debug script (if debug.sh exists)
	@echo "🔍 Running project debug script..."
	@if [ -f "debug.sh" ]; then \
		./debug.sh; \
	else \
		echo "❌ debug.sh not found. Create one to add custom debugging steps."; \
	fi

# ==============================================================================
# UTILITY COMMANDS
# ==============================================================================

urls: ## Display common application URLs
	@echo "🌐 Application URLs:"
	@echo "  Main App:         http://localhost:${APP_PORT:-8000}"
	@echo "  Control Panel:    http://localhost:${CONTROL_PANEL_PORT:-9000}"
	@echo "  Vite Dev:         http://localhost:${VITE_PORT:-5173}"
	@echo "  PHPMyAdmin:       http://localhost:${PHPMYADMIN_PORT:-8080}"
	@echo "  Redis Insight:    http://localhost:${REDIS_INSIGHT_PORT:-8001}"
	@echo "  Mailhog:          http://localhost:${MAILHOG_PORT:-8025}"

info: ## Show environment and project information
	@echo "ℹ️  Environment Information:"
	@echo "  APP_NAME:         ${APP_NAME:-N/A}"
	@echo "  CODE_PATH:        ${CODE_PATH:-N/A}"
	@echo "  APP_PORT:         ${APP_PORT:-N/A}"
	@echo "  DB_DATABASE:      ${DB_DATABASE:-N/A}"
	@echo "  CONTROL_PANEL_PORT: ${CONTROL_PANEL_PORT:-9000}"
	@echo "  PHP Version (in container):"
	$(EXEC) php -r "echo PHP_VERSION;" || echo "N/A (container not running)"
	@echo "  Node.js Version (in container):"
	$(EXEC) node -v || echo "N/A (container not running or Node.js not installed)"

update: ## Update all project dependencies (Composer and NPM/Bun)
	@echo "📦 Updating all project dependencies..."
	$(MAKE) composer-update
	$(MAKE) npm-update || $(MAKE) bun-update || echo "No NPM or Bun dependencies updated."
	@echo "✅ All project dependencies updated!"

backup: ## Create a full project backup (database dump + code archive)
	@echo "💾 Creating full project backup..."
	$(MAKE) db-dump
	@BACKUP_FILENAME="full-backup-$(shell date +%Y%m%d_%H%M%S).tar.gz"
	@tar -czf "$$BACKUP_FILENAME" $(CODE_PATH) $(shell find . -maxdepth 1 -name "backup-*.sql" -print | sort -r | head -n 1)
	@echo "✅ Full backup created: $$BACKUP_FILENAME"

# ==============================================================================
# DEVELOPMENT HELPERS
# ==============================================================================

ide-helper: ## Generate Laravel IDE helper files
	@echo "💡 Generating Laravel IDE helper files..."
	$(EXEC) php artisan ide-helper:generate
	$(EXEC) php artisan ide-helper:models
	$(EXEC) php artisan ide-helper:meta
	@echo "✅ IDE helper files generated!"

clear-logs: ## Clear application log files in storage/logs
	@echo "🧹 Clearing application log files in storage/logs..."
	$(EXEC) find storage/logs -name "*.log" -delete 2>/dev/null || true
	@echo "✅ Log files cleared!"

restart-workers: ## Restart all background workers (e.g., queues, supervisor processes)
	@echo "🔄 Restarting background workers..."
	$(EXEC) php artisan queue:restart
	$(EXEC) supervisorctl restart all 2>/dev/null || true # Assuming supervisor is used for workers
	@echo "✅ Workers restarted!"

quick-start: ## Show a quick start guide for new users
	@echo "🚀 Laravel Docker Quick Start Guide"
	@echo "===================================="
	@echo ""
	@echo "1. First time setup:"
	@echo "   make install              # Setup Laravel project and containers"
	@echo "   make setup-control-panel  # Setup web control panel files"
	@echo ""
	@echo "2. Daily development workflow:"
	@echo "   make up                   # Start Docker containers"
	@echo "   make control              # Start web control panel"
	@echo "   make npm-dev              # Start frontend dev server (Vite)"
	@echo ""
	@echo "3. Web interfaces (after 'make up' and 'make control'):"
	@echo "   http://localhost:${APP_PORT:-8000}                # Your Laravel App"
	@echo "   http://localhost:${CONTROL_PANEL_PORT:-9000}      # The Control Panel"
	@echo "   http://localhost:${PHPMYADMIN_PORT:-8080}         # PHPMyAdmin"
	@echo ""
	@echo "4. Common commands:"
	@echo "   make shell                # Access the app container's terminal"
	@echo "   make artisan cmd=\"migrate\" # Run any Artisan command"
	@echo "   make logs-service service=\"app\" # View real-time logs for a service"
	@echo "   make test                 # Run PHPUnit tests"
	@echo "   make down                 # Stop all containers"
	@echo "   make help                 # Show all available commands"
	@echo ""
	@echo "Happy coding! 🎉"
