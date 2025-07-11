class LaravelManager {
    constructor() {
        this.projects = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProjects();

        // Auto-refresh every 30 seconds
        setInterval(() => this.loadProjects(), 30000);
    }

    bindEvents() {
        document.getElementById('createForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Close modal when clicking outside
        document.getElementById('createModal').addEventListener('click', (e) => {
            if (e.target.id === 'createModal') {
                this.hideCreateModal();
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.manager = new LaravelManager();
});
