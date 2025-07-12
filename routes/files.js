const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const projectManager = require('../lib/project-manager');
const fileManager = require('../lib/file-manager');
const logger = require('../lib/logger');

/**
 * File management API routes for Laravel God Mode
 */

// Get file content
router.get('/:name/file/*', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filePath = req.params[0]; // Everything after /file/
    const fullPath = path.join(project.srcPath, filePath);

    // Security check - ensure path is within project directory
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ content, path: filePath });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      logger.error(`Failed to read file: ${req.params.name}/${req.params[0]}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
});

// Update file content
router.put('/:name/file/*', async (req, res) => {
  try {
    const { content } = req.body;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filePath = req.params[0];
    const fullPath = path.join(project.srcPath, filePath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.writeFile(fullPath, content, 'utf8');

    logger.info(`File updated via API: ${req.params.name}/${filePath}`);
    res.json({ success: true });

  } catch (error) {
    logger.error(`Failed to update file: ${req.params.name}/${req.params[0]}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// List directory contents
router.get('/:name/directory/*?', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const dirPath = req.params[0] || '';
    const fullPath = path.join(project.srcPath, dirPath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name)
    }));

    res.json({ files, currentPath: dirPath });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Directory not found' });
    } else {
      logger.error(`Failed to list directory: ${req.params.name}/${req.params[0] || ''}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
});

// Create new file
router.post('/:name/file/*', async (req, res) => {
  try {
    const { content = '' } = req.body;

    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filePath = req.params[0];
    const fullPath = path.join(project.srcPath, filePath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file already exists
    try {
      await fs.access(fullPath);
      return res.status(409).json({ error: 'File already exists' });
    } catch (error) {
      // File doesn't exist, which is what we want
    }

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    await fs.writeFile(fullPath, content, 'utf8');

    logger.info(`File created via API: ${req.params.name}/${filePath}`);
    res.status(201).json({ success: true, path: filePath });

  } catch (error) {
    logger.error(`Failed to create file: ${req.params.name}/${req.params[0]}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:name/file/*', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filePath = req.params[0];
    const fullPath = path.join(project.srcPath, filePath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent deletion of critical files
    const criticalFiles = ['.env', 'composer.json', 'package.json', 'artisan'];
    if (criticalFiles.includes(path.basename(filePath))) {
      return res.status(403).json({ error: 'Cannot delete critical file' });
    }

    await fs.unlink(fullPath);

    logger.info(`File deleted via API: ${req.params.name}/${filePath}`);
    res.json({ success: true });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      logger.error(`Failed to delete file: ${req.params.name}/${req.params[0]}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
});

// Create directory
router.post('/:name/directory/*', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const dirPath = req.params[0];
    const fullPath = path.join(project.srcPath, dirPath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.mkdir(fullPath, { recursive: true });

    logger.info(`Directory created via API: ${req.params.name}/${dirPath}`);
    res.status(201).json({ success: true, path: dirPath });

  } catch (error) {
    logger.error(`Failed to create directory: ${req.params.name}/${req.params[0]}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete directory
router.delete('/:name/directory/*', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const dirPath = req.params[0];
    const fullPath = path.join(project.srcPath, dirPath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent deletion of critical directories
    const criticalDirs = ['app', 'config', 'database', 'routes', 'vendor'];
    if (criticalDirs.includes(path.basename(dirPath))) {
      return res.status(403).json({ error: 'Cannot delete critical directory' });
    }

    await fs.rmdir(fullPath, { recursive: true });

    logger.info(`Directory deleted via API: ${req.params.name}/${dirPath}`);
    res.json({ success: true });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Directory not found' });
    } else {
      logger.error(`Failed to delete directory: ${req.params.name}/${req.params[0]}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
});

// Get project backup
router.post('/:name/backup', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const backupFile = await fileManager.backupProject(req.params.name);

    logger.info(`Project backup created via API: ${req.params.name}`);
    res.json({
      success: true,
      backupFile: path.basename(backupFile),
      path: backupFile
    });

  } catch (error) {
    logger.error(`Failed to backup project: ${req.params.name}`, { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get file stats (size, modified date, etc.)
router.get('/:name/stats/*', async (req, res) => {
  try {
    const project = projectManager.getProject(req.params.name);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filePath = req.params[0];
    const fullPath = path.join(project.srcPath, filePath);

    // Security check
    if (!fullPath.startsWith(project.srcPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(fullPath);

    res.json({
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      modified: stats.mtime,
      created: stats.birthtime,
      permissions: '0' + (stats.mode & parseInt('777', 8)).toString(8)
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      logger.error(`Failed to get file stats: ${req.params.name}/${req.params[0]}`, { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
