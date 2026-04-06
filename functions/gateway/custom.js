/**
 * Custom / OpenAI-compatible provider adapter
 *
 * For users running local models (Ollama, LM Studio, vLLM) or any proxy
 * that speaks the OpenAI Chat Completions API shape.
 * The endpoint is used as-is — no path is appended.
 *
 * Auth: Authorization: Bearer <key>  (some local servers ignore this)
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ endpoint: string, apiKey: string, model?: string }} config
 * @param {typeof fetch} fetchFn
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, finishReason: string }>}
 */
export async function callCustom(systemPrompt, userPrompt, config, fetchFn = fetch) {
    const { endpoint, apiKey, model = 'default' } = config;

    const response = await fetchFn(endpoint, {
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
        const err = new Error(`Custom provider API error ${response.status}`);
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
