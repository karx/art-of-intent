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
    return blacklistWords.some(w => lower.includes(w.toLowerCase()));
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
 * @param {Record<string, { embeddabilityCount?: number, wordCount?: number }> | null} dictionaryHaikus
 */
export function deriveWordDifficulty(targetWords, zeroShot, oneShot, dictionaryHaikus) {
    return Object.fromEntries(targetWords.map(word => {
        const matchedZeroShot = zeroShot.wordsMatched.includes(word);
        const matchedOneShot  = oneShot.allMatched.includes(word);
        const difficulty = matchedZeroShot ? 'low' : matchedOneShot ? 'medium' : 'high';

        const dictEntry = dictionaryHaikus?.[word];
        const embeddabilityScore = dictEntry
            ? (dictEntry.embeddabilityCount ?? dictEntry.wordCount ?? null) / 10
            : null;

        return [word, { difficulty, matchedZeroShot, matchedOneShot, embeddabilityScore }];
    }));
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
