import { computeEfficiencyScore } from '$lib/scoring';

/**
 * Compact game-result token carried in the URL hash (#r=<token>).
 * Everything a read-only result view needs — no Firestore lookup.
 * Keys are single letters to keep the token tweet-sized.
 */
export interface ResultPayload {
	v: 1;                 // token format version
	d: string;            // game date, YYYY-MM-DD
	a: number;            // attempts
	t: number;            // total tokens
	m: number;            // target words matched
	n: number;            // target word count
	s: number | null;     // efficiency score (null for loss/cheat)
	w: (0 | 1)[];         // per-target-word found bits, in target order
	r: 'W' | 'L';         // result
	c?: true;             // cheated (omitted for honest runs)
}

const SITE_URL = 'https://art-of-intent.netlify.app/';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ResultInput {
	date: string;
	targetWords: string[];
	matchedWords: Set<string>;
	attempts: number;
	totalTokens: number;
	won: boolean;
	cheated: boolean;
}

export function buildResultPayload(input: ResultInput): ResultPayload {
	const { date, targetWords, matchedWords, attempts, totalTokens, won, cheated } = input;
	const payload: ResultPayload = {
		v: 1,
		d: date,
		a: attempts,
		t: totalTokens,
		m: matchedWords.size,
		n: targetWords.length,
		s: computeEfficiencyScore({ won, cheated, attempts, totalTokens }),
		w: targetWords.map((word) => (matchedWords.has(word) ? 1 : 0)),
		r: won ? 'W' : 'L',
	};
	if (cheated) payload.c = true;
	return payload;
}

/** Payload → base64url token (no +, /, = — safe in a URL hash unencoded). */
export function encodeResult(payload: ResultPayload): string {
	return btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Token → payload. Defensive: user-supplied hashes return null on any problem, never throw. */
export function decodeResult(token: string): ResultPayload | null {
	try {
		const json = atob(token.replaceAll('-', '+').replaceAll('_', '/'));
		const p = JSON.parse(json);
		return isValidPayload(p) ? p : null;
	} catch {
		return null;
	}
}

export function generateResultUrl(payload: ResultPayload): string {
	return `${SITE_URL}#r=${encodeResult(payload)}`;
}

function isValidPayload(p: unknown): p is ResultPayload {
	if (typeof p !== 'object' || p === null) return false;
	const o = p as Record<string, unknown>;
	return (
		o.v === 1 &&
		typeof o.d === 'string' && DATE_RE.test(o.d) &&
		typeof o.a === 'number' &&
		typeof o.t === 'number' &&
		typeof o.m === 'number' &&
		typeof o.n === 'number' &&
		(o.s === null || typeof o.s === 'number') &&
		Array.isArray(o.w) && o.w.every((b) => b === 0 || b === 1) &&
		(o.r === 'W' || o.r === 'L') &&
		(o.c === undefined || o.c === true)
	);
}
