/**
 * OpenAI provider adapter
 *
 * Endpoint format: https://api.openai.com/v1  (we append /chat/completions)
 * Also compatible with any OpenAI-style API (Azure OpenAI, Groq, Together, etc.)
 * Auth: Authorization: Bearer <key>
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ endpoint: string, apiKey: string, model?: string }} config
 * @param {typeof fetch} fetchFn
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, finishReason: string }>}
 */
export async function callOpenAI(systemPrompt, userPrompt, config, fetchFn = fetch) {
    const { endpoint, apiKey, model = 'gpt-4o-mini' } = config;
    const url = endpoint.replace(/\/+$/, '') + '/chat/completions';

    const response = await fetchFn(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        let errorBody = {};
        try { errorBody = await response.json(); } catch { errorBody.message = await response.text().catch(() => ''); }
        const err = new Error(`OpenAI API error ${response.status}`);
        err.httpStatus = response.status;
        err.providerStatus = String(response.status);
        err.providerMessage = errorBody?.error?.message || '';
        throw err;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const finishReason = data.choices?.[0]?.finish_reason ?? 'UNKNOWN';

    return { text, inputTokens, outputTokens, finishReason };
}
