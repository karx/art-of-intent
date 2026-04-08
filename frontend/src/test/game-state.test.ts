import { describe, it, expect, beforeEach } from 'vitest';
import {
	createGameState,
	applyAttemptResult,
	type GameState,
	type AttemptResult,
} from '$lib/stores/game.svelte';

describe('createGameState', () => {
	it('initialises with empty state', () => {
		const s = createGameState();
		expect(s.attempts).toBe(0);
		expect(s.totalTokens).toBe(0);
		expect(s.matchedWords.size).toBe(0);
		expect(s.creepLevel).toBe(0);
		expect(s.gameOver).toBe(false);
	});
});

describe('applyAttemptResult', () => {
	let state: GameState;

	beforeEach(() => {
		state = createGameState();
		state.targetWords = ['ocean', 'dawn', 'stone'];
		state.blacklistWords = ['water', 'sun'];
		state.creepThreshold = 100;
		state.creepPerViolation = 25;
	});

	it('increments attempts and totalTokens', () => {
		const next = applyAttemptResult(state, { tokens: 45, newMatches: [], blacklistViolations: 0 });
		expect(next.attempts).toBe(1);
		expect(next.totalTokens).toBe(45);
	});

	it('adds newly matched target words', () => {
		const next = applyAttemptResult(state, {
			tokens: 30,
			newMatches: ['ocean', 'dawn'],
			blacklistViolations: 0,
		});
		expect(next.matchedWords.has('ocean')).toBe(true);
		expect(next.matchedWords.has('dawn')).toBe(true);
		expect(next.matchedWords.has('stone')).toBe(false);
	});

	it('increases creep on blacklist violations', () => {
		const next = applyAttemptResult(state, {
			tokens: 50,
			newMatches: [],
			blacklistViolations: 2,
		});
		expect(next.creepLevel).toBe(50); // 2 × 25
	});

	it('caps creep at threshold', () => {
		state.creepLevel = 90;
		const next = applyAttemptResult(state, {
			tokens: 20,
			newMatches: [],
			blacklistViolations: 3, // would add 75
		});
		expect(next.creepLevel).toBe(100);
	});

	it('sets gameOver when all targets matched', () => {
		const next = applyAttemptResult(state, {
			tokens: 30,
			newMatches: ['ocean', 'dawn', 'stone'],
			blacklistViolations: 0,
		});
		expect(next.gameOver).toBe(true);
		expect(next.wonGame).toBe(true);
	});

	it('sets gameOver when creep reaches threshold', () => {
		state.creepLevel = 75;
		const next = applyAttemptResult(state, {
			tokens: 20,
			newMatches: [],
			blacklistViolations: 1, // +25 → 100
		});
		expect(next.gameOver).toBe(true);
		expect(next.wonGame).toBe(false);
	});

	it('does not mutate the original state', () => {
		const orig = state.attempts;
		applyAttemptResult(state, { tokens: 30, newMatches: [], blacklistViolations: 0 });
		expect(state.attempts).toBe(orig);
	});
});
