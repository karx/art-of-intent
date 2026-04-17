/**
 * Arty ASCII Window — built letter by letter from the haiku's own characters.
 *
 * Starting state: two soulful eyes in the void.
 * Every haiku adds its letters as raw material — shaping head, body, legs, environment.
 *
 * Color protocol (parsed by ArtyWidget canvas renderer):
 *   §...§   — toggle: characters inside are "matched" (rendered in bright green)
 *   ◉◎●○◈▣  — eye characters, always rendered in amber/gold
 *   all else — default teal
 */

/** Just two eyes — the start. No haiku has been written yet. */
export const INITIAL_ARTY_ASCII = `




          ◉       ◉




`;

/**
 * Parse a line into colored segments.
 * Returns array of {text, color: 'default'|'matched'|'eye'}.
 */
export type SegmentColor = 'default' | 'matched' | 'eye';
export interface ArtSegment { text: string; color: SegmentColor }

const EYE_CHARS = new Set(['◉', '◎', '●', '○', '◈', '▣', '⊡']);

export function parseArtLine(line: string): ArtSegment[] {
	const segments: ArtSegment[] = [];
	let inMatch = false;
	let buf = '';
	let bufColor: SegmentColor = 'default';

	const flush = (nextColor: SegmentColor) => {
		if (buf) segments.push({ text: buf, color: bufColor });
		buf = '';
		bufColor = nextColor;
	};

	for (const ch of line) {
		if (ch === '§') {
			flush(inMatch ? 'default' : 'matched');
			inMatch = !inMatch;
			continue;
		}
		const chColor: SegmentColor = EYE_CHARS.has(ch) ? 'eye' : (inMatch ? 'matched' : 'default');
		if (chColor !== bufColor) { flush(chColor); }
		buf += ch;
	}
	flush('default');
	return segments.filter(s => s.text.length > 0);
}

/**
 * Sanitise an ASCII window string from the server.
 * Strips control chars; validates it has content.
 */
export function sanitiseAsciiWindow(raw: string, fallback = INITIAL_ARTY_ASCII): string {
	if (typeof raw !== 'string') return fallback;
	const lines = raw.split('\n');
	if (lines.length < 3 || lines.length > 30) return fallback;
	const cleaned = lines
		.map(l => l.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, ''))
		.join('\n');
	return cleaned.trim() ? cleaned : fallback;
}
