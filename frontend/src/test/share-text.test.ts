import { describe, it, expect } from 'vitest';
import { buildShareText, type ShareTextInput } from '$lib/share-text';

const entry = (haiku: string, newMatches: string[], violation = false) => ({
	haiku,
	newMatches,
	violation,
});

const winInput: ShareTextInput = {
	won: true,
	matched: 3,
	total: 3,
	attempts: 12,
	trail: [
		entry('First haiku line\nsecond line\nthird line', ['moon']),
		entry('Best haiku line\nmiddle line\nlast line', ['river', 'stone']),
	],
	resultUrl: 'https://art-of-intent.netlify.app/#r=abc123',
};

describe('buildShareText', () => {
	it('win text carries counts, attempts, and a challenge CTA', () => {
		const text = buildShareText(winInput);
		expect(text).toContain('3/3 words in 12 attempts');
		expect(text).toContain('Can you beat it?');
	});

	it('quotes the first line of the haiku with the most matches', () => {
		expect(buildShareText(winInput)).toContain('"Best haiku line…"');
	});

	it('links to the result URL when given', () => {
		expect(buildShareText(winInput)).toContain('https://art-of-intent.netlify.app/#r=abc123');
	});

	it('falls back to the homepage without a result URL', () => {
		const text = buildShareText({ ...winInput, resultUrl: undefined });
		expect(text).toContain('https://art-of-intent.netlify.app');
		expect(text).not.toContain('#r=');
	});

	it('ignores violation entries when picking the featured haiku', () => {
		const text = buildShareText({
			...winInput,
			trail: [
				entry('Tainted haiku\nx\ny', ['moon', 'river', 'stone'], true),
				entry('Clean haiku\nx\ny', ['moon']),
			],
		});
		expect(text).toContain('"Clean haiku…"');
	});

	it('omits the quote line when no haiku matched anything', () => {
		const text = buildShareText({ ...winInput, won: false, matched: 0, trail: [entry('No luck here\nx\ny', [])] });
		expect(text).not.toContain('"');
	});

	it('loss text uses the try-it framing', () => {
		const text = buildShareText({ ...winInput, won: false, matched: 1 });
		expect(text).toContain('1/3 words');
		expect(text).toContain('Try today');
	});
});
