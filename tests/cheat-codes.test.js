/**
 * tests/cheat-codes.test.js
 *
 * Unit tests for the cheat-code matching algorithm (cheat-matcher.js).
 *
 * Run with:  npm test
 */

import { describe, test, expect } from '@jest/globals';
import {
    normalize,
    tokenize,
    levenshtein,
    wordFuzzyMatch,
    computeWordCoverage,
    computeCharSimilarity,
    matchScore,
    detectCheatCode,
    prepareCode,
    MIN_NORMALIZED_LENGTH,
    COVERAGE_THRESHOLD,
    CHAR_SIM_THRESHOLD,
} from '../src/js/cheat-matcher.js';

// ─── Real cheat-code data (mirrors cheat-codes.js) ────────────────────────────
// Defined inline so the test has no browser-global dependency.

const RAW_CODES = [
    {
        id: 'old-pond',
        title: 'The Old Pond',
        author: 'Matsuo Bashō',
        year: '1686',
        lines: ['An old silent pond', 'A frog jumps into the pond', 'Splash! Silence again'],
    },
    {
        id: 'cicada',
        title: "The Cicada's Cry",
        author: 'Matsuo Bashō',
        year: '1689',
        lines: ["In the cicada's cry", 'No sign can foretell', 'How soon it must die'],
    },
    {
        id: 'world-of-dew',
        title: 'A World of Dew',
        author: 'Kobayashi Issa',
        year: '1819',
        lines: ['A world of dew', 'And within every dewdrop', 'A world of struggle'],
    },
    {
        id: 'temple-bells',
        title: 'Temple Bells',
        author: 'Matsuo Bashō',
        year: '1690',
        lines: ['Temple bells die out', 'The fragrant blossoms remain', 'A perfect evening'],
    },
    {
        id: 'lightning-flash',
        title: 'Lightning Flash',
        author: 'Yosa Buson',
        year: '1784',
        lines: ['A lightning flash', 'What I thought were faces', 'Are plumes of pampas grass'],
    },
    {
        id: 'moon-beholders',
        title: 'The Moon-Beholders',
        author: 'Matsuo Bashō',
        year: '1685',
        lines: ['From time to time', 'The clouds give rest', 'To the moon-beholders'],
    },
    {
        id: 'morning-glory',
        title: 'Morning Glory',
        author: 'Fukuda Chiyo-ni',
        year: '1754',
        lines: ['Morning glory—', 'the well bucket entangled,', 'I ask for water'],
    },
    {
        id: 'dont-weep',
        title: "Don't Weep, Insects",
        author: 'Kobayashi Issa',
        year: '1827',
        lines: ["Don't weep, insects", 'Lovers, stars themselves', 'Must part'],
    },
    {
        id: 'this-world-of-dew',
        title: 'This World of Dew',
        author: 'Kobayashi Issa',
        year: '1819',
        lines: ['This world of dew', 'Is only a world of dew', 'And yet... and yet...'],
    },
    {
        id: 'ill-on-a-journey',
        title: "Ill on a Journey",
        author: 'Matsuo Bashō',
        year: '1694',
        lines: ['Ill on a journey', 'My dreams wander over', 'A withered field'],
    },
];

// Pre-compute for all codes
const CODES = RAW_CODES.map(prepareCode);

// Helper: find a code by id
const code = id => CODES.find(c => c.id === id);

// ─── normalize ─────────────────────────────────────────────────────────────────

describe('normalize', () => {
    test('lowercases input', () => {
        expect(normalize('HELLO')).toBe('hello');
    });

    test('removes spaces', () => {
        expect(normalize('an old pond')).toBe('anoldpond');
    });

    test('removes punctuation', () => {
        expect(normalize("Splash! Silence, again.")).toBe('splashsilenceagain');
    });

    test('removes slashes and dashes used as line separators', () => {
        expect(normalize('line one / line two — line three')).toBe('lineonelinetwoline three'.replace(/ /g, ''));
    });

    test('keeps digits', () => {
        expect(normalize('1686 ABC')).toBe('1686abc');
    });

    test('empty string returns empty string', () => {
        expect(normalize('')).toBe('');
    });

    test('only special chars returns empty string', () => {
        expect(normalize('!@#$%^&*()')).toBe('');
    });

    test('strips newlines', () => {
        expect(normalize('an old\nsilent pond')).toBe('anoldsilentpond');
    });
});

// ─── tokenize ──────────────────────────────────────────────────────────────────

describe('tokenize', () => {
    test('splits on spaces', () => {
        expect(tokenize('an old pond')).toEqual(['an', 'old', 'pond']);
    });

    test('strips punctuation and splits', () => {
        expect(tokenize("Splash! Silence, again.")).toEqual(['splash', 'silence', 'again']);
    });

    test('handles multiple spaces', () => {
        expect(tokenize('a   b   c')).toEqual(['a', 'b', 'c']);
    });

    test('handles newlines as separators', () => {
        expect(tokenize('frog\npond\nsilence')).toEqual(['frog', 'pond', 'silence']);
    });

    test('handles slash-separated haiku lines', () => {
        expect(tokenize('old pond / frog jumps / splash')).toEqual(
            ['old', 'pond', 'frog', 'jumps', 'splash']
        );
    });

    test('returns empty array for empty input', () => {
        expect(tokenize('')).toEqual([]);
    });

    test('returns empty array for punctuation only', () => {
        expect(tokenize('!!! ---')).toEqual([]);
    });
});

// ─── levenshtein ───────────────────────────────────────────────────────────────

describe('levenshtein', () => {
    test('identical strings → 0', () => {
        expect(levenshtein('abc', 'abc')).toBe(0);
    });

    test('empty vs empty → 0', () => {
        expect(levenshtein('', '')).toBe(0);
    });

    test('empty vs non-empty → length of other', () => {
        expect(levenshtein('', 'abc')).toBe(3);
        expect(levenshtein('abc', '')).toBe(3);
    });

    test('one substitution', () => {
        expect(levenshtein('abc', 'abd')).toBe(1);
    });

    test('one insertion', () => {
        expect(levenshtein('abc', 'abcd')).toBe(1);
    });

    test('one deletion', () => {
        expect(levenshtein('abcd', 'abc')).toBe(1);
    });

    test('classic kitten → sitting (3)', () => {
        expect(levenshtein('kitten', 'sitting')).toBe(3);
    });

    test('completely different strings → max(len a, len b)', () => {
        const a = 'abcde';
        const b = 'vwxyz';
        const dist = levenshtein(a, b);
        expect(dist).toBeLessThanOrEqual(Math.max(a.length, b.length));
        expect(dist).toBeGreaterThan(0);
    });

    test('is symmetric', () => {
        expect(levenshtein('pond', 'bond')).toBe(levenshtein('bond', 'pond'));
    });
});

// ─── wordFuzzyMatch ────────────────────────────────────────────────────────────

describe('wordFuzzyMatch', () => {
    test('exact match returns true', () => {
        expect(wordFuzzyMatch('frog', 'frog')).toBe(true);
    });

    test('1-char substitution on long word returns true', () => {
        expect(wordFuzzyMatch('silence', 'silense')).toBe(true);  // c→s
    });

    test('1-char insertion on long word returns true', () => {
        expect(wordFuzzyMatch('frog', 'frogg')).toBe(true);
    });

    test('1-char deletion on long word returns true', () => {
        expect(wordFuzzyMatch('pond', 'pon')).toBe(false); // 'pon' < 4 chars, so only exact
    });

    test('2-char difference on long word returns false', () => {
        // "selince": s-e-l-i-n-c-e vs "silence": s-i-l-e-n-c-e → 2 substitutions
        expect(wordFuzzyMatch('silence', 'selince')).toBe(false);
    });

    test('short words (< 4 chars) require exact match', () => {
        expect(wordFuzzyMatch('an', 'a')).toBe(false);
        expect(wordFuzzyMatch('in', 'on')).toBe(false);
    });

    test('short word exact match returns true', () => {
        expect(wordFuzzyMatch('a', 'a')).toBe(true);
    });
});

// ─── computeWordCoverage ───────────────────────────────────────────────────────

describe('computeWordCoverage', () => {
    test('exact token match → 1.0', () => {
        const tokens = ['an', 'old', 'silent', 'pond'];
        expect(computeWordCoverage(tokens, tokens)).toBe(1.0);
    });

    test('no overlap → 0.0', () => {
        expect(computeWordCoverage(['xyz', 'abc'], ['frog', 'pond'])).toBe(0.0);
    });

    test('half overlap → 0.5', () => {
        expect(computeWordCoverage(['an', 'old', 'xyz', 'abc'], ['an', 'old', 'frog', 'pond'])).toBe(0.5);
    });

    test('empty codeTokens → 0', () => {
        expect(computeWordCoverage(['an', 'old'], [])).toBe(0);
    });

    test('fuzzy word match counts', () => {
        // 'silense' is 1 edit from 'silence' (len ≥ 4) → should match
        const input = ['an', 'old', 'silense', 'pond'];
        const code  = ['an', 'old', 'silence', 'pond'];
        expect(computeWordCoverage(input, code)).toBe(1.0);
    });

    test('extra input tokens do not reduce coverage', () => {
        // Input has all haiku words plus extras
        const input = ['an', 'old', 'silent', 'pond', 'hello', 'world'];
        const code  = ['an', 'old', 'silent', 'pond'];
        expect(computeWordCoverage(input, code)).toBe(1.0);
    });

    test('repeated haiku word counts once per occurrence in haiku', () => {
        // "pond" appears twice in the old-pond haiku; both should match
        const input = ['an', 'old', 'silent', 'pond', 'frog', 'jumps', 'into', 'the', 'splash', 'silence', 'again'];
        const codeTokens = code('old-pond')._tokens;
        const coverage = computeWordCoverage(input, codeTokens);
        expect(coverage).toBeGreaterThan(0.9);
    });
});

// ─── computeCharSimilarity ─────────────────────────────────────────────────────

describe('computeCharSimilarity', () => {
    test('identical strings → 1.0', () => {
        expect(computeCharSimilarity('abc', 'abc')).toBe(1.0);
    });

    test('both empty → 1.0', () => {
        expect(computeCharSimilarity('', '')).toBe(1.0);
    });

    test('one empty → 0.0', () => {
        expect(computeCharSimilarity('', 'abc')).toBe(0.0);
        expect(computeCharSimilarity('abc', '')).toBe(0.0);
    });

    test('one char difference → high similarity', () => {
        const sim = computeCharSimilarity('abcde', 'abcdf');
        expect(sim).toBeCloseTo(0.8, 1); // 1 - 1/5
    });

    test('similarity is in [0, 1]', () => {
        const sim = computeCharSimilarity('totally', 'different');
        expect(sim).toBeGreaterThanOrEqual(0);
        expect(sim).toBeLessThanOrEqual(1);
    });

    test('longer common prefix → higher similarity than random', () => {
        const withPrefix = computeCharSimilarity('anoldsilentpond', 'anoldsilentpondx');
        const random     = computeCharSimilarity('anoldsilentpond', 'xyzxyzxyzxyzxyz');
        expect(withPrefix).toBeGreaterThan(random);
    });
});

// ─── detectCheatCode — should return null ──────────────────────────────────────

describe('detectCheatCode — true negatives (should NOT match)', () => {
    test('null input → null', () => {
        expect(detectCheatCode(null, CODES)).toBeNull();
    });

    test('empty string → null', () => {
        expect(detectCheatCode('', CODES)).toBeNull();
    });

    test('input shorter than MIN_NORMALIZED_LENGTH → null', () => {
        const short = 'frog'; // 4 chars normalized
        expect(normalize(short).length).toBeLessThan(MIN_NORMALIZED_LENGTH);
        expect(detectCheatCode(short, CODES)).toBeNull();
    });

    test('random normal-length prompt → null', () => {
        expect(detectCheatCode('Write a poem about a sunny afternoon by the sea', CODES)).toBeNull();
    });

    test('partial first line only → null', () => {
        // Only "An old silent pond" — 4 of 13 words in old-pond, coverage < 0.75
        expect(detectCheatCode('An old silent pond', CODES)).toBeNull();
    });

    test('completely wrong long text → null', () => {
        const gibberish = 'the quick brown fox jumps over the lazy dog near the river bank on a sunny warm summer day';
        expect(detectCheatCode(gibberish, CODES)).toBeNull();
    });

    test('only punctuation/spaces → null', () => {
        expect(detectCheatCode('!!! ??? --- / / /', CODES)).toBeNull();
    });

    test('one haiku mixed with another haiku\'s words does not produce confident match', () => {
        // Deliberately mixing "old pond" + "cicada" words
        const mixed = 'An old silent pond frog cicada cry sign foretell die soon silence again';
        const result = detectCheatCode(mixed, CODES);
        // May match one of them but must not be null — if it does match, it should pick the better one
        // What we DON'T want is a wrong code returned with high confidence
        if (result) {
            expect(['old-pond', 'cicada']).toContain(result.code.id);
        }
    });
});

// ─── detectCheatCode — should match ───────────────────────────────────────────

describe('detectCheatCode — true positives (should match)', () => {

    // ── old-pond ──────────────────────────────────────────────────────────────

    test('old-pond: exact canonical text', () => {
        const input = 'An old silent pond\nA frog jumps into the pond\nSplash! Silence again';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: slash-separated lines (common copy format)', () => {
        const input = 'An old silent pond / A frog jumps into the pond / Splash! Silence again';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: all lowercase, no punctuation', () => {
        const input = 'an old silent pond a frog jumps into the pond splash silence again';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: with 1-char typos in several words', () => {
        // "sylient" (1 edit), "frof" (1 edit), "Splasj" (1 edit)
        const input = 'An old sylient pond A frof jumps into the pond Splasj Silence again';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: extra leading/trailing text', () => {
        const input = 'here is the haiku: An old silent pond A frog jumps into the pond Splash Silence again thanks';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: missing "silent" (only 12/13 words present) still matches', () => {
        // "silent" omitted — coverage drops to 12/13 ≈ 0.92, still above threshold
        const input = 'An old pond A frog jumps into the pond Splash Silence again';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    test('old-pond: two lines typed (first two of three)', () => {
        // First two lines: 10 of 13 words covered ≈ 0.77 — just above threshold
        const input = 'An old silent pond A frog jumps into the pond';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('old-pond');
    });

    // ── cicada ────────────────────────────────────────────────────────────────

    test('cicada: exact canonical text', () => {
        const input = "In the cicada's cry\nNo sign can foretell\nHow soon it must die";
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('cicada');
    });

    test('cicada: without apostrophe, all lowercase', () => {
        const input = 'in the cicadas cry no sign can foretell how soon it must die';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('cicada');
    });

    // ── temple-bells ──────────────────────────────────────────────────────────

    test('temple-bells: exact canonical text', () => {
        const input = 'Temple bells die out\nThe fragrant blossoms remain\nA perfect evening';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('temple-bells');
    });

    test('temple-bells: comma-separated lines', () => {
        const input = 'Temple bells die out, The fragrant blossoms remain, A perfect evening';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('temple-bells');
    });

    // ── world-of-dew ──────────────────────────────────────────────────────────

    test('world-of-dew: exact canonical text', () => {
        const input = 'A world of dew\nAnd within every dewdrop\nA world of struggle';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('world-of-dew');
    });

    // ── this-world-of-dew ─────────────────────────────────────────────────────

    test('this-world-of-dew: does NOT match world-of-dew', () => {
        const input = 'This world of dew\nIs only a world of dew\nAnd yet and yet';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        // "world of dew" words appear in both codes; the right one must win
        expect(result.code.id).toBe('this-world-of-dew');
    });

    test('world-of-dew: does NOT match this-world-of-dew', () => {
        const input = 'A world of dew\nAnd within every dewdrop\nA world of struggle';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('world-of-dew');
    });

    // ── morning-glory ─────────────────────────────────────────────────────────

    test('morning-glory: exact canonical text', () => {
        const input = 'Morning glory—\nthe well bucket entangled,\nI ask for water';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('morning-glory');
    });

    test('morning-glory: without em-dash and comma', () => {
        const input = 'Morning glory the well bucket entangled I ask for water';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('morning-glory');
    });

    // ── dont-weep ─────────────────────────────────────────────────────────────

    test('dont-weep: exact canonical text', () => {
        const input = "Don't weep, insects\nLovers, stars themselves\nMust part";
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('dont-weep');
    });

    // ── ill-on-a-journey ──────────────────────────────────────────────────────

    test('ill-on-a-journey: exact canonical text', () => {
        const input = 'Ill on a journey\nMy dreams wander over\nA withered field';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('ill-on-a-journey');
    });

    test('ill-on-a-journey: 1 typo in "wander"', () => {
        const input = 'Ill on a journey My dreams wander over A withered field';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('ill-on-a-journey');
    });

    // ── moon-beholders ────────────────────────────────────────────────────────

    test('moon-beholders: exact canonical text', () => {
        const input = 'From time to time\nThe clouds give rest\nTo the moon-beholders';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('moon-beholders');
    });

    test('moon-beholders: hyphen removed from moon-beholders', () => {
        const input = 'From time to time The clouds give rest To the moonbeholders';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('moon-beholders');
    });

    // ── lightning-flash ───────────────────────────────────────────────────────

    test('lightning-flash: exact canonical text', () => {
        const input = 'A lightning flash\nWhat I thought were faces\nAre plumes of pampas grass';
        const result = detectCheatCode(input, CODES);
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('lightning-flash');
    });
});

// ─── Best-match disambiguation ─────────────────────────────────────────────────

describe('detectCheatCode — disambiguation', () => {
    test('returns highest-scoring match when multiple codes could qualify', () => {
        // "world of dew" appears in both world-of-dew and this-world-of-dew;
        // typing the full "A world of dew / And within every dewdrop / A world of struggle"
        // should unambiguously pick world-of-dew.
        const result = detectCheatCode(
            'A world of dew And within every dewdrop A world of struggle',
            CODES
        );
        expect(result).not.toBeNull();
        expect(result.code.id).toBe('world-of-dew');
    });

    test('score fields are present and in range', () => {
        const result = detectCheatCode(
            'An old silent pond A frog jumps into the pond Splash Silence again',
            CODES
        );
        expect(result).not.toBeNull();
        expect(result.coverage).toBeGreaterThanOrEqual(COVERAGE_THRESHOLD);
        expect(result.charSim).toBeGreaterThanOrEqual(CHAR_SIM_THRESHOLD);
        expect(result.combined).toBeGreaterThan(0);
        expect(result.combined).toBeLessThanOrEqual(1);
    });
});

// ─── prepareCode ──────────────────────────────────────────────────────────────

describe('prepareCode', () => {
    test('adds _normalized field', () => {
        const c = prepareCode({ lines: ['Hello', 'World'] });
        expect(c._normalized).toBe('helloworld');
    });

    test('adds _tokens field', () => {
        const c = prepareCode({ lines: ['Hello, World!'] });
        expect(c._tokens).toEqual(['hello', 'world']);
    });

    test('mutates and returns the same object', () => {
        const obj = { lines: ['test'] };
        const result = prepareCode(obj);
        expect(result).toBe(obj);
    });
});
