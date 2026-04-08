/**
 * Anthropic provider adapter
 *
 * Endpoint: https://api.anthropic.com/v1/messages  (fixed — endpoint config is ignored)
 * Auth: x-api-key header
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ endpoint: string, apiKey: string, model?: string }} config
 * @param {typeof fetch} fetchFn
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, finishReason: string }>}
 */
export async function callAnthropic(systemPrompt, userPrompt, config, fetchFn = fetch) {
    const { endpoint, apiKey, model = 'claude-haiku-4-5-20251001' } = config;
    // Anthropic has a fixed messages endpoint; use provided endpoint if it looks like a full URL,
    // otherwise fall back to the standard one.
    const url = endpoint.includes('/messages')
        ? endpoint
        : (endpoint.replace(/\/+$/, '') + '/messages');

    const response = await fetchFn(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model,
            max_tokens: 256,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        let errorBody = {};
        try { errorBody = await response.json(); } catch { errorBody.message = await response.text().catch(() => ''); }
        const err = new Error(`Anthropic API error ${response.status}`);
        err.httpStatus = response.status;
        err.providerStatus = errorBody?.error?.type || String(response.status);
        err.providerMessage = errorBody?.error?.message || '';
        throw err;
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const finishReason = data.stop_reason ?? 'UNKNOWN';

    return { text, inputTokens, outputTokens, finishReason };
}
