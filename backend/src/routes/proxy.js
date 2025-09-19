const express = require('express');
const http = require('http');
const httpProxy = require('http-proxy-middleware');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Store proxy server instance and configuration
let proxyServer = null;
let proxyConfig = {
    isRunning: false,
    port: 80,
    domains: {} // domain -> target port mapping
};

// Configuration file path
const configPath = path.join(__dirname, '../../../data/proxy-config.json');

// Load proxy configuration from file
async function loadProxyConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const loaded = JSON.parse(data);
        proxyConfig = { ...proxyConfig, ...loaded };
    } catch (error) {
        // File doesn't exist or is invalid, use defaults
        console.log('No proxy config found, using defaults');
    }
}

// Save proxy configuration to file
async function saveProxyConfig() {
    try {
        await fs.writeFile(configPath, JSON.stringify(proxyConfig, null, 2));
    } catch (error) {
        console.error('Failed to save proxy config:', error);
    }
}

// Create proxy middleware for a specific domain
function createProxyMiddleware(targetPort) {
    return httpProxy.createProxyMiddleware({
        target: `http://localhost:${targetPort}`,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        onError: (err, req, res) => {
            console.error(`Proxy error for ${req.headers.host}:`, err.message);
            if (!res.headersSent) {
                res.status(502).send(`
                    <h1>Bad Gateway</h1>
                    <p>Could not connect to the application on port ${targetPort}</p>
                    <p>Make sure your project is running.</p>
                `);
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying ${req.headers.host}${req.url} -> localhost:${targetPort}`);
        }
    });
}

// Start the proxy server
async function startProxyServer() {
    if (proxyServer) {
        console.log('Proxy server already running');
        return { success: true, message: 'Proxy server already running' };
    }

    try {
        const app = express();

        // Add middleware to route based on domain
        app.use((req, res, next) => {
            const host = req.headers.host;
            const domain = host ? host.split(':')[0] : null;

            if (domain && proxyConfig.domains[domain]) {
                const targetPort = proxyConfig.domains[domain];
                const proxy = createProxyMiddleware(targetPort);
                proxy(req, res, next);
            } else {
                res.status(404).send(`
                    <h1>Domain Not Found</h1>
                    <p>No configuration found for domain: ${domain}</p>
                    <p>Configured domains:</p>
                    <ul>
                        ${Object.keys(proxyConfig.domains).map(d =>
                            `<li>${d} → localhost:${proxyConfig.domains[d]}</li>`
                        ).join('')}
                    </ul>
                `);
            }
        });

        proxyServer = http.createServer(app);

        await new Promise((resolve, reject) => {
            proxyServer.listen(proxyConfig.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        proxyConfig.isRunning = true;
        await saveProxyConfig();

        console.log(`Proxy server started on port ${proxyConfig.port}`);
        return {
            success: true,
            message: `Proxy server started on port ${proxyConfig.port}`,
            port: proxyConfig.port,
            domains: proxyConfig.domains
        };

    } catch (error) {
        proxyServer = null;
        proxyConfig.isRunning = false;

        if (error.code === 'EACCES') {
            return {
                success: false,
                error: 'Permission denied. Port 80 requires sudo privileges.',
                requiresSudo: true
            };
        } else if (error.code === 'EADDRINUSE') {
            return {
                success: false,
                error: `Port ${proxyConfig.port} is already in use. Please stop other services using this port.`,
                portInUse: true
            };
        } else {
            return {
                success: false,
                error: `Failed to start proxy server: ${error.message}`
            };
        }
    }
}

// Stop the proxy server
async function stopProxyServer() {
    if (!proxyServer) {
        return { success: true, message: 'Proxy server not running' };
    }

    try {
        await new Promise((resolve) => {
            proxyServer.close(resolve);
        });

        proxyServer = null;
        proxyConfig.isRunning = false;
        await saveProxyConfig();

        console.log('Proxy server stopped');
        return { success: true, message: 'Proxy server stopped' };

    } catch (error) {
        return {
            success: false,
            error: `Failed to stop proxy server: ${error.message}`
        };
    }
}

// Load configuration on startup
loadProxyConfig();

// API Routes

// Get proxy status and configuration
router.get('/status', async (req, res) => {
    res.json({
        success: true,
        data: {
            isRunning: proxyConfig.isRunning,
            port: proxyConfig.port,
            domains: proxyConfig.domains,
            domainCount: Object.keys(proxyConfig.domains).length
        }
    });
});

// Start proxy server
router.post('/start', async (req, res) => {
    const result = await startProxyServer();

    if (result.success) {
        res.json(result);
    } else {
        res.status(result.requiresSudo ? 403 : 500).json(result);
    }
});

// Stop proxy server
router.post('/stop', async (req, res) => {
    const result = await stopProxyServer();
    res.json(result);
});

// Add domain mapping
router.post('/domains', async (req, res) => {
    try {
        const { domain, port } = req.body;

        if (!domain || !port) {
            return res.status(400).json({
                success: false,
                error: 'Domain and port are required'
            });
        }

        // Validate port
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return res.status(400).json({
                success: false,
                error: 'Port must be a valid number between 1 and 65535'
            });
        }

        // Add domain mapping
        proxyConfig.domains[domain] = portNum;
        await saveProxyConfig();

        // If proxy is running, we need to restart it to pick up new config
        if (proxyConfig.isRunning) {
            console.log('Restarting proxy server to apply new domain mapping...');
            await stopProxyServer();
            await startProxyServer();
        }

        res.json({
            success: true,
            message: `Domain ${domain} mapped to port ${port}`,
            data: {
                domain,
                port: portNum,
                isRunning: proxyConfig.isRunning
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to add domain mapping: ${error.message}`
        });
    }
});

// Remove domain mapping
router.delete('/domains/:domain', async (req, res) => {
    try {
        const { domain } = req.params;

        if (!proxyConfig.domains[domain]) {
            return res.status(404).json({
                success: false,
                error: `Domain ${domain} not found in proxy configuration`
            });
        }

        delete proxyConfig.domains[domain];
        await saveProxyConfig();

        // If proxy is running, restart it to apply changes
        if (proxyConfig.isRunning) {
            console.log('Restarting proxy server to apply domain removal...');
            await stopProxyServer();
            await startProxyServer();
        }

        res.json({
            success: true,
            message: `Domain ${domain} removed from proxy configuration`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to remove domain mapping: ${error.message}`
        });
    }
});

// Get all domain mappings
router.get('/domains', async (req, res) => {
    res.json({
        success: true,
        data: proxyConfig.domains
    });
});

module.exports = router;
