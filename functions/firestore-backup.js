#!/usr/bin/env node
/**
 * Firestore JSON backup script.
 * Usage: node firestore-backup.js [output-file]
 * Defaults to ../firestore-backup-<date>.json
 *
 * Uses Firebase CLI's stored credentials automatically.
 * Alternatively, set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON.
 */

import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { homedir } from 'os';

const require = createRequire(import.meta.url);

const DATABASE_ID = 'alpha';
const PROJECT_ID = 'art-of-intent';

// ---- Credentials: prefer service account, fall back to Firebase CLI tokens ----
async function getAccessToken() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const sa = JSON.parse(require('fs').readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/datastore'] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  }

  // Firebase CLI stored access token (still valid)
  const cfgPath = homedir() + '/.config/configstore/firebase-tools.json';
  const cfg = JSON.parse(require('fs').readFileSync(cfgPath, 'utf8'));
  const { access_token, expires_at, refresh_token } = cfg.tokens;

  if (Date.now() < expires_at) {
    return access_token;
  }

  // Token expired — use firebase-tools' built-in refresh
  // The firebase-tools package knows its own client_id/secret
  try {
    const { default: firebaseCli } = await import('firebase-tools');
    const token = await firebaseCli.login.useToken(refresh_token);
    return token;
  } catch {
    throw new Error(
      'Firebase CLI access token is expired. Run `firebase login --reauth` and try again.'
    );
  }
}

// ---- Firestore REST API helpers ----
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

async function firestoreGet(path, token) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function firestoreList(collectionPath, token) {
  const url = `${BASE}/${collectionPath}?pageSize=300`;
  const docs = [];
  let pageToken = null;
  do {
    const reqUrl = pageToken ? `${url}&pageToken=${pageToken}` : url;
    const res = await fetch(reqUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`LIST ${collectionPath} failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (data.documents) docs.push(...data.documents);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return docs;
}

async function listSubcollections(docPath, token) {
  // docPath is like "users/uid"
  const url = `${BASE}/${docPath}:listCollectionIds`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.collectionIds || [];
}

async function listTopCollections(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:listCollectionIds`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`listCollectionIds failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.collectionIds || [];
}

// ---- Value deserializer ----
function deserializeValue(v) {
  if (v.nullValue !== undefined) return null;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.timestampValue !== undefined) return v.timestampValue; // ISO string
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.bytesValue !== undefined) return { _bytes: v.bytesValue };
  if (v.referenceValue !== undefined) return { _ref: v.referenceValue };
  if (v.geoPointValue !== undefined) return { _geo: v.geoPointValue };
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(deserializeValue);
  if (v.mapValue !== undefined) return deserializeFields(v.mapValue.fields || {});
  return null;
}

function deserializeFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = deserializeValue(v);
  }
  return obj;
}

// ---- Recursive dump ----
async function dumpCollection(colPath, token) {
  const docs = await firestoreList(colPath, token);
  const result = {};
  for (const doc of docs) {
    // doc.name is full path like projects/.../documents/users/uid
    const docId = doc.name.split('/').pop();
    const data = doc.fields ? deserializeFields(doc.fields) : {};
    // Relative path within the database, e.g. "users/uid"
    const relPath = doc.name.split('/documents/')[1];
    const subcols = await listSubcollections(relPath, token);
    if (subcols.length > 0) {
      data._subcollections = {};
      for (const sub of subcols) {
        console.log(`    Dumping subcollection: ${relPath}/${sub}`);
        data._subcollections[sub] = await dumpCollection(`${relPath}/${sub}`, token);
      }
    }
    result[docId] = data;
  }
  return result;
}

// ---- Main ----
console.log('Fetching access token...');
const token = await getAccessToken();
console.log('Token acquired.');

const dateStr = new Date().toISOString().slice(0, 10);
const outputFile = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(`../firestore-backup-${dateStr}.json`);

console.log(`\nConnecting to Firestore database "${DATABASE_ID}" (project: ${PROJECT_ID})...`);

const collections = await listTopCollections(token);
console.log(`Found ${collections.length} top-level collections: ${collections.join(', ')}`);

const dump = {
  _meta: {
    project: PROJECT_ID,
    database: DATABASE_ID,
    exportedAt: new Date().toISOString(),
  },
};

for (const col of collections) {
  console.log(`\n  Dumping collection: ${col}`);
  dump[col] = await dumpCollection(col, token);
  console.log(`  → ${Object.keys(dump[col]).length} documents`);
}

await writeFile(outputFile, JSON.stringify(dump, null, 2));
console.log(`\nBackup written to: ${outputFile}`);
