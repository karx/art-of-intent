/**
 * Gateway call traceability — fire-and-forget logging to Firestore.
 *
 * Every gateway call (any product, any provider) gets one document in
 * `gateway_logs`. A logging failure must never surface to the caller —
 * callers should `void logGatewayCall(...)` and move on.
 */

import { FieldValue } from 'firebase-admin/firestore';
import logger from 'firebase-functions/logger';
import { estimateCost } from './cost.js';

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {{
 *   product: string,
 *   provider: string,
 *   model?: string,
 *   uid?: string|null,
 *   sessionId?: string|null,
 *   latencyMs: number,
 *   inputTokens?: number,
 *   outputTokens?: number,
 *   finishReason?: string|null,
 *   error?: string|null,
 *   retryCount?: number,
 *   cacheHit?: boolean,
 * }} payload
 * @returns {Promise<void>}
 */
export async function logGatewayCall(db, payload) {
    const {
        product, provider, model, uid, sessionId, latencyMs,
        inputTokens = 0, outputTokens = 0, finishReason = null,
        error = null, retryCount = 0, cacheHit = false,
    } = payload;

    const date = new Date().toISOString().split('T')[0];
    const cost = estimateCost(provider, model, inputTokens, outputTokens);

    const doc = {
        ts: FieldValue.serverTimestamp(),
        date,
        product,
        provider,
        model: model || null,
        inputTokens,
        outputTokens,
        latencyMs,
        finishReason,
        cacheHit,
        retryCount,
        error,
        userId: uid || null,
        sessionId: sessionId || null,
        ...cost,
    };

    try {
        await db.collection('gateway_logs').add(doc);
    } catch (e) {
        logger.warn('gateway_log_write_failed', { error: e.message });
    }
}
