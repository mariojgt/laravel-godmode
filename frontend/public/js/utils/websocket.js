// WebSocket utility for real-time communication
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();

        // Dynamically determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        const backendPort = window.BACKEND_PORT || '5001';
        this.wsUrl = `${protocol}//${hostname}:${backendPort}`;

        console.log('WebSocket URL:', this.wsUrl);
    }

    connect() {
        try {
            console.log('Connecting to WebSocket:', this.wsUrl);
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.emit('message', data);

                    // Handle progress operation messages
                    if (data.type && data.type.startsWith('operation_')) {
                        this.handleProgressMessage(data);
                    }

                    // Emit specific event types
                    if (data.type) {
                        this.emit(data.type, data);
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.emit('disconnected', event);

                if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.reconnect();
        }
    }

    reconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, message queued');
            // Could implement message queue here
        }
    }

    subscribe(projectId) {
        this.send({
            type: 'subscribe_logs',
            projectId
        });
    }

    sendTerminalInput(sessionId, input) {
        this.send({
            type: 'terminal_input',
            sessionId,
            input
        });
    }

    handleProgressMessage(data) {
        // Forward progress messages to progress manager
        if (window.progressManager) {
            window.progressManager.handleWebSocketMessage(data);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('WebSocket event handler error:', error);
                }
            });
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Create global WebSocket manager instance
window.wsManager = new WebSocketManager();
