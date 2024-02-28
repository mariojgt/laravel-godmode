.PHONY: network remove-network list-network start stop destroy volume build list link exe composer bun bun-upgrade bun-update

COMPOSE =sudo docker-compose
DOCKER = sudo docker
# Load .env file
DOCKER_PREFIX:= $(shell grep -E '^DOCKER_PREFIX' .env | cut -d '=' -f 2)
NETWORK_NAME:= $(shell grep -E '^NETWORK_NAME' .env | cut -d '=' -f 2)
CONTAINER_NAME:= $(shell grep -E '^CONTAINER_NAME' .env | cut -d '=' -f 2)
CODE_PATH:= $(shell grep -E '^CODE_PATH' .env | cut -d '=' -f 2)

REDIS_PORT:= $(shell grep -E '^REDIS_PORT' .env | cut -d '=' -f 2)
PHPMYADMIN_PORT:= $(shell grep -E '^PHPMYADMIN_PORT' .env | cut -d '=' -f 2)
MYAPP_PORT:= $(shell grep -E '^MYAPP_PORT' .env | cut -d '=' -f 2)
REDIS_INSIGHT_PORT:= $(shell grep -E '^REDIS_INSIGHT_PORT' .env | cut -d '=' -f 2)

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
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash

composer:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'composer update && chmod -R 755 . && chmod -R 777 storage bootstrap/cache resources'

bun:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun install && bun run dev'

bun-upgrade:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun upgrade'

bun-update:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'bun update'

permission:
	@$(eval CURRENT_USER := $(shell whoami))
	@sudo chown -R $(CURRENT_USER):$(CURRENT_USER) *

# /*
# |--------------------------------------------------------------------------
# | SYNC FOLDERS THE PACKAGES
# |--------------------------------------------------------------------------
# */
USER := $(shell whoami)
PROJECTS_DIR := /home/$(USER)/projects/laravel-projects
CURRENT_DIR := $(shell basename $(CURDIR))

link-folder:
	ln -s $(PROJECTS_DIR)/packages $(PROJECTS_DIR)/projects/$(CURRENT_DIR)/project/laravel/packages
