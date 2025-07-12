/**
 * Toast Notification System for Laravel God Mode
 * Modern, accessible toast notifications
 */

class NotificationManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
    this.notifications = new Map();
    this.defaultDuration = 5000;
    this.maxNotifications = 5;
  }

  /**
   * Show notification
   */
  show(message, type = 'info', options = {}) {
    const {
      duration = this.defaultDuration,
      persistent = false,
      actions = [],
      id = helpers.generateId()
    } = options;

    // Remove oldest notification if we have too many
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = this.notifications.keys().next().value;
      this.hide(oldestId);
    }

    const notification = this.createElement(id, message, type, actions);
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto dismiss if not persistent
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  /**
   * Hide notification
   */
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.add('hide');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Create notification element
   */
  createElement(id, message, type, actions) {
    const notification = document.createElement('div');
    notification.className = `toast ${type}`;
    notification.setAttribute('data-id', id);
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    const content = document.createElement('div');
    content.className = 'toast-content';

    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.innerHTML = this.getIcon(type);

    const body = document.createElement('div');
    body.className = 'toast-body';

    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    body.appendChild(messageEl);

    // Add actions if provided
    if (actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'toast-actions';

      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'toast-action';
        button.textContent = action.label;
        button.onclick = () => {
          action.onClick();
          if (action.dismiss !== false) {
            this.hide(id);
          }
        };
        actionsEl.appendChild(button);
      });

      body.appendChild(actionsEl);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.onclick = () => this.hide(id);

    content.appendChild(icon);
    content.appendChild(body);
    content.appendChild(closeBtn);
    notification.appendChild(content);

    // Click to dismiss
    notification.onclick = (e) => {
      if (e.target === notification || e.target === content) {
        this.hide(id);
      }
    };

    return notification;
  }

  /**
   * Get icon for notification type
   */
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Convenience methods
   */
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', { ...options, duration: 8000 });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications.forEach((notification, id) => {
      this.hide(id);
    });
  }

  /**
   * Show loading notification with progress
   */
  showLoading(message, options = {}) {
    const id = helpers.generateId();
    const notification = this.createElement(id, message, 'info', []);

    // Add loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'toast-spinner';
    notification.querySelector('.toast-icon').appendChild(spinner);

    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    return {
      id,
      update: (newMessage) => {
        const messageEl = notification.querySelector('.toast-message');
        if (messageEl) {
          messageEl.textContent = newMessage;
        }
      },
      close: () => this.hide(id)
    };
  }

  /**
   * Show confirmation notification
   */
  confirm(message, onConfirm, onCancel = null) {
    return this.show(message, 'warning', {
      persistent: true,
      actions: [
        {
          label: 'Confirm',
          onClick: onConfirm
        },
        {
          label: 'Cancel',
          onClick: onCancel || (() => {})
        }
      ]
    });
  }
}

// Add CSS for toast notifications
const toastStyles = `
.toast {
  display: flex;
  min-width: 300px;
  max-width: 500px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast.hide {
  opacity: 0;
  transform: translateX(100%);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  width: 100%;
}

.toast-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: var(--space-2);
}

.toast-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.toast-action {
  padding: var(--space-1) var(--space-2);
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) / 2);
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
}

.toast-action:hover {
  background: hsl(var(--accent));
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: hsl(var(--muted-foreground));
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition);
}

.toast-close:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.toast.success {
  border-left: 4px solid hsl(142, 76%, 36%);
}

.toast.error {
  border-left: 4px solid hsl(var(--destructive));
}

.toast.warning {
  border-left: 4px solid hsl(45, 93%, 47%);
}

.toast.info {
  border-left: 4px solid hsl(217, 91%, 60%);
}

@media (max-width: 768px) {
  .toast {
    min-width: 280px;
    max-width: calc(100vw - 2rem);
  }
}
`;

// Inject styles
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = toastStyles;
document.head.appendChild(notificationStyleSheet);

// Create global instance
window.notifications = new NotificationManager();

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
