// ============================================
// Share Card Generator V6
// V5 base + cheat-session awareness.
//
// When data.cheated === true:
//   - A gold diagonal ribbon is stamped across the top-right corner.
//   - The result badge turns gold (#c8a020) instead of green/red.
//   - "SCORE: NOT RANKED  ✦" replaces the numeric score in the stats block.
//   - The footer CTA swaps to "cheated with style" copy.
// Everything else is identical to V5.
// ============================================

function generateShareCardV6(data) {
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
        date = new Date().toLocaleDateString('en-CA'),
        cheated = false,
        efficiencyScore = null,
    } = data;

    const width  = 1200;
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
        gold:    '#c8a020',
    };

    const isWin = result === 'WIN';
    // Cheat sessions always show in gold; normal sessions green/red as usual.
    const resultColor = cheated ? c.gold : (isWin ? c.green : c.red);
    const [matchNum, matchTotal] = matches.split('/').map(Number);

    // Escape XML special chars
    const x = s => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const trunc = (s, max) => s.length > max ? s.slice(0, max - 1) + '…' : s;

    // ── Pick the featured haiku ──────────────────────────────────────────────
    const attemptsWithHits = responseTrail.filter(a => a.foundWords && a.foundWords.length > 0);
    const featured = attemptsWithHits.length > 0
        ? attemptsWithHits.reduce((best, a) =>
            a.foundWords.length >= best.foundWords.length ? a : best)
        : responseTrail[responseTrail.length - 1] || null;

    const rawLines = featured
        ? featured.response.trim().split('\n').map(l => l.trim()).filter(Boolean)
        : ['No haiku generated yet.'];

    const haikuLines = rawLines.slice(0, 4).map(l => trunc(l, 42));
    const featuredPrompt = featured ? trunc(featured.prompt || '', 58) : '';
    const featuredWords  = featured ? (featured.foundWords || []) : [];

    // ── Word badges ──────────────────────────────────────────────────────────
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
    const creepPct      = Math.min((creepLevel / creepThreshold) * 100, 100);
    const creepBarColor = creepPct >= 75 ? c.red : creepPct >= 50 ? c.yellow : c.green;

    // ── Layout constants (same as V5) ────────────────────────────────────────
    const headerH  = 80;
    const footerH  = 70;
    const bodyTop  = headerH;
    const bodyBot  = height - footerH;
    const dividerX = 660;
    const leftPad  = 55;
    const rightPad = dividerX + 40;

    const haikuBoxX = leftPad;
    const haikuBoxY = bodyTop + 40;
    const haikuBoxW = dividerX - leftPad - 30;
    const lineH     = 38;
    const haikuBoxH = Math.max(haikuLines.length * lineH + 60, 160);

    // Score row data
    const scoreLabel = cheated ? 'NOT RANKED  ✦' : (efficiencyScore !== null ? String(efficiencyScore) : '—');
    const scoreColor = cheated ? c.gold : c.white;

    // ── Cheat ribbon (diagonal stamp, top-right corner) ──────────────────────
    // Drawn as a rotated gold rectangle + text, clipped to card bounds.
    const cheatRibbon = cheated ? `
    <!-- Cheat ribbon -->
    <defs>
        <clipPath id="ribbonClip">
            <rect width="${width}" height="${height}"/>
        </clipPath>
    </defs>
    <g clip-path="url(#ribbonClip)">
        <!-- Gold diagonal band -->
        <rect x="${width - 200}" y="-60"
              width="260" height="260"
              fill="${c.gold}" opacity="0.13"
              transform="rotate(45 ${width - 70} 70)"/>
        <!-- Text label on the band -->
        <g transform="translate(${width - 42}, 8) rotate(45)">
            <text style="font-size:11px; font-family:'Courier New',monospace;
                         fill:${c.gold}; font-weight:bold; letter-spacing:2px;
                         text-anchor:middle;">
                ✦ CHEAT SESSION
            </text>
        </g>
    </g>` : '';

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
    ${cheated
        ? `<rect width="${width}" height="3" fill="${c.gold}" opacity="0.6"/>`
        : `<line x1="0" y1="${headerH}" x2="${width}" y2="${headerH}" stroke="${c.border}" stroke-width="1"/>`
    }

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
        ${x(result)}${cheated ? ' ✦' : ''}
    </text>
    <text x="${width - 55}" y="72"
          style="font-size:13px; fill:${c.cyan}; text-anchor:end;">
        ${x(userName)}
    </text>

    <!-- Cheat ribbon stamp -->
    ${cheatRibbon}

    <!-- ── BODY ── -->

    <!-- Vertical divider -->
    <line x1="${dividerX}" y1="${bodyTop + 20}" x2="${dividerX}" y2="${bodyBot - 20}"
          stroke="${c.border}" stroke-width="1" stroke-dasharray="4,4"/>

    <!-- ── LEFT: Featured Haiku ── -->

    <!-- Section label -->
    <text x="${haikuBoxX}" y="${haikuBoxY - 12}"
          style="font-size:9px; fill:${c.dim}; letter-spacing:2px; text-transform:uppercase;">
        ${featured && featured.isCheat
            ? `✦ CHEAT CODE — ${x(featured.cheatCode ? featured.cheatCode.title : 'CLASSIC HAIKU')}`
            : featuredWords.length > 0
                ? '✓ MATCH — HAIKU #' + (featured ? featured.number : '')
                : 'HAIKU'
        }
    </text>

    <!-- Haiku box background -->
    <rect x="${haikuBoxX}" y="${haikuBoxY}"
          width="${haikuBoxW}" height="${haikuBoxH}"
          fill="${c.bgDeep}" rx="6" opacity="0.7"/>
    <rect x="${haikuBoxX}" y="${haikuBoxY}"
          width="${haikuBoxW}" height="${haikuBoxH}"
          fill="none"
          stroke="${cheated && featured && featured.isCheat ? c.gold : c.border}"
          stroke-width="${cheated && featured && featured.isCheat ? '1.5' : '1'}"
          rx="6"/>

    <!-- Decorative opening quote -->
    <text x="${haikuBoxX + 14}" y="${haikuBoxY + 44}"
          style="font-size:52px; fill:${cheated ? c.gold : c.cyan}; opacity:0.18; font-weight:bold;">
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

    <!-- Prompt / cheat code attribution -->
    ${featuredPrompt ? `
    <text x="${haikuBoxX}" y="${haikuBoxY + haikuBoxH + 46}"
          style="font-size:11px; fill:${cheated && featured && featured.isCheat ? c.gold : c.dim};">
        ${cheated && featured && featured.isCheat
            ? `✦ ${x(featuredPrompt)}`
            : `&gt; ${x(featuredPrompt)}`
        }
    </text>` : ''}

    <!-- ── RIGHT: Stats ── -->

    <!-- Words found headline -->
    <text x="${rightPad}" y="${bodyTop + 55}"
          style="font-size:20px; font-weight:bold; fill:${resultColor}; letter-spacing:1px;">
        ${isWin ? '★' : '◆'} ${matchNum}/${matchTotal} WORDS FOUND
    </text>

    <!-- Word badges -->
    ${wordBadges.map((b, i) => {
        const badgeY     = bodyTop + 80 + i * 46;
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

    <!-- Stats block: ATTEMPTS, TOKENS, CREEP, SCORE -->
    ${[
        ['ATTEMPTS', `${attempts} / 10`,         c.white],
        ['TOKENS',   tokens.toLocaleString(),     c.white],
        ['CREEP',    `${creepLevel} / ${creepThreshold}`, creepBarColor],
        ['SCORE',    scoreLabel,                  scoreColor],
    ].map(([label, val, valColor], i) => {
        const sy = bodyTop + 80 + wordBadges.length * 46 + 44 + i * 50;
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
          stroke="${cheated ? c.gold : c.border}" stroke-width="${cheated ? '1.5' : '1'}" opacity="${cheated ? '0.5' : '1'}"/>
    <rect y="${bodyBot}" width="${width}" height="${footerH}" fill="${c.bgAlt}"/>

    ${cheated ? `
    <text x="${leftPad}" y="${bodyBot + 26}"
          style="font-size:12px; fill:${c.gold}; letter-spacing:1px; opacity:0.8;">
        ✦ CHEAT SESSION · NOT ON LEADERBOARD
    </text>
    <text x="${leftPad}" y="${bodyBot + 50}"
          style="font-size:13px; fill:${c.dim};">
        The masters winked back. Play fair tomorrow?
    </text>` : `
    <text x="${leftPad}" y="${bodyBot + 26}"
          style="font-size:12px; fill:${c.dim}; letter-spacing:1px;">
        DAILY CHALLENGE · PLAY FREE
    </text>
    <text x="${leftPad}" y="${bodyBot + 50}"
          style="font-size:14px; fill:${c.dim};">
        Can you guide Arty better?
    </text>`}

    <text x="${width - leftPad}" y="${bodyBot + 44}"
          style="font-size:18px; font-weight:bold; fill:${c.cyan}; text-anchor:end; letter-spacing:1px;">
        art-of-intent.netlify.app
    </text>

</svg>`.trim();
}
