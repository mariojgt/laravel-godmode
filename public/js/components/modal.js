/**
 * Modal Management for Laravel God Mode
 * Accessible, keyboard-friendly modal system
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.previousFocus = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Global escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') && this.activeModal) {
        this.close(this.activeModal);
      }
    });
  }

  /**
   * Open modal
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with id "${modalId}" not found`);
      return;
    }

    // Store previous focus
    this.previousFocus = document.activeElement;

    // Close any existing modal
    if (this.activeModal) {
      this.close(this.activeModal);
    }

    this.activeModal = modalId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const focusable = modal.querySelector('input, textarea, select, button, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      setTimeout(() => focusable.focus(), 100);
    }

    // Trap focus within modal
    this.trapFocus(modal);
  }

  /**
   * Close modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
    this.activeModal = null;

    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  /**
   * Trap focus within modal
   */
  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);

    // Remove event listener when modal closes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && !modal.classList.contains('active')) {
          modal.removeEventListener('keydown', handleTabKey);
          observer.disconnect();
        }
      });
    });

    observer.observe(modal, { attributes: true });
  }

  /**
   * Check if modal is open
   */
  isOpen(modalId) {
    return this.activeModal === modalId;
  }

  /**
   * Toggle modal
   */
  toggle(modalId) {
    if (this.isOpen(modalId)) {
      this.close(modalId);
    } else {
      this.open(modalId);
    }
  }
}

// Create global instance
window.modal = new ModalManager();

// Global modal functions for inline event handlers
window.openEnvModal = (projectName) => {
  document.getElementById('envProjectName').textContent = projectName;
  document.getElementById('envContent').value = 'Loading...';
  modal.open('envModal');

  // Load environment content
  api.getProjectEnv(projectName)
    .then(result => {
      document.getElementById('envContent').value = result.data.content;
    })
    .catch(error => {
      notifications.error(`Failed to load environment: ${error.message}`);
      document.getElementById('envContent').value = `# Error loading environment\n# ${error.message}`;
    });
};

window.closeEnvModal = () => {
  modal.close('envModal');
};

window.saveEnvContent = async () => {
  const projectName = document.getElementById('envProjectName').textContent;
  const content = document.getElementById('envContent').value;

  if (!projectName) {
    notifications.error('No project selected');
    return;
  }

  const saveBtn = document.getElementById('saveEnvBtn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    await api.updateProjectEnv(projectName, content);
    notifications.success('Environment updated successfully');
    modal.close('envModal');
  } catch (error) {
    notifications.error(`Failed to save environment: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
};

window.openArtisanModal = (projectName) => {
  document.getElementById('artisanProjectName').textContent = projectName;
  document.getElementById('artisanInput').value = '';
  document.getElementById('artisanOutput').textContent = 'Ready to execute commands...';
  modal.open('artisanModal');

  // Load Artisan commands
  loadArtisanCommands();
};

window.closeArtisanModal = () => {
  modal.close('artisanModal');
};

window.runArtisanCommand = async () => {
  const projectName = document.getElementById('artisanProjectName').textContent;
  const command = document.getElementById('artisanInput').value.trim();

  if (!command) {
    notifications.warning('Please enter a command');
    return;
  }

  const runBtn = document.getElementById('runArtisanBtn');
  const output = document.getElementById('artisanOutput');
  const originalText = runBtn.textContent;

  runBtn.disabled = true;
  runBtn.textContent = 'Running...';
  output.textContent = `Running: php artisan ${command}\n\n`;

  try {
    const result = await api.executeArtisanCommand(projectName, command);

    if (result.data.success) {
      output.textContent = `Command: ${result.data.command}\n\nOutput:\n${result.data.output || 'No output'}`;
      if (result.data.stderr) {
        output.textContent += `\n\nStderr:\n${result.data.stderr}`;
      }
      notifications.success('Command executed successfully');
    } else {
      output.textContent = `Command: ${result.data.command}\n\nError:\n${result.data.error}\n\nOutput:\n${result.data.output || 'No output'}`;
      if (result.data.stderr) {
        output.textContent += `\n\nStderr:\n${result.data.stderr}`;
      }
      notifications.error('Command execution failed');
    }
  } catch (error) {
    output.textContent = `Error: ${error.message}`;
    notifications.error(`Failed to execute command: ${error.message}`);
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = originalText;
    output.scrollTop = output.scrollHeight;
  }
};

window.openLogsModal = (projectName) => {
  document.getElementById('logsProjectName').textContent = projectName;
  document.getElementById('logsContent').textContent = 'Loading logs...';
  document.getElementById('logsService').value = '';
  document.getElementById('autoRefreshLogs').checked = false;
  modal.open('logsModal');

  // Load initial logs
  loadProjectLogs(projectName);
};

window.closeLogsModal = () => {
  // Stop auto-refresh if enabled
  if (window.logsAutoRefreshInterval) {
    clearInterval(window.logsAutoRefreshInterval);
    window.logsAutoRefreshInterval = null;
  }
  modal.close('logsModal');
};

window.refreshProjectLogs = () => {
  const projectName = document.getElementById('logsProjectName').textContent;
  loadProjectLogs(projectName);
};

async function loadProjectLogs(projectName, service = '') {
  const logsContent = document.getElementById('logsContent');
  const serviceSelect = document.getElementById('logsService');

  if (!service) {
    service = serviceSelect.value;
  }

  try {
    const result = await api.getProjectLogs(projectName, service, 100);

    if (result.data.success) {
      logsContent.textContent = result.data.logs || 'No logs available';
    } else {
      logsContent.textContent = `Error loading logs: ${result.data.error}`;
    }

    logsContent.scrollTop = logsContent.scrollHeight;
  } catch (error) {
    logsContent.textContent = `Error: ${error.message}`;
  }
}

async function loadArtisanCommands() {
  const commandsGrid = document.getElementById('commandsGrid');

  try {
    const result = await api.getArtisanCommands();
    const commands = result.data;

    commandsGrid.innerHTML = '';

    if (commands && commands.length > 0) {
      // Group commands by category
      const categories = {};
      commands.forEach(cmd => {
        const category = cmd.category || 'Other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(cmd);
      });

      // Create command buttons for each category
      Object.keys(categories).sort().forEach(category => {
        const categoryHeader = document.createElement('h4');
        categoryHeader.textContent = category;
        categoryHeader.style.gridColumn = '1 / -1';
        categoryHeader.style.margin = '1rem 0 0.5rem 0';
        categoryHeader.style.fontSize = '0.875rem';
        categoryHeader.style.fontWeight = '600';
        categoryHeader.style.color = 'hsl(var(--muted-foreground))';
        commandsGrid.appendChild(categoryHeader);

        categories[category].forEach(cmd => {
          const button = document.createElement('button');
          button.className = 'command-btn';
          button.textContent = cmd.name;
          button.title = cmd.description || cmd.command;

          button.onclick = () => {
            let command = cmd.command;
            if (cmd.requiresInput) {
              const input = prompt(`Enter additional parameters for: ${cmd.command}`, cmd.placeholder || '');
              if (input !== null) {
                command = `${cmd.command} ${input}`.trim();
              } else {
                return; // User cancelled
              }
            }

            document.getElementById('artisanInput').value = command;
          };

          commandsGrid.appendChild(button);
        });
      });
    } else {
      commandsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: hsl(var(--muted-foreground));">No commands available</p>';
    }
  } catch (error) {
    commandsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: hsl(var(--destructive));">Failed to load commands</p>';
  }
}

// Event listeners for modal forms
document.addEventListener('DOMContentLoaded', () => {
  // Environment editor save button
  const saveEnvBtn = document.getElementById('saveEnvBtn');
  if (saveEnvBtn) {
    saveEnvBtn.addEventListener('click', saveEnvContent);
  }

  // Artisan run button
  const runArtisanBtn = document.getElementById('runArtisanBtn');
  if (runArtisanBtn) {
    runArtisanBtn.addEventListener('click', runArtisanCommand);
  }

  // Artisan input enter key
  const artisanInput = document.getElementById('artisanInput');
  if (artisanInput) {
    artisanInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runArtisanCommand();
      }
    });
  }

  // Logs refresh button
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', refreshProjectLogs);
  }

  // Logs service selector
  const logsService = document.getElementById('logsService');
  if (logsService) {
    logsService.addEventListener('change', () => {
      const projectName = document.getElementById('logsProjectName').textContent;
      if (projectName) {
        loadProjectLogs(projectName);
      }
    });
  }

  // Auto-refresh logs checkbox
  const autoRefreshLogs = document.getElementById('autoRefreshLogs');
  if (autoRefreshLogs) {
    autoRefreshLogs.addEventListener('change', (e) => {
      const projectName = document.getElementById('logsProjectName').textContent;

      if (e.target.checked && projectName) {
        // Start auto-refresh every 3 seconds
        window.logsAutoRefreshInterval = setInterval(() => {
          if (modal.isOpen('logsModal')) {
            loadProjectLogs(projectName);
          } else {
            clearInterval(window.logsAutoRefreshInterval);
            window.logsAutoRefreshInterval = null;
          }
        }, 3000);
      } else {
        // Stop auto-refresh
        if (window.logsAutoRefreshInterval) {
          clearInterval(window.logsAutoRefreshInterval);
          window.logsAutoRefreshInterval = null;
        }
      }
    });
  }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}
