const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const logger = require('./logger');
const config = require('../config/defaults');

/**
 * File management operations for Laravel God Mode
 */
class FileManager {
  constructor() {
    this.projectsPath = config.paths.projects;
    this.stubsPath = config.paths.stubs;
  }

  /**
   * Execute shell command with promise
   */
  runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve) => {
      logger.debug(`Executing: ${command}`, { cwd });

      exec(command, { cwd }, (error, stdout, stderr) => {
        const result = {
          success: !error,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command,
          cwd
        };

        if (error) {
          result.error = error.message;
          result.code = error.code;
          logger.error(`Command failed: ${command}`, result);
        } else {
          logger.debug(`Command succeeded: ${command}`);
        }

        resolve(result);
      });
    });
  }

  /**
   * Process stub file with replacements
   */
  async processStub(stubName, replacements = {}) {
    const stubPath = path.join(this.stubsPath, stubName);

    try {
      let content = await fs.readFile(stubPath, 'utf8');

      // Replace placeholders
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value || '');
      }

      return content;
    } catch (error) {
      logger.error(`Failed to process stub: ${stubName}`, { error: error.message });
      throw new Error(`Stub file not found: ${stubName}`);
    }
  }

  /**
   * Create project directory structure
   */
  async createProjectStructure(projectName) {
    const projectPath = path.join(this.projectsPath, projectName);
    const srcPath = path.join(projectPath, 'src');
    const dockerPath = path.join(projectPath, 'docker');

    try {
      await fs.mkdir(projectPath, { recursive: true });
      await fs.mkdir(srcPath, { recursive: true });
      await fs.mkdir(dockerPath, { recursive: true });

      logger.success(`Created project structure for: ${projectName}`);
      return { projectPath, srcPath, dockerPath };
    } catch (error) {
      logger.error(`Failed to create project structure: ${projectName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Create Laravel project using Composer
   */
  async createLaravelProject(projectName, srcPath) {
    logger.info(`Creating Laravel project: ${projectName}`);

    const result = await this.runCommand(
      'composer create-project laravel/laravel . --prefer-dist --no-dev',
      srcPath
    );

    if (!result.success) {
      throw new Error(`Failed to create Laravel project: ${result.stderr || result.error}`);
    }

    logger.success(`Laravel project created: ${projectName}`);
    return result;
  }

  /**
   * Write file with error handling
   */
  async writeFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      logger.debug(`File written: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Read file with error handling
   */
  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      logger.debug(`File read: ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Delete project directory
   */
  async deleteProject(projectName) {
    const projectPath = path.join(this.projectsPath, projectName);

    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      logger.success(`Project deleted: ${projectName}`);
    } catch (error) {
      logger.error(`Failed to delete project: ${projectName}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Check if project exists
   */
  async projectExists(projectName) {
    const projectPath = path.join(this.projectsPath, projectName);
    try {
      await fs.access(projectPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get project path
   */
  getProjectPath(projectName) {
    return path.join(this.projectsPath, projectName);
  }

  /**
   * Get project source path
   */
  getProjectSrcPath(projectName) {
    return path.join(this.projectsPath, projectName, 'src');
  }

  /**
   * List all projects
   */
  async listProjects() {
    try {
      const entries = await fs.readdir(this.projectsPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      logger.error('Failed to list projects', { error: error.message });
      return [];
    }
  }

  /**
   * Validate project name
   */
  validateProjectName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Project name is required' };
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      return { valid: false, error: 'Project name can only contain lowercase letters, numbers, and hyphens' };
    }

    if (name.length < 2 || name.length > 50) {
      return { valid: false, error: 'Project name must be between 2 and 50 characters' };
    }

    return { valid: true };
  }

  /**
   * Backup project
   */
  async backupProject(projectName) {
    const projectPath = this.getProjectPath(projectName);
    const backupPath = path.join(config.paths.data, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `${projectName}-${timestamp}.tar.gz`);

    try {
      await fs.mkdir(backupPath, { recursive: true });

      const result = await this.runCommand(
        `tar -czf "${backupFile}" -C "${path.dirname(projectPath)}" "${projectName}"`
      );

      if (result.success) {
        logger.success(`Project backed up: ${projectName} -> ${backupFile}`);
        return backupFile;
      } else {
        throw new Error(result.stderr);
      }
    } catch (error) {
      logger.error(`Failed to backup project: ${projectName}`, { error: error.message });
      throw error;
    }
  }
}

module.exports = new FileManager();
