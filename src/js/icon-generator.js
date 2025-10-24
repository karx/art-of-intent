// ============================================
// Icon Generator for Art of Intent
// DOS-themed SVG icon with "AI" monogram
// ============================================

class IconGenerator {
    constructor() {
        this.colors = {
            background: '#000000',
            border: '#55FFFF',      // Cyan
            primary: '#FFFF55',     // Yellow
            secondary: '#55FF55',   // Green
            accent: '#FF5555'       // Red
        };
    }
    
    /**
     * Generate icon SVG
     * @param {number} size - Icon size (16, 32, 192, 512)
     * @returns {string} SVG string
     */
    generateIcon(size = 512) {
        const scale = size / 512;
        const strokeWidth = Math.max(2, 8 * scale);
        const fontSize = Math.max(12, 280 * scale);
        const borderWidth = Math.max(1, 4 * scale);
        
        return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&amp;display=swap');
            
            .icon-text {
                font-family: 'Courier Prime', 'Courier New', monospace;
                font-weight: 700;
                font-size: ${fontSize}px;
                fill: ${this.colors.primary};
                text-anchor: middle;
                dominant-baseline: central;
            }
            
            .icon-border {
                fill: none;
                stroke: ${this.colors.border};
                stroke-width: ${strokeWidth};
            }
            
            .icon-corner {
                fill: ${this.colors.border};
            }
        </style>
        
        <!-- Scanline pattern -->
        <pattern id="scanlines-icon" patternUnits="userSpaceOnUse" width="100%" height="4">
            <rect width="100%" height="2" fill="${this.colors.background}"/>
            <rect y="2" width="100%" height="2" fill="rgba(0,0,0,0.3)"/>
        </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="512" height="512" fill="${this.colors.background}"/>
    <rect width="512" height="512" fill="url(#scanlines-icon)" opacity="0.5"/>
    
    <!-- Border frame -->
    <rect x="32" y="32" width="448" height="448" class="icon-border" rx="8"/>
    
    <!-- Corner brackets (DOS style) -->
    <!-- Top-left -->
    <path d="M 48 48 L 48 96 M 48 48 L 96 48" class="icon-border"/>
    <circle cx="48" cy="48" r="6" class="icon-corner"/>
    
    <!-- Top-right -->
    <path d="M 464 48 L 464 96 M 464 48 L 416 48" class="icon-border"/>
    <circle cx="464" cy="48" r="6" class="icon-corner"/>
    
    <!-- Bottom-left -->
    <path d="M 48 464 L 48 416 M 48 464 L 96 464" class="icon-border"/>
    <circle cx="48" cy="464" r="6" class="icon-corner"/>
    
    <!-- Bottom-right -->
    <path d="M 464 464 L 464 416 M 464 464 L 416 464" class="icon-border"/>
    <circle cx="464" cy="464" r="6" class="icon-corner"/>
    
    <!-- Main "AI" text -->
    <text x="256" y="230" class="icon-text">AI</text>
    
    <!-- Small "of" text in the middle -->
    <text x="256" y="280" style="font-family: 'Courier Prime', monospace; font-size: ${fontSize * 0.25}px; fill: ${this.colors.border}; text-anchor: middle; font-weight: 400;">of</text>
    
    <!-- Accent line under text -->
    <line x1="180" y1="330" x2="332" y2="330" stroke="${this.colors.secondary}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
    
    <!-- Small prompt indicator (>) -->
    <text x="140" y="390" style="font-family: 'Courier Prime', monospace; font-size: ${fontSize * 0.4}px; fill: ${this.colors.secondary}; font-weight: 700;">&gt;</text>
</svg>
        `.trim();
    }
    
    /**
     * Generate alternative icon with haiku theme
     * @param {number} size - Icon size
     * @returns {string} SVG string
     */
    generateHaikuIcon(size = 512) {
        const scale = size / 512;
        const strokeWidth = Math.max(2, 8 * scale);
        const fontSize = Math.max(8, 120 * scale);
        
        return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&amp;display=swap');
            
            .haiku-text {
                font-family: 'Courier Prime', 'Courier New', monospace;
                font-weight: 700;
                font-size: ${fontSize}px;
                fill: ${this.colors.primary};
                text-anchor: middle;
            }
            
            .haiku-line {
                stroke: ${this.colors.border};
                stroke-width: ${strokeWidth};
                stroke-linecap: round;
            }
        </style>
        
        <!-- Scanline pattern -->
        <pattern id="scanlines-haiku" patternUnits="userSpaceOnUse" width="100%" height="4">
            <rect width="100%" height="2" fill="${this.colors.background}"/>
            <rect y="2" width="100%" height="2" fill="rgba(0,0,0,0.3)"/>
        </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="512" height="512" fill="${this.colors.background}"/>
    <rect width="512" height="512" fill="url(#scanlines-haiku)" opacity="0.5"/>
    
    <!-- Border -->
    <rect x="32" y="32" width="448" height="448" fill="none" stroke="${this.colors.border}" stroke-width="${strokeWidth}" rx="8"/>
    
    <!-- Haiku structure (5-7-5 syllables represented as lines) -->
    <!-- Line 1: 5 syllables -->
    <line x1="120" y1="180" x2="220" y2="180" class="haiku-line"/>
    
    <!-- Line 2: 7 syllables -->
    <line x1="100" y1="256" x2="412" y2="256" class="haiku-line"/>
    
    <!-- Line 3: 5 syllables -->
    <line x1="292" y1="332" x2="392" y2="332" class="haiku-line"/>
    
    <!-- "AI" text -->
    <text x="256" y="420" class="haiku-text">Art of Intent</text>
</svg>
        `.trim();
    }
    
    /**
     * Generate minimal icon (for small sizes)
     * @param {number} size - Icon size
     * @returns {string} SVG string
     */
    generateMinimalIcon(size = 32) {
        return `
<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .minimal-text {
                font-family: 'Courier New', monospace;
                font-weight: 700;
                font-size: 20px;
                fill: ${this.colors.primary};
                text-anchor: middle;
                dominant-baseline: central;
            }
        </style>
    </defs>
    
    <!-- Background -->
    <rect width="32" height="32" fill="${this.colors.background}"/>
    
    <!-- Border -->
    <rect x="2" y="2" width="28" height="28" fill="none" stroke="${this.colors.border}" stroke-width="2" rx="2"/>
    
    <!-- "AI" text -->
    <text x="16" y="16" class="minimal-text">AI</text>
</svg>
        `.trim();
    }
    
    /**
     * Convert SVG to data URL
     */
    svgToDataURL(svgString) {
        const encoded = encodeURIComponent(svgString)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
        return `data:image/svg+xml,${encoded}`;
    }
    
    /**
     * Download SVG as file
     */
    downloadSVG(svgString, filename = 'icon.svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Convert SVG to PNG using canvas
     */
    async svgToPNG(svgString, size) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };
            
            img.onerror = reject;
            img.src = this.svgToDataURL(svgString);
        });
    }
    
    /**
     * Download PNG
     */
    async downloadPNG(svgString, size, filename = 'icon.png') {
        try {
            const blob = await this.svgToPNG(svgString, size);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PNG:', error);
            throw error;
        }
    }
}

// Create global instance
const iconGenerator = new IconGenerator();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconGenerator;
    module.exports.instance = iconGenerator;
}
