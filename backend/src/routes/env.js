const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const PROJECTS_FILE = path.join(__dirname, '../../../data/projects.json');

// Load projects
async function loadProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Get .env file content
router.get('/:projectId', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const envPath = path.join(project.path, 'src', '.env');

    try {
      const content = await fs.readFile(envPath, 'utf8');
      res.json({ content });
    } catch (error) {
      res.status(404).json({ error: '.env file not found' });
    }
  } catch (error) {
    console.error('Failed to read .env file:', error);
    res.status(500).json({ error: 'Failed to read .env file' });
  }
});

// Update .env file content
router.put('/:projectId', async (req, res) => {
  try {
    const { content } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const envPath = path.join(project.path, 'src', '.env');
    await fs.writeFile(envPath, content, 'utf8');

    res.json({ message: '.env file updated successfully' });
  } catch (error) {
    console.error('Failed to update .env file:', error);
    res.status(500).json({ error: 'Failed to update .env file' });
  }
});

module.exports = router;
