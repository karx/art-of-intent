#!/usr/bin/env node

/**
 * Generate icons for Art of Intent
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon generator (simplified for Node.js)
class IconGenerator {
    constructor() {
        this.colors = {
            background: '#000000',
            border: '#55FFFF',
            primary: '#FFFF55',
            secondary: '#55FF55',
            accent: '#FF5555'
        };
    }
    
    generateIcon(size = 512) {
        const scale = size / 512;
        const strokeWidth = Math.max(2, 8 * scale);
        const fontSize = Math.max(12, 280 * scale);
        
        return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .icon-text {
                font-family: 'Courier New', monospace;
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
        <pattern id="scanlines-icon" patternUnits="userSpaceOnUse" width="100%" height="4">
            <rect width="100%" height="2" fill="${this.colors.background}"/>
            <rect y="2" width="100%" height="2" fill="rgba(0,0,0,0.3)"/>
        </pattern>
    </defs>
    <rect width="512" height="512" fill="${this.colors.background}"/>
    <rect width="512" height="512" fill="url(#scanlines-icon)" opacity="0.5"/>
    <rect x="32" y="32" width="448" height="448" class="icon-border" rx="8"/>
    <path d="M 48 48 L 48 96 M 48 48 L 96 48" class="icon-border"/>
    <circle cx="48" cy="48" r="6" class="icon-corner"/>
    <path d="M 464 48 L 464 96 M 464 48 L 416 48" class="icon-border"/>
    <circle cx="464" cy="48" r="6" class="icon-corner"/>
    <path d="M 48 464 L 48 416 M 48 464 L 96 464" class="icon-border"/>
    <circle cx="48" cy="464" r="6" class="icon-corner"/>
    <path d="M 464 464 L 464 416 M 464 464 L 416 464" class="icon-border"/>
    <circle cx="464" cy="464" r="6" class="icon-corner"/>
    <text x="256" y="230" class="icon-text">AI</text>
    <text x="256" y="280" style="font-family: 'Courier New', monospace; font-size: ${fontSize * 0.25}px; fill: ${this.colors.border}; text-anchor: middle; font-weight: 400;">of</text>
    <line x1="180" y1="330" x2="332" y2="330" stroke="${this.colors.secondary}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
    <text x="140" y="390" style="font-family: 'Courier New', monospace; font-size: ${fontSize * 0.4}px; fill: ${this.colors.secondary}; font-weight: 700;">&gt;</text>
</svg>`;
    }
    
    generateMinimalIcon(size = 32) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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
    <rect width="32" height="32" fill="${this.colors.background}"/>
    <rect x="2" y="2" width="28" height="28" fill="none" stroke="${this.colors.border}" stroke-width="2" rx="2"/>
    <text x="16" y="16" class="minimal-text">AI</text>
</svg>`;
    }
}

// Generate icons
const generator = new IconGenerator();

const icons = [
    { size: 16, name: 'favicon-16x16', minimal: true },
    { size: 32, name: 'favicon-32x32', minimal: true },
    { size: 180, name: 'apple-touch-icon', minimal: false },
    { size: 192, name: 'android-chrome-192x192', minimal: false },
    { size: 512, name: 'android-chrome-512x512', minimal: false }
];

console.log('🎨 Generating icons for Art of Intent...\n');

icons.forEach(({ size, name, minimal }) => {
    const svg = minimal ? generator.generateMinimalIcon(size) : generator.generateIcon(size);
    const filename = `${name}.svg`;
    
    fs.writeFileSync(filename, svg);
    console.log(`✅ Generated ${filename} (${size}x${size})`);
});

console.log('\n📦 All icons generated!');
console.log('\n📝 Next steps:');
console.log('1. Open generate-icons.html in a browser');
console.log('2. Download PNG versions of the icons');
console.log('3. Place PNG files in the root directory');
console.log('4. Icons are ready to use!');
