/**
 * Crypto module unit tests
 * Run: node --test test/crypto.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptApiKey, decryptApiKey } from '../crypto.js';

const TEST_KEY_HEX = 'a'.repeat(64); // 32 bytes as hex

describe('encryptApiKey / decryptApiKey', () => {
    it('round-trips a plaintext API key', async () => {
        const plaintext = 'sk-1234567890abcdef';
        const ciphertext = await encryptApiKey(plaintext, TEST_KEY_HEX);
        const decrypted = await decryptApiKey(ciphertext, TEST_KEY_HEX);
        assert.equal(decrypted, plaintext);
    });

    it('produces a different ciphertext each call (random IV)', async () => {
        const plaintext = 'sk-same-key';
        const ct1 = await encryptApiKey(plaintext, TEST_KEY_HEX);
        const ct2 = await encryptApiKey(plaintext, TEST_KEY_HEX);
        assert.notEqual(ct1, ct2);
    });

    it('throws when decrypting with the wrong key', async () => {
        const plaintext = 'sk-secret';
        const ciphertext = await encryptApiKey(plaintext, TEST_KEY_HEX);
        const wrongKey = 'b'.repeat(64);
        await assert.rejects(() => decryptApiKey(ciphertext, wrongKey));
    });

    it('throws when ciphertext is tampered', async () => {
        const plaintext = 'sk-secret';
        const ciphertext = await encryptApiKey(plaintext, TEST_KEY_HEX);
        // Flip a character in the data portion
        const tampered = ciphertext.slice(0, -2) + (ciphertext.endsWith('aa') ? 'bb' : 'aa');
        await assert.rejects(() => decryptApiKey(tampered, TEST_KEY_HEX));
    });

    it('handles empty string', async () => {
        const ciphertext = await encryptApiKey('', TEST_KEY_HEX);
        const decrypted = await decryptApiKey(ciphertext, TEST_KEY_HEX);
        assert.equal(decrypted, '');
    });

    it('handles long API keys (512 chars)', async () => {
        const longKey = 'x'.repeat(512);
        const ciphertext = await encryptApiKey(longKey, TEST_KEY_HEX);
        const decrypted = await decryptApiKey(ciphertext, TEST_KEY_HEX);
        assert.equal(decrypted, longKey);
    });
});
