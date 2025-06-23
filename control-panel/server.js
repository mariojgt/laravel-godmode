const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Import node-fetch

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

// Load environment variables from parent directory (root .env)
let rootEnv = {};
let codePath = process.env.CODE_PATH || 'src'; // Default from Makefile

function loadRootEnv() {
    try {
        const rootEnvPath = path.join(process.cwd(), '..', '.env');
        if (fs.existsSync(rootEnvPath)) {
            const envContent = fs.readFileSync(rootEnvPath, 'utf8');
            rootEnv = dotenv.parse(envContent);
            log(`Root .env loaded from ${rootEnvPath}`, 'info');
            // Update CODE_PATH if it exists in the root .env
            if (rootEnv.CODE_PATH) {
                codePath = rootEnv.CODE_PATH;
                log(`Server's CODE_PATH updated to: ${codePath}`, 'info');
            }
        } else {
            log('Root .env file not found.', 'warning');
            rootEnv = {};
        }
    } catch (error) {
        log(`Error loading root .env file: ${error.message}`, 'error');
        rootEnv = {};
    }
}

// Initial load of environment variables
loadRootEnv();

// Helper to get Laravel version
async function getLaravelVersion() {
    return new Promise((resolve) => {
        exec(`docker compose exec -T app php artisan --version`, { cwd: path.join(__dirname, '..') }, (error, stdout) => {
            if (error) {
                // Check if the error is due to container not running or command failing
                log(`Could not get Laravel version: ${error.message.trim()}`, 'warning');
                resolve('N/A (Container not running or command failed)');
            } else {
                const match = stdout.match(/Laravel Framework (\S+)/);
                resolve(match ? match[1] : 'N/A');
            }
        });
    }).catch(err => {
        log(`Unhandled error in getLaravelVersion: ${err.message}`, 'error');
        return 'N/A';
    });
}

// Helper to get PHP version
async function getPhpVersion() {
    return new Promise((resolve) => {
        exec(`docker compose exec -T app php -r "echo PHP_VERSION;"`, { cwd: path.join(__dirname, '..') }, (error, stdout) => {
            if (error) {
                log(`Could not get PHP version: ${error.message.trim()}`, 'warning');
                resolve('N/A (Container not running or command failed)');
            } else {
                resolve(stdout.trim());
            }
        });
    }).catch(err => {
        log(`Unhandled error in getPhpVersion: ${err.message}`, 'error');
        return 'N/A';
    });
}


// ==============================================================================
// SOCKET.IO COMMAND EXECUTION
// ==============================================================================

let currentCommandProcess = null; // To keep track of the currently running command

io.on('connection', (socket) => {
    log('A user connected', 'info');

    // Get comprehensive status for dashboard
    socket.on('get-status', async () => {
        try {
            loadRootEnv(); // Ensure latest CODE_PATH and rootEnv are loaded

            const laravelVersion = await getLaravelVersion();
            const phpVersion = await getPhpVersion();

            // Get general Docker info (more robust parsing)
            let dockerInfo = {};
            try {
                const [stdoutInfo, stderrInfo] = await new Promise((resolve, reject) => {
                    exec('docker info --format "{{json .}}"', (error, stdout, stderr) => {
                        if (error) return reject(new Error(`Docker info failed: ${stderr.trim()}`));
                        resolve([stdout, stderr]);
                    });
                });
                dockerInfo = JSON.parse(stdoutInfo || '{}');
            } catch (e) {
                log(`Error getting or parsing docker info: ${e.message}`, 'error');
                dockerInfo = { ServerStatus: 'stopped', Images: 0, Volumes: { Used: 0 } }; // Fallback
            }

            // Get container list with more details
            let containers = [];
            try {
                const [stdoutPs, stderrPs] = await new Promise((resolve, reject) => {
                    exec('docker compose ps --format json', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
                        if (error) {
                            log(`Docker compose ps error: ${stderr.trim()}`, 'warning');
                            // Attempt to extract JSON even if there's stderr, or fall back to empty array
                            const jsonMatch = stdout.match(/\[.*\]/s); // Regex to find array-like JSON
                            if (jsonMatch) {
                                try {
                                    return resolve([jsonMatch[0], stderr]);
                                } catch (parseErr) {
                                    log(`Failed to parse extracted JSON from docker compose ps: ${parseErr.message}`, 'error');
                                    return resolve(['[]', stderr]);
                                }
                            }
                            return resolve(['[]', stderr]); // Resolve with empty array string if no JSON found
                        }
                        resolve([stdout, stderr]);
                    });
                });
                containers = JSON.parse(stdoutPs || '[]');
            } catch (e) {
                log(`Error parsing docker compose ps output: ${e.message}. Raw output leading to error: "${stdoutPs}"`, 'error');
                containers = [];
            }


            let runningContainers = 0;
            let pausedContainers = 0;
            let stoppedContainers = 0;
            const serviceStatus = {};

            containers.forEach(c => {
                const serviceName = c.Service; // Docker Compose 2.x uses Service property
                serviceStatus[serviceName] = c.State;

                if (c.State === 'running') {
                    runningContainers++;
                } else if (c.State === 'paused') {
                    pausedContainers++;
                } else { // Includes exited, dead, etc.
                    stoppedContainers++;
                }
            });

            // Fallback for dockerInfo.Volumes.Used if it's not structured as expected
            const totalImages = dockerInfo.Images || 0;
            const totalVolumes = dockerInfo.Volumes && dockerInfo.Volumes.Used !== undefined ? dockerInfo.Volumes.Used : 0;

            const dockerStatus = dockerInfo.ServerStatus && dockerInfo.ServerStatus.toLowerCase() === 'running' ? 'running' : 'stopped'; // Simple interpretation

            socket.emit('status-update', {
                docker: {
                    status: dockerStatus,
                    runningContainers,
                    pausedContainers,
                    stoppedContainers,
                    images: totalImages,
                    volumes: totalVolumes,
                    serviceStatus // Detailed service status
                },
                environment: rootEnv, // Pass loaded root environment variables
                project: {
                    name: rootEnv.APP_NAME || 'Laravel Project',
                    path: path.join(process.cwd(), '..', codePath),
                    laravelVersion: laravelVersion,
                    phpVersion: phpVersion
                }
            });

            // Also emit detailed docker compose ps for the overview cards
            socket.emit('docker-stats-update', containers);

        } catch (error) {
            log(`Error getting comprehensive status: ${error.message}`, 'error');
            socket.emit('status-update', {
                docker: { status: 'error', runningContainers: 0, pausedContainers: 0, stoppedContainers: 0, images: 0, volumes: 0, serviceStatus: {} },
                environment: {},
                project: { name: 'Error', path: 'Error', laravelVersion: 'Error', phpVersion: 'Error' }
            });
            socket.emit('docker-stats-update', []); // Send empty array on error
        }
    });

    socket.on('execute-command', (command) => {
        if (currentCommandProcess) {
            socket.emit('command-error', { message: 'Another command is already running. Please wait.' });
            return;
        }

        log(`Executing command: make ${command}`, 'info');
        socket.emit('command-output', `\x1b[34m\n>>> Executing: make ${command}\n\x1b[0m`); // Blue color for command output

        currentCommandProcess = spawn('make', [command], {
            cwd: path.join(__dirname, '..'), // Execute make from the parent directory
            env: { ...process.env, ...rootEnv } // Pass root .env vars to make process
        });

        currentCommandProcess.stdout.on('data', (data) => {
            socket.emit('command-output', data.toString());
        });

        currentCommandProcess.stderr.on('data', (data) => {
            socket.emit('command-output', `\x1b[31m${data.toString()}\x1b[0m`); // Red color for stderr
        });

        currentCommandProcess.on('close', (code) => {
            log(`Command 'make ${command}' exited with code ${code}`, code === 0 ? 'success' : 'error');
            socket.emit('command-complete', { statusCode: code, command: command.split(' ')[0] }); // Send command info back
            currentCommandProcess = null;
        });

        currentCommandProcess.on('error', (err) => {
            log(`Failed to start command 'make ${command}': ${err.message}`, 'error');
            socket.emit('command-error', { message: `Failed to start command: ${err.message}` });
            currentCommandProcess = null;
        });
    });

    // ==============================================================================
    // LOG STREAMING VIA SOCKETS
    // ==============================================================================

    let logProcess = null;

    socket.on('start-log-stream', (serviceName) => {
        if (logProcess) {
            log(`Log stream for ${serviceName} already active, stopping old one.`, 'warning');
            logProcess.kill();
        }

        const dockerComposePath = path.join(__dirname, '..'); // Path to docker-compose.yml

        if (serviceName === 'app') {
            // For 'app' service, tail specific log files from within the container
            // Using `bash -c` to combine multiple `tail -f` commands
            const tailCommand = `tail -f /var/www/html/storage/logs/laravel.log /var/log/nginx/error.log /var/log/supervisor/*.log`;
            logProcess = spawn('docker', ['compose', 'exec', '--no-TTY', 'app', 'bash', '-c', tailCommand], { cwd: dockerComposePath, shell: true });
        } else {
            // For other services, use standard 'docker compose logs -f'
            logProcess = spawn('docker', ['compose', 'logs', '-f', serviceName], { cwd: dockerComposePath });
        }

        log(`Starting log stream for service: ${serviceName}`, 'info');

        logProcess.stdout.on('data', (data) => {
            socket.emit('log-output', data.toString());
        });

        logProcess.stderr.on('data', (data) => {
            socket.emit('log-output', `\x1b[31m${data.toString()}\x1b[0m`); // Red for stderr logs
        });

        logProcess.on('close', (code) => {
            log(`Log stream for ${serviceName} closed with code ${code}`, code === 0 ? 'info' : 'error');
            socket.emit('log-stream-closed', { service: serviceName, code: code });
            logProcess = null;
        });

        logProcess.on('error', (err) => {
            log(`Error starting log stream for ${serviceName}: ${err.message}`, 'error');
            socket.emit('log-stream-error', { service: serviceName, message: err.message });
            if (logProcess) logProcess.kill();
            logProcess = null;
        });
    });

    socket.on('stop-log-stream', () => {
        if (logProcess) {
            log('Stopping log stream', 'info');
            logProcess.kill();
            logProcess = null;
        } else {
            log('No active log stream to stop', 'info');
        }
    });

    // ==============================================================================
    // .ENV FILE EDITING
    // ==============================================================================

    socket.on('get-env-content', async ({ type }) => {
        let filePath = '';
        let currentCodePathForLaravelEnv = codePath; // Use the current CODE_PATH

        if (type === 'root') {
            filePath = path.join(__dirname, '..', '.env');
        } else if (type === 'laravel') {
            // Ensure CODE_PATH is up-to-date from the root .env before determining Laravel path
            loadRootEnv();
            currentCodePathForLaravelEnv = codePath; // Update in case loadRootEnv changed it
            filePath = path.join(process.cwd(), '..', currentCodePathForLaravelEnv, '.env');
        } else {
            socket.emit('env-error', { type, message: 'Invalid .env file type specified.' });
            return;
        }

        try {
            if (fs.existsSync(filePath)) {
                const content = await fs.readFile(filePath, 'utf8');
                socket.emit('env-content', { type, content, currentCodePath: currentCodePathForLaravelEnv });
                log(`Fetched ${type} .env content from ${filePath}`, 'info');
            } else {
                const errorMessage = `${type} .env file not found at ${filePath}.`;
                socket.emit('env-error', { type, message: errorMessage });
                log(errorMessage, 'warning');
            }
        } catch (error) {
            const errorMessage = `Error reading ${type} .env file: ${error.message}`;
            socket.emit('env-error', { type, message: errorMessage });
            log(errorMessage, 'error');
        }
    });

    socket.on('save-env-content', async ({ type, content }) => {
        let filePath = '';
        if (type === 'root') {
            filePath = path.join(__dirname, '..', '.env');
        } else if (type === 'laravel') {
            loadRootEnv(); // Ensure CODE_PATH is up-to-date
            filePath = path.join(process.cwd(), '..', codePath, '.env');
        } else {
            socket.emit('env-save-error', { type, message: 'Invalid .env file type specified.' });
            return;
        }

        try {
            await fs.writeFile(filePath, content, 'utf8');
            socket.emit('env-saved', { type });
            log(`Saved ${type} .env content to ${filePath}`, 'success');

            // If root .env was saved, reload it in the server process
            if (type === 'root') {
                loadRootEnv(); // This will update the server's `codePath` variable
            }
        } catch (error) {
            const errorMessage = `Error writing ${type} .env file: ${error.message}`;
            socket.emit('env-save-error', { type, message: errorMessage });
            log(errorMessage, 'error');
        }
    });

    // ==============================================================================
    // URL HEALTH CHECKS
    // ==============================================================================

    socket.on('check-urls', async (urls) => {
        for (const urlInfo of urls) {
            try {
                const startTime = process.hrtime.bigint();
                // Using node-fetch with a timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(urlInfo.url, { signal: controller.signal, redirect: 'follow' });
                clearTimeout(timeoutId);

                const endTime = process.hrtime.bigint();
                const durationMs = parseInt((endTime - startTime) / 1_000_000n);

                if (response.ok) {
                    socket.emit('url-status-update', { id: urlInfo.id, status: 'online', time: `${durationMs}ms` });
                } else {
                    socket.emit('url-status-update', { id: urlInfo.id, status: 'offline', error: `HTTP Status: ${response.status}` });
                }
            } catch (error) {
                // Handle various fetch errors (network, timeout, etc.)
                let errorMessage = error.message;
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out';
                }
                socket.emit('url-status-update', { id: urlInfo.id, status: 'offline', error: errorMessage });
            }
        }
    });

    // ==============================================================================
    // Project Path Information
    // ==============================================================================
    socket.on('get-path-info', async () => {
        loadRootEnv(); // Ensure codePath is most recent from root .env

        const currentPath = process.cwd();
        const projectRootPath = path.join(currentPath, '..'); // Assuming project root is parent of control-panel
        const defaultCodePath = 'src'; // Default from Makefile

        let message = '';
        const effectiveCodePath = codePath; // The actual CODE_PATH derived from .env or default

        const fullProjectPath = path.join(projectRootPath, effectiveCodePath);
        const laravelComposerJson = path.join(fullProjectPath, 'composer.json');
        const laravelArtisan = path.join(fullProjectPath, 'artisan');

        if (!fs.existsSync(fullProjectPath)) {
            message = `Warning: The configured project path '${effectiveCodePath}' (resolved to ${fullProjectPath}) does not exist on the host.`;
        } else if (!fs.existsSync(laravelComposerJson)) {
            message = `Warning: No Laravel project detected at '${fullProjectPath}'. 'composer.json' not found.`;
        } else if (!fs.existsSync(laravelArtisan)) {
            message = `Warning: 'artisan' command not found at '${fullProjectPath}'.`;
        } else {
            message = `Laravel project detected and accessible at '${fullProjectPath}'.`;
        }

        socket.emit('path-info', {
            currentPath: projectRootPath, // Show the actual directory where docker-compose.yml is
            codePathEnv: effectiveCodePath,
            defaultPath: defaultCodePath,
            message: message
        });
    });


    socket.on('disconnect', () => {
        log('User disconnected', 'info');
        if (logProcess) {
            logProcess.kill();
            logProcess = null;
        }
        if (currentCommandProcess) {
            currentCommandProcess.kill();
            currentCommandProcess = null;
        }
    });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// Error handling for server process
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
    log(`📁 Project directory (CODE_PATH): ${path.join(process.cwd(), '..', codePath)}`, 'info');
    log('🚀 Backend initialized. Open your browser to start managing!', 'success');
});
