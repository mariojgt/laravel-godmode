const express = require('express');
const { spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const terminals = new Map();
const execAsync = promisify(require('child_process').exec);

// Load projects to get project paths
async function loadProjects() {
  try {
    const PROJECTS_FILE = path.join(__dirname, '../../../data/projects.json');
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Create terminal session
router.post('/create', async (req, res) => {
  try {
    const { projectId, cwd } = req.body;

    // Get project info
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Use docker exec to create terminal in running container
    const containerName = `${project.name}_app`;

    // Check if container is running
    try {
      await execAsync(`docker inspect -f '{{.State.Status}}' ${containerName}`);
    } catch (error) {
      return res.status(400).json({ error: 'Container is not running. Please start the project first.' });
    }

    const sessionId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store terminal session info
    terminals.set(sessionId, {
      projectId,
      containerName,
      createdAt: new Date(),
      isActive: true
    });

    // Clean up after 1 hour of inactivity
    setTimeout(() => {
      if (terminals.has(sessionId)) {
        terminals.delete(sessionId);
      }
    }, 3600000);

    res.json({ sessionId, containerName });
  } catch (error) {
    console.error('Failed to create terminal session:', error);
    res.status(500).json({ error: 'Failed to create terminal session' });
  }
});

// Execute command in container
router.post('/:sessionId/exec', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;

    const session = terminals.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    try {
      const { stdout, stderr } = await execAsync(
        `docker exec ${session.containerName} bash -c "${command.replace(/"/g, '\\"')}"`,
        { timeout: 30000 }
      );

      res.json({
        output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
        success: true
      });
    } catch (error) {
      res.json({
        output: `Error: ${error.message}`,
        success: false
      });
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// Send command to terminal (legacy support)
router.post('/:sessionId/input', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { input } = req.body;

    const session = terminals.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    // Remove newline and execute command
    const command = input.replace(/\n$/, '');

    try {
      const { stdout, stderr } = await execAsync(
        `docker exec ${session.containerName} bash -c "${command.replace(/"/g, '\\"')}"`,
        { timeout: 30000 }
      );

      res.json({
        output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
        success: true
      });
    } catch (error) {
      res.json({
        output: `Error: ${error.message}`,
        success: false
      });
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to send input to terminal' });
  }
});

// Resize terminal (not needed for docker exec, but keeping for compatibility)
router.post('/:sessionId/resize', (req, res) => {
  const { sessionId } = req.params;
  const session = terminals.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Terminal session not found' });
  }

  res.json({ success: true });
});

// Kill terminal session
router.delete('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = terminals.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    terminals.delete(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to kill terminal session' });
  }
});

module.exports = router;
