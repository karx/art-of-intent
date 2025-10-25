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
    
    // Get last 3 attempts for visualization
    const recentAttempts = responseTrail.slice(-3);
    
    // Generate attempt visualizations
    const attemptVisuals = recentAttempts.map((attempt, idx) => {
        const y = 220 + (idx * 110);
        const tokenPercent = Math.min((attempt.totalTokens / 200) * 100, 100);
        const hasHits = attempt.foundWords && attempt.foundWords.length > 0;
        const hitColor = hasHits ? colors.green : colors.gray;
        
        return `
        <!-- Attempt ${attempt.number} -->
        <g transform="translate(80, ${y})">
            <!-- Attempt number -->
            <text x="0" y="20" style="font-size: 16px; fill: ${colors.gray}; text-transform: uppercase;">
                #${attempt.number}
            </text>
            
            <!-- Token bar -->
            <rect x="60" y="5" width="400" height="20" fill="${colors.dim}" rx="4"/>
            <rect x="60" y="5" width="${tokenPercent * 4}" height="20" fill="${colors.yellow}" rx="4"/>
            <text x="470" y="20" style="font-size: 14px; fill: ${colors.white};">
                ${attempt.totalTokens} tok
            </text>
            
            <!-- Hits indicator -->
            <circle cx="550" cy="15" r="8" fill="${hitColor}" stroke="${colors.border}" stroke-width="2"/>
            ${hasHits ? `<text x="570" y="20" style="font-size: 14px; fill: ${colors.green}; font-weight: bold;">
                ${attempt.foundWords.join(', ')}
            </text>` : ''}
            
            <!-- Prompt preview (truncated) -->
            <text x="60" y="50" style="font-size: 13px; fill: ${colors.gray}; font-style: italic;">
                "${attempt.prompt.substring(0, 80)}${attempt.prompt.length > 80 ? '...' : ''}"
            </text>
        </g>
        `;
    }).join('');
    
    // Final prompt (if game is complete)
    const finalAttempt = responseTrail[responseTrail.length - 1];
    const finalPromptY = 220 + (recentAttempts.length * 110);
    
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
    
    ${finalAttempt && isWin ? `
    <!-- Final Result -->
    <g transform="translate(80, ${finalPromptY})">
        <rect x="0" y="0" width="1040" height="60" fill="${colors.backgroundAlt}" 
              stroke="${colors.green}" stroke-width="2" rx="6"/>
        <text x="20" y="25" style="font-size: 14px; fill: ${colors.green}; font-weight: bold;">
            WINNING PROMPT:
        </text>
        <text x="20" y="45" style="font-size: 12px; fill: ${colors.white}; font-style: italic;">
            "${finalAttempt.prompt.substring(0, 100)}${finalAttempt.prompt.length > 100 ? '...' : ''}"
        </text>
    </g>
    ` : ''}
    
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
