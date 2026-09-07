/**
 * Cost estimation for gateway calls — pure function, no I/O.
 *
 * Pricing table (USD per 1M tokens, as of 2026-04). Unknown provider/model
 * combos fall back to nulls rather than guessing — an inaccurate cost is
 * worse than an absent one.
 */

const PRICING = {
    gemini: {
        'gemini-3.1-flash-lite-preview': { input: 0.075, output: 0.30 },
        'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    },
    openai: {
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4o': { input: 2.50, output: 10.00 },
    },
    anthropic: {
        'claude-haiku-4-5': { input: 0.80, output: 4.00 },
        'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    },
};

/**
 * @param {string} provider
 * @param {string|undefined} model
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {{ inputCostUSD: number|null, outputCostUSD: number|null, totalCostUSD: number|null }}
 */
export function estimateCost(provider, model, inputTokens, outputTokens) {
    const rates = PRICING[provider]?.[model];
    if (!rates) {
        return { inputCostUSD: null, outputCostUSD: null, totalCostUSD: null };
    }

    const inputCostUSD = (inputTokens / 1_000_000) * rates.input;
    const outputCostUSD = (outputTokens / 1_000_000) * rates.output;

    return {
        inputCostUSD,
        outputCostUSD,
        totalCostUSD: inputCostUSD + outputCostUSD,
    };
}
