import { advanceStreak, displayStreak, type StreakRecord } from '$lib/streak';

const LS_KEY = 'aoi_streak';

export const streakState = $state<{ record: StreakRecord | null }>({ record: null });

function load(): StreakRecord | null {
	try {
		const raw = localStorage.getItem(LS_KEY);
		return raw ? (JSON.parse(raw) as StreakRecord) : null;
	} catch {
		return null;
	}
}

export function initStreak() {
	streakState.record = load();
}

/** Call when today's game completes. Idempotent per day. */
export function recordPlayedToday(today: string) {
	// Self-load so callers don't depend on initStreak() having run first —
	// advancing from an unloaded null would clobber a live streak.
	if (streakState.record === null) streakState.record = load();
	const next = advanceStreak(streakState.record, today);
	streakState.record = next;
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(next));
	} catch { /* storage full — non-fatal */ }
}

/** Streak count for the UI (0 = hidden). */
export function currentStreak(today: string): number {
	return displayStreak(streakState.record, today);
}
