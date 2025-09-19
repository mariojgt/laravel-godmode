const express = require('express');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Helper function to check if a command exists
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function to get version of a command
function getVersion(command, versionFlag = '--version') {
    try {
        const output = execSync(`${command} ${versionFlag}`, {
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 5000
        });
        return output.trim().split('\n')[0];
    } catch (error) {
        return null;
    }
}

// Helper function to check Docker daemon status
function isDockerRunning() {
    try {
        execSync('docker info', { stdio: 'pipe', timeout: 5000 });
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function to check if port is in use
function isPortInUse(port) {
    try {
        const output = execSync(`lsof -i :${port}`, { stdio: 'pipe', encoding: 'utf8' });
        return output.trim().length > 0;
    } catch (error) {
        return false;
    }
}

// Helper function to get installation instructions based on OS
function getInstallInstructions(dependency, os = process.platform) {
    const instructions = {
        node: {
            darwin: {
                homebrew: 'brew install node',
                download: 'Download from https://nodejs.org/',
                nvm: 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && nvm install node'
            },
            linux: {
                apt: 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs',
                snap: 'sudo snap install node --classic',
                nvm: 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && nvm install node'
            },
            win32: {
                download: 'Download from https://nodejs.org/',
                chocolatey: 'choco install nodejs',
                winget: 'winget install OpenJS.NodeJS'
            }
        },
        docker: {
            darwin: {
                download: 'Download Docker Desktop from https://docker.com/',
                homebrew: 'brew install --cask docker'
            },
            linux: {
                apt: 'sudo apt-get update && sudo apt-get install docker.io',
                script: 'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh'
            },
            win32: {
                download: 'Download Docker Desktop from https://docker.com/',
                chocolatey: 'choco install docker-desktop'
            }
        },
        composer: {
            darwin: {
                homebrew: 'brew install composer',
                download: 'curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer'
            },
            linux: {
                download: 'curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer',
                apt: 'sudo apt install composer'
            },
            win32: {
                download: 'Download from https://getcomposer.org/download/',
                chocolatey: 'choco install composer'
            }
        },
        php: {
            darwin: {
                homebrew: 'brew install php@8.3',
                xampp: 'Download XAMPP from https://www.apachefriends.org/'
            },
            linux: {
                apt: 'sudo apt install php8.3 php8.3-cli php8.3-common',
                snap: 'sudo snap install php'
            },
            win32: {
                xampp: 'Download XAMPP from https://www.apachefriends.org/',
                chocolatey: 'choco install php'
            }
        },
        git: {
            darwin: {
                xcode: 'xcode-select --install',
                homebrew: 'brew install git'
            },
            linux: {
                apt: 'sudo apt install git',
                yum: 'sudo yum install git'
            },
            win32: {
                download: 'Download from https://git-scm.com/',
                chocolatey: 'choco install git'
            }
        },
        make: {
            darwin: {
                xcode: 'xcode-select --install',
                homebrew: 'brew install make'
            },
            linux: {
                apt: 'sudo apt install build-essential',
                yum: 'sudo yum groupinstall "Development Tools"'
            },
            win32: {
                chocolatey: 'choco install make',
                msys2: 'Install MSYS2 and run: pacman -S make'
            }
        }
    };

    return instructions[dependency]?.[os] || {};
}

// Main dependencies check endpoint
router.get('/check', async (req, res) => {
    try {
        const dependencies = [];

        // Core Node.js Dependencies
        const nodeInstalled = commandExists('node');
        const nodeVersion = nodeInstalled ? getVersion('node', '--version') : null;
        dependencies.push({
            name: 'Node.js',
            category: 'Runtime',
            required: true,
            installed: nodeInstalled,
            version: nodeVersion,
            expectedVersion: '>=18.0.0',
            description: 'JavaScript runtime for backend and frontend development',
            icon: '📦',
            priority: 1,
            installMethods: getInstallInstructions('node'),
            checkCommand: 'node --version'
        });

        const npmInstalled = commandExists('npm');
        const npmVersion = npmInstalled ? getVersion('npm', '--version') : null;
        dependencies.push({
            name: 'npm',
            category: 'Package Manager',
            required: true,
            installed: npmInstalled,
            version: npmVersion,
            expectedVersion: '>=8.0.0',
            description: 'Node.js package manager',
            icon: '📦',
            priority: 2,
            installMethods: { note: 'Comes with Node.js installation' },
            checkCommand: 'npm --version'
        });

        // Docker Dependencies
        const dockerInstalled = commandExists('docker');
        const dockerVersion = dockerInstalled ? getVersion('docker', '--version') : null;
        const dockerRunning = dockerInstalled ? isDockerRunning() : false;
        dependencies.push({
            name: 'Docker',
            category: 'Containerization',
            required: true,
            installed: dockerInstalled,
            running: dockerRunning,
            version: dockerVersion,
            expectedVersion: '>=24.0.0',
            description: 'Container platform for development environments',
            icon: '🐳',
            priority: 3,
            installMethods: getInstallInstructions('docker'),
            checkCommand: 'docker --version',
            serviceCheck: 'docker info'
        });

        const dockerComposeInstalled = commandExists('docker-compose') || commandExists('docker compose');
        const dockerComposeVersion = dockerComposeInstalled ?
            (getVersion('docker-compose', '--version') || getVersion('docker compose', 'version')) : null;
        dependencies.push({
            name: 'Docker Compose',
            category: 'Containerization',
            required: true,
            installed: dockerComposeInstalled,
            version: dockerComposeVersion,
            expectedVersion: '>=2.0.0',
            description: 'Multi-container Docker application management',
            icon: '🐙',
            priority: 4,
            installMethods: { note: 'Included with Docker Desktop or install separately' },
            checkCommand: 'docker-compose --version || docker compose version'
        });

        // PHP Dependencies (for Laravel projects)
        const phpInstalled = commandExists('php');
        const phpVersion = phpInstalled ? getVersion('php', '--version') : null;
        dependencies.push({
            name: 'PHP',
            category: 'Runtime',
            required: false,
            recommended: true,
            installed: phpInstalled,
            version: phpVersion,
            expectedVersion: '>=8.2.0',
            description: 'PHP runtime for Laravel development (optional, can use Docker)',
            icon: '🐘',
            priority: 5,
            installMethods: getInstallInstructions('php'),
            checkCommand: 'php --version'
        });

        const composerInstalled = commandExists('composer');
        const composerVersion = composerInstalled ? getVersion('composer', '--version') : null;
        dependencies.push({
            name: 'Composer',
            category: 'Package Manager',
            required: false,
            recommended: true,
            installed: composerInstalled,
            version: composerVersion,
            expectedVersion: '>=2.0.0',
            description: 'PHP dependency manager (optional, can use Docker)',
            icon: '🎼',
            priority: 6,
            installMethods: getInstallInstructions('composer'),
            checkCommand: 'composer --version'
        });

        // Development Tools
        const gitInstalled = commandExists('git');
        const gitVersion = gitInstalled ? getVersion('git', '--version') : null;
        dependencies.push({
            name: 'Git',
            category: 'Version Control',
            required: true,
            installed: gitInstalled,
            version: gitVersion,
            expectedVersion: '>=2.0.0',
            description: 'Version control system',
            icon: '🌿',
            priority: 7,
            installMethods: getInstallInstructions('git'),
            checkCommand: 'git --version'
        });

        const makeInstalled = commandExists('make');
        const makeVersion = makeInstalled ? getVersion('make', '--version') : null;
        dependencies.push({
            name: 'Make',
            category: 'Build Tool',
            required: true,
            installed: makeInstalled,
            version: makeVersion,
            expectedVersion: '>=3.0',
            description: 'Build automation tool (required for Makefile commands)',
            icon: '🔨',
            priority: 8,
            installMethods: getInstallInstructions('make'),
            checkCommand: 'make --version'
        });

        // Optional but useful tools
        const curlInstalled = commandExists('curl');
        const curlVersion = curlInstalled ? getVersion('curl', '--version') : null;
        dependencies.push({
            name: 'cURL',
            category: 'Network Tool',
            required: false,
            recommended: true,
            installed: curlInstalled,
            version: curlVersion,
            description: 'Command line tool for transferring data (useful for API testing)',
            icon: '🌐',
            priority: 9,
            installMethods: {
                darwin: { note: 'Pre-installed on macOS' },
                linux: { apt: 'sudo apt install curl' },
                win32: { note: 'Pre-installed on Windows 10+' }
            },
            checkCommand: 'curl --version'
        });

        // Check common ports
        const portChecks = [
            { port: 3000, service: 'Frontend Development Server' },
            { port: 5000, service: 'Backend API Server' },
            { port: 8000, service: 'Laravel Development Server' },
            { port: 3306, service: 'MySQL Database' },
            { port: 6379, service: 'Redis Cache' },
            { port: 5173, service: 'Vite Development Server' }
        ];

        const portStatus = portChecks.map(({ port, service }) => ({
            port,
            service,
            inUse: isPortInUse(port),
            category: 'Port Check'
        }));

        // System information
        const systemInfo = {
            platform: process.platform,
            architecture: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: {
                shell: process.env.SHELL || 'Unknown',
                home: process.env.HOME || process.env.USERPROFILE || 'Unknown',
                path: process.env.PATH ? process.env.PATH.split(':').length : 0
            }
        };

        // Calculate overall status
        const requiredDeps = dependencies.filter(dep => dep.required);
        const installedRequired = requiredDeps.filter(dep => dep.installed);
        const overallStatus = {
            total: dependencies.length,
            required: requiredDeps.length,
            installed: dependencies.filter(dep => dep.installed).length,
            requiredInstalled: installedRequired.length,
            missing: requiredDeps.length - installedRequired.length,
            percentage: Math.round((installedRequired.length / requiredDeps.length) * 100)
        };

        res.json({
            success: true,
            data: {
                dependencies,
                ports: portStatus,
                system: systemInfo,
                status: overallStatus,
                lastChecked: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Dependencies check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check dependencies',
            details: error.message
        });
    }
});

// Install dependency endpoint
router.post('/install/:dependency', async (req, res) => {
    const { dependency } = req.params;
    const { method = 'default' } = req.body;

    try {
        const installCommands = getInstallInstructions(dependency);
        const osCommands = installCommands[process.platform];

        if (!osCommands) {
            return res.status(400).json({
                success: false,
                error: `No installation method available for ${dependency} on ${process.platform}`
            });
        }

        const command = osCommands[method];
        if (!command) {
            return res.status(400).json({
                success: false,
                error: `Installation method '${method}' not available for ${dependency}`,
                availableMethods: Object.keys(osCommands)
            });
        }

        // For security, we'll only return the command instead of executing it
        // The frontend can display it for the user to run manually
        res.json({
            success: true,
            data: {
                dependency,
                method,
                command,
                platform: process.platform,
                note: 'Please run this command in your terminal'
            }
        });

    } catch (error) {
        console.error('Install command error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get installation command',
            details: error.message
        });
    }
});

// Fix dependency issues endpoint
router.post('/fix', async (req, res) => {
    try {
        const fixes = [];

        // Check and suggest fixes for common issues
        if (!commandExists('node')) {
            fixes.push({
                issue: 'Node.js not installed',
                solution: 'Install Node.js from https://nodejs.org/',
                priority: 'high',
                commands: getInstallInstructions('node')[process.platform]
            });
        }

        if (!commandExists('docker')) {
            fixes.push({
                issue: 'Docker not installed',
                solution: 'Install Docker Desktop',
                priority: 'high',
                commands: getInstallInstructions('docker')[process.platform]
            });
        }

        if (commandExists('docker') && !isDockerRunning()) {
            fixes.push({
                issue: 'Docker daemon not running',
                solution: 'Start Docker Desktop or Docker daemon',
                priority: 'medium',
                commands: {
                    darwin: 'Open Docker Desktop application',
                    linux: 'sudo systemctl start docker',
                    win32: 'Start Docker Desktop application'
                }
            });
        }

        res.json({
            success: true,
            data: {
                fixes,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Fix suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get fix suggestions',
            details: error.message
        });
    }
});

module.exports = router;
