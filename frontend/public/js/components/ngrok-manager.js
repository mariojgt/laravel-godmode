// Ngrok manager component
class NgrokManager {
    constructor() {
        this.tunnels = [];
        this.ngrokStatus = {
            installed: false,
            isAuthenticated: false,
            installInstructions: null
        };
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();

        // Auto-load ngrok status when the tab becomes active
        const ngrokTab = document.querySelector('[data-tab="ngrok"]');
        if (ngrokTab) {
            ngrokTab.addEventListener('click', () => {
                if (!this.isLoading) {
                    setTimeout(() => this.loadNgrokStatus(), 100);
                }
            });
        }
    }

    setupTabs() {
        // This will be handled by the existing tab system
    }

    setupEventListeners() {
        // Auth form
        const authForm = document.getElementById('ngrok-auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthentication(e));
        }

        // Create tunnel button
        const createBtn = document.getElementById('create-tunnel-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateTunnelModal());
        }

        // Stop all tunnels button
        const stopAllBtn = document.getElementById('stop-all-tunnels-btn');
        if (stopAllBtn) {
            stopAllBtn.addEventListener('click', () => this.stopAllTunnels());
        }

        // Create tunnel form
        const createForm = document.getElementById('create-tunnel-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateTunnel(e));
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') ||
                (e.target.classList.contains('modal') && e.target.id === 'create-tunnel-modal')) {
                this.closeModals();
            }
            if (e.target.dataset.action === 'cancel') {
                this.closeModals();
            }
        });
    }

    async loadNgrokStatus() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.updateLoadingState(true);

        try {
            const [statusResponse, tunnelsResponse] = await Promise.all([
                api.get('/ngrok/status'),
                api.get('/ngrok/tunnels')
            ]);

            if (statusResponse.success) {
                this.ngrokStatus = statusResponse.data;
            }

            if (tunnelsResponse.success) {
                this.tunnels = tunnelsResponse.data;
            }

            this.updateUI();

        } catch (error) {
            console.error('Failed to load ngrok status:', error);
            toast.error(`Failed to load ngrok status: ${error.message}`);
            this.renderError(error.message);
        } finally {
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    }

    updateLoadingState(loading) {
        const summary = document.getElementById('ngrok-summary');
        const createBtn = document.getElementById('create-tunnel-btn');

        if (loading) {
            if (summary) summary.textContent = 'Loading ngrok status...';
            if (createBtn) createBtn.disabled = true;
        } else {
            if (createBtn) createBtn.disabled = false;
        }
    }

    updateUI() {
        this.updateNgrokStatus();
        this.showRelevantSection();
        this.renderTunnels();
    }

    updateNgrokStatus() {
        const statusCircle = document.getElementById('ngrok-status-circle');
        const statusSummary = document.getElementById('ngrok-summary');

        if (!statusCircle || !statusSummary) return;

        const activeTunnels = this.tunnels.length;

        if (!this.ngrokStatus.installed) {
            statusCircle.textContent = '❌';
            statusSummary.textContent = 'Ngrok not installed';
        } else if (!this.ngrokStatus.isAuthenticated) {
            statusCircle.textContent = '🔐';
            statusSummary.textContent = 'Authentication required';
        } else if (activeTunnels === 0) {
            statusCircle.textContent = '🌐';
            statusSummary.textContent = 'Ready to create tunnels';
        } else {
            statusCircle.textContent = '✅';
            statusSummary.textContent = `${activeTunnels} active tunnel${activeTunnels !== 1 ? 's' : ''}`;
        }

        // Update buttons visibility
        const stopAllBtn = document.getElementById('stop-all-tunnels-btn');
        if (stopAllBtn) {
            stopAllBtn.style.display = activeTunnels > 0 ? 'inline-flex' : 'none';
        }
    }

    showRelevantSection() {
        const authSection = document.getElementById('ngrok-auth-section');
        const installSection = document.getElementById('ngrok-install-section');
        const tunnelsSection = document.getElementById('ngrok-tunnels-section');

        // Hide all sections first
        if (authSection) authSection.style.display = 'none';
        if (installSection) installSection.style.display = 'none';
        if (tunnelsSection) tunnelsSection.style.display = 'none';

        if (!this.ngrokStatus.installed) {
            // Show installation instructions
            if (installSection) {
                installSection.style.display = 'block';
                this.renderInstallInstructions();
            }
        } else if (!this.ngrokStatus.isAuthenticated) {
            // Show authentication form
            if (authSection) authSection.style.display = 'block';
        } else {
            // Show tunnels section
            if (tunnelsSection) tunnelsSection.style.display = 'block';
        }
    }

    renderInstallInstructions() {
        const stepsList = document.getElementById('install-steps-list');
        if (!stepsList || !this.ngrokStatus.installInstructions) return;

        stepsList.innerHTML = this.ngrokStatus.installInstructions.steps
            .map(step => `<li>${step}</li>`)
            .join('');
    }

    renderTunnels() {
        const container = document.getElementById('active-tunnels');
        if (!container) return;

        if (this.tunnels.length === 0) {
            container.innerHTML = `
                <div class="no-tunnels">
                    <div class="no-tunnels-icon">🌐</div>
                    <h4>No Active Tunnels</h4>
                    <p>Create your first tunnel to expose your local development server to the world.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tunnels.map(tunnel => this.renderTunnelCard(tunnel)).join('');
        this.setupTunnelEventListeners();
    }

    renderTunnelCard(tunnel) {
        const statusClass = tunnel.status === 'active' ? 'active' : 'inactive';
        const statusIcon = tunnel.status === 'active' ? '🟢' : '🔴';
        const statusText = tunnel.status === 'active' ? 'Active' : 'Stopped';

        return `
            <div class="tunnel-card ${statusClass}">
                <div class="tunnel-header">
                    <div class="tunnel-info">
                        <div class="tunnel-name">
                            <span class="tunnel-icon">🚀</span>
                            <h4>Port ${tunnel.port}</h4>
                            <span class="protocol-badge">${tunnel.protocol.toUpperCase()}</span>
                        </div>
                        <div class="tunnel-region">${tunnel.region.toUpperCase()}</div>
                    </div>
                    <div class="tunnel-status ${statusClass}">
                        <span class="status-indicator">${statusIcon}</span>
                        ${statusText}
                    </div>
                </div>

                <div class="tunnel-urls">
                    <div class="url-row">
                        <label>Public URL:</label>
                        <div class="url-container">
                            <a href="${tunnel.publicUrl}" target="_blank" class="tunnel-link">
                                ${tunnel.publicUrl} <span class="external-icon">↗</span>
                            </a>
                            <button class="copy-url-btn" data-url="${tunnel.publicUrl}">Copy</button>
                        </div>
                    </div>
                    <div class="url-row">
                        <label>Local URL:</label>
                        <div class="url-container">
                            <span class="local-url">${tunnel.localUrl}</span>
                        </div>
                    </div>
                </div>

                ${tunnel.subdomain ? `
                    <div class="tunnel-subdomain">
                        <span class="subdomain-icon">🏷️</span>
                        Custom subdomain: ${tunnel.subdomain}
                    </div>
                ` : ''}

                <div class="tunnel-meta">
                    <span class="tunnel-created">Created: ${new Date(tunnel.createdAt).toLocaleString()}</span>
                </div>

                <div class="tunnel-actions">
                    <button class="test-tunnel-btn" data-url="${tunnel.publicUrl}">
                        Test Connection
                    </button>
                    <button class="copy-url-btn" data-url="${tunnel.publicUrl}">
                        Copy URL
                    </button>
                    <button class="stop-tunnel-btn" data-tunnel-id="${tunnel.id}">
                        Stop Tunnel
                    </button>
                </div>
            </div>
        `;
    }

    setupTunnelEventListeners() {
        // Copy URL buttons
        document.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                navigator.clipboard.writeText(url);
                toast.success('URL copied to clipboard!');
            });
        });

        // Test tunnel buttons
        document.querySelectorAll('.test-tunnel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                window.open(url, '_blank');
            });
        });

        // Stop tunnel buttons
        document.querySelectorAll('.stop-tunnel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tunnelId = e.target.dataset.tunnelId;
                this.stopTunnel(tunnelId);
            });
        });
    }

    async handleAuthentication(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!data.authToken) {
            toast.error('Auth token is required');
            return;
        }

        try {
            const response = await api.post('/ngrok/auth', data);

            if (response.success) {
                toast.success('Ngrok authenticated successfully!');
                this.ngrokStatus.isAuthenticated = true;
                this.updateUI();
            } else {
                throw new Error(response.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            toast.error(`Authentication failed: ${error.message}`);
        }
    }

    showCreateTunnelModal() {
        const modal = document.getElementById('create-tunnel-modal');
        if (modal) {
            modal.style.display = 'flex';

            // Pre-fill port from running projects
            this.populatePortSuggestions();
        }
    }

    async populatePortSuggestions() {
        try {
            const projects = await api.get('/projects');
            const portInput = document.getElementById('tunnel-port');

            if (Array.isArray(projects) && projects.length > 0 && portInput) {
                // Find first running project port
                const runningProject = projects.find(p => p.status === 'running');
                if (runningProject && runningProject.ports && runningProject.ports.app) {
                    portInput.value = runningProject.ports.app;
                }
            }
        } catch (error) {
            console.log('Could not load project suggestions:', error);
        }
    }

    async handleCreateTunnel(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!data.port) {
            toast.error('Port is required');
            return;
        }

        try {
            toast.info('Creating tunnel... This may take a few seconds.');

            const response = await api.post('/ngrok/tunnels', data);

            if (response.success) {
                toast.success(`Tunnel created! ${response.data.publicUrl}`);
                this.closeModals();
                this.loadNgrokStatus(); // Refresh the list
            } else {
                throw new Error(response.error || 'Failed to create tunnel');
            }
        } catch (error) {
            console.error('Create tunnel error:', error);
            toast.error(`Failed to create tunnel: ${error.message}`);
        }
    }

    async stopTunnel(tunnelId) {
        try {
            const response = await api.delete(`/ngrok/tunnels/${tunnelId}`);

            if (response.success) {
                toast.success('Tunnel stopped successfully');
                this.loadNgrokStatus(); // Refresh the list
            } else {
                throw new Error(response.error || 'Failed to stop tunnel');
            }
        } catch (error) {
            console.error('Stop tunnel error:', error);
            toast.error(`Failed to stop tunnel: ${error.message}`);
        }
    }

    async stopAllTunnels() {
        try {
            const response = await api.post('/ngrok/stop-all');

            if (response.success) {
                toast.success(`Stopped ${response.stoppedCount} tunnel(s)`);
                this.loadNgrokStatus(); // Refresh the list
            } else {
                throw new Error(response.error || 'Failed to stop all tunnels');
            }
        } catch (error) {
            console.error('Stop all tunnels error:', error);
            toast.error(`Failed to stop tunnels: ${error.message}`);
        }
    }

    closeModals() {
        const modals = ['create-tunnel-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    renderError(errorMessage) {
        const container = document.getElementById('active-tunnels');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h4>Error Loading Ngrok</h4>
                    <p>${errorMessage}</p>
                    <button class="btn btn-primary" onclick="ngrokManager.loadNgrokStatus()">Retry</button>
                </div>
            `;
        }
    }
}

// Initialize ngrok manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ngrokManager = new NgrokManager();
});
