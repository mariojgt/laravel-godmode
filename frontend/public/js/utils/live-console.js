class LiveConsole {
    constructor() {
        this.modal = null;
        this.output = null;
        this.statusText = null;
        this.statusIndicator = null;
        this.currentOperation = null;
        this.isOpen = false;
        this.autoScroll = true;
        this.messageBuffer = [];
    }

    initialize() {
        this.modal = document.getElementById('live-console-modal');
        this.output = document.getElementById('live-console-output');
        this.statusText = document.querySelector('#live-console-status .status-text');
        this.statusIndicator = document.querySelector('#live-console-status .status-indicator');

        if (!this.modal) {
            console.error('Live console modal not found in DOM');
            return;
        }

        this.setupEventListeners();
        this.setupWebSocketListeners();
    }

    setupEventListeners() {
        if (!this.modal) return;

        // Close modal handlers
        const closeButtons = this.modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.close());
        });

        // Header close button (×) without data attribute
        const headerClose = this.modal.querySelector('.modal-close');
        if (headerClose) {
            headerClose.addEventListener('click', () => this.close());
        }

        // Clear logs button
        const clearBtn = document.getElementById('live-console-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Auto-scroll toggle
        if (this.output) {
            this.output.addEventListener('scroll', () => {
                const { scrollTop, scrollHeight, clientHeight } = this.output;
                this.autoScroll = scrollTop + clientHeight >= scrollHeight - 10;
            });
        }
    }

    setupWebSocketListeners() {
        if (!window.wsManager || typeof window.wsManager.on !== 'function') {
            console.warn('LiveConsole: wsManager not available yet');
            return;
        }

        // Real-time operation logs
        wsManager.on('operation_log', (data) => {
            if (this.currentOperation && data.operationId === this.currentOperation) {
                const level = data.logType || 'info';
                this.addLogLine(data.message, level);
            }
        });

        // Step/progress updates
        wsManager.on('operation_step', (data) => {
            if (this.currentOperation && data.operationId === this.currentOperation) {
                const stepLabel = typeof data.step !== 'undefined' ? `Step ${data.step}` : 'Step';
                const msg = data.stepMessage || data.message || '';
                const progress = typeof data.progress === 'number' ? ` (${data.progress}%)` : '';
                this.addLogLine(`${stepLabel}${progress}: ${msg}`, 'info');
            }
        });

        // Completion handler
        wsManager.on('operation_complete', (data) => {
            if (this.currentOperation && data.operationId === this.currentOperation) {
                this.handleOperationComplete(data);
            }
        });
    }

    open(operation, operationId) {
        // Ensure modal is initialized
        if (!this.modal) {
            console.error('Cannot open live console: modal not initialized');
            return;
        }

        this.currentOperation = operationId;
        this.isOpen = true;
        this.messageBuffer = [];

        // Set status
        this.updateStatus(`Running ${operation}...`, 'running');

        // Set title project/operation name if present
        const nameSpan = document.getElementById('live-console-project-name');
        if (nameSpan) {
            nameSpan.textContent = operation;
        }

        // Clear previous output
        if (this.output) {
            this.output.innerHTML = '';
        }

        // Add initial message
        this.addLogLine(`Starting ${operation} operation...`, 'info');
        this.addLogLine(`Operation ID: ${operationId}`, 'info');
        this.addLogLine('─'.repeat(50), 'info');

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.modal) return;

        this.isOpen = false;
        this.currentOperation = null;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset status
        this.updateStatus('Ready', 'ready');
    }

    updateStatus(text, state = 'running') {
        if (this.statusText) {
            this.statusText.textContent = text;
        }

        // Update indicator
        if (this.statusIndicator) {
            this.statusIndicator.className = 'status-indicator';
            if (state === 'connecting') {
                this.statusIndicator.classList.add('connecting');
            } else if (state === 'error') {
                this.statusIndicator.classList.add('error');
            } else if (state === 'running') {
                this.statusIndicator.classList.add('running');
            }
        }
    }

    addLogLine(message, level = 'info') {
        if (!this.isOpen || !this.output) return;

        const line = document.createElement('div');
        line.className = `console-line ${level}`;

        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'console-timestamp';
        timestampSpan.textContent = `[${timestamp}]`;

        line.appendChild(timestampSpan);
        line.appendChild(document.createTextNode(message));

        this.output.appendChild(line);

        // Buffer recent messages
        this.messageBuffer.push({ timestamp, message, level });
        if (this.messageBuffer.length > 1000) {
            this.messageBuffer.shift();
        }

        // Auto-scroll if enabled
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    addCommandLine(command) {
        if (!this.isOpen || !this.output) return;

        const line = document.createElement('div');
        line.className = 'console-line command';

        const timestamp = new Date().toLocaleTimeString();
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'console-timestamp';
        timestampSpan.textContent = `[${timestamp}]`;

        line.appendChild(timestampSpan);
        line.appendChild(document.createTextNode(`$ ${command}`));

        this.output.appendChild(line);

        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    handleOperationComplete(data) {
        const success = data.success !== false;
        const level = success ? 'success' : 'error';
        const statusText = success ? 'Operation completed successfully' : 'Operation failed';

        this.addLogLine('─'.repeat(50), 'info');
        this.addLogLine(statusText, level);

        if (data.message) {
            this.addLogLine(data.message, level);
        }

        // Update status
        this.updateStatus(statusText, success ? 'ready' : 'error');

        // Auto-close on success after delay
        if (success) {
            setTimeout(() => {
                if (this.isOpen) {
                    this.close();
                }
            }, 3000);
        }
    }

    scrollToBottom() {
        if (this.output) {
            this.output.scrollTop = this.output.scrollHeight;
        }
    }

    clear() {
        if (this.output) {
            this.output.innerHTML = '';
            this.messageBuffer = [];
        }
    }

    exportLogs() {
        const logs = this.messageBuffer.map(log =>
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');

        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operation-logs-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.liveConsole = new LiveConsole();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.liveConsole.initialize();
    });
} else {
    window.liveConsole.initialize();
}
