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
            background: '#002b36',  // Solarized dark
            backgroundAlt: '#073642',
            border: '#586e75',      // Solarized base01
            cyan: '#2aa198',        // Solarized cyan
            green: '#859900',       // Solarized green
            red: '#dc322f',         // Solarized red
            yellow: '#b58900',      // Solarized yellow
            white: '#93a1a1',       // Solarized base1
            gray: '#586e75'         // Solarized base01
        };
    }
    
    /**
     * Generate SVG share card
     * @param {object} data - Game data
     * @param {string} version - Card version ('v1', 'v2', or 'v3')
     * @returns {string} SVG string
     */
    generateSVG(data, version = 'v3') {
        if (version === 'v3') {
            return generateShareCardV3(data);
        }
        if (version === 'v2') {
            return this.generateSVGv2(data);
        }
        return this.generateSVGv1(data);
    }
    
    /**
     * Generate SVG share card v1 (original)
     * @param {object} data - Game data
     * @returns {string} SVG string
     */
    generateSVGv1(data) {
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
        
        // Generate ASCII-style progress bars
        const attemptsBar = this.generateASCIIBar(attempts, 10, 10);
        const [matchNum, matchTotal] = matches.split('/').map(Number);
        const matchesBar = this.generateASCIIBar(matchNum, matchTotal, 30);
        const tokensBar = this.generateASCIIBar(Math.min(tokens, 500), 500, 30);
        
        return `
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400,700&amp;display=swap');
            
            text {
                font-family: 'Courier Prime', 'Courier New', monospace;
                fill: ${this.colors.white};
            }
            
            .header {
                font-size: 18px;
                fill: ${this.colors.cyan};
                letter-spacing: 1px;
            }
            
            .title-box {
                font-size: 22px;
                font-weight: bold;
                fill: ${this.colors.cyan};
                letter-spacing: 2px;
            }
            
            .result {
                font-size: 72px;
                font-weight: bold;
                fill: ${resultColor};
                letter-spacing: 12px;
            }
            
            .result-marker {
                font-size: 48px;
                fill: ${resultColor};
            }
            
            .stat-line {
                font-size: 20px;
                fill: ${this.colors.white};
                letter-spacing: 1px;
            }
            
            .stat-label {
                fill: ${this.colors.cyan};
            }
            
            .stat-value {
                fill: ${this.colors.white};
            }
            
            .username {
                font-size: 24px;
                fill: ${this.colors.cyan};
                letter-spacing: 1px;
            }
            
            .url {
                font-size: 20px;
                fill: ${this.colors.yellow};
            }
            
            .border-char {
                font-size: 24px;
                fill: ${this.colors.border};
            }
            
            .ascii-bar {
                font-size: 20px;
                fill: ${this.colors.cyan};
                letter-spacing: 0px;
            }
        </style>
        
        <!-- Scanline pattern -->
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="100%" height="3">
            <rect width="100%" height="1" fill="${this.colors.background}"/>
            <rect y="1" width="100%" height="2" fill="rgba(0,0,0,0.4)"/>
        </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="${this.width}" height="${this.height}" fill="${this.colors.background}"/>
    <rect width="${this.width}" height="${this.height}" fill="url(#scanlines)" opacity="0.6"/>
    
    <!-- Main Border (Double Line) -->
    <text x="30" y="50" class="border-char">╔</text>
    <text x="${this.width - 50}" y="50" class="border-char">╗</text>
    <text x="30" y="${this.height - 25}" class="border-char">╚</text>
    <text x="${this.width - 50}" y="${this.height - 25}" class="border-char">╝</text>
    
    <!-- Top border line -->
    <line x1="50" y1="35" x2="${this.width - 50}" y2="35" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="38" x2="${this.width - 50}" y2="38" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Bottom border line -->
    <line x1="50" y1="${this.height - 35}" x2="${this.width - 50}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="${this.height - 32}" x2="${this.width - 50}" y2="${this.height - 32}" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Left border line -->
    <line x1="35" y1="50" x2="35" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="38" y1="50" x2="38" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Right border line -->
    <line x1="${this.width - 35}" y1="50" x2="${this.width - 35}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="${this.width - 38}" y1="50" x2="${this.width - 38}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Header -->
    <text x="60" y="75" class="header">ART OF INTENT ${typeof window !== 'undefined' && window.APP_VERSION ? window.APP_VERSION.display : 'v1.0.0'}</text>
    <text x="${this.width - 60}" y="75" text-anchor="end" class="header">${date}</text>
    
    <!-- Separator after header -->
    <text x="30" y="95" class="border-char">╠</text>
    <text x="${this.width - 50}" y="95" class="border-char">╣</text>
    <line x1="50" y1="80" x2="${this.width - 50}" y2="80" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="83" x2="${this.width - 50}" y2="83" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Title Box -->
    <text x="${this.width / 2 - 180}" y="155" class="border-char">╔</text>
    <text x="${this.width / 2 + 180}" y="155" class="border-char">╗</text>
    <line x1="${this.width / 2 - 160}" y1="140" x2="${this.width / 2 + 160}" y2="140" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="${this.width / 2 - 160}" y1="143" x2="${this.width / 2 + 160}" y2="143" stroke="${this.colors.border}" stroke-width="1"/>
    
    <text x="${this.width / 2}" y="175" text-anchor="middle" class="title-box">
        HAIKU CHALLENGE RESULT
    </text>
    
    <text x="${this.width / 2 - 180}" y="200" class="border-char">╚</text>
    <text x="${this.width / 2 + 180}" y="200" class="border-char">╝</text>
    <line x1="${this.width / 2 - 160}" y1="185" x2="${this.width / 2 + 160}" y2="185" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="${this.width / 2 - 160}" y1="188" x2="${this.width / 2 + 160}" y2="188" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Result with markers -->
    <text x="${this.width / 2 - 150}" y="280" text-anchor="middle" class="result-marker">&gt;&gt;&gt;</text>
    <text x="${this.width / 2}" y="280" text-anchor="middle" class="result">${result}</text>
    <text x="${this.width / 2 + 150}" y="280" text-anchor="middle" class="result-marker">&lt;&lt;&lt;</text>
    
    <!-- Stats Box -->
    <text x="80" y="355" class="border-char">┌</text>
    <text x="${this.width - 100}" y="355" class="border-char">┐</text>
    <line x1="100" y1="340" x2="${this.width - 100}" y2="340" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Stats Content -->
    <text x="120" y="385" class="stat-line">
        <tspan class="stat-label">ATTEMPTS:</tspan> <tspan class="stat-value">${String(attempts).padStart(2, '0')}/10</tspan>
    </text>
    <text x="420" y="385" class="ascii-bar">${attemptsBar}</text>
    
    <text x="120" y="420" class="stat-line">
        <tspan class="stat-label">TOKENS:</tspan>   <tspan class="stat-value">${String(tokens).padStart(3, ' ')}</tspan>
    </text>
    <text x="420" y="420" class="ascii-bar">${tokensBar}</text>
    
    <text x="120" y="455" class="stat-line">
        <tspan class="stat-label">MATCHES:</tspan>  <tspan class="stat-value">${matches}</tspan>
    </text>
    <text x="420" y="455" class="ascii-bar">${matchesBar}</text>
    
    <text x="120" y="490" class="stat-line">
        <tspan class="stat-label">EFFICIENCY:</tspan> <tspan class="stat-value">${efficiency} tok/att</tspan>
    </text>
    
    <text x="80" y="525" class="border-char">└</text>
    <text x="${this.width - 100}" y="525" class="border-char">┘</text>
    <line x1="100" y1="510" x2="${this.width - 100}" y2="510" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Footer -->
    <text x="60" y="565" class="username">${userName}</text>
    <text x="60" y="595" class="url">art-of-intent.netlify.app</text>
    
</svg>
        `.trim();
    }
    
    /**
     * Generate SVG share card v2 (enhanced)
     * @param {object} data - Game data
     * @returns {string} SVG string
     */
    generateSVGv2(data) {
        const {
            result = 'WIN',
            attempts = 0,
            tokens = 0,
            matches = '0/3',
            efficiency = '0.0',
            date = new Date().toLocaleDateString(),
            userName = 'Guest',
            userPhoto = null,
            globalMaxTokens = 1000 // Global max for comparison
        } = data;
        
        const isWin = result === 'WIN';
        const resultColor = isWin ? this.colors.green : this.colors.red;
        const [matchNum, matchTotal] = matches.split('/').map(Number);
        
        // Calculate percentages for visual bars
        const matchPercent = matchTotal > 0 ? (matchNum / matchTotal) * 100 : 0;
        const tokenPercent = globalMaxTokens > 0 ? Math.min((tokens / globalMaxTokens) * 100, 100) : 0;
        const attemptPercent = Math.min((attempts / 10) * 100, 100);
        
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
            
            .result-badge {
                font-size: 80px;
                font-weight: bold;
                fill: ${resultColor};
                letter-spacing: 8px;
            }
            
            .result-icon {
                font-size: 64px;
                fill: ${resultColor};
            }
            
            .kpi-label {
                font-size: 16px;
                fill: ${this.colors.gray};
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .kpi-value {
                font-size: 48px;
                font-weight: bold;
                fill: ${this.colors.cyan};
            }
            
            .kpi-unit {
                font-size: 20px;
                fill: ${this.colors.gray};
            }
            
            .bar-bg {
                fill: ${this.colors.backgroundAlt};
            }
            
            .bar-fill {
                fill: ${this.colors.cyan};
            }
            
            .bar-fill-success {
                fill: ${this.colors.green};
            }
            
            .bar-fill-warning {
                fill: ${this.colors.yellow};
            }
            
            .footer-text {
                font-size: 18px;
                fill: ${this.colors.gray};
            }
            
            .username {
                font-size: 20px;
                font-weight: bold;
                fill: ${this.colors.cyan};
            }
        </style>
    </defs>
    
    <!-- Background -->
    <rect width="${this.width}" height="${this.height}" fill="${this.colors.background}"/>
    
    <!-- Border -->
    <rect x="20" y="20" width="${this.width - 40}" height="${this.height - 40}" 
          fill="none" stroke="${this.colors.border}" stroke-width="3"/>
    
    <!-- Header -->
    <text x="60" y="90" class="title">ART OF INTENT</text>
    <text x="60" y="120" class="subtitle">DAILY HAIKU CHALLENGE</text>
    
    <!-- Result Badge (Center-Left) -->
    <g transform="translate(80, 200)">
        <rect x="0" y="0" width="280" height="160" 
              fill="${this.colors.backgroundAlt}" 
              stroke="${resultColor}" stroke-width="3"/>
        <text x="140" y="70" class="result-icon" text-anchor="middle">${isWin ? '✓' : '✗'}</text>
        <text x="140" y="135" class="result-badge" text-anchor="middle">${result}</text>
    </g>
    
    <!-- KPI Grid (Center-Right) -->
    <!-- Attempts -->
    <g transform="translate(420, 200)">
        <text x="0" y="20" class="kpi-label">ATTEMPTS</text>
        <text x="0" y="75" class="kpi-value">${attempts}<tspan class="kpi-unit">/10</tspan></text>
        <rect x="0" y="90" width="300" height="12" class="bar-bg" rx="6"/>
        <rect x="0" y="90" width="${attemptPercent * 3}" height="12" class="bar-fill" rx="6"/>
    </g>
    
    <!-- Matches -->
    <g transform="translate(420, 310)">
        <text x="0" y="20" class="kpi-label">MATCHES</text>
        <text x="0" y="75" class="kpi-value">${matchNum}<tspan class="kpi-unit">/${matchTotal}</tspan></text>
        <rect x="0" y="90" width="300" height="12" class="bar-bg" rx="6"/>
        <rect x="0" y="90" width="${matchPercent * 3}" height="12" class="bar-fill-success" rx="6"/>
    </g>
    
    <!-- Tokens (Bottom Full Width) -->
    <g transform="translate(80, 430)">
        <text x="0" y="20" class="kpi-label">TOKENS USED</text>
        <text x="0" y="75" class="kpi-value">${tokens}<tspan class="kpi-unit"> / ${globalMaxTokens} max</tspan></text>
        <rect x="0" y="90" width="1040" height="16" class="bar-bg" rx="8"/>
        <rect x="0" y="90" width="${tokenPercent * 10.4}" height="16" class="bar-fill-warning" rx="8"/>
    </g>
    
    <!-- Footer -->
    <line x1="60" y1="560" x2="${this.width - 60}" y2="560" stroke="${this.colors.border}" stroke-width="1"/>
    <text x="60" y="595" class="username">${userName}</text>
    <text x="${this.width - 60}" y="595" class="footer-text" text-anchor="end">art-of-intent.netlify.app</text>
    
</svg>
        `.trim();
    }
    
    /**
     * Generate ASCII-style progress bar
     * @param {number} value - Current value
     * @param {number} max - Maximum value
     * @param {number} length - Bar length in characters
     * @returns {string} ASCII bar string
     */
    generateASCIIBar(value, max, length) {
        // Handle edge cases
        if (typeof value !== 'number' || typeof max !== 'number' || typeof length !== 'number') {
            return '░'.repeat(Math.max(0, length));
        }
        
        if (isNaN(value) || isNaN(max) || isNaN(length)) {
            return '░'.repeat(Math.max(0, length));
        }
        
        if (max <= 0 || length <= 0) {
            return '░'.repeat(Math.max(0, length));
        }
        
        // Calculate filled portion, clamped between 0 and length
        const percentage = Math.max(0, Math.min(1, value / max));
        const filled = Math.round(percentage * length);
        const empty = length - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty);
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
    module.exports = ShareCardGenerator;
    module.exports.instance = shareCardGenerator;
}
