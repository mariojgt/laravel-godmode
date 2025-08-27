// Dashboard view handler
class Dashboard {
    constructor() {
        this.projects = [];
        this.init();
    }

    init() {
        // Load projects when dashboard is shown
        this.loadProjects();

        // Set up create project button
        const createBtn = document.getElementById('create-project-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateProjectModal();
            });
        }

        // Set up create project form
        const createForm = document.getElementById('create-project-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProject(e);
            });
        }

        // Set up template change handler
        const templateSelect = document.getElementById('project-template');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                templateActions.handleTemplateChange(e.target.value);
            });
        }

        // Set up form cancel button
        const cancelBtn = document.querySelector('#create-project-form [data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modalManager.close('create-project-modal');
            });
        }

        // Auto-refresh projects every 30 seconds
        setInterval(() => {
            this.loadProjects();
        }, 30000);
    }

    async loadProjects() {
        try {
            this.projects = await api.getProjects();
            this.renderProjects();
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast.error('Failed to load projects');
        }
    }

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(203, 213, 225, 0.7);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <h3 style="margin-bottom: 0.5rem;">No projects yet</h3>
                    <p>Create your first project to get started</p>
                </div>
            `;
            return;
        }

        const projectCards = this.projects.map(project => {
            const card = new ProjectCard(project);
            return card.render();
        }).join('');

        container.innerHTML = projectCards;
    }

    async showCreateProjectModal() {
        // Populate templates first
        await templateActions.populateTemplateSelect();

        // Reset form
        const form = document.getElementById('create-project-form');
        if (form) {
            form.reset();
        }

        // Clear template config
        const templateConfig = document.getElementById('template-config');
        if (templateConfig) {
            templateConfig.innerHTML = '';
        }

        // Open modal
        modalManager.open('create-project-modal');
    }

    async handleCreateProject(event) {
        const formData = new FormData(event.target);
        const projectData = {
            name: formData.get('name'),
            template: formData.get('template'),
            config: this.extractConfigFromForm(formData)
        };

        // Validate required fields
        if (!projectData.name || !projectData.template) {
            toast.error('Project name and template are required');
            return;
        }

        // Validate project name
        if (!/^[a-zA-Z0-9_-]+$/.test(projectData.name)) {
            toast.error('Project name can only contain letters, numbers, hyphens, and underscores');
            return;
        }

        // Check if project name already exists
        if (this.projects.some(p => p.name === projectData.name)) {
            toast.error('A project with this name already exists');
            return;
        }

        // Get submit button and store original text
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Create Project';

        try {
            // Check port conflicts
            if (projectData.config.ports) {
                submitBtn.textContent = 'Checking ports...';
                const portCheck = await api.checkPorts(projectData.config.ports);

                if (!portCheck.available) {
                    const conflictMessages = portCheck.conflicts.map(c =>
                        `${c.service} (${c.port}) is used by ${c.conflictingProject}`
                    ).join('\n');

                    const proceed = confirm(`Port conflicts detected:\n\n${conflictMessages}\n\nDo you want to continue anyway?`);
                    if (!proceed) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        return;
                    }
                }
            }

            // Start progress tracking for project creation
            const operation = progressManager.createProjectOperation(
                `temp-${Date.now()}`,
                projectData.name,
                'create'
            );

            // Show loading
            if (submitBtn) {
                submitBtn.textContent = 'Creating...';
                submitBtn.disabled = true;
            }

            progressManager.addLog(operation.id, 'Validating project configuration...', 'info');
            progressManager.updateOperation(operation.id, { currentStep: 0 });

            setTimeout(() => {
                progressManager.addLog(operation.id, 'Generating Docker configuration...', 'info');
                progressManager.updateOperation(operation.id, { currentStep: 1 });
            }, 1000);

            setTimeout(() => {
                progressManager.addLog(operation.id, 'Setting up project structure...', 'info');
                progressManager.updateOperation(operation.id, { currentStep: 2 });
            }, 2000);

            const response = await api.createProject(projectData);

            if (response.success) {
                progressManager.updateOperation(operation.id, { currentStep: 3 });
                progressManager.addLog(operation.id, 'Installing dependencies...', 'info');

                setTimeout(() => {
                    progressManager.updateOperation(operation.id, { currentStep: 4 });
                    progressManager.addLog(operation.id, 'Starting containers...', 'info');
                }, 1000);

                setTimeout(() => {
                    progressManager.completeOperation(operation.id, true, `Project "${projectData.name}" created successfully! 🎉`);
                    modalManager.close('create-project-modal');
                }, 2000);

                // Reload projects to show the new one
                setTimeout(() => {
                    this.loadProjects();
                }, 3000);
            } else {
                throw new Error(response.message || 'Project creation failed');
            }

        } catch (error) {
            // Complete operation with error
            const operation = Array.from(progressManager.activeOperations.values())
                .find(op => op.title.includes('Creating Project'));

            if (operation) {
                progressManager.addLog(operation.id, `Error: ${error.message}`, 'error');
                progressManager.completeOperation(operation.id, false, 'Project creation failed');
            }

            toast.error(`Failed to create project: ${error.message}`);
        } finally {
            // Reset button
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    extractConfigFromForm(formData) {
        const config = {
            versions: {},
            packageManagers: {},
            services: {},
            ports: {}
        };

        // Extract all form data and organize by category
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('versions.')) {
                const versionKey = key.replace('versions.', '');
                config.versions[versionKey] = value;
            } else if (key.startsWith('packageManagers.')) {
                const pmKey = key.replace('packageManagers.', '');
                config.packageManagers[pmKey] = true;
            } else if (key.startsWith('services.')) {
                const serviceKey = key.replace('services.', '');
                config.services[serviceKey] = true;
            } else if (key.startsWith('ports.')) {
                const portKey = key.replace('ports.', '');
                config.ports[portKey] = parseInt(value, 10);
            }
        }

        return config;
    }

    // Handle project status updates via WebSocket
    handleProjectUpdate(data) {
        if (data.type === 'project_update') {
            const projectIndex = this.projects.findIndex(p => p.id === data.projectId);
            if (projectIndex !== -1) {
                // Update project data
                Object.assign(this.projects[projectIndex], data.update);

                // Re-render projects to show updates
                this.renderProjects();

                // Show toast for important status changes
                const project = this.projects[projectIndex];
                if (project.status === 'ready') {
                    toast.success(`Project "${project.name}" is ready!`);
                } else if (project.status === 'running') {
                    toast.success(`Project "${project.name}" started successfully!`);
                } else if (project.status === 'stopped') {
                    toast.info(`Project "${project.name}" stopped.`);
                } else if (project.status === 'error') {
                    toast.error(`Project "${project.name}" error: ${project.progress || 'Unknown error'}`);
                }
            } else {
                // New project created, reload all projects
                this.loadProjects();
            }
        }
    }
}

// Create global dashboard instance
window.dashboard = new Dashboard();

// Listen for WebSocket project updates
if (window.wsManager) {
    wsManager.on('project_update', (data) => {
        dashboard.handleProjectUpdate(data);
    });
}
