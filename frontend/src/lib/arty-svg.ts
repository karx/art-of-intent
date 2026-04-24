/**
 * Arty SVG Widget — sprite figurine for Art of Intent.
 * All coordinates live in a 200×200 viewBox; callers control display size.
 *
 * ArtyAppearance is seeded from date + sessionId (see arty-seed.ts).
 * ArtyState drives real-time overlays and per-haiku morphing.
 *
 * Per-haiku morphing flow:
 *   1. lastHaikuTheme  — keyword-derived scene + hue from the haiku text
 *   2. lastResult      — transient 1.5s face reaction (match/miss/violation)
 *   3. cumulative state — tokens, attempts, creep, matches build over the game
 */

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ArtyAppearance {
	/** Main body/outline hex colour — LLM picks based on haiku emotion */
	primary: string;
	/** Accent/highlight hex colour — contrast or complement to primary */
	secondary: string;
	/** Very muted background atmosphere hex colour */
	bgGlow: string;
	/** Eye shape */
	eyeShape: 'circle' | 'rect' | 'diamond' | 'bar';
	/** Eye size in px, 2–6 */
	eyeSize: number;
	/** Mouth curve: –1.0 frown → 0 flat → 1.0 smile */
	mouthCurve: number;
	/** Head corner radius 4–20 */
	headRx: number;
	/** Body corner radius 0–12 */
	bodyRx: number;
	/** Chest panel internal pattern */
	chestPattern: 'core' | 'circuit' | 'scanner' | 'gauge' | 'empty';
	/** Antenna style */
	antennaStyle: 'none' | 'single' | 'dual' | 'coil';
	/** Shoulder decoration */
	shoulderStyle: 'none' | 'pads' | 'vents' | 'fins';
	/** Leg/base style */
	legStyle: 'legs' | 'hover' | 'treads';
	/** Background atmosphere */
	bgScene: 'void' | 'grid' | 'stars' | 'circuit' | 'waves';
	/** Inner glow blur radius 0–6 */
	glowRadius: number;
	/** CRT scanlines on face screen */
	scanlines: boolean;
	/** Raw SVG element strings to overlay on the face visor (sanitised by arty-bot before use) */
	faceSVG?: string | null;
}

export interface HaikuTheme {
	/** bgScene driven by keyword analysis of the haiku text */
	scene: ArtyAppearance['bgScene'];
	/** Primary hue (0–360) driven by haiku emotional content */
	hue: number;
}

export interface ArtyState {
	creepLevel: number;
	totalTokens: number;
	attemptCount: number;
	matchedCount: number;
	loading: boolean;
	gameOver: boolean;
	wonGame: boolean;
	/** Transient — set for ~1.5s after each haiku, then cleared */
	lastResult?: 'match' | 'miss' | 'violation' | null;
	/** Words found in the most recent haiku (drives status bar) */
	lastMatchedWords?: string[];
	/** Scene + hue derived from the last haiku's keyword content */
	lastHaikuTheme?: HaikuTheme | null;
	lastPromptPersonal?: boolean;
	animated?: boolean;
	idPrefix?: string;
	appearance?: ArtyAppearance | null;
}

// ── Hardcoded state colours (override appearance in extreme states) ────────────
const C = {
	CYAN:  '#00FFFF',
	GREEN: '#00FF00',
	AMBER: '#FFBF00',
	RED:   '#FF0000',
	BLACK: '#000000',
} as const;

/** Default appearance when none has been generated yet */
const DEFAULT_APP: ArtyAppearance = {
	primary:      C.CYAN,
	secondary:    C.GREEN,
	bgGlow:       '#001a1a',
	eyeShape:     'circle',
	eyeSize:      4,
	mouthCurve:   0,
	headRx:       8,
	bodyRx:       4,
	chestPattern: 'core',
	antennaStyle: 'single',
	shoulderStyle:'none',
	legStyle:     'legs',
	bgScene:      'void',
	glowRadius:   2,
	scanlines:    false,
};

// ── Layout constants (all in 200×200 viewBox) ─────────────────────────────────
const CX    = 100;   // figure centre X
const HCY   = 58;    // head centre Y  → head occupies y: 34–82
const HW    = 32;    // head half-width → head occupies x: 68–132
const HH    = 24;    // head half-height
// Screen bezel inside head: x:75–125, y:41–73  (w=50, h=32)
const SX    = 75;    const SW = 50;
const SY    = 41;    const SH = 32;

const NECK_Y = 82;   // neck top     → y: 82–94
const BT     = 94;   // body top
const BW     = 40;   // body half-width → x: 60–140
const BH     = 52;   // body height     → y: 94–146
// Chest panel: x:73–127, y:104–136  (w=54, h=32)
const CPX = 73;  const CPW = 54;
const CPY = 104; const CPH = 32;
const CPCX = CX;  const CPCY = CPY + CPH / 2;  // chest panel centre

const LT = BT + BH;  // leg top = 146

// ── Filter definitions ────────────────────────────────────────────────────────

function glitchFilter(idPrefix: string, animated: boolean): string {
	const freq = animated
		? `<animate attributeName="baseFrequency" values="0.04 0.02;0.10 0.07;0.04 0.02" dur="0.3s" repeatCount="indefinite"/>`
		: '';
	return `<filter id="${idPrefix}glitch" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.02" numOctaves="1" result="noise">${freq}</feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}

function glowFilter(idPrefix: string, radius: number): string {
	const r = Math.max(1, Math.min(8, radius));
	return `<filter id="${idPrefix}glow" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="${r}" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
}

// ── Background scene ──────────────────────────────────────────────────────────

function bgScene(scene: ArtyAppearance['bgScene'], color: string, bgGlow: string): string {
	// Subtle background atmosphere tint
	const tint = `<rect width="200" height="200" fill="${bgGlow}" opacity="0.25"/>`;

	switch (scene) {
		case 'grid':
			return tint + `<g opacity="0.07" fill="${color}">${
				Array.from({ length: 10 }, (_, row) =>
					Array.from({ length: 10 }, (_, col) =>
						`<circle cx="${col * 20 + 10}" cy="${row * 20 + 10}" r="1.2"/>`
					).join('')
				).join('')
			}</g>`;

		case 'stars': {
			const pts: [number, number, number][] = [
				[18,22,1.8],[182,18,1.2],[42,45,1.0],[158,38,1.5],[12,95,1.3],
				[188,88,1.0],[30,145,1.6],[172,140,1.1],[55,175,1.0],[145,178,1.3],
				[100,20,2.2],[80,168,0.9],[120,168,0.9],[22,128,1.0],[178,122,1.0],
			];
			return tint + `<g opacity="0.2" fill="${color}">${
				pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')
			}</g>`;
		}

		case 'circuit':
			return tint + `<g opacity="0.09" fill="none" stroke="${color}" stroke-width="0.8">
        <path d="M10,30 H30 V50 H15"/>
        <circle cx="15" cy="50" r="2" fill="${color}"/>
        <path d="M190,30 H170 V55 H185"/>
        <circle cx="185" cy="55" r="2" fill="${color}"/>
        <path d="M10,160 H28 V175 H10"/>
        <circle cx="28" cy="175" r="2" fill="${color}"/>
        <path d="M190,160 H172 V175 H190"/>
        <circle cx="172" cy="175" r="2" fill="${color}"/>
        <path d="M10,100 H25 V110 H15 V120"/>
        <path d="M190,100 H175 V110 H185 V120"/>
      </g>`;

		case 'waves':
			return tint + `<g opacity="0.08" fill="none" stroke="${color}" stroke-width="1">
        <path d="M0,50  C33,42 67,58 100,50 S167,42 200,50"/>
        <path d="M0,80  C33,72 67,88 100,80 S167,72 200,80"/>
        <path d="M0,140 C33,132 67,148 100,140 S167,132 200,140"/>
        <path d="M0,170 C33,162 67,178 100,170 S167,162 200,170"/>
      </g>`;

		case 'void':
		default:
			return tint;
	}
}

// ── Antenna ───────────────────────────────────────────────────────────────────

function antenna(
	style: ArtyAppearance['antennaStyle'],
	hx: number,
	color: string, accent: string,
	animated: boolean,
): string {
	if (style === 'none') return '';

	const glow = animated
		? `<animate attributeName="r" values="3.5;5;3.5" dur="1.6s" repeatCount="indefinite"/>
       <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.6s" repeatCount="indefinite"/>`
		: '';

	switch (style) {
		case 'dual':
			// Closer together — emerge from ±7px either side of head centre
			return `<g fill="none" stroke="${color}" stroke-linecap="round">
        <line x1="${hx-7}" y1="${HCY-HH}" x2="${hx-9}" y2="${HCY-HH-20}" stroke-width="1.5"/>
        <circle cx="${hx-9}" cy="${HCY-HH-23}" r="3" fill="${accent}" stroke="${color}" stroke-width="1">${glow}</circle>
        <line x1="${hx+7}" y1="${HCY-HH}" x2="${hx+9}" y2="${HCY-HH-20}" stroke-width="1.5"/>
        <circle cx="${hx+9}" cy="${HCY-HH-23}" r="3" fill="${accent}" stroke="${color}" stroke-width="1">${glow}</circle>
      </g>`;

		case 'coil':
			return `<g stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M${hx},${HCY-HH} L${hx-4},${HCY-HH-7} L${hx+4},${HCY-HH-13} L${hx-4},${HCY-HH-19} L${hx+1},${HCY-HH-24}" fill="none" stroke-width="1.5"/>
        <circle cx="${hx+1}" cy="${HCY-HH-27}" r="2.8" fill="${accent}" stroke="${color}" stroke-width="1">${glow}</circle>
      </g>`;

		case 'single':
		default:
			// Centred on head top
			return `<g>
        <line x1="${hx}" y1="${HCY-HH}" x2="${hx}" y2="${HCY-HH-22}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="${hx}" cy="${HCY-HH-25}" r="3.5" fill="${accent}" stroke="${color}" stroke-width="1">${glow}</circle>
      </g>`;
	}
}

// ── Head / face ───────────────────────────────────────────────────────────────

function eyes(
	shape: ArtyAppearance['eyeShape'],
	size: number,
	hx: number,
	color: string,
	isVictory: boolean, isDefeat: boolean, isLoading: boolean,
	isMatch: boolean, isMiss: boolean, isViolation: boolean,
): string {
	const s  = Math.max(2, Math.min(6, size));
	const ey = SY + SH * 0.42;          // eye row Y ≈ 54.5
	const lx = hx - 11;
	const rx = hx + 11;

	// ── Transient reactions — checked before permanent states ────────────────
	if (isMatch) {
		// Large glowing circles with white sparkle glints — pure delight
		const r = s + 3;
		const pulse = `<animate attributeName="r" values="${r};${r + 2};${r}" dur="0.6s" repeatCount="indefinite"/>`;
		return `<circle cx="${lx}" cy="${ey}" r="${r}" fill="${color}">${pulse}</circle>
      <circle cx="${lx + 2.5}" cy="${ey - 2.5}" r="2.2" fill="#ffffff" opacity="0.95"/>
      <circle cx="${lx - 2}" cy="${ey + 2}" r="1" fill="#ffffff" opacity="0.6"/>
      <circle cx="${rx}" cy="${ey}" r="${r}" fill="${color}">${pulse}</circle>
      <circle cx="${rx + 2.5}" cy="${ey - 2.5}" r="2.2" fill="#ffffff" opacity="0.95"/>
      <circle cx="${rx - 2}" cy="${ey + 2}" r="1" fill="#ffffff" opacity="0.6"/>`;
	}
	if (isMiss) {
		// Half-closed drooped bars — weary disappointment
		const bw = s * 2;
		return `<rect x="${lx - s}" y="${ey + 1}" width="${bw}" height="${Math.max(1.5, s * 0.45)}" rx="1" fill="${color}" opacity="0.55"/>
      <rect x="${rx - s}" y="${ey + 1}" width="${bw}" height="${Math.max(1.5, s * 0.45)}" rx="1" fill="${color}" opacity="0.55"/>`;
	}
	if (isViolation) {
		// Vertical slit pupils — alarmed, cornered
		const sh = s * 2.2;
		return `<rect x="${lx - 1.2}" y="${ey - sh / 2}" width="2.4" height="${sh}" rx="1.2" fill="${color}"/>
      <rect x="${rx - 1.2}" y="${ey - sh / 2}" width="2.4" height="${sh}" rx="1.2" fill="${color}"/>`;
	}

	// ── Permanent game states ────────────────────────────────────────────────
	if (isVictory) {
		return `<circle cx="${lx}" cy="${ey}" r="${s + 1}" fill="${color}"/>
      <circle cx="${rx}" cy="${ey}" r="${s + 1}" fill="${color}"/>
      <circle cx="${lx + 2}" cy="${ey - 2}" r="1.8" fill="#fff"/>
      <circle cx="${rx + 2}" cy="${ey - 2}" r="1.8" fill="#fff"/>`;
	}
	if (isDefeat) {
		const d = s + 1;
		return `<line x1="${lx-d}" y1="${ey-d}" x2="${lx+d}" y2="${ey+d}" stroke="${color}" stroke-width="2"/>
      <line x1="${lx+d}" y1="${ey-d}" x2="${lx-d}" y2="${ey+d}" stroke="${color}" stroke-width="2"/>
      <line x1="${rx-d}" y1="${ey-d}" x2="${rx+d}" y2="${ey+d}" stroke="${color}" stroke-width="2"/>
      <line x1="${rx+d}" y1="${ey-d}" x2="${rx-d}" y2="${ey+d}" stroke="${color}" stroke-width="2"/>`;
	}
	if (isLoading) {
		return `<circle cx="${lx}" cy="${ey}" r="${s}" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${lx}" cy="${ey}" r="1.2" fill="${color}"/>
      <circle cx="${rx}" cy="${ey}" r="${s}" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${rx}" cy="${ey}" r="1.2" fill="${color}"/>`;
	}

	switch (shape) {
		case 'rect':
			return `<rect x="${lx-s}" y="${ey-s*0.5}" width="${s*2}" height="${s}" rx="1" fill="${color}"/>
        <rect x="${rx-s}" y="${ey-s*0.5}" width="${s*2}" height="${s}" rx="1" fill="${color}"/>`;
		case 'diamond':
			return `<polygon points="${lx},${ey-s} ${lx+s},${ey} ${lx},${ey+s} ${lx-s},${ey}" fill="${color}"/>
        <polygon points="${rx},${ey-s} ${rx+s},${ey} ${rx},${ey+s} ${rx-s},${ey}" fill="${color}"/>`;
		case 'bar':
			return `<rect x="${lx-s}" y="${ey-1}" width="${s*2}" height="2" rx="1" fill="${color}"/>
        <rect x="${rx-s}" y="${ey-1}" width="${s*2}" height="2" rx="1" fill="${color}"/>`;
		case 'circle':
		default:
			return `<circle cx="${lx}" cy="${ey}" r="${s}" fill="${color}"/>
        <circle cx="${rx}" cy="${ey}" r="${s}" fill="${color}"/>`;
	}
}

function mouth(
	curve: number, hx: number,
	color: string,
	isVictory: boolean, isDefeat: boolean, isLoading: boolean,
	isMatch: boolean, isMiss: boolean, isViolation: boolean,
): string {
	const my = SY + SH * 0.78;    // mouth row Y ≈ 66

	// ── Transient reactions ──────────────────────────────────────────────────
	if (isMatch)
		// Wide open smile — teeth gap implied by negative space
		return `<path d="M${hx-10},${my-1} Q${hx},${my+10} ${hx+10},${my-1}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`;
	if (isMiss)
		// Tight flat line — resigned
		return `<line x1="${hx-6}" y1="${my+2}" x2="${hx+6}" y2="${my+2}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`;
	if (isViolation)
		// Small surprised O — alarmed
		return `<circle cx="${hx}" cy="${my+1}" r="3.5" fill="none" stroke="${color}" stroke-width="1.8"/>`;

	// ── Permanent game states ────────────────────────────────────────────────
	if (isVictory)
		return `<path d="M${hx-9},${my} Q${hx},${my+8} ${hx+9},${my}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
	if (isDefeat)
		return `<path d="M${hx-9},${my+5} Q${hx},${my} ${hx+9},${my+5}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
	if (isLoading)
		return `<path d="M${hx-7},${my+1} Q${hx},${my-2} ${hx+7},${my+1}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;

	const c = Math.max(-1, Math.min(1, curve));
	if (Math.abs(c) < 0.12)
		return `<line x1="${hx-8}" y1="${my}" x2="${hx+8}" y2="${my}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
	const dy = c * 7;
	return `<path d="M${hx-9},${my} Q${hx},${my+dy} ${hx+9},${my}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
}

function headBlock(
	app: ArtyAppearance,
	hx: number, color: string, accent: string,
	isVictory: boolean, isDefeat: boolean, isLoading: boolean,
	isMatch: boolean, isMiss: boolean, isViolation: boolean,
	animated: boolean, creepLevel: number,
): string {
	const rx = Math.max(4, Math.min(20, app.headRx));

	// Corner bolt positions
	const bolts = [[HW - 4, HH - 4], [-HW + 4, HH - 4], [HW - 4, -HH + 4], [-HW + 4, -HH + 4]];

	// Scanlines in screen
	const scanSVG = app.scanlines
		? Array.from({ length: Math.floor(SH / 3) }, (_, i) =>
			`<line x1="${SX}" y1="${SY + i * 3 + 1}" x2="${SX + SW}" y2="${SY + i * 3 + 1}" stroke="${color}" stroke-width="0.5" opacity="0.12"/>`
		).join('')
		: '';

	// Status LED colour
	const ledColor = isVictory ? C.CYAN : isDefeat ? C.RED : isLoading ? C.AMBER : accent;
	const ledAnim = animated
		? `<animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite"/>`
		: '';

	// Screen bezel corner radius matches head — feels integrated rather than overlaid
	const bezelRx = Math.max(4, rx - 4);

	return `<g>
    <!-- Outer head frame — rounded rect, headRx drives the silhouette -->
    <rect x="${hx - HW}" y="${HCY - HH}" width="${HW * 2}" height="${HH * 2}" rx="${rx}" fill="${C.BLACK}" stroke="${color}" stroke-width="2"/>
    <!-- Screen bezel — inset, matching corner radius -->
    <rect x="${SX + (hx - CX)}" y="${SY}" width="${SW}" height="${SH}" rx="${bezelRx}" fill="${C.BLACK}" stroke="${color}" stroke-width="1" opacity="0.9"/>
    <!-- Screen content -->
    ${scanSVG}
    ${eyes(app.eyeShape, app.eyeSize, hx, color, isVictory, isDefeat, isLoading, isMatch, isMiss, isViolation)}
    ${mouth(app.mouthCurve, hx, color, isVictory, isDefeat, isLoading, isMatch, isMiss, isViolation)}
    <!-- Corner bolts -->
    ${bolts.map(([dx, dy]) => `<circle cx="${hx + dx}" cy="${HCY + dy}" r="1.8" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/>`).join('')}
    <!-- Status LED -->
    <circle cx="${hx + HW - 8}" cy="${HCY - HH + 6}" r="2.5" fill="${ledColor}" opacity="0.9">${ledAnim}</circle>
  </g>`;
}

// ── Neck ─────────────────────────────────────────────────────────────────────

function neck(hx: number, color: string): string {
	return `<g>
    <rect x="${hx - 12}" y="${NECK_Y}" width="24" height="12" rx="3" fill="${C.BLACK}" stroke="${color}" stroke-width="1.5"/>
    <line x1="${hx - 12}" y1="${NECK_Y + 4}" x2="${hx + 12}" y2="${NECK_Y + 4}" stroke="${color}" stroke-width="0.5" opacity="0.4"/>
    <line x1="${hx - 12}" y1="${NECK_Y + 8}" x2="${hx + 12}" y2="${NECK_Y + 8}" stroke="${color}" stroke-width="0.5" opacity="0.4"/>
  </g>`;
}

// ── Chest panel ───────────────────────────────────────────────────────────────

function chestPanel(
	pattern: ArtyAppearance['chestPattern'],
	color: string, accent: string,
	matchedCount: number,
	animated: boolean,
): string {
	const panelBg = `<rect x="${CPX}" y="${CPY}" width="${CPW}" height="${CPH}" rx="3" fill="${C.BLACK}" stroke="${color}" stroke-width="1" opacity="0.8"/>`;

	let interior = '';
	switch (pattern) {
		case 'core': {
			const spinAnim = animated
				? `<animateTransform attributeName="transform" type="rotate" from="0 ${CPCX} ${CPCY}" to="360 ${CPCX} ${CPCY}" dur="4s" repeatCount="indefinite"/>`
				: '';
			const pulseAnim = animated
				? `<animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite"/>`
				: '';
			interior = `
        <circle cx="${CPCX}" cy="${CPCY}" r="13" fill="none" stroke="${color}" stroke-width="1.5"/>
        <circle cx="${CPCX}" cy="${CPCY}" r="8" fill="none" stroke="${color}" stroke-width="1"/>
        <circle cx="${CPCX}" cy="${CPCY}" r="4" fill="${color}">${pulseAnim}</circle>
        <g>${spinAnim}
          <path d="M${CPCX},${CPCY - 13} L${CPCX},${CPCY - 8}" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M${CPCX + 11.3},${CPCY + 6.5} L${CPCX + 6.9},${CPCY + 4}" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M${CPCX - 11.3},${CPCY + 6.5} L${CPCX - 6.9},${CPCY + 4}" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
        </g>`;
			break;
		}
		case 'circuit':
			interior = `
        <path d="M${CPX+4},${CPCY-8} H${CPX+14} V${CPCY-2} H${CPX+22}" fill="none" stroke="${accent}" stroke-width="0.9"/>
        <circle cx="${CPX+22}" cy="${CPCY-2}" r="1.5" fill="${color}"/>
        <path d="M${CPX+22},${CPCY-2} H${CPX+30} V${CPCY+6} H${CPX+40}" fill="none" stroke="${accent}" stroke-width="0.9"/>
        <circle cx="${CPX+40}" cy="${CPCY+6}" r="1.5" fill="${color}"/>
        <path d="M${CPX+4},${CPCY+8} H${CPX+18} V${CPCY+2} H${CPX+30}" fill="none" stroke="${accent}" stroke-width="0.9"/>
        <circle cx="${CPX+30}" cy="${CPCY+2}" r="1.5" fill="${color}"/>
        <path d="M${CPCX},${CPCY-14} V${CPCY+14}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
        <path d="M${CPX+4},${CPCY} H${CPX+CPW-4}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3"/>`;
			break;
		case 'scanner': {
			const sweepAnim = animated
				? `<animate attributeName="y1" values="${CPY+2};${CPY+CPH-2};${CPY+2}" dur="2.2s" repeatCount="indefinite"/>
           <animate attributeName="y2" values="${CPY+2};${CPY+CPH-2};${CPY+2}" dur="2.2s" repeatCount="indefinite"/>`
				: '';
			const dotRows = Array.from({ length: 4 }, (_, r) =>
				Array.from({ length: 7 }, (_, c) =>
					`<circle cx="${CPX + 6 + c * 7}" cy="${CPY + 6 + r * 7}" r="0.8" fill="${color}" opacity="0.2"/>`
				).join('')
			).join('');
			interior = `
        ${dotRows}
        <line x1="${CPX+2}" y1="${CPCY}" x2="${CPX+CPW-2}" y2="${CPCY}" stroke="${accent}" stroke-width="2" stroke-linecap="round">${sweepAnim}</line>
        <line x1="${CPX+2}" y1="${CPY+2}" x2="${CPX+CPW-2}" y2="${CPY+2}" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
        <line x1="${CPX+2}" y1="${CPY+CPH-2}" x2="${CPX+CPW-2}" y2="${CPY+CPH-2}" stroke="${color}" stroke-width="0.5" opacity="0.3"/>`;
			break;
		}
		case 'gauge': {
			const fraction = Math.min(1, matchedCount / 3);
			const gaugeW   = Math.round(fraction * (CPW - 8));
			const barAnim  = animated && fraction > 0
				? `<animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite"/>`
				: '';
			// Three pip dots above bar — one lights up per matched word
			const pips = [0, 1, 2].map(i => {
				const px = CPX + 8 + i * Math.round((CPW - 16) / 2);
				const lit = i < matchedCount;
				return `<circle cx="${px}" cy="${CPCY - 8}" r="2.5" fill="${lit ? color : 'none'}" stroke="${color}" stroke-width="1" opacity="${lit ? '0.9' : '0.3'}"/>`;
			}).join('');
			interior = `
        ${pips}
        <rect x="${CPX+4}" y="${CPCY-2}" width="${CPW-8}" height="8" rx="3" fill="none" stroke="${color}" stroke-width="1"/>
        <rect x="${CPX+4}" y="${CPCY-2}" width="${gaugeW}" height="8" rx="3" fill="${color}" opacity="0.85">${barAnim}</rect>
        <line x1="${CPX+4+Math.round((CPW-8)/3)}" y1="${CPCY-2}" x2="${CPX+4+Math.round((CPW-8)/3)}" y2="${CPCY+6}" stroke="${C.BLACK}" stroke-width="0.7"/>
        <line x1="${CPX+4+Math.round(2*(CPW-8)/3)}" y1="${CPCY-2}" x2="${CPX+4+Math.round(2*(CPW-8)/3)}" y2="${CPCY+6}" stroke="${C.BLACK}" stroke-width="0.7"/>`;
			break;
		}
		case 'empty':
		default:
			interior = `
        <line x1="${CPCX}" y1="${CPY+3}" x2="${CPCX}" y2="${CPY+CPH-3}" stroke="${color}" stroke-width="0.5" opacity="0.2"/>
        <line x1="${CPX+3}" y1="${CPCY}" x2="${CPX+CPW-3}" y2="${CPCY}" stroke="${color}" stroke-width="0.5" opacity="0.2"/>`;
			break;
	}

	return `<g>${panelBg}${interior}</g>`;
}

// ── Body ─────────────────────────────────────────────────────────────────────

function body(
	app: ArtyAppearance,
	color: string, accent: string,
	matchedCount: number,
	animated: boolean,
	isHeavy: boolean,
): string {
	const rx = Math.max(0, Math.min(12, app.bodyRx));

	// Optional heavy-mode nodes on body
	const nodes = isHeavy
		? `<circle cx="${CX}" cy="${BT+34}" r="3" fill="none" stroke="${color}" stroke-width="1" opacity="0.6"/>
       <circle cx="${CX-9}" cy="${BT+42}" r="2" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/>
       <circle cx="${CX+9}" cy="${BT+42}" r="2" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/>`
		: '';

	// Body-side shoulder markings from shoulderStyle
	let sideMarkings = '';
	switch (app.shoulderStyle) {
		case 'vents':
			sideMarkings = `
        <line x1="${CX-BW}" y1="${BT+12}" x2="${CX-BW+10}" y2="${BT+12}" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <line x1="${CX-BW}" y1="${BT+18}" x2="${CX-BW+10}" y2="${BT+18}" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <line x1="${CX-BW}" y1="${BT+24}" x2="${CX-BW+10}" y2="${BT+24}" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <line x1="${CX+BW-10}" y1="${BT+12}" x2="${CX+BW}" y2="${BT+12}" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <line x1="${CX+BW-10}" y1="${BT+18}" x2="${CX+BW}" y2="${BT+18}" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <line x1="${CX+BW-10}" y1="${BT+24}" x2="${CX+BW}" y2="${BT+24}" stroke="${color}" stroke-width="1" opacity="0.55"/>`;
			break;
		case 'pads':
			sideMarkings = `
        <polygon points="${CX-BW},${BT} ${CX-BW-14},${BT} ${CX-BW-10},${BT+14} ${CX-BW},${BT+12}" fill="${accent}" opacity="0.25" stroke="${color}" stroke-width="1"/>
        <polygon points="${CX+BW},${BT} ${CX+BW+14},${BT} ${CX+BW+10},${BT+14} ${CX+BW},${BT+12}" fill="${accent}" opacity="0.25" stroke="${color}" stroke-width="1"/>`;
			break;
		case 'fins':
			sideMarkings = `
        <path d="M${CX-BW},${BT} L${CX-BW-16},${BT-8} L${CX-BW-12},${BT+16} L${CX-BW},${BT+14}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linejoin="round" opacity="0.8"/>
        <path d="M${CX+BW},${BT} L${CX+BW+16},${BT-8} L${CX+BW+12},${BT+16} L${CX+BW},${BT+14}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linejoin="round" opacity="0.8"/>`;
			break;
	}

	return `<g>
    <!-- Main body -->
    <rect x="${CX-BW}" y="${BT}" width="${BW*2}" height="${BH}" rx="${rx}" fill="${C.BLACK}" stroke="${color}" stroke-width="2"/>
    <!-- Shoulder joint circles -->
    <circle cx="${CX-BW}" cy="${BT+8}" r="4" fill="${C.BLACK}" stroke="${color}" stroke-width="1.5"/>
    <circle cx="${CX+BW}" cy="${BT+8}" r="4" fill="${C.BLACK}" stroke="${color}" stroke-width="1.5"/>
    ${sideMarkings}
    ${chestPanel(app.chestPattern, color, accent, matchedCount, animated)}
    ${nodes}
  </g>`;
}

// ── Arms ─────────────────────────────────────────────────────────────────────

function arms(color: string, creepLevel: number): string {
	const jagged = creepLevel >= 75;
	const AY = BT + 10;  // arm start Y (near shoulder)

	if (jagged) {
		// Jagged/glitching arms
		return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${CX-BW},${AY} L${CX-BW-16},${AY+10} L${CX-BW-22},${AY+24} L${CX-BW-14},${AY+38}"/>
      <path d="M${CX+BW},${AY} L${CX+BW+16},${AY+10} L${CX+BW+22},${AY+24} L${CX+BW+14},${AY+38}"/>
    </g>`;
	}

	return `<g fill="${C.BLACK}" stroke="${color}" stroke-width="1.2">
    <!-- Left upper arm -->
    <rect x="${CX-BW-11}" y="${AY}" width="11" height="20" rx="4"/>
    <!-- Left lower arm -->
    <rect x="${CX-BW-12}" y="${AY+19}" width="9" height="18" rx="4"/>
    <!-- Left hand -->
    <circle cx="${CX-BW-7}" cy="${AY+40}" r="2.8" fill="${C.BLACK}" stroke="${color}" stroke-width="1.2"/>

    <!-- Right upper arm -->
    <rect x="${CX+BW}" y="${AY}" width="11" height="20" rx="4"/>
    <!-- Right lower arm -->
    <rect x="${CX+BW+3}" y="${AY+19}" width="9" height="18" rx="4"/>
    <!-- Right hand -->
    <circle cx="${CX+BW+8}" cy="${AY+40}" r="2.8" fill="${C.BLACK}" stroke="${color}" stroke-width="1.2"/>
  </g>`;
}

// ── Legs ──────────────────────────────────────────────────────────────────────

function legs(
	style: ArtyAppearance['legStyle'],
	color: string, accent: string,
	animated: boolean,
): string {
	switch (style) {
		case 'hover': {
			const floatAnim = animated
				? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="2.5s" repeatCount="indefinite" additive="sum"/>`
				: '';
			return `<g>
        ${floatAnim ? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="2.5s" repeatCount="indefinite"/>` : ''}
        <ellipse cx="${CX}" cy="${LT+10}" rx="38" ry="8" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.8"/>
        <ellipse cx="${CX}" cy="${LT+19}" rx="28" ry="6" fill="none" stroke="${color}" stroke-width="0.9" opacity="0.6"/>
        <ellipse cx="${CX}" cy="${LT+27}" rx="18" ry="4" fill="none" stroke="${color}" stroke-width="0.7" opacity="0.4"/>
        <line x1="${CX-18}" y1="${LT}" x2="${CX-22}" y2="${LT+24}" stroke="${accent}" stroke-width="0.8" opacity="0.5"/>
        <line x1="${CX}"    y1="${LT}" x2="${CX}"    y2="${LT+30}" stroke="${accent}" stroke-width="0.8" opacity="0.5"/>
        <line x1="${CX+18}" y1="${LT}" x2="${CX+22}" y2="${LT+24}" stroke="${accent}" stroke-width="0.8" opacity="0.5"/>
      </g>`;
		}
		case 'treads': {
			const lx = CX - BW + 2;
			const rx = CX + BW - 2;
			return `<g fill="${C.BLACK}" stroke="${color}">
        <!-- Track body -->
        <rect x="${lx}" y="${LT}" width="${(rx-lx)}" height="26" rx="8" stroke-width="1.8"/>
        <!-- Inner track -->
        <rect x="${lx+6}" y="${LT+4}" width="${(rx-lx)-12}" height="18" rx="5" stroke-width="0.8" opacity="0.5"/>
        <!-- Drive wheels -->
        <circle cx="${lx+9}" cy="${LT+13}" r="8" stroke-width="1.5"/>
        <circle cx="${lx+9}" cy="${LT+13}" r="3" fill="${color}"/>
        <circle cx="${rx-9}" cy="${LT+13}" r="8" stroke-width="1.5"/>
        <circle cx="${rx-9}" cy="${LT+13}" r="3" fill="${color}"/>
        <!-- Tread marks -->
        ${Array.from({ length: 6 }, (_, i) => {
				const tx = lx + 18 + i * 10;
				return `<line x1="${tx}" y1="${LT}" x2="${tx}" y2="${LT+26}" stroke="${color}" stroke-width="0.8" opacity="0.35"/>`;
			}).join('')}
      </g>`;
		}
		case 'legs':
		default:
			return `<g fill="${C.BLACK}" stroke="${color}" stroke-width="1.5">
        <!-- Left leg -->
        <rect x="${CX-32}" y="${LT}" width="26" height="28" rx="3"/>
        <line x1="${CX-32}" y1="${LT+12}" x2="${CX-6}" y2="${LT+12}" stroke="${color}" stroke-width="0.6" opacity="0.4"/>
        <!-- Left foot -->
        <rect x="${CX-36}" y="${LT+24}" width="34" height="10" rx="5"/>
        <!-- Right leg -->
        <rect x="${CX+6}"  y="${LT}" width="26" height="28" rx="3"/>
        <line x1="${CX+6}" y1="${LT+12}" x2="${CX+32}" y2="${LT+12}" stroke="${color}" stroke-width="0.6" opacity="0.4"/>
        <!-- Right foot -->
        <rect x="${CX+2}"  y="${LT+24}" width="34" height="10" rx="5"/>
      </g>`;
	}
}

// ── Horizon ───────────────────────────────────────────────────────────────────

function horizon(color: string, creepLevel: number): string {
	const horizColor = creepLevel >= 75 ? C.RED : creepLevel >= 50 ? C.AMBER : C.GREEN;
	if (creepLevel >= 75)
		return `<path d="M12,168 L34,162 L56,174 L78,162 L100,174 L122,162 L144,174 L166,162 L188,168" fill="none" stroke="${horizColor}" stroke-width="1.5" stroke-linecap="round"/>`;
	if (creepLevel >= 50)
		return `<path d="M12,168 C42,163 72,173 100,168 S158,163 188,168" fill="none" stroke="${horizColor}" stroke-width="1"/>`;
	if (creepLevel >= 25)
		return `<path d="M12,168 Q100,165 188,168" fill="none" stroke="${horizColor}" stroke-width="1"/>`;
	return `<line x1="12" y1="168" x2="188" y2="168" stroke="${horizColor}" stroke-width="1"/>`;
}

// ── Loading spinner ───────────────────────────────────────────────────────────

function spinner(loading: boolean, animated: boolean, hx: number): string {
	if (!loading) return '';
	const rotAnim = animated
		? `<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.85s" additive="sum" repeatCount="indefinite"/>`
		: '';
	return `<g transform="translate(${hx},${BT + BH / 2})">${rotAnim}
    <path d="M0,-12 A12,12 0 0,1 12,0" fill="none" stroke="${C.AMBER}" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
}

// ── Orbit particles ───────────────────────────────────────────────────────────

function particles(matchedCount: number, hx: number, animated: boolean): string {
	if (matchedCount === 0) return '';
	const R = 40;
	const angles  = [0, 120, 240];
	const durs    = ['4s', '5s', '3.5s'];
	return Array.from({ length: matchedCount }, (_, i) => {
		const a   = angles[i];
		const rad = (a * Math.PI) / 180;
		const px  = (hx + R * Math.cos(rad)).toFixed(1);
		const py  = (HCY + R * Math.sin(rad)).toFixed(1);
		if (animated) {
			return `<g>
        <animateTransform attributeName="transform" type="rotate" from="${a} ${hx} ${HCY}" to="${a+360} ${hx} ${HCY}" dur="${durs[i]}" repeatCount="indefinite"/>
        <circle cx="${px}" cy="${py}" r="4.5" fill="${C.GREEN}" opacity="0.9">
          <animate attributeName="r" values="4.5;6;4.5" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>`;
		}
		return `<circle cx="${px}" cy="${py}" r="4.5" fill="${C.GREEN}" opacity="0.9"/>`;
	}).join('');
}

// ── Victory sparkles ──────────────────────────────────────────────────────────

function sparkles(isVictory: boolean, animated: boolean): string {
	if (!isVictory) return '';
	const pts: [number, number][] = [[30, 38], [170, 34], [22, 128], [178, 122]];
	return pts.map(([x, y], i) => {
		const dur   = `${1.2 + i * 0.3}s`;
		const animV = animated ? `<animate attributeName="opacity" values="0.8;0.1;0.8" dur="${dur}" repeatCount="indefinite"/>` : '';
		const animH = animated ? `<animate attributeName="opacity" values="0.1;0.8;0.1" dur="${dur}" repeatCount="indefinite"/>` : '';
		return `<g>
      <line x1="${x}" y1="${y-8}" x2="${x}" y2="${y+8}" stroke="${C.CYAN}" stroke-width="1.5" opacity="0.8">${animV}</line>
      <line x1="${x-8}" y1="${y}" x2="${x+8}" y2="${y}" stroke="${C.CYAN}" stroke-width="1.5" opacity="0.1">${animH}</line>
    </g>`;
	}).join('');
}

// ── Defeat: scattered fragments ───────────────────────────────────────────────

function defeatFigure(color: string): string {
	return `<g opacity="0.9">
    <!-- Tilted head -->
    <rect x="80" y="32" width="48" height="38" rx="8" fill="${C.BLACK}" stroke="${color}" stroke-width="2" transform="rotate(-18 104 51)"/>
    <!-- X eyes -->
    <line x1="92" y1="44" x2="100" y2="52" stroke="${color}" stroke-width="2"/>
    <line x1="100" y1="44" x2="92" y2="52" stroke="${color}" stroke-width="2"/>
    <line x1="110" y1="44" x2="118" y2="52" stroke="${color}" stroke-width="2"/>
    <line x1="118" y1="44" x2="110" y2="52" stroke="${color}" stroke-width="2"/>
    <!-- Frown -->
    <path d="M94,60 Q104,56 114,60" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Scattered body fragments -->
    <rect x="72" y="96" width="30" height="22" rx="3" fill="none" stroke="${color}" stroke-width="1.5" transform="rotate(14 87 107)" opacity="0.7"/>
    <rect x="112" y="108" width="22" height="18" rx="2" fill="none" stroke="${color}" stroke-width="1.5" transform="rotate(-10 123 117)" opacity="0.6"/>
    <!-- Scattered limbs -->
    <rect x="44" y="120" width="14" height="20" rx="2" fill="none" stroke="${color}" stroke-width="1.2" transform="rotate(-30 51 130)" opacity="0.5"/>
    <rect x="146" y="115" width="14" height="20" rx="2" fill="none" stroke="${color}" stroke-width="1.2" transform="rotate(25 153 125)" opacity="0.5"/>
    <!-- Debris circles -->
    <circle cx="58" cy="158" r="4" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
    <circle cx="148" cy="148" r="3" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
    <circle cx="78" cy="168" r="2.5" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>
    <circle cx="130" cy="162" r="2" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>
  </g>`;
}

// ── Inner content (200×200 viewBox, no outer <svg> wrapper) ──────────────────

export function generateArtyInner(state: ArtyState): string {
	const {
		creepLevel         = 0,
		totalTokens        = 0,
		attemptCount       = 0,
		matchedCount       = 0,
		loading            = false,
		gameOver           = false,
		wonGame            = false,
		lastResult         = null,
		lastMatchedWords   = [],
		lastHaikuTheme     = null,
		lastPromptPersonal = false,
		animated           = true,
		idPrefix           = 'arty',
		appearance         = null,
	} = state;

	const app       = appearance ?? DEFAULT_APP;
	const isDefeat  = gameOver && !wonGame;
	const isVictory = gameOver && wonGame;
	const isHeavy   = (attemptCount > 0 ? totalTokens / attemptCount : 0) >= 60 || totalTokens >= 150;

	// ── Transient result flags ───────────────────────────────────────────────
	const isMatch     = lastResult === 'match';
	const isMiss      = lastResult === 'miss';
	const isViolation = lastResult === 'violation';

	// ── Colour resolution — priority: result > game state > haiku theme > appearance ──
	const figureColor =
		isVictory          ? C.CYAN
		: isDefeat         ? C.RED
		: isMatch          ? C.GREEN
		: isViolation      ? C.AMBER
		: loading          ? C.AMBER
		: creepLevel >= 75 ? C.RED
		: creepLevel >= 50 ? C.AMBER
		: app.primary;

	const accentColor = app.secondary;
	const glowR       = Math.max(1, Math.min(8, app.glowRadius));

	// Haiku theme overrides bgScene when present
	const activeScene = lastHaikuTheme?.scene ?? app.bgScene;

	// Head lean when last prompt was personal or on miss (slight droop)
	const hx = CX + (lastPromptPersonal ? -5 : isMiss ? 3 : 0);

	// ── Filter defs ──────────────────────────────────────────────────────────
	const needsGlitch = !isVictory && creepLevel >= 75;
	const needsGlow   = isVictory || isMatch;
	const defs = `<defs>
    <style>text { font-family: 'Courier New', Courier, monospace; }</style>
    ${needsGlitch ? glitchFilter(idPrefix, animated) : ''}
    ${needsGlow   ? glowFilter(idPrefix, glowR) : ''}
    ${(app.glowRadius > 0 && !needsGlow) ? glowFilter(idPrefix + 'body', glowR * 0.5) : ''}
  </defs>`;

	const glitchAttr = needsGlitch ? ` filter="url(#${idPrefix}glitch)"` : '';
	const glowAttr   = needsGlow   ? ` filter="url(#${idPrefix}glow)"` : '';

	// ── Reaction flash border (resets SMIL on every re-render, which is intentional) ──
	const flashBorder = (isMatch || isViolation)
		? `<rect x="3" y="3" width="194" height="194" fill="none"
        stroke="${isMatch ? C.GREEN : C.AMBER}" stroke-width="3" rx="2">
        <animate attributeName="opacity" values="0.9;0.2;0.8;0.1;0" dur="1.4s" fill="freeze"/>
        <animate attributeName="stroke-width" values="4;2;3;1;0" dur="1.4s" fill="freeze"/>
      </rect>`
		: '';

	// ── Status bar text ───────────────────────────────────────────────────────
	let statusText: string;
	let statusColor: string;
	if (isVictory)      { statusText = 'VICTORY';                   statusColor = C.CYAN;  }
	else if (isDefeat)  { statusText = 'DARKNESS';                  statusColor = C.RED;   }
	else if (isMatch)   { statusText = `✓ ${(lastMatchedWords ?? []).map(w => w.toUpperCase()).join(' · ') || 'MATCH'}`; statusColor = C.GREEN; }
	else if (isMiss)    { statusText = 'NO MATCH';                  statusColor = app.primary; }
	else if (isViolation){ statusText = '⚠ CAUTION';               statusColor = C.AMBER; }
	else if (loading)   { statusText = 'THINKING...';               statusColor = C.AMBER; }
	else if (matchedCount > 0) { statusText = `${matchedCount}/3 FOUND`; statusColor = C.GREEN; }
	else                { statusText = 'READY';                     statusColor = app.primary; }

	return `${defs}
  <!-- Background -->
  <rect width="200" height="200" fill="${C.BLACK}"/>
  ${bgScene(activeScene, figureColor, app.bgGlow)}
  <!-- Border -->
  <rect x="2" y="2" width="196" height="196" fill="none" stroke="${figureColor}" stroke-width="1.5" opacity="0.6"/>
  ${flashBorder}
  <!-- Horizon line -->
  ${horizon(figureColor, creepLevel)}
  <!-- Figure -->
  <g${glitchAttr}${glowAttr}>
    ${isDefeat
		? defeatFigure(figureColor)
		: `${antenna(app.antennaStyle, hx, figureColor, accentColor, animated)}
       ${headBlock(app, hx, figureColor, accentColor, isVictory, isDefeat, loading, isMatch, isMiss, isViolation, animated, creepLevel)}
       ${neck(hx, figureColor)}
       ${body(app, figureColor, accentColor, matchedCount, animated, isHeavy)}
       ${arms(figureColor, creepLevel)}
       ${legs(app.legStyle, figureColor, accentColor, animated)}`
	}
  </g>
  <!-- Loading spinner -->
  ${spinner(loading, animated, hx)}
  <!-- Orbit particles (one per matched word) -->
  ${particles(matchedCount, hx, animated)}
  <!-- Victory sparkles -->
  ${sparkles(isVictory, animated)}
  <!-- Status bar -->
  <line x1="2" y1="184" x2="198" y2="184" stroke="${figureColor}" stroke-width="0.5" opacity="0.4"/>
  <text x="100" y="195" text-anchor="middle" fill="${statusColor}" font-size="7.5" letter-spacing="2" opacity="0.9">${statusText}</text>`;
}

// ── Standalone SVG (for direct widget use) ────────────────────────────────────

export function generateArtySVG(state: ArtyState): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Arty companion">
${generateArtyInner(state)}
</svg>`.trim();
}
