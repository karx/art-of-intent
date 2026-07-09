/**
 * Daily Haiku Wall — shapes public session docs into a gallery of the
 * day's winning haikus. Deliberately excludes player prompts: prompts can
 * be personal; Arty's haikus are the communal artifact.
 */

export interface WallAttempt {
	response: string;
	foundWords: string[];
	isViolation?: boolean;
}

export interface WallSession {
	displayName?: string;
	userName?: string;
	attemptsData?: WallAttempt[];
	attempts?: number;
	efficiencyScore?: number | null;
	cheated?: boolean;
}

export interface WallEntry {
	displayName: string;
	haiku: string;
	foundWords: string[];
	attempts: number;
	score: number | null;
	cheated: boolean;
}

/** Best honest-attempt haiku per session, most efficient first, cheat runs last. */
export function buildWallEntries(sessions: WallSession[], max = 20): WallEntry[] {
	const entries: WallEntry[] = [];
	for (const s of sessions) {
		const featured = (s.attemptsData ?? [])
			.filter((a) => !a.isViolation && (a.foundWords?.length ?? 0) > 0 && a.response)
			.reduce<WallAttempt | null>(
				(best, a) => (!best || a.foundWords.length > best.foundWords.length ? a : best),
				null,
			);
		if (!featured) continue;
		entries.push({
			displayName: s.displayName ?? s.userName ?? 'Anonymous',
			haiku: featured.response,
			foundWords: featured.foundWords,
			attempts: s.attempts ?? 0,
			score: s.efficiencyScore ?? null,
			cheated: s.cheated === true,
		});
	}
	entries.sort((a, b) => {
		if (a.cheated !== b.cheated) return a.cheated ? 1 : -1;
		if (a.score === null) return b.score === null ? 0 : 1;
		if (b.score === null) return -1;
		return a.score - b.score;
	});
	return entries.slice(0, max);
}
