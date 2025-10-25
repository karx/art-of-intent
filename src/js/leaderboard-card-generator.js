// ============================================
// Leaderboard Card Generator
// SVG-based OG image with leaderboard and stats
// ============================================

class LeaderboardCardGenerator {
    constructor() {
        this.width = 1200;
        this.height = 630; // Standard OG image size
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
        
        // Generate player rows (top 2 only)
        const playerRows = this.generatePlayerRows(topPlayers);
        
        // Generate compact stats visualization
        const statsVisual = this.generateCompactStats({
            totalPlayers,
            gamesToday,
            activeNow,
            winRate,
            avgTokens,
            avgAttempts
        });
        
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
            
            .title {
                font-size: 48px;
                fill: ${this.colors.cyan};
                letter-spacing: 3px;
                font-weight: bold;
            }
            
            .subtitle {
                font-size: 24px;
                fill: ${this.colors.yellow};
                letter-spacing: 2px;
            }
            
            .player-name {
                font-size: 36px;
                fill: ${this.colors.white};
                font-weight: bold;
            }
            
            .player-stats {
                font-size: 24px;
                fill: ${this.colors.cyan};
            }
            
            .rank-badge {
                font-size: 56px;
                fill: ${this.colors.yellow};
                font-weight: bold;
            }
            
            .stat-compact {
                font-size: 18px;
                fill: ${this.colors.cyan};
            }
            
            .stat-value-compact {
                font-size: 20px;
                fill: ${this.colors.white};
                font-weight: bold;
            }
            
            .stat-icon {
                font-size: 24px;
                fill: ${this.colors.yellow};
            }
            
            .ascii-bar-compact {
                font-size: 18px;
                fill: ${this.colors.green};
                letter-spacing: 0px;
            }
            
            .cta {
                font-size: 28px;
                fill: ${this.colors.green};
                font-weight: bold;
                letter-spacing: 2px;
            }
            
            .url {
                font-size: 24px;
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
    
    <!-- Title -->
    <text x="${this.width / 2}" y="110" text-anchor="middle" class="title">ART OF INTENT</text>
    <text x="${this.width / 2}" y="150" text-anchor="middle" class="subtitle">Daily Leaderboard • ${date}</text>
    
    <!-- Separator -->
    <line x1="100" y1="180" x2="${this.width - 100}" y2="180" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Player Rows (Top 2) -->
    ${playerRows}
    
    <!-- Separator -->
    <line x1="100" y1="430" x2="${this.width - 100}" y2="430" stroke="${this.colors.border}" stroke-width="2"/>
    
    <!-- Compact Stats -->
    ${statsVisual}
    
    <!-- Call to Action -->
    <text x="${this.width / 2}" y="565" text-anchor="middle" class="cta">
        GUIDE ARTY THE HAIKU BOT
    </text>
    <text x="${this.width / 2}" y="600" text-anchor="middle" class="url">
        art-of-intent.netlify.app
    </text>
    
</svg>
        `.trim();
    }
    
    /**
     * Generate compact stats with DOS ASCII visual elements
     */
    generateCompactStats(stats) {
        const {
            totalPlayers = 0,
            gamesToday = 0,
            activeNow = 0,
            winRate = 0,
            avgTokens = 0,
            avgAttempts = 0
        } = stats;
        
        // Generate ASCII bars
        const winRateBar = this.generateASCIIBar(winRate, 100, 10);
        const tokenBar = this.generateASCIIBar(Math.min(avgTokens, 500), 500, 10);
        const attemptBar = this.generateASCIIBar(Math.min(avgAttempts, 10), 10, 10);
        
        return `
    <!-- Stats Grid: 3 columns x 2 rows -->
    <!-- Row 1 -->
    <text x="150" y="470" class="stat-icon">♦</text>
    <text x="180" y="470" class="stat-value-compact">${this.formatNumber(totalPlayers)}</text>
    <text x="180" y="490" class="stat-compact">players</text>
    
    <text x="450" y="470" class="stat-icon">▲</text>
    <text x="480" y="470" class="stat-value-compact">${this.formatNumber(gamesToday)}</text>
    <text x="480" y="490" class="stat-compact">games today</text>
    
    <text x="750" y="470" class="stat-icon">●</text>
    <text x="780" y="470" class="stat-value-compact">${this.formatNumber(activeNow)}</text>
    <text x="780" y="490" class="stat-compact">active now</text>
    
    <!-- Row 2 -->
    <text x="150" y="525" class="stat-compact">WIN</text>
    <text x="200" y="525" class="stat-value-compact">${winRate}%</text>
    <text x="250" y="525" class="ascii-bar-compact">${winRateBar}</text>
    
    <text x="450" y="525" class="stat-compact">TOK</text>
    <text x="500" y="525" class="stat-value-compact">${avgTokens}</text>
    <text x="550" y="525" class="ascii-bar-compact">${tokenBar}</text>
    
    <text x="750" y="525" class="stat-compact">ATT</text>
    <text x="800" y="525" class="stat-value-compact">${avgAttempts}</text>
    <text x="850" y="525" class="ascii-bar-compact">${attemptBar}</text>`;
    }
    
    /**
     * Generate player rows HTML (top 2 only, clean layout)
     */
    generatePlayerRows(players) {
        if (!players || players.length === 0) {
            return `
    <text x="${this.width / 2}" y="280" text-anchor="middle" class="player-name">No players yet</text>
    <text x="${this.width / 2}" y="320" text-anchor="middle" class="player-stats">Be the first to play!</text>`;
        }
        
        let rows = '';
        const startY = 240;
        const rowHeight = 120;
        
        players.slice(0, 2).forEach((player, index) => {
            const y = startY + (index * rowHeight);
            const rank = index + 1;
            const name = (player.name || 'GUEST').substring(0, 20);
            const tokens = player.tokens || 0;
            const attempts = player.attempts || 0;
            
            rows += `
    <!-- Player ${rank} -->
    <text x="150" y="${y}" class="rank-badge">#${rank}</text>
    <text x="250" y="${y}" class="player-name">${name}</text>
    <text x="250" y="${y + 40}" class="player-stats">${tokens} tokens • ${attempts} attempts</text>`;
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
