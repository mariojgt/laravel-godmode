// Toast notification utility
class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = new Map();
    }

    show(message, type = 'info', duration = 5000) {
        const id = Date.now().toString();
        const toast = this.createToast(id, message, type);

        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    createToast(id, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('data-toast-id', id);

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500; margin-bottom: 0.25rem;">${this.getTitle(type)}</div>
                    <div style="font-size: 0.875rem; opacity: 0.8;">${message}</div>
                </div>
                <button onclick="toast.remove('${id}')" style="background: none; border: none; color: inherit; cursor: pointer; opacity: 0.7; font-size: 1.25rem; padding: 0;">&times;</button>
            </div>
        `;

        return toast;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }

    remove(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(id);
            }, 300);
        }
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    clear() {
        this.toasts.forEach((toast, id) => {
            this.remove(id);
        });
    }
}

// Add toast slide out animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Create global toast instance
window.toast = new Toast();
