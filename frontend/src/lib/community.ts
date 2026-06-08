/**
 * Pure logic for the community gallery feature.
 * Extracted here so it can be tested independently of Svelte/Firebase.
 */

export interface TrailEntry {
	type: 'normal' | 'success' | 'violation' | 'victory' | 'defeat' | 'cheat';
	haiku: string;
}

/**
 * Pick the haiku to feature when publishing a session.
 * Priority: victory entry → last success entry → last trail entry.
 */
export function getFeaturedHaiku(trail: TrailEntry[]): string {
	const victory = trail.find(e => e.type === 'victory');
	if (victory) return victory.haiku;

	const successes = trail.filter(e => e.type === 'success');
	if (successes.length) return successes[successes.length - 1].haiku;

	return trail.length ? trail[trail.length - 1].haiku : '';
}

/**
 * Composite Firestore document key for a recite.
 * One document per (session, user) pair — enforces deduplication at the DB level.
 */
export function buildReciteId(sessionId: string, userId: string): string {
	return `${sessionId}_${userId}`;
}

/**
 * localStorage key for remembering if the current player has already recited a post.
 */
export function reciteCacheKey(sessionId: string): string {
	return `aoi_recited_${sessionId}`;
}
