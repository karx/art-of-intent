/**
 * Share text — the plain-text sibling of the share card.
 * Pure: derives the featured haiku line from the trail and frames the
 * result as a challenge. Links to a #r= result URL when one is given.
 */

const SITE_URL = 'https://art-of-intent.netlify.app';

export interface ShareTextEntry {
	haiku: string;
	newMatches: string[];
	violation: boolean;
}

export interface ShareTextInput {
	won: boolean;
	matched: number;
	total: number;
	attempts: number;
	trail: ShareTextEntry[];
	resultUrl?: string;
}

export function buildShareText({ won, matched, total, attempts, trail, resultUrl }: ShareTextInput): string {
	const best = trail
		.filter((e) => !e.violation && e.newMatches.length > 0)
		.sort((a, b) => b.newMatches.length - a.newMatches.length)[0];
	const hint = best?.haiku?.trim().split('\n')[0];
	const haikuHint = hint ? `\n"${hint}…"` : '';
	const link = resultUrl ?? SITE_URL;

	if (won)
		return `🎯 Art of Intent — ${matched}/${total} words in ${attempts} attempts${haikuHint}\n\nCan you beat it? → ${link}`;
	return `🎮 Art of Intent — ${matched}/${total} words. This haiku bot is tricky!${haikuHint}\n\nTry today's puzzle → ${link}`;
}
