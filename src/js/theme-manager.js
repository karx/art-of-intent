/**
 * Theme Manager
 * Handles theme and text size switching with persistence
 */

class ThemeManager {
    constructor() {
        this.themes = {
            solarized: {
                name: 'Solarized',
                description: 'Classic terminal aesthetic',
                icon: '🌙'
            },
            polarized: {
                name: 'Polarized',
                description: 'High contrast light theme',
                icon: '☀️'
            },
            light: {
                name: 'Light',
                description: 'Clean and minimal',
                icon: '⚪'
            },
            dark: {
                name: 'Dark',
                description: 'Modern dark mode',
                icon: '⚫'
            },
            cartoon: {
                name: 'Cartoon',
                description: 'Playful and colorful',
                icon: '🎨'
            }
        };
        
        this.textSizes = {
            small: {
                name: 'Small',
                description: 'Compact, more content',
                multiplier: 0.9
            },
            medium: {
                name: 'Medium',
                description: 'Default size',
                multiplier: 1.0
            },
            large: {
                name: 'Large',
                description: 'Comfortable reading',
                multiplier: 1.1
            },
            xlarge: {
                name: 'Extra Large',
                description: 'Accessibility',
                multiplier: 1.25
            },
            huge: {
                name: 'Huge',
                description: 'Maximum readability',
                multiplier: 1.5
            }
        };
        
        this.voiceStyles = {
            contemplative: {
                name: 'Contemplative',
                description: 'Slow and calm',
                rate: 0.7,
                pitch: 0.9
            },
            natural: {
                name: 'Natural',
                description: 'Balanced reading',
                rate: 0.85,
                pitch: 1.0
            },
            expressive: {
                name: 'Expressive',
                description: 'Slightly animated',
                rate: 0.95,
                pitch: 1.1
            }
        };
        
        this.storageKey = 'artOfIntent_preferences';
        this.currentTheme = 'solarized';
        this.currentTextSize = 'medium';
        this.currentVoiceStyle = 'contemplative';
        this.currentVoice = null;
        this.availableVoices = [];
        
        this.init();
    }
    
    init() {
        // Load saved preferences
        this.loadPreferences();
        
        // Apply saved theme and text size
        this.applyTheme(this.currentTheme, false);
        this.applyTextSize(this.currentTextSize, false);
        
        // Load available voices
        this.loadVoices();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Check for system dark mode preference
        this.checkSystemPreference();
        
        console.log('🎨 Theme Manager initialized:', {
            theme: this.currentTheme,
            textSize: this.currentTextSize,
            voiceStyle: this.currentVoiceStyle
        });
    }
    
    loadVoices() {
        if ('speechSynthesis' in window) {
            const loadVoiceList = () => {
                this.availableVoices = window.speechSynthesis.getVoices();
                console.log('🔊 Loaded voices:', this.availableVoices.length);
                
                // Set default voice if not set
                if (!this.currentVoice && this.availableVoices.length > 0) {
                    // Prefer English voices
                    const englishVoice = this.availableVoices.find(v => v.lang.startsWith('en'));
                    this.currentVoice = englishVoice || this.availableVoices[0];
                }
            };
            
            loadVoiceList();
            // Voices may load asynchronously
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoiceList;
            }
        }
    }
    
    loadPreferences() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const prefs = JSON.parse(saved);
                this.currentTheme = prefs.theme || 'solarized';
                this.currentTextSize = prefs.textSize || 'medium';
                this.currentVoiceStyle = prefs.voiceStyle || 'contemplative';
                this.currentVoice = prefs.voiceName || null;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            const prefs = {
                theme: this.currentTheme,
                textSize: this.currentTextSize,
                voiceStyle: this.currentVoiceStyle,
                voiceName: this.currentVoice ? this.currentVoice.name : null,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(prefs));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    applyVoiceStyle(styleName, save = true) {
        if (!this.voiceStyles[styleName]) {
            console.warn('Unknown voice style:', styleName);
            return;
        }
        
        this.currentVoiceStyle = styleName;
        
        if (save) {
            this.savePreferences();
            this.showNotification(`Voice style: ${this.voiceStyles[styleName].name}`);
        }
    }
    
    setVoice(voiceName, save = true) {
        const voice = this.availableVoices.find(v => v.name === voiceName);
        if (voice) {
            this.currentVoice = voice;
            
            if (save) {
                this.savePreferences();
                this.showNotification(`Voice: ${voice.name}`);
            }
        }
    }
    
    getVoiceSettings() {
        const style = this.voiceStyles[this.currentVoiceStyle];
        return {
            voice: this.currentVoice,
            rate: style.rate,
            pitch: style.pitch,
            volume: 1.0
        };
    }
    
    applyTheme(themeName, save = true) {
        if (!this.themes[themeName]) {
            console.warn('Unknown theme:', themeName);
            return;
        }
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        
        // Save preference
        if (save) {
            this.savePreferences();
        }
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        }));
        
        console.log('🎨 Theme applied:', themeName);
    }
    
    applyTextSize(sizeName, save = true) {
        if (!this.textSizes[sizeName]) {
            console.warn('Unknown text size:', sizeName);
            return;
        }
        
        // Apply text size to document
        document.documentElement.setAttribute('data-text-size', sizeName);
        this.currentTextSize = sizeName;
        
        // Save preference
        if (save) {
            this.savePreferences();
        }
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('textSizeChanged', {
            detail: { textSize: sizeName }
        }));
        
        console.log('📏 Text size applied:', sizeName);
    }
    
    getNextTextSize(direction = 'up') {
        const sizes = Object.keys(this.textSizes);
        const currentIndex = sizes.indexOf(this.currentTextSize);
        
        if (direction === 'up') {
            const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
            return sizes[nextIndex];
        } else {
            const nextIndex = Math.max(currentIndex - 1, 0);
            return sizes[nextIndex];
        }
    }
    
    increaseTextSize() {
        const nextSize = this.getNextTextSize('up');
        if (nextSize !== this.currentTextSize) {
            this.applyTextSize(nextSize);
            this.showNotification(`Text size: ${this.textSizes[nextSize].name}`);
        }
    }
    
    decreaseTextSize() {
        const nextSize = this.getNextTextSize('down');
        if (nextSize !== this.currentTextSize) {
            this.applyTextSize(nextSize);
            this.showNotification(`Text size: ${this.textSizes[nextSize].name}`);
        }
    }
    
    resetTextSize() {
        this.applyTextSize('medium');
        this.showNotification('Text size reset to default');
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+T: Open theme picker (handled by UI component)
            // Ctrl++ or Ctrl+=: Increase text size
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                this.increaseTextSize();
            }
            
            // Ctrl+-: Decrease text size
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.decreaseTextSize();
            }
            
            // Ctrl+0: Reset text size
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                this.resetTextSize();
            }
        });
    }
    
    checkSystemPreference() {
        // Check if user prefers dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Only auto-switch if user hasn't set a preference
            const saved = localStorage.getItem(this.storageKey);
            if (!saved && this.currentTheme === 'solarized') {
                console.log('System prefers dark mode, keeping Solarized (already dark)');
            }
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            console.log('System color scheme changed:', e.matches ? 'dark' : 'light');
            // Could auto-switch here if user enables that feature
        });
    }
    
    showNotification(message) {
        // Simple notification (can be enhanced with a proper notification system)
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            z-index: 10000;
            font-size: 0.9rem;
            box-shadow: 0 4px 6px var(--shadow-color);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getCurrentTextSize() {
        return this.currentTextSize;
    }
    
    getThemeInfo(themeName) {
        return this.themes[themeName];
    }
    
    getTextSizeInfo(sizeName) {
        return this.textSizes[sizeName];
    }
    
    getAllThemes() {
        return this.themes;
    }
    
    getAllTextSizes() {
        return this.textSizes;
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @media (prefers-reduced-motion: reduce) {
        .theme-notification {
            animation: none !important;
        }
    }
`;
document.head.appendChild(style);

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
window.themeManager = themeManager;

export default themeManager;
