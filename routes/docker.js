const express = require('express');
const router = express.Router();
const dockerManager = require('../lib/docker-manager');
const projectManager = require('../lib/project-manager');
const logger = require('../lib/logger');

/**
 * Docker management API routes for Laravel God Mode
 */

// Get container status for project
router.get('/:name/status', async (req, res) => {
  try {
    const status = await dockerManager.getContainerStatus(req.params.name);
    res.json(status);
  } catch (error) {
    logger.error(`Failed to get container status: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Build containers for project
router.post('/:name/build', async (req, res) => {
  try {
    const { noCache = false } = req.body;
    const result = await dockerManager.buildContainers(req.params.name, noCache);

    if (result.success) {
      logger.info(`Containers built via API: ${req.params.name}`);
      res.json({ success: true, output: result.stdout });
    } else {
      res.status(400).json({
        success: false,
        error: 'Build failed',
        output: result.stderr
      });
    }
  } catch (error) {
    logger.error(`Failed to build containers: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Execute command in container
router.post('/:name/exec', async (req, res) => {
  try {
    const { service, command } = req.body;

    if (!service || !command) {
      return res.status(400).json({ error: 'Service and command are required' });
    }

    const result = await dockerManager.execInContainer(req.params.name, service, command);

    logger.info(`Command executed in container via API: ${req.params.name}`, {
      service,
      command
    });

    res.json({
      success: result.success,
      output: result.stdout,
      stderr: result.stderr,
      command: `${service}: ${command}`
    });
  } catch (error) {
    logger.error(`Failed to execute command in container: ${req.params.name}`, {
      error: error.message,
      service: req.body.service,
      command: req.body.command
    });
    res.status(500).json({ error: error.message });
  }
});

// Get container logs
router.get('/:name/logs/:service?', async (req, res) => {
  try {
    const { service = '' } = req.params;
    const { lines = 100 } = req.query;

    const result = await dockerManager.getContainerLogs(
      req.params.name,
      service,
      parseInt(lines)
    );

    res.json(result);
  } catch (error) {
    logger.error(`Failed to get container logs: ${req.params.name}`, {
      error: error.message,
      service: req.params.service
    });
    res.status(500).json({ error: error.message });
  }
});

// Remove containers and volumes
router.delete('/:name', async (req, res) => {
  try {
    const { removeVolumes = true } = req.query;
    const result = await dockerManager.removeContainers(
      req.params.name,
      removeVolumes === 'true'
    );

    if (result.success) {
      logger.info(`Containers removed via API: ${req.params.name}`);
      res.json({ success: true, output: result.stdout });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to remove containers',
        output: result.stderr
      });
    }
  } catch (error) {
    logger.error(`Failed to remove containers: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Rebuild containers (build + restart)
router.post('/:name/rebuild', async (req, res) => {
  try {
    const { noCache = false } = req.body;

    // Stop containers first
    await dockerManager.stopContainers(req.params.name);

    // Build with optional no-cache
    const buildResult = await dockerManager.buildContainers(req.params.name, noCache);

    if (!buildResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Build failed',
        output: buildResult.stderr
      });
    }

    // Start containers
    await dockerManager.startContainers(req.params.name);

    logger.info(`Containers rebuilt via API: ${req.params.name}`);
    res.json({
      success: true,
      message: 'Containers rebuilt and restarted',
      buildOutput: buildResult.stdout
    });

  } catch (error) {
    logger.error(`Failed to rebuild containers: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get Docker Compose configuration
router.get('/:name/compose', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const fs = require('fs').promises;
    const path = require('path');
    const composePath = path.join(project.path, 'docker-compose.yml');

    const content = await fs.readFile(composePath, 'utf8');
    res.json({ content });

  } catch (error) {
    logger.error(`Failed to get Docker Compose: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update Docker Compose configuration
router.put('/:name/compose', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const fs = require('fs').promises;
    const path = require('path');
    const composePath = path.join(project.path, 'docker-compose.yml');

    await fs.writeFile(composePath, content, 'utf8');

    logger.info(`Docker Compose updated via API: ${req.params.name}`);
    res.json({ success: true });

  } catch (error) {
    logger.error(`Failed to update Docker Compose: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
