# Project: Multi-Platform Architecture

**Branch:** `claude/multi-platform-architecture-BnRbW`  
**Status:** In progress  
**Tests:** `frontend/src/test/`, `functions/test/`

---

## Goal

Migrate from 35 load-order-sensitive vanilla JS files to a modern, agent-friendly monorepo that builds to Web, iOS, and Android from one codebase, adds a BYOM AI Gateway, and enforces quality gates at every layer.

---

## Phases

### Phase 1 — AI Gateway ✓
**Files:** `functions/gateway/`, `functions/crypto.js`  
**Tests:** `functions/test/gateway.test.js`, `functions/test/crypto.test.js` (21 tests)

- `functions/gateway/` — four provider adapters (Gemini, OpenAI, Anthropic, Custom) behind a single `routeToProvider()` dispatcher. Each adapter normalises responses to `{ text, inputTokens, outputTokens, finishReason }`.
- `functions/crypto.js` — AES-256-GCM encrypt/decrypt. User API keys are encrypted at rest with `GATEWAY_ENCRYPTION_KEY`; the browser never sees plaintext.
- `artyGenerateHaiku` updated: checks `userSettings/{uid}` in Firestore, decrypts user key, routes to their provider. Falls back to built-in Gemini if no settings — **zero behaviour change for existing players**.
- `saveUserSettings` callable: encrypts key server-side, writes to `userSettings/{uid}`. Supports `null` to clear.
- `functions/` converted to ES modules (`"type": "module"`).
- `firestore.rules` updated: `userSettings/{uid}` is owner-only read/write.

### Phase 2 — SvelteKit Frontend ✓
**Files:** `frontend/`  
**Tests:** `frontend/src/test/scoring.test.ts`, `frontend/src/test/game-state.test.ts` (15 tests)

- SvelteKit 2 + Svelte 5 (TypeScript, `adapter-static`, Vite).
- `$lib/scoring.ts` — pure `getRating()` + `calculateEfficiency()`.
- `$lib/stores/game.svelte.ts` — typed `GameState`, pure `applyAttemptResult()`, `$state` reactive store.
- `$lib/firebase.ts` — Firebase SDK init (Firestore `alpha` db, Auth, Functions).
- `$lib/api.ts` — `callArtyAPI()` + `saveUserSettings()` with typed error mapping.
- `src/routes/+page.svelte` — full game UI: auth, word display, trail, score bar, game-over banner.
- `firebase.json` updated: `hosting.public` → `frontend/build`.

### Phase 3 — Secondary Pages ✓
**Files:** `frontend/src/routes/settings/`, `frontend/src/routes/leaderboard/`, `frontend/src/lib/stores/auth.svelte.ts`

- Shared `authState` store — single `onAuthStateChanged` listener across all pages.
- `+layout.svelte` — nav (Game / Board / Settings), auth bar, theme applied from `localStorage`.
- `/settings` — theme picker (5 themes) + BYOM config (provider, write-only API key, endpoint, model).
- `/leaderboard` — today's scores from `leaderboard` collection, fallback to `sessions`.

### Phase 4 — CI/CD ✓
**Files:** `netlify.toml`, `.github/workflows/`, `capacitor.config.ts`, `.githooks/pre-commit`

- `netlify.toml` — build base `frontend/`, SPA fallback, immutable asset caching.
- `web.yml` — `check → build → deploy` pipeline. `check` runs svelte-check + vitest + functions tests. `deploy` fires only on `main`.
- `android.yml` — debug APK on dispatch, signed AAB on `v*` tags.
- `ios.yml` — simulator build on dispatch, signed IPA + P12 cert on `v*` tags (macOS-15 runner).
- `.githooks/pre-commit` — local mirror of CI `check` job. Activate: `git config core.hooksPath .githooks`.

---

## Remaining (Phase 5 — Cleanup)

- Run `npx cap add ios && npx cap add android` locally; commit native project dirs.
- Add `ios/ExportOptions.plist` for IPA export.
- Archive old `src/js/*.js`, `index.html`, `history.html`, `test-*.html`.
- Update `CLAUDE.md` for new stack.

---

## Secrets Required

| Secret | Used by |
|---|---|
| `NETLIFY_AUTH_TOKEN` | `web.yml` deploy |
| `NETLIFY_SITE_ID` | `web.yml` deploy |
| `ANDROID_KEYSTORE_BASE64` | `android.yml` release |
| `ANDROID_KEYSTORE_PASSWORD` | `android.yml` release |
| `ANDROID_KEY_ALIAS` | `android.yml` release |
| `ANDROID_KEY_PASSWORD` | `android.yml` release |
| `IOS_CERTIFICATE_BASE64` | `ios.yml` release |
| `IOS_CERTIFICATE_PASSWORD` | `ios.yml` release |
| `IOS_PROVISION_PROFILE_BASE64` | `ios.yml` release |
| `IOS_KEYCHAIN_PASSWORD` | `ios.yml` release |
| `GATEWAY_ENCRYPTION_KEY` | `functions/.env` (64 hex chars, 32 bytes) |
