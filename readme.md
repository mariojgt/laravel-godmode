## The project is a simple docker-compose file to run a laravel

#### Note make sure to update the .env file with the correct values, you should be able to by visiting  *192.168.0.x:port*

### 1. *make network* command to create a network

### 2. *make build* command to build the docker images

### 3. *make start* command to run the containers


# Note: this docker environment was design to work with umbrelOS


# symlink example so you can add external packages to the project in docker
```bash
ln -s ~username/projects/laravel-projects/packages/skeleton-admin ~username/projects/laravel-projects/projects/skeleton-admin/project/laravel/packages/
```
