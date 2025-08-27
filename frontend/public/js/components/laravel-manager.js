// Laravel Project Management Component
class LaravelManager {
    constructor() {
        this.currentProject = null;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('🅻 Laravel Manager initialized');
    }

    setupEventListeners() {
        // Listen for project selection
        document.addEventListener('project-selected', (event) => {
            this.setCurrentProject(event.detail.project);
        });

        // Listen for project updates
        document.addEventListener('project-updated', (event) => {
            if (this.currentProject && this.currentProject.id === event.detail.project.id) {
                this.currentProject = event.detail.project;
                this.updateLaravelUI();
            }
        });

        // Setup supervisor editor mode switching
        document.addEventListener('change', (event) => {
            if (event.target.name === 'supervisor-editor-mode') {
                this.switchSupervisorEditorMode();
            }
        });
    }

    setCurrentProject(project) {
        // Clear previous interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.currentProject = project;

        if (project && project.template === 'laravel') {
            this.showLaravelControls();
            this.loadLaravelStatus();

            // Start periodic updates
            this.updateInterval = setInterval(() => {
                this.loadLaravelStatus();
            }, 10000); // Update every 10 seconds
        } else {
            this.hideLaravelControls();
        }
    }

    showLaravelControls() {
        const laravelPanel = document.getElementById('laravel-panel');
        if (laravelPanel) {
            laravelPanel.style.display = 'block';
            this.renderLaravelControls();
        }
    }

    hideLaravelControls() {
        const laravelPanel = document.getElementById('laravel-panel');
        if (laravelPanel) {
            laravelPanel.style.display = 'none';
        }
    }

    renderLaravelControls() {
        const laravelPanel = document.getElementById('laravel-panel');
        if (!laravelPanel) return;

        laravelPanel.innerHTML = `
            <div class="laravel-manager">
                <div class="laravel-header">
                    <div class="laravel-title">
                        <span class="laravel-icon">🅻</span>
                        <h3>Laravel Controls</h3>
                        <span class="project-name">${this.currentProject.name}</span>
                    </div>
                    <div class="laravel-status" id="laravel-status">
                        <span class="loading">Loading...</span>
                    </div>
                </div>

                <div class="laravel-tabs">
                    <button class="tab-btn active" data-tab="services">Services</button>
                    <button class="tab-btn" data-tab="artisan">Artisan</button>
                    <button class="tab-btn" data-tab="queue">Queue</button>
                    <button class="tab-btn" data-tab="supervisor">Supervisor</button>
                    <button class="tab-btn" data-tab="cache">Cache</button>
                    <button class="tab-btn" data-tab="database">Database</button>
                    <button class="tab-btn" data-tab="logs">Logs</button>
                </div>

                <div class="laravel-content">
                    <!-- Services Tab -->
                    <div class="tab-content active" id="services-tab">
                        <div class="services-grid" id="services-grid">
                            <div class="loading">Loading services...</div>
                        </div>
                    </div>

                    <!-- Artisan Tab -->
                    <div class="tab-content" id="artisan-tab">
                        <div class="artisan-panel">
                            <div class="quick-commands">
                                <h4>Quick Commands</h4>
                                <div class="command-grid">
                                    <button class="cmd-btn" onclick="laravelManager.runArtisanCommand('migrate')">
                                        <span class="icon">🔄</span>
                                        <span>Migrate</span>
                                    </button>
                                    <button class="cmd-btn" onclick="laravelManager.runArtisanCommand('migrate:fresh', ['--seed'])">
                                        <span class="icon">🌱</span>
                                        <span>Fresh & Seed</span>
                                    </button>
                                    <button class="cmd-btn" onclick="laravelManager.runArtisanCommand('cache:clear')">
                                        <span class="icon">🧹</span>
                                        <span>Clear Cache</span>
                                    </button>
                                    <button class="cmd-btn" onclick="laravelManager.runArtisanCommand('route:list')">
                                        <span class="icon">📋</span>
                                        <span>Routes</span>
                                    </button>
                                    <button class="cmd-btn" onclick="laravelManager.runArtisanCommand('tinker')">
                                        <span class="icon">⚡</span>
                                        <span>Tinker</span>
                                    </button>
                                    <button class="cmd-btn" onclick="laravelManager.openArtisanModal()">
                                        <span class="icon">💻</span>
                                        <span>Custom</span>
                                    </button>
                                </div>
                            </div>
                            <div class="command-output" id="artisan-output">
                                <h4>Command Output</h4>
                                <div class="output-content">
                                    <pre id="artisan-output-content">Run an Artisan command to see output...</pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Queue Tab -->
                    <div class="tab-content" id="queue-tab">
                        <div class="queue-panel">
                            <div class="queue-controls">
                                <h4>Queue Management</h4>
                                <div class="queue-actions">
                                    <button class="btn btn-success" onclick="laravelManager.startQueueWorker()">
                                        <span class="icon">▶️</span>
                                        Start Worker
                                    </button>
                                    <button class="btn btn-danger" onclick="laravelManager.stopQueueWorkers()">
                                        <span class="icon">⏹️</span>
                                        Stop Workers
                                    </button>
                                    <button class="btn btn-secondary" onclick="laravelManager.loadQueueStatus()">
                                        <span class="icon">🔄</span>
                                        Refresh
                                    </button>
                                </div>
                            </div>
                            <div class="queue-status" id="queue-status">
                                <div class="loading">Loading queue status...</div>
                            </div>
                            <div class="queue-jobs" id="queue-jobs">
                                <h4>Recent Jobs</h4>
                                <div class="jobs-content">
                                    <div class="loading">Loading jobs...</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Supervisor Tab -->
                    <div class="tab-content" id="supervisor-tab">
                        <div class="supervisor-panel">
                            <div class="supervisor-header">
                                <h4>Supervisor Management</h4>
                                <div class="supervisor-actions">
                                    <button class="btn btn-primary" onclick="laravelManager.loadSupervisorStatus()">
                                        <span class="icon">🔄</span>
                                        Reload Status
                                    </button>
                                    <button class="btn btn-success" onclick="laravelManager.saveSupervisorConfig()">
                                        <span class="icon">💾</span>
                                        Save Config
                                    </button>
                                    <button class="btn btn-secondary" onclick="laravelManager.restartSupervisor()">
                                        <span class="icon">🔃</span>
                                        Restart Supervisor
                                    </button>
                                </div>
                            </div>

                            <!-- Supervisor Stats -->
                            <div class="supervisor-stats" id="supervisor-stats">
                                <div class="loading">Loading supervisor stats...</div>
                            </div>

                            <!-- Programs Grid -->
                            <div class="supervisor-programs-section">
                                <h5>Running Programs</h5>
                                <div class="supervisor-programs-grid" id="supervisor-programs-grid">
                                    <div class="loading">Loading supervisor programs...</div>
                                </div>
                            </div>

                            <!-- Configuration Editor -->
                            <div class="supervisor-config-section">
                                <h5>Configuration Editor</h5>

                                <!-- Editor Mode Toggle -->
                                <div class="supervisor-editor-modes">
                                    <label>
                                        <input type="radio" name="supervisor-editor-mode" value="visual" checked>
                                        <span>Visual Editor</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="supervisor-editor-mode" value="raw">
                                        <span>Raw Config</span>
                                    </label>
                                </div>

                                <!-- Visual Editor -->
                                <div class="supervisor-visual-editor" id="supervisor-visual-editor">
                                    <div class="visual-editor-programs" id="visual-editor-programs">
                                        <!-- Programs will be loaded here -->
                                    </div>
                                    <button class="btn btn-primary add-program-btn" onclick="laravelManager.addNewProgram()">
                                        <span class="icon">➕</span>
                                        Add New Program
                                    </button>
                                </div>

                                <!-- Raw Editor -->
                                <textarea class="supervisor-raw-editor" id="supervisor-raw-editor" placeholder="Loading configuration..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Cache Tab -->
                    <div class="tab-content" id="cache-tab">
                        <div class="cache-panel">
                            <h4>Cache Management</h4>
                            <div class="cache-actions">
                                <button class="btn btn-warning" onclick="laravelManager.clearCache(['all'])">
                                    <span class="icon">🗑️</span>
                                    Clear All Cache
                                </button>
                                <button class="btn btn-secondary" onclick="laravelManager.clearCache(['config'])">
                                    <span class="icon">⚙️</span>
                                    Config Cache
                                </button>
                                <button class="btn btn-secondary" onclick="laravelManager.clearCache(['view'])">
                                    <span class="icon">👁️</span>
                                    View Cache
                                </button>
                                <button class="btn btn-secondary" onclick="laravelManager.clearCache(['route'])">
                                    <span class="icon">🛣️</span>
                                    Route Cache
                                </button>
                            </div>
                            <div class="cache-status" id="cache-status">
                                <div class="loading">Loading cache status...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Database Tab -->
                    <div class="tab-content" id="database-tab">
                        <div class="database-panel">
                            <h4>Database Management</h4>
                            <div class="database-actions">
                                <button class="btn btn-primary" onclick="laravelManager.runMigrations(false, false)">
                                    <span class="icon">🔄</span>
                                    Run Migrations
                                </button>
                                <button class="btn btn-warning" onclick="laravelManager.runMigrations(true, false)">
                                    <span class="icon">🆕</span>
                                    Fresh Migrate
                                </button>
                                <button class="btn btn-success" onclick="laravelManager.runMigrations(true, true)">
                                    <span class="icon">🌱</span>
                                    Fresh + Seed
                                </button>
                                <button class="btn btn-secondary" onclick="laravelManager.openPhpMyAdmin()">
                                    <span class="icon">🔧</span>
                                    phpMyAdmin
                                </button>
                            </div>
                            <div class="database-status" id="database-status">
                                <div class="loading">Loading database status...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Logs Tab -->
                    <div class="tab-content" id="logs-tab">
                        <div class="logs-panel">
                            <div class="logs-controls">
                                <h4>Application Logs</h4>
                                <div class="log-type-selector">
                                    <select id="log-type-select" onchange="laravelManager.loadLogs()">
                                        <option value="laravel">Laravel Logs</option>
                                        <option value="nginx">Nginx Logs</option>
                                        <option value="mysql">MySQL Logs</option>
                                        <option value="redis">Redis Logs</option>
                                    </select>
                                    <button class="btn btn-secondary" onclick="laravelManager.loadLogs()">
                                        <span class="icon">🔄</span>
                                        Refresh
                                    </button>
                                </div>
                            </div>
                            <div class="logs-content" id="logs-content">
                                <pre class="log-output">Loading logs...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupTabNavigation();
    }

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Update button states
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update content visibility
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });

                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    loadTabData(tab) {
        switch (tab) {
            case 'services':
                this.loadLaravelStatus();
                break;
            case 'queue':
                this.loadQueueStatus();
                break;
            case 'supervisor':
                this.loadSupervisorStatus();
                break;
            case 'cache':
                this.loadCacheStatus();
                break;
            case 'database':
                this.loadDatabaseStatus();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadLaravelStatus() {
        if (!this.currentProject) return;

        try {
            const response = await api.getLaravelStatus(this.currentProject.id);
            this.updateServicesGrid(response);
            this.updateLaravelStatusIndicator(response);
        } catch (error) {
            console.error('Failed to load Laravel status:', error);
            toast.error('Failed to load Laravel status');
        }
    }

    updateServicesGrid(status) {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid) return;

        const services = [
            { name: 'Application', key: 'app', icon: '🚀', description: 'Laravel Application' },
            { name: 'Database', key: 'db', icon: '🗄️', description: 'MySQL Database' },
            { name: 'Cache', key: 'redis', icon: '⚡', description: 'Redis Cache' },
            { name: 'Web Server', key: 'nginx', icon: '🌐', description: 'Nginx Server' }
        ];

        servicesGrid.innerHTML = services.map(service => {
            const isRunning = status.services[service.key];
            const statusClass = isRunning ? 'running' : 'stopped';
            const statusText = isRunning ? 'Running' : 'Stopped';

            return `
                <div class="service-card ${statusClass}">
                    <div class="service-icon">${service.icon}</div>
                    <div class="service-info">
                        <h4>${service.name}</h4>
                        <p>${service.description}</p>
                        <span class="service-status status-${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateLaravelStatusIndicator(status) {
        const statusElement = document.getElementById('laravel-status');
        if (!statusElement) return;

        const allRunning = Object.values(status.services).every(s => s);
        const statusClass = allRunning ? 'healthy' : 'warning';
        const statusText = allRunning ? 'All Services Running' : 'Some Services Down';

        statusElement.innerHTML = `
            <span class="status-indicator ${statusClass}"></span>
            <span class="status-text">${statusText}</span>
        `;
    }

    async runArtisanCommand(command, args = []) {
        if (!this.currentProject) return;

        // Create operation for artisan command
        const operationId = `artisan-${this.currentProject.id}-${Date.now()}`;
        const operation = progressManager.startOperation(operationId, {
            title: `⚡ Running Artisan Command`,
            description: `Executing: php artisan ${command} ${args.join(' ')}`,
            projectId: this.currentProject.id,
            projectName: this.currentProject.name,
            steps: ['Connecting to container', 'Executing command', 'Processing output']
        });

        const outputElement = document.getElementById('artisan-output-content');
        if (outputElement) {
            outputElement.textContent = 'Running command...';
        }

        try {
            progressManager.updateOperation(operationId, { currentStep: 0 });
            progressManager.addLog(operationId, `Running: php artisan ${command} ${args.join(' ')}`, 'info');

            const response = await api.runArtisanCommand(this.currentProject.id, command, args);

            progressManager.updateOperation(operationId, { currentStep: 1 });
            progressManager.addLog(operationId, 'Command executed, processing output...', 'info');

            if (outputElement) {
                outputElement.textContent = response.output || 'Command completed successfully.';
            }

            if (response.success) {
                progressManager.addLog(operationId, 'Command completed successfully', 'success');
                progressManager.completeOperation(operationId, true, `Artisan command completed: ${command}`);
                toast.success(`Artisan command completed: ${command}`);
            } else {
                throw new Error(response.error || 'Command failed');
            }
        } catch (error) {
            console.error('Artisan command failed:', error);
            if (outputElement) {
                outputElement.textContent = `Error: ${error.message}`;
            }
            progressManager.addLog(operationId, `Error: ${error.message}`, 'error');
            progressManager.completeOperation(operationId, false, 'Artisan command failed');
            toast.error('Failed to run Artisan command');
        }
    }

    async loadQueueStatus() {
        if (!this.currentProject) return;

        try {
            const response = await api.getQueueStatus(this.currentProject.id);
            this.updateQueueStatus(response);

            // Load recent jobs
            const jobsResponse = await api.getQueueJobs(this.currentProject.id, 'all', 10);
            this.updateQueueJobs(jobsResponse);
        } catch (error) {
            console.error('Failed to load queue status:', error);
        }
    }

    updateQueueStatus(status) {
        const statusElement = document.getElementById('queue-status');
        if (!statusElement) return;

        statusElement.innerHTML = `
            <div class="queue-stats">
                <div class="stat-card">
                    <div class="stat-value">${status.workers || 0}</div>
                    <div class="stat-label">Active Workers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${status.jobs?.pending || 0}</div>
                    <div class="stat-label">Pending Jobs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${status.jobs?.processing || 0}</div>
                    <div class="stat-label">Processing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${status.jobs?.failed || 0}</div>
                    <div class="stat-label">Failed Jobs</div>
                </div>
            </div>
        `;
    }

    updateQueueJobs(jobsData) {
        const jobsElement = document.getElementById('queue-jobs');
        if (!jobsElement || !jobsData.jobs) return;

        const jobsContent = jobsElement.querySelector('.jobs-content');
        if (!jobsContent) return;

        if (jobsData.jobs.length === 0) {
            jobsContent.innerHTML = '<div class="no-jobs">No recent jobs found</div>';
            return;
        }

        jobsContent.innerHTML = `
            <div class="jobs-list">
                ${jobsData.jobs.slice(0, 10).map(job => `
                    <div class="job-item">
                        <div class="job-details">
                            <span class="job-name">${job.name || 'Unknown Job'}</span>
                            <span class="job-queue">${job.queue || 'default'}</span>
                        </div>
                        <div class="job-status">
                            <span class="status-badge ${job.status || 'pending'}">${job.status || 'pending'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async startQueueWorker() {
        if (!this.currentProject) return;

        // Create operation for queue worker
        const operationId = `queue-start-${this.currentProject.id}-${Date.now()}`;
        const operation = progressManager.startOperation(operationId, {
            title: `▶️ Starting Queue Worker`,
            description: 'Initializing Laravel queue worker...',
            projectId: this.currentProject.id,
            projectName: this.currentProject.name,
            steps: ['Connecting to container', 'Starting worker process', 'Verifying worker status']
        });

        try {
            progressManager.updateOperation(operationId, { currentStep: 0 });
            progressManager.addLog(operationId, 'Starting queue worker...', 'info');

            await api.startQueueWorker(this.currentProject.id);

            progressManager.updateOperation(operationId, { currentStep: 1 });
            progressManager.addLog(operationId, 'Queue worker started successfully', 'success');

            progressManager.completeOperation(operationId, true, 'Queue worker is now running');
            toast.success('Queue worker started');

            setTimeout(() => this.loadQueueStatus(), 2000);
        } catch (error) {
            console.error('Failed to start queue worker:', error);
            progressManager.addLog(operationId, `Error: ${error.message}`, 'error');
            progressManager.completeOperation(operationId, false, 'Failed to start queue worker');
            toast.error('Failed to start queue worker');
        }
    }

    async stopQueueWorkers() {
        if (!this.currentProject) return;

        try {
            await api.stopQueueWorkers(this.currentProject.id);
            toast.success('Queue workers stopped');
            setTimeout(() => this.loadQueueStatus(), 2000);
        } catch (error) {
            console.error('Failed to stop queue workers:', error);
            toast.error('Failed to stop queue workers');
        }
    }

    async clearCache(types) {
        if (!this.currentProject) return;

        // Create operation for cache clearing
        const operationId = `cache-clear-${this.currentProject.id}-${Date.now()}`;
        const operation = progressManager.startOperation(operationId, {
            title: `🧹 Clearing Cache`,
            description: `Clearing cache types: ${types.join(', ')}`,
            projectId: this.currentProject.id,
            projectName: this.currentProject.name,
            steps: ['Connecting to container', 'Clearing cache', 'Verifying cache cleared']
        });

        try {
            progressManager.updateOperation(operationId, { currentStep: 0 });
            progressManager.addLog(operationId, `Clearing cache types: ${types.join(', ')}`, 'info');

            const response = await api.clearCache(this.currentProject.id, types);

            progressManager.updateOperation(operationId, { currentStep: 1 });

            if (response.success) {
                progressManager.addLog(operationId, 'Cache cleared successfully', 'success');
                progressManager.completeOperation(operationId, true, 'Cache cleared successfully');
                toast.success('Cache cleared successfully');
            } else {
                progressManager.addLog(operationId, 'Some cache types failed to clear', 'warning');
                progressManager.completeOperation(operationId, true, 'Some cache types failed to clear');
                toast.warning('Some cache types failed to clear');
            }

            this.loadCacheStatus();
        } catch (error) {
            console.error('Failed to clear cache:', error);
            progressManager.addLog(operationId, `Error: ${error.message}`, 'error');
            progressManager.completeOperation(operationId, false, 'Failed to clear cache');
            toast.error('Failed to clear cache');
        }
    }

    async loadCacheStatus() {
        const statusElement = document.getElementById('cache-status');
        if (!statusElement) return;

        // For now, just show that cache operations are available
        statusElement.innerHTML = `
            <div class="cache-info">
                <p>Cache operations are available for this Laravel project.</p>
                <p>Use the buttons above to clear different types of cache.</p>
            </div>
        `;
    }

    async runMigrations(fresh, seed) {
        if (!this.currentProject) return;

        try {
            const response = await api.runMigrations(this.currentProject.id, fresh, seed);

            if (response.success) {
                toast.success('Migrations completed successfully');
            } else {
                toast.error('Migration failed');
            }

            this.loadDatabaseStatus();
        } catch (error) {
            console.error('Failed to run migrations:', error);
            toast.error('Failed to run migrations');
        }
    }

    async loadDatabaseStatus() {
        const statusElement = document.getElementById('database-status');
        if (!statusElement) return;

        statusElement.innerHTML = `
            <div class="database-info">
                <p>Database operations are available for this Laravel project.</p>
                <p>Use the buttons above to manage your database schema.</p>
            </div>
        `;
    }

    async loadLogs() {
        const typeSelect = document.getElementById('log-type-select');
        const logsContent = document.getElementById('logs-content');

        if (!typeSelect || !logsContent || !this.currentProject) return;

        const logType = typeSelect.value;
        const logOutput = logsContent.querySelector('.log-output');

        if (logOutput) {
            logOutput.textContent = 'Loading logs...';
        }

        try {
            const response = await api.getLaravelLogs(this.currentProject.id, logType, 100);

            if (logOutput) {
                logOutput.textContent = response.logs.join('\n') || 'No logs available';
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            if (logOutput) {
                logOutput.textContent = `Error loading logs: ${error.message}`;
            }
        }
    }

    async loadSupervisorStatus() {
        if (!this.currentProject) return;

        try {
            const response = await api.getSupervisorStatus(this.currentProject.id);
            this.updateSupervisorGrid(response.programs);
            this.updateSupervisorStats(response.stats);

            // Also load the configuration on first load
            this.loadSupervisorConfig();
        } catch (error) {
            console.error('Failed to load supervisor status:', error);
            toast.error('Failed to load supervisor status');
        }
    }

    updateSupervisorGrid(programs) {
        const programsGrid = document.getElementById('supervisor-programs-grid');
        if (!programsGrid) return;

        programsGrid.innerHTML = programs.map(program => `
            <div class="program-card">
                <div class="program-header">
                    <span class="program-name">${program.name}</span>
                    <span class="program-status ${program.state.toLowerCase()}">${program.state}</span>
                </div>
                <div class="program-details">
                    <small class="program-description">${program.description || 'No description'}</small>
                    <div class="program-stats">
                        <span>PID: ${program.pid || 'N/A'}</span>
                        <span>Uptime: ${program.uptime || '0s'}</span>
                    </div>
                </div>
                <div class="program-actions">
                    <button class="btn btn-small ${program.state === 'RUNNING' ? 'btn-danger' : 'btn-success'}"
                            onclick="laravelManager.toggleProgram('${program.name}')">
                        ${program.state === 'RUNNING' ? 'Stop' : 'Start'}
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="laravelManager.restartProgram('${program.name}')">
                        Restart
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateSupervisorStats(stats) {
        const statsContainer = document.getElementById('supervisor-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Programs:</span>
                <span class="stat-value">${stats.total || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Running:</span>
                <span class="stat-value running">${stats.running || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Stopped:</span>
                <span class="stat-value stopped">${stats.stopped || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Failed:</span>
                <span class="stat-value failed">${stats.failed || 0}</span>
            </div>
        `;
    }

    async loadSupervisorConfig() {
        if (!this.currentProject) return;

        try {
            const response = await api.getSupervisorConfig(this.currentProject.id);
            const rawEditor = document.getElementById('supervisor-raw-editor');
            if (rawEditor) {
                rawEditor.value = response.config;
            }

            // Parse and populate visual editor
            this.populateVisualEditor(response.config);

        } catch (error) {
            console.error('Failed to load supervisor config:', error);
            toast.error('Failed to load supervisor config');
        }
    }

    populateVisualEditor(config) {
        // Parse supervisor config and populate the visual editor form
        const lines = config.split('\n');
        let currentProgram = null;
        const programs = {};

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('[program:')) {
                currentProgram = line.match(/\[program:(.+)\]/)[1];
                programs[currentProgram] = {};
            } else if (currentProgram && line.includes('=')) {
                const [key, value] = line.split('=').map(s => s.trim());
                programs[currentProgram][key] = value;
            }
        });

        this.renderVisualEditorPrograms(programs);
    }

    renderVisualEditorPrograms(programs) {
        const container = document.getElementById('visual-editor-programs');
        if (!container) return;

        container.innerHTML = Object.entries(programs).map(([name, config]) => `
            <div class="program-editor-card" data-program="${name}">
                <div class="program-editor-header">
                    <input type="text" value="${name}" class="program-name-input" onchange="laravelManager.updateProgramName(this, '${name}')">
                    <button class="btn btn-small btn-danger" onclick="laravelManager.removeProgram('${name}')">Remove</button>
                </div>
                <div class="program-editor-form">
                    <div class="form-row">
                        <label>Command:</label>
                        <input type="text" value="${config.command || ''}" onchange="laravelManager.updateProgramConfig('${name}', 'command', this.value)">
                    </div>
                    <div class="form-row">
                        <label>Directory:</label>
                        <input type="text" value="${config.directory || ''}" onchange="laravelManager.updateProgramConfig('${name}', 'directory', this.value)">
                    </div>
                    <div class="form-row">
                        <label>User:</label>
                        <input type="text" value="${config.user || ''}" onchange="laravelManager.updateProgramConfig('${name}', 'user', this.value)">
                    </div>
                    <div class="form-row">
                        <label>Auto Start:</label>
                        <select onchange="laravelManager.updateProgramConfig('${name}', 'autostart', this.value)">
                            <option value="true" ${config.autostart === 'true' ? 'selected' : ''}>Yes</option>
                            <option value="false" ${config.autostart === 'false' ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Auto Restart:</label>
                        <select onchange="laravelManager.updateProgramConfig('${name}', 'autorestart', this.value)">
                            <option value="true" ${config.autorestart === 'true' ? 'selected' : ''}>Yes</option>
                            <option value="false" ${config.autorestart === 'false' ? 'selected' : ''}>No</option>
                            <option value="unexpected" ${config.autorestart === 'unexpected' ? 'selected' : ''}>Unexpected Only</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async saveSupervisorConfig() {
        if (!this.currentProject) return;

        const editorMode = document.querySelector('input[name="supervisor-editor-mode"]:checked').value;
        let config;

        if (editorMode === 'visual') {
            config = this.generateConfigFromVisualEditor();
        } else {
            const rawEditor = document.getElementById('supervisor-raw-editor');
            config = rawEditor ? rawEditor.value : '';
        }

        try {
            await api.saveSupervisorConfig(this.currentProject.id, config);
            toast.success('Supervisor configuration saved successfully');

            // Reload status after saving
            this.loadSupervisorStatus();
        } catch (error) {
            console.error('Failed to save supervisor config:', error);
            toast.error('Failed to save supervisor config');
        }
    }

    generateConfigFromVisualEditor() {
        const programCards = document.querySelectorAll('.program-editor-card');
        let config = '';

        programCards.forEach(card => {
            const programName = card.querySelector('.program-name-input').value;
            const inputs = card.querySelectorAll('input, select');

            config += `[program:${programName}]\n`;

            inputs.forEach(input => {
                if (input.classList.contains('program-name-input')) return;

                const label = input.closest('.form-row').querySelector('label').textContent.toLowerCase().replace(' ', '');
                const value = input.value;
                if (value) {
                    config += `${label}=${value}\n`;
                }
            });

            config += '\n';
        });

        return config;
    }

    addNewProgram() {
        const container = document.getElementById('visual-editor-programs');
        if (!container) return;

        const newProgramName = `new-program-${Date.now()}`;
        const newProgramHtml = `
            <div class="program-editor-card" data-program="${newProgramName}">
                <div class="program-editor-header">
                    <input type="text" value="${newProgramName}" class="program-name-input" onchange="laravelManager.updateProgramName(this, '${newProgramName}')">
                    <button class="btn btn-small btn-danger" onclick="laravelManager.removeProgram('${newProgramName}')">Remove</button>
                </div>
                <div class="program-editor-form">
                    <div class="form-row">
                        <label>Command:</label>
                        <input type="text" value="" onchange="laravelManager.updateProgramConfig('${newProgramName}', 'command', this.value)">
                    </div>
                    <div class="form-row">
                        <label>Directory:</label>
                        <input type="text" value="/var/www/html" onchange="laravelManager.updateProgramConfig('${newProgramName}', 'directory', this.value)">
                    </div>
                    <div class="form-row">
                        <label>User:</label>
                        <input type="text" value="www-data" onchange="laravelManager.updateProgramConfig('${newProgramName}', 'user', this.value)">
                    </div>
                    <div class="form-row">
                        <label>Auto Start:</label>
                        <select onchange="laravelManager.updateProgramConfig('${newProgramName}', 'autostart', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Auto Restart:</label>
                        <select onchange="laravelManager.updateProgramConfig('${newProgramName}', 'autorestart', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                            <option value="unexpected">Unexpected Only</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', newProgramHtml);
    }

    removeProgram(programName) {
        const card = document.querySelector(`[data-program="${programName}"]`);
        if (card) {
            card.remove();
        }
    }

    updateProgramName(input, oldName) {
        const card = input.closest('.program-editor-card');
        if (card) {
            card.setAttribute('data-program', input.value);
        }
    }

    updateProgramConfig(programName, key, value) {
        // This method is called when form fields change
        // The actual config generation happens when saving
        console.log(`Updated ${programName}.${key} = ${value}`);
    }

    async toggleProgram(programName) {
        if (!this.currentProject) return;

        try {
            await api.toggleSupervisorProgram(this.currentProject.id, programName);
            toast.success(`Program ${programName} toggled successfully`);
            this.loadSupervisorStatus();
        } catch (error) {
            console.error('Failed to toggle program:', error);
            toast.error(`Failed to toggle program ${programName}`);
        }
    }

    async restartProgram(programName) {
        if (!this.currentProject) return;

        try {
            await api.restartSupervisorProgram(this.currentProject.id, programName);
            toast.success(`Program ${programName} restarted successfully`);
            this.loadSupervisorStatus();
        } catch (error) {
            console.error('Failed to restart program:', error);
            toast.error(`Failed to restart program ${programName}`);
        }
    }

    async restartSupervisor() {
        if (!this.currentProject) return;

        try {
            await api.restartSupervisor(this.currentProject.id);
            toast.success('Supervisor restarted successfully');
            setTimeout(() => this.loadSupervisorStatus(), 2000);
        } catch (error) {
            console.error('Failed to restart supervisor:', error);
            toast.error('Failed to restart supervisor');
        }
    }

    switchSupervisorEditorMode() {
        const visualEditor = document.getElementById('supervisor-visual-editor');
        const rawEditor = document.getElementById('supervisor-raw-editor');
        const mode = document.querySelector('input[name="supervisor-editor-mode"]:checked').value;

        if (mode === 'visual') {
            visualEditor.style.display = 'block';
            rawEditor.style.display = 'none';
        } else {
            visualEditor.style.display = 'none';
            rawEditor.style.display = 'block';
        }
    }

    openPhpMyAdmin() {
        if (!this.currentProject || !this.currentProject.ports?.phpmyadmin) {
            toast.warning('phpMyAdmin is not enabled for this project');
            return;
        }

        const url = `http://localhost:${this.currentProject.ports.phpmyadmin}`;
        window.open(url, '_blank');
    }

    openArtisanModal() {
        // This would open a modal for custom Artisan commands
        toast.info('Custom Artisan command modal - to be implemented');
    }

    updateLaravelUI() {
        if (this.currentProject && this.currentProject.template === 'laravel') {
            this.loadLaravelStatus();
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize Laravel Manager
window.laravelManager = new LaravelManager();
