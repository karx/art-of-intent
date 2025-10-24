/**
 * Centralized version management for Art of Intent
 * Single source of truth for version across the project
 */

const APP_VERSION = {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha',
    
    // Formatted version string
    get full() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    
    // Version with 'v' prefix
    get display() {
        return this.prerelease 
            ? `v${this.full}-${this.prerelease}`
            : `v${this.full}`;
    },
    
    // Semantic version for comparisons
    get semantic() {
        return this.major * 10000 + this.minor * 100 + this.patch;
    }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
}

// Global variable for browser
if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
}
