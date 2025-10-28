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
    
    // Calculate max tokens for scaling (use session total, not arbitrary 1000)
    const maxTokensInSession = Math.max(...recentAttempts.map(a => a.totalTokens || 0), 1);
    
    // Generate full-width trail visualization with event indicators
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = trailStartY + (idx * attemptHeight);
        const x = trailMargin;
        
        // Calculate token split widths - use available trail width
        const labelWidth = 40; // "#1" label
        const eventWidth = 100; // Event indicators (increased for prominence)
        const tokenBarMaxWidth = trailWidth - labelWidth - eventWidth - 40; // Max width for tokens
        
        // Scale based on session max (step chart - end-aligned)
        const totalTokenRatio = (attempt.totalTokens || 0) / maxTokensInSession;
        const tokenBarWidth = tokenBarMaxWidth * totalTokenRatio;
        
        // Split into prompt/output proportionally
        const promptRatio = (attempt.promptTokens || 0) / (attempt.totalTokens || 1);
        const promptWidth = tokenBarWidth * promptRatio;
        const outputWidth = tokenBarWidth * (1 - promptRatio);
        
        // Determine event status
        const isViolation = attempt.violation || false;
        const isDirectWordUsage = attempt.directWordUsage || false;
        const hasCreepIncrease = (attempt.creepIncrease || 0) > 0;
        const hasBlacklistInResponse = (attempt.blacklistWordsInResponse || []).length > 0;
        const hitCount = attempt.foundWords ? attempt.foundWords.length : 0;
        const hasHits = hitCount > 0;
        
        // Categorize events: Prominent (hits/blacklist) vs Secondary (warnings/input creep)
        const hasProminentEvent = hasHits || hasBlacklistInResponse || isViolation;
        const hasSecondaryEvent = isDirectWordUsage || (hasCreepIncrease && !hasBlacklistInResponse);
        
        // Calculate bar position (end-aligned for step chart effect)
        const barEndX = labelWidth + tokenBarMaxWidth;
        const barStartX = barEndX - tokenBarWidth;
        
        // Generate event indicators (right side, separated by type)
        let eventIndicators = '';
        const eventStartX = labelWidth + tokenBarMaxWidth + 20;
        
        // PROMINENT EVENTS (Target hits & Blacklist detection)
        if (hasProminentEvent) {
            let prominentX = eventStartX;
            
            // Target hits (green, prominent)
            if (hasHits) {
                // Large green indicator
                eventIndicators += `
                    <rect x="${prominentX}" y="8" width="35" height="16" 
                          fill="${colors.green}" rx="3" opacity="0.9"/>
                    <text x="${prominentX + 17.5}" y="19" 
                          style="font-size: 11px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
                        ●${hitCount}
                    </text>
                `;
                prominentX += 40;
            }
            
            // Blacklist in response (red, prominent)
            if (hasBlacklistInResponse) {
                const blacklistCount = attempt.blacklistWordsInResponse.length;
                eventIndicators += `
                    <rect x="${prominentX}" y="8" width="35" height="16" 
                          fill="${colors.red}" rx="3" opacity="0.9"/>
                    <text x="${prominentX + 17.5}" y="19" 
                          style="font-size: 11px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
                        ▓${blacklistCount}
                    </text>
                `;
                prominentX += 40;
            }
            
            // Violation (red X, prominent)
            if (isViolation) {
                eventIndicators += `
                    <circle cx="${prominentX + 10}" cy="15" r="8" 
                            fill="${colors.red}" stroke="${colors.border}" stroke-width="2"/>
                    <text x="${prominentX + 10}" y="19" 
                          style="font-size: 12px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
                        ✗
                    </text>
                `;
            }
        }
        
        // SECONDARY EVENTS (Warnings & Input creep) - shown below if present
        if (hasSecondaryEvent) {
            let secondaryIndicators = '';
            
            // Direct word usage warning
            if (isDirectWordUsage) {
                secondaryIndicators += `
                    <text x="${eventStartX}" y="30" 
                          style="font-size: 8px; fill: ${colors.yellow}; opacity: 0.8;">
                        ⚠ input
                    </text>
                `;
            }
            
            eventIndicators += `<g opacity="0.7">${secondaryIndicators}</g>`;
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
            
            <!-- Event indicators (prominent and separated) -->
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
        <text x="${trailWidth - 250}" y="0" style="font-size: 10px; fill: ${colors.gray}; opacity: 0.7;">
            Bars end-aligned · ●N = hits · ▓N = blacklist · ✗ = violation · ⚠ = warning
        </text>
    </g>
    <line x1="60" y1="${headerHeight + 5}" x2="${width - 60}" y2="${headerHeight + 5}" stroke="${colors.border}" stroke-width="1"/>
    
    ${attemptVisuals}
    
</svg>
    `.trim();
}
