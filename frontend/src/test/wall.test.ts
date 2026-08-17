import { describe, it, expect } from 'vitest';
import { buildWallEntries, type WallSession } from '$lib/wall';

const session = (over: Partial<WallSession> = {}): WallSession => ({
	displayName: 'Basho',
	attempts: 5,
	efficiencyScore: 300,
	cheated: false,
	attemptsData: [
		{ response: 'one word haiku\nline two\nline three', foundWords: ['moon'], isViolation: false },
		{ response: 'two word haiku\nline two\nline three', foundWords: ['river', 'stone'], isViolation: false },
	],
	...over,
});

describe('buildWallEntries', () => {
	it('features the haiku that matched the most words', () => {
		const [entry] = buildWallEntries([session()]);
		expect(entry.haiku).toBe('two word haiku\nline two\nline three');
		expect(entry.foundWords).toEqual(['river', 'stone']);
	});

	it('ignores violation attempts even with matches', () => {
		const [entry] = buildWallEntries([session({
			attemptsData: [
				{ response: 'tainted', foundWords: ['a', 'b', 'c'], isViolation: true },
				{ response: 'clean haiku', foundWords: ['moon'], isViolation: false },
			],
		})]);
		expect(entry.haiku).toBe('clean haiku');
	});

	it('drops sessions with no matching haiku', () => {
		expect(buildWallEntries([session({ attemptsData: [{ response: 'x', foundWords: [], isViolation: false }] })])).toEqual([]);
		expect(buildWallEntries([session({ attemptsData: undefined })])).toEqual([]);
	});

	it('sorts honest entries by score ascending, cheat runs last', () => {
		const entries = buildWallEntries([
			session({ displayName: 'C', cheated: true, efficiencyScore: null }),
			session({ displayName: 'B', efficiencyScore: 500 }),
			session({ displayName: 'A', efficiencyScore: 120 }),
		]);
		expect(entries.map((e) => e.displayName)).toEqual(['A', 'B', 'C']);
	});

	it('falls back through display names and defaults missing fields', () => {
		const [entry] = buildWallEntries([session({ displayName: undefined, userName: 'Issa', attempts: undefined, efficiencyScore: undefined })]);
		expect(entry.displayName).toBe('Issa');
		expect(entry.attempts).toBe(0);
		expect(entry.score).toBeNull();
	});

	it('caps the wall at max entries', () => {
		const many = Array.from({ length: 30 }, (_, i) => session({ efficiencyScore: i }));
		expect(buildWallEntries(many, 12)).toHaveLength(12);
	});
});
