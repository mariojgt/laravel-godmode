const express = require('express');
const router = express.Router();
const projectManager = require('../lib/project-manager');
const logger = require('../lib/logger');

/**
 * Project API routes for Laravel God Mode
 */

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = projectManager.getAllProjects();
    res.json(projects);
  } catch (error) {
    logger.error('Failed to get projects', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get specific project
router.get('/:name', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    logger.error(`Failed to get project: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const project = await projectManager.createProject(req.body);
    logger.info(`Project created via API: ${project.name}`);
    res.status(201).json(project);
  } catch (error) {
    logger.error('Failed to create project via API', {
      error: error.message,
      body: req.body
    });
    res.status(400).json({ error: error.message });
  }
});

// Start project
router.post('/:name/start', async (req, res) => {
  try {
    const project = await projectManager.startProject(req.params.name);
    logger.info(`Project started via API: ${req.params.name}`);
    res.json({ success: true, project });
  } catch (error) {
    logger.error(`Failed to start project via API: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Stop project
router.post('/:name/stop', async (req, res) => {
  try {
    const project = await projectManager.stopProject(req.params.name);
    logger.info(`Project stopped via API: ${req.params.name}`);
    res.json({ success: true, project });
  } catch (error) {
    logger.error(`Failed to stop project via API: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Restart project
router.post('/:name/restart', async (req, res) => {
  try {
    await projectManager.stopProject(req.params.name);
    // Wait a bit before starting
    setTimeout(async () => {
      try {
        await projectManager.startProject(req.params.name);
      } catch (error) {
        logger.error(`Failed to restart project (start phase): ${req.params.name}`, { error: error.message });
      }
    }, 3000);

    logger.info(`Project restart initiated via API: ${req.params.name}`);
    res.json({ success: true, message: 'Restart initiated' });
  } catch (error) {
    logger.error(`Failed to restart project via API: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:name', async (req, res) => {
  try {
    await projectManager.deleteProject(req.params.name);
    logger.info(`Project deleted via API: ${req.params.name}`);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to delete project via API: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update project status
router.post('/:name/status', async (req, res) => {
  try {
    const project = await projectManager.updateProjectStatus(req.params.name);
    res.json(project);
  } catch (error) {
    logger.error(`Failed to update project status: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get project environment
router.get('/:name/env', async (req, res) => {
  try {
    const content = await projectManager.getProjectEnv(req.params.name);
    res.json({ content });
  } catch (error) {
    logger.error(`Failed to get project env: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update project environment
router.put('/:name/env', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    await projectManager.updateProjectEnv(req.params.name, content);
    logger.info(`Project env updated via API: ${req.params.name}`);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to update project env: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Execute Artisan command
router.post('/:name/artisan', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await projectManager.executeArtisanCommand(req.params.name, command);

    if (result.success) {
      logger.info(`Artisan command executed via API: ${req.params.name}`, { command });
      res.json({
        success: true,
        output: result.stdout,
        stderr: result.stderr,
        command: `php artisan ${command}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Command failed with exit code ${result.code}`,
        output: result.stdout,
        stderr: result.stderr,
        command: `php artisan ${command}`
      });
    }
  } catch (error) {
    logger.error(`Failed to execute Artisan command: ${req.params.name}`, {
      error: error.message,
      command: req.body.command
    });
    res.status(500).json({ error: error.message });
  }
});

// Get project logs
router.get('/:name/logs', async (req, res) => {
  try {
    const { service = '', lines = 100 } = req.query;
    const result = await projectManager.getProjectLogs(req.params.name, service, parseInt(lines));
    res.json(result);
  } catch (error) {
    logger.error(`Failed to get project logs: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update project ports
router.put('/:name/ports', async (req, res) => {
  try {
    const project = await projectManager.updateProjectPorts(req.params.name, req.body);
    logger.info(`Project ports updated via API: ${req.params.name}`, { ports: req.body });
    res.json(project);
  } catch (error) {
    logger.error(`Failed to update project ports: ${req.params.name}`, {
      error: error.message,
      ports: req.body
    });
    res.status(400).json({ error: error.message });
  }
});

// Discover existing projects
router.post('/discover', async (req, res) => {
  try {
    const discovered = await projectManager.discoverProjects();
    logger.info(`Projects discovered via API: ${discovered}`);
    res.json({ discovered });
  } catch (error) {
    logger.error('Failed to discover projects via API', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
