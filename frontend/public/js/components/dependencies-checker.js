// Dependencies checker component
class DependenciesChecker {
    constructor() {
        this.dependencies = [];
        this.ports = [];
        this.systemInfo = {};
        this.status = {};
        this.isChecking = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();

        // Auto-check dependencies when the tab becomes active
        const dependenciesTab = document.querySelector('[data-tab="dependencies"]');
        if (dependenciesTab) {
            dependenciesTab.addEventListener('click', () => {
                if (!this.dependencies.length) {
                    setTimeout(() => this.checkDependencies(), 100);
                }
            });
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.settings-tab');
        const tabContents = document.querySelectorAll('.settings-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');

                // Remove active class from all tabs and content
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(`${tabName}-settings`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    setupEventListeners() {
        const checkBtn = document.getElementById('check-dependencies-btn');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkDependencies());
        }
    }

    async checkDependencies() {
        if (this.isChecking) return;

        this.isChecking = true;
        this.updateCheckingState(true);

        try {
            const response = await api.get('/dependencies/check');

            if (response.success) {
                this.dependencies = response.data.dependencies;
                this.ports = response.data.ports;
                this.systemInfo = response.data.system;
                this.status = response.data.status;

                this.renderDependencies();
                this.renderPortStatus();
                this.renderSystemInfo();
                this.updateOverallStatus();
            } else {
                throw new Error(response.error || 'Failed to check dependencies');
            }
        } catch (error) {
            console.error('Dependencies check failed:', error);
            toast.error(`Failed to check dependencies: ${error.message}`);
            this.renderError(error.message);
        } finally {
            this.isChecking = false;
            this.updateCheckingState(false);
        }
    }

    updateCheckingState(checking) {
        const btn = document.getElementById('check-dependencies-btn');
        const statusCircle = document.getElementById('overall-status-circle');
        const statusSummary = document.getElementById('status-summary');

        if (checking) {
            btn.textContent = 'Checking...';
            btn.disabled = true;
            statusCircle.className = 'status-circle checking';
            statusCircle.textContent = '⏳';
            statusSummary.textContent = 'Checking system dependencies...';
        } else {
            btn.innerHTML = '<span class="btn-icon">🔄</span>Check Dependencies';
            btn.disabled = false;
        }
    }

    updateOverallStatus() {
        const statusCircle = document.getElementById('overall-status-circle');
        const statusSummary = document.getElementById('status-summary');

        if (!this.status) return;

        const { required, requiredInstalled, missing, percentage } = this.status;

        statusSummary.textContent = `${requiredInstalled}/${required} required dependencies installed (${percentage}%)`;

        if (missing === 0) {
            statusCircle.className = 'status-circle healthy';
            statusCircle.textContent = '✅';
        } else if (missing <= 2) {
            statusCircle.className = 'status-circle warning';
            statusCircle.textContent = '⚠️';
        } else {
            statusCircle.className = 'status-circle error';
            statusCircle.textContent = '❌';
        }
    }

    renderDependencies() {
        const requiredContainer = document.getElementById('required-dependencies');
        const recommendedContainer = document.getElementById('recommended-dependencies');

        if (!requiredContainer || !recommendedContainer) return;

        const requiredDeps = this.dependencies.filter(dep => dep.required);
        const recommendedDeps = this.dependencies.filter(dep => dep.recommended && !dep.required);

        requiredContainer.innerHTML = requiredDeps.map(dep => this.renderDependencyCard(dep)).join('');
        recommendedContainer.innerHTML = recommendedDeps.map(dep => this.renderDependencyCard(dep)).join('');

        // Setup event listeners for dependency cards
        this.setupDependencyEventListeners();
    }

    renderDependencyCard(dep) {
        const statusClass = dep.installed ? 'installed' : 'missing';
        const statusText = dep.installed ? 'Installed' : 'Missing';
        const statusIcon = dep.installed ? '✅' : '❌';

        // Special handling for Docker daemon status
        let additionalStatus = '';
        if (dep.name === 'Docker' && dep.installed && dep.running !== undefined) {
            if (!dep.running) {
                additionalStatus = `
                    <div class="dependency-status warning">
                        <span class="status-indicator"></span>
                        Daemon not running
                    </div>
                `;
            } else {
                additionalStatus = `
                    <div class="dependency-status installed">
                        <span class="status-indicator"></span>
                        Running
                    </div>
                `;
            }
        }

        const versionInfo = dep.version ? `
            <div class="dependency-version">
                <span>Current: <span class="version-current">${dep.version}</span></span>
                <span>Expected: <span class="version-expected">${dep.expectedVersion}</span></span>
            </div>
        ` : '';

        const actions = dep.installed ? `
            <div class="dependency-actions">
                <button class="check-btn" data-dependency="${dep.name}" data-action="recheck">
                    Recheck
                </button>
            </div>
        ` : `
            <div class="dependency-actions">
                <button class="install-btn" data-dependency="${dep.name}" data-action="install">
                    Get Installation Commands
                </button>
                <button class="check-btn" data-dependency="${dep.name}" data-action="recheck">
                    Recheck
                </button>
            </div>
        `;

        return `
            <div class="dependency-card ${statusClass}">
                <div class="dependency-header">
                    <div class="dependency-info">
                        <span class="dependency-icon">${dep.icon}</span>
                        <div>
                            <h4 class="dependency-name">${dep.name}</h4>
                            <div class="dependency-category">${dep.category}</div>
                        </div>
                    </div>
                    <div class="dependency-status ${statusClass}">
                        <span class="status-indicator"></span>
                        ${statusText} ${statusIcon}
                    </div>
                </div>
                ${additionalStatus}
                <p class="dependency-description">${dep.description}</p>
                ${versionInfo}
                ${actions}
            </div>
        `;
    }

    renderPortStatus() {
        const container = document.getElementById('port-status');
        if (!container) return;

        container.innerHTML = this.ports.map(port => {
            const statusClass = port.inUse ? 'in-use' : 'available';
            const statusText = port.inUse ? 'In Use' : 'Available';
            const statusIcon = port.inUse ? '🔴' : '🟢';

            return `
                <div class="port-card ${statusClass}">
                    <div class="port-header">
                        <span class="port-number">:${port.port}</span>
                        <div class="port-status-indicator ${statusClass}">
                            <span class="status-indicator"></span>
                            ${statusText} ${statusIcon}
                        </div>
                    </div>
                    <div class="port-service">${port.service}</div>
                </div>
            `;
        }).join('');
    }

    renderSystemInfo() {
        const container = document.getElementById('system-info');
        if (!container) return;

        const { platform, architecture, nodeVersion, env } = this.systemInfo;

        const systemCards = [
            { label: 'Platform', value: platform },
            { label: 'Architecture', value: architecture },
            { label: 'Node.js', value: nodeVersion },
            { label: 'Shell', value: env.shell },
            { label: 'Memory Usage', value: this.formatMemory() }
        ];

        container.innerHTML = systemCards.map(card => `
            <div class="system-info-card">
                <div class="system-info-label">${card.label}</div>
                <div class="system-info-value">${card.value}</div>
            </div>
        `).join('');
    }

    formatMemory() {
        if (!this.systemInfo.memory) return 'Unknown';

        const { heapUsed, heapTotal } = this.systemInfo.memory;
        const usedMB = Math.round(heapUsed / 1024 / 1024);
        const totalMB = Math.round(heapTotal / 1024 / 1024);

        return `${usedMB}/${totalMB} MB`;
    }

    setupDependencyEventListeners() {
        // Install button listeners
        document.querySelectorAll('[data-action="install"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dependencyName = e.target.getAttribute('data-dependency');
                this.showInstallModal(dependencyName);
            });
        });

        // Recheck button listeners
        document.querySelectorAll('[data-action="recheck"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dependencyName = e.target.getAttribute('data-dependency');
                this.recheckDependency(dependencyName);
            });
        });
    }

    async showInstallModal(dependencyName) {
        const dependency = this.dependencies.find(dep => dep.name === dependencyName);
        if (!dependency) return;

        // Create modal HTML
        const modalHTML = `
            <div class="install-modal active" id="install-modal">
                <div class="install-modal-content">
                    <div class="install-modal-header">
                        <h3 class="install-modal-title">
                            <span>${dependency.icon}</span>
                            Install ${dependency.name}
                        </h3>
                        <button class="modal-close" onclick="this.closest('.install-modal').remove()">&times;</button>
                    </div>
                    <div class="install-modal-body">
                        <p>${dependency.description}</p>
                        <div class="install-methods">
                            ${this.renderInstallMethods(dependency)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup modal event listeners
        this.setupModalEventListeners();
    }

    renderInstallMethods(dependency) {
        const methods = dependency.installMethods || {};

        if (methods.note) {
            return `<div class="install-method">
                <div class="method-header">
                    <span class="method-name">Note</span>
                </div>
                <p>${methods.note}</p>
            </div>`;
        }

        return Object.entries(methods).map(([method, command]) => `
            <div class="install-method" data-method="${method}">
                <div class="method-header">
                    <span class="method-name">${this.getMethodDisplayName(method)}</span>
                </div>
                <div class="method-command">
                    <code>${command}</code>
                    <button class="copy-command-btn" data-command="${command}">Copy</button>
                </div>
            </div>
        `).join('');
    }

    getMethodDisplayName(method) {
        const displayNames = {
            homebrew: 'Homebrew (macOS)',
            apt: 'APT (Ubuntu/Debian)',
            yum: 'YUM (RedHat/CentOS)',
            chocolatey: 'Chocolatey (Windows)',
            winget: 'Winget (Windows)',
            download: 'Direct Download',
            nvm: 'Node Version Manager',
            script: 'Installation Script',
            snap: 'Snap Package',
            xcode: 'Xcode Command Line Tools',
            xampp: 'XAMPP',
            msys2: 'MSYS2'
        };

        return displayNames[method] || method.charAt(0).toUpperCase() + method.slice(1);
    }

    setupModalEventListeners() {
        // Copy command buttons
        document.querySelectorAll('.copy-command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.getAttribute('data-command');
                navigator.clipboard.writeText(command).then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = 'Copy';
                    }, 2000);
                    toast.success('Command copied to clipboard');
                });
            });
        });

        // Close modal on background click
        document.querySelectorAll('.install-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        });
    }

    async recheckDependency(dependencyName) {
        // For now, just recheck all dependencies
        // Could be optimized to check individual dependencies
        this.checkDependencies();
    }

    renderError(message) {
        const containers = [
            'required-dependencies',
            'recommended-dependencies',
            'port-status',
            'system-info'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>❌ Failed to load dependencies: ${message}</p>
                        <button onclick="dependenciesChecker.checkDependencies()">Retry</button>
                    </div>
                `;
            }
        });
    }
}

// Initialize dependencies checker when page loads
let dependenciesChecker;

document.addEventListener('DOMContentLoaded', () => {
    dependenciesChecker = new DependenciesChecker();
});

// Make it globally available
window.dependenciesChecker = dependenciesChecker;
