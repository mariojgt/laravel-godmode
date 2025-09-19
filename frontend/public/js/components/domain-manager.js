// Domain manager component
class DomainManager {
    constructor() {
        this.domains = [];
        this.projects = [];
        this.hostsInfo = {};
        this.proxyStatus = {};
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();

        // Auto-load domains when the tab becomes active
        const domainsTab = document.querySelector('[data-tab="domains"]');
        if (domainsTab) {
            domainsTab.addEventListener('click', () => {
                if (!this.domains.length) {
                    setTimeout(() => this.loadDomains(), 100);
                }
            });
        }
    }

    setupTabs() {
        // This will be handled by the existing dependencies checker tab system
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-domain-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddDomainModal());
        }

        // Add domain form
        const addForm = document.getElementById('add-domain-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.handleAddDomain(e));
        }

        // Domain name input for suggestions
        const domainInput = document.getElementById('domain-name');
        if (domainInput) {
            domainInput.addEventListener('input', () => this.updateSuggestions());
        }

        // Project selection for suggestions
        const projectSelect = document.getElementById('domain-project');
        if (projectSelect) {
            projectSelect.addEventListener('change', () => {
                this.updateSuggestions();
                this.updatePortFromProject();
            });
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Proxy control handlers
        const startProxyBtn = document.getElementById('start-proxy-btn');
        if (startProxyBtn) {
            startProxyBtn.addEventListener('click', () => this.startProxy());
        }

        const stopProxyBtn = document.getElementById('stop-proxy-btn');
        if (stopProxyBtn) {
            stopProxyBtn.addEventListener('click', () => this.stopProxy());
        }
    }

    async loadDomains() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.updateLoadingState(true);

        try {
            // Load domains, projects, proxy status, and hosts info in parallel
            const [domainsResponse, projectsResponse, proxyResponse, hostsResponse] = await Promise.all([
                api.get('/domains'),
                api.get('/projects'),
                api.get('/proxy/status'),
                api.get('/domains/info')
            ]);

            if (domainsResponse.success) {
                this.domains = domainsResponse.data.domains;
            }

            // Handle projects response - it returns an array directly
            if (Array.isArray(projectsResponse)) {
                this.projects = projectsResponse;
            } else if (projectsResponse && projectsResponse.success) {
                this.projects = projectsResponse.data || [];
            } else {
                this.projects = [];
            }

            if (hostsResponse.success) {
                this.hostsInfo = hostsResponse.data;
            }

            if (proxyResponse.success) {
                this.proxyStatus = proxyResponse.data;
            }

            console.log('Loaded projects:', this.projects); // Debug log

            this.renderDomains();
            this.renderHostsInfo();
            this.updateDomainsStatus();
            this.updateProxyStatus();
            this.populateProjectSelect();

        } catch (error) {
            console.error('Failed to load domains:', error);
            toast.error(`Failed to load domains: ${error.message}`);
            this.renderError(error.message);
        } finally {
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    }

    updateLoadingState(loading) {
        const btn = document.getElementById('add-domain-btn');
        const statusSummary = document.getElementById('domains-summary');

        if (loading) {
            if (btn) btn.disabled = true;
            if (statusSummary) statusSummary.textContent = 'Loading domains...';
        } else {
            if (btn) btn.disabled = false;
            if (statusSummary) statusSummary.textContent = 'Manage custom domains for local development';
        }
    }

    updateDomainsStatus() {
        const statusCircle = document.getElementById('domains-status-circle');
        const statusSummary = document.getElementById('domains-summary');

        if (!statusCircle || !statusSummary) return;

        const activeDomains = this.domains.filter(d => d.active).length;
        const totalDomains = this.domains.length;

        statusSummary.textContent = totalDomains > 0
            ? `${totalDomains} domain${totalDomains !== 1 ? 's' : ''} configured, ${activeDomains} active`
            : 'No custom domains configured';

        if (totalDomains === 0) {
            statusCircle.textContent = '🌐';
        } else if (activeDomains === totalDomains) {
            statusCircle.textContent = '✅';
        } else {
            statusCircle.textContent = '⚠️';
        }
    }

    renderDomains() {
        const container = document.getElementById('active-domains');
        if (!container) return;

        if (this.domains.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <h3>No domains configured</h3>
                    <p>Add your first custom domain to get started with local development.</p>
                    <button class="btn btn-primary" onclick="domainManager.showAddDomainModal()">
                        Add Domain
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.domains.map(domain => this.renderDomainCard(domain)).join('');
        this.setupDomainEventListeners();
    }

    renderDomainCard(domain) {
        const statusClass = domain.active ? 'active' : 'inactive';
        const statusIcon = domain.active ? '🟢' : '🔴';
        const statusText = domain.active ? 'Active' : 'Inactive';

        // Check if domain is in proxy configuration
        const isProxied = this.proxyStatus.domains && this.proxyStatus.domains[domain.domain];
        const proxyPort = isProxied ? this.proxyStatus.domains[domain.domain] : null;

        // Determine actual port and URL
        const port = proxyPort || domain.port || 80;
        const showPort = !isProxied && port !== 80;
        const fullUrl = isProxied && this.proxyStatus.isRunning ?
            `http://${domain.domain}` :
            `http://${domain.domain}${showPort ? `:${port}` : ''}`;

        const projectInfo = domain.projectName ? `
            <div class="domain-project">
                <span class="project-icon">📁</span>
                <span>${domain.projectName}</span>
                ${isProxied ? `<span class="proxy-port-info">→ :${port}</span>` : showPort ? `<span class="port-info">:${port}</span>` : ''}
            </div>
        ` : '';

        // Proxy status indicator
        const proxyInfo = isProxied ? `
            <div class="proxy-status-info">
                <span class="proxy-icon">${this.proxyStatus.isRunning ? '⚡' : '⚠️'}</span>
                <span>${this.proxyStatus.isRunning ? 'Auto-proxy enabled' : 'Proxy configured but stopped'}</span>
            </div>
        ` : '';

        const urlInfo = `
            <div class="domain-url">
                <a href="${fullUrl}" target="_blank" class="domain-link">
                    ${fullUrl} <span class="external-icon">↗</span>
                </a>
                ${isProxied && this.proxyStatus.isRunning ? '<span class="auto-port-badge">🔄 Auto-port</span>' : ''}
            </div>
        `;

        // Enhanced warning for different scenarios
        let warningInfo = '';
        if (isProxied && !this.proxyStatus.isRunning) {
            warningInfo = `
                <div class="port-warning proxy-warning">
                    <span class="warning-icon">⚠️</span>
                    <span>Proxy server stopped. Start proxy for automatic port handling.</span>
                </div>
            `;
        } else if (!isProxied && port !== 80) {
            warningInfo = `
                <div class="port-warning">
                    <span class="warning-icon">⚠️</span>
                    <span>Ensure project is running on port ${port}</span>
                </div>
            `;
        }

        return `
            <div class="domain-card ${statusClass} ${isProxied ? 'proxied' : ''}">
                <div class="domain-header">
                    <div class="domain-info">
                        <div class="domain-name">
                            <span class="domain-icon">🌐</span>
                            <h4>${domain.domain}</h4>
                            ${isProxied ? '<span class="proxy-badge">⚡ Proxy</span>' : showPort ? `<span class="port-badge">:${port}</span>` : ''}
                        </div>
                        <div class="domain-ip">${domain.ip}</div>
                    </div>
                    <div class="domain-status ${statusClass}">
                        <span class="status-indicator">${statusIcon}</span>
                        ${statusText}
                    </div>
                </div>

                ${projectInfo}
                ${proxyInfo}
                ${urlInfo}
                ${warningInfo}

                ${domain.comment ? `<div class="domain-comment">${domain.comment}</div>` : ''}

                <div class="domain-actions">
                    <button class="test-btn" data-domain="${domain.domain}" data-port="${port}">
                        Test Connection
                    </button>
                    <button class="copy-btn" data-url="${fullUrl}">
                        Copy URL
                    </button>
                    <button class="remove-btn" data-domain="${domain.domain}">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    renderHostsInfo() {
        const container = document.getElementById('hosts-info');
        if (!container) return;

        const info = this.hostsInfo;
        const infoCards = [
            { label: 'Hosts File', value: info.hostsFile || '/etc/hosts' },
            { label: 'Platform', value: info.platform || 'Unknown' },
            { label: 'Requires Sudo', value: info.requiresSudo ? 'Yes' : 'No' },
            { label: 'Managed Domains', value: info.managedDomains || 0 }
        ];

        container.innerHTML = infoCards.map(card => `
            <div class="hosts-info-card">
                <div class="info-label">${card.label}</div>
                <div class="info-value">${card.value}</div>
            </div>
        `).join('');
    }

    setupDomainEventListeners() {
        // Test buttons
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const domain = e.target.getAttribute('data-domain');
                const port = e.target.getAttribute('data-port');
                this.testDomain(domain, port);
            });
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                this.copyUrl(url);
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const domain = e.target.getAttribute('data-domain');
                this.removeDomain(domain);
            });
        });
    }

    async showAddDomainModal() {
        const modal = document.getElementById('add-domain-modal');
        if (modal) {
            modal.classList.add('active');

            // Load projects if not already loaded
            if (this.projects.length === 0) {
                try {
                    const projectsResponse = await api.get('/projects');
                    if (Array.isArray(projectsResponse)) {
                        this.projects = projectsResponse;
                    }
                } catch (error) {
                    console.warn('Failed to load projects for modal:', error);
                }
            }

            this.populateProjectSelect();
            this.updateSuggestions();

            // Focus on domain input
            const domainInput = document.getElementById('domain-name');
            if (domainInput) {
                setTimeout(() => domainInput.focus(), 100);
            }
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));

        // Reset form
        const form = document.getElementById('add-domain-form');
        if (form) form.reset();
    }

    populateProjectSelect() {
        const select = document.getElementById('domain-project');
        if (!select) {
            console.warn('Project select element not found');
            return;
        }

        console.log('Populating project select with', this.projects.length, 'projects');

        select.innerHTML = '<option value="">Select a project</option>';

        this.projects.forEach(project => {
            console.log('Adding project:', project.name);
            select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
        });
    }

    updatePortFromProject() {
        const projectSelect = document.getElementById('domain-project');
        const portInput = document.getElementById('domain-port');

        if (!projectSelect || !portInput) return;

        const projectId = projectSelect.value;
        if (!projectId) {
            portInput.value = '80'; // Default HTTP port
            return;
        }

        const selectedProject = this.projects.find(p => p.id === projectId);
        if (selectedProject && selectedProject.ports && selectedProject.ports.app) {
            portInput.value = selectedProject.ports.app;
        } else {
            portInput.value = '8000'; // Default Laravel port
        }
    }

    async updateSuggestions() {
        const projectSelect = document.getElementById('domain-project');
        const suggestionsList = document.getElementById('suggestions-list');

        if (!suggestionsList) return;

        try {
            const projectId = projectSelect?.value;
            const selectedProject = this.projects.find(p => p.id === projectId);
            const projectName = selectedProject?.name;

            const response = await api.get('/domains/suggestions', {
                params: { projectName }
            });

            if (response.success && response.data.suggestions) {
                suggestionsList.innerHTML = response.data.suggestions
                    .slice(0, 6)
                    .map(suggestion => `
                        <button type="button" class="suggestion-btn" data-domain="${suggestion}">
                            ${suggestion}
                        </button>
                    `).join('');

                // Add click handlers for suggestions
                suggestionsList.querySelectorAll('.suggestion-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const domain = e.target.getAttribute('data-domain');
                        const domainInput = document.getElementById('domain-name');
                        if (domainInput) {
                            domainInput.value = domain;
                        }
                    });
                });
            }
        } catch (error) {
            console.warn('Failed to load suggestions:', error);
        }
    }

    async handleAddDomain(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!data.domain) {
            toast.error('Domain name is required');
            return;
        }

        // If no port specified, default to 80
        if (!data.port) {
            data.port = '80';
        }

        try {
            // First add the domain to hosts file
            const hostsResponse = await api.post('/domains', data);

            if (!hostsResponse.success) {
                // Check if this is a password error
                if (hostsResponse.passwordError) {
                    toast.error('❌ Invalid administrator password. Please try again.');
                    return;
                }
                // Check if this is a manual instruction response
                if (hostsResponse.requiresManual && hostsResponse.instructions) {
                    this.showManualInstructions(hostsResponse);
                    return;
                }
                throw new Error(hostsResponse.error || 'Failed to add domain to hosts file');
            }

            // Then add to proxy configuration if port is not 80
            if (data.port && data.port !== '80') {
                try {
                    const proxyResponse = await api.post('/proxy/domains', {
                        domain: data.domain,
                        port: parseInt(data.port)
                    });

                    if (proxyResponse.success) {
                        toast.success(`✅ Domain ${data.domain} configured for automatic port handling!`);

                        // Check if proxy is running and start it if needed
                        if (!this.proxyStatus.isRunning) {
                            toast.info('Starting proxy server for automatic port handling...');
                            await this.startProxy();
                        }
                    } else {
                        console.warn('Proxy configuration failed:', proxyResponse.error);
                        toast.warning(`Domain added to hosts file but proxy setup failed. You'll need to use ${data.domain}:${data.port}`);
                    }
                } catch (proxyError) {
                    console.warn('Proxy configuration error:', proxyError);
                    toast.warning(`Domain added to hosts file but proxy setup failed. You'll need to use ${data.domain}:${data.port}`);
                }
            } else {
                toast.success('Domain added successfully! You may need to enter your password.');
            }

            this.closeModals();
            this.loadDomains(); // Reload domains

        } catch (error) {
            console.error('Add domain error:', error);
            toast.error(`Failed to add domain: ${error.message}`);
        }
    }

    async startProxy() {
        try {
            const response = await api.post('/proxy/start');

            if (response.success) {
                this.proxyStatus.isRunning = true;
                toast.success('✅ Proxy server started! Your domains will work without ports.');
                this.updateProxyStatus();
            } else {
                if (response.requiresSudo) {
                    toast.error('⚠️ Proxy requires administrator privileges. Please run: sudo node backend/src/server.js');
                } else if (response.portInUse) {
                    toast.error('⚠️ Port 80 is in use. Stop other web servers first.');
                } else {
                    throw new Error(response.error);
                }
            }
        } catch (error) {
            console.error('Start proxy error:', error);
            toast.error(`Failed to start proxy: ${error.message}`);
        }
    }

    async stopProxy() {
        try {
            const response = await api.post('/proxy/stop');

            if (response.success) {
                this.proxyStatus.isRunning = false;
                toast.success('Proxy server stopped.');
                this.updateProxyStatus();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Stop proxy error:', error);
            toast.error(`Failed to stop proxy: ${error.message}`);
        }
    }

    updateProxyStatus() {
        // Update proxy status indicator
        const proxyIndicator = document.getElementById('proxy-status-indicator');
        if (proxyIndicator) {
            if (this.proxyStatus.isRunning) {
                proxyIndicator.innerHTML = '<span class="proxy-status running">🟢 Auto-Proxy Active</span>';
            } else {
                proxyIndicator.innerHTML = '<span class="proxy-status stopped">🔴 Auto-Proxy Stopped</span>';
            }
        }

        // Update button visibility
        const startBtn = document.getElementById('start-proxy-btn');
        const stopBtn = document.getElementById('stop-proxy-btn');

        if (startBtn && stopBtn) {
            if (this.proxyStatus.isRunning) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-flex';
            } else {
                startBtn.style.display = 'inline-flex';
                stopBtn.style.display = 'none';
            }
        }

        // Re-render domains to update proxy status in cards
        this.renderDomains();
    }

    showManualInstructions(response) {
        const instructions = response.instructions;
        const modal = this.createInstructionsModal(instructions, response.domainEntry);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createInstructionsModal(instructions, domainEntry) {
        const modal = document.createElement('div');
        modal.className = 'modal instructions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔐 Manual Setup Required</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="instructions-content">
                        <h4>${instructions.title}</h4>
                        <p class="instructions-note">${instructions.note}</p>

                        <div class="steps-container">
                            <h5>📋 Follow these steps:</h5>
                            <ol class="instruction-steps">
                                ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>

                        ${instructions.command ? `
                            <div class="command-container">
                                <h5>🔗 Quick Command:</h5>
                                <div class="command-box">
                                    <code>${instructions.command}</code>
                                    <button class="copy-command-btn" data-command="${instructions.command}">Copy</button>
                                </div>
                            </div>
                        ` : ''}

                        <div class="domain-entry-container">
                            <h5>📝 Domain Entry to Add:</h5>
                            <div class="entry-box">
                                <code>${domainEntry}</code>
                                <button class="copy-entry-btn" data-entry="${domainEntry}">Copy</button>
                            </div>
                        </div>

                        <div class="instructions-actions">
                            <button class="btn btn-secondary close-instructions">I'll do it manually</button>
                            <button class="btn btn-primary retry-with-password">Retry with Password</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.close-instructions').addEventListener('click', () => {
            modal.remove();
            this.closeModals();
        });

        modal.querySelector('.retry-with-password').addEventListener('click', () => {
            modal.remove();
            // Focus on password field
            const passwordField = document.getElementById('admin-password');
            if (passwordField) {
                passwordField.focus();
                toast.info('💡 Please enter your administrator password and try again.');
            }
        });

        // Copy button handlers
        const copyCommandBtn = modal.querySelector('.copy-command-btn');
        if (copyCommandBtn) {
            copyCommandBtn.addEventListener('click', (e) => {
                navigator.clipboard.writeText(e.target.dataset.command);
                toast.success('Command copied to clipboard!');
            });
        }

        const copyEntryBtn = modal.querySelector('.copy-entry-btn');
        if (copyEntryBtn) {
            copyEntryBtn.addEventListener('click', (e) => {
                navigator.clipboard.writeText(e.target.dataset.entry);
                toast.success('Domain entry copied to clipboard!');
            });
        }

        return modal;
    }

    async testDomain(domain, port = 80) {
        try {
            toast.info(`Testing ${domain}...`);

            const response = await api.post(`/domains/test/${domain}`, { port: parseInt(port) });

            if (response.success) {
                const { dnsResolved, httpAccessible, httpStatus } = response.data;

                if (dnsResolved && httpAccessible) {
                    toast.success(`✅ ${domain} is working! (HTTP ${httpStatus})`);
                } else if (dnsResolved && !httpAccessible) {
                    toast.warning(`⚠️ ${domain} resolves but no HTTP service (HTTP ${httpStatus || 'none'})`);
                } else {
                    toast.error(`❌ ${domain} is not resolving properly`);
                }
            } else {
                throw new Error(response.error || 'Test failed');
            }
        } catch (error) {
            console.error('Domain test error:', error);
            toast.error(`Failed to test domain: ${error.message}`);
        }
    }

    copyUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            toast.success('URL copied to clipboard');
        }).catch(() => {
            toast.error('Failed to copy URL');
        });
    }

    async removeDomain(domain) {
        if (!confirm(`Are you sure you want to remove the domain "${domain}"?`)) {
            return;
        }

        try {
            const response = await api.delete(`/domains/${domain}`);

            if (response.success) {
                toast.success('Domain removed successfully! You may need to enter your password.');
                this.loadDomains(); // Reload domains
            } else {
                throw new Error(response.error || 'Failed to remove domain');
            }
        } catch (error) {
            console.error('Remove domain error:', error);
            toast.error(`Failed to remove domain: ${error.message}`);
        }
    }

    renderError(message) {
        const container = document.getElementById('active-domains');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Failed to load domains</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="domainManager.loadDomains()">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Initialize domain manager when page loads
let domainManager;

document.addEventListener('DOMContentLoaded', () => {
    domainManager = new DomainManager();
});

// Make it globally available
window.domainManager = domainManager;
