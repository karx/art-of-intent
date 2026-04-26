# kaaroViewer Integration

**Status:** Implemented — branch `kaaro/feat/kaaroViewer`
**kaaroViewer repo:** `D:/src/kaaroViewer`, branch `kaaro/agent/garden`

---

## What this is

After a player wins the daily puzzle, art-of-intent embeds kaaroViewer — a Three.js spatial knowledge-graph explorer — directly in the victory panel. The player types any topic; kaaroViewer generates a living brief (nodes, edges, narrative beats, insights) and visualises it as an interactive 3D canvas.

API keys never touch the browser. All LLM calls go through art-of-intent's existing Cloud Function gateway using the player's BYOM settings (or the fallback Gemini key), the same path as `artyGenerateHaiku`.

---

## Architecture: iframe + postMessage

kaaroViewer is a vanilla ES module app that resolves bare specifiers (`import * as THREE from 'three'`) via an importmap in its own `index.html`. This cannot be bundled through Vite without a build-step change to kaaroViewer, so the integration uses an **iframe** with a typed **postMessage protocol**.

```
art-of-intent (SvelteKit)         kaaroViewer (iframe, ?embed=1)
─────────────────────────         ──────────────────────────────
KaaroViewer.svelte
  │
  │  iframe src="{KAARO_ORIGIN}?embed=1"
  │──────────────────────────────────────►  embed.mjs boots
  │                                         sets window.kaaro_llm = postMessage proxy
  │◄─────────────────────────────────────── { type: 'kaaro:ready' }
  │
  │  user types seed in kaaroViewer zero-state input
  │
  │◄─────────────────────────────────────── { type: 'kaaro:llm-request', requestId, prompt }
  │
  │  httpsCallable('generateKaaroEntry', { prompt })
  │  ──► Firebase CF ──► BYOM / Gemini fallback ──► LLM
  │
  │──────────────────────────────────────► { type: 'kaaro:llm-response', requestId, text }
  │
  │  pipeline stages 2–4 run inside iframe (entity resolution, enrichment, completion)
  │
  │◄─────────────────────────────────────── { type: 'kaaro:brief-ready', brief }
  │
  │  setDoc('libraryEntries/{brief.meta.id}', { uid, brief, seed, createdAt })
```

---

## postMessage protocol

All messages are validated against `KAARO_ORIGIN` on both sides.

| Direction | Type | Payload | Purpose |
|---|---|---|---|
| iframe → parent | `kaaro:ready` | — | Canvas initialised, iframe visible |
| parent → iframe | `kaaro:explore` | `{ seed: string }` | Programmatically push a seed into the pipeline |
| iframe → parent | `kaaro:llm-request` | `{ requestId, prompt }` | kaaroViewer's pipeline needs an LLM call |
| parent → iframe | `kaaro:llm-response` | `{ requestId, text? \| error? }` | LLM result or error back to pipeline |
| iframe → parent | `kaaro:brief-ready` | `{ brief: LibraryJSON }` | Full pipeline complete — persist to Firestore |

`requestId` is a `crypto.randomUUID()` string used to match async request/response pairs.

---

## Files changed

### kaaroViewer

| File | Change |
|---|---|
| `embed.mjs` | **New.** Detects `?embed=1`, installs postMessage `window.kaaro_llm`, exports `notifyBriefReady()` and `signalReady()` |
| `main.mjs` | Imports `embed.mjs`; skips BYOM settings panel in embed mode; skips `_tryRegisterGemini()` in embed mode; calls `signalReady()` + drains `window.__kaaro_embed_seed` after init; calls `notifyBriefReady(brief)` after pipeline completes |

`embed.mjs` has zero effect when `?embed=1` is absent — standalone kaaroViewer behaviour is unchanged.

### art-of-intent

| File | Change |
|---|---|
| `functions/index.js` | `generateKaaroEntry` callable CF — BYOM resolution identical to `artyGenerateHaiku`, returns `{ text: string }` |
| `frontend/src/lib/KaaroViewer.svelte` | **New.** iframe component with full postMessage handler; proxies LLM calls to CF; saves `kaaro:brief-ready` payloads to `libraryEntries` |
| `frontend/src/routes/+page.svelte` | Imports `KaaroViewer`; renders `<KaaroViewer />` inside victory panel when `gameState.wonGame && authState.user` |
| `firestore.rules` | `libraryEntries/{entryId}` collection — owner read/write, `public == true` entries world-readable |
| `frontend/.env.local` | `VITE_KAARO_ORIGIN=http://localhost:8080` for local dev |

---

## Cloud Function: `generateKaaroEntry`

```
Callable: generateKaaroEntry
Input:    { prompt: string }   max 32 000 chars
Output:   { text: string }     raw LLM response (brief JSON string)
Auth:     required (unauthenticated → HttpsError)
```

The `prompt` is the full multi-paragraph exploration prompt built by kaaroViewer's `pipeline/explore.mjs` client-side. The CF treats it as the user turn with a fixed minimal system instruction:

> *"You are a knowledge cartographer. Follow the instructions in the user message exactly and respond only with valid JSON."*

Provider resolution order (same as `artyGenerateHaiku`):
1. `userSettings/{uid}.encryptedApiKey` → decrypt → BYOM provider
2. `process.env.GEMINI_API_KEY` → built-in Gemini fallback

---

## Firestore schema: `libraryEntries`

Collection path: `libraryEntries/{entryId}`

```
{
  uid:       string,           // Firebase Auth UID of the creator
  brief:     LibraryJSON,      // full kaaroViewer graph document
  seed:      string,           // original user seed (brief.meta.source or .title)
  createdAt: Timestamp,
  public:    boolean           // default false; opt-in sharing deferred
}
```

`entryId` is `brief.meta.id` — a slug generated by kaaroViewer's `explore.mjs` from the seed.

Security rules summary:
- Read: `uid == request.auth.uid` OR `public == true`
- Create: authenticated, `uid` must match `request.auth.uid`, required fields must be present
- Update: owner only, `uid` field immutable
- Delete: disabled

---

## Configuration

### kaaroViewer — `embed.mjs`

The `ALLOWED_ORIGINS` set must include every origin that will host the art-of-intent frontend:

```js
const ALLOWED_ORIGINS = new Set([
  'https://art-of-intent.netlify.app',
  'https://art-of-intent.web.app',
  'http://localhost:5173',   // SvelteKit dev
  'http://localhost:4173',   // SvelteKit preview
  'http://localhost:3000',
]);
```

Add production custom domains here when they are configured.

### art-of-intent — environment variables

| Variable | Dev value | Production value |
|---|---|---|
| `VITE_KAARO_ORIGIN` | `http://localhost:8080` | kaaroViewer's deployed URL |

Set `VITE_KAARO_ORIGIN` in Netlify's environment settings for the production build. The variable must not have a trailing slash.

---

## Local development

```bash
# Terminal 1 — kaaroViewer (serves index.html with importmap)
cd D:/src/kaaroViewer
npx serve . -p 8080        # or any static file server

# Terminal 2 — art-of-intent frontend
cd D:/src/art-of-intent/frontend
npm run dev                 # SvelteKit on :5173

# Terminal 3 — Firebase emulators (Functions + Firestore)
cd D:/src/art-of-intent
firebase emulators:start --only functions,firestore
```

Win the puzzle → victory panel shows kaaroViewer iframe → type a seed → LLM call routes through the local Functions emulator.

---

## What is deferred

- **Daily quota** (1 generation/day per user) — `users/{uid}.kaaroLastUsed` field and CF check not yet added. Add to `generateKaaroEntry` when usage patterns are understood.
- **Public library browsing** — the `public` flag exists on `libraryEntries` but no UI surfaces other users' entries yet.
- **Quota UI in kaaroViewer** — "1 prompt remaining today" indicator suppressed pending quota implementation.
- **kaaroViewer custom domain** — `VITE_KAARO_ORIGIN` and `ALLOWED_ORIGINS` use Netlify default URL until a domain is assigned.
