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
    
    // Get all attempts for visualization (up to 8)
    const recentAttempts = responseTrail.slice(-8);
    
    // Generate cascading token visualization
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = 220 + (idx * 45);
        const x = 80 + (idx * 15); // Cascade effect
        
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
    
    // Calculate final Y position for legend
    const finalY = 220 + (recentAttempts.length * 45) + 20;
    
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
    
    <!-- Header -->
    <text x="60" y="70" style="font-size: 36px; font-weight: bold; fill: ${colors.cyan}; letter-spacing: 3px;">
        ART OF INTENT
    </text>
    
    <!-- Result Badge (Compact) -->
    <g transform="translate(60, 100)">
        <rect x="0" y="0" width="200" height="80" fill="${colors.backgroundAlt}" 
              stroke="${resultColor}" stroke-width="3" rx="8"/>
        <text x="100" y="35" style="font-size: 20px; fill: ${colors.gray}; text-anchor: middle;">
            ${isWin ? '✓' : '✗'} ${result}
        </text>
        <text x="100" y="60" style="font-size: 28px; font-weight: bold; fill: ${resultColor}; text-anchor: middle;">
            ${matchNum}/${matchTotal}
        </text>
    </g>
    
    <!-- Stats Summary (Compact) -->
    <g transform="translate(300, 100)">
        <text x="0" y="25" style="font-size: 16px; fill: ${colors.gray};">
            ATTEMPTS: <tspan style="fill: ${colors.cyan}; font-weight: bold;">${attempts}</tspan>
        </text>
        <text x="0" y="55" style="font-size: 16px; fill: ${colors.gray};">
            TOKENS: <tspan style="fill: ${colors.yellow}; font-weight: bold;">${tokens}</tspan>
        </text>
    </g>
    
    <!-- Response Trail Section -->
    <text x="60" y="200" style="font-size: 14px; fill: ${colors.gray}; text-transform: uppercase; letter-spacing: 1px;">
        Response Trail
    </text>
    <line x1="60" y1="205" x2="1140" y2="205" stroke="${colors.border}" stroke-width="1"/>
    
    ${attemptVisuals}
    
    <!-- Legend -->
    <g transform="translate(80, ${finalY})">
        <text x="0" y="0" style="font-size: 12px; fill: ${colors.gray}; text-transform: uppercase;">
            Legend:
        </text>
        
        <!-- Prompt tokens -->
        <rect x="0" y="10" width="40" height="16" fill="${colors.cyan}" rx="3" opacity="0.8"/>
        <text x="45" y="22" style="font-size: 11px; fill: ${colors.white};">
            Prompt
        </text>
        
        <!-- Output tokens -->
        <rect x="120" y="10" width="40" height="16" fill="${colors.yellow}" rx="3" opacity="0.8"/>
        <text x="165" y="22" style="font-size: 11px; fill: ${colors.white};">
            Output
        </text>
        
        <!-- Hit indicator -->
        <circle cx="240" cy="18" r="6" fill="${colors.green}" stroke="${colors.border}" stroke-width="2"/>
        <text x="255" y="22" style="font-size: 11px; fill: ${colors.white};">
            Match
        </text>
        
        <!-- Blacklist indicator -->
        <circle cx="330" cy="18" r="8" fill="${colors.red}" stroke="${colors.border}" stroke-width="2"/>
        <text x="330" y="22" style="font-size: 14px; fill: ${colors.white}; font-weight: bold; text-anchor: middle;">
            ✗
        </text>
        <text x="345" y="22" style="font-size: 11px; fill: ${colors.white};">
            Blacklist
        </text>
    </g>
    
    <!-- Footer -->
    <line x1="60" y1="580" x2="${width - 60}" y2="580" stroke="${colors.border}" stroke-width="1"/>
    <text x="60" y="605" style="font-size: 18px; font-weight: bold; fill: ${colors.cyan};">
        ${userName}
    </text>
    <text x="${width - 60}" y="605" style="font-size: 16px; fill: ${colors.gray}; text-anchor: end;">
        art-of-intent.netlify.app
    </text>
    
</svg>
    `.trim();
}
