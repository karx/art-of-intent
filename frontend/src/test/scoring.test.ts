import { describe, it, expect } from 'vitest';
import { getRating, calculateEfficiency } from '$lib/scoring';

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
