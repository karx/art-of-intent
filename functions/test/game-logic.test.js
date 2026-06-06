/**
 * game-logic.js unit tests
 * Run: node --test test/game-logic.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildSystemInstruction,
    buildProbeStrategyInstruction,
    defaultEndpointFor,
    deriveWordDifficulty,
    promptHitsBlacklist,
    mapProviderError,
} from '../game-logic.js';

// ─── buildSystemInstruction ───────────────────────────────────────────────────

describe('buildSystemInstruction', () => {
    it('includes blacklist words in the forbidden-words sentence', () => {
        const instruction = buildSystemInstruction(['ocean', 'dawn'], ['water', 'sun', 'light']);
        assert.ok(instruction.includes('water, sun, light'));
    });

    it('generates one <user_input> per blacklist word plus the static example', () => {
        const instruction = buildSystemInstruction(['ocean'], ['fire', 'rain']);
        const matches = instruction.match(/<user_input>/g) || [];
        // 1 static + 2 blacklist
        assert.equal(matches.length, 3);
    });

    it('handles an empty blacklist without throwing', () => {
        assert.doesNotThrow(() => buildSystemInstruction(['ocean'], []));
    });

    it('with empty blacklist only has the one static example', () => {
        const instruction = buildSystemInstruction(['ocean'], []);
        const matches = instruction.match(/<user_input>/g) || [];
        assert.equal(matches.length, 1);
    });

    it('wraps output in <prompt> … </prompt>', () => {
        const instruction = buildSystemInstruction([], []);
        assert.ok(instruction.includes('<prompt>'));
        assert.ok(instruction.includes('</prompt>'));
    });

    it('includes each blacklist word as its own example', () => {
        const instruction = buildSystemInstruction(['ocean'], ['ember', 'veil']);
        assert.ok(instruction.includes('What is the point of ember?'));
        assert.ok(instruction.includes('What is the point of veil?'));
    });
});

// ─── buildProbeStrategyInstruction ───────────────────────────────────────────

describe('buildProbeStrategyInstruction', () => {
    it('lists target words in the instruction', () => {
        const instruction = buildProbeStrategyInstruction(['ocean', 'dawn'], ['fire']);
        assert.ok(instruction.includes('ocean, dawn'));
    });

    it('lists forbidden words in the instruction', () => {
        const instruction = buildProbeStrategyInstruction(['ocean'], ['fire', 'rain']);
        assert.ok(instruction.includes('fire, rain'));
    });

    it('returns a non-empty string', () => {
        const instruction = buildProbeStrategyInstruction([], []);
        assert.ok(instruction.length > 0);
    });
});

// ─── defaultEndpointFor ───────────────────────────────────────────────────────

describe('defaultEndpointFor', () => {
    it('gemini → generativelanguage.googleapis.com (env fallback)', () => {
        const saved = process.env.GEMINI_API_URL;
        delete process.env.GEMINI_API_URL;
        try {
            const url = defaultEndpointFor('gemini');
            assert.ok(url.includes('generativelanguage.googleapis.com'));
        } finally {
            if (saved !== undefined) process.env.GEMINI_API_URL = saved;
        }
    });

    it('gemini → uses GEMINI_API_URL when set', () => {
        process.env.GEMINI_API_URL = 'https://custom.example.com/gemini';
        try {
            const url = defaultEndpointFor('gemini');
            assert.equal(url, 'https://custom.example.com/gemini');
        } finally {
            delete process.env.GEMINI_API_URL;
        }
    });

    it('openai → api.openai.com/v1', () => {
        assert.equal(defaultEndpointFor('openai'), 'https://api.openai.com/v1');
    });

    it('anthropic → api.anthropic.com/v1/messages', () => {
        assert.equal(defaultEndpointFor('anthropic'), 'https://api.anthropic.com/v1/messages');
    });

    it('custom → empty string (user always supplies endpoint)', () => {
        assert.equal(defaultEndpointFor('custom'), '');
    });

    it('unknown provider → empty string', () => {
        assert.equal(defaultEndpointFor('unknown_provider'), '');
    });
});

// ─── promptHitsBlacklist ─────────────────────────────────────────────────────

describe('promptHitsBlacklist', () => {
    it('returns true when the prompt contains a blacklist word', () => {
        assert.equal(promptHitsBlacklist('the water flows gently', ['water', 'fire']), true);
    });

    it('is case-insensitive', () => {
        assert.equal(promptHitsBlacklist('The Water flows', ['water']), true);
    });

    it('returns false when no blacklist words are present', () => {
        assert.equal(promptHitsBlacklist('the mountain stands tall', ['water', 'fire', 'ocean']), false);
    });

    it('returns false for an empty blacklist', () => {
        assert.equal(promptHitsBlacklist('anything goes here', []), false);
    });

    it('returns false for an empty prompt', () => {
        assert.equal(promptHitsBlacklist('', ['water']), false);
    });

    it('matches substrings (current behavior — "waterfall" contains "water")', () => {
        assert.equal(promptHitsBlacklist('the waterfall is beautiful', ['water']), true);
    });
});

// ─── deriveWordDifficulty ─────────────────────────────────────────────────────

describe('deriveWordDifficulty', () => {
    const TARGET = ['ocean', 'dawn', 'stone'];

    it('assigns low difficulty to words matched in zero-shot', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean', 'dawn'] };
        const result = deriveWordDifficulty(TARGET, zeroShot, oneShot, {});
        assert.equal(result.ocean.difficulty, 'low');
        assert.equal(result.ocean.matchedZeroShot, true);
        assert.equal(result.ocean.matchedOneShot, true);
    });

    it('assigns medium difficulty to words matched only after one-shot feedback', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean', 'dawn'] };
        const result = deriveWordDifficulty(TARGET, zeroShot, oneShot, {});
        assert.equal(result.dawn.difficulty, 'medium');
        assert.equal(result.dawn.matchedZeroShot, false);
        assert.equal(result.dawn.matchedOneShot, true);
    });

    it('assigns high difficulty to words matched in neither probe', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean', 'dawn'] };
        const result = deriveWordDifficulty(TARGET, zeroShot, oneShot, {});
        assert.equal(result.stone.difficulty, 'high');
        assert.equal(result.stone.matchedZeroShot, false);
        assert.equal(result.stone.matchedOneShot, false);
    });

    it('computes embeddabilityScore as embeddabilityCount / 10', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean'] };
        const dict = { ocean: { embeddabilityCount: 8 } };
        const result = deriveWordDifficulty(['ocean'], zeroShot, oneShot, dict);
        assert.equal(result.ocean.embeddabilityScore, 0.8);
    });

    it('sets embeddabilityScore to null when embeddabilityCount is absent from entry', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean'] };
        const dict = { ocean: {} };
        const result = deriveWordDifficulty(['ocean'], zeroShot, oneShot, dict);
        assert.equal(result.ocean.embeddabilityScore, null);
    });

    it('sets embeddabilityScore to null when no dictionary entry exists', () => {
        const zeroShot = { wordsMatched: ['ocean'] };
        const oneShot  = { allMatched: ['ocean'] };
        const result = deriveWordDifficulty(['ocean'], zeroShot, oneShot, {});
        assert.equal(result.ocean.embeddabilityScore, null);
    });

    it('returns an empty object for empty target words', () => {
        const result = deriveWordDifficulty([], { wordsMatched: [] }, { allMatched: [] }, {});
        assert.deepEqual(result, {});
    });
});

// ─── mapProviderError ─────────────────────────────────────────────────────────

describe('mapProviderError', () => {
    it('429 with retryAfterSeconds → resource-exhausted with seconds in message', () => {
        const r = mapProviderError(429, { retryAfterSeconds: 3 });
        assert.equal(r.code, 'resource-exhausted');
        assert.ok(r.message.includes('3s'));
    });

    it('429 without retryAfterSeconds → generic wait message', () => {
        const r = mapProviderError(429, {});
        assert.equal(r.code, 'resource-exhausted');
        assert.ok(r.message.includes('Too many requests'));
    });

    it('400 with billing keyword → billing message', () => {
        const r = mapProviderError(400, { providerMessage: 'insufficient credits in your account' });
        assert.equal(r.code, 'invalid-argument');
        assert.ok(/credit|balance|insufficient/i.test(r.message));
    });

    it('400 with "billing" keyword → billing message', () => {
        const r = mapProviderError(400, { providerMessage: 'billing account suspended' });
        assert.equal(r.code, 'invalid-argument');
        assert.ok(/credit|balance|insufficient/i.test(r.message));
    });

    it('400 without billing keyword → prompt-rejected message', () => {
        const r = mapProviderError(400, { providerMessage: 'bad request format' });
        assert.equal(r.code, 'invalid-argument');
        assert.ok(r.message.includes('rejected by the AI'));
    });

    it('401 → permission-denied', () => {
        const r = mapProviderError(401, {});
        assert.equal(r.code, 'permission-denied');
    });

    it('403 → permission-denied', () => {
        const r = mapProviderError(403, {});
        assert.equal(r.code, 'permission-denied');
    });

    it('401 with non-gemini provider → API key rejected message', () => {
        const r = mapProviderError(401, { provider: 'openai' });
        assert.ok(r.message.toLowerCase().includes('api key'));
    });

    it('401 with gemini provider → auth error / contact support', () => {
        const r = mapProviderError(401, { provider: 'gemini' });
        assert.ok(r.message.includes('authentication error'));
    });

    it('500 → unavailable', () => {
        assert.equal(mapProviderError(500, {}).code, 'unavailable');
    });

    it('502 → unavailable', () => {
        assert.equal(mapProviderError(502, {}).code, 'unavailable');
    });

    it('503 → unavailable', () => {
        assert.equal(mapProviderError(503, {}).code, 'unavailable');
    });

    it('0 (network error) → internal with "network" in message', () => {
        const r = mapProviderError(0, {});
        assert.equal(r.code, 'internal');
        assert.ok(r.message.includes('network'));
    });

    it('unknown status → internal with status code in message', () => {
        const r = mapProviderError(418, {});
        assert.equal(r.code, 'internal');
        assert.ok(r.message.includes('418'));
    });

    it('result always has code and message string fields', () => {
        const r = mapProviderError(429, {});
        assert.equal(typeof r.code, 'string');
        assert.equal(typeof r.message, 'string');
    });

    it('works with no options argument (default opts)', () => {
        assert.doesNotThrow(() => mapProviderError(429));
    });
});
