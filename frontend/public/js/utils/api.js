// API utility functions
class API {
    constructor() {
        // Dynamically determine backend URL based on current environment
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;

        // Try to get backend port from environment or use common ports
        let backendPort = '5001'; // Default from .env

        // Check if we're in development and try different ports
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Try to determine backend port dynamically
            // You can override this by setting window.BACKEND_PORT in your HTML
            backendPort = window.BACKEND_PORT || '5001';
        }

        this.baseURL = `${protocol}//${hostname}:${backendPort}/api`;
        console.log('API Base URL:', this.baseURL);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        try {
            console.log(`API Request: ${config.method} ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);

            // Provide better error messages for common issues
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to backend server. Please ensure the backend is running.');
            }

            throw error;
        }
    }

    // Projects
    async getProjects() {
        return this.request('/projects');
    }

    async getProject(id) {
        return this.request(`/projects/${id}`);
    }

    async createProject(data) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProject(id, data) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    async startProject(id) {
        return this.request(`/projects/${id}/start`, {
            method: 'POST'
        });
    }

    async stopProject(id) {
        return this.request(`/projects/${id}/stop`, {
            method: 'POST'
        });
    }

    async rebuildProject(id) {
        return this.request(`/projects/${id}/rebuild`, {
            method: 'POST'
        });
    }

    // Templates
    async getTemplates() {
        return this.request('/templates');
    }

    async getTemplate(id) {
        return this.request(`/templates/${id}`);
    }

    async getTemplateStubs(id) {
        return this.request(`/templates/${id}/stubs`);
    }

    // Terminal
    async createTerminalSession(projectId, cwd) {
        return this.request('/terminal/create', {
            method: 'POST',
            body: JSON.stringify({ projectId, cwd })
        });
    }

    async sendTerminalInput(sessionId, input) {
        return this.request(`/terminal/${sessionId}/input`, {
            method: 'POST',
            body: JSON.stringify({ input })
        });
    }

    async resizeTerminal(sessionId, cols, rows) {
        return this.request(`/terminal/${sessionId}/resize`, {
            method: 'POST',
            body: JSON.stringify({ cols, rows })
        });
    }

    async killTerminalSession(sessionId) {
        return this.request(`/terminal/${sessionId}`, {
            method: 'DELETE'
        });
    }

    // Health check
    async checkHealth() {
        const healthUrl = this.baseURL.replace('/api', '/health');
        try {
            const response = await fetch(healthUrl);
            return response.ok;
        } catch {
            return false;
        }
    }

    // Environment file management
    async getProjectEnv(projectId) {
        return this.request(`/env/${projectId}`);
    }

    async updateProjectEnv(projectId, content) {
        return this.request(`/env/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });
    }

    // Container logs
    async getContainerLogs(projectId, container = 'app') {
        const response = await this.request(`/projects/${projectId}/logs/${container}`);
        return response.logs;
    }

    // Terminal commands
    async executeCommand(sessionId, command) {
        return this.request(`/terminal/${sessionId}/exec`, {
            method: 'POST',
            body: JSON.stringify({ command })
        });
    }

    // Port management
    async checkPorts(ports, excludeProjectId = null) {
        return this.request('/projects/check-ports', {
            method: 'POST',
            body: JSON.stringify({ ports, excludeProjectId })
        });
    }

    async openProjectInVSCode(projectId) {
        return this.request(`/projects/${projectId}/open-vscode`, {
            method: 'POST'
        });
    }

    // Import SQL file to project database
    async importSQLFile(projectId, formData) {
        const url = `${this.baseURL}/projects/${projectId}/import-sql`;

        try {
            console.log(`Importing SQL file for project: ${projectId}`);
            const response = await fetch(url, {
                method: 'POST',
                body: formData, // Don't set Content-Type, let browser set it for FormData
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('SQL import failed:', error);
            throw error;
        }
    }

    async openProjectInEditor(projectId, editor = 'vscode') {
        return this.request(`/projects/${projectId}/open-editor`, {
            method: 'POST',
            body: JSON.stringify({ editor })
        });
    }

    // Laravel-specific API methods
    async getLaravelStatus(projectId) {
        return this.request(`/laravel/${projectId}/status`);
    }

    async runArtisanCommand(projectId, command, args = []) {
        return this.request(`/laravel/${projectId}/artisan`, {
            method: 'POST',
            body: JSON.stringify({ command, args })
        });
    }

    async getQueueStatus(projectId) {
        return this.request(`/laravel/${projectId}/queue/status`);
    }

    async startQueueWorker(projectId, options = {}) {
        return this.request(`/laravel/${projectId}/queue/start`, {
            method: 'POST',
            body: JSON.stringify(options)
        });
    }

    async stopQueueWorkers(projectId) {
        return this.request(`/laravel/${projectId}/queue/stop`, {
            method: 'POST'
        });
    }

    async getQueueJobs(projectId, status = 'all', limit = 50) {
        return this.request(`/laravel/${projectId}/queue/jobs?status=${status}&limit=${limit}`);
    }

    async clearCache(projectId, types = ['all']) {
        return this.request(`/laravel/${projectId}/cache/clear`, {
            method: 'POST',
            body: JSON.stringify({ types })
        });
    }

    async runMigrations(projectId, fresh = false, seed = false) {
        return this.request(`/laravel/${projectId}/migrate`, {
            method: 'POST',
            body: JSON.stringify({ fresh, seed })
        });
    }

    async getLaravelLogs(projectId, type = 'laravel', lines = 100) {
        return this.request(`/laravel/${projectId}/logs?type=${type}&lines=${lines}`);
    }

    async getScheduleStatus(projectId) {
        return this.request(`/laravel/${projectId}/schedule/status`);
    }

    async runScheduler(projectId) {
        return this.request(`/laravel/${projectId}/schedule/run`, {
            method: 'POST'
        });
    }

    // Service management
    async getServiceStatus(projectId) {
        return this.request(`/services/${projectId}`);
    }

    async controlService(projectId, service, action) {
        return this.request(`/services/${projectId}/${service}/${action}`, {
            method: 'POST'
        });
    }

    async getServiceHealth(projectId) {
        return this.request(`/services/${projectId}/health`);
    }

    async getServiceMetrics(projectId) {
        return this.request(`/services/${projectId}/metrics`);
    }

    // Generic get/post methods for flexibility
    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Create global API instance
window.api = new API();
