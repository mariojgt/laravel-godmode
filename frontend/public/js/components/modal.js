// Modal management utility
class Modal {
    constructor(selector) {
        this.modal = document.querySelector(selector);
        this.isOpen = false;
        this.init();
    }

    init() {
        if (!this.modal) return;

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close modal when clicking close button
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        if (!this.modal) return;

        this.modal.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';

        // Focus first input if available
        const firstInput = this.modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    close() {
        if (!this.modal) return;

        this.modal.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    setContent(content) {
        const body = this.modal.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }

    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
}

// Modal manager for handling multiple modals
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        // Initialize all modals on page
        document.querySelectorAll('.modal').forEach(modal => {
            const id = modal.id;
            if (id) {
                this.modals.set(id, new Modal(`#${id}`));
            }
        });
    }

    get(id) {
        return this.modals.get(id);
    }

    open(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.open();
        }
    }

    close(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.close();
        }
    }

    closeAll() {
        this.modals.forEach(modal => modal.close());
    }
}

// Create global modal manager
window.modalManager = new ModalManager();
