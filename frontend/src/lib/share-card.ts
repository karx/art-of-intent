/**
 * Share card v5 — haiku-forward layout.
 * Ported from src/js/share-card-v5.js + share-card-generator.js.
 */

export interface ShareCardData {
	result: 'WIN' | 'LOSS';
	attempts: number;
	tokens: number;
	matches: string;       // e.g. "2/3"
	date: string;          // YYYY-MM-DD
	userName: string;
	targetWords: string[];
	matchedWords: string[];
	creepLevel: number;
	creepThreshold: number;
	responseTrail: {
		number: number;
		prompt: string;
		response: string;    // the haiku text
		foundWords: string[];
	}[];
}

// ── SVG generation ────────────────────────────────────────────────────────────

function css(varName: string, fallback: string): string {
	if (typeof document !== 'undefined') {
		const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
		return v || fallback;
	}
	return fallback;
}

function xe(s: unknown): string {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function trunc(s: string, max: number): string {
	return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function generateShareCardSVG(data: ShareCardData): string {
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
	} = data;

	const c = {
		bg:     css('--bg-primary',    '#002b36'),
		bgAlt:  css('--bg-secondary',  '#073642'),
		bgDeep: css('--bg-tertiary',   '#073642'),
		border: css('--border-color',  '#586e75'),
		cyan:   css('--accent-blue',   '#2aa198'),
		green:  css('--accent-green',  '#859900'),
		red:    css('--accent-red',    '#dc322f'),
		yellow: css('--accent-yellow', '#b58900'),
		white:  css('--text-primary',  '#93a1a1'),
		dim:    css('--text-secondary','#586e75'),
	};

	const width = 1200;
	const height = 630;
	const isWin = result === 'WIN';
	const resultColor = isWin ? c.green : c.red;
	const [matchNum, matchTotal] = matches.split('/').map(Number);

	// Pick best haiku to feature
	const attemptsWithHits = responseTrail.filter(a => a.foundWords && a.foundWords.length > 0);
	const featured = attemptsWithHits.length > 0
		? attemptsWithHits.reduce((best, a) =>
			a.foundWords.length >= best.foundWords.length ? a : best)
		: responseTrail[responseTrail.length - 1] ?? null;

	const rawLines = featured
		? featured.response.trim().split('\n').map(l => l.trim()).filter(Boolean)
		: ['No haiku generated yet.'];
	const haikuLines = rawLines.slice(0, 4).map(l => trunc(l, 42));
	const featuredWords = featured ? (featured.foundWords ?? []) : [];
	const featuredPrompt = featured ? trunc(featured.prompt ?? '', 58) : '';

	const matchedSet = new Set(matchedWords.map(w => w.toLowerCase()));
	const wordBadges = targetWords.length > 0
		? targetWords.map(w => ({ word: w, matched: matchedSet.has(w.toLowerCase()) }))
		: Array.from({ length: matchTotal }, (_, i) => ({ word: `word${i + 1}`, matched: i < matchNum }));

	const creepPct = Math.min((creepLevel / creepThreshold) * 100, 100);
	const creepBarColor = creepPct >= 75 ? c.red : creepPct >= 50 ? c.yellow : c.green;

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

	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs><style>text { font-family: 'Courier New', Courier, monospace; }</style>
    <clipPath id="haikuClip">
      <rect x="${haikuBoxX + 16}" y="${haikuBoxY + 8}" width="${haikuBoxW - 32}" height="${haikuBoxH - 16}"/>
    </clipPath>
  </defs>

  <rect width="${width}" height="${height}" fill="${c.bg}"/>

  <!-- HEADER -->
  <rect width="${width}" height="${headerH}" fill="${c.bgAlt}"/>
  <line x1="0" y1="${headerH}" x2="${width}" y2="${headerH}" stroke="${c.border}" stroke-width="1"/>
  <text x="${leftPad}" y="47" style="font-size:26px;font-weight:bold;fill:${c.cyan};letter-spacing:3px;">ART OF INTENT</text>
  <text x="${leftPad}" y="68" style="font-size:10px;fill:${c.dim};letter-spacing:2px;">HAIKU CHALLENGE</text>
  <text x="${width - 55}" y="36" style="font-size:12px;fill:${c.dim};text-anchor:end;">${xe(date)}</text>
  <text x="${width - 55}" y="55" style="font-size:18px;font-weight:bold;fill:${resultColor};text-anchor:end;letter-spacing:2px;">${xe(result)}</text>
  <text x="${width - 55}" y="72" style="font-size:13px;fill:${c.cyan};text-anchor:end;">${xe(userName)}</text>

  <!-- BODY -->
  <line x1="${dividerX}" y1="${bodyTop + 20}" x2="${dividerX}" y2="${bodyBot - 20}" stroke="${c.border}" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- LEFT: haiku -->
  <text x="${leftPad}" y="${haikuBoxY - 12}" style="font-size:9px;fill:${c.dim};letter-spacing:2px;">
    ${featuredWords.length > 0 ? `&#x2713; MATCH &#x2014; HAIKU #${featured?.number ?? ''}` : 'HAIKU'}
  </text>
  <rect x="${haikuBoxX}" y="${haikuBoxY}" width="${haikuBoxW}" height="${haikuBoxH}" fill="${c.bgDeep}" rx="6" opacity="0.7"/>
  <rect x="${haikuBoxX}" y="${haikuBoxY}" width="${haikuBoxW}" height="${haikuBoxH}" fill="none" stroke="${c.border}" stroke-width="1" rx="6"/>
  <text x="${haikuBoxX + 14}" y="${haikuBoxY + 44}" style="font-size:52px;fill:${c.cyan};opacity:0.18;font-weight:bold;">&#8220;</text>
  ${haikuLines.map((line, i) => `
  <text x="${haikuBoxX + 28}" y="${haikuBoxY + 46 + i * lineH}" style="font-size:22px;fill:${c.white};letter-spacing:0.5px;" clip-path="url(#haikuClip)">${xe(line)}</text>`).join('')}
  ${featuredWords.length > 0 ? `
  <text x="${haikuBoxX}" y="${haikuBoxY + haikuBoxH + 26}" style="font-size:13px;fill:${c.green};font-weight:bold;">&#x2713; matched: ${xe(featuredWords.join(', '))}</text>` : ''}
  ${featuredPrompt ? `
  <text x="${haikuBoxX}" y="${haikuBoxY + haikuBoxH + 46}" style="font-size:11px;fill:${c.dim};">&gt; ${xe(featuredPrompt)}</text>` : ''}

  <!-- RIGHT: stats -->
  <text x="${rightPad}" y="${bodyTop + 55}" style="font-size:20px;font-weight:bold;fill:${resultColor};letter-spacing:1px;">
    ${isWin ? '&#9733;' : '&#9670;'} ${matchNum}/${matchTotal} WORDS FOUND
  </text>
  ${wordBadges.map((b, i) => {
		const badgeY = bodyTop + 80 + i * 46;
		const badgeColor = b.matched ? c.green : c.dim;
		return `
  <rect x="${rightPad}" y="${badgeY}" width="440" height="34" fill="${c.bgAlt}" stroke="${badgeColor}" stroke-width="1" rx="4" opacity="0.6"/>
  <text x="${rightPad + 12}" y="${badgeY + 22}" style="font-size:15px;fill:${badgeColor};font-weight:bold;">${b.matched ? '&#x2713;' : '&#x2717;'}  ${xe(b.word)}</text>`;
  }).join('')}
  <line x1="${rightPad}" y1="${bodyTop + 80 + wordBadges.length * 46 + 16}" x2="${width - leftPad}" y2="${bodyTop + 80 + wordBadges.length * 46 + 16}" stroke="${c.border}" stroke-width="1"/>
  ${(['ATTEMPTS', 'TOKENS', 'CREEP'] as const).map((label, i) => {
		const vals: Record<string, string> = {
			ATTEMPTS: `${attempts} / 10`,
			TOKENS: tokens.toLocaleString(),
			CREEP: `${creepLevel} / ${creepThreshold}`,
		};
		const sy = bodyTop + 80 + wordBadges.length * 46 + 44 + i * 50;
		const valColor = label === 'CREEP' ? creepBarColor : c.white;
		return `
  <text x="${rightPad}" y="${sy}" style="font-size:9px;fill:${c.dim};letter-spacing:2px;">${label}</text>
  <text x="${rightPad}" y="${sy + 22}" style="font-size:20px;font-weight:bold;fill:${valColor};">${xe(vals[label])}</text>`;
  }).join('')}

  <!-- FOOTER -->
  <line x1="0" y1="${bodyBot}" x2="${width}" y2="${bodyBot}" stroke="${c.border}" stroke-width="1"/>
  <rect y="${bodyBot}" width="${width}" height="${footerH}" fill="${c.bgAlt}"/>
  <text x="${leftPad}" y="${bodyBot + 26}" style="font-size:12px;fill:${c.dim};letter-spacing:1px;">DAILY CHALLENGE · PLAY FREE</text>
  <text x="${leftPad}" y="${bodyBot + 50}" style="font-size:14px;fill:${c.dim};">Can you guide Arty better?</text>
  <text x="${width - leftPad}" y="${bodyBot + 44}" style="font-size:18px;font-weight:bold;fill:${c.cyan};text-anchor:end;letter-spacing:1px;">art-of-intent.netlify.app</text>

</svg>`.trim();
}

// ── Image utilities ───────────────────────────────────────────────────────────

function svgToDataURL(svgString: string): string {
	const encoded = encodeURIComponent(svgString);
	return `data:image/svg+xml,${encoded}`;
}

async function svgToPNG(svgString: string): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		canvas.width  = 1200;
		canvas.height = 630;
		img.onload = () => {
			ctx.drawImage(img, 0, 0);
			canvas.toBlob(blob => {
				blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'));
			}, 'image/png');
		};
		img.onerror = reject;
		img.src = svgToDataURL(svgString);
	});
}

export async function downloadCard(svgString: string, filename = 'art-of-intent-score.png'): Promise<void> {
	const blob = await svgToPNG(svgString);
	const url  = URL.createObjectURL(blob);
	const a    = document.createElement('a');
	a.href     = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Share via Web Share API (mobile) or download PNG (desktop fallback).
 * Returns 'shared' | 'downloaded' | 'cancelled'.
 */
export async function shareCard(
	svgString: string,
	title = 'Art of Intent Score',
	text = '',
): Promise<'shared' | 'downloaded' | 'cancelled'> {
	const blob = await svgToPNG(svgString);
	const file = new File([blob], 'art-of-intent-score.png', { type: 'image/png' });

	if (navigator.share) {
		try {
			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ title, text, files: [file] });
			} else {
				await navigator.share({ title, text, url: 'https://art-of-intent.netlify.app' });
			}
			return 'shared';
		} catch (err: any) {
			if (err.name === 'AbortError') return 'cancelled';
			throw err;
		}
	}

	await downloadCard(svgString);
	return 'downloaded';
}

export function previewCard(svgString: string): void {
	const overlay = document.createElement('div');
	overlay.style.cssText = `
		position:fixed;top:0;left:0;right:0;bottom:0;
		background:rgba(0,0,0,0.9);display:flex;align-items:center;
		justify-content:center;z-index:10000;padding:20px;cursor:pointer;
	`;
	const img = document.createElement('img');
	img.src = svgToDataURL(svgString);
	img.style.cssText = 'max-width:100%;max-height:100%;border:2px solid #2aa198;';
	overlay.appendChild(img);
	overlay.addEventListener('click', () => document.body.removeChild(overlay));
	document.body.appendChild(overlay);
}
