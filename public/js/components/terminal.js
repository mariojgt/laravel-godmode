/**
 * Terminal Component for Laravel God Mode
 * Interactive terminal for executing commands and viewing output
 */

class Terminal {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      prompt: '$ ',
      placeholder: 'Enter command...',
      maxHistory: 50,
      autoScroll: true,
      showTimestamp: true,
      allowClear: true,
      ...options
    };

    this.history = [];
    this.historyIndex = -1;
    this.isExecuting = false;
    this.currentProject = null;

    this.init();
  }

  /**
   * Initialize terminal
   */
  init() {
    if (!this.container) {
      console.error(`Terminal container with id "${this.containerId}" not found`);
      return;
    }

    this.createTerminalStructure();
    this.attachEventListeners();
    this.loadHistory();

    this.writeLine('Terminal ready. Type "help" for available commands.', 'info');
  }

  /**
   * Create terminal DOM structure
   */
  createTerminalStructure() {
    this.container.className = 'terminal-container';
    this.container.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-title">
          <span class="terminal-icon">⚡</span>
          <span class="terminal-name">Laravel God Mode Terminal</span>
          <span class="terminal-project" id="${this.containerId}-project"></span>
        </div>
        <div class="terminal-controls">
          <button class="terminal-btn" id="${this.containerId}-clear" title="Clear terminal">
            <span>🗑️</span>
          </button>
          <button class="terminal-btn" id="${this.containerId}-copy" title="Copy output">
            <span>📋</span>
          </button>
        </div>
      </div>
      <div class="terminal-body">
        <div class="terminal-output" id="${this.containerId}-output"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">${this.options.prompt}</span>
          <input
            type="text"
            class="terminal-input"
            id="${this.containerId}-input"
            placeholder="${this.options.placeholder}"
            autocomplete="off"
            spellcheck="false"
          >
        </div>
      </div>
    `;

    // Get references to elements
    this.output = document.getElementById(`${this.containerId}-output`);
    this.input = document.getElementById(`${this.containerId}-input`);
    this.projectDisplay = document.getElementById(`${this.containerId}-project`);
    this.clearBtn = document.getElementById(`${this.containerId}-clear`);
    this.copyBtn = document.getElementById(`${this.containerId}-copy`);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Input handling
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.input.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Button controls
    this.clearBtn.addEventListener('click', () => this.clear());
    this.copyBtn.addEventListener('click', () => this.copyOutput());

    // Focus management
    this.container.addEventListener('click', () => this.focus());

    // Prevent default behavior for certain keys
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
      }
    });
  }

  /**
   * Handle key down events
   */
  handleKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this.executeCommand();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.navigateHistory('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.navigateHistory('down');
        break;

      case 'Escape':
        e.preventDefault();
        this.cancelCommand();
        break;

      case 'l':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.clear();
        }
        break;

      case 'c':
        if (e.ctrlKey || e.metaKey) {
          if (this.isExecuting) {
            e.preventDefault();
            this.cancelCommand();
          }
        }
        break;
    }
  }

  /**
   * Handle key up events
   */
  handleKeyUp(e) {
    // Could be used for real-time command validation or suggestions
  }

  /**
   * Execute command
   */
  async executeCommand() {
    const command = this.input.value.trim();

    if (!command) return;

    // Add to history
    this.addToHistory(command);

    // Show command in output
    this.writeCommand(command);

    // Clear input
    this.input.value = '';
    this.historyIndex = -1;

    // Execute command
    await this.processCommand(command);
  }

  /**
   * Process command
   */
  async processCommand(command) {
    this.setExecuting(true);

    try {
      // Parse command
      const [cmd, ...args] = command.split(' ');
      const fullArgs = args.join(' ');

      switch (cmd.toLowerCase()) {
        case 'help':
          this.showHelp();
          break;

        case 'clear':
        case 'cls':
          this.clear();
          break;

        case 'history':
          this.showHistory();
          break;

        case 'project':
          this.handleProjectCommand(fullArgs);
          break;

        case 'artisan':
          await this.executeArtisanCommand(fullArgs);
          break;

        case 'composer':
          await this.executeComposerCommand(fullArgs);
          break;

        case 'npm':
        case 'yarn':
        case 'bun':
        case 'pnpm':
          await this.executeNodeCommand(cmd, fullArgs);
          break;

        case 'docker':
          await this.executeDockerCommand(fullArgs);
          break;

        case 'logs':
          await this.showLogs(fullArgs);
          break;

        case 'status':
          await this.showStatus();
          break;

        default:
          if (this.currentProject) {
            // Try to execute as artisan command
            await this.executeArtisanCommand(command);
          } else {
            this.writeLine(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
          }
      }
    } catch (error) {
      this.writeLine(`Error: ${error.message}`, 'error');
    } finally {
      this.setExecuting(false);
    }
  }

  /**
   * Show help
   */
  showHelp() {
    const helpText = `
Available Commands:

General:
  help                     Show this help message
  clear, cls              Clear terminal
  history                 Show command history
  project <name>          Select project to work with

Project Management:
  status                  Show current project status
  logs [service]          Show project logs

Laravel (requires project selection):
  artisan <command>       Execute Laravel Artisan command
  composer <command>      Execute Composer command

Frontend (requires project selection):
  npm <command>           Execute npm command
  yarn <command>          Execute yarn command
  bun <command>           Execute bun command
  pnpm <command>          Execute pnpm command

Docker (requires project selection):
  docker <command>        Execute docker command in project

Shortcuts:
  Ctrl+L                  Clear terminal
  Ctrl+C                  Cancel current command
  Arrow Up/Down           Navigate command history
  Tab                     Auto-complete (future feature)

Examples:
  project my-app
  artisan migrate
  composer require laravel/breeze
  npm run dev
  docker ps
    `;

    this.writeLine(helpText.trim(), 'info');
  }

  /**
   * Show command history
   */
  showHistory() {
    if (this.history.length === 0) {
      this.writeLine('No command history available.', 'info');
      return;
    }

    this.writeLine('Command History:', 'info');
    this.history.forEach((cmd, index) => {
      this.writeLine(`  ${index + 1}. ${cmd}`, 'muted');
    });
  }

  /**
   * Handle project command
   */
  handleProjectCommand(args) {
    if (!args) {
      if (this.currentProject) {
        this.writeLine(`Current project: ${this.currentProject}`, 'info');
      } else {
        this.writeLine('No project selected. Usage: project <name>', 'warning');
      }
      return;
    }

    // Check if project exists
    if (window.app && window.app.projects.has(args)) {
      this.setProject(args);
      this.writeLine(`Switched to project: ${args}`, 'success');
    } else {
      this.writeLine(`Project "${args}" not found.`, 'error');

      if (window.app && window.app.projects.size > 0) {
        this.writeLine('Available projects:', 'info');
        Array.from(window.app.projects.keys()).forEach(name => {
          this.writeLine(`  - ${name}`, 'muted');
        });
      }
    }
  }

  /**
   * Execute Artisan command
   */
  async executeArtisanCommand(command) {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    if (!command) {
      this.writeLine('Usage: artisan <command>', 'error');
      return;
    }

    this.writeLine(`Executing: php artisan ${command}`, 'info');

    try {
      const result = await api.executeArtisanCommand(this.currentProject, command);

      if (result.data.success) {
        if (result.data.output) {
          this.writeLine(result.data.output, 'output');
        } else {
          this.writeLine('Command executed successfully (no output)', 'success');
        }

        if (result.data.stderr) {
          this.writeLine('Stderr:', 'warning');
          this.writeLine(result.data.stderr, 'output');
        }
      } else {
        this.writeLine(`Command failed: ${result.data.error}`, 'error');
        if (result.data.output) {
          this.writeLine('Output:', 'info');
          this.writeLine(result.data.output, 'output');
        }
      }
    } catch (error) {
      this.writeLine(`Failed to execute command: ${error.message}`, 'error');
    }
  }

  /**
   * Execute Composer command
   */
  async executeComposerCommand(command) {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    if (!command) {
      this.writeLine('Usage: composer <command>', 'error');
      return;
    }

    this.writeLine(`Executing: composer ${command}`, 'info');

    try {
      const result = await api.execInContainer(this.currentProject, 'app', `composer ${command}`);

      if (result.data.success) {
        this.writeLine(result.data.output || 'Command executed successfully', 'output');
        if (result.data.stderr) {
          this.writeLine('Stderr:', 'warning');
          this.writeLine(result.data.stderr, 'output');
        }
      } else {
        this.writeLine('Command failed', 'error');
        this.writeLine(result.data.stderr || result.data.output || 'Unknown error', 'output');
      }
    } catch (error) {
      this.writeLine(`Failed to execute command: ${error.message}`, 'error');
    }
  }

  /**
   * Execute Node command (npm, yarn, bun, pnpm)
   */
  async executeNodeCommand(manager, command) {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    if (!command) {
      this.writeLine(`Usage: ${manager} <command>`, 'error');
      return;
    }

    this.writeLine(`Executing: ${manager} ${command}`, 'info');

    try {
      const result = await api.execInContainer(this.currentProject, 'vite', `${manager} ${command}`);

      if (result.data.success) {
        this.writeLine(result.data.output || 'Command executed successfully', 'output');
        if (result.data.stderr) {
          this.writeLine('Stderr:', 'warning');
          this.writeLine(result.data.stderr, 'output');
        }
      } else {
        this.writeLine('Command failed', 'error');
        this.writeLine(result.data.stderr || result.data.output || 'Unknown error', 'output');
      }
    } catch (error) {
      this.writeLine(`Failed to execute command: ${error.message}`, 'error');
    }
  }

  /**
   * Execute Docker command
   */
  async executeDockerCommand(command) {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    if (!command) {
      this.writeLine('Usage: docker <command>', 'error');
      return;
    }

    // For security, limit to safe docker commands
    const allowedCommands = ['ps', 'logs', 'stats', 'top', 'inspect'];
    const [cmd] = command.split(' ');

    if (!allowedCommands.includes(cmd)) {
      this.writeLine(`Docker command "${cmd}" not allowed. Allowed: ${allowedCommands.join(', ')}`, 'error');
      return;
    }

    this.writeLine(`Executing: docker ${command}`, 'info');

    try {
      // This would need to be implemented in the API
      this.writeLine('Docker command execution not yet implemented', 'warning');
    } catch (error) {
      this.writeLine(`Failed to execute command: ${error.message}`, 'error');
    }
  }

  /**
   * Show logs
   */
  async showLogs(service = '') {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    this.writeLine(`Fetching logs${service ? ` for ${service}` : ''}...`, 'info');

    try {
      const result = await api.getProjectLogs(this.currentProject, service, 50);

      if (result.data.success) {
        this.writeLine('--- Logs ---', 'info');
        this.writeLine(result.data.logs || 'No logs available', 'output');
        this.writeLine('--- End Logs ---', 'info');
      } else {
        this.writeLine(`Failed to get logs: ${result.data.error}`, 'error');
      }
    } catch (error) {
      this.writeLine(`Failed to fetch logs: ${error.message}`, 'error');
    }
  }

  /**
   * Show project status
   */
  async showStatus() {
    if (!this.currentProject) {
      this.writeLine('No project selected. Use "project <name>" first.', 'error');
      return;
    }

    try {
      const result = await api.getContainerStatus(this.currentProject);

      this.writeLine(`Project: ${this.currentProject}`, 'info');
      this.writeLine(`Status: ${result.data.status}`, 'info');
      this.writeLine(`Containers: ${result.data.running}/${result.data.containers}`, 'info');

      if (result.data.details && result.data.details.length > 0) {
        this.writeLine('Container Details:', 'info');
        result.data.details.forEach(container => {
          this.writeLine(`  ${container.Name}: ${container.State}`, 'muted');
        });
      }
    } catch (error) {
      this.writeLine(`Failed to get status: ${error.message}`, 'error');
    }
  }

  /**
   * Navigate command history
   */
  navigateHistory(direction) {
    if (this.history.length === 0) return;

    if (direction === 'up') {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
      }
    } else {
      if (this.historyIndex > -1) {
        this.historyIndex--;
      }
    }

    if (this.historyIndex >= 0) {
      this.input.value = this.history[this.history.length - 1 - this.historyIndex];
    } else {
      this.input.value = '';
    }

    // Move cursor to end
    setTimeout(() => {
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }, 0);
  }

  /**
   * Handle tab completion
   */
  handleTabCompletion() {
    // Future enhancement: implement command/file completion
    const value = this.input.value;

    // Basic command completion
    const commands = ['help', 'clear', 'history', 'project', 'artisan', 'composer', 'npm', 'docker', 'logs', 'status'];
    const matches = commands.filter(cmd => cmd.startsWith(value));

    if (matches.length === 1) {
      this.input.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      this.writeLine(`Possible completions: ${matches.join(', ')}`, 'info');
    }
  }

  /**
   * Cancel current command
   */
  cancelCommand() {
    if (this.isExecuting) {
      this.writeLine('^C', 'warning');
      this.writeLine('Command cancelled', 'warning');
      this.setExecuting(false);
    }
  }

  /**
   * Set project
   */
  setProject(projectName) {
    this.currentProject = projectName;
    this.projectDisplay.textContent = projectName ? `[${projectName}]` : '';
    this.options.prompt = projectName ? `${projectName}$ ` : '$ ';
    this.container.querySelector('.terminal-prompt').textContent = this.options.prompt;
  }

  /**
   * Set executing state
   */
  setExecuting(executing) {
    this.isExecuting = executing;
    this.input.disabled = executing;

    if (executing) {
      this.input.placeholder = 'Executing...';
      this.container.classList.add('executing');
    } else {
      this.input.placeholder = this.options.placeholder;
      this.container.classList.remove('executing');
      this.focus();
    }
  }

  /**
   * Write command to output
   */
  writeCommand(command) {
    const timestamp = this.options.showTimestamp ? this.getTimestamp() : '';
    const line = document.createElement('div');
    line.className = 'terminal-line command-line';
    line.innerHTML = `
      ${timestamp ? `<span class="terminal-timestamp">${timestamp}</span>` : ''}
      <span class="terminal-prompt">${this.options.prompt}</span>
      <span class="terminal-command">${helpers.escapeHtml(command)}</span>
    `;

    this.output.appendChild(line);
    this.scrollToBottom();
  }

  /**
   * Write line to output
   */
  writeLine(text, type = 'output') {
    const timestamp = this.options.showTimestamp ? this.getTimestamp() : '';
    const line = document.createElement('div');
    line.className = `terminal-line ${type}-line`;

    if (timestamp) {
      line.innerHTML = `<span class="terminal-timestamp">${timestamp}</span><span class="terminal-text">${helpers.escapeHtml(text)}</span>`;
    } else {
      line.innerHTML = `<span class="terminal-text">${helpers.escapeHtml(text)}</span>`;
    }

    this.output.appendChild(line);
    this.scrollToBottom();
  }

  /**
   * Clear terminal
   */
  clear() {
    this.output.innerHTML = '';
    this.writeLine('Terminal cleared.', 'info');
  }

  /**
   * Copy output to clipboard
   */
  async copyOutput() {
    const text = this.output.textContent;
    const success = await helpers.copyToClipboard(text);

    if (success) {
      this.writeLine('Output copied to clipboard.', 'success');
    } else {
      this.writeLine('Failed to copy output.', 'error');
    }
  }

  /**
   * Focus terminal input
   */
  focus() {
    if (this.input && !this.input.disabled) {
      this.input.focus();
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.options.autoScroll) {
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  /**
   * Get timestamp
   */
  getTimestamp() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }

  /**
   * Add command to history
   */
  addToHistory(command) {
    // Don't add empty commands or duplicates
    if (!command || command === this.history[this.history.length - 1]) {
      return;
    }

    this.history.push(command);

    // Limit history size
    if (this.history.length > this.options.maxHistory) {
      this.history.shift();
    }

    this.saveHistory();
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(`terminal-history-${this.containerId}`, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save terminal history:', error);
    }
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(`terminal-history-${this.containerId}`);
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load terminal history:', error);
      this.history = [];
    }
  }

  /**
   * Destroy terminal
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Terminal styles
const terminalStyles = `
.terminal-container {
  background: hsl(220, 13%, 18%);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 400px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: hsl(220, 13%, 15%);
  border-bottom: 1px solid hsl(var(--border));
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.terminal-project {
  color: hsl(142, 76%, 36%);
  font-weight: 500;
}

.terminal-controls {
  display: flex;
  gap: var(--space-1);
}

.terminal-btn {
  background: none;
  border: none;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: var(--space-1);
  border-radius: calc(var(--radius) / 2);
  transition: var(--transition);
}

.terminal-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.terminal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.terminal-output {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  line-height: 1.4;
  color: hsl(213, 31%, 91%);
}

.terminal-line {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.terminal-timestamp {
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  flex-shrink: 0;
  opacity: 0.7;
}

.terminal-prompt {
  color: hsl(142, 76%, 36%);
  font-weight: 500;
  flex-shrink: 0;
}

.terminal-command {
  color: hsl(213, 31%, 91%);
}

.terminal-text {
  color: inherit;
}

.command-line {
  background: hsl(220, 13%, 20%);
  margin: 0 calc(-1 * var(--space-3));
  padding: 0.25rem var(--space-3);
}

.output-line .terminal-text {
  color: hsl(213, 31%, 91%);
}

.success-line .terminal-text {
  color: hsl(142, 76%, 36%);
}

.error-line .terminal-text {
  color: hsl(0, 72%, 51%);
}

.warning-line .terminal-text {
  color: hsl(45, 93%, 47%);
}

.info-line .terminal-text {
  color: hsl(217, 91%, 60%);
}

.muted-line .terminal-text {
  color: hsl(var(--muted-foreground));
}

.terminal-input-line {
  display: flex;
  align-items: center;
  padding: var(--space-3);
  background: hsl(220, 13%, 16%);
  border-top: 1px solid hsl(var(--border));
  gap: var(--space-2);
}

.terminal-input {
  flex: 1;
  background: none;
  border: none;
  color: hsl(213, 31%, 91%);
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

.terminal-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.terminal-container.executing .terminal-input {
  opacity: 0.5;
}

.terminal-container.executing .terminal-prompt {
  animation: pulse 1.5s infinite;
}

/* Scrollbar styling for terminal */
.terminal-output::-webkit-scrollbar {
  width: 6px;
}

.terminal-output::-webkit-scrollbar-track {
  background: hsl(220, 13%, 15%);
}

.terminal-output::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}
`;

// Inject styles
const terminalStyleSheet = document.createElement('style');
terminalStyleSheet.textContent = terminalStyles;
document.head.appendChild(terminalStyleSheet);

// Export Terminal class
window.Terminal = Terminal;
