const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const multer = require('multer');
const execAsync = promisify(exec);

const router = express.Router();

const PROJECTS_FILE = path.join(__dirname, '../../../data/projects.json');
const PROJECTS_DIR = path.join(__dirname, '../../../projects');
const TEMPLATES_DIR = path.join(__dirname, '../../../templates');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.access(PROJECTS_DIR);
  } catch {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
  }

  try {
    await fs.access(path.dirname(PROJECTS_FILE));
  } catch {
    await fs.mkdir(path.dirname(PROJECTS_FILE), { recursive: true });
    await fs.writeFile(PROJECTS_FILE, '[]');
  }
}

// Load projects
async function loadProjects() {
  await ensureDirectories();
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save projects
async function saveProjects(projects) {
  await ensureDirectories();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await loadProjects();

    // Update project statuses by checking if containers are running
    for (const project of projects) {
      project.status = await getProjectStatus(project);
    }

    await saveProjects(projects);
    res.json(projects);
  } catch (error) {
    console.error('Failed to load projects:', error);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// Check port availability - MUST be before /:id routes
router.post('/check-ports', async (req, res) => {
  try {
    const { ports, excludeProjectId } = req.body;
    const projects = await loadProjects();

    const conflicts = [];

    for (const [serviceName, port] of Object.entries(ports)) {
      // Check if port is in use by other projects
      const conflictingProject = projects.find(p =>
        p.id !== excludeProjectId &&
        p.ports &&
        Object.values(p.ports).includes(parseInt(port))
      );

      if (conflictingProject) {
        conflicts.push({
          service: serviceName,
          port: port,
          conflictingProject: conflictingProject.name
        });
      }

      // Check if port is in use by system
      try {
        await execAsync(`lsof -i :${port}`, { timeout: 2000 });
        conflicts.push({
          service: serviceName,
          port: port,
          conflictingProject: 'System/Other Process'
        });
      } catch (error) {
        // Port is free (lsof returns non-zero when no process uses the port)
      }
    }

    res.json({
      available: conflicts.length === 0,
      conflicts
    });
  } catch (error) {
    console.error('Failed to check ports:', error);
    res.status(500).json({ error: 'Failed to check port availability' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, template, config } = req.body;

    if (!name || !template) {
      return res.status(400).json({ error: 'Name and template are required' });
    }

    // Validate project name
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: 'Project name can only contain letters, numbers, hyphens, and underscores' });
    }

    const projects = await loadProjects();

    // Check if project name already exists
    if (projects.find(p => p.name === name)) {
      return res.status(400).json({ error: 'Project name already exists' });
    }

    const project = {
      id: uuidv4(),
      name,
      template,
      config: config || {},
      status: 'creating',
      createdAt: new Date().toISOString(),
      ports: config?.ports || {},
      path: path.join(PROJECTS_DIR, name)
    };

    projects.push(project);
    await saveProjects(projects);

    // Start project creation process (don't await - run in background)
    createProjectAsync(project);

    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status
    project.status = await getProjectStatus(project);
    await saveProjects(projects);

    res.json(project);
  } catch (error) {
    console.error('Failed to load project:', error);
    res.status(500).json({ error: 'Failed to load project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const projectIndex = projects.findIndex(p => p.id === req.params.id);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[projectIndex];

    // Update project data
    projects[projectIndex] = { ...project, ...req.body, updatedAt: new Date().toISOString() };

    // If regenerateDocker flag is set and ports changed, regenerate Docker configs
    // if (req.body.regenerateDocker && req.body.ports) {
      try {
        console.log(`🔄 Regenerating Docker configuration for project: ${project.name}`);

        // Load template configuration
        const templateConfigPath = path.join(TEMPLATES_DIR, project.template, 'config.json');
        const templateConfig = JSON.parse(await fs.readFile(templateConfigPath, 'utf8'));

        // Update project with new ports
        projects[projectIndex].ports = req.body.ports;

        // Regenerate docker-compose.yml with new ports
        await regenerateDockerCompose(projects[projectIndex], templateConfig);

        console.log(`✅ Docker configuration regenerated for: ${project.name}`);
      } catch (error) {
        console.error('Failed to regenerate Docker config:', error);
        // Return error instead of continuing - this is important for port changes
        return res.status(500).json({ error: 'Failed to regenerate Docker configuration: ' + error.message });
      }
    // }

    await saveProjects(projects);

    // Broadcast update to all clients
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(req.params.id, projects[projectIndex]);

    res.json(projects[projectIndex]);
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});
router.get('/:id/env', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const envPath = path.join(project.path, 'src', '.env');

    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      res.json({ content: envContent });
    } catch (error) {
      res.status(404).json({ error: '.env file not found' });
    }
  } catch (error) {
    console.error('Failed to load .env file:', error);
    res.status(500).json({ error: 'Failed to load .env file' });
  }
});

// Update project .env file
router.put('/:id/env', async (req, res) => {
  try {
    const { content } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

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

// Start project
router.post('/:id/start', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status immediately and broadcast
    project.status = 'starting';
    project.progress = 'Starting containers...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, project);

    // Start project asynchronously with real make command
    startProjectAsync(project);

    res.json({
      success: true,
      message: 'Project start initiated',
      operationId: `start-${project.id}`
    });
  } catch (error) {
    console.error('Failed to start project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start project: ' + error.message
    });
  }
});

// Stop project
router.post('/:id/stop', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status immediately and broadcast
    project.status = 'stopping';
    project.progress = 'Stopping containers...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, project);

    // Stop project asynchronously with real make command
    stopProjectAsync(project);

    res.json({
      success: true,
      message: 'Project stop initiated',
      operationId: `stop-${project.id}`
    });
  } catch (error) {
    console.error('Failed to stop project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop project: ' + error.message
    });
  }
});

// Rebuild project
router.post('/:id/rebuild', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update status immediately and broadcast
    project.status = 'rebuilding';
    project.progress = 'Rebuilding containers...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, project);

    // Rebuild project asynchronously with real make command
    rebuildProjectAsync(project);

    res.json({
      success: true,
      message: 'Project rebuild initiated',
      operationId: `rebuild-${project.id}`
    });
  } catch (error) {
    console.error('Failed to rebuild project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild project: ' + error.message
    });
  }
});
router.get('/:id/logs/:container?', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const container = req.params.container || 'app';
    const containerName = `${project.name}_${container}`;

    try {
      // Get logs from docker
      const { stdout } = await execAsync(`docker logs --tail=200 ${containerName}`, {
        cwd: project.path,
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      res.json({ logs: stdout || 'No logs available' });
    } catch (error) {
      res.json({ logs: `Container logs not available: ${error.message}` });
    }
  } catch (error) {
    console.error('Failed to get logs:', error);
    res.status(500).json({ error: 'Failed to get container logs' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const projects = await loadProjects();
    const projectIndex = projects.findIndex(p => p.id === req.params.id);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[projectIndex];

    // Stop containers first
    try {
      await stopProject(project);
    } catch (error) {
      console.warn('Failed to stop project containers:', error.message);
    }

    // Remove project directory
    try {
      await fs.rm(project.path, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to remove project directory:', error.message);
    }

    projects.splice(projectIndex, 1);
    await saveProjects(projects);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Open project in any editor
router.post('/:id/open-editor', async (req, res) => {
  try {
    const { editor = 'vscode' } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { spawn } = require('child_process');

    // Map editor commands
    const editorCommands = {
      vscode: 'code',
      webstorm: 'webstorm',
      phpstorm: 'phpstorm',
      sublime: 'subl',
      atom: 'atom',
      cursor: 'cursor'
    };

    const command = editorCommands[editor] || editor;

    try {
      console.log(`🚀 Opening ${project.name} in ${editor}...`);

      // Try to open with the specified editor
      const child = spawn(command, [project.path], {
        detached: true,
        stdio: 'ignore'
      });

      child.unref();

      res.json({
        message: `Opening ${project.name} in ${editor}`,
        projectPath: project.path,
        editor
      });

    } catch (error) {
      // Editor not found or failed
      res.status(500).json({
        error: `Failed to open ${editor}`,
        projectPath: project.path,
        suggestion: `Try running: ${command} "${project.path}"`,
        editor
      });
    }

  } catch (error) {
    console.error('Failed to open project in editor:', error);
    res.status(500).json({ error: 'Failed to open project in editor' });
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import SQL file to project database
router.post('/:id/import-sql', upload.single('sqlFile'), async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No SQL file provided' });
    }

    const sqlFilePath = req.file.path;
    const sqlbackDir = path.join(project.path, 'sqlback');

    try {
      console.log(`📥 Importing SQL file to ${project.name} database...`);

      // Create sqlback directory if it doesn't exist
      await fs.mkdir(sqlbackDir, { recursive: true });

      // Move the uploaded file to the sqlback directory with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const targetPath = path.join(sqlbackDir, `uploaded_${timestamp}_${req.file.originalname}`);

      await fs.rename(sqlFilePath, targetPath);
      console.log(`📁 File moved to: ${targetPath}`);

      // Run make import command
      const { stdout, stderr } = await execAsync('make import', {
        cwd: project.path,
        timeout: 60000 // 60 second timeout
      });

      console.log(`✅ SQL imported successfully for ${project.name}`);
      console.log('Make output:', stdout);

      res.json({
        message: `SQL file imported successfully to ${project.name}`,
        filename: req.file.originalname,
        size: req.file.size,
        location: `sqlback/${path.basename(targetPath)}`
      });

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(sqlFilePath).catch(() => {});

      console.error('SQL import failed:', error);
      res.status(500).json({
        error: 'Failed to import SQL file',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Failed to import SQL:', error);
    res.status(500).json({ error: 'Failed to import SQL file' });
  }
});

// Helper functions
async function createProjectAsync(project) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  if (projectIndex === -1) {
    console.error('❌ Project not found in array:', project.id);
    return;
  }

  try {
    console.log(`🚀 Creating project: ${project.name}`);
    console.log(`📁 Project path: ${project.path}`);
    console.log(`🎨 Template: ${project.template}`);
    console.log(`⚙️ Config:`, JSON.stringify(project.config, null, 2));

    // Update status and broadcast
    projects[projectIndex].status = 'creating';
    projects[projectIndex].progress = 'Initializing...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    // Create project directory
    console.log(`📁 Creating project directory: ${project.path}`);
    await fs.mkdir(project.path, { recursive: true });

    // Create src directory
    const srcPath = path.join(project.path, 'src');
    console.log(`📁 Creating src directory: ${srcPath}`);
    await fs.mkdir(srcPath, { recursive: true });

    // Load template configuration
    console.log(`📋 Loading template configuration...`);
    const templateConfigPath = path.join(TEMPLATES_DIR, project.template, 'config.json');
    console.log(`📋 Template config path: ${templateConfigPath}`);

    let templateConfig;
    try {
      templateConfig = JSON.parse(await fs.readFile(templateConfigPath, 'utf8'));
      console.log(`✅ Template config loaded successfully`);
    } catch (configError) {
      console.error(`❌ Failed to load template config:`, configError);
      throw new Error(`Template configuration not found: ${configError.message}`);
    }

    // Generate project files from template
    console.log(`🌱 Starting project file generation...`);
    projects[projectIndex].progress = 'Creating project files...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    await generateProjectFromTemplate(project, templateConfig, srcPath);

    // Generate Docker configuration
    console.log(`🐳 Starting Docker configuration generation...`);
    projects[projectIndex].progress = 'Setting up Docker...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    await generateDockerConfig(project, templateConfig);

    // Install dependencies and setup project
    console.log(`🔧 Starting project setup...`);
    projects[projectIndex].progress = 'Installing dependencies...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    await setupProject(project, templateConfig);

    // Project created successfully
    console.log(`✅ Project creation completed successfully: ${project.name}`);
    projects[projectIndex].status = 'ready';
    projects[projectIndex].progress = 'Project created successfully';
    delete projects[projectIndex].progress;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    console.log(`✅ Project created: ${project.name}`);

  } catch (error) {
    console.error('❌ Project creation failed:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      projectName: project.name,
      projectPath: project.path,
      template: project.template,
      errorMessage: error.message,
      errorCode: error.code,
      errorErrno: error.errno
    });

    // Update project status to error with detailed message
    projects[projectIndex].status = 'error';
    projects[projectIndex].progress = `Creation failed: ${error.message}`;
    await saveProjects(projects);

    // Broadcast error to frontend
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'project creation', `Error: ${error.message}`, 'error');

    // Log detailed error for debugging
    console.error('Detailed error:', {
      projectName: project.name,
      projectPath: project.path,
      template: project.template,
      error: error.stack || error.message
    });
  }
}

async function generateProjectFromTemplate(project, templateConfig, srcPath) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  projects[projectIndex].progress = 'Generating project files...';
  await saveProjects(projects);
  global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

  if (project.template === 'laravel') {
    // Create Laravel project
    console.log('🌱 Creating Laravel project...');
    console.log(`📁 Source path: ${srcPath}`);
    projects[projectIndex].progress = 'Running: composer create-project laravel/laravel';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'composer create-project laravel/laravel . --prefer-dist --no-dev', 'Starting Laravel project creation...', 'info');

    try {
      console.log(`🔍 Checking if composer is available...`);
      await execAsync('composer --version', { timeout: 10000 });
      console.log(`✅ Composer is available`);

      console.log(`🔍 Checking source path exists: ${srcPath}`);
      await fs.access(srcPath);
      console.log(`✅ Source path exists and accessible`);

      console.log(`🏃 Running composer create-project in: ${srcPath}`);
      const command = `cd "${srcPath}" && composer create-project laravel/laravel . --prefer-dist --no-dev`;
      console.log(`💻 Command: ${command}`);

      await execAsync(command, {
        cwd: srcPath,
        timeout: 300000 // 5 minutes timeout
      });

      console.log('✅ Laravel project created successfully');
      global.broadcastCommand && global.broadcastCommand(project.id, 'composer create-project', 'Laravel project created successfully', 'success');
    } catch (error) {
      console.error('❌ Failed to create Laravel project:', error);
      console.error('❌ Composer error details:', {
        code: error.code,
        signal: error.signal,
        stderr: error.stderr,
        stdout: error.stdout,
        cmd: error.cmd
      });
      global.broadcastCommand && global.broadcastCommand(project.id, 'composer create-project', `Failed to create Laravel project: ${error.message}`, 'error');
      throw new Error(`Laravel project creation failed: ${error.message}`);
    }

  } else if (project.template === 'nodejs') {
    // Create Node.js project
    console.log('🌱 Creating Node.js project...');
    projects[projectIndex].progress = 'Creating Node.js project structure';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'npm init', 'Creating package.json...', 'info');

    // Create package.json
    const packageJson = {
      name: project.name,
      version: "1.0.0",
      description: `${project.name} - Node.js Application`,
      main: "index.js",
      scripts: {
        start: "node index.js",
        dev: "nodemon index.js"
      },
      dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        helmet: "^7.1.0",
        morgan: "^1.10.0",
        dotenv: "^16.3.1"
      },
      devDependencies: {
        nodemon: "^3.0.2"
      }
    };

    await fs.writeFile(
      path.join(srcPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    console.log('✅ Node.js project structure created');
    global.broadcastCommand && global.broadcastCommand(project.id, 'package.json', 'package.json created successfully', 'success');

    // Create basic index.js
    const indexJs = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${project.name}!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '${project.name}' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 \${process.env.APP_NAME || '${project.name}'} server running on port \${PORT}\`);
});
`;

    await fs.writeFile(path.join(srcPath, 'index.js'), indexJs);
  }
}

async function generateDockerConfig(project, templateConfig) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  console.log('🐳 Generating Docker configuration...');
  projects[projectIndex].progress = 'Generating Docker configuration...';
  await saveProjects(projects);
  global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
  global.broadcastCommand && global.broadcastCommand(project.id, 'docker setup', 'Generating Docker configuration files...', 'info');

  // Load template stubs
  const stubsPath = path.join(TEMPLATES_DIR, project.template, 'stubs');
  const stubFiles = await fs.readdir(stubsPath);

  // Create docker directory for supporting files only
  const dockerPath = path.join(project.path, 'docker');
  await fs.mkdir(dockerPath, { recursive: true });

  // Process each stub file
  for (const stubFile of stubFiles) {
    if (stubFile.endsWith('.stub')) {
      const stubContent = await fs.readFile(path.join(stubsPath, stubFile), 'utf8');
      let outputFile = stubFile.replace('.stub', '');
      let outputPath;

      console.log(`📄 Processing stub: ${stubFile} -> ${outputFile}`);
      global.broadcastCommand && global.broadcastCommand(project.id, `generate ${outputFile}`, `Creating ${outputFile}...`, 'info');

      // Main Docker files and Makefile go in project root
      if (outputFile === 'docker-compose.yml' || outputFile === 'Dockerfile' || outputFile === 'Makefile') {
        outputPath = path.join(project.path, outputFile);
        console.log(`📁 Root file: ${outputFile} -> ${outputPath}`);
      }
      // Environment files go in src directory
      else if (outputFile === '.env') {
        outputPath = path.join(project.path, 'src', outputFile);
        console.log(`📁 Src file: ${outputFile} -> ${outputPath}`);
      }
      // All other supporting config files go in docker directory
      else {
        outputPath = path.join(dockerPath, outputFile);
        console.log(`📁 Docker file: ${outputFile} -> ${outputPath}`);
      }

      // Replace template variables
      const processedContent = replaceTemplateVariables(stubContent, project, templateConfig);
      await fs.writeFile(outputPath, processedContent);

      console.log(`✅ Generated: ${outputPath}`);
      global.broadcastCommand && global.broadcastCommand(project.id, `${outputFile} created`, `Successfully created ${outputFile}`, 'success');
    }
  }

  console.log('✅ Docker configuration generated successfully');
  global.broadcastCommand && global.broadcastCommand(project.id, 'docker setup', 'Docker configuration completed successfully', 'success');
}

function replaceTemplateVariables(content, project, templateConfig) {
  let processed = content;

  // Basic replacements
  processed = processed.replace(/\{\{PROJECT_NAME\}\}/g, project.name);
  processed = processed.replace(/\{\{PHP_VERSION\}\}/g, project.config.versions?.php || templateConfig.versions?.php?.default || '8.2');
  processed = processed.replace(/\{\{NODE_VERSION\}\}/g, project.config.versions?.node || templateConfig.versions?.node?.default || '18');

  // Port replacements - handle both template defaults and project overrides
  const projectPorts = project.ports || {};
  const templatePorts = templateConfig.ports || {};

  // Map project ports to template variables
  const portMappings = {
    'APP_PORT': projectPorts.app || templatePorts.app?.default || (project.template === 'laravel' ? 8000 : 3000),
    'VITE_PORT': projectPorts.vite || templatePorts.vite?.default || 5173,
    'DB_PORT': projectPorts.db || 3306,
    'REDIS_PORT': projectPorts.redis || 6379,
    'PHPMYADMIN_PORT': projectPorts.phpmyadmin || 8080,
    'MAILHOG_PORT': projectPorts.mailhog || 8025
  };

  // Apply port replacements
  Object.entries(portMappings).forEach(([key, port]) => {
    processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), port);
  });

  console.log(`🔄 Applied port mappings:`, portMappings);

  // Package manager flags
  processed = processed.replace(/\{\{INSTALL_BUN\}\}/g, project.config.packageManagers?.bun ? 'true' : 'false');
  processed = processed.replace(/\{\{INSTALL_PNPM\}\}/g, project.config.packageManagers?.pnpm ? 'true' : 'false');

  // Service-specific replacements
  const hasRedis = project.config.services?.redis !== false && (templateConfig.services?.redis?.default !== false);
  const hasPhpMyAdmin = project.config.services?.phpmyadmin === true;
  const hasMailhog = project.config.services?.mailhog === true;

  // Redis dependencies and services
  processed = processed.replace(/\{\{REDIS_DEPENDS\}\}/g, hasRedis ? '\n      - redis' : '');
  processed = processed.replace(/\{\{REDIS_SERVICE\}\}/g, hasRedis ? generateRedisService(project) : '');
  processed = processed.replace(/\{\{REDIS_VOLUME\}\}/g, hasRedis ? '\n  redis_data:\n    driver: local' : '');

  // Other services
  processed = processed.replace(/\{\{PHPMYADMIN_SERVICE\}\}/g, hasPhpMyAdmin ? generatePhpMyAdminService(project) : '');
  processed = processed.replace(/\{\{MAILHOG_SERVICE\}\}/g, hasMailhog ? generateMailhogService(project) : '');

  // Environment configurations
  processed = processed.replace(/\{\{REDIS_CONFIG\}\}/g, hasRedis ? generateRedisConfig() : '');
  processed = processed.replace(/\{\{MAIL_CONFIG\}\}/g, hasMailhog ? generateMailConfig() : '');

  // App key placeholder for Laravel
  processed = processed.replace(/\{\{APP_KEY\}\}/g, 'base64:' + Buffer.from(project.name + Date.now()).toString('base64'));

  // Cache and queue drivers based on services
  const cacheDriver = hasRedis ? 'redis' : 'file';
  const queueConnection = hasRedis ? 'redis' : 'sync';
  const sessionDriver = hasRedis ? 'redis' : 'file';

  processed = processed.replace(/\{\{CACHE_DRIVER\}\}/g, cacheDriver);
  processed = processed.replace(/\{\{QUEUE_CONNECTION\}\}/g, queueConnection);
  processed = processed.replace(/\{\{SESSION_DRIVER\}\}/g, sessionDriver);

  return processed;
}

function generateRedisService(project) {
  return `
  redis:
    image: redis:7-alpine
    container_name: ${project.name}_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ${project.name}_network
    restart: unless-stopped
    command: redis-server --appendonly yes`;
}

function generatePhpMyAdminService(project) {
  const port = project.config.ports?.phpmyadmin || 8080;
  return `
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: ${project.name}_phpmyadmin
    environment:
      PMA_HOST: db
      PMA_USER: laravel
      PMA_PASSWORD: password
    ports:
      - "${port}:80"
    depends_on:
      - db
    networks:
      - ${project.name}_network
    restart: unless-stopped`;
}

function generateMailhogService(project) {
  const port = project.config.ports?.mailhog || 8025;
  return `
  mailhog:
    image: mailhog/mailhog:latest
    container_name: ${project.name}_mailhog
    ports:
      - "${port}:8025"
      - "1025:1025"
    networks:
      - ${project.name}_network
    restart: unless-stopped`;
}

function generateRedisConfig() {
  return `REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379`;
}

function generateMailConfig() {
  return `MAIL_DRIVER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null`;
}

async function setupProject(project, templateConfig) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  projects[projectIndex].progress = 'Setting up project...';
  await saveProjects(projects);
  global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

  const srcPath = path.join(project.path, 'src');

  if (project.template === 'laravel') {
    // Generate Laravel .env file
    console.log('📝 Generating Laravel .env file...');
    projects[projectIndex].progress = 'Generating .env file';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'generate .env', 'Creating Laravel environment file...', 'info');

    const envContent = generateLaravelEnv(project, templateConfig);
    await fs.writeFile(path.join(srcPath, '.env'), envContent);

    console.log('✅ Laravel .env file created');
    global.broadcastCommand && global.broadcastCommand(project.id, '.env file', 'Environment file created successfully', 'success');

    // Generate app key
    console.log('🔑 Generating Laravel application key...');
    projects[projectIndex].progress = 'Generating application key...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'php artisan key:generate --force', 'Generating Laravel application key...', 'info');

    try {
      await execAsync('php artisan key:generate --force', { cwd: srcPath });
      console.log('✅ Laravel application key generated');
      global.broadcastCommand && global.broadcastCommand(project.id, 'artisan key:generate', 'Application key generated successfully', 'success');
    } catch (error) {
      console.warn('⚠️ Could not generate Laravel key (artisan not available):', error.message);
      global.broadcastCommand && global.broadcastCommand(project.id, 'artisan key:generate', `Warning: Could not generate key - ${error.message}`, 'warning');
    }

  } else if (project.template === 'nodejs') {
    // Generate Node.js .env file
    console.log('📝 Generating Node.js .env file...');
    projects[projectIndex].progress = 'Generating .env file';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'generate .env', 'Creating Node.js environment file...', 'info');

    const envContent = generateNodejsEnv(project, templateConfig);
    await fs.writeFile(path.join(srcPath, '.env'), envContent);

    console.log('✅ Node.js .env file created');
    global.broadcastCommand && global.broadcastCommand(project.id, '.env file', 'Environment file created successfully', 'success');

    // Install dependencies
    console.log('📦 Installing Node.js dependencies...');
    projects[projectIndex].progress = 'Installing dependencies...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
    global.broadcastCommand && global.broadcastCommand(project.id, 'npm install', 'Installing Node.js dependencies...', 'info');

    try {
      await execAsync('npm install', {
        cwd: srcPath,
        timeout: 180000 // 3 minutes timeout
      });
      console.log('✅ Node.js dependencies installed');
      global.broadcastCommand && global.broadcastCommand(project.id, 'npm install', 'Dependencies installed successfully', 'success');
    } catch (error) {
      console.warn('⚠️ Could not install npm dependencies:', error.message);
      global.broadcastCommand && global.broadcastCommand(project.id, 'npm install', `Warning: Could not install dependencies - ${error.message}`, 'warning');
      // Don't throw error for npm install failures as the project can still work
    }
  }
}

function generateLaravelEnv(project, templateConfig) {
  const ports = { ...templateConfig.ports, ...project.config.ports };
  const hasRedis = project.config.services?.redis !== false;
  const hasMailhog = project.config.services?.mailhog === true;

  return `APP_NAME=${project.name}
APP_ENV=local
APP_KEY=base64:${Buffer.from(project.name + Date.now()).toString('base64')}
APP_DEBUG=true
APP_URL=http://localhost:${ports.app?.default || ports.app || 8000}

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=${project.name}
DB_USERNAME=laravel
DB_PASSWORD=password

BROADCAST_DRIVER=log
CACHE_DRIVER=${hasRedis ? 'redis' : 'file'}
FILESYSTEM_DRIVER=local
QUEUE_CONNECTION=${hasRedis ? 'redis' : 'sync'}
SESSION_DRIVER=${hasRedis ? 'redis' : 'file'}
SESSION_LIFETIME=120

${hasRedis ? `REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379` : ''}

${hasMailhog ? `MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=hello@${project.name}.local
MAIL_FROM_NAME="${project.name}"` : ''}

# Laravel God Mode specific
LARAVEL_GOD_MODE=true
CONTAINER_ENV=docker
`;
}

function generateNodejsEnv(project, templateConfig) {
  const ports = { ...templateConfig.ports, ...project.config.ports };

  return `# ${project.name} Configuration
NODE_ENV=development
PORT=${ports.app?.default || ports.app || 3000}
APP_NAME=${project.name}

# Database
DB_HOST=db
DB_PORT=3306
DB_NAME=${project.name}
DB_USER=nodejs
DB_PASSWORD=password

${project.config.services?.redis ? `# Redis
REDIS_HOST=redis
REDIS_PORT=6379` : ''}

# Security
JWT_SECRET=your-super-secret-jwt-key-here
`;
}

async function getProjectStatus(project) {
  try {
    // Check if docker-compose.yml exists
    const composePath = path.join(project.path, 'docker-compose.yml');
    await fs.access(composePath);

    // Check if containers are running
    const { stdout } = await execAsync(`docker-compose ps -q`, { cwd: project.path });

    if (stdout.trim()) {
      // Check if containers are actually running
      const containers = stdout.trim().split('\n');
      const runningContainers = [];

      for (const container of containers) {
        try {
          const { stdout: statusOutput } = await execAsync(`docker inspect -f '{{.State.Status}}' ${container}`);
          if (statusOutput.trim() === 'running') {
            runningContainers.push(container);
          }
        } catch (error) {
          // Container doesn't exist or error checking status
        }
      }

      return runningContainers.length > 0 ? 'running' : 'stopped';
    } else {
      return 'stopped';
    }
  } catch (error) {
    // Project doesn't exist or no docker-compose file
    return project.status || 'error';
  }
}

async function regenerateDockerCompose(project, templateConfig) {
  // Load the docker-compose.yml stub
  const stubPath = path.join(TEMPLATES_DIR, project.template, 'stubs', 'docker-compose.yml.stub');
  const stubContent = await fs.readFile(stubPath, 'utf8');

  // Replace template variables with updated project data
  const processedContent = replaceTemplateVariables(stubContent, project, templateConfig);

  // Write the updated docker-compose.yml
  const composePath = path.join(project.path, 'docker-compose.yml');
  await fs.writeFile(composePath, processedContent);

  console.log(`✅ Updated docker-compose.yml with new ports:`, project.ports);
}

async function startProjectAsync(project) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  if (projectIndex === -1) return;

  try {
    console.log(`🚀 Starting project: ${project.name}`);

    projects[projectIndex].progress = 'Checking Docker setup...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    await startProject(project);

    projects[projectIndex].status = 'running';
    projects[projectIndex].progress = 'Project started successfully';
    delete projects[projectIndex].progress;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    console.log(`✅ Project started: ${project.name}`);

  } catch (error) {
    console.error('❌ Project start failed:', error);

    projects[projectIndex].status = 'error';
    projects[projectIndex].progress = `Start failed: ${error.message}`;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
  }
}

async function startProject(project) {
  try {
    // Clean up any potential cached layers first
    await execAsync('docker system prune -f', { cwd: project.path }).catch(() => {});

    // Build and start containers
    const { stdout, stderr } = await execAsync('docker-compose up -d --build', { cwd: project.path });
    console.log('Docker compose up output:', stdout);
    if (stderr) console.warn('Docker compose warnings:', stderr);
  } catch (error) {
    // If build fails, try without cache
    console.warn('Build failed, retrying without cache...');
    const { stdout, stderr } = await execAsync('docker-compose build --no-cache && docker-compose up -d', { cwd: project.path });
    console.log('Docker compose rebuild output:', stdout);
    if (stderr) console.warn('Docker compose warnings:', stderr);
  }
}

async function stopProject(project) {
  const { stdout, stderr } = await execAsync('docker-compose down', { cwd: project.path });
  console.log('Docker compose down output:', stdout);
  if (stderr) console.warn('Docker compose warnings:', stderr);
}

module.exports = router;

// Enhanced command execution with real-time logging
async function executeCommandWithLogs(command, cwd, operationId) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const args = command.split(' ');
    const cmd = args.shift();

    const child = spawn(cmd, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`[${operationId}] STDOUT:`, message.trim());
      broadcastOperationLog(operationId, 'info', message.trim());
    });

    child.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.log(`[${operationId}] STDERR:`, message.trim());
      broadcastOperationLog(operationId, 'warning', message.trim());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[${operationId}] Command completed successfully`);
        resolve({ stdout: output, stderr: errorOutput });
      } else {
        console.error(`[${operationId}] Command failed with code ${code}`);
        reject(new Error(`Command failed with exit code ${code}: ${errorOutput || 'Unknown error'}`));
      }
    });

    child.on('error', (error) => {
      console.error(`[${operationId}] Command error:`, error);
      reject(error);
    });
  });
}

// WebSocket broadcasting functions
function broadcastOperationLog(operationId, logType, message) {
  if (global.wss) {
    const logMessage = {
      type: 'operation_log',
      operationId,
      logType,
      message,
      timestamp: Date.now()
    };

    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(logMessage));
      }
    });
  }
}

function broadcastOperationStep(operationId, step, progress, stepMessage) {
  if (global.wss) {
    const stepMessage2 = {
      type: 'operation_step',
      operationId,
      step,
      progress,
      stepMessage,
      timestamp: Date.now()
    };

    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(stepMessage2));
      }
    });
  }
}

function broadcastOperationComplete(operationId, success, message) {
  if (global.wss) {
    const completeMessage = {
      type: 'operation_complete',
      operationId,
      success,
      message,
      timestamp: Date.now()
    };

    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(completeMessage));
      }
    });
  }
}

async function startProjectAsync(project) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  if (projectIndex === -1) return;

  try {
    console.log(`🚀 Starting project: ${project.name}`);
    const operationId = `start-${project.id}`;

    // Broadcast operation start
    broadcastOperationLog(operationId, 'info', 'Initializing project startup...');
    broadcastOperationStep(operationId, 0, 25, 'Checking project configuration...');

    projects[projectIndex].progress = 'Checking project configuration...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    // Check if Makefile exists, use make command if available
    const makefilePath = path.join(project.path, 'Makefile');
    const hasMakefile = await fs.access(makefilePath).then(() => true).catch(() => false);

    if (hasMakefile) {
      // Use make start command for better feedback
      broadcastOperationLog(operationId, 'info', 'Using Makefile for startup process...');
      broadcastOperationStep(operationId, 1, 50, 'Executing make start...');

      await executeCommandWithLogs('make start', project.path, operationId);
    } else {
      // Fallback to docker-compose
      broadcastOperationLog(operationId, 'info', 'Using docker-compose for startup...');
      broadcastOperationStep(operationId, 1, 50, 'Starting containers...');

      await executeCommandWithLogs('docker-compose up -d --build', project.path, operationId);
    }

    broadcastOperationStep(operationId, 2, 75, 'Verifying container health...');

    // Wait for containers to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify containers are running
    const isRunning = await getProjectStatus(project);
    if (isRunning === 'running') {
      projects[projectIndex].status = 'running';
      projects[projectIndex].progress = 'Project started successfully';

      broadcastOperationStep(operationId, 3, 100, 'Project startup completed!');
      broadcastOperationLog(operationId, 'success', '✅ All containers are running successfully');
      broadcastOperationComplete(operationId, true, 'Project started successfully! 🚀');
    } else {
      throw new Error('Containers failed to start properly');
    }

    delete projects[projectIndex].progress;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    console.log(`✅ Project started: ${project.name}`);

  } catch (error) {
    console.error('❌ Project start failed:', error);

    const operationId = `start-${project.id}`;
    broadcastOperationLog(operationId, 'error', `❌ Startup failed: ${error.message}`);
    broadcastOperationComplete(operationId, false, 'Project startup failed');

    projects[projectIndex].status = 'error';
    projects[projectIndex].progress = `Start failed: ${error.message}`;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
  }
}

async function stopProjectAsync(project) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  if (projectIndex === -1) return;

  try {
    console.log(`⏹️ Stopping project: ${project.name}`);
    const operationId = `stop-${project.id}`;

    // Broadcast operation start
    broadcastOperationLog(operationId, 'info', 'Initializing project shutdown...');
    broadcastOperationStep(operationId, 0, 50, 'Stopping containers gracefully...');

    projects[projectIndex].progress = 'Stopping containers...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    // Check if Makefile exists, use make command if available
    const makefilePath = path.join(project.path, 'Makefile');
    const hasMakefile = await fs.access(makefilePath).then(() => true).catch(() => false);

    if (hasMakefile) {
      // Use make stop command for better feedback
      broadcastOperationLog(operationId, 'info', 'Using Makefile for shutdown process...');
      await executeCommandWithLogs('make stop', project.path, operationId);
    } else {
      // Fallback to docker-compose
      broadcastOperationLog(operationId, 'info', 'Using docker-compose for shutdown...');
      await executeCommandWithLogs('docker-compose down', project.path, operationId);
    }

    broadcastOperationStep(operationId, 1, 100, 'Shutdown completed!');

    projects[projectIndex].status = 'stopped';
    projects[projectIndex].progress = 'Project stopped successfully';

    broadcastOperationLog(operationId, 'success', '✅ All containers stopped successfully');
    broadcastOperationComplete(operationId, true, 'Project stopped successfully! ⏹️');

    delete projects[projectIndex].progress;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    console.log(`✅ Project stopped: ${project.name}`);

  } catch (error) {
    console.error('❌ Project stop failed:', error);

    const operationId = `stop-${project.id}`;
    broadcastOperationLog(operationId, 'error', `❌ Shutdown failed: ${error.message}`);
    broadcastOperationComplete(operationId, false, 'Project shutdown failed');

    projects[projectIndex].status = 'error';
    projects[projectIndex].progress = `Stop failed: ${error.message}`;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
  }
}

async function rebuildProjectAsync(project) {
  const projects = await loadProjects();
  const projectIndex = projects.findIndex(p => p.id === project.id);

  if (projectIndex === -1) return;

  try {
    console.log(`🔄 Rebuilding project: ${project.name}`);
    const operationId = `rebuild-${project.id}`;

    // Broadcast operation start
    broadcastOperationLog(operationId, 'info', 'Initializing project rebuild...');
    broadcastOperationStep(operationId, 0, 20, 'Stopping existing containers...');

    projects[projectIndex].progress = 'Stopping containers...';
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    // Check if Makefile exists, use make command if available
    const makefilePath = path.join(project.path, 'Makefile');
    const hasMakefile = await fs.access(makefilePath).then(() => true).catch(() => false);

    if (hasMakefile) {
      // Use make rebuild command for better feedback
      broadcastOperationLog(operationId, 'info', 'Using Makefile for rebuild process...');

      // Step 1: Stop
      await executeCommandWithLogs('make stop', project.path, operationId);

      broadcastOperationStep(operationId, 1, 40, 'Cleaning up old containers...');

      // Step 2: Clean (if available)
      try {
        await executeCommandWithLogs('make clean', project.path, operationId);
      } catch (error) {
        broadcastOperationLog(operationId, 'warning', 'Clean command not available, skipping...');
      }

      broadcastOperationStep(operationId, 2, 60, 'Rebuilding containers...');

      // Step 3: Rebuild
      try {
        await executeCommandWithLogs('make rebuild', project.path, operationId);
      } catch (error) {
        // Fallback to build + start
        broadcastOperationLog(operationId, 'info', 'Using fallback: make build && make start');
        await executeCommandWithLogs('make build', project.path, operationId);

        broadcastOperationStep(operationId, 3, 80, 'Starting rebuilt containers...');
        await executeCommandWithLogs('make start', project.path, operationId);
      }
    } else {
      // Fallback to docker-compose
      broadcastOperationLog(operationId, 'info', 'Using docker-compose for rebuild...');

      await executeCommandWithLogs('docker-compose down --volumes --remove-orphans', project.path, operationId);

      broadcastOperationStep(operationId, 1, 40, 'Removing old images...');
      await executeCommandWithLogs('docker system prune -f', project.path, operationId);

      broadcastOperationStep(operationId, 2, 60, 'Building fresh containers...');
      await executeCommandWithLogs('docker-compose build --no-cache', project.path, operationId);

      broadcastOperationStep(operationId, 3, 80, 'Starting rebuilt containers...');
      await executeCommandWithLogs('docker-compose up -d', project.path, operationId);
    }

    broadcastOperationStep(operationId, 4, 100, 'Rebuild completed!');

    // Wait for containers to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify containers are running
    const isRunning = await getProjectStatus(project);
    projects[projectIndex].status = isRunning === 'running' ? 'running' : 'stopped';
    projects[projectIndex].progress = 'Project rebuilt successfully';

    broadcastOperationLog(operationId, 'success', '✅ Project rebuilt successfully');
    broadcastOperationComplete(operationId, true, 'Project rebuilt successfully! 🔄');

    delete projects[projectIndex].progress;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);

    console.log(`✅ Project rebuilt: ${project.name}`);

  } catch (error) {
    console.error('❌ Project rebuild failed:', error);

    const operationId = `rebuild-${project.id}`;
    broadcastOperationLog(operationId, 'error', `❌ Rebuild failed: ${error.message}`);
    broadcastOperationComplete(operationId, false, 'Project rebuild failed');

    projects[projectIndex].status = 'error';
    projects[projectIndex].progress = `Rebuild failed: ${error.message}`;
    await saveProjects(projects);
    global.broadcastProjectUpdate && global.broadcastProjectUpdate(project.id, projects[projectIndex]);
  }
}
