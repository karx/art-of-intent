/**
 * Training Log — pure formatting/mapping from dailyWords.aiEvaluation
 * into the post-game "ARTY LEARNS" view model.
 *
 * Data comes from the already-fetched dailyWords doc (zero extra reads).
 * Returns null when evaluation is absent so the UI can hide the tab.
 */

export type Difficulty = 'low' | 'medium' | 'high';

export interface ProbeResult {
	prompt: string;
	response: string;
	wordsMatched: string[];
	blacklistHit?: boolean;
	tokensUsed?: number;
	deltaWordsMatched?: number;
	allMatched?: string[];
}

export interface WordDifficultyEntry {
	difficulty: Difficulty;
	matchedZeroShot: boolean;
	matchedOneShot: boolean;
	embeddabilityScore?: number | null;
}

export interface AIEvaluation {
	model?: string;
	wordDifficulty?: Record<string, WordDifficultyEntry>;
	zeroShot?: ProbeResult;
	oneShot?: ProbeResult;
	summary?: {
		zeroShotScore?: number;
		oneShotScore?: number;
		improvementDelta?: number;
		totalTokens?: number;
		converged?: boolean;
		hardestWord?: string | null;
	};
}

export interface TrainingLogStep {
	label: string;       // "STEP 1 — ZERO SHOT"
	subtitle: string;    // "No hints. First instinct."
	prompt: string;
	response: string;
	wordsMatched: string[];
	/** Cumulative score after this step, for "(N of 3)" */
	scoreAfter: number;
	targetCount: number;
	tokensUsed: number;
	blacklistHit: boolean;
}

export interface DifficultyBadge {
	word: string;
	difficulty: Difficulty;
	label: string; // "[LOW]" / "[MEDIUM]" / "[HIGH]"
}

export interface TrainingLogView {
	date: string;
	human: { attempts: number; tokens: number };
	ai: {
		probes: number;
		tokens: number;
		/** "converged" | "partial" | "none" */
		status: 'converged' | 'partial' | 'none';
		statusLabel: string;
	};
	steps: TrainingLogStep[];
	learningSignal: string;
	hardestWord: string | null;
	hardestWordNote: string;
	explainer: string;
	difficultyBadges: DifficultyBadge[];
}

const EXPLAINER =
	'The AI saw which words appeared and rewrote its prompt. That feedback loop — generate → evaluate → adjust — is the core mechanism behind RLHF and in-context learning. No weights changed. The model just… adapted.';

export function formatDifficultyLabel(difficulty: Difficulty | string | undefined): string {
	const d = String(difficulty ?? 'high').toLowerCase();
	if (d === 'low') return '[LOW]';
	if (d === 'medium') return '[MEDIUM]';
	return '[HIGH]';
}

/**
 * Learning-signal one-liner for the summary strip.
 * delta is words newly matched on the one-shot probe.
 */
export function formatLearningSignal(
	delta: number,
	zeroShotScore: number,
	targetCount: number
): string {
	if (zeroShotScore >= targetCount && targetCount > 0) {
		return 'already perfect on first try';
	}
	if (delta > 0) {
		return `+${delta} word${delta === 1 ? '' : 's'} after feedback`;
	}
	if (delta < 0) {
		return `${delta} words after feedback`;
	}
	return 'no improvement after feedback';
}

export function formatHardestWordNote(
	hardestWord: string | null,
	wordDifficulty?: Record<string, WordDifficultyEntry>
): string {
	if (!hardestWord) return 'none — all words matched at least once';
	const entry = wordDifficulty?.[hardestWord];
	if (entry && !entry.matchedZeroShot && !entry.matchedOneShot) {
		return `${hardestWord} — neither attempt`;
	}
	return `${hardestWord} — hardest for Arty today`;
}

function aiStatus(
	converged: boolean,
	oneShotScore: number
): { status: TrainingLogView['ai']['status']; statusLabel: string } {
	if (converged || oneShotScore >= 3) return { status: 'converged', statusLabel: 'converged' };
	if (oneShotScore > 0) return { status: 'partial', statusLabel: 'partial' };
	return { status: 'none', statusLabel: 'none' };
}

export interface BuildTrainingLogInput {
	date: string;
	aiEvaluation: AIEvaluation | null | undefined;
	humanAttempts: number;
	humanTokens: number;
	targetWords: string[];
}

export interface YouVsArtyInput {
	humanAttempts: number;
	humanTokens: number;
	/** aiEvaluation.summary — omit or null when evaluation is absent for the day */
	summary?: AIEvaluation['summary'] | null;
}

/**
 * One-line "You vs Arty" comparison for share text / share card.
 * Returns null when evaluation summary is missing so callers can omit the line.
 */
export function buildYouVsArtyLine({
	humanAttempts,
	humanTokens,
	summary,
}: YouVsArtyInput): string | null {
	if (!summary || summary.totalTokens == null) return null;

	const probes = 2;
	const aiTok = summary.totalTokens;
	const status = summary.converged
		? 'converged'
		: `${summary.oneShotScore ?? 0}/3 words`;
	const hard = summary.hardestWord ? ` · hardest: ${summary.hardestWord}` : '';

	return `You ${humanAttempts} att · ${humanTokens} tok  vs  Arty ${probes} probes · ${aiTok} tok (${status})${hard}`;
}

/**
 * Map raw aiEvaluation + human stats into the Training Log view model.
 * Returns null when evaluation data is missing or incomplete.
 */
export function buildTrainingLog({
	date,
	aiEvaluation,
	humanAttempts,
	humanTokens,
	targetWords,
}: BuildTrainingLogInput): TrainingLogView | null {
	if (!aiEvaluation?.zeroShot || !aiEvaluation?.oneShot) return null;

	const targetCount = targetWords.length || 3;
	const zero = aiEvaluation.zeroShot;
	const one = aiEvaluation.oneShot;
	const summary = aiEvaluation.summary ?? {};

	const zeroScore = summary.zeroShotScore ?? zero.wordsMatched?.length ?? 0;
	const oneScore =
		summary.oneShotScore ??
		one.allMatched?.length ??
		[...new Set([...(zero.wordsMatched ?? []), ...(one.wordsMatched ?? [])])].length;
	const delta = summary.improvementDelta ?? one.deltaWordsMatched ?? Math.max(0, oneScore - zeroScore);
	const aiTokens = summary.totalTokens ?? (zero.tokensUsed ?? 0) + (one.tokensUsed ?? 0);
	const converged = summary.converged ?? oneScore >= targetCount;
	const hardestWord =
		summary.hardestWord !== undefined
			? summary.hardestWord
			: targetWords.find((w) => aiEvaluation.wordDifficulty?.[w]?.difficulty === 'high') ?? null;

	const { status, statusLabel } = aiStatus(!!converged, oneScore);

	// Step 2 reward line shows words newly matched after feedback (the learning signal).
	const newlyMatched = (one.wordsMatched ?? []).filter(
		(w) => !(zero.wordsMatched ?? []).includes(w)
	);

	const steps: TrainingLogStep[] = [
		{
			label: 'STEP 1 — ZERO SHOT',
			subtitle: 'No hints. First instinct.',
			prompt: zero.prompt ?? '',
			response: zero.response ?? '',
			wordsMatched: zero.wordsMatched ?? [],
			scoreAfter: zeroScore,
			targetCount,
			tokensUsed: zero.tokensUsed ?? 0,
			blacklistHit: !!zero.blacklistHit,
		},
		{
			label: 'STEP 2 — ONE SHOT',
			subtitle: 'Given feedback. One chance to adapt.',
			prompt: one.prompt ?? '',
			response: one.response ?? '',
			wordsMatched: newlyMatched,
			scoreAfter: oneScore,
			targetCount,
			tokensUsed: one.tokensUsed ?? 0,
			blacklistHit: !!one.blacklistHit,
		},
	];

	const difficultyBadges: DifficultyBadge[] = targetWords.map((word) => {
		const difficulty = aiEvaluation.wordDifficulty?.[word]?.difficulty ?? 'high';
		return {
			word,
			difficulty,
			label: formatDifficultyLabel(difficulty),
		};
	});

	return {
		date,
		human: { attempts: humanAttempts, tokens: humanTokens },
		ai: {
			probes: 2,
			tokens: aiTokens,
			status,
			statusLabel,
		},
		steps,
		learningSignal: formatLearningSignal(delta, zeroScore, targetCount),
		hardestWord,
		hardestWordNote: formatHardestWordNote(hardestWord, aiEvaluation.wordDifficulty),
		explainer: EXPLAINER,
		difficultyBadges,
	};
}
