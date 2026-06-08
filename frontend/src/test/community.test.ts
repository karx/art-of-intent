import { describe, it, expect } from 'vitest';
import { getFeaturedHaiku, buildReciteId, reciteCacheKey } from '$lib/community';

describe('getFeaturedHaiku', () => {
	it('returns empty string for an empty trail', () => {
		expect(getFeaturedHaiku([])).toBe('');
	});

	it('returns the haiku of the victory entry', () => {
		const trail = [
			{ type: 'normal',  haiku: 'first attempt' },
			{ type: 'success', haiku: 'partial match' },
			{ type: 'victory', haiku: 'winning haiku' },
		] as any;
		expect(getFeaturedHaiku(trail)).toBe('winning haiku');
	});

	it('returns the last success haiku when there is no victory', () => {
		const trail = [
			{ type: 'success', haiku: 'first match' },
			{ type: 'normal',  haiku: 'no match' },
			{ type: 'success', haiku: 'second match' },
		] as any;
		expect(getFeaturedHaiku(trail)).toBe('second match');
	});

	it('returns the last trail entry haiku when no victory or success', () => {
		const trail = [
			{ type: 'normal',    haiku: 'attempt one' },
			{ type: 'violation', haiku: 'bad move' },
			{ type: 'defeat',    haiku: 'darkness wins' },
		] as any;
		expect(getFeaturedHaiku(trail)).toBe('darkness wins');
	});

	it('prefers victory over success when both exist', () => {
		const trail = [
			{ type: 'success', haiku: 'partial' },
			{ type: 'victory', haiku: 'clincher' },
			{ type: 'success', haiku: 'after-victory success' },
		] as any;
		expect(getFeaturedHaiku(trail)).toBe('clincher');
	});

	it('handles a single normal entry', () => {
		const trail = [{ type: 'normal', haiku: 'only attempt' }] as any;
		expect(getFeaturedHaiku(trail)).toBe('only attempt');
	});
});

describe('buildReciteId', () => {
	it('joins sessionId and userId with underscore', () => {
		expect(buildReciteId('session-abc', 'user-xyz')).toBe('session-abc_user-xyz');
	});

	it('handles UUIDs with hyphens', () => {
		const id = buildReciteId('550e8400-e29b-41d4-a716-446655440000', 'uid123');
		expect(id).toBe('550e8400-e29b-41d4-a716-446655440000_uid123');
	});
});

describe('reciteCacheKey', () => {
	it('prefixes with aoi_recited_', () => {
		expect(reciteCacheKey('abc123')).toBe('aoi_recited_abc123');
	});
});
