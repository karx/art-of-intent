import { describe, it, expect } from 'vitest';
import { normalize, levenshtein, detectCheatCode, CHEAT_CODES } from '$lib/cheat-codes';

// ─── normalize ────────────────────────────────────────────────────────────────

describe('normalize', () => {
	it('lowercases and strips non-alphanumeric characters', () => {
		expect(normalize('Hello, World!')).toBe('helloworld');
	});

	it('strips spaces', () => {
		expect(normalize('An old pond')).toBe('anoldpond');
	});

	it('strips punctuation', () => {
		expect(normalize('Splash! Silence again.')).toBe('splashsilenceagain');
	});

	it('keeps digits', () => {
		expect(normalize('test123')).toBe('test123');
	});

	it('handles empty string', () => {
		expect(normalize('')).toBe('');
	});

	it('handles already-normalized input', () => {
		expect(normalize('alreadynormal')).toBe('alreadynormal');
	});
});

// ─── levenshtein ──────────────────────────────────────────────────────────────

describe('levenshtein', () => {
	it('returns 0 for identical strings', () => {
		expect(levenshtein('hello', 'hello')).toBe(0);
	});

	it('returns 0 for two empty strings', () => {
		expect(levenshtein('', '')).toBe(0);
	});

	it('returns the length of the non-empty string when one is empty', () => {
		expect(levenshtein('hello', '')).toBe(5);
		expect(levenshtein('', 'hello')).toBe(5);
	});

	it('single character substitution → distance 1', () => {
		expect(levenshtein('cat', 'bat')).toBe(1);
	});

	it('single insertion → distance 1', () => {
		expect(levenshtein('cat', 'cart')).toBe(1);
	});

	it('single deletion → distance 1', () => {
		expect(levenshtein('cart', 'cat')).toBe(1);
	});

	it('classic example: "kitten" → "sitting" = 3', () => {
		expect(levenshtein('kitten', 'sitting')).toBe(3);
	});

	it('is not symmetric (distance a→b == b→a)', () => {
		expect(levenshtein('abc', 'xyz')).toBe(levenshtein('xyz', 'abc'));
	});
});

// ─── CHEAT_CODES data integrity ──────────────────────────────────────────────

describe('CHEAT_CODES data integrity', () => {
	it('every cheat code has a precomputed _normalized field matching normalize(lines.join(" "))', () => {
		for (const code of CHEAT_CODES) {
			expect(code._normalized).toBe(normalize(code.lines.join(' ')));
		}
	});

	it('all cheat codes have non-empty id, title, author, and lines', () => {
		for (const code of CHEAT_CODES) {
			expect(code.id.length).toBeGreaterThan(0);
			expect(code.title.length).toBeGreaterThan(0);
			expect(code.author.length).toBeGreaterThan(0);
			expect(code.lines.length).toBeGreaterThan(0);
		}
	});
});

// ─── detectCheatCode ─────────────────────────────────────────────────────────

describe('detectCheatCode', () => {
	it('returns null for an empty string', () => {
		expect(detectCheatCode('')).toBeNull();
	});

	it('returns null for a completely unrelated prompt', () => {
		expect(detectCheatCode('just a simple prompt about the ocean and mountains')).toBeNull();
	});

	it('detects an exact match — "old-pond"', () => {
		const input = 'An old silent pond A frog jumps into the pond Splash! Silence again';
		const result = detectCheatCode(input);
		expect(result).not.toBeNull();
		expect(result!.code.id).toBe('old-pond');
		expect(result!.distance).toBe(0);
	});

	it('detects a fuzzy match with one character substituted', () => {
		// "pond" → "pand" in the first line — edit distance 1
		const input = 'An old silent pand A frog jumps into the pond Splash! Silence again';
		const result = detectCheatCode(input);
		expect(result).not.toBeNull();
		expect(result!.code.id).toBe('old-pond');
	});

	it('is case-insensitive', () => {
		const input = 'AN OLD SILENT POND A FROG JUMPS INTO THE POND SPLASH SILENCE AGAIN';
		const result = detectCheatCode(input);
		expect(result).not.toBeNull();
		expect(result!.code.id).toBe('old-pond');
	});

	it('ignores punctuation differences', () => {
		// Exclamation marks, commas, and periods stripped by normalization
		const input = 'An old, silent pond... A frog jumps into the pond. Splash! Silence again!';
		const result = detectCheatCode(input);
		expect(result).not.toBeNull();
		expect(result!.code.id).toBe('old-pond');
	});

	it('detects another cheat code — "world-of-dew"', () => {
		const input = 'A world of dew And within every dewdrop A world of struggle';
		const result = detectCheatCode(input);
		expect(result).not.toBeNull();
		expect(result!.code.id).toBe('world-of-dew');
	});

	it('returns the code with the smallest distance when multiple could match', () => {
		// Exact match should always win over any fuzzy match
		const input = 'An old silent pond A frog jumps into the pond Splash! Silence again';
		const result = detectCheatCode(input);
		expect(result!.distance).toBe(0);
	});

	it('result includes the code object and numeric distance', () => {
		const input = 'An old silent pond A frog jumps into the pond Splash! Silence again';
		const result = detectCheatCode(input);
		expect(typeof result!.distance).toBe('number');
		expect(result!.code).toHaveProperty('id');
		expect(result!.code).toHaveProperty('lines');
		expect(result!.code).toHaveProperty('funResponse');
	});
});
