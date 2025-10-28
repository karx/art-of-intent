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
    const headerHeight = 140;
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
    
    // Generate full-width trail visualization with event indicators
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = trailStartY + (idx * attemptHeight);
        const x = trailMargin;
        
        // Calculate token split widths - use available trail width
        const labelWidth = 40; // "#1" label
        const eventWidth = 80; // Event indicators
        const tokenWidth = trailWidth - labelWidth - eventWidth - 40; // Remaining for tokens
        
        const promptWidth = Math.min((attempt.promptTokens / 200) * tokenWidth, tokenWidth * 0.6);
        const outputWidth = Math.min((attempt.outputTokens / 200) * tokenWidth, tokenWidth * 0.4);
        
        // Determine event status
        const isViolation = attempt.violation || false;
        const isDirectWordUsage = attempt.directWordUsage || false;
        const hasCreepIncrease = (attempt.creepIncrease || 0) > 0;
        const hasBlacklistInResponse = (attempt.blacklistWordsInResponse || []).length > 0;
        const hitCount = attempt.foundWords ? attempt.foundWords.length : 0;
        const hasHits = hitCount > 0;
        
        // Generate event indicators (right side)
        let eventIndicators = '';
        const eventX = labelWidth + tokenWidth + 20;
        
        // Hit indicators (green dots)
        if (hasHits) {
            for (let i = 0; i < Math.min(hitCount, 3); i++) {
                eventIndicators += `
                    <circle cx="${eventX + (i * 12)}" cy="15" r="5" 
                            fill="${colors.green}" stroke="${colors.border}" stroke-width="1.5"/>
                `;
            }
            if (hitCount > 3) {
                eventIndicators += `
                    <text x="${eventX + (3 * 12) + 8}" y="18" 
                          style="font-size: 9px; fill: ${colors.green}; font-weight: bold;">
                        +${hitCount - 3}
                    </text>
                `;
            }
        }
        
        // Warning indicators (yellow)
        if (isDirectWordUsage) {
            eventIndicators += `
                <text x="${eventX + 40}" y="18" 
                      style="font-size: 10px; fill: ${colors.yellow}; font-weight: bold;">
                    ⚠
                </text>
            `;
        }
        
        // Darkness indicators (creep from Arty response)
        if (hasBlacklistInResponse) {
            eventIndicators += `
                <text x="${eventX + 55}" y="18" 
                      style="font-size: 10px; fill: ${colors.red};">
                    ▓
                </text>
            `;
        }
        
        // Violation indicator (severe)
        if (isViolation) {
            eventIndicators += `
                <circle cx="${eventX + 70}" cy="15" r="7" 
                        fill="${colors.red}" stroke="${colors.border}" stroke-width="2"/>
                <text x="${eventX + 70}" y="19" 
                      style="font-size: 11px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
                    ✗
                </text>
            `;
        }
        
        return `
        <!-- Attempt ${attempt.number} -->
        <g transform="translate(${x}, ${y})">
            <!-- Attempt number -->
            <text x="0" y="18" style="font-size: 13px; fill: ${colors.gray}; font-weight: bold;">
                #${attempt.number}
            </text>
            
            <!-- Token bars (full width) -->
            <rect x="${labelWidth}" y="5" width="${promptWidth}" height="22" 
                  fill="${colors.cyan}" rx="3" opacity="0.7"/>
            <rect x="${labelWidth + promptWidth}" y="5" width="${outputWidth}" height="22" 
                  fill="${colors.yellow}" rx="3" opacity="0.7"/>
            
            <!-- Token count (on bar) -->
            <text x="${labelWidth + promptWidth + outputWidth - 5}" y="19" 
                  style="font-size: 10px; fill: ${colors.white}; text-anchor: end; opacity: 0.9;">
                ${attempt.totalTokens}
            </text>
            
            <!-- Event indicators -->
            ${eventIndicators}
        </g>
        `;
    }).join('');
    

    
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
        
        <!-- User & Result (horizontal layout) -->
        <g transform="translate(0, 65)">
            <text x="0" y="0" style="font-size: 18px; font-weight: bold; fill: ${colors.cyan};">
                ${userName}
            </text>
            <text x="250" y="0" style="font-size: 14px; fill: ${colors.gray};">
                RESULT: <tspan style="fill: ${resultColor}; font-weight: bold; font-size: 16px;">${result}</tspan>
            </text>
        </g>
        
        <!-- Stats & Creep (horizontal layout) -->
        <g transform="translate(0, 85)">
            <text x="0" y="0" style="font-size: 12px; fill: ${colors.gray};">
                ${matchNum}/${matchTotal} words · ${attempts} attempts · ${tokens} tokens
            </text>
            <text x="400" y="0" style="font-size: 11px; fill: ${colors.gray};">
                CREEP:
            </text>
            <text x="450" y="0" style="font-size: 12px; fill: ${creepColor}; font-weight: bold; letter-spacing: 1px;">
                ${darknessBar}
            </text>
            <text x="580" y="0" style="font-size: 11px; fill: ${creepColor};">
                ${creepLevel}/${creepThreshold}
            </text>
        </g>
    </g>
    
    <!-- Response Trail Section -->
    <g transform="translate(60, ${headerHeight})">
        <text x="0" y="0" style="font-size: 14px; fill: ${colors.gray}; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Response Trail
        </text>
        <text x="${trailWidth - 200}" y="0" style="font-size: 10px; fill: ${colors.gray}; opacity: 0.7;">
            ● = hits  ⚠ = warning  ▓ = darkness  ✗ = violation
        </text>
    </g>
    <line x1="60" y1="${headerHeight + 5}" x2="${width - 60}" y2="${headerHeight + 5}" stroke="${colors.border}" stroke-width="1"/>
    
    ${attemptVisuals}
    
</svg>
    `.trim();
}
