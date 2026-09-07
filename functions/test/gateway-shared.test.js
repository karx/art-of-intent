/**
 * Shared cross-product gateway plumbing unit tests:
 * resolveProviderConfig, logGatewayCall, estimateCost, exportDayTraces.
 *
 * Run: node --test test/gateway-shared.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptApiKey } from '../crypto.js';
import { resolveProviderConfig } from '../gateway/resolve-config.js';
import { logGatewayCall } from '../gateway/logger.js';
import { estimateCost } from '../gateway/cost.js';
import { exportDayTraces } from '../gateway/trace-export.js';

const TEST_KEY_HEX = 'a'.repeat(64);
const defaultEndpointFor = (provider) => `https://example.com/${provider}`;

// ─── Minimal in-memory Firestore fake ──────────────────────────────────────
// Just enough of the SDK surface for collection().doc().collection().doc(),
// .get()/.set()/.delete()/.add(), and a flat where(field,'==',value).get().

function makeFakeDb(initialDocs = {}) {
    const store = { ...initialDocs };

    function docRef(path) {
        return {
            async get() {
                const data = store[path];
                return { exists: data !== undefined, data: () => data };
            },
            async set(data) { store[path] = { ...(store[path] || {}), ...data }; },
            async delete() { delete store[path]; },
            collection(sub) { return collRef(`${path}/${sub}`); },
        };
    }

    function collRef(path) {
        return {
            doc(id) { return docRef(`${path}/${id}`); },
            async add(data) {
                const id = `auto${Object.keys(store).length}`;
                store[`${path}/${id}`] = data;
                return { id };
            },
            where(field, _op, value) {
                return {
                    async get() {
                        const prefix = `${path}/`;
                        const docs = Object.entries(store)
                            .filter(([k, v]) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/') && v[field] === value)
                            .map(([k, v]) => ({ id: k.slice(prefix.length), data: () => v }));
                        return { docs };
                    },
                };
            },
        };
    }

    return { collection: (name) => collRef(name), _store: store };
}

// ─── resolveProviderConfig ─────────────────────────────────────────────────

describe('resolveProviderConfig', () => {
    it('returns null when GATEWAY_ENCRYPTION_KEY is missing', async () => {
        const db = makeFakeDb();
        const result = await resolveProviderConfig(db, 'uid1', 'art-of-intent', undefined, defaultEndpointFor);
        assert.equal(result, null);
    });

    it('returns null when no settings exist for the product', async () => {
        const db = makeFakeDb();
        const result = await resolveProviderConfig(db, 'uid1', 'kaaroViewer', TEST_KEY_HEX, defaultEndpointFor);
        assert.equal(result, null);
    });

    it('resolves and decrypts a product-specific config', async () => {
        const encryptedApiKey = await encryptApiKey('sk-viewer-key', TEST_KEY_HEX);
        const db = makeFakeDb({
            'userSettings/uid1/products/kaaroViewer': {
                aiProvider: 'openai', encryptedApiKey, aiModel: 'gpt-4o-mini',
            },
        });

        const result = await resolveProviderConfig(db, 'uid1', 'kaaroViewer', TEST_KEY_HEX, defaultEndpointFor);

        assert.equal(result.provider, 'openai');
        assert.equal(result.providerConfig.apiKey, 'sk-viewer-key');
        assert.equal(result.providerConfig.model, 'gpt-4o-mini');
        assert.equal(result.providerConfig.endpoint, 'https://example.com/openai');
    });

    it('falls back to the legacy flat doc for art-of-intent only', async () => {
        const encryptedApiKey = await encryptApiKey('sk-legacy-key', TEST_KEY_HEX);
        const db = makeFakeDb({
            'userSettings/uid1': { aiProvider: 'anthropic', encryptedApiKey },
        });

        const forProduct = await resolveProviderConfig(db, 'uid1', 'art-of-intent', TEST_KEY_HEX, defaultEndpointFor);
        assert.equal(forProduct.provider, 'anthropic');
        assert.equal(forProduct.providerConfig.apiKey, 'sk-legacy-key');

        const forOtherProduct = await resolveProviderConfig(db, 'uid1', 'kaaroViewer', TEST_KEY_HEX, defaultEndpointFor);
        assert.equal(forOtherProduct, null);
    });

    it('prefers the per-product doc over the legacy flat doc', async () => {
        const legacyKey = await encryptApiKey('sk-legacy', TEST_KEY_HEX);
        const productKey = await encryptApiKey('sk-product', TEST_KEY_HEX);
        const db = makeFakeDb({
            'userSettings/uid1': { aiProvider: 'anthropic', encryptedApiKey: legacyKey },
            'userSettings/uid1/products/art-of-intent': { aiProvider: 'gemini', encryptedApiKey: productKey },
        });

        const result = await resolveProviderConfig(db, 'uid1', 'art-of-intent', TEST_KEY_HEX, defaultEndpointFor);
        assert.equal(result.provider, 'gemini');
        assert.equal(result.providerConfig.apiKey, 'sk-product');
    });
});

// ─── logGatewayCall ────────────────────────────────────────────────────────

describe('logGatewayCall', () => {
    it('writes a gateway_logs doc with cost fields attached', async () => {
        const db = makeFakeDb();
        await logGatewayCall(db, {
            product: 'kaaroViewer', provider: 'gemini', model: 'gemini-3.1-flash-lite-preview',
            uid: 'uid1', sessionId: 'sess1', latencyMs: 120, inputTokens: 100, outputTokens: 20,
            finishReason: 'STOP',
        });

        const written = Object.values(db._store).find((d) => d.product === 'kaaroViewer');
        assert.ok(written, 'expected a gateway_logs doc to be written');
        assert.equal(written.provider, 'gemini');
        assert.equal(written.userId, 'uid1');
        assert.equal(written.inputTokens, 100);
        assert.ok(written.totalCostUSD > 0);
    });

    it('never throws when the write fails', async () => {
        const db = { collection: () => ({ add: async () => { throw new Error('firestore down'); } }) };
        await assert.doesNotReject(() => logGatewayCall(db, {
            product: 'kaaroViewer', provider: 'gemini', latencyMs: 10,
        }));
    });
});

// ─── estimateCost ──────────────────────────────────────────────────────────

describe('estimateCost', () => {
    it('computes cost for a known provider/model', () => {
        const cost = estimateCost('openai', 'gpt-4o-mini', 1_000_000, 1_000_000);
        assert.equal(cost.inputCostUSD, 0.15);
        assert.equal(cost.outputCostUSD, 0.60);
        assert.equal(cost.totalCostUSD, 0.75);
    });

    it('returns nulls for an unknown model', () => {
        const cost = estimateCost('openai', 'some-future-model', 100, 100);
        assert.equal(cost.inputCostUSD, null);
        assert.equal(cost.outputCostUSD, null);
        assert.equal(cost.totalCostUSD, null);
    });
});

// ─── exportDayTraces ───────────────────────────────────────────────────────

describe('exportDayTraces', () => {
    it('exports only the matching day as JSONL', async () => {
        const db = makeFakeDb({
            'gateway_logs/a': { date: '2026-05-01', product: 'kaaroViewer', provider: 'gemini' },
            'gateway_logs/b': { date: '2026-05-01', product: 'art-of-intent', provider: 'openai' },
            'gateway_logs/c': { date: '2026-05-02', product: 'kaaroViewer', provider: 'gemini' },
        });

        let saved;
        const bucket = { file: (name) => ({ save: async (content) => { saved = { name, content }; } }) };

        const result = await exportDayTraces(db, bucket, '2026-05-01');

        assert.equal(result.count, 2);
        assert.equal(saved.name, 'gateway-traces/2026-05-01.jsonl');
        const lines = saved.content.trim().split('\n').map((l) => JSON.parse(l));
        assert.equal(lines.length, 2);
        assert.ok(lines.every((l) => l.date === '2026-05-01'));
    });
});
