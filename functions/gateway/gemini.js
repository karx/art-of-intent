/**
 * Gemini provider adapter
 *
 * Endpoint format: https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
 * Auth: x-goog-api-key header
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ endpoint: string, apiKey: string }} config
 * @param {typeof fetch} fetchFn - injectable for testing
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, finishReason: string }>}
 */
export async function callGemini(systemPrompt, userPrompt, config, fetchFn = fetch) {
    const { endpoint, apiKey } = config;

    const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }]
        })
    });

    if (!response.ok) {
        let errorBody = {};
        try { errorBody = await response.json(); } catch { errorBody.message = await response.text().catch(() => ''); }
        const err = new Error(`Gemini API error ${response.status}`);
        err.httpStatus = response.status;
        err.providerStatus = errorBody?.error?.status || 'UNKNOWN';
        err.providerMessage = errorBody?.error?.message || '';
        err.providerDetails = errorBody?.error?.details || [];
        throw err;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
    const finishReason = data.candidates?.[0]?.finishReason ?? 'UNKNOWN';

    return { text, inputTokens, outputTokens, finishReason };
}
