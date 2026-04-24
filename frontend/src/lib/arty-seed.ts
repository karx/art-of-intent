/**
 * arty-seed.ts — Deterministic RNG for Arty's visual appearance.
 *
 * Two-layer seed strategy:
 *   dailySeed   = date + sorted targetWords  → structural parts (same for all players on a day)
 *   sessionSeed = sessionId                  → color palette (unique per player)
 *
 * Result: every player recognises "today's Arty shape" from leaderboard screenshots,
 * but each player's colorway is their own.
 */

import type { ArtyAppearance, HaikuTheme } from './arty-svg';

// ── FNV-1a: string → uint32 seed ─────────────────────────────────────────────

function strToSeed(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

// ── Mulberry32: seedable 32-bit PRNG ─────────────────────────────────────────

function mulberry32(seed: number) {
	let s = seed;
	return function (): number {
		s += 0x6d2b79f5;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
	};
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(rng: () => number, arr: readonly T[]): T {
	return arr[Math.floor(rng() * arr.length)];
}

function range(rng: () => number, lo: number, hi: number): number {
	return lo + rng() * (hi - lo);
}

function rangeInt(rng: () => number, lo: number, hi: number): number {
	return Math.floor(range(rng, lo, hi + 1));
}

// ── Hue → hex colour ─────────────────────────────────────────────────────────

export function hsl(h: number, s: number, l: number): string {
	h = ((h % 360) + 360) % 360;
	const hh = h / 60;
	const c  = (1 - Math.abs(2 * l - 1)) * s;
	const x  = c * (1 - Math.abs((hh % 2) - 1));
	let r = 0, g = 0, b = 0;
	if      (hh < 1) { r = c; g = x; }
	else if (hh < 2) { r = x; g = c; }
	else if (hh < 3) {         g = c; b = x; }
	else if (hh < 4) {         g = x; b = c; }
	else if (hh < 5) { r = x;         b = c; }
	else             { r = c;          b = x; }
	const m = l - c / 2;
	const to2 = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
	return `#${to2(r)}${to2(g)}${to2(b)}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

// ── Keyword → HaikuTheme ─────────────────────────────────────────────────────

const THEMES: Array<{ words: string[]; scene: ArtyAppearance['bgScene']; hue: number }> = [
	{
		words: ['star', 'stars', 'moon', 'cosmos', 'galaxy', 'space', 'universe', 'night', 'void',
		        'infinite', 'celestial', 'nebula', 'orbit', 'planet', 'comet', 'aurora'],
		scene: 'stars', hue: 245,
	},
	{
		words: ['wave', 'ocean', 'sea', 'water', 'rain', 'river', 'stream', 'flow', 'mist',
		        'fog', 'dew', 'tears', 'tide', 'shore', 'cascade', 'ripple', 'depths'],
		scene: 'waves', hue: 205,
	},
	{
		words: ['circuit', 'code', 'data', 'digital', 'system', 'network', 'signal', 'byte',
		        'logic', 'machine', 'grid', 'scan', 'tech', 'pulse', 'frequency', 'terminal'],
		scene: 'circuit', hue: 155,
	},
	{
		words: ['stone', 'wall', 'path', 'road', 'city', 'urban', 'concrete', 'tower',
		        'structure', 'bridge', 'column', 'brick', 'hall', 'corridor', 'chamber'],
		scene: 'grid', hue: 275,
	},
	{
		words: ['sun', 'fire', 'flame', 'heat', 'burn', 'gold', 'warm', 'glow', 'light',
		        'dawn', 'bright', 'blaze', 'spark', 'ember', 'torch', 'radiant', 'bloom',
		        'flower', 'spring', 'bloom', 'petal'],
		scene: 'void', hue: 38,
	},
];

/**
 * Derive a scene and hue from haiku text via keyword matching.
 * The category with the most keyword matches wins; ties go to the first category.
 * Returns null if no keywords match (Arty keeps its seeded appearance unchanged).
 */
export function deriveHaikuTheme(haikuText: string): HaikuTheme | null {
	if (!haikuText) return null;
	const lower = haikuText.toLowerCase();
	let best = { score: 0, idx: -1 };
	for (let i = 0; i < THEMES.length; i++) {
		const score = THEMES[i].words.reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0);
		if (score > best.score) best = { score, idx: i };
	}
	if (best.idx < 0) return null;
	return { scene: THEMES[best.idx].scene, hue: THEMES[best.idx].hue };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a deterministic ArtyAppearance from two seeds.
 *
 * @param dailySeed   - Derived from `${date}:${sortedTargetWords}`. Same for all players on a day.
 * @param sessionSeed - Derived from sessionId. Unique per player session.
 */
export function seedArtyAppearance(dailySeed: string, sessionSeed: string): ArtyAppearance {
	const structRng = mulberry32(strToSeed(dailySeed));
	const colorRng  = mulberry32(strToSeed(sessionSeed));

	// ── Structural parts — daily seed (same shape for everyone today) ─────────
	const eyeShape    = pick(structRng, ['circle', 'rect', 'diamond', 'bar'] as const);
	const antennaStyle= pick(structRng, ['none', 'single', 'dual', 'coil'] as const);
	const shoulderStyle=pick(structRng, ['none', 'pads', 'vents', 'fins'] as const);
	const legStyle    = pick(structRng, ['legs', 'hover', 'treads'] as const);
	const bgScene     = pick(structRng, ['void', 'grid', 'stars', 'circuit', 'waves'] as const);
	const headRx      = rangeInt(structRng, 4, 20);
	const bodyRx      = rangeInt(structRng, 0, 12);
	const scanlines   = structRng() < 0.35;

	// chestPattern is always 'gauge' so the match-progress bar is always visible
	const chestPattern = 'gauge' as const;

	// ── Color palette — session seed (unique per player) ──────────────────────
	// Primary: vivid hue, high saturation, medium lightness
	const primaryHue = colorRng() * 360;
	const primary    = hsl(primaryHue, 0.82 + colorRng() * 0.18, 0.50 + colorRng() * 0.12);

	// Secondary: complementary or split-complementary, slightly different lightness
	const secondaryHue = primaryHue + 120 + colorRng() * 120;
	const secondary  = hsl(secondaryHue, 0.75 + colorRng() * 0.20, 0.52 + colorRng() * 0.14);

	// bgGlow: very dark tint of the primary hue
	const bgGlow     = hsl(primaryHue, 0.55, 0.06 + colorRng() * 0.06);

	// glowRadius and eyeSize are seeded statically; they get overridden live by game state
	const glowRadius = rangeInt(colorRng, 1, 4);
	const eyeSize    = rangeInt(colorRng, 3, 5);

	return {
		primary,
		secondary,
		bgGlow,
		eyeShape,
		eyeSize,
		mouthCurve: 0,         // driven live by matchedCount
		headRx,
		bodyRx,
		chestPattern,
		antennaStyle,
		shoulderStyle,
		legStyle,
		bgScene,
		glowRadius,
		scanlines,
	};
}
