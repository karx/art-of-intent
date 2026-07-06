import { describe, it, expect } from 'vitest';
import { advanceStreak, displayStreak, type StreakRecord } from '$lib/streak';

describe('advanceStreak', () => {
	it('first ever play starts at 1', () => {
		expect(advanceStreak(null, '2026-07-07')).toEqual({ lastPlayed: '2026-07-07', streak: 1 });
	});

	it('same-day replay is idempotent', () => {
		const rec: StreakRecord = { lastPlayed: '2026-07-07', streak: 3 };
		expect(advanceStreak(rec, '2026-07-07')).toEqual(rec);
	});

	it('consecutive day increments', () => {
		expect(advanceStreak({ lastPlayed: '2026-07-06', streak: 3 }, '2026-07-07'))
			.toEqual({ lastPlayed: '2026-07-07', streak: 4 });
	});

	it('crosses month boundaries', () => {
		expect(advanceStreak({ lastPlayed: '2026-06-30', streak: 9 }, '2026-07-01'))
			.toEqual({ lastPlayed: '2026-07-01', streak: 10 });
	});

	it('a missed day resets to 1', () => {
		expect(advanceStreak({ lastPlayed: '2026-07-04', streak: 12 }, '2026-07-07'))
			.toEqual({ lastPlayed: '2026-07-07', streak: 1 });
	});

	it('garbage records reset to 1', () => {
		expect(advanceStreak({ lastPlayed: 'not-a-date', streak: 5 }, '2026-07-07'))
			.toEqual({ lastPlayed: '2026-07-07', streak: 1 });
		expect(advanceStreak({ lastPlayed: '2026-07-06', streak: -2 }, '2026-07-07'))
			.toEqual({ lastPlayed: '2026-07-07', streak: 1 });
	});
});

describe('displayStreak', () => {
	it('0 with no record', () => {
		expect(displayStreak(null, '2026-07-07')).toBe(0);
	});

	it('shows the streak when last played today', () => {
		expect(displayStreak({ lastPlayed: '2026-07-07', streak: 4 }, '2026-07-07')).toBe(4);
	});

	it('still alive when last played yesterday (grace to play today)', () => {
		expect(displayStreak({ lastPlayed: '2026-07-06', streak: 4 }, '2026-07-07')).toBe(4);
	});

	it('0 once the streak is broken', () => {
		expect(displayStreak({ lastPlayed: '2026-07-04', streak: 9 }, '2026-07-07')).toBe(0);
	});
});
