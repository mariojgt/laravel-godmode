// Settings view handler
class Settings {
    constructor() {
        this.settings = {
            autoStart: false,
            refreshInterval: 30000,
            theme: 'dark'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('app-manager-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage');
        }

        this.updateUI();
    }

    saveSettings() {
        try {
            localStorage.setItem('app-manager-settings', JSON.stringify(this.settings));
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    }

    updateUI() {
        const autoStartCheckbox = document.getElementById('auto-start');
        if (autoStartCheckbox) {
            autoStartCheckbox.checked = this.settings.autoStart;
        }
    }

    setupEventListeners() {
        const autoStartCheckbox = document.getElementById('auto-start');
        if (autoStartCheckbox) {
            autoStartCheckbox.addEventListener('change', (e) => {
                this.settings.autoStart = e.target.checked;
                this.saveSettings();
            });
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
}

// Create global settings instance
window.settings = new Settings();
