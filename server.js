#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECTS_DB_FILE = path.join(__dirname, 'projects.json'); //

// Simple in-memory storage
let projects = [];
let nextPort = 8000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple logging
const log = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
};

// Utility: Run shell commands
const runCommand = (command, cwd = process.cwd()) => {
    return new Promise((resolve, reject) => {
        log(`Running: ${command}`);
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                log(`Error: ${error.message}`);
                reject(error);
            } else {
                log(`Success: ${command}`);
                resolve({ stdout, stderr });
            }
        });
    });
};

// Utility: Read and process stub file
const processStubFile = async (stubPath, replacements) => {
    try {
        await fs.access(stubPath);
        let content = await fs.readFile(stubPath, 'utf8');

        for (const [placeholder, value] of Object.entries(replacements)) {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            content = content.replace(regex, value || '');
        }

        return content;
    } catch (error) {
        throw new Error(`Stub file not found: ${stubPath}`);
    }
};

// Utility: Find next available ports
const getNextPorts = (services = []) => {
    // Collect all used ports from loaded projects
    const usedPorts = projects.flatMap(p => [
        p.port,
        p.dbPort,
        p.redisPort,
        p.phpmyadminPort,
        p.mailhogPort,
        p.vitePort
    ]).filter(Boolean);

    // Ensure nextPort starts higher than any currently used project port
    // This helps in scenarios where the manager restarts and new projects are added
    const maxProjectPort = projects.reduce((max, p) => Math.max(max, p.port || 0), 0); //
    nextPort = Math.max(nextPort, maxProjectPort + 1); //

    const findNextPort = (startPort) => {
        let port = startPort;
        while (usedPorts.includes(port)) {
            port++;
        }
        usedPorts.push(port); // Add the found port to usedPorts for this session
        return port;
    };

    const ports = {
        port: findNextPort(nextPort),
        dbPort: findNextPort(3306), // Common DB port
        vitePort: findNextPort(5173) // Common Vite port
    };

    if (services.includes('redis')) {
        ports.redisPort = findNextPort(6379);
    }

    if (services.includes('phpmyadmin')) {
        ports.phpmyadminPort = findNextPort(8080);
    }

    if (services.includes('mailhog')) {
        ports.mailhogPort = findNextPort(8025);
    }

    // Update nextPort for future auto-assignments only if it's the main app port
    nextPort = ports.port + 1; //
    return ports;
};

// Utility: Create Docker Compose from stub
const createDockerCompose = async (projectName, config) => {
    const { port, dbPort, redisPort, vitePort, services } = config;

    const replacements = {
        PROJECT_NAME: projectName,
        APP_PORT: port,
        DB_PORT: dbPort,
        VITE_PORT: vitePort || 5173,
        REDIS_PORT: redisPort || 6379,
        PHPMYADMIN_PORT: config.phpmyadminPort || 8080,
        MAILHOG_PORT: config.mailhogPort || 8025,
        MAILHOG_SMTP_PORT: (config.mailhogPort || 8025) + 100
    };

    // Handle conditional services
    replacements.REDIS_DEPENDS = services.includes('redis') ? '\n      - redis' : '';
    replacements.REDIS_SERVICE = services.includes('redis') ? `
  redis:
    image: redis:7-alpine
    container_name: ${projectName}_redis
    ports:
      - "${redisPort}:6379"
    volumes:
      - redis_data:/data
    networks:
      - ${projectName}_network
    restart: unless-stopped
    command: redis-server --appendonly yes` : '';

    replacements.REDIS_VOLUME = services.includes('redis') ? `
  redis_data:
    driver: local` : '';

    replacements.PHPMYADMIN_SERVICE = services.includes('phpmyadmin') ? `
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: ${projectName}_phpmyadmin
    ports:
      - "${config.phpmyadminPort}:80"
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
    restart: unless-stopped` : '';

    replacements.MAILHOG_SERVICE = services.includes('mailhog') ? `
  mailhog:
    image: mailhog/mailhog:latest
    container_name: ${projectName}_mailhog
    ports:
      - "${config.mailhogPort}:8025"
      - "${config.mailhogPort + 100}:1025"
    networks:
      - ${projectName}_network
    restart: unless-stopped` : '';

    const stubPath = path.join(__dirname, 'stubs', 'docker-compose.yml.stub');
    const content = await processStubFile(stubPath, replacements);
    log(`✅ Using docker-compose.yml.stub for ${projectName}`);
    return content;
};

// Create project Makefile
const createProjectMakefile = async (projectDir, projectName, config) => {
    const { services } = config;

    let servicesInfo = `🌐 App: http://localhost:${config.port}\\n📊 MySQL: localhost:${config.dbPort}`;

    if (services.includes('redis')) {
        servicesInfo += `\\n🔴 Redis: localhost:${config.redisPort}`;
    }
    if (services.includes('phpmyadmin')) {
        servicesInfo += `\\n🗄️ PHPMyAdmin: http://localhost:${config.phpmyadminPort}`;
    }
    if (services.includes('mailhog')) {
        servicesInfo += `\\n📧 Mailhog: http://localhost:${config.mailhogPort}`;
    }
    servicesInfo += `\\n⚡ Vite: http://localhost:${config.vitePort}`;

    const replacements = {
        PROJECT_NAME: projectName,
        APP_PORT: config.port,
        DB_PORT: config.dbPort,
        VITE_PORT: config.vitePort,
        REDIS_PORT: config.redisPort || 6379,
        PHPMYADMIN_PORT: config.phpmyadminPort || 8080,
        MAILHOG_PORT: config.mailhogPort || 8025,
        HAS_REDIS: services.includes('redis') ? 'true' : 'false',
        HAS_PHPMYADMIN: services.includes('phpmyadmin') ? 'true' : 'false',
        HAS_MAILHOG: services.includes('mailhog') ? 'true' : 'false',
        SERVICES_INFO: servicesInfo
    };

    const stubPath = path.join(__dirname, 'stubs', 'project-Makefile.stub');
    const content = await processStubFile(stubPath, replacements);
    await fs.writeFile(path.join(projectDir, 'Makefile'), content);
    log(`✅ Using project-Makefile.stub for ${projectName}`);
};

// Create other config files from stubs
const createConfigFiles = async (projectDir, projectName, config) => {
    const { services } = config;

    // Create docker directory
    const dockerDir = path.join(projectDir, 'docker');
    await fs.mkdir(dockerDir, { recursive: true });

    // Create Dockerfile from stub
    const dockerfileStub = path.join(__dirname, 'stubs', 'Dockerfile.stub');
    const dockerfile = await processStubFile(dockerfileStub, { PROJECT_NAME: projectName });
    await fs.writeFile(path.join(projectDir, 'Dockerfile'), dockerfile);
    log(`✅ Using Dockerfile.stub for ${projectName}`);

    // Create Vite Dockerfile from stub
    const viteDockerfileStub = path.join(__dirname, 'stubs', 'Dockerfile.vite.stub');
    const viteDockerfile = await processStubFile(viteDockerfileStub, { PROJECT_NAME: projectName });
    await fs.writeFile(path.join(projectDir, 'Dockerfile.vite'), viteDockerfile);
    log(`✅ Using Dockerfile.vite.stub for ${projectName}`);

    // Create Nginx config from stub
    const nginxStub = path.join(__dirname, 'stubs', 'nginx.conf.stub');
    const nginxConfig = await processStubFile(nginxStub, { PROJECT_NAME: projectName });
    await fs.writeFile(path.join(dockerDir, 'nginx.conf'), nginxConfig);
    log(`✅ Using nginx.conf.stub for ${projectName}`);

    // Create Supervisor config from stub
    const supervisorStub = path.join(__dirname, 'stubs', 'supervisor.conf.stub');
    const supervisorConfig = await processStubFile(supervisorStub, { PROJECT_NAME: projectName });
    await fs.writeFile(path.join(dockerDir, 'supervisor.conf'), supervisorConfig);
    log(`✅ Using supervisor.conf.stub for ${projectName}`);

    // Create .env file from stub (goes in src/ folder)
    // NOTE: The actual .env creation happens in the /api/projects POST route now
    // and is written directly to srcDir/.env
};

// API Routes
app.get('/api/projects', async (req, res) => {
    try {
        // We now have projects loaded from file on startup, so just return them
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name, services = [], customPorts = {} } = req.body;

        if (!name || !/^[a-z0-9-]+$/.test(name)) {
            return res.status(400).json({ error: 'Invalid project name' });
        }

        if (projects.find(p => p.name === name)) {
            return res.status(400).json({ error: 'Project already exists' });
        }

        // Get ports (use custom ports if provided, otherwise auto-assign)
        const autoPorts = getNextPorts(services);
        const ports = {
            port: customPorts.port || autoPorts.port,
            dbPort: customPorts.dbPort || autoPorts.dbPort,
            redisPort: customPorts.redisPort || autoPorts.redisPort,
            phpmyadminPort: customPorts.phpmyadminPort || autoPorts.phpmyadminPort,
            mailhogPort: customPorts.mailhogPort || autoPorts.mailhogPort,
            vitePort: customPorts.vitePort || autoPorts.vitePort
        };

        const projectDir = path.join(process.cwd(), 'projects', name);
        const srcDir = path.join(projectDir, 'src');

        // Create project directory structure
        await fs.mkdir(projectDir, { recursive: true });
        await fs.mkdir(srcDir, { recursive: true });

        // Create Laravel project in src directory
        log(`Creating Laravel project: ${name}`);
        await runCommand(`composer create-project laravel/laravel . --prefer-dist`, srcDir);

        // Create Docker files from stubs
        const dockerCompose = await createDockerCompose(name, { ...ports, services });
        await fs.writeFile(path.join(projectDir, 'docker-compose.yml'), dockerCompose);

        // Create all config files from stubs
        await createConfigFiles(projectDir, name, { ...ports, services });

        // Create project Makefile
        await createProjectMakefile(projectDir, name, { ...ports, services });

        // Create .env file in src directory from stub
        const envReplacements = {
            PROJECT_NAME: name,
            APP_KEY: `base64:${Buffer.from(name + Date.now()).toString('base64')}`,
            APP_PORT: ports.port,
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
MAIL_FROM_ADDRESS="hello@${name}.local"
MAIL_FROM_NAME="${name}"` : ''
        };

        const envStub = path.join(__dirname, 'stubs', '.env.stub');
        const envContent = await processStubFile(envStub, envReplacements);
        await fs.writeFile(path.join(srcDir, '.env'), envContent);
        log(`✅ Using .env.stub for ${name} (placed in src/)`);

        // Update Laravel's vite.config.js for Docker
        const viteConfig = `import { defineConfig } from 'vite';
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
        await fs.writeFile(path.join(srcDir, 'vite.config.js'), viteConfig);

        const project = {
            name,
            services,
            ...ports,
            path: projectDir,
            srcPath: srcDir,
            status: 'stopped', // Initial status is stopped
            created: new Date().toISOString()
        };

        projects.push(project);
        await saveProjects(); // Save projects after adding a new one
        res.json(project);

    } catch (error) {
        log(`Error creating project: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects/:name/start', async (req, res) => {
    try {
        const project = projects.find(p => p.name === req.params.name);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await runCommand('docker-compose up -d', project.path);
        project.status = 'running';
        await saveProjects(); // Save project status

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects/:name/stop', async (req, res) => {
    try {
        const project = projects.find(p => p.name === req.params.name);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await runCommand('docker-compose down', project.path);
        project.status = 'stopped';
        await saveProjects(); // Save project status

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects/:name', async (req, res) => {
    try {
        const projectIndex = projects.findIndex(p => p.name === req.params.name);
        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projects[projectIndex];

        // Stop and remove containers
        try {
            await runCommand('docker-compose down -v', project.path);
        } catch (e) {
            log(`Warning: Could not stop containers: ${e.message}`);
        }

        // Remove project directory
        await fs.rm(project.path, { recursive: true, force: true }); // Use fs.rm for broader compatibility and force option

        // Remove from projects array
        projects.splice(projectIndex, 1);
        await saveProjects(); // Save projects after deletion

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New API to get .env content
app.get('/api/projects/:name/env', async (req, res) => {
    try {
        const project = projects.find(p => p.name === req.params.name);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const envFilePath = path.join(project.srcPath, '.env');
        const envContent = await fs.readFile(envFilePath, 'utf8');
        res.json({ content: envContent });
    } catch (error) {
        log(`Error reading .env for ${req.params.name}: ${error.message}`);
        res.status(500).json({ error: 'Failed to read .env file' });
    }
});

// New API to update .env content
app.put('/api/projects/:name/env', async (req, res) => {
    try {
        const { content } = req.body;
        const project = projects.find(p => p.name === req.params.name);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Content must be a string' });
        }

        const envFilePath = path.join(project.srcPath, '.env');
        await fs.writeFile(envFilePath, content, 'utf8');
        log(`✅ .env updated for ${req.params.name}`);
        res.json({ success: true, message: '.env updated successfully' });
    } catch (error) {
        log(`Error updating .env for ${req.params.name}: ${error.message}`);
        res.status(500).json({ error: 'Failed to update .env file' });
    }
});

// New API to run Artisan commands
app.post('/api/projects/:name/artisan', async (req, res) => {
    try {
        const { command } = req.body; // e.g., 'migrate', 'cache:clear', 'optimize'
        const project = projects.find(p => p.name === req.params.name);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (!command) {
            return res.status(400).json({ error: 'Artisan command is required' });
        }

        log(`Running Artisan command 'php artisan ${command}' for ${project.name}`);
        // Ensure the command runs inside the 'app' container
        const result = await runCommand(`docker-compose exec -T app php artisan ${command}`, project.path);
        res.json({ output: result.stdout, error: result.stderr });
    } catch (error) {
        log(`Error running Artisan command: ${error.message}`);
        res.status(500).json({ error: error.message, output: error.stdout, stderr: error.stderr });
    }
});

app.post('/api/projects/:name/command', async (req, res) => {
    try {
        const { command } = req.body;
        const project = projects.find(p => p.name === req.params.name);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const result = await runCommand(`docker-compose exec -T app ${command}`, project.path);
        res.json({ output: result.stdout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        projects: projects.length,
        timestamp: new Date().toISOString()
    });
});

// Utility: Save projects to file
const saveProjects = async () => {
    try {
        await fs.writeFile(PROJECTS_DB_FILE, JSON.stringify(projects, null, 2), 'utf8'); //
        log('✅ Project data saved to file'); //
    } catch (error) {
        log(`❌ Error saving project data: ${error.message}`); //
    }
};

// Utility: Load projects from file
const loadProjects = async () => {
    try {
        const data = await fs.readFile(PROJECTS_DB_FILE, 'utf8'); //
        projects = JSON.parse(data); //
        log(`✅ Loaded ${projects.length} projects from ${PROJECTS_DB_FILE}`); //
        // Recalculate nextPort based on loaded projects to avoid port conflicts
        const maxPort = projects.reduce((max, p) => Math.max(max, p.port || 0), 0); //
        nextPort = maxPort > nextPort ? maxPort + 1 : nextPort; //

        // Update project paths after loading, in case the manager moved
        projects = projects.map(p => ({
            ...p,
            path: path.join(process.cwd(), 'projects', p.name),
            srcPath: path.join(process.cwd(), 'projects', p.name, 'src')
        }));
    } catch (error) {
        if (error.code === 'ENOENT') {
            log('No existing project data file found, starting fresh.'); //
        } else {
            log(`❌ Error loading project data: ${error.message}`); //
        }
        projects = []; // Ensure projects array is empty on error
    }
};

// Initialize and start server
async function startServer() {
    // Create necessary directories
    await fs.mkdir('stubs', { recursive: true });
    await fs.mkdir('projects', { recursive: true });

    await loadProjects(); // Load existing projects at startup

    // Check if stub files exist and report status
    const stubFiles = [
        'docker-compose.yml.stub',
        'Dockerfile.stub',
        'Dockerfile.vite.stub',
        'nginx.conf.stub',
        'supervisor.conf.stub',
        '.env.stub',
        'project-Makefile.stub'
    ];

    let stubsFound = 0;
    for (const stubFile of stubFiles) {
        try {
            await fs.access(path.join(__dirname, 'stubs', stubFile));
            stubsFound++;
        } catch (error) {
            log(`❌ Missing stub file: ${stubFile}`);
        }
    }

    if (stubsFound !== stubFiles.length) {
        log(`❌ ERROR: Missing ${stubFiles.length - stubsFound} stub files!`);
        log(`📄 Required stub files: ${stubFiles.join(', ')}`);
        log(`💡 Please create all stub files in the 'stubs/' directory`);
        process.exit(1);
    }

    app.listen(PORT, () => {
        log('🚀 Simple Laravel Manager Started');
        log(`📍 Server running on http://localhost:${PORT}`);
        log(`📁 Projects directory: ${path.join(process.cwd(), 'projects')}`);
        log(`📄 Stub files directory: ${path.join(process.cwd(), 'stubs')}`);
        log(`✅ All ${stubFiles.length} stub files found and ready`);
        log(`📊 Managing ${projects.length} projects`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    log('\n👋 Shutting down gracefully...');
    await saveProjects(); // Save projects on shutdown
    process.exit(0);
});

startServer().catch(console.error);
