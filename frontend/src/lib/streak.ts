/**
 * Daily streak — pure date logic over YYYY-MM-DD strings.
 * A streak counts *completed* games (win, loss, or cheat run — playing is
 * what retains). Same-day calls are idempotent so game-restore can't
 * double-count.
 */

export interface StreakRecord {
	lastPlayed: string; // YYYY-MM-DD
	streak: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toUTC(date: string): number | null {
	if (!DATE_RE.test(date)) return null;
	const [y, m, d] = date.split('-').map(Number);
	return Date.UTC(y, m - 1, d);
}

/** Whole days from a → b; null if either date is malformed. */
function daysBetween(a: string, b: string): number | null {
	const ua = toUTC(a);
	const ub = toUTC(b);
	if (ua === null || ub === null) return null;
	return Math.round((ub - ua) / 86_400_000);
}

/** Record that today's game was completed. */
export function advanceStreak(prev: StreakRecord | null, today: string): StreakRecord {
	if (prev && Number.isInteger(prev.streak) && prev.streak > 0) {
		const gap = daysBetween(prev.lastPlayed, today);
		if (gap === 0) return prev;
		if (gap === 1) return { lastPlayed: today, streak: prev.streak + 1 };
	}
	return { lastPlayed: today, streak: 1 };
}

/** Streak to show in the UI — alive if last played today or yesterday, else 0. */
export function displayStreak(record: StreakRecord | null, today: string): number {
	if (!record) return 0;
	const gap = daysBetween(record.lastPlayed, today);
	return gap === 0 || gap === 1 ? record.streak : 0;
}
