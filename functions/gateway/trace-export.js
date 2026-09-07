/**
 * Daily JSONL export of gateway_logs → Cloud Storage.
 *
 * Firestore `gateway_logs` is the live, queryable source of truth (per-call
 * doc, used by BYOM settings pages for "today's spend"). This export gives
 * the same data a file-based, grep/export-friendly form for archival and
 * cross-product cost audits — one line per call, matching the JSONL trace
 * style used elsewhere in the Kaaro ecosystem.
 */

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {import('@google-cloud/storage').Bucket} bucket
 * @param {string} dateKey - 'YYYY-MM-DD', the day to export
 * @returns {Promise<{ dateKey: string, count: number }>}
 */
export async function exportDayTraces(db, bucket, dateKey) {
    const snapshot = await db.collection('gateway_logs').where('date', '==', dateKey).get();

    const lines = snapshot.docs.map((doc) => {
        const data = doc.data();
        return JSON.stringify({
            id: doc.id,
            ...data,
            ts: data.ts?.toDate ? data.ts.toDate().toISOString() : data.ts,
        });
    });

    const jsonl = lines.length ? lines.join('\n') + '\n' : '';
    const file = bucket.file(`gateway-traces/${dateKey}.jsonl`);
    await file.save(jsonl, { contentType: 'application/x-ndjson' });

    return { dateKey, count: lines.length };
}
