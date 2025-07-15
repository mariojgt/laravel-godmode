// Main application entry point
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupGlobalEventListeners();
        this.connectWebSocket();
        this.showInitialView();

        console.log('🚀 Application Manager initialized');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    switchView(viewName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Load view-specific data
            this.loadViewData(viewName);
        }
    }

    loadViewData(viewName) {
        switch (viewName) {
            case 'dashboard':
                if (window.dashboard) {
                    dashboard.loadProjects();
                }
                break;
            case 'templates':
                if (window.templates) {
                    templates.loadTemplates();
                }
                break;
            case 'settings':
                // Settings are loaded on init
                break;
        }
    }

    showInitialView() {
        // Show dashboard by default
        this.switchView('dashboard');
    }

    setupGlobalEventListeners() {
        // Handle loading states
        document.addEventListener('api-request-start', () => {
            this.showLoading();
        });

        document.addEventListener('api-request-end', () => {
            this.hideLoading();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to create new project
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (this.currentView === 'dashboard') {
                    dashboard.showCreateProjectModal();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                modalManager.closeAll();
            }
        });

        // Handle window focus/blur for refresh
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentView === 'dashboard') {
                // Refresh projects when tab becomes visible
                setTimeout(() => {
                    if (window.dashboard) {
                        dashboard.loadProjects();
                    }
                }, 1000);
            }
        });
    }

    connectWebSocket() {
        if (window.wsManager) {
            wsManager.connect();

            wsManager.on('connected', () => {
                console.log('✅ WebSocket connected');
                toast.info('Real-time updates connected', 3000);
            });

            wsManager.on('disconnected', () => {
                console.log('❌ WebSocket disconnected');
                toast.warning('Real-time updates disconnected', 3000);
            });

            wsManager.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        }
    }

    showLoading() {
        if (this.isLoading) return;

        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Utility method to check if backend is available
    async checkBackendHealth() {
        try {
            return await api.checkHealth();
        } catch {
            return false;
        }
    }

    // Show connection status
    async showConnectionStatus() {
        const isHealthy = await this.checkBackendHealth();

        if (isHealthy) {
            toast.success('Backend connection healthy', 3000);
            console.log('✅ Backend connection established');
        } else {
            const backendPort = window.BACKEND_PORT || '5001';
            toast.error(`Backend connection failed. Make sure the backend server is running on port ${backendPort}.`, 10000);
            console.error('❌ Backend connection failed');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // Check backend health on startup
    setTimeout(() => {
        app.showConnectionStatus();
    }, 2000);
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast.error('An unexpected error occurred');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    toast.error('An unexpected error occurred');
});

// Service worker registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added later for offline support
        console.log('Service Worker support detected');
    });
}
