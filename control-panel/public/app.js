// Enhanced Laravel Docker Control Panel - Complete Makefile Integration v2.0
const socket = io();
let currentSection = 'overview';
let logsActive = false;
let logProcess = null;

// Complete mapping of all Makefile commands organized by category
const MAKEFILE_COMMANDS = {
    docker: [
        { cmd: 'install', icon: 'fas fa-download', title: 'Install', desc: 'Create Laravel project and setup environment', color: 'primary' },
        { cmd: 'up', icon: 'fas fa-play', title: 'Start All', desc: 'Start all containers', color: 'green' },
        { cmd: 'down', icon: 'fas fa-stop', title: 'Stop All', desc: 'Stop all containers', color: 'red' },
        { cmd: 'build', icon: 'fas fa-hammer', title: 'Build', desc: 'Build containers', color: 'blue' },
        { cmd: 'rebuild', icon: 'fas fa-redo', title: 'Rebuild', desc: 'Rebuild and restart containers', color: 'purple' },
        { cmd: 'restart', icon: 'fas fa-sync-alt', title: 'Restart', desc: 'Restart all containers', color: 'yellow' },
        { cmd: 'list', icon: 'fas fa-list', title: 'List Containers', desc: 'List all containers', color: 'gray' },
        { cmd: 'setup', icon: 'fas fa-cogs', title: 'Setup', desc: 'Setup Laravel application', color: 'indigo' },
        { cmd: 'fresh', icon: 'fas fa-sparkles', title: 'Fresh Install', desc: 'Fresh installation', color: 'pink' }
    ],
    laravel: [
        { cmd: 'artisan', icon: 'fas fa-terminal', title: 'Artisan', desc: 'Run artisan command', color: 'red', hasInput: true, placeholder: 'e.g., make:controller UserController' },
        { cmd: 'migrate', icon: 'fas fa-database', title: 'Migrate', desc: 'Run database migrations', color: 'blue' },
        { cmd: 'migrate-fresh', icon: 'fas fa-sync-alt', title: 'Fresh Migration', desc: 'Fresh migration with seed', color: 'purple' },
        { cmd: 'migrate-rollback', icon: 'fas fa-undo', title: 'Rollback', desc: 'Rollback the last migration', color: 'orange' },
        { cmd: 'seed', icon: 'fas fa-seedling', title: 'Seed', desc: 'Run database seeders', color: 'green' },
        { cmd: 'tinker', icon: 'fas fa-code', title: 'Tinker', desc: 'Open Laravel Tinker', color: 'yellow' },
        { cmd: 'queue', icon: 'fas fa-tasks', title: 'Queue Worker', desc: 'Start queue worker manually', color: 'indigo' },
        { cmd: 'queue-restart', icon: 'fas fa-redo-alt', title: 'Restart Queue', desc: 'Restart queue workers', color: 'blue' },
        { cmd: 'schedule', icon: 'fas fa-clock', title: 'Schedule', desc: 'Run scheduled tasks', color: 'purple' },
        { cmd: 'cache-clear', icon: 'fas fa-broom', title: 'Clear Cache', desc: 'Clear all caches', color: 'red' },
        { cmd: 'optimize', icon: 'fas fa-rocket', title: 'Optimize', desc: 'Optimize Laravel application', color: 'green' },
        { cmd: 'key-generate', icon: 'fas fa-key', title: 'Generate Key', desc: 'Generate new application key', color: 'yellow' }
    ],
    dependencies: [
        { cmd: 'composer', icon: 'fab fa-php', title: 'Composer', desc: 'Run composer command', color: 'purple', hasInput: true, placeholder: 'e.g., require laravel/sanctum' },
        { cmd: 'composer-install', icon: 'fas fa-download', title: 'Composer Install', desc: 'Install PHP dependencies', color: 'purple' },
        { cmd: 'composer-update', icon: 'fas fa-sync-alt', title: 'Composer Update', desc: 'Update PHP dependencies', color: 'blue' },
        { cmd: 'composer-dump', icon: 'fas fa-file-code', title: 'Dump Autoload', desc: 'Dump composer autoload', color: 'gray' },
        { cmd: 'npm', icon: 'fab fa-npm', title: 'NPM', desc: 'Run npm command', color: 'red', hasInput: true, placeholder: 'e.g., install axios' },
        { cmd: 'npm-install', icon: 'fas fa-download', title: 'NPM Install', desc: 'Install Node.js dependencies', color: 'red' },
        { cmd: 'npm-update', icon: 'fas fa-sync-alt', title: 'NPM Update', desc: 'Update Node.js dependencies', color: 'orange' },
        { cmd: 'npm-dev', icon: 'fas fa-code', title: 'NPM Dev', desc: 'Run npm development server', color: 'green' },
        { cmd: 'npm-build', icon: 'fas fa-hammer', title: 'NPM Build', desc: 'Build assets for production', color: 'blue' },
        { cmd: 'npm-watch', icon: 'fas fa-eye', title: 'NPM Watch', desc: 'Watch files for changes', color: 'yellow' },
        { cmd: 'bun-install', icon: 'fas fa-zap', title: 'Bun Install', desc: 'Install dependencies with Bun', color: 'yellow' },
        { cmd: 'bun-dev', icon: 'fas fa-bolt', title: 'Bun Dev', desc: 'Run development server with Bun', color: 'orange' },
        { cmd: 'bun-build', icon: 'fas fa-lightning', title: 'Bun Build', desc: 'Build assets with Bun', color: 'red' }
    ],
    database: [
        { cmd: 'db-shell', icon: 'fas fa-terminal', title: 'MySQL Shell', desc: 'Access MySQL shell', color: 'blue' },
        { cmd: 'db-dump', icon: 'fas fa-download', title: 'Dump Database', desc: 'Dump database to file', color: 'green' },
        { cmd: 'db-restore', icon: 'fas fa-upload', title: 'Restore Database', desc: 'Restore database from backup.sql', color: 'orange' },
        { cmd: 'db-reset', icon: 'fas fa-trash-restore', title: 'Reset Database', desc: 'Reset database (drop and recreate)', color: 'red' }
    ],
    testing: [
        { cmd: 'test', icon: 'fas fa-flask', title: 'Run Tests', desc: 'Run PHPUnit tests', color: 'green' },
        { cmd: 'test-coverage', icon: 'fas fa-chart-line', title: 'Test Coverage', desc: 'Run tests with coverage report', color: 'blue' },
        { cmd: 'test-filter', icon: 'fas fa-filter', title: 'Filter Tests', desc: 'Run specific test', color: 'purple', hasInput: true, placeholder: 'TestName' },
        { cmd: 'test-unit', icon: 'fas fa-cube', title: 'Unit Tests', desc: 'Run unit tests only', color: 'indigo' },
        { cmd: 'test-feature', icon: 'fas fa-puzzle-piece', title: 'Feature Tests', desc: 'Run feature tests only', color: 'pink' },
        { cmd: 'pest', icon: 'fas fa-bug', title: 'Pest Tests', desc: 'Run Pest tests', color: 'green' },
        { cmd: 'pest-coverage', icon: 'fas fa-shield-alt', title: 'Pest Coverage', desc: 'Run Pest tests with coverage', color: 'blue' }
    ],
    monitoring: [
        { cmd: 'status', icon: 'fas fa-info-circle', title: 'Container Status', desc: 'Show container status', color: 'blue' },
        { cmd: 'top', icon: 'fas fa-list', title: 'Running Processes', desc: 'Show running processes', color: 'green' },
        { cmd: 'stats', icon: 'fas fa-chart-bar', title: 'Resource Usage', desc: 'Show container resource usage', color: 'purple' },
        { cmd: 'health', icon: 'fas fa-heartbeat', title: 'Health Check', desc: 'Run health check', color: 'red' },
        { cmd: 'debug', icon: 'fas fa-bug', title: 'Debug Info', desc: 'Run debug script', color: 'yellow' },
        { cmd: 'logs', icon: 'fas fa-file-alt', title: 'App Logs', desc: 'Show application logs', color: 'gray' },
        { cmd: 'logs-nginx', icon: 'fas fa-server', title: 'Nginx Logs', desc: 'Show nginx logs', color: 'green' },
        { cmd: 'logs-all', icon: 'fas fa-list-alt', title: 'All Logs', desc: 'Show all container logs', color: 'blue' },
        { cmd: 'logs-mysql', icon: 'fas fa-database', title: 'MySQL Logs', desc: 'Show MySQL logs', color: 'orange' },
        { cmd: 'logs-redis', icon: 'fas fa-memory', title: 'Redis Logs', desc: 'Show Redis logs', color: 'red' }
    ],
    paths: [
        { cmd: 'path', icon: 'fas fa-folder-open', title: 'Show Path', desc: 'Show current Laravel application path', color: 'purple' },
        { cmd: 'switch-path', icon: 'fas fa-exchange-alt', title: 'Switch Path', desc: 'Switch to different Laravel path', color: 'blue', hasInput: true, placeholder: 'new/path' },
        { cmd: 'create-project', icon: 'fas fa-plus-circle', title: 'Create Project', desc: 'Create Laravel project in specific path', color: 'green', hasInput: true, placeholder: 'projects/myapp' }
    ],
    maintenance: [
        { cmd: 'shell', icon: 'fas fa-terminal', title: 'App Shell', desc: 'Access application container shell', color: 'blue' },
        { cmd: 'shell-root', icon: 'fas fa-user-shield', title: 'Root Shell', desc: 'Access application container as root', color: 'red' },
        { cmd: 'shell-mysql', icon: 'fas fa-database', title: 'MySQL Shell', desc: 'Access MySQL container shell', color: 'orange' },
        { cmd: 'shell-redis', icon: 'fas fa-memory', title: 'Redis Shell', desc: 'Access Redis container shell', color: 'red' },
        { cmd: 'permissions', icon: 'fas fa-shield-alt', title: 'Fix Permissions', desc: 'Fix file permissions', color: 'yellow' },
        { cmd: 'clean', icon: 'fas fa-broom', title: 'Clean', desc: 'Clean up containers and volumes', color: 'red' },
        { cmd: 'clean-all', icon: 'fas fa-trash', title: 'Clean All', desc: 'Clean everything including images', color: 'red' },
        { cmd: 'urls', icon: 'fas fa-link', title: 'Show URLs', desc: 'Show application URLs', color: 'blue' },
        { cmd: 'info', icon: 'fas fa-info', title: 'Environment Info', desc: 'Show environment information', color: 'gray' },
        { cmd: 'update', icon: 'fas fa-sync', title: 'Update All', desc: 'Update all dependencies', color: 'green' },
        { cmd: 'backup', icon: 'fas fa-save', title: 'Create Backup', desc: 'Create full backup', color: 'purple' },
        { cmd: 'ide-helper', icon: 'fas fa-lightbulb', title: 'IDE Helper', desc: 'Generate IDE helper files', color: 'yellow' },
        { cmd: 'clear-logs', icon: 'fas fa-eraser', title: 'Clear Logs', desc: 'Clear all log files', color: 'red' },
        { cmd: 'restart-workers', icon: 'fas fa-redo', title: 'Restart Workers', desc: 'Restart all background workers', color: 'blue' },
        { cmd: 'quick-start', icon: 'fas fa-rocket', title: 'Quick Start Guide', desc: 'Show quick start guide', color: 'green' }
    ]
};

// Color mappings for command cards
const COLOR_CLASSES = {
    primary: 'from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600',
    green: 'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600',
    red: 'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600',
    blue: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
    purple: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600',
    yellow: 'from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600',
    indigo: 'from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600',
    pink: 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600',
    gray: 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600',
    orange: 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎛️ Enhanced Control Panel v2.0 Initializing...');
    initializeApp();
    refreshStatus();
    setupEventListeners();
    populateCommandSections();

    // Add welcome message
    showNotification('Welcome to Enhanced Laravel Docker Control Panel v2.0!', 'success');
});

// Initialize application
function initializeApp() {
    // Setup terminal input with enhanced features
    const terminalInput = document.getElementById('terminal-input');
    if (terminalInput) {
        terminalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeTerminalCommand();
            }
        });

        // Add command history
        let commandHistory = [];
        let historyIndex = -1;

        terminalInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    this.value = commandHistory[commandHistory.length - 1 - historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    this.value = commandHistory[commandHistory.length - 1 - historyIndex] || '';
                } else if (historyIndex === 0) {
                    historyIndex = -1;
                    this.value = '';
                }
            }
        });

        // Store command history
        window.addToCommandHistory = function(command) {
            if (command && !commandHistory.includes(command)) {
                commandHistory.push(command);
                if (commandHistory.length > 50) {
                    commandHistory.shift();
                }
            }
            historyIndex = -1;
        };
    }

    // Setup path switching input
    const pathInput = document.getElementById('new-path-input');
    if (pathInput) {
        pathInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                switchProjectPath();
            }
        });
    }

    // Initial connection status
    updateConnectionStatus(false);

    // Add loading animation to status cards
    animateStatusCards();
}

// Socket event listeners
socket.on('connect', () => {
    console.log('🔗 Connected to enhanced control panel server');
    updateConnectionStatus(true);
    showNotification('Connected to control panel server', 'success');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from control panel server');
    updateConnectionStatus(false);
    showNotification('Disconnected from control panel server', 'error');
});

socket.on('command-result', (result) => {
    console.log('📊 Command result received:', result);
    hideLoading();
    addTerminalOutput(result);

    // Add to command history
    if (window.addToCommandHistory) {
        window.addToCommandHistory(result.command.replace('make ', ''));
    }

    // Show execution time in notification
    const executionTime = result.executionTime ? ` (${result.executionTime}ms)` : '';
    if (result.success) {
        showNotification(`Command completed successfully${executionTime}`, 'success');
    } else {
        showNotification(`Command failed${executionTime}`, 'error');
    }

    // Refresh status after certain commands
    if (currentSection === 'overview' ||
        result.command.includes('up') ||
        result.command.includes('down') ||
        result.command.includes('restart') ||
        result.command.includes('path')) {
        setTimeout(refreshStatus, 2000);
    }
});

socket.on('command-error', (error) => {
    console.error('❌ Command error:', error);
    hideLoading();
    showNotification('Command failed: ' + (error.message || 'Unknown error'), 'error');
});

socket.on('log-data', (data) => {
    if (logsActive) {
        addLogLine(data.data.trim(), 'info');
    }
});

socket.on('log-error', (data) => {
    if (logsActive) {
        addLogLine(data.error.trim(), 'error');
    }
});

socket.on('log-closed', (data) => {
    if (logsActive) {
        addLogLine(`--- Log stream for ${data.service} closed ---`, 'warning');
        logsActive = false;
    }
});

socket.on('welcome', (data) => {
    console.log('🎉 Welcome message:', data);
    showNotification(`Connected! ${data.message}`, 'success');
});

socket.on('stats-broadcast', (data) => {
    // Update stats in real-time if on overview
    if (currentSection === 'overview') {
        updateStatusCards(data);
    }
});

// Setup event listeners
function setupEventListeners() {
    // Section switching event listeners
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            if (section) {
                switchSection(section);
            }
        });
    });

    // Add click effects to command cards
    document.addEventListener('click', function(e) {
        if (e.target.closest('.command-card')) {
            const card = e.target.closest('.command-card');
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
    });
}

// Populate all command sections
function populateCommandSections() {
    Object.keys(MAKEFILE_COMMANDS).forEach(category => {
        const container = document.getElementById(`${category}-commands`);
        if (container) {
            container.innerHTML = MAKEFILE_COMMANDS[category].map(cmd => createCommandCard(cmd)).join('');
        }
    });

    // Add search functionality after populating
    setTimeout(initializeSearch, 500);
}

// Create enhanced command card HTML
function createCommandCard(command) {
    const colorClass = COLOR_CLASSES[command.color] || COLOR_CLASSES.gray;
    const inputId = command.hasInput ? `input-${command.cmd}` : '';

    return `
        <div class="command-card group" data-command="${command.cmd}" data-title="${command.title}" data-desc="${command.desc}">
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <i class="${command.icon} text-white text-xl"></i>
                </div>
                <div class="text-xs text-gray-400 font-mono bg-dark-800 px-2 py-1 rounded">${command.cmd}</div>
            </div>

            <h3 class="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">${command.title}</h3>
            <p class="text-gray-400 text-sm mb-4 flex-1 leading-relaxed">${command.desc}</p>

            ${command.hasInput ? `
                <div class="mb-3">
                    <input type="text" id="${inputId}" placeholder="${command.placeholder}"
                           class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 focus:bg-dark-600 transition-all duration-200">
                </div>
            ` : ''}

            <button onclick="executeCommandWithInput('${command.cmd}', '${inputId}')"
                    class="w-full px-4 py-2 bg-gradient-to-r ${colorClass} rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center group-hover:shadow-xl">
                <i class="${command.icon} mr-2"></i>
                Execute
                <i class="fas fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
            </button>
        </div>
    `;
}

// Execute command with optional input and enhanced validation
function executeCommandWithInput(command, inputId = '') {
    let fullCommand = command;

    if (inputId) {
        const input = document.getElementById(inputId);
        if (input && input.value.trim()) {
            const inputValue = input.value.trim();

            // Validate input based on command type
            if (!validateCommandInput(command, inputValue)) {
                showNotification(`Invalid input for ${command}`, 'warning');
                return;
            }

            if (command === 'artisan') {
                fullCommand = `artisan cmd="${inputValue}"`;
            } else if (command === 'composer') {
                fullCommand = `composer cmd="${inputValue}"`;
            } else if (command === 'npm') {
                fullCommand = `npm cmd="${inputValue}"`;
            } else if (command === 'switch-path') {
                fullCommand = `switch-path path="${inputValue}"`;
            } else if (command === 'create-project') {
                fullCommand = `create-project path="${inputValue}"`;
            } else if (command === 'test-filter') {
                fullCommand = `test-filter name="${inputValue}"`;
            }

            // Clear input after execution
            input.value = '';
        } else if (command !== 'artisan' && command !== 'composer' && command !== 'npm') {
            // For commands that require input but none provided
            showNotification(`Please provide input for ${command}`, 'warning');
            return;
        }
    }

    executeCommand(fullCommand);
}

// Validate command input
function validateCommandInput(command, input) {
    switch (command) {
        case 'switch-path':
        case 'create-project':
            // Path validation - no special characters that could be harmful
            return /^[a-zA-Z0-9\/_-]+$/.test(input);
        case 'test-filter':
            // Test name validation
            return /^[a-zA-Z0-9_\\]+$/.test(input);
        default:
            return true; // Allow most inputs for artisan, composer, npm
    }
}

// Switch between sections with enhanced animations
function switchSection(sectionName) {
    console.log('🔄 Switching to section:', sectionName);
    currentSection = sectionName;

    // Update sidebar with smooth transition
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        item.style.transform = 'translateX(0)';
    });
    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.style.transform = 'translateX(4px)';
    }

    // Update content with fade transition
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        setTimeout(() => {
            section.classList.add('hidden');
        }, 200);
    });

    setTimeout(() => {
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            activeSection.style.opacity = '1';
            activeSection.style.transform = 'translateY(0)';
        }
    }, 200);

    // Load section-specific data
    if (sectionName === 'overview') {
        refreshStatus();
    } else if (sectionName === 'paths') {
        updatePathInfo();
    } else if (sectionName === 'logs' && logsActive) {
        stopLogs();
    }

    // Analytics
    console.log(`📊 Section changed to: ${sectionName}`);
}

// Update connection status indicator with enhanced styling
function updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    if (!indicator) return;

    if (connected) {
        indicator.innerHTML = `
            <div class="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
            <span class="text-sm text-primary-400 font-medium">Connected</span>
        `;
        indicator.className = 'flex items-center px-3 py-2 rounded-lg bg-dark-800 border border-primary-500/20 shadow-lg shadow-primary-500/10';
    } else {
        indicator.innerHTML = `
            <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span class="text-sm text-red-400 font-medium">Disconnected</span>
        `;
        indicator.className = 'flex items-center px-3 py-2 rounded-lg bg-dark-800 border border-red-500/20 shadow-lg shadow-red-500/10';
    }
}

// Enhanced status refresh with better error handling
async function refreshStatus() {
    console.log('🔄 Refreshing status...');

    try {
        // Show subtle loading for status cards
        animateStatusCards(true);

        const response = await axios.get('/api/status');
        const data = response.data;

        console.log('📊 Status data received:', data);

        updateStatusCards(data);
        updateContainersList(data.containers);
        updateServiceUrls(data.environment);
        updatePathInfo(data.environment);

        // Show response time in console
        if (data.responseTime) {
            console.log(`⚡ Status loaded in ${data.responseTime}ms`);
        }

    } catch (error) {
        console.error('❌ Error refreshing status:', error);
        showNotification('Error refreshing status: ' + error.message, 'error');

        // Show offline state
        animateStatusCards(false);
    } finally {
        animateStatusCards(false);
    }
}

// Animate status cards for better UX
function animateStatusCards(loading = false) {
    const cards = document.querySelectorAll('.bg-gradient-to-br');
    cards.forEach((card, index) => {
        if (loading) {
            card.style.opacity = '0.6';
            card.style.transform = 'scale(0.98)';
        } else {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, index * 100);
        }
    });
}

// Enhanced status cards update
function updateStatusCards(data) {
    const stats = data.stats;
    const env = data.environment;

    if (stats && stats.containers) {
        const runningEl = document.getElementById('running-containers');
        const totalEl = document.getElementById('total-containers');

        if (runningEl) {
            animateNumber(runningEl, parseInt(runningEl.textContent) || 0, stats.containers.running || 0);
        }
        if (totalEl) {
            animateNumber(totalEl, parseInt(totalEl.textContent) || 0, stats.containers.total || 0);
        }
    }

    const codePathEl = document.getElementById('code-path');
    const appPortEl = document.getElementById('app-port');

    if (codePathEl && env.CODE_PATH !== codePathEl.textContent) {
        codePathEl.style.transform = 'scale(1.1)';
        codePathEl.textContent = env.CODE_PATH || 'src';
        setTimeout(() => {
            codePathEl.style.transform = 'scale(1)';
        }, 200);
    }

    if (appPortEl) {
        animateNumber(appPortEl, parseInt(appPortEl.textContent) || 0, parseInt(env.APP_PORT) || 8000);
    }
}

// Animate number changes
function animateNumber(element, from, to) {
    if (from === to) return;

    const duration = 500;
    const steps = 20;
    const stepValue = (to - from) / steps;
    let current = from;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current += stepValue;

        if (step >= steps) {
            current = to;
            clearInterval(timer);
        }

        element.textContent = Math.round(current);

        // Add pulse effect on final value
        if (step >= steps) {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }, duration / steps);
}

// Enhanced containers list update
function updateContainersList(containers) {
    const containersList = document.getElementById('containers-list');
    if (!containersList) return;

    if (!containers || containers.length === 0) {
        containersList.innerHTML = `
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-gradient-to-br from-dark-800 to-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-dark-600">
                    <i class="fas fa-cube text-4xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold mb-3 text-gray-300">No containers found</h3>
                <p class="text-gray-400 mb-8 max-w-md mx-auto">Start your Laravel environment to see running containers and services</p>
                <button onclick="executeCommand('up')" class="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <i class="fas fa-play mr-2"></i>Start Containers
                </button>
            </div>
        `;
        return;
    }

    containersList.innerHTML = containers.map((container, index) => `
        <div class="bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl p-6 border border-dark-700 hover:border-dark-600 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl" style="animation-delay: ${index * 100}ms">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <div class="w-4 h-4 rounded-full ${container.state === 'running' ? 'bg-primary-500' : 'bg-red-500'}"></div>
                        ${container.state === 'running' ? '<div class="absolute inset-0 w-4 h-4 rounded-full bg-primary-500 animate-ping"></div>' : ''}
                    </div>
                    <div>
                        <h4 class="font-semibold text-white flex items-center">
                            ${container.name}
                            ${container.health === 'healthy' ? '<i class="fas fa-check-circle text-green-400 text-sm ml-2"></i>' : ''}
                        </h4>
                        <p class="text-sm text-gray-400">${container.image}</p>
                        <p class="text-xs text-gray-500 flex items-center mt-1">
                            <i class="fas fa-clock mr-1"></i>
                            ${container.status}
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${container.ports.map(port =>
                        port.public ? `
                            <span class="bg-blue-600 text-xs px-2 py-1 rounded font-mono hover:bg-blue-500 transition-colors cursor-pointer"
                                  title="Click to open" onclick="window.open('http://localhost:${port.public}', '_blank')">
                                ${port.public}:${port.private}
                            </span>` : ''
                    ).join('')}
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${
                        container.state === 'running'
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-primary-100 shadow-lg'
                            : 'bg-gradient-to-r from-red-600 to-red-700 text-red-100'
                    }">
                        ${container.state.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update service URLs with enhanced styling
function updateServiceUrls(env) {
    const baseUrl = 'http://localhost';

    const services = [
        { id: 'app-url', port: env.APP_PORT || 8000 },
        { id: 'phpmyadmin-url', port: env.PHPMYADMIN_PORT || 8080 },
        { id: 'redis-url', port: env.REDIS_INSIGHT_PORT || 8001 },
        { id: 'mailhog-url', port: env.MAILHOG_PORT || 8025 }
    ];

    services.forEach(service => {
        const element = document.getElementById(service.id);
        if (element) {
            element.href = `${baseUrl}:${service.port}`;

            // Add click analytics
            element.onclick = function() {
                console.log(`🔗 Opening service: ${service.id} at port ${service.port}`);
            };
        }
    });
}

// Enhanced path information update
function updatePathInfo(env = null) {
    if (!env) {
        refreshStatus();
        return;
    }

    const pathDisplay = document.getElementById('current-path-display');
    if (pathDisplay) {
        const newPath = env.CODE_PATH || 'src';
        if (pathDisplay.textContent !== newPath) {
            pathDisplay.style.transform = 'scale(1.1)';
            pathDisplay.style.color = '#22c55e';
            pathDisplay.textContent = newPath;
            setTimeout(() => {
                pathDisplay.style.transform = 'scale(1)';
                pathDisplay.style.color = '';
            }, 300);
        }
    }
}

// Enhanced project path switching
function switchProjectPath() {
    const input = document.getElementById('new-path-input');
    if (!input || !input.value.trim()) {
        showNotification('Please enter a valid path', 'warning');
        input?.focus();
        return;
    }

    const newPath = input.value.trim();

    // Validate path
    if (!validateCommandInput('switch-path', newPath)) {
        showNotification('Invalid path format. Use alphanumeric characters, hyphens, underscores, and forward slashes only.', 'warning');
        return;
    }

    showNotification(`Switching to path: ${newPath}`, 'info');
    executeCommand(`switch-path path="${newPath}"`);
    input.value = '';
}

// Enhanced command execution with better feedback
async function executeCommand(command) {
    console.log('⚡ Executing command:', command);

    showLoading();

    // Add command to terminal immediately for better UX
    addTerminalOutput({
        command: `make ${command}`,
        stdout: '⏳ Executing command...',
        timestamp: new Date().toISOString(),
        success: true
    });

    try {
        socket.emit('execute-command', command);
        showNotification(`Executing: make ${command}`, 'info');

        // Add to command history
        if (window.addToCommandHistory) {
            window.addToCommandHistory(command);
        }

    } catch (error) {
        hideLoading();
        console.error('❌ Error executing command:', error);
        showNotification(`Error executing command: ${error.message}`, 'error');
    }
}

// Enhanced terminal command execution
function executeTerminalCommand() {
    const input = document.getElementById('terminal-input');
    if (!input) return;

    const command = input.value.trim();
    if (!command) {
        showNotification('Please enter a command', 'warning');
        return;
    }

    executeCommand(command);
    input.value = '';
    input.focus();
}

// Clear terminal with enhanced animation
function clearTerminal() {
    const terminal = document.getElementById('terminal-output');
    if (terminal) {
        terminal.style.opacity = '0.5';
        setTimeout(() => {
            terminal.innerHTML = `
                <div class="text-primary-400 font-bold">$ Laravel Docker Control Panel Terminal v2.0</div>
                <div class="text-gray-400">✨ Enhanced with complete Makefile integration</div>
                <div class="text-gray-400">💡 Type make commands and press Enter or click Execute</div>
                <div class="text-gray-400">🔍 Use ↑/↓ arrows to navigate command history</div>
                <div class="text-gray-500">Available commands: up, down, shell, migrate, test, composer-install, npm-dev, etc.</div>
            `;
            terminal.style.opacity = '1';
        }, 200);
    }
}

// Enhanced terminal output with better formatting
function addTerminalOutput(result) {
    const terminal = document.getElementById('terminal-output');
    if (!terminal) return;

    const timestamp = new Date().toLocaleTimeString();

    const outputDiv = document.createElement('div');
    outputDiv.className = 'terminal-line mb-4 border-l-2 border-dark-600 pl-4 hover:border-primary-500 transition-colors duration-200';

    // Enhanced command display
    const commandDisplay = result.command.replace('make ', '');
    const executionTime = result.executionTime ? ` (${result.executionTime}ms)` : '';

    outputDiv.innerHTML = `
        <div class="text-primary-400 font-mono text-sm mb-1 flex items-center justify-between">
            <span>$ ${commandDisplay}</span>
            <span class="text-gray-500 text-xs">[${timestamp}]${executionTime}</span>
        </div>
        ${result.stdout ? `<div class="text-green-300 whitespace-pre-wrap text-sm mb-2 bg-dark-900 rounded p-2 border-l-2 border-green-500">${escapeHtml(result.stdout)}</div>` : ''}
        ${result.stderr ? `<div class="text-red-300 whitespace-pre-wrap text-sm mb-2 bg-dark-900 rounded p-2 border-l-2 border-red-500">${escapeHtml(result.stderr)}</div>` : ''}
        <div class="text-xs flex items-center ${result.success ? 'text-green-400' : 'text-red-400'}">
            <i class="fas ${result.success ? 'fa-check-circle' : 'fa-times-circle'} mr-2"></i>
            <span>${result.success ? 'Command completed successfully' : 'Command failed'}</span>
            ${result.executionTime ? `<span class="ml-2 text-gray-500">• ${result.executionTime}ms</span>` : ''}
        </div>
    `;

    terminal.appendChild(outputDiv);
    terminal.scrollTop = terminal.scrollHeight;

    // Add animation
    outputDiv.style.opacity = '0';
    outputDiv.style.transform = 'translateY(10px)';
    setTimeout(() => {
        outputDiv.style.opacity = '1';
        outputDiv.style.transform = 'translateY(0)';
    }, 100);

    // Limit terminal lines to prevent memory issues
    if (terminal.children.length > 100) {
        terminal.removeChild(terminal.firstChild);
    }
}

// Enhanced real-time logs
function startLogs() {
    const serviceSelect = document.getElementById('log-service');
    if (!serviceSelect) return;

    const service = serviceSelect.value;
    logsActive = true;

    console.log('📋 Starting enhanced logs for service:', service);

    clearLogs();
    addLogLine(`🚀 Starting real-time logs for ${service}...`, 'info');
    addLogLine(`📡 Enhanced logging with real-time updates`, 'info');
    addLogLine(`⏹️  Use "Stop" button to stop logs or "Clear" to clear output`, 'info');
    addLogLine(''.padEnd(50, '─'), 'info');

    socket.emit('get-real-time-logs', service);
    showNotification(`Started enhanced logs for ${service}`, 'success');

    // Update button states
    updateLogButtons(true);
}

// Stop real-time logs with better feedback
function stopLogs() {
    logsActive = false;
    console.log('⏹️ Stopping enhanced logs');
    addLogLine(''.padEnd(50, '─'), 'warning');
    addLogLine('⏹️  Log streaming stopped', 'warning');
    showNotification('Log streaming stopped', 'info');

    socket.emit('stop-logs');
    updateLogButtons(false);
}

// Update log button states
function updateLogButtons(isActive) {
    const startBtn = document.querySelector('button[onclick="startLogs()"]');
    const stopBtn = document.querySelector('button[onclick="stopLogs()"]');

    if (startBtn && stopBtn) {
        if (isActive) {
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50', 'cursor-not-allowed');
            stopBtn.disabled = false;
            stopBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            stopBtn.disabled = true;
            stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
}

// Enhanced log line addition
function addLogLine(text, type = 'info') {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;

    const timestamp = new Date().toLocaleTimeString();

    const logDiv = document.createElement('div');
    logDiv.className = `terminal-line font-mono text-xs py-1 hover:bg-dark-800 rounded px-2 transition-colors`;

    // Clean up the text - remove ANSI color codes
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');

    // Enhanced log formatting
    logDiv.innerHTML = `
        <span class="text-gray-500 select-none">[${timestamp}]</span>
        <span class="${getLogColor(type)} ${getLogStyle(type)}">${escapeHtml(cleanText)}</span>
    `;

    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;

    // Add smooth animation
    logDiv.style.opacity = '0';
    setTimeout(() => {
        logDiv.style.opacity = '1';
    }, 50);

    // Limit log lines to prevent memory issues
    if (logsContainer.children.length > 1000) {
        logsContainer.removeChild(logsContainer.firstChild);
    }
}

// Enhanced log color and styling
function getLogColor(type) {
    switch (type) {
        case 'error': return 'text-red-300';
        case 'warning': return 'text-yellow-300';
        case 'info': return 'text-blue-300';
        case 'success': return 'text-green-300';
        default: return 'text-gray-300';
    }
}

function getLogStyle(type) {
    switch (type) {
        case 'error': return 'font-semibold';
        case 'warning': return 'font-medium';
        default: return '';
    }
}

// Enhanced logs clearing
function clearLogs() {
    const logsContainer = document.getElementById('logs-container');
    if (logsContainer) {
        logsContainer.style.opacity = '0.5';
        setTimeout(() => {
            logsContainer.innerHTML = `
                <div class="text-gray-400 text-center py-8">
                    <i class="fas fa-file-alt text-2xl mb-2"></i>
                    <div>Log output cleared</div>
                    <div class="text-xs text-gray-500 mt-1">Select a service and click "Start Logs" to begin</div>
                </div>
            `;
            logsContainer.style.opacity = '1';
        }, 200);
    }
}

// Enhanced loading overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
}

// Enhanced notification system with modern styling
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    // Remove existing notifications of the same type
    document.querySelectorAll(`.notification-${type}`).forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fixed top-4 right-4 px-6 py-4 rounded-xl text-white z-50 transition-all duration-300 transform translate-x-0 max-w-md shadow-2xl border backdrop-blur-sm ${getNotificationClasses(type)}`;

    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 mr-3 mt-0.5">
                <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <i class="fas ${getNotificationIcon(type)} text-sm"></i>
                </div>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-sm">${getNotificationTitle(type)}</div>
                <div class="text-sm opacity-90 mt-1">${escapeHtml(message)}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white/70 hover:text-white transition-colors">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
        <div class="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full transition-all duration-5000 notification-progress"></div>
    `;

    document.body.appendChild(notification);

    // Animate in
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    // Progress bar animation
    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 100);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Enhanced notification styling
function getNotificationClasses(type) {
    switch (type) {
        case 'success': return 'bg-gradient-to-r from-green-600/90 to-green-700/90 border-green-500/50';
        case 'error': return 'bg-gradient-to-r from-red-600/90 to-red-700/90 border-red-500/50';
        case 'warning': return 'bg-gradient-to-r from-yellow-600/90 to-yellow-700/90 border-yellow-500/50';
        default: return 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 border-blue-500/50';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check';
        case 'error': return 'fa-times';
        case 'warning': return 'fa-exclamation';
        default: return 'fa-info';
    }
}

function getNotificationTitle(type) {
    switch (type) {
        case 'success': return 'Success';
        case 'error': return 'Error';
        case 'warning': return 'Warning';
        default: return 'Information';
    }
}

// Enhanced search functionality
function initializeSearch() {
    const sidebar = document.querySelector('aside nav');
    if (!sidebar) return;

    const searchHTML = `
        <div class="mb-6 px-4">
            <div class="relative">
                <input type="text" id="command-search" placeholder="Search commands..."
                       class="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 pl-10 text-white text-sm focus:outline-none focus:border-primary-500 focus:bg-dark-700 transition-all duration-200">
                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <div id="search-results-count" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500"></div>
            </div>
        </div>
    `;

    sidebar.insertAdjacentHTML('beforebegin', searchHTML);

    const searchInput = document.getElementById('command-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.toLowerCase();
                filterCommands(query);
            }, 300);
        });

        // Clear search on escape
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterCommands('');
                this.blur();
            }
        });
    }
}

// Enhanced command filtering
function filterCommands(query) {
    const resultsCount = document.getElementById('search-results-count');
    let visibleCount = 0;

    document.querySelectorAll('.command-card').forEach(card => {
        if (!query) {
            card.style.display = 'block';
            card.style.opacity = '1';
            visibleCount++;
            return;
        }

        const title = card.getAttribute('data-title')?.toLowerCase() || '';
        const desc = card.getAttribute('data-desc')?.toLowerCase() || '';
        const cmd = card.getAttribute('data-command')?.toLowerCase() || '';

        if (title.includes(query) || desc.includes(query) || cmd.includes(query)) {
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
            visibleCount++;

            // Highlight matching text
            highlightMatchingText(card, query);
        } else {
            card.style.opacity = '0.3';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (card.style.opacity === '0.3') {
                    card.style.display = 'none';
                }
            }, 200);
        }
    });

    // Update results count
    if (resultsCount) {
        if (query) {
            resultsCount.textContent = `${visibleCount} found`;
            resultsCount.style.opacity = '1';
        } else {
            resultsCount.style.opacity = '0';
        }
    }
}

// Highlight matching text in search results
function highlightMatchingText(card, query) {
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');

    if (title && title.textContent.toLowerCase().includes(query)) {
        title.style.color = '#22c55e';
        setTimeout(() => {
            title.style.color = '';
        }, 2000);
    }

    if (desc && desc.textContent.toLowerCase().includes(query)) {
        desc.style.color = '#a3a3a3';
        setTimeout(() => {
            desc.style.color = '';
        }, 2000);
    }
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K to focus terminal input
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput && currentSection === 'terminal') {
            terminalInput.focus();
        } else {
            switchSection('terminal');
            setTimeout(() => {
                const input = document.getElementById('terminal-input');
                if (input) input.focus();
            }, 300);
        }
        showNotification('Terminal focused', 'info');
    }

    // Ctrl/Cmd + / for search
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        const searchInput = document.getElementById('command-search');
        if (searchInput) {
            searchInput.focus();
            showNotification('Search focused', 'info');
        }
    }

    // Escape to clear focused input
    if (event.key === 'Escape') {
        document.activeElement.blur();
    }

    // Ctrl/Cmd + R to refresh status
    if ((event.ctrlKey || event.metaKey) && event.key === 'r' && currentSection === 'overview') {
        event.preventDefault();
        refreshStatus();
        showNotification('Status refreshed', 'success');
    }
});

// Enhanced utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh status every 30 seconds for overview
setInterval(() => {
    if (currentSection === 'overview') {
        refreshStatus();
    }
}, 30000);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentSection === 'overview') {
        refreshStatus();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    showNotification('An unexpected error occurred. Check console for details.', 'error');
});

// Enhanced console welcome message
console.log(`
🎛️ Enhanced Laravel Docker Control Panel v2.0
=============================================
🚀 Modern UI with complete Makefile integration
📊 Real-time monitoring and command execution
🎨 Nuxt-inspired dark theme design

Features:
✨ ${Object.values(MAKEFILE_COMMANDS).flat().length} Makefile commands available
🔍 Enhanced search functionality
⌨️  Keyboard shortcuts (Ctrl+K, Ctrl+/, Ctrl+R)
📡 Real-time log streaming
🎯 Command history and validation
📱 Mobile responsive design

Keyboard shortcuts:
- Ctrl/Cmd + K: Focus terminal
- Ctrl/Cmd + /: Focus search
- Ctrl/Cmd + R: Refresh status (overview)
- Escape: Clear focus
- ↑/↓: Navigate command history

Happy managing! 🚀🎛️
`);
