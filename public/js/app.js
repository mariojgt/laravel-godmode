/**
 * Laravel God Mode - Main Application
 * Enterprise Laravel development environment manager
 */

class LaravelGodMode {
  constructor() {
    this.projects = new Map();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.currentTab = 'projects';

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Setup event listeners
      this.setupEventListeners();

      // Initialize WebSocket connection
      this.initWebSocket();

      // Load initial data
      await this.loadProjects();

      // Update system info
      this.updateSystemInfo();

      // Show initial tab
      this.showTab('projects');

      console.log('🚀 Laravel God Mode initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Laravel God Mode:', error);
      notifications.error('Failed to initialize application');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        this.showTab(tabName);
      });
    });

    // Create form submission
    const createForm = document.getElementById('createForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createProject();
      });
    }

    // Custom ports toggle
    const customPortsToggle = document.getElementById('customPortsToggle');
    if (customPortsToggle) {
      customPortsToggle.addEventListener('change', (e) => {
        const section = document.getElementById('customPortsSection');
        helpers.toggleElement(section, e.target.checked);
      });
    }

    // Action buttons
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshProjects());
    }

    const discoverBtn = document.getElementById('discoverBtn');
    if (discoverBtn) {
      discoverBtn.addEventListener('click', () => this.discoverProjects());
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            this.refreshProjects();
            break;
          case 'n':
            e.preventDefault();
            this.showTab('create');
            break;
        }
      }
    });

    // Window events
    window.addEventListener('beforeunload', () => {
      if (this.ws) {
        this.ws.close();
      }
    });

    // Page visibility change - reconnect if needed
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected) {
        this.initWebSocket();
      }
    });
  }

  /**
   * Initialize WebSocket connection
   */
  initWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus(true);
        console.log('🔗 WebSocket connected');
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
        console.log('🔌 WebSocket disconnected');

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          setTimeout(() => this.initWebSocket(), delay);
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

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'connected':
        notifications.success('Connected to server');
        break;

      case 'projects_update':
        this.updateProjects(data);
        break;

      case 'project_created':
        this.addProject(data);
        notifications.success(`Project "${data.name}" created successfully!`);
        break;

      case 'project_update':
        this.updateProject(data);
        break;

      case 'project_deleted':
        this.removeProject(data.name);
        break;

      case 'project_status_change':
        this.updateProjectStatus(data);
        break;

      case 'error':
        notifications.error(message.message || 'Server error');
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  /**
   * Update connection status UI
   */
  updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionIndicator');
    const text = document.getElementById('connectionText');

    if (indicator && text) {
      if (connected) {
        indicator.className = 'connection-indicator connected';
        text.textContent = 'Connected';
      } else {
        indicator.className = 'connection-indicator';
        text.textContent = 'Disconnected';
      }
    }
  }

  /**
   * Show specific tab
   */
  showTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    // Focus first input if create tab
    if (tabName === 'create') {
      setTimeout(() => {
        const firstInput = document.querySelector('#createTab input[type="text"]');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  /**
   * Load projects from API
   */
  async loadProjects() {
    try {
      const result = await api.getProjects();
      this.updateProjects(result.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      notifications.error('Failed to load projects');
      this.showEmptyState();
    }
  }

  /**
   * Update projects display
   */
  updateProjects(projects) {
    this.projects.clear();

    if (Array.isArray(projects)) {
      projects.forEach(project => {
        this.projects.set(project.name, project);
      });
    }

    this.renderProjects();
    this.updateSystemInfo();
  }

  /**
   * Add single project
   */
  addProject(project) {
    this.projects.set(project.name, project);
    this.renderProjects();
    this.updateSystemInfo();
  }

  /**
   * Update single project
   */
  updateProject(project) {
    this.projects.set(project.name, project);
    this.renderSingleProject(project);
  }

  /**
   * Remove project
   */
  removeProject(projectName) {
    this.projects.delete(projectName);
    this.renderProjects();
    this.updateSystemInfo();
  }

  /**
   * Update project status
   */
  updateProjectStatus(statusData) {
    const project = this.projects.get(statusData.name);
    if (project) {
      project.status = statusData.status;
      if (statusData.error) {
        project.error = statusData.error;
      }
      this.renderSingleProject(project);
    }
  }

  /**
   * Render all projects
   */
  renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    const projectsArray = Array.from(this.projects.values());

    if (projectsArray.length === 0) {
      this.showEmptyState();
      return;
    }

    // Sort projects by status and name
    projectsArray.sort((a, b) => {
      const statusOrder = { running: 0, starting: 1, stopping: 2, partial: 3, stopped: 4, error: 5 };
      const aOrder = statusOrder[a.status] || 99;
      const bOrder = statusOrder[b.status] || 99;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.name.localeCompare(b.name);
    });

    const projectsGrid = document.createElement('div');
    projectsGrid.className = 'projects-grid';

    projectsArray.forEach(project => {
      const projectCard = new ProjectCard(project);
      projectsGrid.appendChild(projectCard.render());
    });

    container.innerHTML = '';
    container.appendChild(projectsGrid);
  }

  /**
   * Render single project update
   */
  renderSingleProject(project) {
    const existingCard = document.querySelector(`[data-project="${project.name}"]`);
    if (existingCard) {
      const projectCard = new ProjectCard(project);
      const newCard = projectCard.render();
      existingCard.parentNode.replaceChild(newCard, existingCard);
    }
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No Projects Yet</h3>
        <p>Create your first Laravel project or discover existing ones to get started.</p>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="app.showTab('create')">
            <span class="btn-icon">➕</span>
            Create New Project
          </button>
          <button class="btn btn-secondary" onclick="app.discoverProjects()">
            <span class="btn-icon">🔍</span>
            Discover Existing
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create new project
   */
  async createProject() {
    const form = document.getElementById('createForm');
    const formData = new FormData(form);

    // Parse form data
    const projectData = {
      name: formData.get('name'),
      phpVersion: formData.get('phpVersion') || '8.2',
      nodeVersion: formData.get('nodeVersion') || '18',
      installBun: helpers.getFormCheckboxBoolean(form, 'installBun'),
      installPnpm: helpers.getFormCheckboxBoolean(form, 'installPnpm'),
      services: helpers.getFormCheckboxValues(form, 'services')
    };

    // Add custom ports if enabled
    const customPortsToggle = document.getElementById('customPortsToggle');
    if (customPortsToggle && customPortsToggle.checked) {
      const customPorts = {};
      const portFields = ['port', 'dbPort', 'redisPort', 'phpmyadminPort', 'mailhogPort', 'vitePort'];

      portFields.forEach(field => {
        const value = formData.get(field);
        if (value) {
          const validation = helpers.validatePort(value);
          if (!validation.valid) {
            throw new Error(`Invalid ${field}: ${validation.error}`);
          }
          customPorts[field] = parseInt(value);
        }
      });

      if (Object.keys(customPorts).length > 0) {
        projectData.customPorts = customPorts;
      }
    }

    // Validate project name
    const nameValidation = helpers.validateProjectName(projectData.name);
    if (!nameValidation.valid) {
      notifications.error(nameValidation.error);
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Creating...';

    try {
      const loadingToast = notifications.showLoading(`Creating project "${projectData.name}"...`);

      await api.createProject(projectData);

      loadingToast.close();

      // Reset form and switch to projects tab
      form.reset();
      document.getElementById('customPortsSection').style.display = 'none';
      document.getElementById('customPortsToggle').checked = false;

      this.showTab('projects');

    } catch (error) {
      notifications.error(`Failed to create project: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Refresh projects
   */
  async refreshProjects() {
    try {
      const loadingToast = notifications.showLoading('Refreshing projects...');
      await this.loadProjects();
      loadingToast.close();
      notifications.success('Projects refreshed');
    } catch (error) {
      notifications.error('Failed to refresh projects');
    }
  }

  /**
   * Discover existing projects
   */
  async discoverProjects() {
    try {
      const loadingToast = notifications.showLoading('Discovering existing projects...');
      const result = await api.discoverProjects();
      loadingToast.close();

      if (result.data.discovered > 0) {
        notifications.success(`Discovered ${result.data.discovered} existing projects!`);
        await this.loadProjects();
      } else {
        notifications.info('No new projects discovered');
      }
    } catch (error) {
      notifications.error(`Discovery failed: ${error.message}`);
    }
  }

  /**
   * Update system information
   */
  updateSystemInfo() {
    const totalProjectsEl = document.getElementById('totalProjects');
    if (totalProjectsEl) {
      totalProjectsEl.textContent = this.projects.size;
    }
  }

  /**
   * Send heartbeat ping
   */
  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Start periodic tasks
   */
  startPeriodicTasks() {
    // Heartbeat every 30 seconds
    setInterval(() => {
      this.sendHeartbeat();
    }, 30000);

    // Refresh project statuses every 60 seconds
    setInterval(() => {
      if (this.currentTab === 'projects' && this.projects.size > 0) {
        this.refreshProjects();
      }
    }, 60000);
  }
}

// Add empty state styles
const emptyStateStyles = `
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: var(--space-2);
  color: hsl(var(--foreground));
}

.empty-state p {
  max-width: 400px;
  margin-bottom: var(--space-6);
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }

  .empty-actions .btn {
    min-width: 200px;
  }
}
`;

// Inject styles
const appStyleSheet = document.createElement('style');
appStyleSheet.textContent = emptyStateStyles;
document.head.appendChild(appStyleSheet);

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LaravelGodMode();

  // Start periodic tasks
  app.startPeriodicTasks();

  // Log initialization
  console.log('🎉 Laravel God Mode ready!');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LaravelGodMode;
}
