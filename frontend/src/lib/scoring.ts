export interface Rating {
	label: string;
	stars: string;
	color: 'success' | 'info' | 'warning' | 'error';
}

/** Tokens-per-attempt → rating band. Mirrors the bands in the original game.js. */
export function getRating(avgTokensPerAttempt: number): Rating {
	if (avgTokensPerAttempt < 40) return { label: 'EXCELLENT', stars: '★★★', color: 'success' };
	if (avgTokensPerAttempt < 50) return { label: 'GOOD',      stars: '★★☆', color: 'info'    };
	if (avgTokensPerAttempt < 60) return { label: 'AVERAGE',   stars: '★☆☆', color: 'warning' };
	return                               { label: 'NEEDS WORK', stars: '☆☆☆', color: 'error'   };
}

/** Average tokens per attempt, rounded to 1 decimal. Returns 0 if no attempts. */
export function calculateEfficiency(totalTokens: number, attempts: number): number {
	if (attempts === 0) return 0;
	return Math.round((totalTokens / attempts) * 10) / 10;
}

export interface ScoreInput {
	won: boolean;
	cheated: boolean;
	attempts: number;
	totalTokens: number;
}

/**
 * Leaderboard efficiency score. Lower is better.
 * Only victories score; losses and cheat runs are null.
 */
export function computeEfficiencyScore({ won, cheated, attempts, totalTokens }: ScoreInput): number | null {
	if (!won || cheated) return null;
	return attempts * 10 + Math.floor(totalTokens / 10);
}
