import { describe, it, expect } from 'vitest';
import { revealedHints, HINT_THRESHOLD } from '$lib/hints';

const base = {
	attempts: 3,
	targetWords: ['moon', 'river', 'stone'],
	matchedWords: new Set<string>(),
	categories: ['sky', 'water', 'earth'],
};

describe('revealedHints', () => {
	it('reveals nothing before the attempt threshold', () => {
		expect(revealedHints({ ...base, attempts: HINT_THRESHOLD - 1 })).toEqual([null, null, null]);
	});

	it('reveals categories for unmatched words at the threshold', () => {
		expect(revealedHints(base)).toEqual(['sky', 'water', 'earth']);
	});

	it('never hints a word that is already matched', () => {
		expect(revealedHints({ ...base, matchedWords: new Set(['river']) }))
			.toEqual(['sky', null, 'earth']);
	});

	it('returns nulls when the day has no categories (pre-rollout docs)', () => {
		expect(revealedHints({ ...base, categories: undefined })).toEqual([null, null, null]);
		expect(revealedHints({ ...base, categories: [] })).toEqual([null, null, null]);
	});

	it('handles a categories/words length mismatch defensively', () => {
		expect(revealedHints({ ...base, categories: ['sky'] })).toEqual(['sky', null, null]);
	});

	it('keeps revealing on later attempts', () => {
		expect(revealedHints({ ...base, attempts: 9 })).toEqual(['sky', 'water', 'earth']);
	});
});
