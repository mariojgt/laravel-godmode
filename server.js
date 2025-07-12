#!/usr/bin/env node

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;

// Import our modules
const config = require('./config/defaults');
const logger = require('./lib/logger');
const projectManager = require('./lib/project-manager');

// Import routes
const projectRoutes = require('./routes/projects');
const dockerRoutes = require('./routes/docker');
const fileRoutes = require('./routes/files');

/**
 * Laravel God Mode - Main Server
 * A simple, powerful Laravel development environment manager
 */
class LaravelGodModeServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.clients = new Set();

    this.init();
  }

  async init() {
    try {
      // Setup express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup WebSocket
      this.setupWebSocket();

      // Setup error handling
      this.setupErrorHandling();

      // Start server
      await this.start();

    } catch (error) {
      logger.error('Failed to initialize server', { error: error.message });
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // CORS headers for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        projects: projectManager.getAllProjects().length
      });
    });

    // API routes
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/docker', dockerRoutes);
    this.app.use('/api/files', fileRoutes);

    // Serve Artisan commands
    this.app.get('/api/artisan-commands', async (req, res) => {
      try {
        const commandsPath = path.join(__dirname, 'config', 'commands.json');
        const data = await fs.readFile(commandsPath, 'utf8');
        res.json(JSON.parse(data));
      } catch (error) {
        logger.error('Failed to load Artisan commands', { error: error.message });
        res.status(500).json({ error: 'Failed to load commands' });
      }
    });

    // Serve main application
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Catch-all route for SPA
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });
      this.clients.add(ws);

      // Send initial data
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Laravel God Mode',
        timestamp: new Date().toISOString()
      }));

      // Send current projects
      const projects = projectManager.getAllProjects();
      ws.send(JSON.stringify({
        type: 'projects_update',
        data: projects
      }));

      // Handle messages from client
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message', { error: error.message });
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message });
        this.clients.delete(ws);
      });
    });
  }

  async handleWebSocketMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'get_projects':
        const projects = projectManager.getAllProjects();
        ws.send(JSON.stringify({
          type: 'projects_update',
          data: projects
        }));
        break;

      case 'subscribe_project_status':
        // Client wants real-time updates for a specific project
        if (payload && payload.projectName) {
          // Store subscription info (you could extend this)
          logger.debug(`Client subscribed to project: ${payload.projectName}`);
        }
        break;

      default:
        logger.warn(`Unknown WebSocket message type: ${type}`);
    }
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Express error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
  }

  async start() {
    // Ensure required directories exist
    await this.createDirectories();

    // Check for stub files
    await this.checkStubFiles();

    const port = config.server.port;
    const host = config.server.host;

    this.server.listen(port, host, () => {
      logger.success('🚀 Laravel God Mode Server Started');
      logger.info(`📍 Server: http://${host}:${port}`);
      logger.info(`📁 Projects: ${config.paths.projects}`);
      logger.info(`📄 Stubs: ${config.paths.stubs}`);
      logger.info(`📊 Managing ${projectManager.getAllProjects().length} projects`);
      logger.info(`🌐 WebSocket: Ready for real-time updates`);

      // Start periodic status updates
      this.startStatusUpdates();
    });
  }

  async createDirectories() {
    const directories = Object.values(config.paths);

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        logger.debug(`Directory ensured: ${dir}`);
      } catch (error) {
        logger.error(`Failed to create directory: ${dir}`, { error: error.message });
      }
    }
  }

  async checkStubFiles() {
    const requiredStubs = [
      'docker-compose.yml.stub',
      'Dockerfile.stub',
      'nginx.conf.stub',
      'supervisor.conf.stub',
      '.env.stub',
      'project-Makefile.stub',
      'php.ini.stub',
      'mysql.cnf.stub'
    ];

    const stubsPath = config.paths.stubs;
    let missingStubs = [];

    for (const stub of requiredStubs) {
      try {
        await fs.access(path.join(stubsPath, stub));
      } catch (error) {
        missingStubs.push(stub);
      }
    }

    if (missingStubs.length > 0) {
      logger.error(`❌ Missing ${missingStubs.length} stub files!`);
      logger.error(`📄 Required: ${missingStubs.join(', ')}`);
      logger.error(`💡 Please create all stub files in: ${stubsPath}`);
      throw new Error('Missing required stub files');
    }

    logger.success(`✅ All ${requiredStubs.length} stub files found`);
  }

  startStatusUpdates() {
    // Update project statuses every 30 seconds
    setInterval(async () => {
      try {
        const projects = projectManager.getAllProjects();

        for (const project of projects) {
          if (project.status === 'running') {
            await projectManager.updateProjectStatus(project.name);
          }
        }

        // Broadcast updated projects to all connected clients
        const updatedProjects = projectManager.getAllProjects();
        this.broadcast({
          type: 'projects_update',
          data: updatedProjects
        });

      } catch (error) {
        logger.error('Failed to update project statuses', { error: error.message });
      }
    }, 30000); // 30 seconds

    logger.info('📡 Started periodic status updates (30s interval)');
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Failed to send WebSocket message', { error: error.message });
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });

    if (sentCount > 0) {
      logger.debug(`Broadcast message to ${sentCount} clients`, { type: message.type });
    }
  }

  async shutdown(signal) {
    logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);

    // Close WebSocket server
    this.wss.close(() => {
      logger.info('📡 WebSocket server closed');
    });

    // Close HTTP server
    this.server.close(() => {
      logger.info('🌐 HTTP server closed');
      logger.success('👋 Laravel God Mode shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.warn('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  // Public methods for external use
  broadcastProjectUpdate(project) {
    this.broadcast({
      type: 'project_update',
      data: project
    });
  }

  broadcastProjectCreated(project) {
    this.broadcast({
      type: 'project_created',
      data: project
    });
  }

  broadcastProjectDeleted(projectName) {
    this.broadcast({
      type: 'project_deleted',
      data: { name: projectName }
    });
  }

  broadcastProjectStatusChange(projectName, status, error = null) {
    this.broadcast({
      type: 'project_status_change',
      data: { name: projectName, status, error }
    });
  }
}

// Create and start server
const server = new LaravelGodModeServer();

// Export server instance for potential testing
module.exports = server;
