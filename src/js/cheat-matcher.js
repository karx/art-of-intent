/**
 * cheat-matcher.js — Pure algorithm module for cheat-code detection.
 *
 * No browser globals. Fully importable in Node / Jest.
 *
 * Matching strategy (hybrid):
 *   1. Word-level coverage   — what fraction of the haiku's words appear in
 *                              the player's input (per-word fuzzy ±1 edit for
 *                              words ≥ 4 chars).  This is the primary signal.
 *   2. Character similarity  — normalized Levenshtein ratio on the stripped
 *                              strings. Used as a sanity guard; prevents a
 *                              lucky word overlap from firing on garbage input.
 *
 * A code matches when BOTH metrics clear their thresholds and the combined
 * weighted score is the highest among all candidates.
 */

// ── Tuneable constants ─────────────────────────────────────────────────────────

/** Minimum length of the normalized input; prevents trivially short strings matching. */
export const MIN_NORMALIZED_LENGTH = 15;

/**
 * Minimum fraction of the haiku's word tokens that must appear (fuzzy) in the
 * player's input.  0.75 means 3 out of 4 words.
 */
export const COVERAGE_THRESHOLD = 0.75;

/**
 * Minimum character-level similarity ratio (0–1).  Guards against a lucky
 * word-overlap on a very different-length input.
 */
export const CHAR_SIM_THRESHOLD = 0.55;

/** Weights used for the combined score (must sum to 1). */
export const WEIGHT_COVERAGE = 0.6;
export const WEIGHT_CHAR_SIM = 0.4;

// ── Text primitives ────────────────────────────────────────────────────────────

/**
 * Strip everything except a–z and 0–9, lowercase.
 * All punctuation, spaces, diacritics, and line-breaks are removed.
 */
export function normalize(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Split into word tokens: lowercase, replace non-alphanumeric with spaces,
 * split on whitespace, remove empties.
 */
export function tokenize(str) {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

// ── Edit distance ──────────────────────────────────────────────────────────────

/**
 * Classic Levenshtein edit distance.  O(m·n) time, O(n) space (two-row).
 */
export function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1);

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                curr[j - 1] + 1,       // insertion
                prev[j]     + 1,       // deletion
                prev[j - 1] + cost     // substitution
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

// ── Word-level matching ────────────────────────────────────────────────────────

/**
 * Fuzzy word equality: exact match, OR edit distance ≤ 1 for words where
 * both sides are at least 4 characters long (avoids over-matching short words
 * like "a" ↔ "an").
 */
export function wordFuzzyMatch(a, b) {
    if (a === b) return true;
    if (a.length >= 4 && b.length >= 4 && levenshtein(a, b) <= 1) return true;
    return false;
}

/**
 * Fraction of `codeTokens` that have at least one fuzzy match in `inputTokens`.
 * Returns a value in [0, 1].
 *
 * @param {string[]} inputTokens - Tokens from the player's prompt
 * @param {string[]} codeTokens  - Tokens from the canonical haiku
 */
export function computeWordCoverage(inputTokens, codeTokens) {
    if (codeTokens.length === 0) return 0;
    let matched = 0;
    for (const cw of codeTokens) {
        if (inputTokens.some(iw => wordFuzzyMatch(iw, cw))) matched++;
    }
    return matched / codeTokens.length;
}

/**
 * Character-level similarity ratio: 1 − (editDistance / max(lenA, lenB)).
 * Returns a value in [0, 1]; 1 = identical, 0 = maximally different.
 */
export function computeCharSimilarity(a, b) {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    const dist = levenshtein(a, b);
    return 1 - dist / Math.max(a.length, b.length);
}

// ── Combined scoring ───────────────────────────────────────────────────────────

/**
 * Compute all three metrics for one (input, code) pair.
 *
 * `code` must have `_normalized` (string) and `_tokens` (string[]) pre-computed,
 * OR the function falls back to computing them on the fly from `code.lines`.
 *
 * @returns {{ coverage: number, charSim: number, combined: number }}
 */
export function matchScore(normInput, inputTokens, code) {
    const codeNorm   = code._normalized ?? normalize(code.lines.join(' '));
    const codeToks   = code._tokens     ?? tokenize(code.lines.join(' '));
    const coverage   = computeWordCoverage(inputTokens, codeToks);
    const charSim    = computeCharSimilarity(normInput, codeNorm);
    const combined   = WEIGHT_COVERAGE * coverage + WEIGHT_CHAR_SIM * charSim;
    return { coverage, charSim, combined };
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Detect whether `input` matches any cheat code.
 *
 * @param {string}   input - Raw user input (may contain punctuation, caps, etc.)
 * @param {object[]} codes - Array of cheat code objects. Each must have
 *                           `lines: string[]` and optionally pre-computed
 *                           `_normalized: string` and `_tokens: string[]`.
 * @returns {{ code: object, coverage: number, charSim: number, combined: number } | null}
 */
export function detectCheatCode(input, codes) {
    if (!input || typeof input !== 'string') return null;

    const normInput   = normalize(input);
    if (normInput.length < MIN_NORMALIZED_LENGTH) return null;

    const inputTokens = tokenize(input);

    let best        = null;
    let bestCombined = -Infinity;

    for (const code of codes) {
        const s = matchScore(normInput, inputTokens, code);
        if (
            s.coverage  >= COVERAGE_THRESHOLD &&
            s.charSim   >= CHAR_SIM_THRESHOLD &&
            s.combined  >  bestCombined
        ) {
            bestCombined = s.combined;
            best = { code, ...s };
        }
    }

    return best;
}

/**
 * Pre-compute `_normalized` and `_tokens` on each code object (mutates in place).
 * Call this once after defining the CHEAT_CODES array.
 */
export function prepareCode(code) {
    code._normalized = normalize(code.lines.join(' '));
    code._tokens     = tokenize(code.lines.join(' '));
    return code;
}
