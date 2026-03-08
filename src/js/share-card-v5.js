// ============================================
// Share Card Generator V5
// Haiku-forward design: the poem is the hook.
// Layout: featured haiku (left) + stats (right) + CTA footer
// ============================================

function generateShareCardV5(data) {
    const {
        result = 'WIN',
        attempts = 0,
        tokens = 0,
        matches = '0/3',
        userName = 'Guest',
        responseTrail = [],
        targetWords = [],
        matchedWords = [],
        creepLevel = 0,
        creepThreshold = 100,
        date = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    } = data;

    const width = 1200;
    const height = 630;

    // Read theme colors from CSS variables, with Solarized fallbacks
    const css = (varName, fallback) => {
        if (typeof document !== 'undefined') {
            const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            return v || fallback;
        }
        return fallback;
    };

    const c = {
        bg:      css('--bg-primary',    '#002b36'),
        bgAlt:   css('--bg-secondary',  '#073642'),
        bgDeep:  css('--bg-tertiary',   '#073642'),
        border:  css('--border-color',  '#586e75'),
        cyan:    css('--accent-blue',   '#2aa198'),
        green:   css('--accent-green',  '#859900'),
        red:     css('--accent-red',    '#dc322f'),
        yellow:  css('--accent-yellow', '#b58900'),
        white:   css('--text-primary',  '#93a1a1'),
        dim:     css('--text-secondary','#586e75'),
    };

    const isWin = result === 'WIN';
    const resultColor = isWin ? c.green : c.red;
    const [matchNum, matchTotal] = matches.split('/').map(Number);

    // Escape XML special characters
    const x = s => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // Truncate a string, adding ellipsis if needed
    const trunc = (s, max) => s.length > max ? s.slice(0, max - 1) + '…' : s;

    // ── Pick the featured haiku ──────────────────────────────────────────────
    // Prefer the attempt that found the most target words.
    // Tie-break: the most recent one.
    const attemptsWithHits = responseTrail.filter(a => a.foundWords && a.foundWords.length > 0);
    const featured = attemptsWithHits.length > 0
        ? attemptsWithHits.reduce((best, a) =>
            a.foundWords.length >= best.foundWords.length ? a : best)
        : responseTrail[responseTrail.length - 1] || null;

    // Split haiku into lines (API returns newline-separated lines)
    const rawLines = featured
        ? featured.response.trim().split('\n').map(l => l.trim()).filter(Boolean)
        : ['No haiku generated yet.'];

    // Limit to 4 lines for safety; truncate each line for overflow
    const haikuLines = rawLines.slice(0, 4).map(l => trunc(l, 42));

    // Words matched in the featured haiku
    const featuredWords = featured ? (featured.foundWords || []) : [];

    // Prompt that triggered the featured haiku (truncated)
    const featuredPrompt = featured ? trunc(featured.prompt || '', 58) : '';

    // ── Word badge data ──────────────────────────────────────────────────────
    // Build list of all target words with their matched status
    const matchedSet = new Set(
        Array.isArray(matchedWords) ? matchedWords.map(w => w.toLowerCase()) : []
    );
    const wordBadges = targetWords.length > 0
        ? targetWords.map(w => ({ word: w, matched: matchedSet.has(w.toLowerCase()) }))
        : Array.from({ length: matchTotal }, (_, i) => ({
            word: `word${i + 1}`,
            matched: i < matchNum
        }));

    // ── Creep bar ────────────────────────────────────────────────────────────
    const creepPct = Math.min((creepLevel / creepThreshold) * 100, 100);
    const creepBarColor = creepPct >= 75 ? c.red : creepPct >= 50 ? c.yellow : c.green;

    // ── Layout constants ─────────────────────────────────────────────────────
    const headerH   = 80;
    const footerH   = 70;
    const bodyTop   = headerH;
    const bodyBot   = height - footerH;
    const dividerX  = 660;
    const leftPad   = 55;
    const rightPad  = dividerX + 40;

    // Haiku box
    const haikuBoxX = leftPad;
    const haikuBoxY = bodyTop + 40;
    const haikuBoxW = dividerX - leftPad - 30;
    const lineH     = 38;
    const haikuBoxH = Math.max(haikuLines.length * lineH + 60, 160);

    // ── SVG ──────────────────────────────────────────────────────────────────
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            text { font-family: 'Courier New', Courier, monospace; }
        </style>
        <clipPath id="haikuClip">
            <rect x="${haikuBoxX + 16}" y="${haikuBoxY + 8}"
                  width="${haikuBoxW - 32}" height="${haikuBoxH - 16}"/>
        </clipPath>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="${c.bg}"/>

    <!-- ── HEADER ── -->
    <rect width="${width}" height="${headerH}" fill="${c.bgAlt}"/>
    <line x1="0" y1="${headerH}" x2="${width}" y2="${headerH}"
          stroke="${c.border}" stroke-width="1"/>

    <!-- Branding -->
    <text x="${leftPad}" y="47"
          style="font-size:26px; font-weight:bold; fill:${c.cyan}; letter-spacing:3px;">
        ART OF INTENT
    </text>
    <text x="${leftPad}" y="68"
          style="font-size:10px; fill:${c.dim}; letter-spacing:2px; text-transform:uppercase;">
        HAIKU CHALLENGE
    </text>

    <!-- Date + result + user (right-aligned) -->
    <text x="${width - 55}" y="36"
          style="font-size:12px; fill:${c.dim}; text-anchor:end;">
        ${x(date)}
    </text>
    <text x="${width - 55}" y="55"
          style="font-size:18px; font-weight:bold; fill:${resultColor}; text-anchor:end; letter-spacing:2px;">
        ${x(result)}
    </text>
    <text x="${width - 55}" y="72"
          style="font-size:13px; fill:${c.cyan}; text-anchor:end;">
        ${x(userName)}
    </text>

    <!-- ── BODY ── -->

    <!-- Vertical divider -->
    <line x1="${dividerX}" y1="${bodyTop + 20}" x2="${dividerX}" y2="${bodyBot - 20}"
          stroke="${c.border}" stroke-width="1" stroke-dasharray="4,4"/>

    <!-- ── LEFT: Featured Haiku ── -->

    <!-- Section label -->
    <text x="${leftPad}" y="${haikuBoxY - 12}"
          style="font-size:9px; fill:${c.dim}; letter-spacing:2px; text-transform:uppercase;">
        ${featuredWords.length > 0 ? '✓ MATCH — HAIKU #' + (featured ? featured.number : '') : 'HAIKU'}
    </text>

    <!-- Haiku box background -->
    <rect x="${haikuBoxX}" y="${haikuBoxY}"
          width="${haikuBoxW}" height="${haikuBoxH}"
          fill="${c.bgDeep}" rx="6" opacity="0.7"/>
    <rect x="${haikuBoxX}" y="${haikuBoxY}"
          width="${haikuBoxW}" height="${haikuBoxH}"
          fill="none" stroke="${c.border}" stroke-width="1" rx="6"/>

    <!-- Decorative opening quote -->
    <text x="${haikuBoxX + 14}" y="${haikuBoxY + 44}"
          style="font-size:52px; fill:${c.cyan}; opacity:0.18; font-weight:bold;">
        &#8220;
    </text>

    <!-- Haiku lines -->
    ${haikuLines.map((line, i) => `
    <text x="${haikuBoxX + 28}" y="${haikuBoxY + 46 + i * lineH}"
          style="font-size:22px; fill:${c.white}; letter-spacing:0.5px;"
          clip-path="url(#haikuClip)">
        ${x(line)}
    </text>`).join('')}

    <!-- Matched words indicator (shown below box) -->
    ${featuredWords.length > 0 ? `
    <text x="${haikuBoxX}" y="${haikuBoxY + haikuBoxH + 26}"
          style="font-size:13px; fill:${c.green}; font-weight:bold;">
        ✓ matched: ${x(featuredWords.join(', '))}
    </text>` : ''}

    <!-- Prompt that triggered it -->
    ${featuredPrompt ? `
    <text x="${haikuBoxX}" y="${haikuBoxY + haikuBoxH + 46}"
          style="font-size:11px; fill:${c.dim};">
        &gt; ${x(featuredPrompt)}
    </text>` : ''}

    <!-- ── RIGHT: Stats ── -->

    <!-- Words found headline -->
    <text x="${rightPad}" y="${bodyTop + 55}"
          style="font-size:20px; font-weight:bold; fill:${resultColor}; letter-spacing:1px;">
        ${isWin ? '★' : '◆'} ${matchNum}/${matchTotal} WORDS FOUND
    </text>

    <!-- Word badges -->
    ${wordBadges.map((b, i) => {
        const badgeY = bodyTop + 80 + i * 46;
        const badgeColor = b.matched ? c.green : c.dim;
        return `
    <rect x="${rightPad}" y="${badgeY}"
          width="440" height="34"
          fill="${c.bgAlt}" stroke="${badgeColor}" stroke-width="1" rx="4" opacity="0.6"/>
    <text x="${rightPad + 12}" y="${badgeY + 22}"
          style="font-size:15px; fill:${badgeColor}; font-weight:bold;">
        ${b.matched ? '✓' : '✗'}  ${x(b.word)}
    </text>`;
    }).join('')}

    <!-- Stats divider -->
    <line x1="${rightPad}" y1="${bodyTop + 80 + wordBadges.length * 46 + 16}"
          x2="${width - leftPad}" y2="${bodyTop + 80 + wordBadges.length * 46 + 16}"
          stroke="${c.border}" stroke-width="1"/>

    <!-- Stats block -->
    ${[
        ['ATTEMPTS', `${attempts} / 10`],
        ['TOKENS',   tokens.toLocaleString()],
        ['CREEP',    `${creepLevel} / ${creepThreshold}`],
    ].map(([label, val], i) => {
        const sy = bodyTop + 80 + wordBadges.length * 46 + 44 + i * 50;
        const valColor = label === 'CREEP' ? creepBarColor : c.white;
        return `
    <text x="${rightPad}" y="${sy}"
          style="font-size:9px; fill:${c.dim}; letter-spacing:2px; text-transform:uppercase;">
        ${label}
    </text>
    <text x="${rightPad}" y="${sy + 22}"
          style="font-size:20px; font-weight:bold; fill:${valColor};">
        ${x(val)}
    </text>`;
    }).join('')}

    <!-- ── FOOTER ── -->
    <line x1="0" y1="${bodyBot}" x2="${width}" y2="${bodyBot}"
          stroke="${c.border}" stroke-width="1"/>
    <rect y="${bodyBot}" width="${width}" height="${footerH}" fill="${c.bgAlt}"/>

    <text x="${leftPad}" y="${bodyBot + 26}"
          style="font-size:12px; fill:${c.dim}; letter-spacing:1px;">
        DAILY CHALLENGE · PLAY FREE
    </text>
    <text x="${leftPad}" y="${bodyBot + 50}"
          style="font-size:14px; fill:${c.dim};">
        Can you guide Arty better?
    </text>
    <text x="${width - leftPad}" y="${bodyBot + 44}"
          style="font-size:18px; font-weight:bold; fill:${c.cyan}; text-anchor:end; letter-spacing:1px;">
        art-of-intent.netlify.app
    </text>

</svg>`.trim();
}
