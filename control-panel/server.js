const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const docker = new Docker();
const PORT = process.env.CONTROL_PANEL_PORT || 9000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enhanced logging
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type] || colors.info}[${timestamp}] ${message}${reset}`);
}

// Load environment variables from parent directory
function loadEnvVars() {
    try {
        const envPath = path.join(process.cwd(), '..', '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envVars = {};
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    // Remove quotes if present
                    envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
                }
            });
            return envVars;
        }
    } catch (error) {
        log(`Error loading .env: ${error.message}`, 'error');
    }
    return {};
}

// Execute make commands in parent directory with enhanced error handling
function executeMakeCommand(command, socket = null) {
    return new Promise((resolve, reject) => {
        const parentDir = path.join(process.cwd(), '..');
        log(`Executing: make ${command}`, 'info');

        const startTime = Date.now();
        const childProcess = exec(`make ${command}`, {
            cwd: parentDir,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            timeout: 300000 // 5 minute timeout
        }, (error, stdout, stderr) => {
            const executionTime = Date.now() - startTime;

            const result = {
                success: !error,
                stdout: stdout,
                stderr: stderr,
                command: `make ${command}`,
                executionTime: executionTime,
                timestamp: new Date().toISOString()
            };

            if (socket) {
                socket.emit('command-result', result);
            }

            if (error) {
                log(`Command failed: make ${command} (${executionTime}ms)`, 'error');
                log(`Error: ${error.message}`, 'error');
                reject(result);
            } else {
                log(`Command completed: make ${command} (${executionTime}ms)`, 'success');
                resolve(result);
            }
        });

        // Handle process events
        childProcess.on('error', (error) => {
            log(`Process error: ${error.message}`, 'error');
        });
    });
}

// Get enhanced Docker container status
async function getContainerStatus() {
    try {
        const containers = await docker.listContainers({ all: true });
        const projectContainers = containers.filter(container =>
            container.Names.some(name =>
                name.includes('laravel') ||
                name.includes('mysql') ||
                name.includes('redis') ||
                name.includes('phpmyadmin') ||
                name.includes('mailhog') ||
                name.includes('nginx') ||
                name.toLowerCase().includes('app')
            )
        );

        return projectContainers.map(container => {
            const name = container.Names[0].substring(1);
            const isRunning = container.State === 'running';

            return {
                id: container.Id.substring(0, 12),
                name: name,
                image: container.Image,
                state: container.State,
                status: container.Status,
                created: container.Created,
                ports: container.Ports.map(port => ({
                    private: port.PrivatePort,
                    public: port.PublicPort,
                    type: port.Type,
                    ip: port.IP || '0.0.0.0'
                })),
                labels: container.Labels,
                health: isRunning ? 'healthy' : 'stopped'
            };
        });
    } catch (error) {
        log(`Error getting container status: ${error.message}`, 'error');
        return [];
    }
}

// Get system statistics
async function getSystemStats() {
    try {
        const containers = await getContainerStatus();
        const runningContainers = containers.filter(c => c.state === 'running');

        // Get Docker system info
        let dockerInfo = {};
        try {
            dockerInfo = await docker.info();
        } catch (error) {
            log(`Could not get Docker info: ${error.message}`, 'warning');
        }

        return {
            containers: {
                total: containers.length,
                running: runningContainers.length,
                stopped: containers.length - runningContainers.length
            },
            docker: {
                version: dockerInfo.ServerVersion || 'Unknown',
                containers: dockerInfo.Containers || 0,
                images: dockerInfo.Images || 0,
                memTotal: dockerInfo.MemTotal || 0,
                cpus: dockerInfo.NCPU || 0
            },
            system: {
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
    } catch (error) {
        log(`Error getting system stats: ${error.message}`, 'error');
        return {
            containers: { total: 0, running: 0, stopped: 0 },
            docker: {},
            system: {}
        };
    }
}

// Get available Makefile commands
async function getMakefileCommands() {
    try {
        const parentDir = path.join(process.cwd(), '..');
        const makefilePath = path.join(parentDir, 'Makefile');

        if (!fs.existsSync(makefilePath)) {
            return [];
        }

        const makefileContent = fs.readFileSync(makefilePath, 'utf8');
        const commands = [];

        // Parse Makefile for targets with descriptions
        const lines = makefileContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('##')) {
                const match = line.match(/^([a-zA-Z_-]+):\s*.*?##\s*(.+)$/);
                if (match) {
                    commands.push({
                        name: match[1],
                        description: match[2].trim()
                    });
                }
            }
        }

        return commands;
    } catch (error) {
        log(`Error parsing Makefile: ${error.message}`, 'error');
        return [];
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced status endpoint
app.get('/api/status', async (req, res) => {
    try {
        const startTime = Date.now();

        const [envVars, containers, stats] = await Promise.all([
            Promise.resolve(loadEnvVars()),
            getContainerStatus(),
            getSystemStats()
        ]);

        const responseTime = Date.now() - startTime;

        res.json({
            environment: envVars,
            containers: containers,
            stats: stats,
            responseTime: responseTime,
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });

        log(`Status request completed in ${responseTime}ms`, 'info');
    } catch (error) {
        log(`Status endpoint error: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Enhanced command execution endpoint
app.post('/api/command', async (req, res) => {
    try {
        const { command, args } = req.body;

        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }

        // Sanitize command to prevent injection
        const sanitizedCommand = command.replace(/[;&|`$()]/g, '');
        const fullCommand = args ? `${sanitizedCommand} ${args}` : sanitizedCommand;

        const result = await executeMakeCommand(fullCommand);
        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

// Environment variable management
app.post('/api/env', async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }

        const envPath = path.join(process.cwd(), '..', '.env');

        if (!fs.existsSync(envPath)) {
            return res.status(404).json({ error: '.env file not found' });
        }

        let envContent = fs.readFileSync(envPath, 'utf8');

        // Update or add the environment variable
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
            log(`Updated environment variable: ${key}`, 'info');
        } else {
            envContent += `\n${key}=${value}`;
            log(`Added environment variable: ${key}`, 'info');
        }

        // Create backup
        const backupPath = `${envPath}.backup.${Date.now()}`;
        fs.copyFileSync(envPath, backupPath);

        fs.writeFileSync(envPath, envContent);

        res.json({
            success: true,
            message: 'Environment variable updated',
            backup: backupPath
        });
    } catch (error) {
        log(`Environment update error: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Enhanced logs endpoint
app.get('/api/logs/:service', (req, res) => {
    const { service } = req.params;
    const { lines = 100, follow = false } = req.query;

    const parentDir = path.join(process.cwd(), '..');
    const command = follow ?
        `docker compose logs -f --tail=${lines} ${service}` :
        `docker compose logs --tail=${lines} ${service}`;

    if (follow) {
        // For real-time logs, use streaming
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const logProcess = spawn('docker', ['compose', 'logs', '-f', '--tail', lines, service], {
            cwd: parentDir
        });

        logProcess.stdout.on('data', (data) => {
            res.write(data);
        });

        logProcess.stderr.on('data', (data) => {
            res.write(`ERROR: ${data}`);
        });

        logProcess.on('close', () => {
            res.end();
        });

        req.on('close', () => {
            logProcess.kill();
        });
    } else {
        exec(command, { cwd: parentDir }, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            res.json({
                service: service,
                logs: stdout,
                stderr: stderr,
                timestamp: new Date().toISOString()
            });
        });
    }
});

// Get available commands
app.get('/api/commands', async (req, res) => {
    try {
        const commands = await getMakefileCommands();
        res.json({ commands });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System information endpoint
app.get('/api/system', async (req, res) => {
    try {
        const stats = await getSystemStats();
        const envVars = loadEnvVars();

        res.json({
            system: stats.system,
            docker: stats.docker,
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                controlPanelPort: PORT,
                ...envVars
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.io connection handling with enhanced features
io.on('connection', (socket) => {
    const clientId = socket.id.substring(0, 8);
    log(`Client connected: ${clientId}`, 'info');

    // Send welcome message
    socket.emit('welcome', {
        message: 'Connected to Laravel Docker Control Panel',
        version: '2.0.0',
        features: ['Real-time logs', 'Command execution', 'Container monitoring']
    });

    // Handle command execution
    socket.on('execute-command', async (command) => {
        try {
            log(`Client ${clientId} executing: ${command}`, 'info');
            await executeMakeCommand(command, socket);
        } catch (error) {
            log(`Command execution failed for client ${clientId}: ${error.message}`, 'error');
            socket.emit('command-error', {
                error: error.message,
                command: command,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle real-time logs
    socket.on('get-real-time-logs', (service) => {
        log(`Client ${clientId} requesting logs for: ${service}`, 'info');

        const parentDir = path.join(process.cwd(), '..');
        const logProcess = spawn('docker', ['compose', 'logs', '-f', '--tail', '50', service], {
            cwd: parentDir
        });

        // Store process reference for cleanup
        socket.logProcess = logProcess;

        logProcess.stdout.on('data', (data) => {
            socket.emit('log-data', {
                service: service,
                data: data.toString(),
                timestamp: new Date().toISOString()
            });
        });

        logProcess.stderr.on('data', (data) => {
            socket.emit('log-error', {
                service: service,
                error: data.toString(),
                timestamp: new Date().toISOString()
            });
        });

        logProcess.on('close', (code) => {
            socket.emit('log-closed', {
                service: service,
                code: code,
                timestamp: new Date().toISOString()
            });
        });

        logProcess.on('error', (error) => {
            socket.emit('log-error', {
                service: service,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
    });

    // Handle log stop
    socket.on('stop-logs', () => {
        if (socket.logProcess) {
            socket.logProcess.kill();
            socket.logProcess = null;
            log(`Stopped logs for client ${clientId}`, 'info');
        }
    });

    // Handle status requests
    socket.on('get-status', async () => {
        try {
            const [envVars, containers, stats] = await Promise.all([
                Promise.resolve(loadEnvVars()),
                getContainerStatus(),
                getSystemStats()
            ]);

            socket.emit('status-update', {
                environment: envVars,
                containers: containers,
                stats: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            socket.emit('status-error', { error: error.message });
        }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        log(`Client disconnected: ${clientId} (${reason})`, 'info');

        // Clean up any running processes
        if (socket.logProcess) {
            socket.logProcess.kill();
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        log(`Socket error for client ${clientId}: ${error.message}`, 'error');
    });
});

// Periodic status broadcast to all connected clients
setInterval(async () => {
    if (io.engine.clientsCount > 0) {
        try {
            const stats = await getSystemStats();
            io.emit('stats-broadcast', {
                stats: stats,
                timestamp: new Date().toISOString(),
                connectedClients: io.engine.clientsCount
            });
        } catch (error) {
            log(`Stats broadcast error: ${error.message}`, 'error');
        }
    }
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully', 'info');
    server.close(() => {
        log('Server closed', 'info');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully', 'info');
    server.close(() => {
        log('Server closed', 'info');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, 'error');
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
});

// Start server
server.listen(PORT, () => {
    log('='.repeat(60), 'info');
    log('🎛️  Laravel Docker Control Panel v2.0.0', 'success');
    log('='.repeat(60), 'info');
    log(`🌐 Server running at: http://localhost:${PORT}`, 'success');
    log(`📁 Working directory: ${process.cwd()}`, 'info');
    log(`📁 Project directory: ${path.join(process.cwd(), '..')}`, 'info');
    log(`🐳 Docker support: ${docker ? 'Enabled' : 'Disabled'}`, 'info');
    log(`📊 Real-time monitoring: Enabled`, 'info');
    log(`🔧 Complete Makefile integration: Enabled`, 'info');
    log('='.repeat(60), 'info');
    log('🚀 Open your browser and start managing your Laravel application!', 'success');
    log('💡 Features: All Makefile commands, real-time logs, modern UI', 'info');
    log('='.repeat(60), 'info');
});

module.exports = app;
