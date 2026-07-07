/**
 * Word hints — after a few attempts, unmatched target words reveal the
 * category they were drawn from (e.g. [nature]) to suggest prompt angles.
 * Categories ship in the dailyWords doc; days generated before the
 * rollout have none, so every path must tolerate missing categories.
 */

export const HINT_THRESHOLD = 3;

export interface HintsInput {
	attempts: number;
	targetWords: string[];
	matchedWords: Set<string>;
	categories?: string[];
}

/** Per-target-word hint to display, aligned with targetWords; null = no hint. */
export function revealedHints({ attempts, targetWords, matchedWords, categories }: HintsInput): (string | null)[] {
	if (attempts < HINT_THRESHOLD || !categories?.length) return targetWords.map(() => null);
	return targetWords.map((word, i) => (matchedWords.has(word) ? null : (categories[i] ?? null)));
}
