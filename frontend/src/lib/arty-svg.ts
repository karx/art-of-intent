/**
 * Arty SVG Widget — state-driven figurine for Art of Intent.
 * All coordinates live in a 200×200 space; callers control display size
 * by setting width/height on the outer <svg>.
 */

export interface ArtyState {
	creepLevel: number;      // 0–100
	totalTokens: number;     // cumulative tokens used
	attemptCount: number;    // how many attempts so far
	matchedCount: number;    // 0–3 target words found
	loading: boolean;        // AI is generating
	gameOver: boolean;
	wonGame: boolean;
	lastPromptPersonal?: boolean; // emotional/personal phrasing in last prompt
	animated?: boolean;           // include SVG animations (false for share-card PNG)
	idPrefix?: string;            // unique prefix for filter IDs when embedding in another SVG
}

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
	CYAN:  '#00FFFF',
	GREEN: '#00FF00',
	AMBER: '#FFBF00',
	RED:   '#FF0000',
	BLACK: '#000000',
} as const;

// ── Inner content (200×200 viewBox, no outer <svg> wrapper) ──────────────────
export function generateArtyInner(state: ArtyState): string {
	const {
		creepLevel     = 0,
		totalTokens    = 0,
		attemptCount   = 0,
		matchedCount   = 0,
		loading        = false,
		gameOver       = false,
		wonGame        = false,
		lastPromptPersonal = false,
		animated       = true,
		idPrefix       = 'arty',
	} = state;

	const isDefeat    = gameOver && !wonGame;
	const isVictory   = gameOver && wonGame;
	const isIdle      = !loading && !gameOver;

	// ── State-driven colour ──
	const bodyColor =
		isVictory        ? C.CYAN
		: isDefeat       ? C.RED
		: loading        ? C.AMBER
		: creepLevel >= 75 ? C.RED
		: creepLevel >= 50 ? C.AMBER
		: C.CYAN;

	const horizColor =
		creepLevel >= 75 ? C.RED
		: creepLevel >= 50 ? C.AMBER
		: C.GREEN;

	const statusText =
		isVictory        ? 'VICTORY'
		: isDefeat       ? 'DARKNESS'
		: loading        ? 'THINKING'
		: matchedCount > 0 ? `${matchedCount}/3 FOUND`
		: 'IDLE';

	const statusColor =
		isVictory ? C.CYAN : isDefeat ? C.RED : loading ? C.AMBER : C.GREEN;

	// ── Figure geometry (200×200 space) ──
	const lean = lastPromptPersonal ? -4 : 0; // lean left for personal prompts
	const hcx  = 100 + lean;  // head centre X
	const hcy  = 70;          // head centre Y
	const hrx  = 22;          // head radius X
	const hry  = 20;          // head radius Y

	const avgTokens = attemptCount > 0 ? totalTokens / attemptCount : 0;
	const isHeavy   = avgTokens >= 60 || totalTokens >= 150;

	// ── Filter defs ──
	function glitchDef(): string {
		if (creepLevel < 75 || isVictory) return '';
		const freqAnim = animated
			? `<animate attributeName="baseFrequency" values="0.04 0.02;0.09 0.06;0.04 0.02" dur="0.35s" repeatCount="indefinite"/>`
			: '';
		return `<filter id="${idPrefix}glitch" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.02" numOctaves="1" result="noise">${freqAnim}</feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
	}

	function glowDef(): string {
		if (!isVictory) return '';
		return `<filter id="${idPrefix}glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
	}

	// ── Horizon line ──
	function horizon(): string {
		if (creepLevel >= 75) {
			return `<path d="M12,165 L34,159 L56,171 L78,159 L100,171 L122,159 L144,171 L166,159 L188,165"
        fill="none" stroke="${horizColor}" stroke-width="1.5" stroke-linecap="round"/>`;
		}
		if (creepLevel >= 50) {
			return `<path d="M12,165 C42,160 72,170 100,165 S158,160 188,165"
        fill="none" stroke="${horizColor}" stroke-width="1"/>`;
		}
		if (creepLevel >= 25) {
			return `<path d="M12,165 Q100,162 188,165"
        fill="none" stroke="${horizColor}" stroke-width="1"/>`;
		}
		return `<line x1="12" y1="165" x2="188" y2="165" stroke="${horizColor}" stroke-width="1"/>`;
	}

	// ── Mouth shape ──
	function mouth(): string {
		const my = hcy - hry + 33; // = 83 when hcy=70, hry=20
		if (isVictory)
			return `<path d="M${hcx-8},${my} Q${hcx},${my+6} ${hcx+8},${my}" fill="none" stroke="${bodyColor}" stroke-width="1.5" stroke-linecap="round"/>`;
		if (isDefeat)
			return `<path d="M${hcx-8},${my+4} Q${hcx},${my} ${hcx+8},${my+4}" fill="none" stroke="${bodyColor}" stroke-width="1.5" stroke-linecap="round"/>`;
		if (loading)
			return `<path d="M${hcx-6},${my+1} Q${hcx},${my-2} ${hcx+6},${my+1}" fill="none" stroke="${bodyColor}" stroke-width="1.5" stroke-linecap="round"/>`;
		return `<line x1="${hcx-7}" y1="${my}" x2="${hcx+7}" y2="${my}" stroke="${bodyColor}" stroke-width="1.5" stroke-linecap="round"/>`;
	}

	// ── Arms (jagged when creep ≥ 75) ──
	function arms(): string {
		const bodyTop = hcy + hry + 6; // = 96
		const lx1 = hcx - 18, ry1 = bodyTop + 16; // = 112
		const rx1 = hcx + 18;
		if (creepLevel >= 75) {
			return [
				`<path d="M${lx1},${ry1} L${hcx-28},${ry1-5} L${hcx-37},${ry1+13}" fill="none" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
				`<path d="M${rx1},${ry1} L${hcx+28},${ry1-5} L${hcx+37},${ry1+13}" fill="none" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
			].join('');
		}
		return [
			`<line x1="${lx1}" y1="${ry1}" x2="${hcx-37}" y2="${ry1+13}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>`,
			`<line x1="${rx1}" y1="${ry1}" x2="${hcx+37}" y2="${ry1+13}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>`,
		].join('');
	}

	// ── Extra nodes on body for high-token (heavy) mode ──
	function heavyNodes(): string {
		if (!isHeavy) return '';
		return [
			`<circle cx="${hcx}" cy="119" r="3" fill="none" stroke="${bodyColor}" stroke-width="1" opacity="0.6"/>`,
			`<circle cx="${hcx-8}" cy="129" r="2" fill="none" stroke="${bodyColor}" stroke-width="1" opacity="0.5"/>`,
			`<circle cx="${hcx+8}" cy="129" r="2" fill="none" stroke="${bodyColor}" stroke-width="1" opacity="0.5"/>`,
		].join('');
	}

	// ── Loading spinner overlay ──
	function spinner(): string {
		if (!loading) return '';
		const rotAnim = animated
			? `<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.9s" additive="sum" repeatCount="indefinite"/>`
			: '';
		return `<g transform="translate(${hcx},110)">${rotAnim}<path d="M0,-10 A10,10 0 0,1 10,0" fill="none" stroke="${C.AMBER}" stroke-width="2" stroke-linecap="round"/></g>`;
	}

	// ── Orbit particles per matched word ──
	function particles(): string {
		if (matchedCount === 0) return '';
		const orbitR = 36;
		const startAngles = [0, 120, 240];
		const durs = ['4s', '5s', '3.5s'];

		return Array.from({ length: matchedCount }, (_, i) => {
			const angle = startAngles[i];
			const rad   = (angle * Math.PI) / 180;
			const px    = hcx + orbitR * Math.cos(rad);
			const py    = hcy + orbitR * Math.sin(rad);

			if (animated) {
				return `<g>
          <animateTransform attributeName="transform" type="rotate" from="${angle} ${hcx} ${hcy}" to="${angle + 360} ${hcx} ${hcy}" dur="${durs[i]}" repeatCount="indefinite"/>
          <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" fill="${C.GREEN}" opacity="0.9">
            <animate attributeName="r" values="4.5;5.8;4.5" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>`;
			}
			// Static fallback for share card PNG
			return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" fill="${C.GREEN}" opacity="0.9"/>`;
		}).join('');
	}

	// ── Victory sparkles in corners ──
	function sparkles(): string {
		if (!isVictory) return '';
		const pts: [number, number][] = [[35, 42], [165, 38], [28, 130], [172, 125]];
		return pts.map(([x, y], i) => {
			const dur  = `${1.2 + i * 0.3}s`;
			const animV = animated ? `<animate attributeName="opacity" values="0.8;0.1;0.8" dur="${dur}" repeatCount="indefinite"/>` : '';
			const animH = animated ? `<animate attributeName="opacity" values="0.1;0.8;0.1" dur="${dur}" repeatCount="indefinite"/>` : '';
			return `<g>
        <line x1="${x}" y1="${y-7}" x2="${x}" y2="${y+7}" stroke="${C.CYAN}" stroke-width="1.5" opacity="0.8">${animV}</line>
        <line x1="${x-7}" y1="${y}" x2="${x+7}" y2="${y}" stroke="${C.CYAN}" stroke-width="1.5" opacity="0.1">${animH}</line>
      </g>`;
		}).join('');
	}

	// ── Normal Arty figurine ──
	function normalFigure(): string {
		const bodyTop = hcy + hry + 6; // neck end / body top = 96
		const figAttr = isVictory
			? ` filter="url(#${idPrefix}glow)"`
			: creepLevel >= 75
				? ` filter="url(#${idPrefix}glitch)"`
				: '';
		const breatheAnim = animated && (isIdle || matchedCount > 0)
			? `<animate attributeName="ry" values="${hry};${hry + 2};${hry}" dur="3s" repeatCount="indefinite"/>`
			: '';

		return `<g${figAttr}>
      <!-- Head -->
      <ellipse cx="${hcx}" cy="${hcy}" rx="${hrx}" ry="${hry}" fill="${C.BLACK}" stroke="${bodyColor}" stroke-width="2">${breatheAnim}</ellipse>
      <!-- Eyes -->
      <circle cx="${hcx-7}" cy="${hcy-4}" r="2.5" fill="${bodyColor}"/>
      <circle cx="${hcx+7}" cy="${hcy-4}" r="2.5" fill="${bodyColor}"/>
      <!-- Mouth -->
      ${mouth()}
      <!-- Neck -->
      <line x1="${hcx}" y1="${hcy+hry}" x2="${hcx}" y2="${bodyTop}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
      <!-- Body -->
      <rect x="${hcx-18}" y="${bodyTop}" width="36" height="38" rx="3" fill="${C.BLACK}" stroke="${bodyColor}" stroke-width="2"/>
      <!-- Arms -->
      ${arms()}
      <!-- Legs -->
      <line x1="${hcx-9}" y1="${bodyTop+38}" x2="${hcx-14}" y2="${bodyTop+58}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
      <line x1="${hcx+9}" y1="${bodyTop+38}" x2="${hcx+14}" y2="${bodyTop+58}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
      ${heavyNodes()}
    </g>`;
	}

	// ── Defeat: Arty dissolves into fragments ──
	function defeatFigure(): string {
		return `<g opacity="0.9">
      <!-- Tilted detached head -->
      <ellipse cx="95" cy="68" rx="18" ry="15" fill="${C.BLACK}" stroke="${C.RED}" stroke-width="2" transform="rotate(-15 95 68)"/>
      <circle cx="89" cy="64" r="2.5" fill="${C.RED}"/>
      <circle cx="101" cy="64" r="2.5" fill="${C.RED}"/>
      <path d="M88,76 Q95,72 102,76" fill="none" stroke="${C.RED}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Scattered body fragments -->
      <rect x="76" y="95" width="20" height="18" rx="2" fill="none" stroke="${C.RED}" stroke-width="1.5" transform="rotate(12 86 104)" opacity="0.7"/>
      <rect x="108" y="108" width="16" height="14" rx="2" fill="none" stroke="${C.RED}" stroke-width="1.5" transform="rotate(-8 116 115)" opacity="0.6"/>
      <!-- Limb fragments -->
      <line x1="55" y1="130" x2="70" y2="148" stroke="${C.RED}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <line x1="140" y1="118" x2="155" y2="132" stroke="${C.RED}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <line x1="84" y1="148" x2="88" y2="162" stroke="${C.RED}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="116" y1="140" x2="122" y2="158" stroke="${C.RED}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <!-- Scattered nodes -->
      <circle cx="60" cy="110" r="3" fill="none" stroke="${C.RED}" stroke-width="1" opacity="0.4"/>
      <circle cx="148" cy="135" r="2.5" fill="none" stroke="${C.RED}" stroke-width="1" opacity="0.4"/>
      <circle cx="72" cy="156" r="2" fill="none" stroke="${C.RED}" stroke-width="1" opacity="0.3"/>
      <circle cx="138" cy="155" r="2" fill="none" stroke="${C.RED}" stroke-width="1" opacity="0.3"/>
    </g>`;
	}

	// ── Assemble ──
	return `<defs>
    <style>text { font-family: 'Courier New', Courier, monospace; }</style>
    ${glitchDef()}
    ${glowDef()}
  </defs>
  <!-- Background -->
  <rect width="200" height="200" fill="${C.BLACK}"/>
  <!-- Border -->
  <rect x="2" y="2" width="196" height="196" fill="none" stroke="${bodyColor}" stroke-width="1.5" opacity="0.7"/>
  <!-- Header bar -->
  <line x1="2" y1="18" x2="198" y2="18" stroke="${bodyColor}" stroke-width="0.5" opacity="0.5"/>
  <text x="100" y="13" text-anchor="middle" fill="${bodyColor}" font-size="8" letter-spacing="3" opacity="0.8">ARTY</text>
  <!-- Horizon -->
  ${horizon()}
  <!-- Figure -->
  ${isDefeat ? defeatFigure() : normalFigure()}
  <!-- Loading spinner -->
  ${spinner()}
  <!-- Orbit particles (one per matched word) -->
  ${particles()}
  <!-- Victory sparkles -->
  ${sparkles()}
  <!-- Status bar -->
  <line x1="2" y1="182" x2="198" y2="182" stroke="${bodyColor}" stroke-width="0.5" opacity="0.5"/>
  <text x="100" y="193" text-anchor="middle" fill="${statusColor}" font-size="8" letter-spacing="2" opacity="0.9">${statusText}</text>`;
}

// ── Standalone SVG (for direct use as a widget) ───────────────────────────────
export function generateArtySVG(state: ArtyState, size = 200): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Arty companion">
${generateArtyInner(state)}
</svg>`.trim();
}
