// Templates view handler
class Templates {
    constructor() {
        this.templates = [];
        this.init();
    }

    init() {
        // Load templates when initialized
        this.loadTemplates();
    }

    async loadTemplates() {
        try {
            this.templates = await api.getTemplates();
            this.renderTemplates();
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        }
    }

    renderTemplates() {
        const container = document.getElementById('templates-grid');
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(203, 213, 225, 0.7);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <h3 style="margin-bottom: 0.5rem;">No templates available</h3>
                    <p>Add templates to the templates/ directory</p>
                </div>
            `;
            return;
        }

        const templateCards = this.templates.map(template => {
            const card = new TemplateCard(template);
            return card.render();
        }).join('');

        container.innerHTML = templateCards;
    }

    // Get template by ID
    getTemplate(id) {
        return this.templates.find(t => t.id === id);
    }

    // Get templates by category
    getTemplatesByCategory(category) {
        return this.templates.filter(t => t.category === category);
    }

    // Search templates
    searchTemplates(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.templates.filter(template =>
            template.name.toLowerCase().includes(lowercaseQuery) ||
            template.description.toLowerCase().includes(lowercaseQuery) ||
            template.category.toLowerCase().includes(lowercaseQuery)
        );
    }
}

// Create global templates instance
window.templates = new Templates();
