const path = require('path');
const logger = require('./logger');
const fileManager = require('./file-manager');
const config = require('../config/defaults');

/**
 * Docker management operations for Laravel God Mode
 */
class DockerManager {
  constructor() {
    this.projectsPath = config.paths.projects;
  }

  /**
   * Create docker-compose.yml from stub
   */
  async createDockerCompose(projectName, projectConfig) {
    const {
      port,
      dbPort,
      redisPort,
      phpmyadminPort,
      mailhogPort,
      vitePort,
      services,
      phpVersion,
      nodeVersion,
      installBun,
      installPnpm
    } = projectConfig;

    const replacements = {
      PROJECT_NAME: projectName,
      APP_PORT: port || 8000,
      DB_PORT: dbPort || 3306,
      REDIS_PORT: redisPort || 6379,
      PHPMYADMIN_PORT: phpmyadminPort || 8080,
      MAILHOG_PORT: mailhogPort || 8025,
      MAILHOG_SMTP_PORT: (mailhogPort || 8025) + 100,
      VITE_PORT: vitePort || 5173,
      PHP_VERSION: phpVersion || '8.2',
      NODE_VERSION: nodeVersion || '18',
      INSTALL_BUN: installBun ? 'true' : 'false',
      INSTALL_PNPM: installPnpm ? 'true' : 'false'
    };

    // Generate conditional service blocks
    replacements.REDIS_DEPENDS = services && services.includes('redis') ? '\n      - redis' : '';
    replacements.REDIS_SERVICE = this.generateRedisService(projectName, redisPort, services);
    replacements.REDIS_VOLUME = services && services.includes('redis') ? '\n  redis_data:\n    driver: local' : '';
    replacements.PHPMYADMIN_SERVICE = this.generatePhpMyAdminService(projectName, phpmyadminPort, services);
    replacements.MAILHOG_SERVICE = this.generateMailhogService(projectName, mailhogPort, services);

    const content = await fileManager.processStub('docker-compose.yml.stub', replacements);
    const projectPath = fileManager.getProjectPath(projectName);

    await fileManager.writeFile(path.join(projectPath, 'docker-compose.yml'), content);
    logger.success(`Docker Compose created for: ${projectName}`);
  }

  /**
   * Generate Redis service configuration
   */
  generateRedisService(projectName, redisPort, services) {
    if (!services || !services.includes('redis')) return '';

    return `
  redis:
    image: redis:7-alpine
    container_name: ${projectName}_redis
    ports:
      - "${redisPort || 6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - ${projectName}_network
    restart: unless-stopped
    command: redis-server --appendonly yes`;
  }

  /**
   * Generate PHPMyAdmin service configuration
   */
  generatePhpMyAdminService(projectName, phpmyadminPort, services) {
    if (!services || !services.includes('phpmyadmin')) return '';

    return `
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: ${projectName}_phpmyadmin
    ports:
      - "${phpmyadminPort || 8080}:80"
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: password
      MYSQL_ROOT_PASSWORD: password
    depends_on:
      - db
    networks:
      - ${projectName}_network
    restart: unless-stopped`;
  }

  /**
   * Generate Mailhog service configuration
   */
  generateMailhogService(projectName, mailhogPort, services) {
    if (!services || !services.includes('mailhog')) return '';

    return `
  mailhog:
    image: mailhog/mailhog:latest
    container_name: ${projectName}_mailhog
    ports:
      - "${mailhogPort || 8025}:8025"
      - "${(mailhogPort || 8025) + 100}:1025"
    networks:
      - ${projectName}_network
    restart: unless-stopped`;
  }

  /**
   * Create Docker configuration files
   */
  async createDockerFiles(projectName, projectConfig) {
    const projectPath = fileManager.getProjectPath(projectName);
    const dockerPath = path.join(projectPath, 'docker');
    const { phpVersion, nodeVersion, installBun, installPnpm } = projectConfig;

    // Ensure docker directory exists
    await fileManager.runCommand(`mkdir -p ${dockerPath}`);

    // Create Dockerfile
    const dockerfileReplacements = {
      PROJECT_NAME: projectName,
      PHP_VERSION: phpVersion || '8.2',
      NODE_VERSION: nodeVersion || '18',
      INSTALL_BUN: installBun ? 'true' : 'false',
      INSTALL_PNPM: installPnpm ? 'true' : 'false'
    };

    const dockerfile = await fileManager.processStub('Dockerfile.stub', dockerfileReplacements);
    await fileManager.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);

    // Create Nginx config
    const nginxConfig = await fileManager.processStub('nginx.conf.stub', { PROJECT_NAME: projectName });
    await fileManager.writeFile(path.join(dockerPath, 'nginx.conf'), nginxConfig);

    // Create Supervisor config
    const supervisorReplacements = {
      PROJECT_NAME: projectName,
      INSTALL_BUN: installBun ? 'true' : 'false',
      INSTALL_PNPM: installPnpm ? 'true' : 'false'
    };
    const supervisorConfig = await fileManager.processStub('supervisor.conf.stub', supervisorReplacements);
    await fileManager.writeFile(path.join(dockerPath, 'supervisor.conf'), supervisorConfig);

    // Create PHP configuration
    const phpConfig = await fileManager.processStub('php.ini.stub', { PROJECT_NAME: projectName });
    await fileManager.writeFile(path.join(dockerPath, 'php.ini'), phpConfig);

    // Create MySQL configuration
    const mysqlConfig = await fileManager.processStub('mysql.cnf.stub', { PROJECT_NAME: projectName });
    await fileManager.writeFile(path.join(dockerPath, 'mysql.cnf'), mysqlConfig);

    logger.success(`Docker files created for: ${projectName}`);
  }

  /**
   * Start Docker containers
   */
  async startContainers(projectName) {
    const projectPath = fileManager.getProjectPath(projectName);
    logger.info(`Starting containers for: ${projectName}`);

    const result = await fileManager.runCommand('docker-compose up -d', projectPath);

    if (result.success) {
      logger.success(`Containers started for: ${projectName}`);
    } else {
      logger.error(`Failed to start containers for: ${projectName}`, { error: result.stderr });
      throw new Error(`Failed to start containers: ${result.stderr}`);
    }

    return result;
  }

  /**
   * Stop Docker containers
   */
  async stopContainers(projectName) {
    const projectPath = fileManager.getProjectPath(projectName);
    logger.info(`Stopping containers for: ${projectName}`);

    const result = await fileManager.runCommand('docker-compose down', projectPath);

    if (result.success) {
      logger.success(`Containers stopped for: ${projectName}`);
    } else {
      logger.error(`Failed to stop containers for: ${projectName}`, { error: result.stderr });
    }

    return result;
  }

  /**
   * Restart Docker containers
   */
  async restartContainers(projectName) {
    await this.stopContainers(projectName);
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await this.startContainers(projectName);
  }

  /**
   * Get container status
   */
  async getContainerStatus(projectName) {
    const projectPath = fileManager.getProjectPath(projectName);

    const result = await fileManager.runCommand('docker-compose ps --format json', projectPath);

    if (result.success && result.stdout) {
      try {
        const lines = result.stdout.trim().split('\n').filter(line => line.trim());
        const containers = lines.map(line => JSON.parse(line));

        const running = containers.filter(c => c.State === 'running').length;
        const total = containers.length;

        let status = 'stopped';
        if (running === total && total > 0) status = 'running';
        else if (running > 0) status = 'partial';

        return {
          status,
          containers: total,
          running,
          details: containers
        };
      } catch (error) {
        logger.error(`Failed to parse container status for: ${projectName}`, { error: error.message });
      }
    }

    return { status: 'unknown', containers: 0, running: 0, details: [] };
  }

  /**
   * Get container logs
   */
  async getContainerLogs(projectName, service = '', lines = 100) {
    const projectPath = fileManager.getProjectPath(projectName);
    const serviceParam = service ? ` ${service}` : '';

    const result = await fileManager.runCommand(
      `docker-compose logs --tail=${lines}${serviceParam}`,
      projectPath
    );

    return {
      success: result.success,
      logs: result.stdout || result.stderr || 'No logs available',
      error: result.success ? null : result.stderr
    };
  }

  /**
   * Execute command in container
   */
  async execInContainer(projectName, service, command) {
    const projectPath = fileManager.getProjectPath(projectName);

    const result = await fileManager.runCommand(
      `docker-compose exec -T ${service} ${command}`,
      projectPath
    );

    await logger.commandLog(projectName, `${service}: ${command}`, result);
    return result;
  }

  /**
   * Build containers
   */
  async buildContainers(projectName, noCache = false) {
    const projectPath = fileManager.getProjectPath(projectName);
    const cacheFlag = noCache ? ' --no-cache' : '';

    logger.info(`Building containers for: ${projectName}`);

    const result = await fileManager.runCommand(
      `docker-compose build${cacheFlag}`,
      projectPath
    );

    if (result.success) {
      logger.success(`Containers built for: ${projectName}`);
    } else {
      logger.error(`Failed to build containers for: ${projectName}`, { error: result.stderr });
    }

    return result;
  }

  /**
   * Remove containers and volumes
   */
  async removeContainers(projectName, removeVolumes = true) {
    const projectPath = fileManager.getProjectPath(projectName);
    const volumesFlag = removeVolumes ? ' -v' : '';

    logger.info(`Removing containers for: ${projectName}`);

    const result = await fileManager.runCommand(
      `docker-compose down${volumesFlag} --remove-orphans`,
      projectPath
    );

    if (result.success) {
      logger.success(`Containers removed for: ${projectName}`);
    } else {
      logger.error(`Failed to remove containers for: ${projectName}`, { error: result.stderr });
    }

    return result;
  }
}

module.exports = new DockerManager();
