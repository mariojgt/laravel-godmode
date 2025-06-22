.PHONY: help install up down build rebuild shell logs clean test npm composer artisan fresh optimize backup restore

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
	@echo "Laravel Docker Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# DOCKER COMMANDS
# ==============================================================================

install: ## Create Laravel project and setup environment
	@if [ ! -f "$(CODE_PATH)/composer.json" ]; then \
		echo "Creating new Laravel project in $(CODE_PATH)..."; \
		mkdir -p $(CODE_PATH); \
		$(COMPOSE) run --rm app composer create-project laravel/laravel .; \
		$(MAKE) setup; \
	else \
		echo "Laravel project already exists in $(CODE_PATH). Running setup..."; \
		$(MAKE) setup; \
	fi

setup: ## Setup Laravel application
	@echo "Setting up Laravel application in $(CODE_PATH)..."
	$(EXEC) composer install
	@if [ ! -f "$(CODE_PATH)/.env" ]; then \
		$(EXEC) cp .env.example .env; \
		$(EXEC) php artisan key:generate; \
	fi
	$(EXEC) php artisan storage:link
	$(MAKE) permissions
	@echo "Setup complete! Visit http://localhost:${APP_PORT}"

up: ## Start all containers
	$(COMPOSE) up -d

down: ## Stop all containers
	$(COMPOSE) down

build: ## Build containers
	$(COMPOSE) build --no-cache

rebuild: ## Rebuild and restart containers
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

restart: ## Restart all containers
	$(COMPOSE) restart

list: ## List all containers
	$(COMPOSE) ps

# ==============================================================================
# DEVELOPMENT COMMANDS
# ==============================================================================

shell: ## Access application container shell
	$(EXEC) bash

shell-root: ## Access application container as root
	$(EXEC_ROOT) bash

logs: ## Show application logs
	$(COMPOSE) logs -f app

logs-nginx: ## Show nginx logs
	$(EXEC) tail -f /var/log/nginx/error.log

logs-all: ## Show all container logs
	$(COMPOSE) logs -f

# ==============================================================================
# LARAVEL COMMANDS
# ==============================================================================

artisan: ## Run artisan command (usage: make artisan cmd="migrate")
	$(EXEC) php artisan $(cmd)

migrate: ## Run database migrations
	$(EXEC) php artisan migrate

migrate-fresh: ## Fresh migration with seed
	$(EXEC) php artisan migrate:fresh --seed

seed: ## Run database seeders
	$(EXEC) php artisan db:seed

tinker: ## Open Laravel Tinker
	$(EXEC) php artisan tinker

queue: ## Start queue worker
	$(EXEC) php artisan queue:work

schedule: ## Run scheduled tasks (for testing)
	$(EXEC) php artisan schedule:run

cache-clear: ## Clear all caches
	$(EXEC) php artisan cache:clear
	$(EXEC) php artisan config:clear
	$(EXEC) php artisan route:clear
	$(EXEC) php artisan view:clear

optimize: ## Optimize Laravel application
	$(EXEC) php artisan config:cache
	$(EXEC) php artisan route:cache
	$(EXEC) php artisan view:cache
	$(EXEC) php artisan event:cache

# ==============================================================================
# DEPENDENCY MANAGEMENT
# ==============================================================================

composer: ## Run composer command (usage: make composer cmd="require package")
	$(EXEC) composer $(cmd)

composer-install: ## Install PHP dependencies
	$(EXEC) composer install

composer-update: ## Update PHP dependencies
	$(EXEC) composer update

npm: ## Run npm command (usage: make npm cmd="install")
	$(EXEC) npm $(cmd)

npm-install: ## Install Node.js dependencies
	$(EXEC) npm install

npm-dev: ## Run npm development server
	$(EXEC) npm run dev

npm-build: ## Build assets for production
	$(EXEC) npm run build

npm-watch: ## Watch files for changes
	$(EXEC) npm run dev -- --watch

bun: ## Run bun command (usage: make bun cmd="install")
	$(EXEC) bun $(cmd)

bun-install: ## Install dependencies with Bun
	$(EXEC) bun install

bun-dev: ## Run development server with Bun
	$(EXEC) bun run dev

bun-build: ## Build assets with Bun
	$(EXEC) bun run build

# ==============================================================================
# TESTING
# ==============================================================================

test: ## Run PHPUnit tests
	$(EXEC) vendor/bin/phpunit

test-coverage: ## Run tests with coverage report
	$(EXEC) vendor/bin/phpunit --coverage-html coverage

test-filter: ## Run specific test (usage: make test-filter name="TestName")
	$(EXEC) vendor/bin/phpunit --filter $(name)

pest: ## Run Pest tests
	$(EXEC) vendor/bin/pest

pest-coverage: ## Run Pest tests with coverage
	$(EXEC) vendor/bin/pest --coverage

# ==============================================================================
# MAINTENANCE
# ==============================================================================

permissions: ## Fix file permissions
	$(EXEC_ROOT) chown -R devuser:www-data /var/www/html
	$(EXEC_ROOT) chmod -R 775 /var/www/html/storage
	$(EXEC_ROOT) chmod -R 775 /var/www/html/bootstrap/cache
	$(EXEC_ROOT) chmod -R 775 /var/www/html/public

clean: ## Clean up containers and volumes
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean everything including images
	$(COMPOSE) down -v --remove-orphans --rmi all
	docker system prune -a -f

fresh: ## Fresh installation
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) install

# ==============================================================================
# DATABASE COMMANDS
# ==============================================================================

db-shell: ## Access MySQL shell
	$(COMPOSE) exec mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE)

db-dump: ## Dump database to file
	$(COMPOSE) exec mysql mysqldump -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) > backup.sql

db-restore: ## Restore database from backup.sql
	$(COMPOSE) exec -T mysql mysql -u $(DB_USERNAME) -p$(DB_PASSWORD) $(DB_DATABASE) < backup.sql

# ==============================================================================
# UTILITY COMMANDS
# ==============================================================================

# UTILITY COMMANDS
# ==============================================================================

path: ## Show current Laravel application path
	@echo "Current Laravel application path: $(CODE_PATH)"
	@echo "Full path: $(shell pwd)/$(CODE_PATH)"
	@if [ -f "$(CODE_PATH)/composer.json" ]; then \
		echo "✅ Laravel project found"; \
	else \
		echo "❌ No Laravel project found in $(CODE_PATH)"; \
	fi

switch-path: ## Switch to different Laravel path (usage: make switch-path path="new/path")
	@if [ -z "$(path)" ]; then \
		echo "Usage: make switch-path path=\"your/new/path\""; \
		echo "Example: make switch-path path=\"src/laravel\""; \
		exit 1; \
	fi
	@echo "Switching CODE_PATH from $(CODE_PATH) to $(path)"
	@sed -i.bak 's|^CODE_PATH=.*|CODE_PATH=$(path)|' .env
	@echo "✅ Updated .env file. New path: $(path)"
	@echo "🔄 Run 'make restart' to apply changes"

create-project: ## Create Laravel project in specific path (usage: make create-project path="projects/myapp")
	@if [ -z "$(path)" ]; then \
		echo "Usage: make create-project path=\"your/project/path\""; \
		echo "Example: make create-project path=\"projects/myapp\""; \
		exit 1; \
	fi
	@echo "Creating Laravel project in $(path)..."
	@mkdir -p $(path)
	@sed -i.bak 's|^CODE_PATH=.*|CODE_PATH=$(path)|' .env
	@$(COMPOSE) run --rm -v ./$(path):/var/www/html app composer create-project laravel/laravel .
	@echo "✅ Laravel project created in $(path)"
	@echo "🔄 Run 'make up && make setup' to start"

urls: ## Show application URLs
	@echo "Application URLs:"
	@echo "  Main App:       http://localhost:$(APP_PORT)"
	@echo "  Vite Dev:       http://localhost:$(VITE_PORT)"
	@echo "  PHPMyAdmin:     http://localhost:$(PHPMYADMIN_PORT)"
	@echo "  Redis Insight:  http://localhost:$(REDIS_INSIGHT_PORT)"
	@echo "  Mailhog:        http://localhost:$(MAILHOG_PORT)"

status: ## Show container status
	$(COMPOSE) ps

top: ## Show running processes
	$(COMPOSE) top

stats: ## Show container resource usage
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
