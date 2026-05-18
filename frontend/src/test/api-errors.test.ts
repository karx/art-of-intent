import { describe, it, expect } from 'vitest';
import { mapCallableError } from '$lib/api';

function makeErr(code: string, details?: any, message?: string) {
	return { code, details, message };
}

describe('mapCallableError', () => {
	it('returns an Error instance for every code', () => {
		expect(mapCallableError(makeErr('unauthenticated'))).toBeInstanceOf(Error);
	});

	it('unauthenticated → sign-in prompt', () => {
		const err = mapCallableError(makeErr('unauthenticated'));
		expect(err.message).toBe('Please sign in to play.');
	});

	it('invalid-argument → prompt rejected message', () => {
		const err = mapCallableError(makeErr('invalid-argument'));
		expect(err.message).toContain('rejected');
	});

	it('resource-exhausted with retryAfterSeconds → includes seconds', () => {
		const err = mapCallableError(makeErr('resource-exhausted', { retryAfterSeconds: 5 }));
		expect(err.message).toContain('5s');
	});

	it('resource-exhausted without retryAfterSeconds → generic wait message', () => {
		const err = mapCallableError(makeErr('resource-exhausted', {}));
		expect(err.message).toContain('Too many requests');
	});

	it('resource-exhausted with retryAfterSeconds: null → generic wait message', () => {
		const err = mapCallableError(makeErr('resource-exhausted', { retryAfterSeconds: null }));
		expect(err.message).toContain('Too many requests');
	});

	it('unavailable → temporarily unavailable message', () => {
		const err = mapCallableError(makeErr('unavailable'));
		expect(err.message).toContain('unavailable');
	});

	it('deadline-exceeded → timeout message', () => {
		const err = mapCallableError(makeErr('deadline-exceeded'));
		expect(err.message).toContain('too long');
	});

	it('not-found → today\'s words not loaded message', () => {
		const err = mapCallableError(makeErr('not-found'));
		expect(err.message).toContain("words");
	});

	it('permission-denied with non-gemini provider → API key rejected', () => {
		const err = mapCallableError(makeErr('permission-denied', { provider: 'openai' }));
		expect(err.message).toContain('API key was rejected');
	});

	it('permission-denied with anthropic provider → API key rejected', () => {
		const err = mapCallableError(makeErr('permission-denied', { provider: 'anthropic' }));
		expect(err.message).toContain('API key was rejected');
	});

	it('permission-denied with provider: "gemini" → service config error', () => {
		const err = mapCallableError(makeErr('permission-denied', { provider: 'gemini' }));
		expect(err.message).toContain('configuration error');
	});

	it('permission-denied with no provider in details → service config error', () => {
		const err = mapCallableError(makeErr('permission-denied', {}));
		expect(err.message).toContain('configuration error');
	});

	it('permission-denied with no details → service config error', () => {
		const err = mapCallableError(makeErr('permission-denied'));
		expect(err.message).toContain('configuration error');
	});

	it('unknown error code with a message → uses the message', () => {
		const err = mapCallableError(makeErr('functions/unknown', undefined, 'Custom server error'));
		expect(err.message).toBe('Custom server error');
	});

	it('unknown error code without a message → generic fallback', () => {
		const err = mapCallableError(makeErr('functions/unknown'));
		expect(err.message).toContain('Could not reach Arty');
	});

	it('plain Error (no .code) → uses err.message', () => {
		const plainErr = new Error('Failed to generate haiku');
		const mapped = mapCallableError(plainErr);
		expect(mapped.message).toBe('Failed to generate haiku');
	});
});
