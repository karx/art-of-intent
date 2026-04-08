/**
 * AI Gateway unit tests
 * Run: node --test test/gateway.test.js
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { routeToProvider } from '../gateway/index.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeFetch(json) {
    return async () => ({ ok: true, json: async () => json });
}

function makeErrorFetch(status, json) {
    return async () => ({ ok: false, status, json: async () => json, text: async () => JSON.stringify(json) });
}

const SYS = 'You are a haiku bot.';
const USER = 'Write about the ocean.';
const CONFIG = { endpoint: 'https://example.com/api', apiKey: 'test-key' };

// ─── Gemini adapter ────────────────────────────────────────────────────────

describe('GeminiAdapter', () => {
    it('parses text and tokens from Gemini response', async () => {
        const fetch = makeFetch({
            candidates: [{ content: { parts: [{ text: 'Waves crash on shore,\nSalty mist fills the cool air,\nOcean breathes with life.' }] }, finishReason: 'STOP' }],
            usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 18, totalTokenCount: 138 }
        });

        const result = await routeToProvider('gemini', SYS, USER, CONFIG, fetch);

        assert.equal(result.text, 'Waves crash on shore,\nSalty mist fills the cool air,\nOcean breathes with life.');
        assert.equal(result.inputTokens, 120);
        assert.equal(result.outputTokens, 18);
    });

    it('sends api key in x-goog-api-key header', async () => {
        let capturedHeaders;
        const fetch = async (_url, opts) => {
            capturedHeaders = opts.headers;
            return { ok: true, json: async () => ({
                candidates: [{ content: { parts: [{ text: 'hi' }] } }],
                usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 }
            })};
        };

        await routeToProvider('gemini', SYS, USER, CONFIG, fetch);
        assert.equal(capturedHeaders['x-goog-api-key'], 'test-key');
        assert.equal(capturedHeaders['Content-Type'], 'application/json');
    });

    it('includes system_instruction in request body', async () => {
        let capturedBody;
        const fetch = async (_url, opts) => {
            capturedBody = JSON.parse(opts.body);
            return { ok: true, json: async () => ({
                candidates: [{ content: { parts: [{ text: 'hi' }] } }],
                usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 }
            })};
        };

        await routeToProvider('gemini', SYS, USER, CONFIG, fetch);
        assert.equal(capturedBody.system_instruction.parts[0].text, SYS);
        assert.equal(capturedBody.contents[0].parts[0].text, USER);
    });

    it('throws on non-ok response with status code', async () => {
        const fetch = makeErrorFetch(429, { error: { status: 'RESOURCE_EXHAUSTED', message: 'retry in 2s' } });
        await assert.rejects(
            () => routeToProvider('gemini', SYS, USER, CONFIG, fetch),
            (err) => {
                assert.equal(err.httpStatus, 429);
                assert.equal(err.providerStatus, 'RESOURCE_EXHAUSTED');
                return true;
            }
        );
    });
});

// ─── OpenAI adapter ────────────────────────────────────────────────────────

describe('OpenAIAdapter', () => {
    it('parses text and tokens from OpenAI response', async () => {
        const fetch = makeFetch({
            choices: [{ message: { content: 'Waves crash on shore' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 85, completion_tokens: 12, total_tokens: 97 }
        });

        const result = await routeToProvider('openai', SYS, USER, CONFIG, fetch);

        assert.equal(result.text, 'Waves crash on shore');
        assert.equal(result.inputTokens, 85);
        assert.equal(result.outputTokens, 12);
    });

    it('sends Authorization Bearer header', async () => {
        let capturedHeaders;
        const fetch = async (_url, opts) => {
            capturedHeaders = opts.headers;
            return { ok: true, json: async () => ({
                choices: [{ message: { content: 'hi' } }],
                usage: { prompt_tokens: 5, completion_tokens: 2 }
            })};
        };

        await routeToProvider('openai', SYS, USER, CONFIG, fetch);
        assert.equal(capturedHeaders['Authorization'], 'Bearer test-key');
    });

    it('sends system + user messages', async () => {
        let capturedBody;
        const fetch = async (_url, opts) => {
            capturedBody = JSON.parse(opts.body);
            return { ok: true, json: async () => ({
                choices: [{ message: { content: 'hi' } }],
                usage: { prompt_tokens: 5, completion_tokens: 2 }
            })};
        };

        await routeToProvider('openai', SYS, USER, CONFIG, fetch);
        assert.equal(capturedBody.messages[0].role, 'system');
        assert.equal(capturedBody.messages[0].content, SYS);
        assert.equal(capturedBody.messages[1].role, 'user');
        assert.equal(capturedBody.messages[1].content, USER);
    });

    it('appends /chat/completions to endpoint', async () => {
        let capturedUrl;
        const fetch = async (url, _opts) => {
            capturedUrl = url;
            return { ok: true, json: async () => ({
                choices: [{ message: { content: 'hi' } }],
                usage: { prompt_tokens: 5, completion_tokens: 2 }
            })};
        };

        await routeToProvider('openai', SYS, USER, { endpoint: 'https://api.openai.com/v1', apiKey: 'k' }, fetch);
        assert.equal(capturedUrl, 'https://api.openai.com/v1/chat/completions');
    });

    it('throws on non-ok response', async () => {
        const fetch = makeErrorFetch(401, { error: { message: 'Invalid API key' } });
        await assert.rejects(
            () => routeToProvider('openai', SYS, USER, CONFIG, fetch),
            (err) => {
                assert.equal(err.httpStatus, 401);
                return true;
            }
        );
    });
});

// ─── Anthropic adapter ─────────────────────────────────────────────────────

describe('AnthropicAdapter', () => {
    it('parses text and tokens from Anthropic response', async () => {
        const fetch = makeFetch({
            content: [{ type: 'text', text: 'Waves crash on shore' }],
            usage: { input_tokens: 90, output_tokens: 14 },
            stop_reason: 'end_turn'
        });

        const result = await routeToProvider('anthropic', SYS, USER, CONFIG, fetch);

        assert.equal(result.text, 'Waves crash on shore');
        assert.equal(result.inputTokens, 90);
        assert.equal(result.outputTokens, 14);
    });

    it('sends x-api-key header', async () => {
        let capturedHeaders;
        const fetch = async (_url, opts) => {
            capturedHeaders = opts.headers;
            return { ok: true, json: async () => ({
                content: [{ type: 'text', text: 'hi' }],
                usage: { input_tokens: 5, output_tokens: 2 }
            })};
        };

        await routeToProvider('anthropic', SYS, USER, CONFIG, fetch);
        assert.equal(capturedHeaders['x-api-key'], 'test-key');
        assert.ok(capturedHeaders['anthropic-version']);
    });

    it('sends system at top level and user message in messages', async () => {
        let capturedBody;
        const fetch = async (_url, opts) => {
            capturedBody = JSON.parse(opts.body);
            return { ok: true, json: async () => ({
                content: [{ type: 'text', text: 'hi' }],
                usage: { input_tokens: 5, output_tokens: 2 }
            })};
        };

        await routeToProvider('anthropic', SYS, USER, CONFIG, fetch);
        assert.equal(capturedBody.system, SYS);
        assert.equal(capturedBody.messages[0].role, 'user');
        assert.equal(capturedBody.messages[0].content, USER);
    });

    it('throws on non-ok response', async () => {
        const fetch = makeErrorFetch(400, { error: { type: 'invalid_request_error', message: 'bad request' } });
        await assert.rejects(
            () => routeToProvider('anthropic', SYS, USER, CONFIG, fetch),
            (err) => {
                assert.equal(err.httpStatus, 400);
                return true;
            }
        );
    });
});

// ─── Custom adapter ────────────────────────────────────────────────────────

describe('CustomAdapter (OpenAI-compatible)', () => {
    it('uses the exact endpoint URL provided', async () => {
        let capturedUrl;
        const fetch = async (url, _opts) => {
            capturedUrl = url;
            return { ok: true, json: async () => ({
                choices: [{ message: { content: 'hi' } }],
                usage: { prompt_tokens: 5, completion_tokens: 2 }
            })};
        };

        const config = { endpoint: 'https://my-proxy.example.com/v1/chat/completions', apiKey: 'k' };
        await routeToProvider('custom', SYS, USER, config, fetch);
        // Custom adapter uses the endpoint as-is (no path appended)
        assert.equal(capturedUrl, 'https://my-proxy.example.com/v1/chat/completions');
    });
});

// ─── Dispatcher ────────────────────────────────────────────────────────────

describe('routeToProvider dispatcher', () => {
    it('throws on unknown provider', async () => {
        const fetch = makeFetch({});
        await assert.rejects(
            () => routeToProvider('unknown_provider', SYS, USER, CONFIG, fetch),
            /Unknown provider/
        );
    });
});
