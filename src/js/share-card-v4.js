// ============================================
// Share Card Generator V4
// Full-width trail with event indicators
// ============================================

function generateShareCardV4(data) {
    const {
        result = 'WIN',
        attempts = 0,
        tokens = 0,
        matches = '0/3',
        userName = 'Guest',
        responseTrail = [],
        globalMaxTokens = 1000,
        creepLevel = 0,
        creepThreshold = 100
    } = data;
    
    const width = 1200;
    const height = 630;
    
    // Get current theme colors from CSS variables
    const getThemeColor = (varName, fallback) => {
        if (typeof document !== 'undefined') {
            const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            return value || fallback;
        }
        return fallback;
    };
    
    const colors = {
        background: getThemeColor('--bg-primary', '#002b36'),
        backgroundAlt: getThemeColor('--bg-secondary', '#073642'),
        border: getThemeColor('--border-primary', '#586e75'),
        cyan: getThemeColor('--accent-secondary', '#2aa198'),
        green: getThemeColor('--success', '#859900'),
        red: getThemeColor('--error', '#dc322f'),
        yellow: getThemeColor('--warning', '#b58900'),
        white: getThemeColor('--text-primary', '#93a1a1'),
        gray: getThemeColor('--text-secondary', '#586e75'),
        dim: getThemeColor('--bg-tertiary', '#073642')
    };
    
    const isWin = result === 'WIN';
    const resultColor = isWin ? colors.green : colors.red;
    const [matchNum, matchTotal] = matches.split('/').map(Number);
    
    // Calculate creep color and visualization
    const creepPercentage = (creepLevel / creepThreshold) * 100;
    let creepColor = colors.green;
    if (creepPercentage >= 75) creepColor = colors.red;
    else if (creepPercentage >= 50) creepColor = colors.yellow;
    else if (creepPercentage >= 25) creepColor = colors.yellow;
    
    // Generate darkness blocks (▓) based on creep level
    const maxBlocks = 10;
    const filledBlocks = Math.ceil((creepLevel / creepThreshold) * maxBlocks);
    const emptyBlocks = maxBlocks - filledBlocks;
    const darknessBar = '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    
    // V4 Layout: Compact header, full-width trail
    const headerHeight = 160;
    const trailStartY = headerHeight + 20;
    const footerMargin = 40;
    const availableHeight = height - trailStartY - footerMargin;
    
    // Trail dimensions - use full width
    const trailMargin = 60;
    const trailWidth = width - (trailMargin * 2);
    
    // Get all attempts for visualization
    const maxAttempts = Math.min(responseTrail.length, 10);
    const recentAttempts = responseTrail.slice(-maxAttempts);
    
    // Calculate spacing to fit available space
    const attemptHeight = Math.min(40, Math.floor(availableHeight / maxAttempts));
    
   // Calculate max tokens for scaling (use session total)
    const tokensInSession = recentAttempts.map(a => a.totalTokens || 0).reduce((sum, tokens) => sum + tokens, 1);
    
    let cumulativeTokenWidth = 0; // Track cumulative width for stacking
    
    // Generate full-width trail visualization with event indicators
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = trailStartY + (idx * attemptHeight);
        const x = trailMargin;
        
        // Calculate token split widths - use available trail width
        const labelWidth = 40; // "#1" label
        const eventWidth = 100; // Event indicators (increased for prominence)
        const tokenBarMaxWidth = trailWidth - labelWidth - eventWidth - 40; // Max width for tokens
        
        // Scale based on session max (step chart - end-aligned)
        const totalTokenRatio = (attempt.totalTokens || 0) / tokensInSession;
        const tokenBarWidth = tokenBarMaxWidth * totalTokenRatio;
        
        // Split into prompt/output proportionally
        const promptRatio = (attempt.promptTokens || 0) / (attempt.totalTokens || 1);
        const promptWidth = tokenBarWidth * promptRatio;
        const outputWidth = tokenBarWidth * (1 - promptRatio);
        
        // Determine hit status (V3 style - only show target hits)
        const hitCount = attempt.foundWords ? attempt.foundWords.length : 0;
        const hasHits = hitCount > 0;
        
        // Calculate bar position (CUMULATIVE waterfall chart)
        const baseBarStartX = labelWidth; // Base starting point for all bars
        const barStartX = baseBarStartX + cumulativeTokenWidth;
        const barEndX = barStartX + tokenBarWidth; // End of this specific bar
        
        // Update cumulative width for the *next* iteration
        cumulativeTokenWidth += tokenBarWidth;
        
        // Generate hit indicators (V3 style - green circles)
        let hitIndicators = '';
        const hitStartX = barEndX + 20;
        
        if (hasHits) {
            // Multiple green circles for multiple hits (up to 3)
            for (let i = 0; i < Math.min(hitCount, 3); i++) {
                const circleX = hitStartX + (i * 14);
                hitIndicators += `
                    <circle cx="${circleX}" cy="17" r="6" 
                            fill="${colors.green}" stroke="${colors.border}" stroke-width="2"/>
                `;
            }
            // Show count if more than 3
            if (hitCount > 3) {
                hitIndicators += `
                    <text x="${hitStartX + (3 * 14) + 8}" y="20" 
                          style="font-size: 11px; fill: ${colors.green}; font-weight: bold;">
                        +${hitCount - 3}
                    </text>
                `;
            }
        } else {
            // Gray circle for no hits
            hitIndicators = `
                <circle cx="${hitStartX}" cy="17" r="6" 
                        fill="${colors.gray}" stroke="${colors.border}" stroke-width="2" opacity="0.5"/>
            `;
        }
        
        return `
        <!-- Attempt ${attempt.number} -->
        <g transform="translate(${x}, ${y})">
            <!-- Attempt number -->
            <text x="0" y="18" style="font-size: 13px; fill: ${colors.gray}; font-weight: bold;">
                #${attempt.number}
            </text>
            
            <!-- Token bars (end-aligned for step chart) -->
            <rect x="${barStartX}" y="5" width="${promptWidth}" height="22" 
                  fill="${colors.cyan}" rx="3" opacity="0.7"/>
            <rect x="${barStartX + promptWidth}" y="5" width="${outputWidth}" height="22" 
                  fill="${colors.yellow}" rx="3" opacity="0.7"/>
            
            <!-- Token count (on bar) -->
            <text x="${barEndX - 5}" y="19" 
                  style="font-size: 10px; fill: ${colors.white}; text-anchor: end; opacity: 0.9;">
                ${attempt.totalTokens}
            </text>
            
            <!-- Hit indicators (V3 style) -->
            ${hitIndicators}
        </g>
        `;
    }).join('');
    
    // Generate creep overlay (grows with trail, aligned to tokensInSession)
    const creepOverlay = (() => {
        if (creepLevel === 0) return '';
        
        // Calculate creep width based on session tokens
        const labelWidth = 40;
        const eventWidth = 100;
        const tokenBarMaxWidth = trailWidth - labelWidth - eventWidth - 40;
        
        // Creep grows proportionally to creep level
        const creepRatio = creepLevel / creepThreshold;
        const creepWidth = tokenBarMaxWidth * creepRatio;
        
        // Creep overlay spans all attempts
        const overlayHeight = maxAttempts * attemptHeight;
        
        return `
            <!-- Creep Overlay (darkness growing) -->
            <g transform="translate(${trailMargin}, ${trailStartY})" opacity="0.15">
                <defs>
                    <linearGradient id="creepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${colors.red};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${colors.red};stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                <rect x="${labelWidth}" y="0" width="${creepWidth}" height="${overlayHeight}" 
                      fill="url(#creepGradient)" rx="4"/>
                
                <!-- Creep level indicator -->
                <text x="${labelWidth + creepWidth - 10}" y="${overlayHeight / 2}" 
                      style="font-size: 14px; fill: ${colors.red}; font-weight: bold; opacity: 0.8; text-anchor: end;">
                    CREEP ${creepLevel}
                </text>
            </g>
        `;
    })();
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400,700&amp;display=swap');
            
            text {
                font-family: 'Courier Prime', 'Courier New', monospace;
            }
        </style>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="${colors.background}"/>
    
    <!-- Border -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" 
          fill="none" stroke="${colors.border}" stroke-width="2"/>
    
    <!-- Compact Header -->
    <g transform="translate(60, 50)">
        <!-- Branding -->
        <text x="0" y="25" style="font-size: 32px; font-weight: bold; fill: ${colors.cyan}; letter-spacing: 3px;">
            ART OF INTENT
        </text>
        <text x="0" y="45" style="font-size: 13px; fill: ${colors.gray}; letter-spacing: 1.5px;">
            HAIKU CHALLENGE
        </text>
        
        <!-- User & Result Card (enhanced styling) -->
        <g transform="translate(0, 65)">
            <!-- Background card -->
            <rect x="-10" y="-15" width="700" height="70" 
                  fill="${colors.backgroundAlt}" stroke="${colors.border}" 
                  stroke-width="1" rx="6" opacity="0.5"/>
            
            <!-- User name (prominent) -->
            <text x="10" y="10" style="font-size: 22px; font-weight: bold; fill: ${colors.cyan}; letter-spacing: 1px;">
                ${userName}
            </text>
            
            <!-- Result badge -->
            <g transform="translate(350, -5)">
                <rect x="0" y="0" width="120" height="30" 
                      fill="${resultColor}" rx="4" opacity="0.2"/>
                <rect x="0" y="0" width="120" height="30" 
                      fill="none" stroke="${resultColor}" stroke-width="2" rx="4"/>
                <text x="60" y="20" 
                      style="font-size: 16px; fill: ${resultColor}; font-weight: bold; text-anchor: middle; letter-spacing: 2px;">
                    ${result}
                </text>
            </g>
            
            <!-- Stats row -->
            <text x="10" y="40" style="font-size: 13px; fill: ${colors.white}; opacity: 0.9;">
                ${matchNum}/${matchTotal} words · ${attempts} attempts · ${tokens} tokens
            </text>
            
            <!-- Creep indicator -->
            <g transform="translate(500, 30)">
                <text x="0" y="0" style="font-size: 10px; fill: ${colors.gray}; text-transform: uppercase;">
                    CREEP
                </text>
                <text x="45" y="0" style="font-size: 11px; fill: ${creepColor}; font-weight: bold; letter-spacing: 1px;">
                    ${darknessBar}
                </text>
                <text x="135" y="0" style="font-size: 10px; fill: ${creepColor};">
                    ${creepLevel}/${creepThreshold}
                </text>
            </g>
        </g>
    </g>
    
    <!-- Response Trail Section -->
    <g transform="translate(60, ${headerHeight})">
        <text x="0" y="0" style="font-size: 14px; fill: ${colors.gray}; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Response Trail
        </text>
       <text x="${trailWidth - 250}" y="0" style="font-size: 10px; fill: ${colors.gray}; opacity: 0.7;">
            
        </text>
    </g>
    <line x1="60" y1="${headerHeight + 5}" x2="${width - 60}" y2="${headerHeight + 5}" stroke="${colors.border}" stroke-width="1"/>
    
    ${creepOverlay}
    
    ${attemptVisuals}
    
</svg>
    `.trim();
}
