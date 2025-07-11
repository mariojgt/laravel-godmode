class LaravelManager {
    constructor() {
        this.projects = [];
        this.artisanCommands = [];
        this.filteredCommands = []; // New: To store filtered commands
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProjects();
        this.loadArtisanCommands();

        // Auto-refresh every 30 seconds
        setInterval(() => this.loadProjects(), 30000);
    }

    bindEvents() {
        document.getElementById('createForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Close create modal when clicking outside
        document.getElementById('createModal').addEventListener('click', (e) => {
            if (e.target.id === 'createModal') {
                this.hideCreateModal();
            }
        });

        // Close env editor modal when clicking outside
        document.getElementById('envEditorModal').addEventListener('click', (e) => {
            if (e.target.id === 'envEditorModal') {
                this.hideEnvEditor();
            }
        });

        // Close artisan commander modal when clicking outside
        document.getElementById('artisanCommanderModal').addEventListener('click', (e) => {
            if (e.target.id === 'artisanCommanderModal') {
                this.hideArtisanCommander();
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

        // New: Handle search input for Artisan commands
        document.getElementById('artisanCommandSearchInput').addEventListener('input', (e) => {
            this.filterArtisanCommands(e.target.value);
        });

        // New: Handle clicking on a command button
        document.getElementById('artisanCommandList').addEventListener('click', (e) => {
            if (e.target.classList.contains('command-btn')) {
                const command = e.target.dataset.command;
                document.getElementById('artisanCommandInput').value = command;
                document.getElementById('artisanCommandInput').focus();
                // Optionally hide the command list or scroll to top
                // document.getElementById('artisanCommandSearchInput').value = ''; // Clear search
                // this.filterArtisanCommands(''); // Reset filter
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

    // Load Artisan Commands from JSON and categorize them
    async loadArtisanCommands() {
        try {
            const response = await fetch('/api/artisan-commands');
            if (response.ok) {
                const commands = await response.json();
                // Sort commands by category and then by name
                this.artisanCommands = commands.sort((a, b) => {
                    if (a.category < b.category) return -1;
                    if (a.category > b.category) return 1;
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
                this.filteredCommands = [...this.artisanCommands]; // Initialize filtered commands
                this.renderArtisanCommandList(); // Render initially
            } else {
                console.error('Failed to load artisan commands:', response.statusText);
                this.showToast('Failed to load recommended Artisan commands.', 'error');
            }
        } catch (error) {
            console.error('Error loading artisan commands:', error);
            this.showToast('Error loading recommended Artisan commands.', 'error');
        }
    }

    // New: Filter Artisan commands based on search input
    filterArtisanCommands(searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        this.filteredCommands = this.artisanCommands.filter(cmd =>
            cmd.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            cmd.command.toLowerCase().includes(lowerCaseSearchTerm) ||
            (cmd.category && cmd.category.toLowerCase().includes(lowerCaseSearchTerm))
        );
        this.renderArtisanCommandList();
    }

    // New: Render the categorized and searchable Artisan command list
    renderArtisanCommandList() {
        const listContainer = document.getElementById('artisanCommandList');
        listContainer.innerHTML = ''; // Clear previous content

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

        // Sort categories alphabetically
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
                    <p>Create your first Laravel project to get started</p>
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
        const statusClass = project.status === 'running' ? 'status-running' : 'status-stopped';
        const actionButton = project.status === 'running'
            ? `<button class="btn btn-danger btn-sm" onclick="manager.stopProject('${project.name}')">Stop</button>`
            : `<button class="btn btn-success btn-sm" onclick="manager.startProject('${project.name}')">Start</button>`;

        const services = project.services || [];
        const servicesBadges = services.map(service => {
            const icons = {
                redis: 'Redis',
                phpmyadmin: 'PHPMyAdmin',
                mailhog: 'Mailhog'
            };
            return `<span class="service-badge">${icons[service] || service}</span>`;
        }).join('');

        return `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-name">${project.name}</div>
                        <a href="http://localhost:${project.port}" target="_blank" class="project-url">
                            http://localhost:${project.port}
                        </a>
                    </div>
                    <div class="status ${statusClass}">
                        ${project.status}
                    </div>
                </div>

                ${services.length > 0 ? `
                    <div class="project-services">
                        ${servicesBadges}
                    </div>
                ` : ''}

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
                    <div>Supervisor: Queue Workers + Scheduler</div>
                    <div>Created: ${new Date(project.created).toLocaleDateString()}</div>
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
                    <button class="btn btn-danger btn-sm" onclick="manager.deleteProject('${project.name}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    async createProject() {
        const form = document.getElementById('createForm');
        const formData = new FormData(form);
        const name = formData.get('name');

        if (!name || !/^[a-z0-9-]+$/.test(name)) {
            this.showToast('Invalid project name', 'error');
            return;
        }

        // Get selected services
        const services = [];
        formData.getAll('services').forEach(service => {
            services.push(service);
        });

        // Get custom ports if specified
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
                const result = await response.json();
                this.showToast(`Project "${name}" created successfully!`, 'success');
                this.hideCreateModal();
                form.reset();
                this.loadProjects();
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
            this.showToast(`Starting ${name}...`, 'info');

            const response = await fetch(`/api/projects/${name}/start`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showToast(`${name} started successfully!`, 'success');
                this.loadProjects();
            } else {
                throw new Error('Failed to start project');
            }
        } catch (error) {
            this.showToast(`Failed to start ${name}`, 'error');
        }
    }

    async stopProject(name) {
        try {
            this.showToast(`Stopping ${name}...`, 'info');

            const response = await fetch(`/api/projects/${name}/stop`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showToast(`${name} stopped successfully!`, 'success');
                this.loadProjects();
            } else {
                throw new Error('Failed to stop project');
            }
        } catch (error) {
            this.showToast(`Failed to stop ${name}`, 'error');
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
            this.showToast(`Failed to delete ${name}`, 'error');
        }
    }

    showCreateModal() {
        document.getElementById('createModal').classList.add('active');
        document.getElementById('projectName').focus();
    }

    hideCreateModal() {
        document.getElementById('createModal').classList.remove('active');
    }

    // Show .env editor modal
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

    // Hide .env editor modal
    hideEnvEditor() {
        document.getElementById('envEditorModal').classList.remove('active');
    }

    // Save .env content
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

    // Show Artisan commander modal
    showArtisanCommander(projectName) {
        const artisanCommanderModal = document.getElementById('artisanCommanderModal');
        const artisanProjectName = document.getElementById('artisanProjectName');
        const artisanOutput = document.getElementById('artisanOutput');
        const artisanCommandInput = document.getElementById('artisanCommandInput');
        const artisanCommandSearchInput = document.getElementById('artisanCommandSearchInput'); // New
        const artisanCommandNote = document.getElementById('artisanCommandNote');

        artisanProjectName.textContent = projectName;
        artisanOutput.textContent = ''; // Clear previous output
        artisanOutput.className = 'code-output'; // Reset styling
        artisanCommandInput.value = ''; // Clear previous command
        artisanCommandSearchInput.value = ''; // Clear search input
        this.filterArtisanCommands(''); // Reset filter and render all commands
        artisanCommandNote.textContent = ''; // Clear note
        artisanCommanderModal.classList.add('active');
        artisanCommandInput.focus();
    }

    // Hide Artisan commander modal
    hideArtisanCommander() {
        document.getElementById('artisanCommanderModal').classList.remove('active');
    }

    // Run Artisan command (improved feedback)
    async runArtisanCommand(projectName, command) {
        const artisanOutput = document.getElementById('artisanOutput');
        const runArtisanBtn = document.getElementById('runArtisanBtn');
        const artisanCommandNote = document.getElementById('artisanCommandNote');

        if (!command.trim()) {
            this.showToast('Please enter an Artisan command.', 'error');
            return;
        }

        // Check if the command is interactive and warn the user
        const selectedCmdInfo = this.artisanCommands.find(c => c.command === command.trim());
        if (selectedCmdInfo && selectedCmdInfo.interactive) {
            artisanCommandNote.textContent = selectedCmdInfo.note || 'This command is interactive and may not work as expected via web UI. Consider running it via CLI.';
            artisanCommandNote.style.color = '#fbbf24'; // Yellow
        } else {
            artisanCommandNote.textContent = '';
        }

        artisanOutput.textContent = `Running 'php artisan ${command}'...\n`;
        artisanOutput.className = 'code-output loading'; // Add loading class
        runArtisanBtn.disabled = true; // Disable button during execution
        runArtisanBtn.textContent = 'Running...';


        try {
            this.showToast(`Running artisan ${command} for ${projectName}...`, 'info');
            const response = await fetch(`/api/projects/${projectName}/artisan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await response.json(); // Always parse JSON, even on error status

            artisanOutput.textContent = `Command: php artisan ${data.command || command}\n\n`; // Use returned command if available

            if (response.ok) {
                // Command was successful (2xx status)
                artisanOutput.textContent += data.output || 'No output.';
                if (data.stderr) {
                    artisanOutput.textContent += `\n\nSTDERR (if any):\n${data.stderr}`; // Still show stderr if there's any non-blocking message
                }
                artisanOutput.className = 'code-output success-output';
                this.showToast(`Artisan command for ${projectName} completed successfully!`, 'success');
            } else {
                // Command failed (e.g., 400 Bad Request from our server)
                artisanOutput.textContent += `Status: ${response.status} - ${data.error || 'Unknown Error'}\n\n`;
                if (data.output) { // This is stdout, even in an error case
                    artisanOutput.textContent += `STDOUT:\n${data.output}\n\n`;
                }
                if (data.stderr) { // This is the crucial part for Artisan errors
                    artisanOutput.textContent += `STDERR:\n${data.stderr}\n\n`;
                } else if (data.details) { // For 500 errors from server.js
                    artisanOutput.textContent += `DETAILS:\n${data.details}\n\n`;
                }
                artisanOutput.className = 'code-output error-output';
                this.showToast(`Failed to run artisan command for ${projectName}: ${data.error || 'Check output for details.'}`, 'error');
            }
        } catch (error) {
            // This catch block is for network errors or unparseable JSON
            artisanOutput.textContent = `Network Error or unexpected response: ${error.message}`;
            artisanOutput.className = 'code-output error-output';
            this.showToast(`Network error or unexpected response: ${error.message}`, 'error');
        } finally {
            runArtisanBtn.disabled = false;
            runArtisanBtn.textContent = 'Run Artisan Command';
            artisanOutput.scrollTop = artisanOutput.scrollHeight; // Scroll to bottom
        }
    }


    refreshProjects() {
        this.loadProjects();
        this.showToast('Projects refreshed', 'info');
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);

        // Allow manual removal
        toast.addEventListener('click', () => toast.remove());
    }
}

// Global functions for inline event handlers (now also for new modals)
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

// New Global functions for .env and Artisan
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.manager = new LaravelManager();
});
