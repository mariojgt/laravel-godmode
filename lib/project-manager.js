const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const fileManager = require('./file-manager');
const dockerManager = require('./docker-manager');
const config = require('../config/defaults');

/**
 * Core project management for Laravel God Mode
 */
class ProjectManager {
  constructor() {
    this.projects = new Map();
    this.nextPort = config.ports.startPort;
    this.dataFile = path.join(config.paths.data, 'projects.json');
    this.init();
  }

  async init() {
    // Create data directory
    await fs.mkdir(config.paths.data, { recursive: true });

    // Load existing projects
    await this.loadProjects();

    // Update next port based on existing projects
    this.updateNextPort();
  }

  /**
   * Load projects from storage
   */
  async loadProjects() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const projectsArray = JSON.parse(data);

      this.projects.clear();
      projectsArray.forEach(project => {
        this.projects.set(project.name, project);
      });

      logger.success(`Loaded ${this.projects.size} projects from storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No existing projects file found, starting fresh');
      } else {
        logger.error('Failed to load projects', { error: error.message });
      }
    }
  }

  /**
   * Save projects to storage
   */
  async saveProjects() {
    try {
      const projectsArray = Array.from(this.projects.values());
      await fs.writeFile(this.dataFile, JSON.stringify(projectsArray, null, 2));
      logger.debug('Projects saved to storage');
    } catch (error) {
      logger.error('Failed to save projects', { error: error.message });
    }
  }

  /**
   * Update next available port
   */
  updateNextPort() {
    const ports = Array.from(this.projects.values()).map(p => p.port);
    if (ports.length > 0) {
      this.nextPort = Math.max(...ports, this.nextPort) + 1;
    }
  }

  /**
   * Get next available ports for services
   */
  getNextPorts(services = []) {
    const usedPorts = this.getAllUsedPorts();

    const findNextPort = (startPort) => {
      let port = startPort;
      while (usedPorts.includes(port)) {
        port++;
      }
      usedPorts.push(port);
      return port;
    };

    const ports = {
      port: findNextPort(this.nextPort),
      dbPort: findNextPort(config.ports.mysql),
      vitePort: findNextPort(config.ports.vite)
    };

    if (services.includes('redis')) {
      ports.redisPort = findNextPort(config.ports.redis);
    }

    if (services.includes('phpmyadmin')) {
      ports.phpmyadminPort = findNextPort(config.ports.phpmyadmin);
    }

    if (services.includes('mailhog')) {
      ports.mailhogPort = findNextPort(config.ports.mailhog);
    }

    this.nextPort = ports.port + 1;
    return ports;
  }

  /**
   * Get all used ports across all projects
   */
  getAllUsedPorts() {
    const allPorts = [];

    this.projects.forEach(project => {
      allPorts.push(
        project.port,
        project.dbPort,
        project.vitePort
      );

      if (project.redisPort) allPorts.push(project.redisPort);
      if (project.phpmyadminPort) allPorts.push(project.phpmyadminPort);
      if (project.mailhogPort) allPorts.push(project.mailhogPort);
    });

    return allPorts.filter(Boolean);
  }

  /**
   * Create new Laravel project
   */
  async createProject(projectData) {
    const {
      name,
      services = config.project.services,
      phpVersion = config.project.phpVersion,
      nodeVersion = config.project.nodeVersion,
      installBun = config.project.installBun,
      installPnpm = config.project.installPnpm,
      customPorts = {}
    } = projectData;

    // Validate project name
    const validation = fileManager.validateProjectName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if project already exists
    if (this.projects.has(name)) {
      throw new Error(`Project "${name}" already exists`);
    }

    // Get ports
    const autoPorts = this.getNextPorts(services);
    const ports = { ...autoPorts, ...customPorts };

    logger.info(`Creating project: ${name}`);

    try {
      // Create project structure
      const { projectPath, srcPath, dockerPath } = await fileManager.createProjectStructure(name);

      // Create Laravel project
      await fileManager.createLaravelProject(name, srcPath);

      // Project configuration
      const projectConfig = {
        name,
        ...ports,
        services,
        phpVersion,
        nodeVersion,
        installBun,
        installPnpm,
        path: projectPath,
        srcPath,
        dockerPath,
        status: 'stopped',
        created: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      // Create Docker files
      await dockerManager.createDockerCompose(name, projectConfig);
      await dockerManager.createDockerFiles(name, projectConfig);

      // Create project Makefile
      await this.createProjectMakefile(name, projectConfig);

      // Create Laravel .env file
      await this.createLaravelEnv(name, projectConfig);

      // Update Vite config for Docker
      await this.updateViteConfig(name);

      // Store project
      this.projects.set(name, projectConfig);
      await this.saveProjects();

      logger.success(`Project created successfully: ${name}`);
      return projectConfig;

    } catch (error) {
      // Cleanup on failure
      try {
        await fileManager.deleteProject(name);
      } catch (cleanupError) {
        logger.error(`Failed to cleanup after creation failure: ${name}`, { error: cleanupError.message });
      }

      logger.error(`Failed to create project: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Create Laravel .env file
   */
  async createLaravelEnv(projectName, projectConfig) {
    const { services, port } = projectConfig;

    const envReplacements = {
      PROJECT_NAME: projectName,
      APP_KEY: `base64:${Buffer.from(projectName + Date.now()).toString('base64')}`,
      APP_PORT: port,
      CACHE_DRIVER: services.includes('redis') ? 'redis' : 'file',
      QUEUE_CONNECTION: services.includes('redis') ? 'redis' : 'sync',
      SESSION_DRIVER: services.includes('redis') ? 'redis' : 'file',
      REDIS_CONFIG: services.includes('redis') ? `REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379` : '',
      MAIL_CONFIG: services.includes('mailhog') ? `MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@${projectName}.local"
MAIL_FROM_NAME="${projectName}"` : ''
    };

    const envContent = await fileManager.processStub('.env.stub', envReplacements);
    const envPath = path.join(fileManager.getProjectSrcPath(projectName), '.env');

    await fileManager.writeFile(envPath, envContent);
    logger.success(`Laravel .env created for: ${projectName}`);
  }

  /**
   * Update Vite configuration for Docker
   */
  async updateViteConfig(projectName) {
    const viteConfigContent = `import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
});
`;

    const viteConfigPath = path.join(fileManager.getProjectSrcPath(projectName), 'vite.config.js');
    await fileManager.writeFile(viteConfigPath, viteConfigContent);
    logger.success(`Vite config updated for: ${projectName}`);
  }

  /**
   * Create project Makefile
   */
  async createProjectMakefile(projectName, projectConfig) {
    const { services, installBun, installPnpm } = projectConfig;

    let servicesInfo = `🌐 App: http://localhost:${projectConfig.port}\\n📊 MySQL: localhost:${projectConfig.dbPort}`;

    if (services.includes('redis')) {
      servicesInfo += `\\n🔴 Redis: localhost:${projectConfig.redisPort}`;
    }
    if (services.includes('phpmyadmin')) {
      servicesInfo += `\\n🗄️ PHPMyAdmin: http://localhost:${projectConfig.phpmyadminPort}`;
    }
    if (services.includes('mailhog')) {
      servicesInfo += `\\n📧 Mailhog: http://localhost:${projectConfig.mailhogPort}`;
    }
    servicesInfo += `\\n⚡ Vite: http://localhost:${projectConfig.vitePort}`;

    const replacements = {
      PROJECT_NAME: projectName,
      ...projectConfig,
      HAS_REDIS: services.includes('redis') ? 'true' : 'false',
      HAS_PHPMYADMIN: services.includes('phpmyadmin') ? 'true' : 'false',
      HAS_MAILHOG: services.includes('mailhog') ? 'true' : 'false',
      HAS_BUN: installBun ? 'true' : 'false',
      HAS_PNPM: installPnpm ? 'true' : 'false',
      SERVICES_INFO: servicesInfo
    };

    const makefileContent = await fileManager.processStub('project-Makefile.stub', replacements);
    const makefilePath = path.join(fileManager.getProjectPath(projectName), 'Makefile');

    await fileManager.writeFile(makefilePath, makefileContent);
    logger.success(`Makefile created for: ${projectName}`);
  }

  /**
   * Start project containers
   */
  async startProject(projectName) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    project.status = 'starting';
    project.lastActivity = new Date().toISOString();
    await this.saveProjects();

    try {
      await dockerManager.startContainers(projectName);

      project.status = 'running';
      await this.saveProjects();

      logger.success(`Project started: ${projectName}`);
      return project;
    } catch (error) {
      project.status = 'error';
      project.error = error.message;
      await this.saveProjects();
      throw error;
    }
  }

  /**
   * Stop project containers
   */
  async stopProject(projectName) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    project.status = 'stopping';
    project.lastActivity = new Date().toISOString();
    await this.saveProjects();

    try {
      await dockerManager.stopContainers(projectName);

      project.status = 'stopped';
      delete project.error;
      await this.saveProjects();

      logger.success(`Project stopped: ${projectName}`);
      return project;
    } catch (error) {
      project.status = 'error';
      project.error = error.message;
      await this.saveProjects();
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectName) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    try {
      // Stop and remove containers
      await dockerManager.removeContainers(projectName, true);

      // Delete project files
      await fileManager.deleteProject(projectName);

      // Remove from projects
      this.projects.delete(projectName);
      await this.saveProjects();

      logger.success(`Project deleted: ${projectName}`);
    } catch (error) {
      logger.error(`Failed to delete project: ${projectName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get project by name
   */
  getProject(projectName) {
    return this.projects.get(projectName);
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Update project status from Docker
   */
  async updateProjectStatus(projectName) {
    const project = this.projects.get(projectName);
    if (!project) return;

    try {
      const containerStatus = await dockerManager.getContainerStatus(projectName);
      project.status = containerStatus.status;
      project.containers = containerStatus.containers;
      project.runningContainers = containerStatus.running;
      project.lastChecked = new Date().toISOString();

      await this.saveProjects();
      return project;
    } catch (error) {
      logger.error(`Failed to update status for: ${projectName}`, { error: error.message });
      return project;
    }
  }

  /**
   * Execute Artisan command
   */
  async executeArtisanCommand(projectName, command) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    logger.info(`Executing Artisan command for ${projectName}: ${command}`);

    const result = await dockerManager.execInContainer(projectName, 'app', `php artisan ${command}`);

    // Update last activity
    project.lastActivity = new Date().toISOString();
    await this.saveProjects();

    return result;
  }

  /**
   * Get project .env content
   */
  async getProjectEnv(projectName) {
    const envPath = path.join(fileManager.getProjectSrcPath(projectName), '.env');
    return await fileManager.readFile(envPath);
  }

  /**
   * Update project .env content
   */
  async updateProjectEnv(projectName, content) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    const envPath = path.join(fileManager.getProjectSrcPath(projectName), '.env');
    await fileManager.writeFile(envPath, content);

    // Update last activity
    project.lastActivity = new Date().toISOString();
    await this.saveProjects();

    logger.success(`Environment updated for: ${projectName}`);
  }

  /**
   * Get project logs
   */
  async getProjectLogs(projectName, service = '', lines = 100) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    return await dockerManager.getContainerLogs(projectName, service, lines);
  }

  /**
   * Update project ports
   */
  async updateProjectPorts(projectName, newPorts) {
    const project = this.projects.get(projectName);
    if (!project) {
      throw new Error(`Project not found: ${projectName}`);
    }

    // Validate ports are not in use by other projects
    const usedPorts = this.getAllUsedPorts().filter(port =>
      !Object.values(project).includes(port) // Exclude current project's ports
    );

    for (const [key, port] of Object.entries(newPorts)) {
      if (usedPorts.includes(port)) {
        throw new Error(`Port ${port} is already in use by another project`);
      }
    }

    // Update project configuration
    Object.assign(project, newPorts);
    project.lastActivity = new Date().toISOString();

    // Regenerate Docker Compose with new ports
    await dockerManager.createDockerCompose(projectName, project);

    await this.saveProjects();
    logger.success(`Ports updated for: ${projectName}`);

    return project;
  }

  /**
   * Discover existing projects
   */
  async discoverProjects() {
    const existingDirs = await fileManager.listProjects();
    let discovered = 0;

    for (const dirName of existingDirs) {
      if (!this.projects.has(dirName)) {
        const projectPath = fileManager.getProjectPath(dirName);
        const dockerComposePath = path.join(projectPath, 'docker-compose.yml');

        try {
          // Check if it looks like a Laravel God Mode project
          await fs.access(dockerComposePath);

          // Create basic project entry
          const project = {
            name: dirName,
            path: projectPath,
            srcPath: path.join(projectPath, 'src'),
            status: 'stopped',
            discovered: true,
            created: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            // Default values - will be updated when containers are inspected
            port: this.nextPort++,
            dbPort: 3306,
            vitePort: 5173,
            services: ['mysql', 'nginx'],
            phpVersion: '8.2',
            nodeVersion: '18'
          };

          this.projects.set(dirName, project);
          discovered++;

          // Try to update status from Docker
          await this.updateProjectStatus(dirName);

        } catch (error) {
          logger.debug(`Skipping directory ${dirName}: not a valid project`);
        }
      }
    }

    if (discovered > 0) {
      await this.saveProjects();
      logger.success(`Discovered ${discovered} existing projects`);
    }

    return discovered;
  }
}

module.exports = new ProjectManager();
