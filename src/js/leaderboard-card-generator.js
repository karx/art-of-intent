// ============================================
// Leaderboard Card Generator
// SVG-based OG image with leaderboard and stats
// ============================================

class LeaderboardCardGenerator {
    constructor() {
        this.width = 1200;
        this.height = 630; // Standard OG image size
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
     * Generate leaderboard SVG
     * @param {object} data - Leaderboard and stats data
     * @returns {string} SVG string
     */
    generateSVG(data) {
        const {
            date = new Date().toLocaleDateString(),
            topPlayers = [],
            stats = {}
        } = data;
        
        // Default stats
        const {
            totalPlayers = 0,
            gamesToday = 0,
            activeNow = 0,
            winRate = 0,
            avgTokens = 0,
            avgAttempts = 0
        } = stats;
        
        // Generate progress bars for stats
        const winRateBar = this.generateASCIIBar(winRate, 100, 14);
        const tokenBar = this.generateASCIIBar(Math.min(avgTokens, 500), 500, 14);
        const attemptBar = this.generateASCIIBar(Math.min(avgAttempts, 10), 10, 14);
        
        // Generate player rows
        const playerRows = this.generatePlayerRows(topPlayers);
        
        // Get version
        const version = typeof window !== 'undefined' && window.APP_VERSION 
            ? window.APP_VERSION.display 
            : 'v1.0.0';
        
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
                font-size: 20px;
                fill: ${this.colors.cyan};
                letter-spacing: 2px;
                font-weight: bold;
            }
            
            .section-title {
                font-size: 18px;
                fill: ${this.colors.cyan};
                letter-spacing: 1px;
            }
            
            .player-row {
                font-size: 18px;
                fill: ${this.colors.white};
                letter-spacing: 0.5px;
            }
            
            .rank {
                fill: ${this.colors.yellow};
                font-weight: bold;
            }
            
            .stat-label {
                font-size: 16px;
                fill: ${this.colors.cyan};
            }
            
            .stat-value {
                font-size: 16px;
                fill: ${this.colors.white};
                font-weight: bold;
            }
            
            .ascii-bar {
                font-size: 16px;
                fill: ${this.colors.cyan};
                letter-spacing: 0px;
            }
            
            .cta {
                font-size: 24px;
                fill: ${this.colors.green};
                font-weight: bold;
                letter-spacing: 2px;
            }
            
            .url {
                font-size: 22px;
                fill: ${this.colors.yellow};
            }
            
            .border-char {
                font-size: 24px;
                fill: ${this.colors.border};
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
    
    <!-- Main Border -->
    <text x="30" y="50" class="border-char">╔</text>
    <text x="${this.width - 50}" y="50" class="border-char">╗</text>
    <text x="30" y="${this.height - 25}" class="border-char">╚</text>
    <text x="${this.width - 50}" y="${this.height - 25}" class="border-char">╝</text>
    
    <line x1="50" y1="35" x2="${this.width - 50}" y2="35" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="38" x2="${this.width - 50}" y2="38" stroke="${this.colors.border}" stroke-width="1"/>
    <line x1="50" y1="${this.height - 35}" x2="${this.width - 50}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="${this.height - 32}" x2="${this.width - 50}" y2="${this.height - 32}" stroke="${this.colors.border}" stroke-width="1"/>
    <line x1="35" y1="50" x2="35" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="38" y1="50" x2="38" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="1"/>
    <line x1="${this.width - 35}" y1="50" x2="${this.width - 35}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="${this.width - 38}" y1="50" x2="${this.width - 38}" y2="${this.height - 35}" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Header -->
    <text x="60" y="75" class="header">ART OF INTENT ${version} - DAILY LEADERBOARD</text>
    <text x="${this.width - 60}" y="75" text-anchor="end" class="header">${date}</text>
    
    <!-- Separator -->
    <text x="30" y="95" class="border-char">╠</text>
    <text x="${this.width - 50}" y="95" class="border-char">╣</text>
    <line x1="50" y1="80" x2="${this.width - 50}" y2="80" stroke="${this.colors.border}" stroke-width="3"/>
    <line x1="50" y1="83" x2="${this.width - 50}" y2="83" stroke="${this.colors.border}" stroke-width="1"/>
    
    <!-- Top Players Section -->
    <text x="80" y="125" class="border-char">┌</text>
    <text x="200" y="125" class="section-title">TOP PLAYERS TODAY</text>
    <text x="${this.width - 100}" y="125" class="border-char">┐</text>
    <line x1="100" y1="110" x2="${this.width - 100}" y2="110" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Player Rows -->
    ${playerRows}
    
    <text x="80" y="315" class="border-char">└</text>
    <text x="${this.width - 100}" y="315" class="border-char">┘</text>
    <line x1="100" y1="300" x2="${this.width - 100}" y2="300" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Game Statistics Section -->
    <text x="80" y="355" class="border-char">┌</text>
    <text x="200" y="355" class="section-title">GAME STATISTICS</text>
    <text x="${this.width - 100}" y="355" class="border-char">┐</text>
    <line x1="100" y1="340" x2="${this.width - 100}" y2="340" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Stats Row 1 -->
    <text x="120" y="390" class="stat-label">TOTAL PLAYERS:</text>
    <text x="320" y="390" class="stat-value">${this.formatNumber(totalPlayers)}</text>
    
    <text x="600" y="390" class="stat-label">WIN RATE:</text>
    <text x="740" y="390" class="stat-value">${winRate}%</text>
    <text x="820" y="390" class="ascii-bar">${winRateBar}</text>
    
    <!-- Stats Row 2 -->
    <text x="120" y="425" class="stat-label">GAMES TODAY:</text>
    <text x="320" y="425" class="stat-value">${this.formatNumber(gamesToday)}</text>
    
    <text x="600" y="425" class="stat-label">AVG TOKENS:</text>
    <text x="740" y="425" class="stat-value">${avgTokens}</text>
    <text x="820" y="425" class="ascii-bar">${tokenBar}</text>
    
    <!-- Stats Row 3 -->
    <text x="120" y="460" class="stat-label">ACTIVE NOW:</text>
    <text x="320" y="460" class="stat-value">${this.formatNumber(activeNow)}</text>
    
    <text x="600" y="460" class="stat-label">AVG ATTEMPTS:</text>
    <text x="740" y="460" class="stat-value">${avgAttempts}</text>
    <text x="820" y="460" class="ascii-bar">${attemptBar}</text>
    
    <text x="80" y="495" class="border-char">└</text>
    <text x="${this.width - 100}" y="495" class="border-char">┘</text>
    <line x1="100" y1="480" x2="${this.width - 100}" y2="480" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Call to Action -->
    <text x="${this.width / 2}" y="540" text-anchor="middle" class="cta">
        &gt;&gt;&gt; GUIDE ARTY THE HAIKU BOT - PLAY NOW &lt;&lt;&lt;
    </text>
    <text x="${this.width / 2}" y="580" text-anchor="middle" class="url">
        art-of-intent.netlify.app
    </text>
    
</svg>
        `.trim();
    }
    
    /**
     * Generate player rows HTML
     */
    generatePlayerRows(players) {
        if (!players || players.length === 0) {
            return `<text x="120" y="160" class="player-row">No players yet - be the first!</text>`;
        }
        
        let rows = '';
        const startY = 160;
        const rowHeight = 35;
        
        players.slice(0, 5).forEach((player, index) => {
            const y = startY + (index * rowHeight);
            const rank = `#${player.rank || index + 1}`;
            const name = (player.name || 'GUEST').substring(0, 15).padEnd(15);
            const tokens = `${player.tokens || 0} tokens`.padEnd(12);
            const attempts = `${player.attempts || 0} att`.padEnd(6);
            const efficiency = `${player.efficiency || 0} eff`.padEnd(9);
            const time = player.time || '--:--';
            
            rows += `
    <text x="120" y="${y}" class="player-row">
        <tspan class="rank">${rank}</tspan>  ${name}  ${tokens}  ${attempts}  ${efficiency}  ${time}
    </text>`;
        });
        
        return rows;
    }
    
    /**
     * Generate ASCII-style progress bar
     */
    generateASCIIBar(value, max, length) {
        if (typeof value !== 'number' || typeof max !== 'number' || typeof length !== 'number') {
            return '░'.repeat(Math.max(0, length));
        }
        
        if (isNaN(value) || isNaN(max) || isNaN(length)) {
            return '░'.repeat(Math.max(0, length));
        }
        
        if (max <= 0 || length <= 0) {
            return '░'.repeat(Math.max(0, length));
        }
        
        const percentage = Math.max(0, Math.min(1, value / max));
        const filled = Math.round(percentage * length);
        const empty = length - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    
    /**
     * Format number with commas
     */
    formatNumber(num) {
        if (typeof num !== 'number') return '0';
        return num.toLocaleString('en-US');
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
    async downloadImage(svgString, filename = 'art-of-intent-leaderboard.png') {
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
const leaderboardCardGenerator = new LeaderboardCardGenerator();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardCardGenerator;
    module.exports.instance = leaderboardCardGenerator;
}
