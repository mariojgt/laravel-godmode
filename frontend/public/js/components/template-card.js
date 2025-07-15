// Template card component
class TemplateCard {
    constructor(template) {
        this.template = template;
    }

    render() {
        return `
            <div class="template-card" data-template-id="${this.template.id}" onclick="templateActions.select('${this.template.id}')">
                <div class="template-icon">${this.template.icon || '📦'}</div>
                <h3 class="template-name">${this.template.name}</h3>
                <p class="template-description">${this.template.description}</p>
                <div class="template-meta">
                    <span class="template-category">${this.template.category}</span>
                </div>
            </div>
        `;
    }
}

// Template actions handler
class TemplateActions {
    constructor() {
        this.selectedTemplate = null;
    }

    select(templateId) {
        // Load template details and show create project modal
        this.loadTemplateDetails(templateId);
    }

    async loadTemplateDetails(templateId) {
        try {
            const template = await api.getTemplate(templateId);
            this.selectedTemplate = template;

            // Update create project modal with template info
            this.updateCreateProjectModal(template);

            // Open create project modal
            modalManager.open('create-project-modal');
        } catch (error) {
            toast.error(`Failed to load template: ${error.message}`);
        }
    }

    updateCreateProjectModal(template) {
        const templateSelect = document.getElementById('project-template');
        const templateConfig = document.getElementById('template-config');

        if (templateSelect) {
            // Set selected template
            templateSelect.value = template.id;

            // Populate template options if empty
            if (templateSelect.children.length <= 1) {
                this.populateTemplateSelect();
            }
        }

        if (templateConfig) {
            templateConfig.innerHTML = this.renderTemplateConfig(template);
        }
    }

    async populateTemplateSelect() {
        try {
            const templates = await api.getTemplates();
            const templateSelect = document.getElementById('project-template');

            if (templateSelect) {
                // Clear existing options except the first one
                while (templateSelect.children.length > 1) {
                    templateSelect.removeChild(templateSelect.lastChild);
                }

                // Add template options
                templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = `${template.icon} ${template.name}`;
                    templateSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to populate template select:', error);
        }
    }

    renderTemplateConfig(template) {
        let html = `
            <div class="template-config-header">
                <h4 style="margin-bottom: 1.5rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                    ${template.icon} Configure ${template.name}
                </h4>
                <p style="color: rgba(203, 213, 225, 0.8); margin-bottom: 2rem; font-size: 0.875rem;">
                    ${template.description}
                </p>
            </div>
        `;

        // Version selections
        if (template.versions) {
            html += `<div class="config-section">`;
            html += `<h5 class="config-section-title">🔧 Runtime Versions</h5>`;

            Object.entries(template.versions).forEach(([key, versionConfig]) => {
                html += `
                    <div class="form-group">
                        <label for="config-${key}" class="config-label">
                            ${key.toUpperCase()} Version
                            <span class="config-hint">Choose your preferred ${key} version</span>
                        </label>
                        <select id="config-${key}" name="versions.${key}" class="config-select">
                            ${versionConfig.options.map(version =>
                                `<option value="${version}" ${version === versionConfig.default ? 'selected' : ''}>
                                    ${versionConfig.labels?.[version] || version}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Package managers
        if (template.packageManagers) {
            html += `<div class="config-section">`;
            html += `<h5 class="config-section-title">📦 Package Managers</h5>`;
            html += `<p class="config-section-desc">Select additional package managers to install</p>`;

            const optionalPMs = Object.entries(template.packageManagers).filter(([key, config]) => !config.required);

            if (optionalPMs.length > 0) {
                html += `<div class="checkbox-grid">`;
                optionalPMs.forEach(([key, config]) => {
                    html += `
                        <label class="checkbox-item">
                            <input type="checkbox" name="packageManagers.${key}" ${config.default ? 'checked' : ''}>
                            <div class="checkbox-content">
                                <span class="checkbox-title">${this.capitalizeFirst(key)}</span>
                                <span class="checkbox-desc">${config.description}</span>
                            </div>
                        </label>
                    `;
                });
                html += `</div>`;
            } else {
                html += `<p class="config-note">All required package managers will be installed automatically.</p>`;
            }
            html += `</div>`;
        }

        // Services
        if (template.services) {
            html += `<div class="config-section">`;
            html += `<h5 class="config-section-title">🔧 Additional Services</h5>`;
            html += `<p class="config-section-desc">Optional services to include in your project</p>`;

            const optionalServices = Object.entries(template.services).filter(([key, config]) => !config.required);
            const requiredServices = Object.entries(template.services).filter(([key, config]) => config.required);

            if (optionalServices.length > 0) {
                html += `<div class="service-grid">`;
                optionalServices.forEach(([key, config]) => {
                    html += `
                        <label class="service-item">
                            <input type="checkbox" name="services.${key}" ${config.default ? 'checked' : ''}>
                            <div class="service-content">
                                <div class="service-header">
                                    <span class="service-icon">${config.icon || '🔧'}</span>
                                    <span class="service-title">${this.capitalizeFirst(key)}</span>
                                </div>
                                <span class="service-desc">${config.description}</span>
                                ${config.defaultPort ? `<span class="service-port">Port: ${config.defaultPort}</span>` : ''}
                            </div>
                        </label>
                    `;
                });
                html += `</div>`;
            }

            if (requiredServices.length > 0) {
                html += `<div class="required-services">`;
                html += `<h6 class="required-services-title">Required Services</h6>`;
                html += `<div class="required-services-list">`;
                requiredServices.forEach(([key, config]) => {
                    html += `
                        <div class="required-service-item">
                            <span class="service-icon">${config.icon || '✅'}</span>
                            <span class="service-name">${this.capitalizeFirst(key)}</span>
                            <span class="service-desc">${config.description}</span>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }
            html += `</div>`;
        }

        // Ports configuration
        if (template.ports) {
            html += `<div class="config-section">`;
            html += `<h5 class="config-section-title">🌐 Port Configuration</h5>`;
            html += `<p class="config-section-desc">Configure the ports for your application</p>`;

            html += `<div class="ports-grid">`;
            Object.entries(template.ports).forEach(([key, config]) => {
                html += `
                    <div class="form-group">
                        <label for="port-${key}" class="config-label">
                            ${config.description}
                            <span class="config-hint">Default: ${config.default}</span>
                        </label>
                        <input type="number" id="port-${key}" name="ports.${key}"
                               value="${config.default}" min="1000" max="65535"
                               class="config-input">
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        return html;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async handleTemplateChange(templateId) {
        if (!templateId) {
            document.getElementById('template-config').innerHTML = '';
            return;
        }

        try {
            const template = await api.getTemplate(templateId);
            this.selectedTemplate = template;

            const templateConfig = document.getElementById('template-config');
            if (templateConfig) {
                templateConfig.innerHTML = this.renderTemplateConfig(template);
            }
        } catch (error) {
            toast.error(`Failed to load template configuration: ${error.message}`);
        }
    }
}

// Create global template actions instance
window.templateActions = new TemplateActions();
