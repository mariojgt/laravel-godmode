.PHONY: network remove-network list-network start stop destroy volume build list link exe composer bun bun-upgrade bun-update

COMPOSE = docker compose
DOCKER = docker
# Load .env file
DOCKER_PREFIX:= $(shell grep -E '^DOCKER_PREFIX' .env | cut -d '=' -f 2)
NETWORK_NAME:= $(shell grep -E '^NETWORK_NAME' .env | cut -d '=' -f 2)
CONTAINER_NAME:= $(shell grep -E '^CONTAINER_NAME' .env | cut -d '=' -f 2)
CODE_PATH:= $(shell grep -E '^CODE_PATH' .env | cut -d '=' -f 2)

REDIS_PORT:= $(shell grep -E '^REDIS_PORT' .env | cut -d '=' -f 2)
PHPMYADMIN_PORT:= $(shell grep -E '^PHPMYADMIN_PORT' .env | cut -d '=' -f 2)
MYAPP_PORT:= $(shell grep -E '^MYAPP_PORT' .env | cut -d '=' -f 2)
REDIS_INSIGHT_PORT:= $(shell grep -E '^REDIS_INSIGHT_PORT' .env | cut -d '=' -f 2)

DOMAIN := example.com
EMAIL := example@example.com

# /*
# |--------------------------------------------------------------------------
# | network cmds
# |--------------------------------------------------------------------------
# */
network:
	@$(DOCKER) network create $(NETWORK_NAME)

remove-network:
	@$(DOCKER) network rm $(NETWORK_NAME)

list-network:
	@$(DOCKER) network ls

# /*
# |--------------------------------------------------------------------------
# | docker cmds
# |--------------------------------------------------------------------------
# */
start:
	@$(COMPOSE) up -d

stop:
	@$(COMPOSE) down

destroy:
	@$(COMPOSE) rm -v -s -f

volume:
	@$(DOCKER) volume ls

build:
	@$(COMPOSE) build

list:
	@$(COMPOSE) ps -a

prune:
	@$(DOCKER) system prune -a

host:
	$(COMPOSE) -f docker compose-ngrok.yml up -d

host-stop:
	$(COMPOSE) -f docker compose-ngrok.yml down

clear-redis:
	$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_redis redis-cli flushall
# /*
# |--------------------------------------------------------------------------
# | Utility cmds
# |--------------------------------------------------------------------------
# */
link:
	@echo "Creating URLs for services with '$(DOCKER_PREFIX)_' prefix..."
	@SERVER_IP=$$(hostname -I | cut -d' ' -f1); \
	echo "http://$$SERVER_IP:$(PHPMYADMIN_PORT)"; \
	echo "http://$$SERVER_IP:$(REDIS_INSIGHT_PORT)"; \
	echo "http://$$SERVER_IP:$(MYAPP_PORT)"


exe:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash

# New command to run tests with code coverage
coverage: ## Run PHPUnit tests with code coverage
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app \
		vendor/bin/phpunit --coverage-html=coverage/

# New command to run tests with text-based coverage report
coverage-text: ## Run PHPUnit tests with text-based coverage report
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app \
		vendor/bin/phpunit --coverage-text

horizon:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'php artisan horizon'

composer:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'composer update && chmod -R 755 . && chmod -R 777 storage bootstrap/cache resources'

bun:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun install && bun run dev'

bun-upgrade:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun upgrade'

bun-update:
	@$(DOCKER) exec -itu devuser ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun update'

permission:
	@$(eval CURRENT_USER := $(shell whoami))
	@sudo chown -R $(CURRENT_USER):$(CURRENT_USER) *
	@$(COMPOSE) exec -u root php-app chown -R devuser:devuser /var/www/html

fix-permissions:
	@echo "Setting correct permissions for Laravel directories..."
	@docker exec -it --user root ${DOCKER_PREFIX}_${CONTAINER_NAME}_app bash -c '\
		chown -R www-data:www-data /var/www/html/storage && \
		chown -R www-data:www-data /var/www/html/bootstrap/cache && \
		chmod -R 775 /var/www/html/storage && \
		chmod -R 775 /var/www/html/bootstrap/cache && \
		chown -R www-data:www-data /var/www/html/public && \
		find /var/www/html/storage -type f -exec chmod 664 {} \; && \
		find /var/www/html/storage -type d -exec chmod 775 {} \; && \
		find /var/www/html/bootstrap/cache -type f -exec chmod 664 {} \; && \
		find /var/www/html/bootstrap/cache -type d -exec chmod 775 {} \; && \
		echo "Permissions have been set"'

# /*
# |--------------------------------------------------------------------------
# | Supervisor
# |--------------------------------------------------------------------------
# */

# Show processes running in container
ps:
	docker exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app ps aux

# Show supervisor status
status-supervisor:
	docker exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app supervisorctl status

# Stop all supervisor processes
stop-supervisor:
	docker exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app supervisorctl stop all

# Start all supervisor processes
start-supervisor:
	docker exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app supervisorctl start all

# Restart all supervisor processes
restart-supervisor:
	docker exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app supervisorctl restart all


# /*
# |--------------------------------------------------------------------------
# | SYNC FOLDERS THE PACKAGES
# |--------------------------------------------------------------------------
# */
USER := $(shell whoami)
PROJECTS_DIR := /home/$(USER)/projects/laravel-projects
CURRENT_DIR := $(shell basename $(CURDIR))

link-folder:
	ln -s $(PROJECTS_DIR)/repo $(PROJECTS_DIR)/projects/$(CURRENT_DIR)/project/$(CODE_PATH)/repo

install-laravel:
	cd project && composer create-project laravel/laravel $(CODE_PATH)

# case we need to reset laravel permissions
# sudo chown -R $(id -u):$(id -g) ./project/storage ./project/bootstrap/cache
# sudo chmod -R 775 ./project/storage ./project/bootstrap/cache

create-user:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c "adduser --disabled-password --gecos '' --uid $(USER_ID) --gid $(GROUP_ID) devuser"
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c "chown -R devuser:devuser /var/www/html"

ssl-cert:
	@mkdir -p project/ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout project/ssl/server.key \
		-out project/ssl/server.crt \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
	@echo "SSL certificates generated in project/ssl/"
	@echo "server.key and server.crt have been created"
	@chmod 644 project/ssl/server.crt
	@chmod 600 project/ssl/server.key

# SSL and Domain Management
.PHONY: ssl-setup ssl-renew ssl-status domain-setup

DOMAIN := thedevrealm.com
EMAIL := thedevrealm@thedevrealm.com

ssl-setup: ## Install and configure Let's Encrypt SSL
	@echo "Setting up SSL for $(DOMAIN)..."
	@docker exec -it --user root ${DOCKER_PREFIX}_${CONTAINER_NAME}_app bash -c '\
		apt-get update && \
		apt-get install -y certbot python3-certbot-apache && \
		certbot --apache \
			--non-interactive \
			--agree-tos \
			--email ${EMAIL} \
			--domains ${DOMAIN} \
			--redirect && \
		apache2ctl -t && \
		service apache2 reload'

ssl-status:
	@echo "Checking SSL certificate status..."
	@docker exec -it --user root ${DOCKER_PREFIX}_${CONTAINER_NAME}_app bash -c '\
		if ! command -v certbot &> /dev/null; then \
			apt-get update && \
			apt-get install -y certbot python3-certbot-apache; \
		fi && \
		certbot certificates'

apache-logs: ## View Apache error logs
	@docker exec -it --user root ${DOCKER_PREFIX}_${CONTAINER_NAME}_app tail -f /var/log/apache2/error.log
