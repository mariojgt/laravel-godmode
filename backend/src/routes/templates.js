const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const TEMPLATES_DIR = path.join(__dirname, '../../../templates');

// Get all available templates
router.get('/', async (req, res) => {
  try {
    const templates = [];
    const templateDirs = await fs.readdir(TEMPLATES_DIR);

    for (const dir of templateDirs) {
      const templatePath = path.join(TEMPLATES_DIR, dir);
      const configPath = path.join(templatePath, 'config.json');

      try {
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        templates.push({
          id: dir,
          ...config
        });
      } catch (error) {
        console.warn(`Invalid template config: ${dir}`);
      }
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// Get specific template
router.get('/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const configPath = path.join(TEMPLATES_DIR, templateId, 'config.json');

    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    res.json({
      id: templateId,
      ...config
    });
  } catch (error) {
    res.status(404).json({ error: 'Template not found' });
  }
});

// Get template stubs
router.get('/:id/stubs', async (req, res) => {
  try {
    const templateId = req.params.id;
    const stubsDir = path.join(TEMPLATES_DIR, templateId, 'stubs');

    const stubs = {};
    const stubFiles = await fs.readdir(stubsDir);

    for (const file of stubFiles) {
      if (file.endsWith('.stub')) {
        const stubPath = path.join(stubsDir, file);
        const content = await fs.readFile(stubPath, 'utf8');
        stubs[file] = content;
      }
    }

    res.json(stubs);
  } catch (error) {
    res.status(404).json({ error: 'Template stubs not found' });
  }
});

module.exports = router;
