// Project card component
class ProjectCard {
    constructor(project) {
        this.project = project;
    }

    render() {
        const statusClass = `status-${this.project.status}`;
        const statusText = this.getStatusText(this.project.status);

        const ports = this.project.ports || {};
        const portBadges = Object.entries(ports)
            .map(([name, port]) => `<span class="port-badge clickable" onclick="projectActions.editService('${this.project.id}', '${name}', ${port})">${name}: ${port}</span>`)
            .join('');

        // Show progress if creating
        const progressBar = this.project.status === 'creating' && this.project.progress ?
            `<div class="project-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">${this.project.progress}</div>
            </div>` : '';

        // Service status indicators
        const serviceStatus = this.project.status === 'running' ? this.renderServiceStatus() : '';

        return `
            <div class="project-card" data-project-id="${this.project.id}">
                <div class="project-header">
                    <h3 class="project-title">${this.project.name}</h3>
                    <span class="project-status ${statusClass}">${statusText}</span>
                </div>

                <div class="project-meta">
                    <div>Template: ${this.getTemplateName(this.project.template)}</div>
                    <div>Created: ${this.formatDate(this.project.createdAt)}</div>
                    ${this.project.path ? `<div class="project-path">📁 ${this.project.path}</div>` : ''}
                </div>

                ${progressBar}

                ${portBadges ? `<div class="project-ports">${portBadges}</div>` : ''}

                ${serviceStatus}

                <div class="project-actions">
                    ${this.renderActionButtons()}
                </div>
            </div>
        `;
    }

    renderServiceStatus() {
        // Show quick service access buttons
        return `
            <div class="service-status">
                <div class="service-buttons">
                    <button class="btn btn-xs btn-secondary" onclick="projectActions.openService('${this.project.id}', 'app')" title="Open Application">
                        🌐 App
                    </button>
                    <button class="btn btn-xs btn-secondary" onclick="projectActions.openService('${this.project.id}', 'phpmyadmin')" title="Open PHPMyAdmin">
                        🗄️ DB
                    </button>
                    <button class="btn btn-xs btn-secondary" onclick="projectActions.openService('${this.project.id}', 'mailhog')" title="Open Mailhog">
                        📧 Mail
                    </button>
                    <button class="btn btn-xs btn-primary" onclick="projectActions.editPorts('${this.project.id}')" title="Edit Ports">
                        ⚙️ Ports
                    </button>
                </div>
            </div>
        `;
    }

    renderActionButtons() {
        const { status } = this.project;

        let buttons = [];

        // Start/Stop buttons
        if (status === 'stopped' || status === 'ready') {
            buttons.push(`<button class="btn btn-sm btn-primary" onclick="projectActions.start('${this.project.id}')">Start</button>`);
        } else if (status === 'running') {
            buttons.push(`<button class="btn btn-sm btn-secondary" onclick="projectActions.stop('${this.project.id}')">Stop</button>`);
        }

        // Rebuild button for error status or general maintenance
        if (status === 'error' || status === 'stopped' || status === 'ready') {
            buttons.push(`<button class="btn btn-sm btn-warning" onclick="projectActions.rebuild('${this.project.id}')" title="Force rebuild containers">🔄 Rebuild</button>`);
        }

        // Terminal button (only when running)
        if (status === 'running') {
            buttons.push(`<button class="btn btn-sm btn-secondary" onclick="projectActions.openTerminal('${this.project.id}')">Terminal</button>`);
        }

        // Edit .env button (only when ready or running)
        if (status === 'ready' || status === 'running' || status === 'stopped') {
            buttons.push(`<button class="btn btn-sm btn-secondary" onclick="projectActions.editEnv('${this.project.id}')">Edit .env</button>`);
        }

        // View logs button
        if (status === 'running') {
            buttons.push(`<button class="btn btn-sm btn-secondary" onclick="projectActions.viewLogs('${this.project.id}')">Logs</button>`);
        }

        // Delete button
        if (status !== 'creating') {
            buttons.push(`<button class="btn btn-sm btn-danger" onclick="projectActions.delete('${this.project.id}')">Delete</button>`);
        }

        return buttons.join('');
    }

    getStatusText(status) {
        const statusMap = {
            running: 'Running',
            stopped: 'Stopped',
            creating: 'Creating',
            ready: 'Ready',
            error: 'Error'
        };
        return statusMap[status] || status;
    }

    getTemplateName(template) {
        const templateMap = {
            laravel: 'Laravel',
            nodejs: 'Node.js',
            react: 'React',
            vue: 'Vue.js'
        };
        return templateMap[template] || template;
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Unknown';
        }
    }
}

// Project actions handler
class ProjectActions {
    async start(projectId) {
        try {
            // Show immediate feedback
            toast.info('Starting project containers...');

            // Update UI immediately to show starting status
            const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
            if (projectCard) {
                const statusElement = projectCard.querySelector('.project-status');
                if (statusElement) {
                    statusElement.textContent = 'Starting...';
                    statusElement.className = 'project-status status-starting';
                }
            }

            await api.startProject(projectId);
            // Note: Real-time updates will come via WebSocket

        } catch (error) {
            toast.error(`Failed to start project: ${error.message}`);
            dashboard.loadProjects(); // Refresh on error
        }
    }

    async stop(projectId) {
        try {
            // Show immediate feedback
            toast.info('Stopping project containers...');

            // Update UI immediately to show stopping status
            const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
            if (projectCard) {
                const statusElement = projectCard.querySelector('.project-status');
                if (statusElement) {
                    statusElement.textContent = 'Stopping...';
                    statusElement.className = 'project-status status-stopping';
                }
            }

            await api.stopProject(projectId);
            // Note: Real-time updates will come via WebSocket

        } catch (error) {
            toast.error(`Failed to stop project: ${error.message}`);
            dashboard.loadProjects(); // Refresh on error
        }
    }

    async rebuild(projectId) {
        if (!confirm('This will rebuild all containers from scratch. Continue?')) {
            return;
        }

        try {
            toast.info('Rebuilding project containers...');
            await api.rebuildProject(projectId);
            toast.success('Project rebuilt successfully');
            dashboard.loadProjects(); // Refresh projects
        } catch (error) {
            toast.error(`Failed to rebuild project: ${error.message}`);
        }
    }

    async delete(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            toast.info('Deleting project...');
            await api.deleteProject(projectId);
            toast.success('Project deleted successfully');
            dashboard.loadProjects(); // Refresh projects
        } catch (error) {
            toast.error(`Failed to delete project: ${error.message}`);
        }
    }

    async openTerminal(projectId) {
        try {
            const project = await api.getProject(projectId);
            const terminalModal = modalManager.get('terminal-modal');

            if (terminalModal) {
                // Set project name in modal
                const projectNameElement = document.getElementById('terminal-project-name');
                if (projectNameElement) {
                    projectNameElement.textContent = project.name;
                }

                // Create terminal session
                const session = await api.createTerminalSession(projectId, `/projects/${project.name}/src`);

                // Initialize terminal UI here
                this.initTerminal(session.sessionId);

                terminalModal.open();
            }
        } catch (error) {
            toast.error(`Failed to open terminal: ${error.message}`);
        }
    }

    async editEnv(projectId) {
        try {
            const project = await api.getProject(projectId);
            const envData = await api.getProjectEnv(projectId);

            // Create .env editor modal
            this.showEnvEditor(project, envData.content);

        } catch (error) {
            toast.error(`Failed to load .env file: ${error.message}`);
        }
    }

    showEnvEditor(project, content) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Edit .env - ${project.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="env-editor">
                        <textarea id="env-content" class="env-textarea" placeholder="Loading...">${content}</textarea>
                        <div class="env-actions">
                            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button class="btn btn-primary" onclick="projectActions.saveEnvFile('${project.id}')">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus textarea
        setTimeout(() => {
            const textarea = document.getElementById('env-content');
            if (textarea) textarea.focus();
        }, 100);
    }

    async saveEnvFile(projectId) {
        try {
            const content = document.getElementById('env-content').value;
            await api.updateProjectEnv(projectId, content);

            toast.success('.env file updated successfully');

            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();

        } catch (error) {
            toast.error(`Failed to save .env file: ${error.message}`);
        }
    }

    async viewLogs(projectId) {
        try {
            const project = await api.getProject(projectId);

            // Create logs viewer modal
            this.showLogsViewer(project);

        } catch (error) {
            toast.error(`Failed to load logs: ${error.message}`);
        }
    }

    showLogsViewer(project) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Container Logs - ${project.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="logs-viewer">
                        <div class="logs-controls">
                            <select id="logs-container" onchange="projectActions.switchLogsContainer('${project.id}')">
                                <option value="app">Application</option>
                                <option value="nginx">Nginx</option>
                                <option value="db">Database</option>
                                <option value="redis">Redis</option>
                            </select>
                            <button class="btn btn-sm btn-secondary" onclick="projectActions.refreshLogs('${project.id}')">Refresh</button>
                            <button class="btn btn-sm btn-secondary" onclick="projectActions.clearLogsView()">Clear</button>
                        </div>
                        <div id="logs-content" class="logs-content">
                            <div class="logs-loading">Loading logs...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Load initial logs
        this.loadContainerLogs(project.id, 'app');
    }

    async loadContainerLogs(projectId, container) {
        try {
            const logs = await api.getContainerLogs(projectId, container);
            const logsContent = document.getElementById('logs-content');
            if (logsContent) {
                logsContent.innerHTML = `<pre class="logs-text">${logs}</pre>`;
                logsContent.scrollTop = logsContent.scrollHeight;
            }
        } catch (error) {
            const logsContent = document.getElementById('logs-content');
            if (logsContent) {
                logsContent.innerHTML = `<div class="logs-error">Error loading logs: ${error.message}</div>`;
            }
        }
    }

    async switchLogsContainer(projectId) {
        const container = document.getElementById('logs-container').value;
        await this.loadContainerLogs(projectId, container);
    }

    async refreshLogs(projectId) {
        const container = document.getElementById('logs-container').value;
        await this.loadContainerLogs(projectId, container);
    }

    initTerminal(sessionId) {
        const container = document.getElementById('terminal-container');
        if (!container) return;

        // Create terminal interface
        container.innerHTML = `
            <div class="terminal-interface">
                <div class="terminal-header">
                    <span class="terminal-title">Container Terminal</span>
                    <button class="terminal-clear" onclick="projectActions.clearTerminal()">Clear</button>
                </div>
                <div id="terminal-output" class="terminal-output"></div>
                <div class="terminal-input-container">
                    <span class="terminal-prompt">$ </span>
                    <input type="text" id="terminal-input" class="terminal-input" placeholder="Enter command...">
                </div>
            </div>
        `;

        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');

        // Add welcome message
        this.addTerminalOutput('Terminal connected. Type commands and press Enter.', 'info');

        input.focus();

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (!command) return;

                input.value = '';
                input.disabled = true;

                // Show command in output
                this.addTerminalOutput(`$ ${command}`, 'command');

                try {
                    const result = await api.executeCommand(sessionId, command);
                    this.addTerminalOutput(result.output || 'Command executed', result.success ? 'output' : 'error');
                } catch (error) {
                    this.addTerminalOutput(`Error: ${error.message}`, 'error');
                } finally {
                    input.disabled = false;
                    input.focus();
                }

                // Scroll to bottom
                output.scrollTop = output.scrollHeight;
            }
        });

        // Store session ID for cleanup
        container.dataset.sessionId = sessionId;
    }

    addTerminalOutput(text, type = 'output') {
        const output = document.getElementById('terminal-output');
        if (!output) return;

        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;
        line.textContent = text;
        output.appendChild(line);

        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
    }

    clearTerminal() {
        const output = document.getElementById('terminal-output');
        if (output) {
            output.innerHTML = '';
            this.addTerminalOutput('Terminal cleared.', 'info');
        }
    }

    // Service Management
    async openService(projectId, service) {
        try {
            const project = await api.getProject(projectId);
            const ports = project.ports || {};

            let url;
            switch (service) {
                case 'app':
                    url = `http://localhost:${ports.app || 8000}`;
                    break;
                case 'phpmyadmin':
                    url = `http://localhost:${ports.phpmyadmin || 8080}`;
                    break;
                case 'mailhog':
                    url = `http://localhost:${ports.mailhog || 8025}`;
                    break;
                default:
                    toast.error('Unknown service');
                    return;
            }

            window.open(url, '_blank');
        } catch (error) {
            toast.error(`Failed to open service: ${error.message}`);
        }
    }

    async editPorts(projectId) {
        try {
            const project = await api.getProject(projectId);
            this.showPortEditor(project);
        } catch (error) {
            toast.error(`Failed to load project: ${error.message}`);
        }
    }

    showPortEditor(project) {
        const ports = project.ports || {};

        // Define all possible services with descriptions
        const allServices = {
            app: { description: 'Main Application', default: project.template === 'laravel' ? 8000 : 3000 },
            vite: { description: 'Vite Dev Server', default: 5173 },
            db: { description: 'MySQL Database', default: 3306 },
            redis: { description: 'Redis Cache', default: 6379 },
            phpmyadmin: { description: 'PHPMyAdmin', default: 8080 },
            mailhog: { description: 'Mailhog Email Testing', default: 8025 }
        };

        const modal = document.createElement('div');
        modal.className = 'modal active';

        const portInputs = Object.entries(allServices).map(([serviceName, serviceInfo]) => {
            const currentPort = ports[serviceName] || serviceInfo.default;
            return `
                <div class="form-group">
                    <label for="port-${serviceName}">
                        ${serviceInfo.description}
                        <span class="port-hint">Current: ${currentPort}</span>
                    </label>
                    <input type="number" id="port-${serviceName}" name="${serviceName}"
                           value="${currentPort}" min="1000" max="65535"
                           class="port-input" data-service="${serviceName}">
                    <div id="port-${serviceName}-status" class="port-status"></div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Service Ports - ${project.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="port-editor-info">
                        <p>⚠️ Changing ports will restart all containers</p>
                        <p>💡 Ports will be checked for conflicts automatically</p>
                    </div>
                    <form id="ports-form">
                        ${portInputs}
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="projectActions.checkPortsAndUpdate('${project.id}')">Check Ports & Update</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add real-time port checking
        const inputs = modal.querySelectorAll('.port-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.checkSinglePort(input.dataset.service, input.value, project.id);
            });
        });
    }

    async checkSinglePort(serviceName, port, projectId) {
        try {
            const result = await api.checkPorts({ [serviceName]: port }, projectId);
            const statusDiv = document.getElementById(`port-${serviceName}-status`);

            if (result.available) {
                statusDiv.innerHTML = '<span class="port-available">✅ Available</span>';
                statusDiv.className = 'port-status available';
            } else {
                const conflict = result.conflicts[0];
                statusDiv.innerHTML = `<span class="port-conflict">❌ Used by: ${conflict.conflictingProject}</span>`;
                statusDiv.className = 'port-status conflict';
            }
        } catch (error) {
            console.error('Port check failed:', error);
        }
    }

    async checkPortsAndUpdate(projectId) {
        try {
            const form = document.getElementById('ports-form');
            const formData = new FormData(form);
            const newPorts = {};

            for (const [name, port] of formData.entries()) {
                newPorts[name] = parseInt(port, 10);
            }

            // Check all ports for conflicts
            const portCheck = await api.checkPorts(newPorts, projectId);

            if (!portCheck.available) {
                const conflictMessages = portCheck.conflicts.map(c =>
                    `${c.service} (${c.port}) is used by ${c.conflictingProject}`
                ).join('\n');

                const proceed = confirm(`Port conflicts detected:\n\n${conflictMessages}\n\nDo you want to continue anyway?`);
                if (!proceed) return;
            }

            // Update ports
            await this.updateProjectPorts(projectId, form);

        } catch (error) {
            toast.error(`Failed to check ports: ${error.message}`);
        }
    }

    async updateProjectPorts(projectId, form) {
        try {
            const formData = new FormData(form);
            const newPorts = {};

            for (const [name, port] of formData.entries()) {
                newPorts[name] = parseInt(port, 10);
            }

            toast.info('Regenerating Docker configuration with new ports...');

            // Update project configuration with regenerateDocker flag
            // This will use the SAME process as project creation but only for Docker files
            await api.updateProject(projectId, {
                ports: newPorts,
                regenerateDocker: true
            });

            toast.success('Docker files regenerated with new ports!');

            // Close modal first
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();

            // Ask user if they want to restart now
            const shouldRestart = confirm(
                'Docker configuration updated successfully!\n\n' +
                'Files regenerated:\n' +
                '• docker-compose.yml\n' +
                '• Supporting Docker configs\n\n' +
                'Would you like to restart the containers now to apply the changes?'
            );

            if (shouldRestart) {
                try {
                    toast.info('Restarting containers with new configuration...');

                    // Stop containers
                    await api.stopProject(projectId);

                    // Wait for containers to fully stop
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Start with new configuration
                    await api.startProject(projectId);

                    toast.success('Containers restarted with new ports! 🎉');
                } catch (error) {
                    toast.error(`Restart failed: ${error.message}`);
                    toast.info('Try manually stopping and starting the project.');
                }
            } else {
                toast.info('Configuration updated. Restart the project when ready to apply changes.');
            }

            // Refresh projects to show updated data
            dashboard.loadProjects();

        } catch (error) {
            toast.error(`Failed to update configuration: ${error.message}`);
            console.error('Port update error:', error);
        }
    }

    async editService(projectId, serviceName, currentPort) {
        // Quick edit for individual service port
        const newPort = prompt(`Enter new port for ${serviceName}:`, currentPort);
        if (newPort && newPort !== currentPort.toString()) {
            try {
                const project = await api.getProject(projectId);
                project.ports[serviceName] = parseInt(newPort, 10);

                await api.updateProject(projectId, { ports: project.ports });
                toast.success(`${serviceName} port updated to ${newPort}! Restarting...`);

                // Restart project
                await api.stopProject(projectId);
                await api.startProject(projectId);

                dashboard.loadProjects();
            } catch (error) {
                toast.error(`Failed to update port: ${error.message}`);
            }
        }
    }
}

// Create global project actions instance
window.projectActions = new ProjectActions();
