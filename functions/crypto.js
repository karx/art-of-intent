/**
 * AES-256-GCM encryption for user API keys stored in Firestore.
 *
 * The 32-byte master key comes from the GATEWAY_ENCRYPTION_KEY env var
 * (hex-encoded, 64 hex chars). A random 12-byte IV is generated per
 * encryption and prepended to the ciphertext. The GCM auth tag (16 bytes)
 * is appended automatically by Node's crypto.
 *
 * Wire format (base64url):  IV (12 bytes) || ciphertext || tag (16 bytes)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES   = 12;
const TAG_BYTES  = 16;

/**
 * Encrypt a plaintext API key string.
 *
 * @param {string} plaintext
 * @param {string} keyHex - 64-char hex string (32 bytes)
 * @returns {Promise<string>} base64url-encoded ciphertext blob
 */
export async function encryptApiKey(plaintext, keyHex) {
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) throw new Error('GATEWAY_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, encrypted, tag]).toString('base64url');
}

/**
 * Decrypt a ciphertext blob produced by encryptApiKey.
 *
 * @param {string} ciphertextB64 - base64url-encoded blob
 * @param {string} keyHex - 64-char hex string (32 bytes)
 * @returns {Promise<string>} plaintext API key
 */
export async function decryptApiKey(ciphertextB64, keyHex) {
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) throw new Error('GATEWAY_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');

    const blob = Buffer.from(ciphertextB64, 'base64url');
    if (blob.length < IV_BYTES + TAG_BYTES) throw new Error('Ciphertext too short');

    const iv         = blob.subarray(0, IV_BYTES);
    const tag        = blob.subarray(blob.length - TAG_BYTES);
    const ciphertext = blob.subarray(IV_BYTES, blob.length - TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]).toString('utf8');
}
