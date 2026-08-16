/**
 * game-logic.js — Pure game-rule functions extracted from index.js.
 * No Firebase Admin SDK dependencies — each function is independently testable.
 */

/**
 * Build the system instruction for the haiku bot from today's word lists.
 * Pure — result depends only on the two arrays passed in.
 */
export function buildSystemInstruction(targetWords, blacklistWords) {
    const forbiddenWords = blacklistWords.join(', ');

    let instruction = `<prompt>
    <role_and_goal>
        You are "Haiku Bot," a serene and wise AI poet. Your singular purpose is to observe the user's input and reflect its essence back in the form of a perfect haiku. You communicate ONLY through haikus.
    </role_and_goal>

    <instructions>
        1.  **Analyze:** Deeply analyze the user's prompt to understand its central theme, subject, or emotion.
        2.  **Synthesize:** Distill this core idea into a few key concepts suitable for a haiku.
        3.  **Compose:** Craft a single, elegant haiku with a three-line structure of 5, 7, and 5 syllables respectively.
        4.  **Respond:** Output ONLY the haiku. Do not include any other text, greetings, or explanations.
    </instructions>

    <constraints>
        <output_format>
            - Your response MUST be a single haiku.
            - Strictly adhere to the 5-7-5 syllable structure.
            - Do not add any introductory or concluding text (e.g., "Here is a haiku:").
        </output_format>
        <user_input_rules>
            - The user is forbidden from using the following words in their prompt: ${forbiddenWords}.
            - **Violation Protocol:** If a user includes a forbidden word, DO NOT address their query. Instead, you must respond with this specific haiku:

                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
        </user_input_rules>
    </constraints>

    <examples>
        <example>
            <user_input>Tell me about the vastness of space.</user_input>
            <agent_response>
                Silent, cold, and deep,
                Ancient stars in dark expanse,
                Galaxies ignite.
            </agent_response>
        </example>`;

    blacklistWords.forEach((word) => {
        instruction += `
        <example>
            <user_input>What is the point of ${word}?</user_input>
            <agent_response>
                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
            </agent_response>
        </example>`;
    });

    instruction += `
    </examples>
</prompt>`;

    return instruction;
}

/**
 * Return the default API endpoint URL for a given provider.
 * For gemini, reads GEMINI_API_URL from env with a hardcoded fallback.
 */
export function defaultEndpointFor(provider) {
    switch (provider) {
        case 'gemini':
            return process.env.GEMINI_API_URL ||
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';
        case 'openai':
            return 'https://api.openai.com/v1';
        case 'anthropic':
            return 'https://api.anthropic.com/v1/messages';
        case 'custom':
            return '';
        default:
            return '';
    }
}

/**
 * Build the system instruction used by the AI evaluation probe strategy calls.
 * Pure — depends only on the two word arrays.
 */
export function buildProbeStrategyInstruction(targetWords, blacklistWords) {
    return `You are playing a word puzzle game. A haiku bot will respond to your prompt, but it speaks ONLY in haikus (strict 5-7-5 syllable structure).

Your goal: craft a single prompt (2-5 sentences) using imagery, themes, or scenarios that will cause the haiku bot to naturally include ALL of these target words in its response: ${targetWords.join(', ')}.

Rules:
- Do NOT name the target words directly in your prompt
- Do NOT use any of these forbidden words: ${blacklistWords.join(', ')}
- Be indirect — evoke concepts through related imagery rather than naming them
- Output ONLY the prompt text, no explanation or commentary`;
}

/**
 * Returns true if the prompt contains any blacklist word (case-insensitive substring match).
 */
export function promptHitsBlacklist(prompt, blacklistWords) {
    const lower = prompt.toLowerCase();
    const lowerBlacklist = blacklistWords.map(w => w.toLowerCase());
    return lowerBlacklist.some(w => lower.includes(w));
}

/**
 * Derive per-word difficulty from probe results and dictionary haiku embeddability.
 * - low:    matched in zero-shot probe
 * - medium: missed zero-shot, matched after one-shot feedback
 * - high:   not matched in either probe
 *
 * @param {string[]} targetWords
 * @param {{ wordsMatched: string[] }} zeroShot
 * @param {{ allMatched: string[] }} oneShot - cumulative across both probes
 * @param {Record<string, { embeddabilityCount?: number }> | null} dictionaryHaikus
 * @param {Record<string, { evocabilityCount?: number }> | null} [evocability]
 */
export function deriveWordDifficulty(targetWords, zeroShot, oneShot, dictionaryHaikus, evocability = null) {
    return Object.fromEntries(targetWords.map(word => {
        const matchedZeroShot = zeroShot.wordsMatched.includes(word);
        const matchedOneShot  = oneShot.allMatched.includes(word);
        const difficulty = matchedZeroShot ? 'low' : matchedOneShot ? 'medium' : 'high';

        const dictEntry = dictionaryHaikus?.[word];
        const embeddabilityScore = dictEntry?.embeddabilityCount != null
            ? dictEntry.embeddabilityCount / 10
            : null;

        const evoEntry = evocability?.[word];
        const evocabilityScore = evoEntry?.evocabilityCount != null
            ? evoEntry.evocabilityCount / 10
            : null;

        return [word, { difficulty, matchedZeroShot, matchedOneShot, embeddabilityScore, evocabilityScore }];
    }));
}

/**
 * System instruction for the evocability probe: haikus about a category
 * without naming the target word. Accidental inclusions measure how tightly
 * the word is bound to its category (true difficulty signal for players).
 *
 * @param {string} word
 * @param {string} category
 */
export function buildEvocabilityInstruction(word, category) {
    return `You are a haiku poet. Write exactly 10 different haikus about the theme of "${category}".
Do NOT use the word "${word}" in any haiku.
Each haiku must follow the strict 5-7-5 syllable pattern.
Each haiku should explore a different scene within that theme.
Output ONLY the haikus, separated by the delimiter "---" on its own line.
No numbering, no titles, no commentary.`;
}

/**
 * Count how many haikus accidentally include the target word despite the ban.
 * Higher count → higher evocability (word leaks into category-themed writing).
 *
 * @param {string[]} haikus
 * @param {string} word
 * @returns {number}
 */
export function countEvocabilityHits(haikus, word) {
    if (!Array.isArray(haikus) || !word) return 0;
    const lower = word.toLowerCase();
    return haikus.filter((h) => String(h).toLowerCase().includes(lower)).length;
}

/**
 * Map an AI provider HTTP error to a Firebase HttpsError-compatible { code, message } pair.
 * Pure — no Firebase SDK dependency. The caller constructs details and throws HttpsError.
 *
 * @param {number} httpStatus
 * @param {{ providerMessage?: string, provider?: string, retryAfterSeconds?: number|null }} [opts]
 * @returns {{ code: string, message: string }}
 */
export function mapProviderError(httpStatus, { providerMessage = '', provider = 'gemini', retryAfterSeconds = null } = {}) {
    const isBillingError = /credit|billing|quota|payment|balance/i.test(providerMessage);
    switch (httpStatus) {
        case 429:
            return {
                code: 'resource-exhausted',
                message: retryAfterSeconds
                    ? `Arty needs a moment. Try again in ${retryAfterSeconds}s.`
                    : 'Too many requests. Please wait a moment and try again.'
            };
        case 400:
            return {
                code: 'invalid-argument',
                message: isBillingError
                    ? 'Your API account has insufficient credits. Please top up your balance.'
                    : 'The request was rejected by the AI. Please try a different prompt.'
            };
        case 401:
        case 403:
            return {
                code: 'permission-denied',
                message: provider === 'gemini'
                    ? 'API authentication error. Please contact support.'
                    : 'Your API key was rejected. Check your model settings.'
            };
        case 500:
        case 502:
        case 503:
        case 504:
            return {
                code: 'unavailable',
                message: 'Arty is temporarily unavailable. Please try again shortly.'
            };
        default:
            return {
                code: 'internal',
                message: `Unexpected error from AI service (${httpStatus || 'network'}). Please try again.`
            };
    }
}

/**
 * Practice mode — validate a client-requested archive date.
 * Must be a real YYYY-MM-DD calendar date strictly before todayKey (UTC).
 * The client only ever picks *which* past day to replay; the words and
 * system prompt still come from Firestore server-side.
 */
export function isValidArchiveDate(dateKey, todayKey) {
    if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
    const [y, m, d] = dateKey.split('-').map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    const roundTrips = parsed.getUTCFullYear() === y
        && parsed.getUTCMonth() === m - 1
        && parsed.getUTCDate() === d;
    return roundTrips && dateKey < todayKey;
}

/**
 * Leaderboard efficiency score. Lower is better.
 * Only victories score; losses and cheat runs are null.
 * Server-side copy of frontend/src/lib/scoring.ts — authoritative for audit.
 *
 * @param {{ won: boolean, cheated: boolean, attempts: number, totalTokens: number }} input
 * @returns {number | null}
 */
export function computeEfficiencyScore({ won, cheated, attempts, totalTokens }) {
    if (!won || cheated) return null;
    return attempts * 10 + Math.floor(totalTokens / 10);
}

/**
 * Recompute authoritative session fields from attemptsData + match state.
 * Returns { corrections, reasons }. corrections is null when nothing to fix
 * (caller should skip the write). When present, corrections always includes
 * scoreAudited: true so the UI/leaderboard can tell an audited doc from a
 * client-written one.
 *
 * @param {object | null} sessionDoc - raw Firestore session document data
 * @returns {{ corrections: object | null, reasons: string[] }}
 */
export function auditSession(sessionDoc) {
    if (!sessionDoc || sessionDoc.status === 'in_progress' || !Array.isArray(sessionDoc.attemptsData)) {
        return { corrections: null, reasons: [] };
    }

    const attemptsData = sessionDoc.attemptsData;
    const expectedAttempts = attemptsData.length;
    const expectedTotalTokens = attemptsData.reduce(
        (sum, a) => sum + (Number(a?.totalTokens) || 0),
        0
    );

    const targetWords = Array.isArray(sessionDoc.targetWords) ? sessionDoc.targetWords : [];
    const matchedWords = Array.isArray(sessionDoc.matchedWords) ? sessionDoc.matchedWords : [];
    const expectedIsWin = targetWords.length > 0
        && targetWords.every((w) => matchedWords.includes(w));
    const expectedResult = expectedIsWin ? 'victory' : 'defeat';
    const cheated = !!sessionDoc.cheated;

    const expectedScore = computeEfficiencyScore({
        won: expectedIsWin,
        cheated,
        attempts: expectedAttempts,
        totalTokens: expectedTotalTokens,
    });

    const corrections = {};
    const reasons = [];

    if (sessionDoc.attempts !== expectedAttempts) {
        corrections.attempts = expectedAttempts;
        reasons.push('attempts');
    }
    if (sessionDoc.totalTokens !== expectedTotalTokens) {
        corrections.totalTokens = expectedTotalTokens;
        reasons.push('totalTokens');
    }
    if (sessionDoc.isWin !== expectedIsWin) {
        corrections.isWin = expectedIsWin;
        reasons.push('isWin');
    }
    if (sessionDoc.result !== expectedResult) {
        corrections.result = expectedResult;
        reasons.push('result');
    }
    if (sessionDoc.efficiencyScore !== expectedScore) {
        corrections.efficiencyScore = expectedScore;
        reasons.push('efficiencyScore');
    }

    if (reasons.length === 0) {
        return { corrections: null, reasons: [] };
    }

    corrections.scoreAudited = true;
    return { corrections, reasons };
}
