.PHONY: network remove-network list-network start stop destroy volume build list link exe composer npm npm-upgrade npm-update

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
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'composer install && chmod -R 777 storage bootstrap/cache'

npm:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'npm install && npm run dev'

npm-upgrade:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'npm upgrade'

npm-update:
	@$(DOCKER) exec -it ${DOCKER_PREFIX}_${CONTAINER_NAME}_app /bin/bash -c 'npm update'
