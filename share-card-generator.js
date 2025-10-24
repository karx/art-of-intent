// ============================================
// Share Card Generator
// SVG-based shareable image with DOS aesthetic
// ============================================

class ShareCardGenerator {
    constructor() {
        this.width = 1200;
        this.height = 630; // Standard OG image size
        this.padding = 40;
        this.colors = {
            background: '#000000',
            border: '#AAAAAA',
            cyan: '#55FFFF',
            green: '#55FF55',
            red: '#FF5555',
            yellow: '#FFFF55',
            white: '#FFFFFF',
            gray: '#555555'
        };
    }
    
    /**
     * Generate SVG share card
     * @param {object} data - Game data
     * @returns {string} SVG string
     */
    generateSVG(data) {
        const {
            result = 'WIN',
            attempts = 0,
            tokens = 0,
            matches = '0/3',
            efficiency = '0.0',
            date = new Date().toLocaleDateString(),
            userName = 'Guest',
            userPhoto = null
        } = data;
        
        const resultColor = result === 'WIN' ? this.colors.green : this.colors.red;
        const efficiencyBar = this.generateProgressBar(parseFloat(efficiency), 100, 200);
        
        return `
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400,700&amp;display=swap');
            
            text {
                font-family: 'Courier Prime', 'Courier New', monospace;
                fill: ${this.colors.white};
            }
            
            .title {
                font-size: 48px;
                font-weight: bold;
                fill: ${this.colors.cyan};
                letter-spacing: 4px;
            }
            
            .subtitle {
                font-size: 20px;
                fill: ${this.colors.gray};
                letter-spacing: 2px;
            }
            
            .result {
                font-size: 64px;
                font-weight: bold;
                fill: ${resultColor};
                letter-spacing: 8px;
            }
            
            .stat-label {
                font-size: 18px;
                fill: ${this.colors.gray};
                text-transform: uppercase;
            }
            
            .stat-value {
                font-size: 32px;
                font-weight: bold;
                fill: ${this.colors.cyan};
            }
            
            .username {
                font-size: 24px;
                fill: ${this.colors.cyan};
            }
            
            .date {
                font-size: 16px;
                fill: ${this.colors.gray};
            }
            
            .url {
                font-size: 18px;
                fill: ${this.colors.yellow};
            }
        </style>
        
        <!-- Scanline pattern -->
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="100%" height="4">
            <rect width="100%" height="2" fill="${this.colors.background}"/>
            <rect y="2" width="100%" height="2" fill="rgba(0,0,0,0.3)"/>
        </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="${this.width}" height="${this.height}" fill="${this.colors.background}"/>
    <rect width="${this.width}" height="${this.height}" fill="url(#scanlines)" opacity="0.5"/>
    
    <!-- Border -->
    <rect x="20" y="20" width="${this.width - 40}" height="${this.height - 40}" 
          fill="none" stroke="${this.colors.border}" stroke-width="4"/>
    <rect x="30" y="30" width="${this.width - 60}" height="${this.height - 60}" 
          fill="none" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Title -->
    <text x="${this.width / 2}" y="100" text-anchor="middle" class="title">
        ART OF INTENT
    </text>
    <text x="${this.width / 2}" y="130" text-anchor="middle" class="subtitle">
        HAIKU CHALLENGE
    </text>
    
    <!-- Result -->
    <text x="${this.width / 2}" y="220" text-anchor="middle" class="result">
        ${result}
    </text>
    
    <!-- Stats Grid -->
    <g transform="translate(${this.width / 2 - 300}, 280)">
        <!-- Attempts -->
        <text x="0" y="0" class="stat-label">ATTEMPTS</text>
        <text x="0" y="40" class="stat-value">${attempts}/10</text>
        
        <!-- Tokens -->
        <text x="200" y="0" class="stat-label">TOKENS</text>
        <text x="200" y="40" class="stat-value">${tokens}</text>
        
        <!-- Matches -->
        <text x="400" y="0" class="stat-label">MATCHES</text>
        <text x="400" y="40" class="stat-value">${matches}</text>
    </g>
    
    <!-- Efficiency Bar -->
    <g transform="translate(${this.width / 2 - 300}, 360)">
        <text x="0" y="0" class="stat-label">EFFICIENCY: ${efficiency} TOK/ATT</text>
        <rect x="0" y="10" width="600" height="20" fill="${this.colors.gray}" opacity="0.3"/>
        ${efficiencyBar}
    </g>
    
    <!-- User Info -->
    ${userPhoto ? `
        <image x="60" y="${this.height - 100}" width="60" height="60" 
               href="${userPhoto}" clip-path="circle(30px at 30px 30px)"/>
    ` : ''}
    <text x="${userPhoto ? '140' : '60'}" y="${this.height - 60}" class="username">
        ${userName}
    </text>
    <text x="${userPhoto ? '140' : '60'}" y="${this.height - 35}" class="date">
        ${date}
    </text>
    
    <!-- URL -->
    <text x="${this.width - 60}" y="${this.height - 50}" text-anchor="end" class="url">
        art-of-intent.netlify.app
    </text>
    
    <!-- Decorative corners -->
    <text x="40" y="50" fill="${this.colors.cyan}" font-size="20">╔</text>
    <text x="${this.width - 60}" y="50" fill="${this.colors.cyan}" font-size="20">╗</text>
    <text x="40" y="${this.height - 30}" fill="${this.colors.cyan}" font-size="20">╚</text>
    <text x="${this.width - 60}" y="${this.height - 30}" fill="${this.colors.cyan}" font-size="20">╝</text>
</svg>
        `.trim();
    }
    
    /**
     * Generate progress bar for SVG
     */
    generateProgressBar(value, max, width) {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        const fillWidth = (percentage / 100) * width;
        
        return `
            <rect x="0" y="10" width="${fillWidth}" height="20" fill="${this.colors.cyan}"/>
        `;
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
     * Convert SVG to PNG using canvas
     */
    async svgToPNG(svgString) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.width;
            canvas.height = this.height;
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };
            
            img.onerror = reject;
            img.src = this.svgToDataURL(svgString);
        });
    }
    
    /**
     * Download image
     */
    async downloadImage(svgString, filename = 'art-of-intent-score.png') {
        try {
            const blob = await this.svgToPNG(svgString);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
            throw error;
        }
    }
    
    /**
     * Share image using Web Share API
     */
    async shareImage(svgString, title = 'Art of Intent Score') {
        try {
            const blob = await this.svgToPNG(svgString);
            const file = new File([blob], 'art-of-intent-score.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    text: 'Check out my Art of Intent score!',
                    files: [file]
                });
            } else {
                // Fallback: download image
                await this.downloadImage(svgString);
                alert('Image downloaded! You can now share it manually.');
            }
        } catch (error) {
            console.error('Error sharing image:', error);
            throw error;
        }
    }
    
    /**
     * Preview image in modal
     */
    previewImage(svgString) {
        const dataURL = this.svgToDataURL(svgString);
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            border: 2px solid #55FFFF;
        `;
        
        modal.appendChild(img);
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.body.appendChild(modal);
    }
}

// Create global instance
const shareCardGenerator = new ShareCardGenerator();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = shareCardGenerator;
}
