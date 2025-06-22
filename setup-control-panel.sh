#!/bin/bash

# Setup script for Laravel Docker Control Panel
echo "🎛️  Setting up Laravel Docker Control Panel..."

# Create control panel directory structure
echo "📁 Creating control panel directory structure..."
mkdir -p control-panel/public

# Create package.json
echo "📦 Creating package.json..."
cat > control-panel/package.json << 'EOF'
{
  "name": "laravel-docker-control-panel",
  "version": "1.0.0",
  "description": "Web-based control panel for Laravel Docker environment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "axios": "^1.5.0",
    "dotenv": "^16.3.1",
    "fs-extra": "^11.1.1",
    "chokidar": "^3.5.3",
    "dockerode": "^3.3.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "laravel",
    "docker",
    "control-panel",
    "management"
  ],
  "author": "Laravel Docker Control Panel",
  "license": "MIT"
}
EOF

echo "🔧 Creating server.js..."
cat > control-panel/server.js << 'EOF'
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const docker = new Docker();
const PORT = process.env.CONTROL_PANEL_PORT || 9000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadEnvVars() {
    try {
        const envPath = path.join(process.cwd(), '..', '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envVars = {};
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            });
            return envVars;
        }
    } catch (error) {
        console.error('Error loading .env:', error);
    }
    return {};
}

function executeMakeCommand(command, res = null, socket = null) {
    return new Promise((resolve, reject) => {
        const parentDir = path.join(process.cwd(), '..');
        exec(`make ${command}`, { cwd: parentDir }, (error, stdout, stderr) => {
            const result = {
                success: !error,
                stdout: stdout,
                stderr: stderr,
                command: `make ${command}`
            };

            if (socket) {
                socket.emit('command-result', result);
            }

            if (error) {
                reject(result);
            } else {
                resolve(result);
            }
        });
    });
}

async function getContainerStatus() {
    try {
        const containers = await docker.listContainers({ all: true });
        const projectContainers = containers.filter(container =>
            container.Names.some(name =>
                name.includes('laravel') ||
                name.includes('mysql') ||
                name.includes('redis') ||
                name.includes('phpmyadmin') ||
                name.includes('mailhog')
            )
        );

        return projectContainers.map(container => ({
            id: container.Id.substring(0, 12),
            name: container.Names[0].substring(1),
            image: container.Image,
            state: container.State,
            status: container.Status,
            ports: container.Ports.map(port => ({
                private: port.PrivatePort,
                public: port.PublicPort,
                type: port.Type
            }))
        }));
    } catch (error) {
        console.error('Error getting container status:', error);
        return [];
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', async (req, res) => {
    try {
        const envVars = loadEnvVars();
        const containers = await getContainerStatus();
        const runningContainers = containers.filter(c => c.state === 'running');

        res.json({
            environment: envVars,
            containers: containers,
            stats: {
                containers: {
                    total: containers.length,
                    running: runningContainers.length,
                    stopped: containers.length - runningContainers.length
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/command', async (req, res) => {
    try {
        const { command } = req.body;
        const result = await executeMakeCommand(command);
        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post('/api/env', async (req, res) => {
    try {
        const { key, value } = req.body;
        const envPath = path.join(process.cwd(), '..', '.env');

        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
            fs.writeFileSync(envPath, envContent);
            res.json({ success: true, message: 'Environment variable updated' });
        } else {
            res.status(404).json({ error: '.env file not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

io.on('connection', (socket) => {
    console.log('Client connected to control panel');

    socket.on('execute-command', async (command) => {
        try {
            await executeMakeCommand(command, null, socket);
        } catch (error) {
            socket.emit('command-error', error);
        }
    });

    socket.on('get-real-time-logs', (service) => {
        const parentDir = path.join(process.cwd(), '..');
        const logProcess = spawn('docker', ['compose', 'logs', '-f', service], { cwd: parentDir });

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

        socket.on('disconnect', () => {
            logProcess.kill();
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from control panel');
    });
});

server.listen(PORT, () => {
    console.log(`🎛️  Laravel Docker Control Panel running at http://localhost:${PORT}`);
    console.log(`🚀 Open your browser and start managing your Laravel application!`);
});
EOF

echo "🌐 Creating index.html..."
# Note: You'll need to copy the HTML content from the artifacts above

echo "⚡ Creating app.js..."
# Note: You'll need to copy the JavaScript content from the artifacts above

echo "📦 Installing Node.js dependencies..."
cd control-panel
npm install

echo ""
echo "✅ Control panel setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the HTML content to control-panel/public/index.html"
echo "2. Copy the JavaScript content to control-panel/public/app.js"
echo "3. Run: make control"
echo "4. Open: http://localhost:9000"
echo ""
echo "🚀 Enjoy your web-based Laravel Docker control panel!"
