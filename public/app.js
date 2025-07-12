class EnhancedLaravelManager {
    constructor() {
        this.projects = [];
        this.artisanCommands = [];
        this.filteredCommands = [];
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initWebSocket();
        this.loadProjects();
        this.loadArtisanCommands();
    }

    // WebSocket connection management
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                this.showToast('Connected to server', 'success');
                console.log('WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                console.log('WebSocket disconnected');

                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    this.showToast(`Connection lost. Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
                    setTimeout(() => this.initWebSocket(), 3000 * this.reconnectAttempts);
                } else {
                    this.showToast('Connection lost. Please refresh the page.', 'error');
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'projects_update':
                this.projects = message.data;
                this.renderProjects();
                break;

            case 'project_created':
                this.projects.push(message.data);
                this.renderProjects();
                this.showToast(`Project "${message.data.name}" created successfully!`, 'success');
                break;

            case 'project_status_change':
                this.updateProjectStatus(message.data);
                break;

            case 'projects_discovered':
                this.showToast(`Discovered ${message.data.length} existing projects!`, 'info');
                this.loadProjects(); // Refresh the full list
                break;

            default:
                console.log('Unknown WebSocket message type:', message.type);
        }
    }

    updateProjectStatus(statusData) {
        const project = this.projects.find(p => p.name === statusData.name);
        if (project) {
            project.status = statusData.status;
            if (statusData.error) {
                project.error = statusData.error;
            }
            this.renderProjects();

            // Show status change notification
            const statusMap = {
                'starting': '🚀 Starting...',
                'stopping': '⏹️ Stopping...',
                'running': '✅ Running',
                'stopped': '🔴 Stopped',
                'error': '❌ Error'
            };

            this.showToast(
                `${project.name}: ${statusMap[statusData.status] || statusData.status}`,
                statusData.status === 'error' ? 'error' : 'info'
            );
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionIndicator');
        if (!indicator) {
            // Create connection indicator if it doesn't exist
            this.createConnectionIndicator();
            return;
        }

        indicator.className = connected ? 'connection-indicator connected' : 'connection-indicator disconnected';
        indicator.title = connected ? 'Connected to server' : 'Disconnected from server';
    }

    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.className = 'connection-indicator disconnected';
        indicator.title = 'Disconnected from server';
        document.body.appendChild(indicator);
    }

    bindEvents() {
        document.getElementById('createForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Discovery button
        document.getElementById('discoverBtn').addEventListener('click', () => {
            this.discoverExistingProjects();
        });

        // Close modals when clicking outside
        document.getElementById('createModal').addEventListener('click', (e) => {
            if (e.target.id === 'createModal') {
                this.hideCreateModal();
            }
        });

        document.getElementById('envEditorModal').addEventListener('click', (e) => {
            if (e.target.id === 'envEditorModal') {
                this.hideEnvEditor();
            }
        });

        document.getElementById('artisanCommanderModal').addEventListener('click', (e) => {
            if (e.target.id === 'artisanCommanderModal') {
                this.hideArtisanCommander();
            }
        });

        document.getElementById('logsModal').addEventListener('click', (e) => {
            if (e.target.id === 'logsModal') {
                this.hideLogsViewer();
            }
        });

        // Save .env content
        document.getElementById('saveEnvBtn').addEventListener('click', () => {
            const projectName = document.getElementById('envProjectName').textContent;
            const content = document.getElementById('envContent').value;
            this.saveEnvContent(projectName, content);
        });

        // Run Artisan Command
        document.getElementById('runArtisanBtn').addEventListener('click', () => {
            const projectName = document.getElementById('artisanProjectName').textContent;
            const command = document.getElementById('artisanCommandInput').value;
            this.runArtisanCommand(projectName, command);
        });

        // Handle search input for Artisan commands
        document.getElementById('artisanCommandSearchInput').addEventListener('input', (e) => {
            this.filterArtisanCommands(e.target.value);
        });

        // Handle clicking on a command button
        document.getElementById('artisanCommandList').addEventListener('click', (e) => {
            if (e.target.classList.contains('command-btn')) {
                const command = e.target.dataset.command;
                document.getElementById('artisanCommandInput').value = command;
                document.getElementById('artisanCommandInput').focus();
            }
        });

        // Refresh logs button
        document.getElementById('refreshLogsBtn').addEventListener('click', () => {
            const projectName = document.getElementById('logsProjectName').textContent;
            const service = document.getElementById('logsServiceSelect').value;
            this.loadProjectLogs(projectName, service);
        });

        // Auto-refresh logs toggle
        document.getElementById('autoRefreshLogs').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startLogsAutoRefresh();
            } else {
                this.stopLogsAutoRefresh();
            }
        });
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            this.projects = await response.json();
            this.renderProjects();
        } catch (error) {
            this.showToast('Failed to load projects', 'error');
        }
    }

    async loadArtisanCommands() {
        try {
            const response = await fetch('/api/artisan-commands');
            if (response.ok) {
                const commands = await response.json();
                this.artisanCommands = commands.sort((a, b) => {
                    if (a.category < b.category) return -1;
                    if (a.category > b.category) return 1;
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
                this.filteredCommands = [...this.artisanCommands];
                this.renderArtisanCommandList();
            } else {
                console.error('Failed to load artisan commands:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading artisan commands:', error);
        }
    }

    async discoverExistingProjects() {
        try {
            this.showToast('Discovering existing projects...', 'info');
            const response = await fetch('/api/projects/discover', {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.discovered > 0) {
                    this.showToast(`Discovered ${result.discovered} existing projects!`, 'success');
                } else {
                    this.showToast('No new projects discovered', 'info');
                }
            } else {
                throw new Error('Failed to discover projects');
            }
        } catch (error) {
            this.showToast(`Discovery failed: ${error.message}`, 'error');
        }
    }

    filterArtisanCommands(searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        this.filteredCommands = this.artisanCommands.filter(cmd =>
            cmd.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            cmd.command.toLowerCase().includes(lowerCaseSearchTerm) ||
            (cmd.category && cmd.category.toLowerCase().includes(lowerCaseSearchTerm))
        );
        this.renderArtisanCommandList();
    }

    renderArtisanCommandList() {
        const listContainer = document.getElementById('artisanCommandList');
        listContainer.innerHTML = '';

        if (this.filteredCommands.length === 0) {
            listContainer.innerHTML = '<p class="empty-state-small">No commands found matching your search.</p>';
            return;
        }

        const categories = {};
        this.filteredCommands.forEach(cmd => {
            const category = cmd.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });

        const sortedCategoryNames = Object.keys(categories).sort();

        sortedCategoryNames.forEach(categoryName => {
            const categorySection = document.createElement('div');
            categorySection.className = 'command-category-section';
            categorySection.innerHTML = `<h3>${categoryName}</h3>`;

            const commandGrid = document.createElement('div');
            commandGrid.className = 'command-grid';

            categories[categoryName].forEach(cmd => {
                const commandBtn = document.createElement('button');
                commandBtn.className = 'command-btn';
                commandBtn.dataset.command = cmd.command;
                commandBtn.innerHTML = `
                    <div class="command-name">${cmd.name}</div>
                    <div class="command-syntax">php artisan ${cmd.command}</div>
                    ${cmd.note ? `<div class="command-note">${cmd.note}</div>` : ''}
                `;
                commandGrid.appendChild(commandBtn);
            });
            categorySection.appendChild(commandGrid);
            listContainer.appendChild(categorySection);
        });
    }

    renderProjects() {
        const container = document.getElementById('projects-container');

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first Laravel project or discover existing ones</p>
                    <button class="btn" onclick="showCreateModal()">Create New Project</button>
                    <button class="btn" onclick="manager.discoverExistingProjects()">Discover Existing</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="projects-grid">
                ${this.projects.map(project => this.renderProjectCard(project)).join('')}
            </div>
        `;
    }

    renderProjectCard(project) {
        const statusClass = this.getStatusClass(project.status);
        const actionButton = this.getActionButton(project);
        const healthIndicator = this.getHealthIndicator(project);
        const statsDisplay = this.getStatsDisplay(project);

        const services = project.services || [];
        const servicesBadges = services.map(service => {
            const icons = {
                redis: 'Redis',
                phpmyadmin: 'PHPMyAdmin',
                mailhog: 'Mailhog'
            };
            return `<span class="service-badge">${icons[service] || service}</span>`;
        }).join('');

        const versionBadges = `
            <span class="version-badge">PHP ${project.phpVersion || '8.2'}</span>
            <span class="version-badge">Node ${project.nodeVersion || '18'}</span>
        `;

        let packageManagerBadges = '';
        if (project.installBun) {
            packageManagerBadges += '<span class="package-manager-badge">Bun</span>';
        }
        if (project.installPnpm) {
            packageManagerBadges += '<span class="package-manager-badge">pnpm</span>';
        }

        const containerInfo = project.containers !== undefined ?
            `<div class="container-info">
                <span class="container-count">${project.runningContainers || 0}/${project.containers || 0} containers</span>
            </div>` : '';

        const discoveredBadge = project.discovered ?
            '<span class="discovered-badge">Discovered</span>' : '';

        return `
            <div class="project-card ${project.status}">
                <div class="project-header">
                    <div>
                        <div class="project-name">
                            ${project.name}
                            ${discoveredBadge}
                        </div>
                        <a href="http://localhost:${project.port}" target="_blank" class="project-url">
                            http://localhost:${project.port}
                        </a>
                        ${containerInfo}
                    </div>
                    <div class="status-container">
                        <div class="status ${statusClass}">
                            ${project.status}
                        </div>
                        ${healthIndicator}
                    </div>
                </div>

                ${statsDisplay}

                <div class="project-services">
                    ${versionBadges}
                    ${packageManagerBadges}
                    ${servicesBadges}
                </div>

                <div class="ports-info">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Service Ports</div>
                    <div class="ports-list">
                        <div class="port-item">
                            <span>App</span>
                            <a href="http://localhost:${project.port}" target="_blank" class="port-link">:${project.port}</a>
                        </div>
                        <div class="port-item">
                            <span>MySQL</span>
                            <span style="color: #64748b;">:${project.dbPort}</span>
                        </div>
                        ${services.includes('redis') ? `
                            <div class="port-item">
                                <span>Redis</span>
                                <span style="color: #64748b;">:${project.redisPort}</span>
                            </div>
                        ` : ''}
                        ${services.includes('phpmyadmin') ? `
                            <div class="port-item">
                                <span>PHPMyAdmin</span>
                                <a href="http://localhost:${project.phpmyadminPort}" target="_blank" class="port-link">:${project.phpmyadminPort}</a>
                            </div>
                        ` : ''}
                        ${services.includes('mailhog') ? `
                            <div class="port-item">
                                <span>Mailhog</span>
                                <a href="http://localhost:${project.mailhogPort}" target="_blank" class="port-link">:${project.mailhogPort}</a>
                            </div>
                        ` : ''}
                        <div class="port-item">
                            <span>Vite (Dev)</span>
                            <a href="http://localhost:${project.vitePort}" target="_blank" class="port-link">:${project.vitePort}</a>
                        </div>
                    </div>
                </div>

                <div class="project-info">
                    <div>Stack: Laravel + Nginx + PHP-FPM + MySQL${services.includes('redis') ? ' + Redis' : ''}</div>
                    <div>PHP ${project.phpVersion || '8.2'} | Node ${project.nodeVersion || '18'}${project.installBun ? ' | Bun' : ''}${project.installPnpm ? ' | pnpm' : ''}</div>
                    <div>Created: ${new Date(project.created).toLocaleDateString()}</div>
                    ${project.lastChecked ? `<div>Last checked: ${new Date(project.lastChecked).toLocaleTimeString()}</div>` : ''}
                </div>

                <div class="project-actions">
                    ${actionButton}
                    <button class="btn btn-sm" onclick="window.open('http://localhost:${project.port}', '_blank')">
                        Open
                    </button>
                    ${services.includes('phpmyadmin') ? `
                        <button class="btn btn-sm" onclick="window.open('http://localhost:${project.phpmyadminPort}', '_blank')">
                            Database
                        </button>
                    ` : ''}
                    <button class="btn btn-sm" onclick="manager.showEnvEditor('${project.name}')">
                        Edit .env
                    </button>
                    <button class="btn btn-sm" onclick="manager.showArtisanCommander('${project.name}')">
                        Artisan
                    </button>
                    <button class="btn btn-sm" onclick="manager.showLogsViewer('${project.name}')">
                        Logs
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="manager.deleteProject('${project.name}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusMap = {
            'running': 'status-running',
            'stopped': 'status-stopped',
            'starting': 'status-starting',
            'stopping': 'status-stopping',
            'partial': 'status-partial',
            'error': 'status-error'
        };
        return statusMap[status] || 'status-unknown';
    }

    getActionButton(project) {
        const buttonMap = {
            'running': `<button class="btn btn-danger btn-sm" onclick="manager.stopProject('${project.name}')">Stop</button>`,
            'stopped': `<button class="btn btn-success btn-sm" onclick="manager.startProject('${project.name}')">Start</button>`,
            'starting': `<button class="btn btn-sm" disabled>Starting...</button>`,
            'stopping': `<button class="btn btn-sm" disabled>Stopping...</button>`,
            'partial': `<button class="btn btn-warning btn-sm" onclick="manager.restartProject('${project.name}')">Restart</button>`,
            'error': `<button class="btn btn-danger btn-sm" onclick="manager.startProject('${project.name}')">Retry</button>`
        };
        return buttonMap[project.status] || `<button class="btn btn-sm" onclick="manager.startProject('${project.name}')">Start</button>`;
    }

    getHealthIndicator(project) {
        if (!project.health || project.status !== 'running') {
            return '';
        }

        const healthClass = {
            'healthy': 'health-good',
            'degraded': 'health-warning',
            'unhealthy': 'health-error',
            'error': 'health-error'
        }[project.health.overall] || 'health-unknown';

        const healthIcon = {
            'healthy': '🟢',
            'degraded': '🟡',
            'unhealthy': '🔴',
            'error': '❌'
        }[project.health.overall] || '❓';

        return `<div class="health-indicator ${healthClass}" title="Health: ${project.health.overall}">${healthIcon}</div>`;
    }

    getStatsDisplay(project) {
        if (!project.stats || project.status !== 'running') {
            return '';
        }

        return `
            <div class="stats-container">
                <div class="stats-grid">
                    ${project.stats.map(stat => `
                        <div class="stat-item">
                            <span class="stat-label">${stat.container}</span>
                            <span class="stat-value">CPU: ${stat.cpu || 'N/A'}</span>
                            <span class="stat-value">RAM: ${stat.memoryPercent || 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Logs viewer functionality
    showLogsViewer(projectName) {
        const logsModal = document.getElementById('logsModal');
        const logsProjectName = document.getElementById('logsProjectName');
        const logsContent = document.getElementById('logsContent');

        logsProjectName.textContent = projectName;
        logsContent.textContent = 'Loading logs...';
        logsModal.classList.add('active');

        this.loadProjectLogs(projectName);
    }

    hideLogsViewer() {
        document.getElementById('logsModal').classList.remove('active');
        this.stopLogsAutoRefresh();
    }

    async loadProjectLogs(projectName, service = '', lines = 100) {
        try {
            const logsContent = document.getElementById('logsContent');
            const url = `/api/projects/${projectName}/logs?service=${service}&lines=${lines}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                logsContent.textContent = data.logs || 'No logs available';
            } else {
                logsContent.textContent = `Error loading logs: ${data.error}`;
            }

            logsContent.scrollTop = logsContent.scrollHeight;
        } catch (error) {
            document.getElementById('logsContent').textContent = `Error: ${error.message}`;
        }
    }

    startLogsAutoRefresh() {
        if (this.logsRefreshInterval) {
            clearInterval(this.logsRefreshInterval);
        }

        this.logsRefreshInterval = setInterval(() => {
            const projectName = document.getElementById('logsProjectName').textContent;
            const service = document.getElementById('logsServiceSelect').value;
            if (projectName && document.getElementById('logsModal').classList.contains('active')) {
                this.loadProjectLogs(projectName, service);
            }
        }, 3000);
    }

    stopLogsAutoRefresh() {
        if (this.logsRefreshInterval) {
            clearInterval(this.logsRefreshInterval);
            this.logsRefreshInterval = null;
        }
    }

    // Enhanced project operations
    async createProject() {
        const form = document.getElementById('createForm');
        const formData = new FormData(form);
        const name = formData.get('name');
        const phpVersion = formData.get('phpVersion') || '8.2';
        const nodeVersion = formData.get('nodeVersion') || '18';
        const installBun = formData.has('installBun');
        const installPnpm = formData.has('installPnpm');

        if (!name || !/^[a-z0-9-]+$/.test(name)) {
            this.showToast('Invalid project name', 'error');
            return;
        }

        const services = [];
        formData.getAll('services').forEach(service => {
            services.push(service);
        });

        const customPorts = {};
        if (document.getElementById('customPortsToggle').checked) {
            const portFields = ['port', 'dbPort', 'redisPort', 'phpmyadminPort', 'mailhogPort', 'vitePort'];
            portFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    customPorts[field] = parseInt(value);
                }
            });
        }

        const projectData = {
            name,
            services,
            phpVersion,
            nodeVersion,
            installBun,
            installPnpm,
            customPorts: Object.keys(customPorts).length > 0 ? customPorts : undefined
        };

        try {
            this.showToast('Creating project...', 'info');

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                this.hideCreateModal();
                form.reset();
                // The WebSocket will handle the success notification
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showToast(`Failed to create project: ${error.message}`, 'error');
        }
    }

    async startProject(name) {
        try {
            const response = await fetch(`/api/projects/${name}/start`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to start project');
            }
            // WebSocket will handle the status updates
        } catch (error) {
            this.showToast(`Failed to start ${name}: ${error.message}`, 'error');
        }
    }

    async stopProject(name) {
        try {
            const response = await fetch(`/api/projects/${name}/stop`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to stop project');
            }
            // WebSocket will handle the status updates
        } catch (error) {
            this.showToast(`Failed to stop ${name}: ${error.message}`, 'error');
        }
    }

    async restartProject(name) {
        try {
            await this.stopProject(name);
            setTimeout(() => this.startProject(name), 3000);
        } catch (error) {
            this.showToast(`Failed to restart ${name}: ${error.message}`, 'error');
        }
    }

    async deleteProject(name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            this.showToast(`Deleting ${name}...`, 'info');

            const response = await fetch(`/api/projects/${name}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast(`${name} deleted successfully!`, 'success');
                this.loadProjects();
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error) {
            this.showToast(`Failed to delete ${name}: ${error.message}`, 'error');
        }
    }

    // Keep all existing modal and utility methods...
    showCreateModal() {
        document.getElementById('createModal').classList.add('active');
        document.getElementById('projectName').focus();
    }

    hideCreateModal() {
        document.getElementById('createModal').classList.remove('active');
    }

    async showEnvEditor(projectName) {
        const envEditorModal = document.getElementById('envEditorModal');
        const envProjectName = document.getElementById('envProjectName');
        const envContent = document.getElementById('envContent');
        envProjectName.textContent = projectName;
        envContent.value = 'Loading .env...';
        envEditorModal.classList.add('active');
        try {
            const response = await fetch(`/api/projects/${projectName}/env`);
            if (response.ok) {
                const data = await response.json();
                envContent.value = data.content;
                envContent.focus();
            } else {
                throw new Error('Failed to load .env content');
            }
        } catch (error) {
            this.showToast(`Error loading .env for ${projectName}: ${error.message}`, 'error');
            envContent.value = `Error: ${error.message}`;
        }
    }

    hideEnvEditor() {
        document.getElementById('envEditorModal').classList.remove('active');
    }

    async saveEnvContent(projectName, content) {
        try {
            this.showToast(`Saving .env for ${projectName}...`, 'info');
            const response = await fetch(`/api/projects/${projectName}/env`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.showToast(`.env for ${projectName} saved successfully!`, 'success');
                this.hideEnvEditor();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save .env content');
            }
        } catch (error) {
            this.showToast(`Error saving .env for ${projectName}: ${error.message}`, 'error');
        }
    }

    showArtisanCommander(projectName) {
        const artisanCommanderModal = document.getElementById('artisanCommanderModal');
        const artisanProjectName = document.getElementById('artisanProjectName');
        const artisanOutput = document.getElementById('artisanOutput');
        const artisanCommandInput = document.getElementById('artisanCommandInput');
        const artisanCommandSearchInput = document.getElementById('artisanCommandSearchInput');
        const artisanCommandNote = document.getElementById('artisanCommandNote');

        artisanProjectName.textContent = projectName;
        artisanOutput.textContent = '';
        artisanOutput.className = 'code-output';
        artisanCommandInput.value = '';
        artisanCommandSearchInput.value = '';
        this.filterArtisanCommands('');
        artisanCommandNote.textContent = '';
        artisanCommanderModal.classList.add('active');
        artisanCommandInput.focus();
    }

    hideArtisanCommander() {
        document.getElementById('artisanCommanderModal').classList.remove('active');
    }

    async runArtisanCommand(projectName, command) {
        const artisanOutput = document.getElementById('artisanOutput');
        const runArtisanBtn = document.getElementById('runArtisanBtn');
        const artisanCommandNote = document.getElementById('artisanCommandNote');

        if (!command.trim()) {
            this.showToast('Please enter an Artisan command.', 'error');
            return;
        }

        const selectedCmdInfo = this.artisanCommands.find(c => c.command === command.trim());
        if (selectedCmdInfo && selectedCmdInfo.interactive) {
            artisanCommandNote.textContent = selectedCmdInfo.note || 'This command is interactive and may not work as expected via web UI. Consider running it via CLI.';
            artisanCommandNote.style.color = '#fbbf24';
        } else {
            artisanCommandNote.textContent = '';
        }

        artisanOutput.textContent = `Running 'php artisan ${command}'...\n`;
        artisanOutput.className = 'code-output loading';
        runArtisanBtn.disabled = true;
        runArtisanBtn.textContent = 'Running...';

        try {
            this.showToast(`Running artisan ${command} for ${projectName}...`, 'info');
            const response = await fetch(`/api/projects/${projectName}/artisan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await response.json();

            artisanOutput.textContent = `Command: php artisan ${data.command || command}\n\n`;

            if (response.ok) {
                artisanOutput.textContent += data.output || 'No output.';
                if (data.stderr) {
                    artisanOutput.textContent += `\n\nSTDERR (if any):\n${data.stderr}`;
                }
                artisanOutput.className = 'code-output success-output';
                this.showToast(`Artisan command for ${projectName} completed successfully!`, 'success');
            } else {
                artisanOutput.textContent += `Status: ${response.status} - ${data.error || 'Unknown Error'}\n\n`;
                if (data.output) {
                    artisanOutput.textContent += `STDOUT:\n${data.output}\n\n`;
                }
                if (data.stderr) {
                    artisanOutput.textContent += `STDERR:\n${data.stderr}\n\n`;
                } else if (data.details) {
                    artisanOutput.textContent += `DETAILS:\n${data.details}\n\n`;
                }
                artisanOutput.className = 'code-output error-output';
                this.showToast(`Failed to run artisan command for ${projectName}: ${data.error || 'Check output for details.'}`, 'error');
            }
        } catch (error) {
            artisanOutput.textContent = `Network Error or unexpected response: ${error.message}`;
            artisanOutput.className = 'code-output error-output';
            this.showToast(`Network error or unexpected response: ${error.message}`, 'error');
        } finally {
            runArtisanBtn.disabled = false;
            runArtisanBtn.textContent = 'Run Artisan Command';
            artisanOutput.scrollTop = artisanOutput.scrollHeight;
        }
    }

    refreshProjects() {
        this.loadProjects();
        this.showToast('Projects refreshed', 'info');
    }

    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        toast.addEventListener('click', () => toast.remove());
    }
}

// Global functions for inline event handlers
function showCreateModal() {
    window.manager.showCreateModal();
}

function hideCreateModal() {
    window.manager.hideCreateModal();
}

function refreshProjects() {
    window.manager.refreshProjects();
}

function toggleCustomPorts() {
    const section = document.getElementById('customPortsSection');
    const toggle = document.getElementById('customPortsToggle');
    section.style.display = toggle.checked ? 'block' : 'none';
}

function showEnvEditor(projectName) {
    window.manager.showEnvEditor(projectName);
}

function hideEnvEditor() {
    window.manager.hideEnvEditor();
}

function showArtisanCommander(projectName) {
    window.manager.showArtisanCommander(projectName);
}

function hideArtisanCommander() {
    window.manager.hideArtisanCommander();
}

function showLogsViewer(projectName) {
    window.manager.showLogsViewer(projectName);
}

function hideLogsViewer() {
    window.manager.hideLogsViewer();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.manager = new EnhancedLaravelManager();
});
