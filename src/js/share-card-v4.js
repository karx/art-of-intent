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
    
   // Calculate max tokens for scaling (use session total)
    const tokensInSession = recentAttempts.map(a => a.totalTokens || 0).reduce((sum, tokens) => sum + tokens, 1);
    
    let cumulativeTokenWidth = 0; // Track cumulative width for stacking
    
    // Generate full-width trail visualization with event indicators
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        console.log({attempt});
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
        
        // Add event indicators (small shapes for blacklist/security)
        let eventIndicators = '';
        let eventX = hitStartX + 50; // Position after hit indicators
        
        // Blacklist indicator (small rectangle)
        if (attempt.blacklistWordsInResponse > 0) {
            eventIndicators += `
                <rect x="${eventX}" y="12" width="8" height="10" 
                      fill="${colors.red}" opacity="0.8" rx="1"/>
            `;
            eventX += 12;
        }
        
        // Security threat indicator (small triangle)
        if (attempt.securityViolations > 0) {
            eventIndicators += `
                <polygon points="${eventX},22 ${eventX + 4},12 ${eventX + 8},22" 
                         fill="${colors.red}" opacity="0.8"/>
            `;
            eventX += 12;
        }
        
        // Security warning indicator (small diamond)
        if (attempt.securityWarnings > 0) {
            eventIndicators += `
                <polygon points="${eventX + 4},12 ${eventX + 8},17 ${eventX + 4},22 ${eventX},17" 
                         fill="${colors.yellow}" opacity="0.8"/>
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
            
            <!-- Event indicators (blacklist/security) -->
            ${eventIndicators}
        </g>
        `;
    }).join('');
    
    // Generate creep step visualization (shows progression per attempt)
    const creepSteps = (() => {
        if (creepLevel === 0) return '';
        
        const labelWidth = 40;
        const eventWidth = 100;
        const tokenBarMaxWidth = trailWidth - labelWidth - eventWidth - 40;
        
        // Creep color based on game mechanic (not red - it's darkness/shadow)
        const creepColor = colors.dim; // Use dim/tertiary color for darkness theme
        
        let cumulativeCreep = 0;
        const steps = recentAttempts.map((attempt, idx) => {
            const creepIncrease = attempt.creepIncrease || 0;
            if (creepIncrease === 0) return '';
            
            const previousCreep = cumulativeCreep;
            cumulativeCreep += creepIncrease;
            
            const y = trailStartY + (idx * attemptHeight);
            
            // Calculate width based on creep increase
            const creepRatio = creepIncrease / creepThreshold;
            const stepWidth = tokenBarMaxWidth * creepRatio;
            
            // Position based on previous cumulative creep
            const previousRatio = previousCreep / creepThreshold;
            const startX = labelWidth + (tokenBarMaxWidth * previousRatio);
            
            return `
                <!-- Creep step for attempt ${attempt.number} -->
                <rect x="${trailMargin + startX}" y="${y + 5}" 
                      width="${stepWidth}" height="22" 
                      fill="${creepColor}" opacity="0.3" rx="3"/>
                <text x="${trailMargin + startX + stepWidth - 3}" y="${y + 18}" 
                      style="font-size: 8px; fill: ${creepColor}; opacity: 0.6; text-anchor: end;">
                    +${creepIncrease}
                </text>
            `;
        }).join('');
        
        return steps;
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
        <g transform="translate(400, 10)">
            <!-- Background card -->
            <rect x="-10" y="-15" width="700" height="70" 
                  fill="${colors.backgroundAlt}" stroke="${colors.border}" 
                  stroke-width="1" rx="6" opacity="0.5"/>
            
            <!-- User name (prominent) -->
            <text x="10" y="10" style="font-size: 22px; font-weight: bold; fill: ${colors.cyan}; letter-spacing: 1px;">
                ${userName}
            </text>
            
            <!-- Result badge -->
            <g transform="translate(500, -5)">
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
            <g transform="translate(10, 40)">
                                <text x="0" y="0" style="font-size: 10px; fill: ${colors.gray}; text-transform: uppercase;">
                    WORDS
                </text>
                <text x="50" y="0" style="font-size: 13px; fill: ${colors.white}; font-weight: bold;">
                    ${matchNum}/${matchTotal}
                </text>
                
                                <text x="110" y="0" style="font-size: 10px; fill: ${colors.gray}; text-transform: uppercase;">
                    ATTEMPTS
                </text>
              <text x="180" y="0" style="font-size: 13px; fill: ${colors.white}; font-weight: bold;">
                    ${attempts}
                </text>
                
                                <text x="230" y="0" style="font-size: 10px; fill: ${colors.gray}; text-transform: uppercase;">
                    TOKENS
                </text>
                <text x="285" y="0" style="font-size: 13px; fill: ${colors.white}; font-weight: bold;">
                    ${tokens}
                </text>
            </g>
            
            <!-- Creep indicator -->
            <g transform="translate(500, 40)">
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
    
    ${creepSteps}
    
    ${attemptVisuals}
    
</svg>
    `.trim();
}
