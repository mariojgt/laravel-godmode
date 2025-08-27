// Progress Manager - Handles visual feedback for long-running operations
class ProgressManager {
    constructor() {
        this.activeOperations = new Map();
        this.init();
    }

    init() {
        this.createProgressContainer();
        console.log('🔄 Progress Manager initialized');
    }

    createProgressContainer() {
        // Create the progress notifications container
        const container = document.createElement('div');
        container.id = 'progress-container';
        container.className = 'progress-container';
        document.body.appendChild(container);
    }

    // Start a new operation with progress tracking
    startOperation(operationId, {
        title,
        description = '',
        projectId = null,
        projectName = '',
        estimatedDuration = null,
        steps = []
    }) {
        const operation = {
            id: operationId,
            title,
            description,
            projectId,
            projectName,
            status: 'running',
            startTime: Date.now(),
            estimatedDuration,
            steps,
            currentStep: 0,
            progress: 0,
            logs: []
        };

        this.activeOperations.set(operationId, operation);
        this.renderOperation(operation);
        this.updateProjectCardStatus(projectId, 'processing', title);

        return operation;
    }

    // Update operation progress
    updateOperation(operationId, updates) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        Object.assign(operation, updates);
        this.renderOperation(operation);

        // Update project card if status changed
        if (updates.status && operation.projectId) {
            this.updateProjectCardStatus(operation.projectId, updates.status, operation.title);
        }
    }

    // Add a log entry to an operation
    addLog(operationId, message, type = 'info') {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        operation.logs.push({
            timestamp: Date.now(),
            message,
            type
        });

        this.renderOperation(operation);
    }

    // Complete an operation
    completeOperation(operationId, success = true, finalMessage = null) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        operation.status = success ? 'completed' : 'failed';
        operation.endTime = Date.now();
        operation.progress = 100;

        if (finalMessage) {
            this.addLog(operationId, finalMessage, success ? 'success' : 'error');
        }

        this.renderOperation(operation);

        // Auto-remove after delay
        setTimeout(() => {
            this.removeOperation(operationId);
        }, success ? 3000 : 5000);

        // Reset project card status
        if (operation.projectId) {
            setTimeout(() => {
                window.dashboard?.loadProjects();
            }, 1000);
        }
    }

    // Remove an operation
    removeOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        this.activeOperations.delete(operationId);
        const element = document.getElementById(`progress-${operationId}`);
        if (element) {
            element.classList.add('removing');
            setTimeout(() => element.remove(), 300);
        }
    }

    // Render operation in UI
    renderOperation(operation) {
        const container = document.getElementById('progress-container');
        if (!container) return;

        let element = document.getElementById(`progress-${operation.id}`);
        if (!element) {
            element = document.createElement('div');
            element.id = `progress-${operation.id}`;
            element.className = 'progress-notification';
            container.appendChild(element);
        }

        const statusClass = `status-${operation.status}`;
        const statusIcon = this.getStatusIcon(operation.status);
        const duration = operation.endTime ?
            this.formatDuration(operation.endTime - operation.startTime) :
            this.formatDuration(Date.now() - operation.startTime);

        // Calculate progress if steps are defined
        if (operation.steps.length > 0 && operation.status === 'running') {
            operation.progress = Math.round((operation.currentStep / operation.steps.length) * 100);
        }

        element.className = `progress-notification ${statusClass}`;
        element.innerHTML = `
            <div class="progress-header">
                <div class="progress-title">
                    <span class="progress-icon">${statusIcon}</span>
                    <span class="operation-title">${operation.title}</span>
                    ${operation.projectName ? `<span class="project-name">${operation.projectName}</span>` : ''}
                </div>
                <div class="progress-controls">
                    <span class="progress-duration">${duration}</span>
                    <button class="progress-close" onclick="progressManager.removeOperation('${operation.id}')">&times;</button>
                </div>
            </div>

            ${operation.description ? `<div class="progress-description">${operation.description}</div>` : ''}

            ${operation.status === 'running' ? `
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${operation.progress}%"></div>
                    </div>
                    <span class="progress-percentage">${operation.progress}%</span>
                </div>
            ` : ''}

            ${operation.steps.length > 0 ? `
                <div class="progress-steps">
                    <div class="current-step">
                        ${operation.status === 'running' && operation.currentStep < operation.steps.length ?
                            `Step ${operation.currentStep + 1}/${operation.steps.length}: ${operation.steps[operation.currentStep]}` :
                            operation.status === 'completed' ? 'All steps completed' : ''
                        }
                    </div>
                </div>
            ` : ''}

            ${operation.logs.length > 0 ? `
                <div class="progress-logs" id="progress-logs-${operation.id}">
                    <div class="logs-header">
                        <span>Operation Log</span>
                        <button class="logs-toggle" onclick="this.closest('.progress-notification').classList.toggle('logs-expanded')">
                            📋 Toggle Logs
                        </button>
                    </div>
                    <div class="logs-content">
                        ${operation.logs.slice(-10).map(log => `
                            <div class="log-entry log-${log.type}">
                                <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span class="log-message">${log.message}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Auto-scroll logs
        const logsContent = element.querySelector('.logs-content');
        if (logsContent) {
            logsContent.scrollTop = logsContent.scrollHeight;
        }
    }

    getStatusIcon(status) {
        const icons = {
            running: '🔄',
            completed: '✅',
            failed: '❌',
            processing: '⚙️',
            waiting: '⏳'
        };
        return icons[status] || '⚙️';
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    updateProjectCardStatus(projectId, status, operation) {
        if (!projectId) return;

        const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
        if (!projectCard) return;

        const statusElement = projectCard.querySelector('.project-status');
        if (statusElement) {
            const statusMap = {
                'processing': { text: 'Processing...', class: 'status-processing' },
                'running': { text: 'Starting...', class: 'status-starting' },
                'stopping': { text: 'Stopping...', class: 'status-stopping' },
                'building': { text: 'Building...', class: 'status-building' },
                'completed': { text: 'Ready', class: 'status-ready' },
                'failed': { text: 'Error', class: 'status-error' }
            };

            const statusInfo = statusMap[status] || { text: operation, class: 'status-processing' };
            statusElement.textContent = statusInfo.text;
            statusElement.className = `project-status ${statusInfo.class}`;
        }

        // Add progress indicator to card
        let progressIndicator = projectCard.querySelector('.operation-progress');
        if (status === 'processing' || status === 'running' || status === 'stopping' || status === 'building') {
            if (!progressIndicator) {
                progressIndicator = document.createElement('div');
                progressIndicator.className = 'operation-progress';
                projectCard.appendChild(progressIndicator);
            }
            progressIndicator.innerHTML = `
                <div class="operation-status">
                    <span class="operation-icon">🔄</span>
                    <span class="operation-text">${operation}</span>
                </div>
            `;
        } else if (progressIndicator) {
            progressIndicator.remove();
        }
    }

    // Helper methods for common operations
    createProjectOperation(projectId, projectName, operationType) {
        const operations = {
            start: {
                title: '🚀 Starting Project',
                description: 'Initializing containers and services...',
                steps: ['Pulling images', 'Creating containers', 'Starting services', 'Health checks']
            },
            stop: {
                title: '⏹️ Stopping Project',
                description: 'Gracefully shutting down services...',
                steps: ['Stopping containers', 'Cleaning up resources']
            },
            rebuild: {
                title: '🔄 Rebuilding Project',
                description: 'Rebuilding containers from scratch...',
                steps: ['Stopping containers', 'Removing old containers', 'Rebuilding images', 'Starting new containers']
            },
            create: {
                title: '🏗️ Creating Project',
                description: 'Setting up new project environment...',
                steps: ['Processing template', 'Generating configuration', 'Setting up Docker', 'Installing dependencies', 'Starting services']
            }
        };

        const config = operations[operationType] || operations.start;
        const operationId = `${operationType}-${projectId}-${Date.now()}`;

        return this.startOperation(operationId, {
            ...config,
            projectId,
            projectName,
            estimatedDuration: this.getEstimatedDuration(operationType)
        });
    }

    getEstimatedDuration(operationType) {
        const durations = {
            start: 30000,    // 30 seconds
            stop: 15000,     // 15 seconds
            rebuild: 120000, // 2 minutes
            create: 180000   // 3 minutes
        };
        return durations[operationType] || 30000;
    }

    // WebSocket integration for real-time updates
    handleWebSocketMessage(message) {
        const { type, operationId, ...data } = message;

        // Map backend operation IDs to frontend operation IDs
        const frontendOperationId = this.mapBackendOperationId(operationId);

        if (!frontendOperationId) {
            console.log('No matching frontend operation for:', operationId);
            return;
        }

        switch (type) {
            case 'operation_progress':
                this.updateOperation(frontendOperationId, data);
                break;
            case 'operation_log':
                this.addLog(frontendOperationId, data.message, data.logType || 'info');
                break;
            case 'operation_step':
                this.updateOperation(frontendOperationId, {
                    currentStep: data.step,
                    progress: data.progress
                });
                if (data.stepMessage) {
                    this.addLog(frontendOperationId, data.stepMessage, 'info');
                }
                break;
            case 'operation_complete':
                this.completeOperation(frontendOperationId, data.success, data.message);
                break;
        }
    }

    // Map backend operation IDs (like start-projectId) to frontend operation IDs
    mapBackendOperationId(backendId) {
        // Find the frontend operation that matches this backend operation
        for (const [frontendId, operation] of this.activeOperations.entries()) {
            // Extract project ID from frontend operation ID
            const projectId = operation.projectId;

            // Check if backend operation ID matches the expected pattern
            if (backendId === `start-${projectId}` && frontendId.includes('start')) {
                return frontendId;
            }
            if (backendId === `stop-${projectId}` && frontendId.includes('stop')) {
                return frontendId;
            }
            if (backendId === `rebuild-${projectId}` && frontendId.includes('rebuild')) {
                return frontendId;
            }
        }
        return null;
    }    // Clear all completed operations
    clearCompleted() {
        for (const [id, operation] of this.activeOperations.entries()) {
            if (operation.status === 'completed' || operation.status === 'failed') {
                this.removeOperation(id);
            }
        }
    }

    // Get active operations count
    getActiveCount() {
        return Array.from(this.activeOperations.values()).filter(op => op.status === 'running').length;
    }
}

// Create global progress manager instance
window.progressManager = new ProgressManager();
