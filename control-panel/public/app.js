// Enhanced Laravel Docker Control Panel - Complete Makefile Integration v2.0
const socket = io();
let currentSection = 'overview';
let logsActive = false;
let logProcess = null;
let currentLogService = 'app'; // Default log service
let commandHistory = [];
let historyIndex = -1;

// UI Elements (declared here, assigned in DOMContentLoaded)
let commandOutput;
let terminalInput;
let loadingOverlay;
let loadingMessage;
let loadingSubMessage;
let searchInput;
let commandsContainer;
let logOutput;
let logServiceSelect;
let rootEnvContent;
let laravelEnvContent;
let saveRootEnvBtn;
let saveLaravelEnvBtn;
let laravelEnvPathDisplay;
let urlsListContainer;


// Complete mapping of all Makefile commands organized by category
const MAKEFILE_COMMANDS = {
    quickStart: [
        { cmd: 'install', icon: 'fas fa-download', title: 'Install Laravel', desc: 'Create Laravel project and setup environment (first-time)', type: 'primary' },
        { cmd: 'up', icon: 'fas fa-play', title: 'Start All Containers', desc: 'Start all Docker containers', type: 'success' },
        { cmd: 'control', icon: 'fas fa-sliders-h', title: 'Start Control Panel', desc: 'Start the web-based control panel', type: 'primary' },
        { cmd: 'npm-dev', icon: 'fas fa-code', title: 'Start Frontend Dev Server', desc: 'Start Vite development server', type: 'info' }
    ],
    controlPanel: [
        { cmd: 'control', icon: 'fas fa-sliders-h', title: 'Start Control Panel', desc: 'Start the web-based control panel', type: 'primary' },
        { cmd: 'stop-control', icon: 'fas fa-power-off', title: 'Stop Control Panel', desc: 'Stop the web-based control panel process', type: 'danger' },
        { cmd: 'control-dev', icon: 'fas fa-flask', title: 'Control Panel Dev', desc: 'Start control panel in development mode with auto-reload', type: 'info' },
        { cmd: 'setup-control-panel', icon: 'fas fa-wrench', title: 'Setup Control Panel', desc: 'Setup the control panel (one-time setup)', type: 'primary' }
    ],
    docker: [
        { cmd: 'up', icon: 'fas fa-play', title: 'Start Containers', desc: 'Start all Docker containers', type: 'success' },
        { cmd: 'down', icon: 'fas fa-stop', title: 'Stop Containers', desc: 'Stop all Docker containers', type: 'danger' },
        { cmd: 'build', icon: 'fas fa-hammer', title: 'Build Images', desc: 'Build Docker service images', type: 'primary' },
        { cmd: 'rebuild', icon: 'fas fa-redo', title: 'Rebuild & Restart', desc: 'Rebuild and restart all containers from scratch', type: 'warning' },
        { cmd: 'restart', icon: 'fas fa-sync-alt', title: 'Restart Containers', desc: 'Restart all containers', type: 'info' },
        { cmd: 'list', icon: 'fas fa-list', title: 'List Containers', desc: 'List all running Docker containers', type: 'secondary' }
    ],
    shellAccess: [
        { cmd: 'shell', icon: 'fas fa-terminal', title: 'App Shell', desc: 'Access the main application container shell', type: 'primary' },
        { cmd: 'shell-root', icon: 'fas fa-user-shield', title: 'App Shell (Root)', desc: 'Access the main application container shell as root', type: 'danger' },
        { cmd: 'shell-mysql', icon: 'fas fa-database', title: 'MySQL Shell', desc: 'Access the MySQL container shell', type: 'info' },
        { cmd: 'shell-redis', icon: 'fas fa-box', title: 'Redis Shell', desc: 'Access the Redis container shell', type: 'danger' }
    ],
    logging: [
        { cmd: 'logs', icon: 'fas fa-file-alt', title: 'App Logs', desc: 'Show aggregated application logs', type: 'warning' },
        { cmd: 'logs-service', icon: 'fas fa-stream', title: 'Service Logs', desc: 'Show logs for a specific Docker service', type: 'primary', hasInput: true, placeholder: 'e.g., service=app' },
        { cmd: 'logs-all', icon: 'fas fa-network-wired', title: 'All Container Logs', desc: 'Show all container logs', type: 'secondary' }
    ],
    laravelCommands: [
        { cmd: 'artisan', icon: 'fas fa-terminal', title: 'Artisan Command', desc: 'Run any Laravel Artisan command', type: 'danger', hasInput: true, placeholder: 'e.g., cmd="make:model User"' },
        { cmd: 'migrate', icon: 'fas fa-database', title: 'Migrate DB', desc: 'Run database migrations', type: 'primary' },
        { cmd: 'migrate-fresh', icon: 'fas fa-eraser', title: 'Fresh Migrate (Wipes DB!)', desc: 'Drop all tables and re-run migrations', type: 'danger', confirm: true },
        { cmd: 'migrate-rollback', icon: 'fas fa-undo', title: 'Rollback Migration', desc: 'Rollback the last database migration batch', type: 'warning' },
        { cmd: 'seed', icon: 'fas fa-seedling', title: 'Seed DB', desc: 'Run database seeders', type: 'success' },
        { cmd: 'tinker', icon: 'fas fa-screwdriver', title: 'Laravel Tinker', desc: 'Open Laravel Tinker', type: 'info' },
        { cmd: 'queue', icon: 'fas fa-hourglass-half', title: 'Start Queue Worker', desc: 'Start a Laravel queue worker (foreground)', type: 'primary' },
        { cmd: 'queue-restart', icon: 'fas fa-sync', title: 'Restart Queues', desc: 'Restart all Laravel queue workers', type: 'warning' },
        { cmd: 'schedule', icon: 'fas fa-clock', title: 'Run Scheduler', desc: 'Run scheduled tasks', type: 'info' }
    ],
    cacheManagement: [
        { cmd: 'cache-clear', icon: 'fas fa-broom', title: 'Clear Caches', desc: 'Clear all Laravel caches', type: 'warning' },
        { cmd: 'optimize', icon: 'fas fa-rocket', title: 'Optimize App', desc: 'Optimize Laravel application for production', type: 'success' },
        { cmd: 'optimize-clear', icon: 'fas fa-fire', title: 'Clear & Optimize', desc: 'Clear all caches and then optimize', type: 'danger' },
        { cmd: 'key-generate', icon: 'fas fa-key', title: 'Generate App Key', desc: 'Generate a new Laravel application key', type: 'primary' }
    ],
    dependencyManagement: [
        { cmd: 'composer', icon: 'fab fa-php', title: 'Composer Command', desc: 'Run any Composer command', type: 'primary', hasInput: true, placeholder: 'e.g., cmd="require package/name"' },
        { cmd: 'composer-install', icon: 'fas fa-boxes', title: 'Composer Install', desc: 'Install PHP Composer dependencies', type: 'success' },
        { cmd: 'composer-update', icon: 'fas fa-sync-alt', title: 'Composer Update', desc: 'Update PHP Composer dependencies', type: 'warning' },
        { cmd: 'composer-dump', icon: 'fas fa-file-code', title: 'Composer Autoload', desc: 'Dump Composer autoloader files', type: 'secondary' },
        { cmd: 'npm', icon: 'fab fa-node-js', title: 'NPM Command', desc: 'Run any NPM command', type: 'danger', hasInput: true, placeholder: 'e.g., cmd="run dev"' },
        { cmd: 'npm-install', icon: 'fas fa-cubes', title: 'NPM Install', desc: 'Install Node.js dependencies with NPM', type: 'success' },
        { cmd: 'npm-update', icon: 'fas fa-arrow-alt-circle-up', title: 'NPM Update', desc: 'Update Node.js dependencies with NPM', type: 'warning' },
        { cmd: 'npm-dev', icon: 'fas fa-code', title: 'Vite Dev Server', desc: 'Start Vite development server', type: 'info' },
        { cmd: 'npm-build', icon: 'fas fa-hammer', title: 'NPM Build', desc: 'Build frontend assets for production with NPM', type: 'primary' },
        { cmd: 'npm-watch', icon: 'fas fa-eye', title: 'NPM Watch (Vite)', desc: 'Watch frontend files for changes (Vite)', type: 'info' },
        { cmd: 'npm-watch-legacy', icon: 'fas fa-eye-slash', title: 'NPM Watch (Mix)', desc: 'Watch frontend files for changes (Laravel Mix)', type: 'secondary' },
        { cmd: 'bun', icon: 'fas fa-bolt', title: 'Bun Command', desc: 'Run any Bun command', type: 'primary', hasInput: true, placeholder: 'e.g., cmd="run dev"' },
        { cmd: 'bun-install', icon: 'fas fa-box-open', title: 'Bun Install', desc: 'Install dependencies with Bun', type: 'success' },
        { cmd: 'bun-update', icon: 'fas fa-sync-alt', title: 'Bun Update', desc: 'Update dependencies with Bun', type: 'warning' },
        { cmd: 'bun-dev', icon: 'fas fa-code-branch', title: 'Bun Dev Server', desc: 'Run development server with Bun', type: 'info' },
        { cmd: 'bun-build', icon: 'fas fa-tools', title: 'Bun Build', desc: 'Build assets with Bun', type: 'primary' }
    ],
    testing: [
        { cmd: 'test', icon: 'fas fa-flask', title: 'Run PHPUnit Tests', desc: 'Run PHPUnit tests', type: 'primary' },
        { cmd: 'test-coverage', icon: 'fas fa-chart-bar', title: 'PHPUnit Coverage', desc: 'Run PHPUnit tests with coverage report', type: 'info' },
        { cmd: 'test-filter', icon: 'fas fa-filter', title: 'Filter PHPUnit Test', desc: 'Run specific PHPUnit test', type: 'primary', hasInput: true, placeholder: 'e.g., name="UserTest"' },
        { cmd: 'test-unit', icon: 'fas fa-cube', title: 'Run Unit Tests', desc: 'Run only unit tests with PHPUnit', type: 'success' },
        { cmd: 'test-feature', icon: 'fas fa-puzzle-piece', title: 'Run Feature Tests', desc: 'Run only feature tests with PHPUnit', type: 'warning' },
        { cmd: 'pest', icon: 'fas fa-bug', title: 'Run Pest Tests', desc: 'Run Pest tests', type: 'danger' },
        { cmd: 'pest-coverage', icon: 'fas fa-chart-line', title: 'Pest Coverage', desc: 'Run Pest tests with coverage', type: 'info' }
    ],
    projectManagement: [
        { cmd: 'path', icon: 'fas fa-folder-open', title: 'Show Project Path', desc: 'Show current Laravel application path', type: 'secondary' },
        { cmd: 'switch-path', icon: 'fas fa-exchange-alt', title: 'Switch Project Path', desc: 'Switch the project directory path in .env', type: 'primary', hasInput: true, placeholder: 'e.g., path="new/path"' },
        { cmd: 'create-project', icon: 'fas fa-plus-circle', title: 'Create New Project', desc: 'Create a new Laravel project in a specified path', type: 'success', hasInput: true, placeholder: 'e.g., path="projects/myapp"' }
    ],
    maintenance: [
        { cmd: 'permissions', icon: 'fas fa-lock', title: 'Fix Permissions', desc: 'Fix Laravel file permissions within the container', type: 'warning' },
        { cmd: 'clean', icon: 'fas fa-trash-alt', title: 'Clean Project', desc: 'Stop and remove all containers, networks, and volumes', type: 'danger' },
        { cmd: 'clean-all', icon: 'fas fa-skull-crossbones', title: 'Clean ALL Docker (DANGEROUS!)', desc: 'Stop and remove ALL Docker data on your system', type: 'danger', confirm: true },
        { cmd: 'prune', icon: 'fas fa-cut', title: 'Prune Docker', desc: 'Prune unused Docker images, containers, volumes, and networks', type: 'warning' },
        { cmd: 'fresh', icon: 'fas fa-sync-alt', title: 'Fresh Install', desc: 'Perform a fresh installation (clean, build, install)', type: 'primary', confirm: true }
    ],
    database: [
        { cmd: 'db-shell', icon: 'fas fa-database', title: 'DB Shell', desc: 'Access the MySQL client shell in the container', type: 'info' },
        { cmd: 'db-dump', icon: 'fas fa-download', title: 'Dump DB', desc: 'Dump the database to a SQL file on the host', type: 'success' },
        { cmd: 'db-restore', icon: 'fas fa-upload', title: 'Restore DB', desc: 'Restore the database from a SQL file', type: 'warning', hasInput: true, placeholder: 'e.g., file="my-backup.sql"' },
        { cmd: 'db-reset', icon: 'fas fa-redo-alt', title: 'Reset DB (Wipes Data!)', desc: 'Reset the database (fresh migrate & seed)', type: 'danger', confirm: true }
    ],
    monitoringDebugging: [
        { cmd: 'status', icon: 'fas fa-info-circle', title: 'Container Status', desc: 'Show running Docker container status', type: 'info' },
        { cmd: 'top', icon: 'fas fa-chart-area', title: 'Container Processes', desc: 'Show running processes within containers', type: 'secondary' },
        { cmd: 'stats', icon: 'fas fa-chart-line', title: 'Container Stats (Live)', desc: 'Show real-time container resource usage', type: 'primary' },
        { cmd: 'health', icon: 'fas fa-heartbeat', title: 'Health Check', desc: 'Run project-specific health checks', type: 'success' },
        { cmd: 'debug', icon: 'fas fa-bug', title: 'Debug Script', desc: 'Run project-specific debug script', type: 'danger' }
    ],
    utilities: [
        { cmd: 'urls', icon: 'fas fa-link', title: 'Show URLs', desc: 'Display common application URLs', type: 'info' },
        { cmd: 'info', icon: 'fas fa-info', title: 'Env Info', desc: 'Show environment and project information', type: 'secondary' },
        { cmd: 'update', icon: 'fas fa-sync-alt', title: 'Update All Dependencies', desc: 'Update all project dependencies (Composer & NPM/Bun)', type: 'success' },
        { cmd: 'backup', icon: 'fas fa-save', title: 'Full Project Backup', desc: 'Create a full project backup (DB dump + code archive)', type: 'primary' },
        { cmd: 'ide-helper', icon: 'fas fa-lightbulb', title: 'Generate IDE Helpers', desc: 'Generate Laravel IDE helper files', type: 'warning' },
        { cmd: 'clear-logs', icon: 'fas fa-eraser', title: 'Clear App Logs', desc: 'Clear application log files in storage/logs', type: 'danger' },
        { cmd: 'restart-workers', icon: 'fas fa-redo', title: 'Restart Workers', desc: 'Restart all background workers', type: 'primary' },
        { cmd: 'quick-start', icon: 'fas fa-rocket', title: 'Quick Start Guide', desc: 'Show a quick start guide for new users', type: 'primary' }
    ]
};

// Event Listeners setup (called after DOMContentLoaded)
function setupEventListeners() {
    // Assign UI elements here, after DOM is ready
    commandOutput = document.getElementById('command-output');
    terminalInput = document.getElementById('terminal-input');
    loadingOverlay = document.getElementById('loading-overlay');
    loadingMessage = document.getElementById('loading-message');
    loadingSubMessage = document.getElementById('loading-sub-message');
    searchInput = document.getElementById('command-search-input');
    commandsContainer = document.getElementById('commands-container');
    logOutput = document.getElementById('logs-container');
    logServiceSelect = document.getElementById('log-service');
    rootEnvContent = document.getElementById('root-env-content');
    laravelEnvContent = document.getElementById('laravel-env-content');
    saveRootEnvBtn = document.getElementById('save-root-env');
    saveLaravelEnvBtn = document.getElementById('save-laravel-env');
    laravelEnvPathDisplay = document.getElementById('laravel-env-path-display');
    urlsListContainer = document.getElementById('urls-list');


    // Command execution via terminal input
    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = terminalInput.value.trim();
                if (command) {
                    executeCommand(command);
                    terminalInput.value = ''; // Clear input immediately
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    terminalInput.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    terminalInput.value = commandHistory[historyIndex];
                } else if (historyIndex === 0) {
                    historyIndex = -1; // Go past the first item to empty
                    terminalInput.value = '';
                }
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (terminalInput) terminalInput.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (currentSection === 'overview' || currentSection === 'urls') { // Also refresh URLs
                refreshStatus();
            }
        }
        if (e.key === 'Escape') {
            if (document.activeElement) {
                document.activeElement.blur(); // Clear focus from any input
            }
            if (searchInput) searchInput.value = '';
            renderCommands(); // Show all commands
        }
    });

    // Log buttons
    document.getElementById('start-logs-btn').addEventListener('click', startLogStream);
    document.getElementById('stop-logs-btn').addEventListener('click', stopLogStream);
    if (logServiceSelect) { // Check if element exists before adding listener
        logServiceSelect.addEventListener('change', () => {
            currentLogService = logServiceSelect.value;
            if (logsActive) {
                startLogStream(); // Restart stream with new service
            }
        });
    }

    // ENV Editor buttons
    if (saveRootEnvBtn) { // Check if element exists before adding listener
        saveRootEnvBtn.addEventListener('click', () => saveEnvFile('root', rootEnvContent.value));
    }
    if (saveLaravelEnvBtn) { // Check if element exists before adding listener
        saveLaravelEnvBtn.addEventListener('click', () => saveEnvFile('laravel', laravelEnvContent.value));
    }

    // Initial check and periodic refresh for URLs when URL section is active
    setInterval(() => {
        if (currentSection === 'urls') {
            refreshStatus(); // Triggers updateServiceUrls
        }
    }, 15000); // Check every 15 seconds
}


// Socket Events
socket.on('connect', () => {
    console.log('Connected to server');
    addCommandOutput('🚀 Connected to Laravel Docker Control Panel server.', 'info');
    refreshStatus(); // Refresh status on connect
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    addCommandOutput('🔌 Disconnected from server. Attempting to reconnect...', 'error');
    showNotification('Disconnected from server. Please check the server status.', 'error');
    hideLoadingOverlay();
});

socket.on('status-update', (data) => {
    hideLoadingOverlay();
    updateDashboard(data);
    updateServiceUrls(data.environment); // Update URLs on status update
    showNotification('Dashboard status refreshed', 'success');
});

socket.on('docker-stats-update', (data) => {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;
    servicesContainer.innerHTML = ''; // Clear previous status

    if (data && data.length > 0) {
        data.forEach(service => {
            const statusColor = service.State === 'running' ? 'forge-success' : 'forge-danger';
            const iconClass = service.State === 'running' ? 'fa-check-circle' : 'fa-times-circle';
            // Use 'Service' property for service name from docker compose ps json format
            const serviceNameDisplay = service.Service || service.Names;

            servicesContainer.insertAdjacentHTML('beforeend', `
                <div class="flex items-center px-4 py-2 bg-forge-bg rounded-lg mr-2 mb-2 border border-forge-border">
                    <span class="w-3 h-3 rounded-full ${statusColor} mr-2"></span>
                    <span class="text-sm text-white">${serviceNameDisplay}: <span class="capitalize">${service.State}</span></span>
                </div>
            `);
        });
    } else {
        servicesContainer.innerHTML = '<p class="text-forge-text-dark">No Docker services found or status not available.</p>';
    }
});


socket.on('command-output', (data) => {
    // Simple output. Server should handle coloring.
    if (commandOutput) {
        commandOutput.innerHTML += data.replace(/\n/g, '<br>');
        terminalInput.scrollTop = terminalInput.scrollHeight; // Auto-scroll terminal
    }
});

socket.on('command-complete', (data) => {
    hideLoadingOverlay();
    const { statusCode, command: executedCommand } = data; // Destructure command property
    if (statusCode === 0) {
        addCommandOutput(`\nCommand 'make ${executedCommand}' completed successfully.`, 'success');
        showNotification(`Command 'make ${executedCommand}' executed successfully!`, 'success');
    } else {
        addCommandOutput(`\nCommand 'make ${executedCommand}' failed with exit code: ${statusCode}.`, 'error');
        showNotification(`Command 'make ${executedCommand}' failed! Exit Code: ${statusCode}`, 'error');
    }
    if (commandOutput) {
        commandOutput.scrollTop = commandOutput.scrollHeight;
    }
    refreshStatus(); // Refresh status after any command execution
});

socket.on('command-error', (data) => {
    hideLoadingOverlay();
    addCommandOutput(`\nError: ${data.message}`, 'error');
    if (commandOutput) {
        commandOutput.scrollTop = commandOutput.scrollHeight;
    }
    showNotification(`Command error: ${data.message}`, 'error');
});

socket.on('log-output', (data) => {
    if (logsActive && logOutput) {
        logOutput.innerHTML += data.replace(/\n/g, '<br>'); // Replace newlines for HTML
        logOutput.scrollTop = logOutput.scrollHeight;
    }
});

socket.on('log-stream-error', (data) => {
    if (logsActive) {
        addLogLine(`[LOG ERROR] ${data.message}`, 'error');
        if (logOutput) logOutput.scrollTop = logOutput.scrollHeight;
        showNotification(`Log stream error: ${data.message}`, 'error');
    }
    stopLogStream(); // Stop stream on server-side error
});

socket.on('log-stream-closed', (data) => {
    if (logsActive) { // Only show if it was actively streaming
        addLogLine(`Log stream for ${data.service} closed. Code: ${data.code}`, 'info');
    }
    stopLogStream();
});

socket.on('project-path-updated', (data) => {
    hideLoadingOverlay();
    if (data.success) {
        showNotification('Project path updated successfully!', 'success');
        updatePathInfo(); // Refresh path info after update
        refreshStatus(); // Also refresh general status
    } else {
        showNotification(`Failed to update project path: ${data.error}`, 'error');
    }
});

socket.on('url-status-update', (data) => {
    const urlElement = document.getElementById(`url-item-${data.id}`);
    if (urlElement) {
        const statusIndicator = urlElement.querySelector('.url-status-indicator');
        const pingResultEl = urlElement.querySelector('.ping-result');

        if (statusIndicator) {
            statusIndicator.classList.remove('bg-gray-500', 'bg-forge-danger', 'bg-forge-success', 'animate-pulse');
            if (data.status === 'online') {
                statusIndicator.classList.add('bg-forge-success');
            } else {
                statusIndicator.classList.add('bg-forge-danger');
            }
        }

        if (pingResultEl) {
            if (data.status === 'online') {
                pingResultEl.innerHTML = `<span class="text-forge-success">Online</span> <span class="text-forge-text-dark">(${data.time})</span>`;
            } else {
                pingResultEl.innerHTML = `<span class="text-forge-danger">Offline</span>`;
            }
        }
    }
});

socket.on('env-content', (data) => {
    hideLoadingOverlay();
    if (data.type === 'root' && rootEnvContent) {
        rootEnvContent.value = data.content;
    } else if (data.type === 'laravel' && laravelEnvContent) {
        laravelEnvContent.value = data.content;
    }
    if (data.currentCodePath && laravelEnvPathDisplay) {
        laravelEnvPathDisplay.textContent = data.currentCodePath; // Update path display for Laravel .env
    }
    showNotification(`Loaded ${data.type} .env file`, 'success');
});

socket.on('env-error', (data) => {
    hideLoadingOverlay();
    const targetTextarea = data.type === 'root' ? rootEnvContent : laravelEnvContent;
    if (targetTextarea) {
        targetTextarea.value = `Error loading ${data.type} .env file: ${data.message}`;
    }
    showNotification(`Failed to load ${data.type} .env file: ${data.message}`, 'error');
});

socket.on('env-saved', (data) => {
    hideLoadingOverlay();
    showNotification(`Saved ${data.type} .env file successfully!`, 'success');
    if (data.type === 'root') {
        showNotification('Root .env updated. Consider running "make rebuild" for Docker changes to take effect.', 'warning', 7000);
        refreshStatus(); // Re-fetch status to update CODE_PATH info
    }
});

socket.on('env-save-error', (data) => {
    hideLoadingOverlay();
    showNotification(`Failed to save ${data.type} .env file: ${data.error}`, 'error');
});

socket.on('path-info', (data) => {
    hideLoadingOverlay();
    if (document.getElementById('current-project-path')) {
        document.getElementById('current-project-path').textContent = data.currentPath || 'Not set';
    }
    if (document.getElementById('code-path-env')) {
        document.getElementById('code-path-env').textContent = data.codePathEnv || 'Not set (CODE_PATH in root .env)';
    }
    if (document.getElementById('default-project-path')) {
        document.getElementById('default-project-path').textContent = data.defaultPath || 'Not set';
    }
    if (document.getElementById('path-status-message')) {
        document.getElementById('path-status-message').textContent = data.message || '';
    }
});


// UI Update Functions
function updateDashboard(data) {
    // Docker Engine Status
    const dockerEngineStatusEl = document.getElementById('docker-engine-status');
    if (dockerEngineStatusEl) {
        dockerEngineStatusEl.textContent = data.docker.status.toUpperCase();
        dockerEngineStatusEl.className = `font-bold text-white ${data.docker.status === 'running' ? 'text-forge-success' : 'text-forge-danger'}`;
    }

    // Containers Overview
    if (document.getElementById('running-containers')) {
        document.getElementById('running-containers').textContent = data.docker.runningContainers;
    }
    if (document.getElementById('paused-containers')) {
        document.getElementById('paused-containers').textContent = data.docker.pausedContainers;
    }
    if (document.getElementById('stopped-containers')) {
        document.getElementById('stopped-containers').textContent = data.docker.stoppedContainers;
    }
    if (document.getElementById('total-images')) {
        document.getElementById('total-images').textContent = data.docker.images;
    }
    if (document.getElementById('total-volumes')) {
        document.getElementById('total-volumes').textContent = data.docker.volumes;
    }

    // Environment Variables (simplified display on overview)
    const envList = document.getElementById('env-list');
    if (envList) {
        envList.innerHTML = '';
        if (data.environment && Object.keys(data.environment).length > 0) {
            Object.entries(data.environment).forEach(([key, value]) => {
                // Filter out sensitive or excessively long variables for display
                if (key.includes('PASSWORD') || key.includes('KEY') || (typeof value === 'string' && value.length > 50)) {
                    value = '[REDACTED/TRUNCATED]';
                }
                envList.insertAdjacentHTML('beforeend', `
                    <div class="flex justify-between items-center bg-forge-bg p-2 rounded-md mb-1 border border-forge-border">
                        <span class="font-mono text-forge-primary text-sm">${key}</span>
                        <span class="text-forge-text-light text-sm break-all ml-4">${value}</span>
                    </div>
                `);
            });
        } else {
            envList.innerHTML = '<p class="text-forge-text-dark">No environment variables loaded.</p>';
        }
    }

    // Project Info
    if (document.getElementById('project-name')) {
        document.getElementById('project-name').textContent = data.project.name || 'N/A';
    }
    if (document.getElementById('project-path')) {
        document.getElementById('project-path').textContent = data.project.path || 'N/A';
    }
    if (document.getElementById('laravel-version')) {
        document.getElementById('laravel-version').textContent = data.project.laravelVersion || 'N/A';
    }
    if (document.getElementById('php-version')) {
        document.getElementById('php-version').textContent = data.project.phpVersion || 'N/A';
    }
}

function updateServiceUrls(env) {
    const baseUrl = 'http://localhost';

    const services = [
        { id: 'app', label: 'Laravel App', port: env.APP_PORT || 8000 },
        { id: 'control-panel', label: 'Control Panel', port: env.CONTROL_PANEL_PORT || 9000 },
        { id: 'vite', label: 'Vite Dev Server', port: env.VITE_PORT || 5173 },
        { id: 'phpmyadmin', label: 'PHPMyAdmin', port: env.PHPMYADMIN_PORT || 8080 },
        { id: 'redis-insight', label: 'Redis Insight', port: env.REDIS_INSIGHT_PORT || 8001 },
        { id: 'mailhog', label: 'Mailhog', port: env.MAILHOG_PORT || 8025 }
    ];

    if (!urlsListContainer) return;
    urlsListContainer.innerHTML = ''; // Clear previous URLs

    const urlsToCheck = [];

    services.forEach(service => {
        const url = `${baseUrl}:${service.port}`;
        urlsToCheck.push({ id: service.id, url: url });

        const urlHtml = `
            <div id="url-item-${service.id}" class="forge-card p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <span class="url-status-indicator w-3 h-3 rounded-full bg-gray-500 animate-pulse mr-3"></span>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-white hover:text-forge-primary font-medium">
                        ${service.label} <i class="fas fa-external-link-alt text-xs ml-2 text-forge-text-dark"></i>
                    </a>
                </div>
                <div class="flex items-center">
                    <span class="text-sm text-forge-text-dark font-mono mr-4">${service.port}</span>
                    <span class="ping-result text-sm text-forge-text-dark">Checking...</span>
                </div>
            </div>
        `;
        urlsListContainer.insertAdjacentHTML('beforeend', urlHtml);
    });

    // Emit to server to check URLs
    socket.emit('check-urls', urlsToCheck);
}


// Command execution and logging
function executeCommand(command, param = '') {
    const fullCommand = param ? `${command} ${param}` : command;
    clearCommandOutput(); // Clear terminal output before new command
    addCommandOutput(`Executing: make ${fullCommand}`, 'info');
    showLoadingOverlay(`Running 'make ${fullCommand}'...`);
    if (terminalInput) terminalInput.value = ''; // Clear input field

    // Add to history
    if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCommand) {
        commandHistory.push(fullCommand);
    }
    historyIndex = commandHistory.length; // Reset history index to end

    socket.emit('execute-command', fullCommand);
    switchSection('terminal'); // Switch to terminal view
}

function addCommandOutput(line, type = 'normal') {
    if (!commandOutput) return; // Ensure element exists

    const p = document.createElement('p');
    p.classList.add('py-0.5', 'px-1', 'rounded', 'font-mono', 'text-sm', 'whitespace-pre-wrap', 'break-words');
    switch (type) {
        case 'command':
            p.classList.add('text-forge-primary', 'font-bold');
            break;
        case 'stdout':
            p.classList.add('text-forge-text-light');
            break;
        case 'stderr':
            p.classList.add('text-forge-danger', 'font-semibold');
            break;
        case 'info':
            p.classList.add('text-forge-info', 'font-semibold');
            break;
        case 'success':
            p.classList.add('text-forge-success', 'font-semibold');
            break;
        case 'error':
            p.classList.add('text-forge-danger', 'font-bold');
            break;
        default:
            p.classList.add('text-forge-text-light');
    }
    p.textContent = line;
    commandOutput.appendChild(p);
}

function clearCommandOutput() {
    if (commandOutput) {
        commandOutput.innerHTML = '';
    }
}

// Log functions
function startLogStream() {
    if (!logServiceSelect) {
        showNotification('Log service selector not found.', 'error');
        return;
    }

    let service = logServiceSelect.value;
    if (!service) {
        showNotification('Log service not selected, defaulting to "app".', 'info');
        service = 'app';
    }

    if (logsActive && currentLogService === service) {
        showNotification(`Log stream for ${service} is already active.`, 'info');
        return;
    }

    currentLogService = service;
    logsActive = true;

    console.log('📋 Starting enhanced logs for service:', service);

    clearLogs();
    addLogLine(`🚀 Starting real-time logs for ${service}...`, 'info');
    addLogLine(`📡 Enhanced logging with real-time updates`, 'info');
    addLogLine(`⏹️  Use "Stop" button to stop logs or "Clear" to clear output`, 'info');
    addLogLine(''.padEnd(50, '─'), 'info');

    socket.emit('start-log-stream', service);
    showNotification(`Started enhanced logs for ${service}`, 'success');

    updateLogButtons(true);
}

function stopLogStream() {
    if (!logsActive) {
        showNotification('No active log stream to stop.', 'info');
        return;
    }
    logsActive = false;
    socket.emit('stop-log-stream'); // Tell server to kill log process
    addLogLine(`🛑 Stopping logs for ${currentLogService}.`, 'info');
    showNotification('Logs stopped.', 'warning');
    updateLogButtons(false);
}

function clearLogs() {
    if (logOutput) {
        logOutput.innerHTML = '';
    }
    addLogLine('Logs cleared.', 'info');
}

function addLogLine(line, type = 'normal') {
    if (!logOutput) return; // Ensure element exists

    const p = document.createElement('p');
    p.classList.add('py-0.5', 'px-1', 'rounded', 'font-mono', 'text-sm', 'whitespace-pre-wrap', 'break-words');
    const timestamp = new Date().toLocaleTimeString();

    switch (type) {
        case 'info':
            p.classList.add('text-forge-info');
            break;
        case 'success':
            p.classList.add('text-forge-success');
            break;
        case 'error':
            p.classList.add('text-forge-danger', 'font-semibold');
            break;
        case 'warning':
            p.classList.add('text-forge-warning');
            break;
        default:
            p.classList.add('text-forge-text-light');
    }
    p.textContent = `[${timestamp}] ${line}`;
    logOutput.appendChild(p);
}

function updateLogButtons(logsAreActive) {
    const startButton = document.getElementById('start-logs-btn');
    const stopButton = document.getElementById('stop-logs-btn');

    if (startButton) startButton.classList.toggle('hidden', logsAreActive);
    if (stopButton) stopButton.classList.toggle('hidden', !logsAreActive);
}

// UI Utilities
function showLoadingOverlay(message = 'Executing command...', subMessage = 'Please wait...') {
    if (loadingMessage) loadingMessage.textContent = message;
    if (loadingSubMessage) loadingSubMessage.textContent = subMessage;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return; // Ensure container exists

    const notification = document.createElement('div');
    // Using explicit Tailwind classes defined in style.css or tailwind.config.js extend
    let bgColorClass = '';
    let iconClass = '';
    switch (type) {
        case 'success':
            bgColorClass = 'bg-forge-success';
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            bgColorClass = 'bg-forge-danger';
            iconClass = 'fas fa-times-circle';
            break;
        case 'warning':
            bgColorClass = 'bg-forge-warning';
            iconClass = 'fas fa-exclamation-triangle';
            break;
        case 'info':
        default:
            bgColorClass = 'bg-forge-info';
            iconClass = 'fas fa-info-circle';
            break;
    }

    notification.classList.add(
        'notification', 'p-3', 'rounded-lg', 'shadow-soft', 'mb-3', 'flex', 'items-center',
        bgColorClass, 'text-white', 'transition-all', 'duration-300', 'transform', 'translate-y-full', 'opacity-0'
    );
    notification.innerHTML = `<i class="${iconClass} mr-2"></i> ${escapeHtml(message)}`;

    notificationContainer.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-y-full', 'opacity-0');
        notification.classList.add('translate-y-0', 'opacity-100');
    });

    if (duration > 0) {
        setTimeout(() => {
            // Animate out
            notification.classList.remove('translate-y-0', 'opacity-100');
            notification.classList.add('translate-y-full', 'opacity-0');
            notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        }, duration);
    }
}

function showConfirmation(message, onConfirm) {
    const confirmationOverlay = document.getElementById('confirmation-overlay');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (!confirmationOverlay || !confirmationMessage || !confirmBtn || !cancelBtn) {
        console.error("Confirmation overlay elements not found.");
        return;
    }

    confirmationMessage.textContent = message;
    confirmationOverlay.classList.remove('hidden');

    confirmBtn.onclick = () => {
        onConfirm();
        confirmationOverlay.classList.add('hidden');
    };

    cancelBtn.onclick = () => {
        confirmationOverlay.classList.add('hidden');
        showNotification('Operation cancelled.', 'info');
    };
}


function refreshStatus() {
    showLoadingOverlay('Refreshing dashboard status...', 'Fetching Docker and project info...');
    socket.emit('get-status');
}

function renderCommands(filter = '') {
    if (!commandsContainer) return;

    commandsContainer.innerHTML = '';
    let hasResults = false;

    for (const category in MAKEFILE_COMMANDS) {
        const filteredCommands = MAKEFILE_COMMANDS[category].filter(cmd =>
            cmd.cmd.toLowerCase().includes(filter.toLowerCase()) ||
            cmd.title.toLowerCase().includes(filter.toLowerCase()) ||
            cmd.desc.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredCommands.length > 0) {
            hasResults = true;
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'text-xl font-semibold text-white mb-4 mt-6 capitalize';
            categoryTitle.textContent = category.replace(/([A-Z])/g, ' $1').trim() + ' Commands';
            commandsContainer.appendChild(categoryTitle);

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

            filteredCommands.forEach(cmd => {
                const commandCard = document.createElement('div');
                commandCard.className = `forge-card p-5 shadow-soft flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.01]`;

                let inputHtml = '';
                if (cmd.hasInput) {
                    // Use a unique ID for the input field
                    const inputId = `input-${cmd.cmd.replace(/[^a-zA-Z0-9]/g, '-')}`;
                    inputHtml = `
                        <input type="text" id="${inputId}" placeholder="${cmd.placeholder}"
                               class="forge-input w-full mt-3"
                               onkeypress="handleCommandInput(event, this)">
                    `;
                }

                commandCard.innerHTML = `
                    <div class="flex items-center mb-3">
                        <i class="${cmd.icon} text-forge-${cmd.type} text-2xl mr-4"></i>
                        <div>
                            <h4 class="text-lg font-semibold text-white">${cmd.title}</h4>
                            <p class="text-forge-text-dark text-sm">${cmd.desc}</p>
                        </div>
                    </div>
                    ${inputHtml}
                    <button class="execute-btn forge-button forge-button-${cmd.type} mt-4 w-full"
                            data-cmd="${cmd.cmd}" ${cmd.hasInput ? 'data-has-input="true"' : ''} ${cmd.confirm ? 'data-confirm="true"' : ''}>
                        Execute <i class="fas fa-play ml-2"></i>
                    </button>
                `;
                grid.appendChild(commandCard);
            });
            commandsContainer.appendChild(grid);
        }
    }

    if (!hasResults && filter) {
        commandsContainer.innerHTML = '<p class="text-forge-text-dark text-center text-lg mt-8">No commands found matching your search.</p>';
    } else if (!hasResults && !filter) {
        // This case should ideally not happen if MAKEFILE_COMMANDS is populated
        commandsContainer.innerHTML = '<p class="text-forge-text-dark text-center text-lg mt-8">No commands configured. Check MAKEFILE_COMMANDS in app.js.</p>';
    }

    // Attach event listeners to newly rendered buttons
    document.querySelectorAll('.execute-btn').forEach(button => {
        button.onclick = () => {
            const cmd = button.dataset.cmd;
            const hasInput = button.dataset.hasInput === 'true';
            const confirm = button.dataset.confirm === 'true';
            let inputParam = '';

            if (hasInput) {
                // Get input from the specific input field associated with this button's card
                const inputElement = button.closest('.forge-card').querySelector('.forge-input');
                inputParam = inputElement ? inputElement.value.trim() : '';
                if (!inputParam) {
                    showNotification(`Parameter for '${cmd}' is required.`, 'error');
                    return;
                }
            }

            if (confirm) {
                showConfirmation(`Are you absolutely sure you want to run 'make ${cmd}${inputParam ? ' ' + inputParam : ''}'? This action might be irreversible and could lead to data loss.`, () => {
                    executeCommand(cmd, inputParam);
                });
            } else {
                executeCommand(cmd, inputParam);
            }
        };
    });
}


function setupCommandSearch() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCommands(e.target.value);
        });
    }
}

function switchSection(sectionName) {
    console.log('🔄 Switching to section:', sectionName);
    currentSection = sectionName;

    // Update sidebar with active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active', 'bg-forge-border');
    });
    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active', 'bg-forge-border');
    }

    // Update content visibility
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    const activeSection = document.getElementById(`${sectionName}-section`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // Load section-specific data
    if (sectionName === 'overview') {
        refreshStatus();
    } else if (sectionName === 'urls') {
        refreshStatus(); // This will trigger updateServiceUrls
    } else if (sectionName === 'paths') {
        updatePathInfo();
    } else if (sectionName === 'env') {
        loadEnvFiles();
    } else if (sectionName === 'logs') {
        // If switching to logs, ensure state is correct
        if (!logsActive) {
            clearLogs();
            addLogLine('Select a service and click "Start Logs" to view real-time logs...', 'info');
            updateLogButtons(false);
        }
    }
    // Analytics
    console.log(`📊 Section changed to: ${sectionName}`);
}

function executeCommandWithInput(command, inputId) {
    const inputElement = document.getElementById(inputId);
    const inputValue = inputElement ? inputElement.value.trim() : '';

    if (!inputValue) {
        showNotification(`Input is required for 'make ${command}'`, 'error');
        return;
    }

    // Special handling for commands that take a named parameter
    let fullCommand = command;
    if (command === 'artisan' || command === 'composer' || command === 'npm' || command === 'bun') {
        fullCommand = `${command} cmd="${inputValue}"`;
    } else if (command === 'switch-path' || command === 'create-project' || command === 'db-restore' || command === 'test-filter' || command === 'logs-service') {
        const paramName = command === 'switch-path' || command === 'create-project' ? 'path' :
                         command === 'db-restore' ? 'file' :
                         command === 'test-filter' ? 'name' :
                         command === 'logs-service' ? 'service' : '';
        fullCommand = `${command} ${paramName}="${inputValue}"`;
    }

    // Check for confirmation for dangerous commands
    const commandConfig = Object.values(MAKEFILE_COMMANDS).flat().find(c => c.cmd === command);
    if (commandConfig && commandConfig.confirm) {
        showConfirmation(`Are you absolutely sure you want to run 'make ${fullCommand}'? This action might be irreversible and could lead to data loss.`, () => {
            executeCommand(fullCommand);
            if (inputElement) inputElement.value = ''; // Clear input after execution
        });
    } else {
        executeCommand(fullCommand);
        if (inputElement) inputElement.value = ''; // Clear input after execution
    }
}

// Env file management functions
function loadEnvFiles() {
    showNotification('Loading .env files...', 'info');
    if (rootEnvContent) rootEnvContent.value = 'Loading...';
    if (laravelEnvContent) laravelEnvContent.value = 'Loading...';

    socket.emit('get-env-content', { type: 'root' });
    socket.emit('get-env-content', { type: 'laravel' });
}

function saveEnvFile(type) {
    let content;
    if (type === 'root') {
        content = rootEnvContent.value;
    } else if (type === 'laravel') {
        content = laravelEnvContent.value;
    } else {
        showNotification('Invalid .env file type specified for saving.', 'error');
        return;
    }
    showLoadingOverlay(`Saving ${type} .env file...`);
    socket.emit('save-env-content', { type, content });
}


// Enhanced utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ADD THE NEW FUNCTIONS HERE:
function updatePathInfo() {
    showLoadingOverlay('Loading path information...', 'Fetching project paths...');
    socket.emit('get-path-info');
}

function refreshEnvFiles() {
    loadEnvFiles();
}

function handleCommandInput(event, inputElement) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const commandCard = inputElement.closest('.forge-card');
        const executeBtn = commandCard.querySelector('.execute-btn');
        if (executeBtn) {
            executeBtn.click();
        }
    }
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

// Initial DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); // Assign UI elements and set up listeners
    switchSection('overview'); // Default to overview
    renderCommands(); // Initial render of all commands
    setupCommandSearch(); // Set up search after elements are assigned

    // Initial console welcome message
    console.log(`
🎛️ Enhanced Laravel Docker Control Panel v2.0
=============================================
🚀 Modern UI with complete Makefile integration
📊 Real-time monitoring and command execution
🎨 Forge-inspired dark theme design

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
});
