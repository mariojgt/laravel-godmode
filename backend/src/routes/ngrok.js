const express = require('express');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Store active tunnels and processes
let activeTunnels = new Map();
let ngrokProcesses = new Map();
let ngrokConfig = {
    authToken: null,
    isAuthenticated: false
};

// Configuration file path
const configPath = path.join(__dirname, '../../../data/ngrok-config.json');

// Load ngrok configuration
async function loadNgrokConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const loaded = JSON.parse(data);
        ngrokConfig = { ...ngrokConfig, ...loaded };
    } catch (error) {
        console.log('No ngrok config found, using defaults');
    }
}

// Save ngrok configuration
async function saveNgrokConfig() {
    try {
        await fs.writeFile(configPath, JSON.stringify(ngrokConfig, null, 2));
    } catch (error) {
        console.error('Failed to save ngrok config:', error);
    }
}

// Check if ngrok is installed
function checkNgrokInstallation() {
    try {
        execSync('ngrok version', { stdio: 'pipe' });
        return { installed: true };
    } catch (error) {
        return {
            installed: false,
            installInstructions: {
                title: 'Ngrok Installation Required',
                steps: [
                    'Visit https://ngrok.com/download',
                    'Download ngrok for your platform',
                    'Extract and move to PATH (e.g., /usr/local/bin)',
                    'Or use package manager: brew install ngrok (macOS) or snap install ngrok (Linux)'
                ],
                note: 'Ngrok is required to create secure tunnels to your local development server.'
            }
        };
    }
}

// Authenticate ngrok with auth token
async function authenticateNgrok(authToken) {
    try {
        execSync(`ngrok config add-authtoken ${authToken}`, { stdio: 'pipe' });
        ngrokConfig.authToken = authToken;
        ngrokConfig.isAuthenticated = true;
        await saveNgrokConfig();
        return { success: true, message: 'Ngrok authenticated successfully' };
    } catch (error) {
        return { 
            success: false, 
            error: 'Failed to authenticate ngrok',
            details: error.message 
        };
    }
}

// Create ngrok tunnel
async function createTunnel(port, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            subdomain = null,
            region = 'us',
            protocol = 'http',
            name = `tunnel-${port}-${Date.now()}`
        } = options;

        // Build ngrok command
        let command = ['ngrok', protocol, port.toString()];
        
        if (subdomain) {
            command.push('--subdomain', subdomain);
        }
        
        if (region) {
            command.push('--region', region);
        }

        command.push('--log', 'stdout');

        console.log('Starting ngrok with command:', command.join(' '));

        const ngrokProcess = spawn(command[0], command.slice(1), {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let tunnelInfo = null;
        let setupComplete = false;

        // Handle stdout for tunnel information
        ngrokProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Ngrok stdout:', output);

            // Parse tunnel URL from output
            const urlMatch = output.match(/https:\/\/[^\s]+\.ngrok(?:-free)?\.(?:app|io)/);
            if (urlMatch && !setupComplete) {
                const publicUrl = urlMatch[0];
                tunnelInfo = {
                    id: name,
                    port: port,
                    publicUrl: publicUrl,
                    protocol: protocol,
                    region: region,
                    subdomain: subdomain,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    localUrl: `http://localhost:${port}`
                };

                activeTunnels.set(name, tunnelInfo);
                ngrokProcesses.set(name, ngrokProcess);
                setupComplete = true;
                resolve(tunnelInfo);
            }
        });

        // Handle stderr for errors
        ngrokProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.error('Ngrok stderr:', error);
            
            if (!setupComplete) {
                reject(new Error(`Ngrok error: ${error}`));
            }
        });

        // Handle process exit
        ngrokProcess.on('close', (code) => {
            console.log(`Ngrok process exited with code ${code}`);
            
            if (activeTunnels.has(name)) {
                const tunnel = activeTunnels.get(name);
                tunnel.status = 'stopped';
                activeTunnels.delete(name);
            }
            
            ngrokProcesses.delete(name);
            
            if (!setupComplete) {
                reject(new Error(`Ngrok process exited with code ${code}`));
            }
        });

        // Handle errors
        ngrokProcess.on('error', (error) => {
            console.error('Ngrok process error:', error);
            if (!setupComplete) {
                reject(error);
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!setupComplete) {
                ngrokProcess.kill();
                reject(new Error('Ngrok tunnel creation timed out'));
            }
        }, 30000);
    });
}

// Stop ngrok tunnel
function stopTunnel(tunnelId) {
    try {
        const process = ngrokProcesses.get(tunnelId);
        if (process) {
            process.kill('SIGTERM');
            ngrokProcesses.delete(tunnelId);
        }
        
        if (activeTunnels.has(tunnelId)) {
            activeTunnels.delete(tunnelId);
        }
        
        return { success: true, message: 'Tunnel stopped successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Load configuration on startup
loadNgrokConfig();

// API Routes

// Get ngrok status and configuration
router.get('/status', async (req, res) => {
    const installation = checkNgrokInstallation();
    
    res.json({
        success: true,
        data: {
            installed: installation.installed,
            isAuthenticated: ngrokConfig.isAuthenticated,
            activeTunnels: Array.from(activeTunnels.values()),
            tunnelCount: activeTunnels.size,
            installInstructions: installation.installInstructions
        }
    });
});

// Set auth token
router.post('/auth', async (req, res) => {
    try {
        const { authToken } = req.body;

        if (!authToken) {
            return res.status(400).json({
                success: false,
                error: 'Auth token is required'
            });
        }

        const installation = checkNgrokInstallation();
        if (!installation.installed) {
            return res.status(400).json({
                success: false,
                error: 'Ngrok is not installed',
                installInstructions: installation.installInstructions
            });
        }

        const result = await authenticateNgrok(authToken);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to authenticate ngrok',
            details: error.message
        });
    }
});

// Create tunnel
router.post('/tunnels', async (req, res) => {
    try {
        const { port, subdomain, region = 'us', protocol = 'http' } = req.body;

        if (!port) {
            return res.status(400).json({
                success: false,
                error: 'Port is required'
            });
        }

        const installation = checkNgrokInstallation();
        if (!installation.installed) {
            return res.status(400).json({
                success: false,
                error: 'Ngrok is not installed',
                installInstructions: installation.installInstructions
            });
        }

        if (!ngrokConfig.isAuthenticated) {
            return res.status(401).json({
                success: false,
                error: 'Ngrok authentication required',
                message: 'Please set your ngrok auth token first'
            });
        }

        const tunnelInfo = await createTunnel(port, {
            subdomain,
            region,
            protocol
        });

        res.json({
            success: true,
            data: tunnelInfo,
            message: `Tunnel created successfully: ${tunnelInfo.publicUrl}`
        });

    } catch (error) {
        console.error('Create tunnel error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create tunnel',
            details: error.message
        });
    }
});

// Get all tunnels
router.get('/tunnels', (req, res) => {
    res.json({
        success: true,
        data: Array.from(activeTunnels.values())
    });
});

// Stop tunnel
router.delete('/tunnels/:tunnelId', (req, res) => {
    try {
        const { tunnelId } = req.params;
        const result = stopTunnel(tunnelId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to stop tunnel',
            details: error.message
        });
    }
});

// Stop all tunnels
router.post('/stop-all', (req, res) => {
    try {
        let stoppedCount = 0;
        
        for (const [tunnelId] of activeTunnels) {
            const result = stopTunnel(tunnelId);
            if (result.success) {
                stoppedCount++;
            }
        }

        res.json({
            success: true,
            message: `Stopped ${stoppedCount} tunnel(s)`,
            stoppedCount
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to stop tunnels',
            details: error.message
        });
    }
});

module.exports = router;