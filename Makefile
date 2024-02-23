.PHONY: start stop build composer list create-network remove-network

COMPOSE =sudo docker-compose
DOCKER = sudo docker
# Load .env file
NETWORK_NAME := $(shell grep -E '^NETWORK_NAME' .env | cut -d '=' -f 2)

network:
	@$(DOCKER) network create $(NETWORK_NAME)

remove-network:
	@$(DOCKER) network rm $(NETWORK_NAME)

list-network:
	@$(DOCKER) network ls

start:
	@$(COMPOSE) up -d

stop:
	@$(COMPOSE) down

build:
	@$(COMPOSE) build

list:
	@$(COMPOSE) ps -a

composer:
	@$(COMPOSE) exec app composer install
	@$(COMPOSE) exec app chmod -R 777 storage bootstrap/cache
