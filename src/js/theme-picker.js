/**
 * Theme Picker UI Component
 * Modal for selecting theme and text size
 */

class ThemePicker {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.modal = null;
        this.previewTheme = null;
        this.previewTextSize = null;
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.setupEventListeners();
        
        // Keyboard shortcut: Ctrl+T
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.open();
            }
        });
        
        console.log('🎨 Theme Picker initialized');
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'themePickerModal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content theme-picker-content">
                <div class="modal-header">
                    <h2>Appearance Settings</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- Theme Selection -->
                    <div class="settings-section">
                        <h3>Theme</h3>
                        <div class="theme-options" id="themeOptions">
                            ${this.renderThemeOptions()}
                        </div>
                    </div>
                    
                    <!-- Text Size Selection -->
                    <div class="settings-section">
                        <h3>Text Size</h3>
                        <div class="text-size-options" id="textSizeOptions">
                            ${this.renderTextSizeOptions()}
                        </div>
                        
                        <div class="preview-text">
                            <p>Preview: The quick brown fox jumps over the lazy dog.</p>
                            <p class="text-small">Small text sample for comparison.</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" id="resetDefaults">Reset to Defaults</button>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="cancelTheme">Cancel</button>
                        <button class="btn-primary" id="applyTheme">Apply</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    renderThemeOptions() {
        const themes = this.themeManager.getAllThemes();
        const currentTheme = this.themeManager.getCurrentTheme();
        
        return Object.entries(themes).map(([key, theme]) => `
            <label class="theme-option ${key === currentTheme ? 'selected' : ''}">
                <input type="radio" name="theme" value="${key}" ${key === currentTheme ? 'checked' : ''}>
                <div class="theme-card">
                    <div class="theme-icon">${theme.icon}</div>
                    <div class="theme-info">
                        <div class="theme-name">${theme.name}</div>
                        <div class="theme-description">${theme.description}</div>
                    </div>
                </div>
            </label>
        `).join('');
    }
    
    renderTextSizeOptions() {
        const sizes = this.themeManager.getAllTextSizes();
        const currentSize = this.themeManager.getCurrentTextSize();
        
        return Object.entries(sizes).map(([key, size]) => `
            <label class="text-size-option ${key === currentSize ? 'selected' : ''}">
                <input type="radio" name="textSize" value="${key}" ${key === currentSize ? 'checked' : ''}>
                <div class="size-card">
                    <div class="size-name">${size.name}</div>
                    <div class="size-description">${size.description}</div>
                    <div class="size-preview" style="font-size: ${size.multiplier}em;">Aa</div>
                </div>
            </label>
        `).join('');
    }
    
    setupEventListeners() {
        // Close button
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        
        // Cancel button
        this.modal.querySelector('#cancelTheme').addEventListener('click', () => this.close());
        
        // Apply button
        this.modal.querySelector('#applyTheme').addEventListener('click', () => this.apply());
        
        // Reset button
        this.modal.querySelector('#resetDefaults').addEventListener('click', () => this.resetDefaults());
        
        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
        
        // Theme option change - live preview
        this.modal.addEventListener('change', (e) => {
            if (e.target.name === 'theme') {
                this.previewTheme = e.target.value;
                this.updatePreview();
                this.updateSelection('theme', e.target.value);
            } else if (e.target.name === 'textSize') {
                this.previewTextSize = e.target.value;
                this.updatePreview();
                this.updateSelection('textSize', e.target.value);
            }
        });
    }
    
    updateSelection(type, value) {
        const container = type === 'theme' ? '#themeOptions' : '#textSizeOptions';
        const options = this.modal.querySelectorAll(`${container} label`);
        
        options.forEach(option => {
            const input = option.querySelector('input');
            if (input.value === value) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    updatePreview() {
        // Apply preview theme and text size temporarily
        if (this.previewTheme) {
            document.documentElement.setAttribute('data-theme', this.previewTheme);
        }
        if (this.previewTextSize) {
            document.documentElement.setAttribute('data-text-size', this.previewTextSize);
        }
    }
    
    open() {
        // Store current settings for cancel
        this.originalTheme = this.themeManager.getCurrentTheme();
        this.originalTextSize = this.themeManager.getCurrentTextSize();
        this.previewTheme = this.originalTheme;
        this.previewTextSize = this.originalTextSize;
        
        // Show modal
        this.modal.classList.remove('hidden');
        
        // Focus first option
        const firstInput = this.modal.querySelector('input[type="radio"]');
        if (firstInput) firstInput.focus();
    }
    
    close() {
        // Revert to original settings if not applied
        if (this.previewTheme !== this.themeManager.getCurrentTheme()) {
            this.themeManager.applyTheme(this.originalTheme, false);
        }
        if (this.previewTextSize !== this.themeManager.getCurrentTextSize()) {
            this.themeManager.applyTextSize(this.originalTextSize, false);
        }
        
        // Hide modal
        this.modal.classList.add('hidden');
    }
    
    apply() {
        // Apply selected theme and text size
        if (this.previewTheme) {
            this.themeManager.applyTheme(this.previewTheme);
        }
        if (this.previewTextSize) {
            this.themeManager.applyTextSize(this.previewTextSize);
        }
        
        // Close modal
        this.modal.classList.add('hidden');
        
        // Show success notification
        this.themeManager.showNotification('Appearance settings saved');
    }
    
    resetDefaults() {
        this.previewTheme = 'solarized';
        this.previewTextSize = 'medium';
        
        // Update UI
        this.modal.querySelector('input[name="theme"][value="solarized"]').checked = true;
        this.modal.querySelector('input[name="textSize"][value="medium"]').checked = true;
        
        this.updateSelection('theme', 'solarized');
        this.updateSelection('textSize', 'medium');
        this.updatePreview();
    }
}

// Initialize theme picker when theme manager is ready
if (window.themeManager) {
    window.themePicker = new ThemePicker(window.themeManager);
} else {
    window.addEventListener('load', () => {
        if (window.themeManager) {
            window.themePicker = new ThemePicker(window.themeManager);
        }
    });
}

// Setup theme button click handler
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn && window.themePicker) {
        themeBtn.addEventListener('click', () => {
            window.themePicker.open();
        });
    }
});

export default ThemePicker;
