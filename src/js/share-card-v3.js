// ============================================
// Share Card Generator V3
// Minimalist design with response trail visualization
// ============================================

function generateShareCardV3(data) {
    const {
        result = 'WIN',
        attempts = 0,
        tokens = 0,
        matches = '0/3',
        userName = 'Guest',
        responseTrail = [],
        globalMaxTokens = 1000
    } = data;
    
    const width = 1200;
    const height = 630;
    const colors = {
        background: '#002b36',
        backgroundAlt: '#073642',
        border: '#586e75',
        cyan: '#2aa198',
        green: '#859900',
        red: '#dc322f',
        yellow: '#b58900',
        white: '#93a1a1',
        gray: '#586e75',
        dim: '#073642'
    };
    
    const isWin = result === 'WIN';
    const resultColor = isWin ? colors.green : colors.red;
    const [matchNum, matchTotal] = matches.split('/').map(Number);
    
    // Calculate available space for trail
    const trailStartY = 195;
    const footerMargin = 40;
    const availableHeight = height - trailStartY - footerMargin;
    
    // Get all attempts for visualization
    const maxAttempts = Math.min(responseTrail.length, 10);
    const recentAttempts = responseTrail.slice(-maxAttempts);
    
    // Calculate spacing to fit available space
    const attemptHeight = Math.min(45, Math.floor(availableHeight / maxAttempts));
    const cascadeOffset = Math.min(12, Math.floor(attemptHeight / 4));
    
    // Generate cascading token visualization
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = trailStartY + (idx * attemptHeight);
        const x = 80 + (idx * cascadeOffset); // Cascade effect
        
        // Calculate token split widths (max 800px total)
        const maxWidth = 800;
        const promptWidth = Math.min((attempt.promptTokens / 200) * maxWidth, maxWidth * 0.6);
        const outputWidth = Math.min((attempt.outputTokens / 200) * maxWidth, maxWidth * 0.4);
        
        // Determine hit status
        const isViolation = attempt.violation || false;
        const hitCount = attempt.foundWords ? attempt.foundWords.length : 0;
        const hasHits = hitCount > 0;
        
        // Generate hit indicators
        let hitIndicators = '';
        if (isViolation) {
            // Red X for blacklist violation
            hitIndicators = `
                <circle cx="${30 + promptWidth + outputWidth + 20}" cy="17" r="8" 
                        fill="${colors.red}" stroke="${colors.border}" stroke-width="2"/>
                <text x="${30 + promptWidth + outputWidth + 20}" y="21" 
                      style="font-size: 14px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
                    ✗
                </text>
            `;
        } else if (hasHits) {
            // Multiple green circles for multiple hits
            for (let i = 0; i < Math.min(hitCount, 3); i++) {
                const circleX = 30 + promptWidth + outputWidth + 20 + (i * 14);
                hitIndicators += `
                    <circle cx="${circleX}" cy="17" r="6" 
                            fill="${colors.green}" stroke="${colors.border}" stroke-width="2"/>
                `;
            }
            // Show count if more than 3
            if (hitCount > 3) {
                hitIndicators += `
                    <text x="${30 + promptWidth + outputWidth + 20 + (3 * 14)}" y="20" 
                          style="font-size: 11px; fill: ${colors.green}; font-weight: bold;">
                        +${hitCount - 3}
                    </text>
                `;
            }
        } else {
            // Gray circle for no hits
            hitIndicators = `
                <circle cx="${30 + promptWidth + outputWidth + 20}" cy="17" r="6" 
                        fill="${colors.gray}" stroke="${colors.border}" stroke-width="2" opacity="0.5"/>
            `;
        }
        
        return `
        <!-- Attempt ${attempt.number} -->
        <g transform="translate(${x}, ${y})">
            <!-- Attempt number -->
            <text x="0" y="18" style="font-size: 14px; fill: ${colors.gray}; font-weight: bold;">
                ${attempt.number}
            </text>
            
            <!-- Prompt tokens (cyan) -->
            <rect x="30" y="5" width="${promptWidth}" height="24" fill="${colors.cyan}" rx="4" opacity="0.8"/>
            
            <!-- Output tokens (yellow) -->
            <rect x="${30 + promptWidth}" y="5" width="${outputWidth}" height="24" fill="${colors.yellow}" rx="4" opacity="0.8"/>
            
            <!-- Hit indicators -->
            ${hitIndicators}
            
            <!-- Total tokens label -->
            <text x="${30 + promptWidth + outputWidth + 70}" y="20" 
                  style="font-size: 12px; fill: ${colors.white};">
                ${attempt.totalTokens}
            </text>
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
    
    <!-- Header with Branding -->
    <g transform="translate(60, 50)">
        <text x="0" y="30" style="font-size: 42px; font-weight: bold; fill: ${colors.cyan}; letter-spacing: 4px;">
            ART OF INTENT
        </text>
        <text x="0" y="55" style="font-size: 16px; fill: ${colors.gray}; letter-spacing: 2px;">
            HAIKU CHALLENGE
        </text>
        <text x="0" y="75" style="font-size: 14px; fill: ${colors.border};">
            art-of-intent.netlify.app
        </text>
    </g>
    
    <!-- User Info Card -->
    <g transform="translate(700, 50)">
        <rect x="0" y="0" width="440" height="90" fill="${colors.backgroundAlt}" 
              stroke="${colors.border}" stroke-width="2" rx="8"/>
        
        <!-- User name -->
        <text x="20" y="30" style="font-size: 20px; font-weight: bold; fill: ${colors.cyan};">
            ${userName}
        </text>
        
        <!-- Result -->
        <text x="20" y="55" style="font-size: 16px; fill: ${colors.gray};">
            RESULT: <tspan style="fill: ${resultColor}; font-weight: bold; font-size: 18px;">${result}</tspan>
        </text>
        
        <!-- Stats -->
        <text x="20" y="75" style="font-size: 14px; fill: ${colors.gray};">
            ${matchNum}/${matchTotal} words · ${attempts} attempts · ${tokens} tokens
        </text>
    </g>
    
    <!-- Response Trail Section -->
    <text x="60" y="170" style="font-size: 16px; fill: ${colors.gray}; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
        Response Trail
    </text>
    <line x1="60" y1="175" x2="1140" y2="175" stroke="${colors.border}" stroke-width="1"/>
    
    ${attemptVisuals}
    
</svg>
    `.trim();
}
