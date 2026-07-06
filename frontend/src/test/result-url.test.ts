import { describe, it, expect } from 'vitest';
import {
	encodeResult,
	decodeResult,
	buildResultPayload,
	generateResultUrl,
	type ResultPayload,
} from '$lib/result-url';

const samplePayload: ResultPayload = {
	v: 1,
	d: '2026-07-07',
	a: 12,
	t: 11419,
	m: 3,
	n: 3,
	s: 1261,
	w: [1, 1, 1],
	r: 'W',
};

describe('encodeResult / decodeResult', () => {
	it('round-trips a payload', () => {
		expect(decodeResult(encodeResult(samplePayload))).toEqual(samplePayload);
	});

	it('produces a URL-safe token (no +, /, =, %)', () => {
		const token = encodeResult(samplePayload);
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('round-trips a loss with null score and partial words', () => {
		const loss: ResultPayload = { ...samplePayload, m: 1, s: null, w: [0, 1, 0], r: 'L' };
		expect(decodeResult(encodeResult(loss))).toEqual(loss);
	});

	it('round-trips the cheated flag', () => {
		const cheat: ResultPayload = { ...samplePayload, s: null, c: true };
		expect(decodeResult(encodeResult(cheat))).toEqual(cheat);
	});

	it('rejects garbage tokens with null, never throws', () => {
		expect(decodeResult('not base64!!!')).toBeNull();
		expect(decodeResult('')).toBeNull();
		expect(decodeResult(btoa('plain text'))).toBeNull();
	});

	it('rejects well-formed JSON of the wrong shape', () => {
		expect(decodeResult(btoa(JSON.stringify({ hello: 'world' })))).toBeNull();
		expect(decodeResult(btoa(JSON.stringify({ ...samplePayload, a: 'twelve' })))).toBeNull();
		expect(decodeResult(btoa(JSON.stringify({ ...samplePayload, d: '07/07/2026' })))).toBeNull();
		expect(decodeResult(btoa(JSON.stringify({ ...samplePayload, w: 'yes' })))).toBeNull();
	});

	it('rejects unknown versions', () => {
		expect(decodeResult(btoa(JSON.stringify({ ...samplePayload, v: 99 })))).toBeNull();
	});
});

describe('buildResultPayload', () => {
	const base = {
		date: '2026-07-07',
		targetWords: ['moon', 'river', 'stone'],
		matchedWords: new Set(['moon', 'stone']),
		attempts: 8,
		totalTokens: 950,
		won: false,
		cheated: false,
	};

	it('maps found words to bits in target order', () => {
		const p = buildResultPayload(base);
		expect(p.w).toEqual([1, 0, 1]);
		expect(p.m).toBe(2);
		expect(p.n).toBe(3);
	});

	it('computes the score via the shared formula on a win', () => {
		const p = buildResultPayload({
			...base,
			matchedWords: new Set(['moon', 'river', 'stone']),
			won: true,
		});
		expect(p.s).toBe(8 * 10 + 95);
		expect(p.r).toBe('W');
		expect(p.w).toEqual([1, 1, 1]);
	});

	it('null score on loss and sets r to L', () => {
		const p = buildResultPayload(base);
		expect(p.s).toBeNull();
		expect(p.r).toBe('L');
	});

	it('marks cheated runs and nulls the score', () => {
		const p = buildResultPayload({ ...base, won: true, cheated: true });
		expect(p.s).toBeNull();
		expect(p.c).toBe(true);
	});

	it('omits the cheated flag entirely for honest runs (keeps token small)', () => {
		expect('c' in buildResultPayload(base)).toBe(false);
	});
});

describe('generateResultUrl', () => {
	it('appends #r=<token> to the site origin', () => {
		const url = generateResultUrl(samplePayload);
		expect(url.startsWith('https://art-of-intent.netlify.app/#r=')).toBe(true);
		const token = url.split('#r=')[1];
		expect(decodeResult(token)).toEqual(samplePayload);
	});

	it('stays comfortably inside a tweet', () => {
		expect(generateResultUrl(samplePayload).length).toBeLessThan(200);
	});
});
