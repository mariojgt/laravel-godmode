/**
 * Helper Functions for Laravel God Mode
 * Common utilities and helper functions
 */

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format time for display
 */
function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString();
}

/**
 * Validate project name
 */
function validateProjectName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Project name is required' };
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }

  if (name.length < 2 || name.length > 50) {
    return { valid: false, error: 'Name must be between 2 and 50 characters' };
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return { valid: false, error: 'Name cannot start or end with a hyphen' };
  }

  return { valid: true };
}

/**
 * Validate port number
 */
function validatePort(port) {
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1000 || portNum > 65535) {
    return { valid: false, error: 'Port must be between 1000 and 65535' };
  }
  return { valid: true };
}

/**
 * Generate a random ID
 */
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get status color class
 */
function getStatusClass(status) {
  const statusMap = {
    'running': 'status-running',
    'stopped': 'status-stopped',
    'starting': 'status-starting',
    'stopping': 'status-stopping',
    'error': 'status-error',
    'partial': 'status-partial'
  };
  return statusMap[status] || 'status-unknown';
}

/**
 * Get status display text
 */
function getStatusText(status) {
  const statusMap = {
    'running': 'Running',
    'stopped': 'Stopped',
    'starting': 'Starting...',
    'stopping': 'Stopping...',
    'error': 'Error',
    'partial': 'Partial'
  };
  return statusMap[status] || 'Unknown';
}

/**
 * Parse form data to object
 */
function parseFormData(form) {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values (checkboxes, etc.)
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  return data;
}

/**
 * Handle form checkboxes specially
 */
function getFormCheckboxValues(form, name) {
  const checkboxes = form.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Get boolean from form checkbox
 */
function getFormCheckboxBoolean(form, name) {
  const checkbox = form.querySelector(`input[name="${name}"]`);
  return checkbox ? checkbox.checked : false;
}

/**
 * Show/hide element with animation
 */
function toggleElement(element, show = null) {
  if (show === null) {
    show = element.style.display === 'none';
  }

  if (show) {
    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';

    requestAnimationFrame(() => {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  } else {
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      element.style.display = 'none';
    }, 300);
  }
}

/**
 * Smooth scroll to element
 */
function scrollToElement(element, offset = 0) {
  const elementPosition = element.offsetTop;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Parse URL parameters
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Update URL without page reload
 */
function updateUrl(params = {}) {
  const url = new URL(window.location);

  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });

  window.history.replaceState({}, '', url);
}

/**
 * Format command for display
 */
function formatCommand(command) {
  if (command.startsWith('php artisan ')) {
    return command;
  }
  return `php artisan ${command}`;
}

/**
 * Get service icon
 */
function getServiceIcon(service) {
  const icons = {
    'redis': '🔴',
    'mysql': '🗄️',
    'phpmyadmin': '🔧',
    'mailhog': '📧',
    'nginx': '🌐',
    'vite': '⚡'
  };
  return icons[service] || '📦';
}

/**
 * Create element with attributes
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  Object.keys(attributes).forEach(key => {
    if (key === 'className') {
      element.className = attributes[key];
    } else if (key === 'textContent') {
      element.textContent = attributes[key];
    } else if (key === 'innerHTML') {
      element.innerHTML = attributes[key];
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Wait for specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
}

/**
 * Check if string is valid JSON
 */
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  const cloned = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });

  return cloned;
}

// Export functions to global scope
window.helpers = {
  debounce,
  throttle,
  formatDate,
  formatTime,
  validateProjectName,
  validatePort,
  generateId,
  escapeHtml,
  copyToClipboard,
  formatFileSize,
  getStatusClass,
  getStatusText,
  parseFormData,
  getFormCheckboxValues,
  getFormCheckboxBoolean,
  toggleElement,
  scrollToElement,
  isInViewport,
  getUrlParams,
  updateUrl,
  formatCommand,
  getServiceIcon,
  createElement,
  sleep,
  retry,
  isValidJSON,
  deepClone
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.helpers;
}
