/**
 * Shared BYOM provider-config resolver.
 *
 * Reads userSettings/{uid}/products/{product}, decrypts the stored key.
 * Falls back to the legacy flat userSettings/{uid} doc for the
 * "art-of-intent" product only — that's where BYOM settings lived before
 * products got their own subcollection, and existing players shouldn't
 * need to re-enter their key.
 */

import { decryptApiKey } from '../crypto.js';

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} uid
 * @param {string} product
 * @param {string|undefined} encKey - GATEWAY_ENCRYPTION_KEY
 * @param {(provider: string) => string} defaultEndpointFor
 * @returns {Promise<{ provider: string, providerConfig: { endpoint: string, apiKey: string, model?: string } } | null>}
 */
export async function resolveProviderConfig(db, uid, product, encKey, defaultEndpointFor) {
    if (!encKey) return null;

    let settings;
    const productDoc = await db.collection('userSettings').doc(uid).collection('products').doc(product).get();
    if (productDoc.exists) {
        settings = productDoc.data();
    } else if (product === 'art-of-intent') {
        const legacyDoc = await db.collection('userSettings').doc(uid).get();
        if (legacyDoc.exists) settings = legacyDoc.data();
    }

    if (!settings?.aiProvider || !settings?.encryptedApiKey) return null;

    const apiKey = await decryptApiKey(settings.encryptedApiKey, encKey);

    return {
        provider: settings.aiProvider,
        providerConfig: {
            endpoint: settings.aiEndpoint || defaultEndpointFor(settings.aiProvider),
            apiKey,
            model: settings.aiModel,
        },
    };
}
