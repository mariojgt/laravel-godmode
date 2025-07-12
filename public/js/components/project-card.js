/**
 * Project Card Component for Laravel God Mode
 * Renders individual project cards with all functionality
 */

class ProjectCard {
  constructor(project) {
    this.project = project;
    this.element = null;
  }

  /**
   * Render the project card
   */
  render() {
    this.element = this.createElement();
    return this.element;
  }

  /**
   * Update the project card with new data
   */
  update(project) {
    this.project = project;
    if (this.element) {
      const newElement = this.createElement();
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
    }
  }

  /**
   * Create the project card element
   */
  createElement() {
    const card = document.createElement('div');
    card.className = `project-card ${this.getStatusClass()}`;
    card.setAttribute('data-project', this.project.name);

    card.innerHTML = `
      ${this.renderHeader()}
      ${this.renderInfo()}
      ${this.renderServices()}
      ${this.renderPorts()}
      ${this.renderActions()}
    `;

    this.attachEventListeners(card);
    return card;
  }

  /**
   * Render project header
   */
  renderHeader() {
    const statusClass = helpers.getStatusClass(this.project.status);
    const statusText = helpers.getStatusText(this.project.status);

    return `
      <div class="project-header">
        <div class="project-main">
          <h3 class="project-name">
            ${helpers.escapeHtml(this.project.name)}
            ${this.project.discovered ? '<span class="discovered-badge">Discovered</span>' : ''}
          </h3>
          <a href="http://localhost:${this.project.port}" target="_blank" class="project-url">
            http://localhost:${this.project.port}
          </a>
          ${this.renderContainerInfo()}
        </div>
        <div class="project-status">
          <span class="status-badge ${statusClass}">${statusText}</span>
          ${this.renderHealthIndicator()}
        </div>
      </div>
    `;
  }

  /**
   * Render container information
   */
  renderContainerInfo() {
    if (this.project.containers !== undefined) {
      return `
        <div class="container-info">
          <span class="container-count">
            ${this.project.runningContainers || 0}/${this.project.containers || 0} containers
          </span>
        </div>
      `;
    }
    return '';
  }

  /**
   * Render health indicator
   */
  renderHealthIndicator() {
    if (!this.project.health || this.project.status !== 'running') {
      return '';
    }

    const healthIcons = {
      'healthy': '🟢',
      'degraded': '🟡',
      'unhealthy': '🔴',
      'error': '❌'
    };

    const icon = healthIcons[this.project.health.overall] || '❓';

    return `
      <div class="health-indicator" title="Health: ${this.project.health.overall}">
        ${icon}
      </div>
    `;
  }

  /**
   * Render project information
   */
  renderInfo() {
    const created = helpers.formatDate(this.project.created);
    const lastActivity = this.project.lastActivity ? helpers.formatDate(this.project.lastActivity) : null;
    const lastChecked = this.project.lastChecked ? helpers.formatTime(this.project.lastChecked) : null;

    return `
      <div class="project-info">
        <div>Stack: Laravel + Nginx + PHP-FPM + MySQL${this.project.services?.includes('redis') ? ' + Redis' : ''}</div>
        <div>PHP ${this.project.phpVersion || '8.2'} | Node ${this.project.nodeVersion || '18'}${this.project.installBun ? ' | Bun' : ''}${this.project.installPnpm ? ' | pnpm' : ''}</div>
        <div>Created: ${created}</div>
        ${lastActivity ? `<div>Last activity: ${lastActivity}</div>` : ''}
        ${lastChecked ? `<div>Last checked: ${lastChecked}</div>` : ''}
      </div>
    `;
  }

  /**
   * Render services badges
   */
  renderServices() {
    const services = this.project.services || [];
    const versionBadges = `
      <span class="service-badge version">PHP ${this.project.phpVersion || '8.2'}</span>
      <span class="service-badge version">Node ${this.project.nodeVersion || '18'}</span>
    `;

    let packageManagerBadges = '';
    if (this.project.installBun) {
      packageManagerBadges += '<span class="service-badge package">Bun</span>';
    }
    if (this.project.installPnpm) {
      packageManagerBadges += '<span class="service-badge package">pnpm</span>';
    }

    const servicesBadges = services.map(service => {
      const serviceNames = {
        redis: 'Redis',
        phpmyadmin: 'PHPMyAdmin',
        mailhog: 'Mailhog',
        mysql: 'MySQL',
        nginx: 'Nginx'
      };
      return `<span class="service-badge">${serviceNames[service] || service}</span>`;
    }).join('');

    return `
      <div class="project-services">
        ${versionBadges}
        ${packageManagerBadges}
        ${servicesBadges}
      </div>
    `;
  }

  /**
   * Render ports information
   */
  renderPorts() {
    const services = this.project.services || [];

    return `
      <div class="ports-info">
        <div class="ports-header">Service Ports</div>
        <div class="ports-grid-display">
          <div class="port-item">
            <span>App</span>
            <a href="http://localhost:${this.project.port}" target="_blank" class="port-link">:${this.project.port}</a>
          </div>
          <div class="port-item">
            <span>MySQL</span>
            <span class="port-number">:${this.project.dbPort}</span>
          </div>
          ${services.includes('redis') ? `
            <div class="port-item">
              <span>Redis</span>
              <span class="port-number">:${this.project.redisPort}</span>
            </div>
          ` : ''}
          ${services.includes('phpmyadmin') ? `
            <div class="port-item">
              <span>PHPMyAdmin</span>
              <a href="http://localhost:${this.project.phpmyadminPort}" target="_blank" class="port-link">:${this.project.phpmyadminPort}</a>
            </div>
          ` : ''}
          ${services.includes('mailhog') ? `
            <div class="port-item">
              <span>Mailhog</span>
              <a href="http://localhost:${this.project.mailhogPort}" target="_blank" class="port-link">:${this.project.mailhogPort}</a>
            </div>
          ` : ''}
          <div class="port-item">
            <span>Vite</span>
            <a href="http://localhost:${this.project.vitePort}" target="_blank" class="port-link">:${this.project.vitePort}</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render action buttons
   */
  renderActions() {
    const services = this.project.services || [];
    const primaryAction = this.getPrimaryAction();

    return `
      <div class="project-actions">
        ${primaryAction}
        <button class="btn btn-sm btn-secondary" data-action="open">
          <span class="btn-icon">🌐</span>
          Open
        </button>
        ${services.includes('phpmyadmin') ? `
          <button class="btn btn-sm btn-secondary" data-action="database">
            <span class="btn-icon">🗄️</span>
            Database
          </button>
        ` : ''}
        <button class="btn btn-sm btn-secondary" data-action="env">
          <span class="btn-icon">⚙️</span>
          Environment
        </button>
        <button class="btn btn-sm btn-secondary" data-action="artisan">
          <span class="btn-icon">🎯</span>
          Artisan
        </button>
        <button class="btn btn-sm btn-secondary" data-action="logs">
          <span class="btn-icon">📋</span>
          Logs
        </button>
        <button class="btn btn-sm btn-secondary" data-action="more" title="More options">
          <span class="btn-icon">⋯</span>
        </button>
        <button class="btn btn-sm btn-destructive" data-action="delete">
          <span class="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    `;
  }

  /**
   * Get primary action button based on status
   */
  getPrimaryAction() {
    const actions = {
      'running': `<button class="btn btn-sm btn-destructive" data-action="stop">
        <span class="btn-icon">⏹️</span>
        Stop
      </button>`,
      'stopped': `<button class="btn btn-sm btn-primary" data-action="start">
        <span class="btn-icon">▶️</span>
        Start
      </button>`,
      'starting': `<button class="btn btn-sm" disabled>
        <span class="btn-icon">⏳</span>
        Starting...
      </button>`,
      'stopping': `<button class="btn btn-sm" disabled>
        <span class="btn-icon">⏳</span>
        Stopping...
      </button>`,
      'partial': `<button class="btn btn-sm btn-secondary" data-action="restart">
        <span class="btn-icon">🔄</span>
        Restart
      </button>`,
      'error': `<button class="btn btn-sm btn-destructive" data-action="start">
        <span class="btn-icon">🔄</span>
        Retry
      </button>`
    };

    return actions[this.project.status] || actions['stopped'];
  }

  /**
   * Get status class for card styling
   */
  getStatusClass() {
    return helpers.getStatusClass(this.project.status);
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners(card) {
    // Handle action button clicks
    card.addEventListener('click', async (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      e.preventDefault();
      e.stopPropagation();

      const action = button.getAttribute('data-action');
      await this.handleAction(action, button);
    });

    // Handle card click (optional - could expand/collapse details)
    card.addEventListener('click', (e) => {
      if (e.target === card || e.target.closest('.project-header')) {
        // Could implement expand/collapse functionality here
      }
    });
  }

  /**
   * Handle action button clicks
   */
  async handleAction(action, button) {
    const originalText = button.innerHTML;
    const projectName = this.project.name;

    try {
      switch (action) {
        case 'start':
          button.disabled = true;
          button.innerHTML = '<span class="btn-icon">⏳</span> Starting...';
          await api.startProject(projectName);
          notifications.success(`Starting ${projectName}...`);
          break;

        case 'stop':
          button.disabled = true;
          button.innerHTML = '<span class="btn-icon">⏳</span> Stopping...';
          await api.stopProject(projectName);
          notifications.success(`Stopping ${projectName}...`);
          break;

        case 'restart':
          button.disabled = true;
          button.innerHTML = '<span class="btn-icon">⏳</span> Restarting...';
          await api.restartProject(projectName);
          notifications.success(`Restarting ${projectName}...`);
          break;

        case 'open':
          window.open(`http://localhost:${this.project.port}`, '_blank');
          break;

        case 'database':
          if (this.project.phpmyadminPort) {
            window.open(`http://localhost:${this.project.phpmyadminPort}`, '_blank');
          }
          break;

        case 'env':
          openEnvModal(projectName);
          break;

        case 'artisan':
          openArtisanModal(projectName);
          break;

        case 'logs':
          openLogsModal(projectName);
          break;

        case 'more':
          this.showMoreOptions(button);
          break;

        case 'delete':
          await this.confirmDelete();
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      notifications.error(`Failed to ${action} project: ${error.message}`);
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  /**
   * Show more options menu
   */
  showMoreOptions(button) {
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <button class="context-menu-item" data-action="build">
        <span class="btn-icon">🔨</span>
        Rebuild Containers
      </button>
      <button class="context-menu-item" data-action="backup">
        <span class="btn-icon">💾</span>
        Backup Project
      </button>
      <button class="context-menu-item" data-action="edit-ports">
        <span class="btn-icon">🔌</span>
        Edit Ports
      </button>
      <hr class="context-menu-separator">
      <button class="context-menu-item" data-action="copy-url">
        <span class="btn-icon">📋</span>
        Copy URL
      </button>
    `;

    // Position menu
    const rect = button.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = '1000';

    document.body.appendChild(menu);

    // Handle menu item clicks
    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('[data-action]');
      if (item) {
        const action = item.getAttribute('data-action');
        document.body.removeChild(menu);
        await this.handleMoreAction(action);
      }
    });

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }

  /**
   * Handle more actions
   */
  async handleMoreAction(action) {
    const projectName = this.project.name;

    try {
      switch (action) {
        case 'build':
          const loadingToast = notifications.showLoading('Rebuilding containers...');
          await api.rebuildContainers(projectName);
          loadingToast.close();
          notifications.success('Containers rebuilt successfully');
          break;

        case 'backup':
          const backupToast = notifications.showLoading('Creating backup...');
          const result = await api.backupProject(projectName);
          backupToast.close();
          notifications.success(`Backup created: ${result.data.backupFile}`);
          break;

        case 'edit-ports':
          this.showPortsEditor();
          break;

        case 'copy-url':
          const url = `http://localhost:${this.project.port}`;
          const copied = await helpers.copyToClipboard(url);
          if (copied) {
            notifications.success('URL copied to clipboard');
          } else {
            notifications.error('Failed to copy URL');
          }
          break;
      }
    } catch (error) {
      notifications.error(`Failed to ${action}: ${error.message}`);
    }
  }

  /**
   * Show ports editor
   */
  showPortsEditor() {
    // This could open a modal for editing ports
    // For now, just show an alert
    alert('Port editing feature coming soon!');
  }

  /**
   * Confirm project deletion
   */
  async confirmDelete() {
    const confirmed = await new Promise((resolve) => {
      notifications.confirm(
        `Are you sure you want to delete "${this.project.name}"? This action cannot be undone.`,
        () => resolve(true),
        () => resolve(false)
      );
    });

    if (confirmed) {
      try {
        const loadingToast = notifications.showLoading(`Deleting ${this.project.name}...`);
        await api.deleteProject(this.project.name);
        loadingToast.close();
        notifications.success(`${this.project.name} deleted successfully`);

        // Remove card from DOM
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      } catch (error) {
        notifications.error(`Failed to delete project: ${error.message}`);
      }
    }
  }
}

// Add context menu styles
const contextMenuStyles = `
.context-menu {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2);
  min-width: 200px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: none;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  border-radius: calc(var(--radius) / 2);
  transition: var(--transition);
}

.context-menu-item:hover {
  background: hsl(var(--accent));
}

.context-menu-separator {
  margin: var(--space-2) 0;
  border: none;
  border-top: 1px solid hsl(var(--border));
}

.discovered-badge {
  background: hsl(168, 85%, 57% / 0.15);
  color: hsl(168, 85%, 57%);
  padding: var(--space-1) var(--space-2);
  border-radius: calc(var(--radius) / 2);
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: var(--space-2);
}

.port-number {
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  color: hsl(var(--muted-foreground));
}

.service-badge.version {
  background: hsl(168, 85%, 57% / 0.15);
  color: hsl(168, 85%, 57%);
}

.service-badge.package {
  background: hsl(45, 93%, 47% / 0.15);
  color: hsl(45, 93%, 47%);
}
`;

// Inject styles
const projectCardStyleSheet = document.createElement('style');
projectCardStyleSheet.textContent = contextMenuStyles;
document.head.appendChild(projectCardStyleSheet);

// Export for use
window.ProjectCard = ProjectCard;
