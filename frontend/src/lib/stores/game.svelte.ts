export interface GameState {
	targetWords: string[];
	blacklistWords: string[];
	attempts: number;
	totalTokens: number;
	matchedWords: Set<string>;
	creepLevel: number;
	creepThreshold: number;
	creepPerViolation: number;
	gameOver: boolean;
	wonGame: boolean;
	cheated: boolean;
	currentDate: string | null;
	sessionId: string | null;
}

export interface AttemptResult {
	tokens: number;
	newMatches: string[];
	blacklistViolations: number;
}

export function createGameState(): GameState {
	return {
		targetWords: [],
		blacklistWords: [],
		attempts: 0,
		totalTokens: 0,
		matchedWords: new Set(),
		creepLevel: 0,
		creepThreshold: 100,
		creepPerViolation: 25,
		gameOver: false,
		wonGame: false,
		cheated: false,
		currentDate: null,
		sessionId: null,
	};
}

/**
 * Pure function — returns a new state with the attempt applied.
 * Does not mutate the input.
 */
export function applyAttemptResult(state: GameState, result: AttemptResult): GameState {
	const matchedWords = new Set(state.matchedWords);
	for (const word of result.newMatches) matchedWords.add(word);

	const creepIncrease = result.blacklistViolations * state.creepPerViolation;
	const creepLevel = Math.min(state.creepLevel + creepIncrease, state.creepThreshold);
	const totalTokens = state.totalTokens + result.tokens;
	const attempts = state.attempts + 1;

	const allMatched = state.targetWords.length > 0 && matchedWords.size >= state.targetWords.length;
	const creepMaxed = creepLevel >= state.creepThreshold;
	const gameOver = allMatched || creepMaxed;

	return {
		...state,
		attempts,
		totalTokens,
		matchedWords,
		creepLevel,
		gameOver,
		wonGame: allMatched,
	};
}

// ── Reactive store (Svelte 5 runes) ──────────────────────────────────────────

export const gameState = $state<GameState>(createGameState());

export function resetGame() {
	const fresh = createGameState();
	Object.assign(gameState, fresh);
	gameState.matchedWords = new Set(); // Set isn't spread-copyable via Object.assign in Svelte runes
}
