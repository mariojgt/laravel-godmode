/**
 * API Utilities for Laravel God Mode
 * Centralized API communication layer
 */

class APIClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return { success: true, data, response };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return this.request(url.pathname + url.search);
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Project API methods
  async getProjects() {
    return this.get('/api/projects');
  }

  async getProject(name) {
    return this.get(`/api/projects/${name}`);
  }

  async createProject(projectData) {
    return this.post('/api/projects', projectData);
  }

  async startProject(name) {
    return this.post(`/api/projects/${name}/start`);
  }

  async stopProject(name) {
    return this.post(`/api/projects/${name}/stop`);
  }

  async restartProject(name) {
    return this.post(`/api/projects/${name}/restart`);
  }

  async deleteProject(name) {
    return this.delete(`/api/projects/${name}`);
  }

  async updateProjectStatus(name) {
    return this.post(`/api/projects/${name}/status`);
  }

  async discoverProjects() {
    return this.post('/api/projects/discover');
  }

  // Environment API methods
  async getProjectEnv(name) {
    return this.get(`/api/projects/${name}/env`);
  }

  async updateProjectEnv(name, content) {
    return this.put(`/api/projects/${name}/env`, { content });
  }

  // Artisan API methods
  async executeArtisanCommand(name, command) {
    return this.post(`/api/projects/${name}/artisan`, { command });
  }

  async getArtisanCommands() {
    return this.get('/api/artisan-commands');
  }

  // Logs API methods
  async getProjectLogs(name, service = '', lines = 100) {
    return this.get(`/api/projects/${name}/logs`, { service, lines });
  }

  // Docker API methods
  async getContainerStatus(name) {
    return this.get(`/api/docker/${name}/status`);
  }

  async buildContainers(name, noCache = false) {
    return this.post(`/api/docker/${name}/build`, { noCache });
  }

  async execInContainer(name, service, command) {
    return this.post(`/api/docker/${name}/exec`, { service, command });
  }

  async getContainerLogs(name, service = '', lines = 100) {
    return this.get(`/api/docker/${name}/logs/${service}`, { lines });
  }

  async removeContainers(name, removeVolumes = true) {
    return this.delete(`/api/docker/${name}?removeVolumes=${removeVolumes}`);
  }

  async rebuildContainers(name, noCache = false) {
    return this.post(`/api/docker/${name}/rebuild`, { noCache });
  }

  // File API methods
  async getFile(name, filePath) {
    return this.get(`/api/files/${name}/file/${filePath}`);
  }

  async updateFile(name, filePath, content) {
    return this.put(`/api/files/${name}/file/${filePath}`, { content });
  }

  async createFile(name, filePath, content = '') {
    return this.post(`/api/files/${name}/file/${filePath}`, { content });
  }

  async deleteFile(name, filePath) {
    return this.delete(`/api/files/${name}/file/${filePath}`);
  }

  async listDirectory(name, dirPath = '') {
    return this.get(`/api/files/${name}/directory/${dirPath}`);
  }

  async createDirectory(name, dirPath) {
    return this.post(`/api/files/${name}/directory/${dirPath}`);
  }

  async deleteDirectory(name, dirPath) {
    return this.delete(`/api/files/${name}/directory/${dirPath}`);
  }

  async getFileStats(name, filePath) {
    return this.get(`/api/files/${name}/stats/${filePath}`);
  }

  async backupProject(name) {
    return this.post(`/api/files/${name}/backup`);
  }

  // Health check
  async getHealth() {
    return this.get('/health');
  }
}

// Create singleton instance
window.api = new APIClient();

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
