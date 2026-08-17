import { describe, it, expect } from 'vitest';
import { getRating, calculateEfficiency, computeEfficiencyScore } from '$lib/scoring';

describe('getRating', () => {
	it('excellent below 40 tokens/attempt', () => {
		expect(getRating(39)).toEqual({ label: 'EXCELLENT', stars: '★★★', color: 'success' });
	});

	it('good 40–49', () => {
		expect(getRating(40)).toEqual({ label: 'GOOD', stars: '★★☆', color: 'info' });
		expect(getRating(49)).toEqual({ label: 'GOOD', stars: '★★☆', color: 'info' });
	});

	it('average 50–59', () => {
		expect(getRating(50)).toEqual({ label: 'AVERAGE', stars: '★☆☆', color: 'warning' });
		expect(getRating(59)).toEqual({ label: 'AVERAGE', stars: '★☆☆', color: 'warning' });
	});

	it('needs work 60+', () => {
		expect(getRating(60)).toEqual({ label: 'NEEDS WORK', stars: '☆☆☆', color: 'error' });
		expect(getRating(200)).toEqual({ label: 'NEEDS WORK', stars: '☆☆☆', color: 'error' });
	});
});

describe('calculateEfficiency', () => {
	it('returns 0 with no attempts', () => {
		expect(calculateEfficiency(0, 0)).toBe(0);
	});

	it('divides totalTokens by attempts', () => {
		expect(calculateEfficiency(120, 3)).toBe(40);
	});

	it('rounds to one decimal place', () => {
		expect(calculateEfficiency(100, 3)).toBe(33.3);
	});
});

describe('computeEfficiencyScore', () => {
	it('victory: attempts*10 + floor(tokens/10)', () => {
		// The worked example from docs/future-work.md — 12 attempts, 11419 tokens → 1261
		expect(computeEfficiencyScore({ won: true, cheated: false, attempts: 12, totalTokens: 11419 })).toBe(1261);
	});

	it('floors the token component', () => {
		expect(computeEfficiencyScore({ won: true, cheated: false, attempts: 1, totalTokens: 19 })).toBe(11);
	});

	it('loss scores null', () => {
		expect(computeEfficiencyScore({ won: false, cheated: false, attempts: 5, totalTokens: 500 })).toBeNull();
	});

	it('cheated scores null even on a win', () => {
		expect(computeEfficiencyScore({ won: true, cheated: true, attempts: 5, totalTokens: 500 })).toBeNull();
	});
});
