/**
 * AI Gateway — provider dispatcher
 *
 * routeToProvider(provider, systemPrompt, userPrompt, config, fetchFn?)
 *   → Promise<{ text, inputTokens, outputTokens, finishReason }>
 *
 * Supported providers: 'gemini' | 'openai' | 'anthropic' | 'custom'
 */

import { callGemini } from './gemini.js';
import { callOpenAI } from './openai.js';
import { callAnthropic } from './anthropic.js';
import { callCustom } from './custom.js';

const ADAPTERS = {
    gemini:    callGemini,
    openai:    callOpenAI,
    anthropic: callAnthropic,
    custom:    callCustom,
};

/**
 * Route a request to the appropriate provider adapter.
 *
 * @param {'gemini'|'openai'|'anthropic'|'custom'} provider
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ endpoint: string, apiKey: string, model?: string }} config
 * @param {typeof fetch} [fetchFn] - injectable for unit tests
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, finishReason: string }>}
 */
export async function routeToProvider(provider, systemPrompt, userPrompt, config, fetchFn = fetch) {
    const adapter = ADAPTERS[provider];
    if (!adapter) {
        throw new Error(`Unknown provider: "${provider}". Supported: ${Object.keys(ADAPTERS).join(', ')}`);
    }
    return adapter(systemPrompt, userPrompt, config, fetchFn);
}
