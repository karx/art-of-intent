# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Art of Intent** is a daily browser-based word puzzle. Players write prompts to guide "Arty" (a Gemini-powered haiku bot) to include 3 target words in its responses without using blacklisted words. Score is based on token efficiency and attempt count. New words generate daily via Cloud Scheduler.

Play: https://art-of-intent.netlify.app

---

## Commands

```bash
# Deploy everything
firebase deploy

# Deploy only the Cloud Functions (most common during development)
firebase deploy --only functions

# Deploy only hosting (static frontend)
firebase deploy --only hosting

# Deploy only Firestore rules/indexes
firebase deploy --only firestore

# View live function logs
firebase functions:log
```

There is no build step — the frontend is plain HTML/CSS/JS served directly from the repo root. No bundler, no transpilation.

---

## Architecture

### Deployment

- **Firebase Hosting** — serves the static frontend from the repo root (`.`)
- **Firebase Cloud Functions v2** (Node.js 20, `us-central1`) — `functions/` directory
- **Firestore** — database ID `alpha` (non-default; must be set explicitly in all queries)
- **Firebase Auth** — anonymous + Google OAuth

### The Two Cloud Functions

**`artyGenerateHaiku`** (HTTPS Callable) — The core game loop:
1. Validates Firebase Auth token
2. Reads today's `dailyWords/{YYYY-MM-DD}` from Firestore server-side
3. Builds the full system prompt (`buildSystemInstruction`) — client cannot influence this
4. Calls Gemini API with `GEMINI_API_KEY` from environment
5. Maps Gemini HTTP errors to typed `HttpsError` codes with structured `details` (retry seconds, quota metric)

**`generateDailyWords`** (Scheduled, daily midnight UTC) — Generates today's 3 target words + 5-7 blacklist words using a date-seeded deterministic RNG. Stores to `dailyWords/{YYYY-MM-DD}`.

### Frontend Module Loading

Scripts load in order via `<script>` tags in `index.html`. Firebase modules use `type="module"`, the rest are classic scripts. Load order matters:

```
share-card-v3.js → share-card-v4.js → share-card-v5.js → share-card-generator.js
firebase-config.js → firebase-auth.js → firebase-db.js → ui-components.js
welcome-modal.js → firebase-integration.js → game.js
```

`game.js` is the main orchestrator — ~2000 lines, `type="module"`. It imports `httpsCallable` and `functions` from `firebase-config.js`.

### Key Data Flow

```
game.js  →  callArtyAPI()
         →  httpsCallable(functions, 'artyGenerateHaiku')
         →  Cloud Function reads Firestore + calls Gemini
         →  returns fullResponse (raw Gemini API response object)
         →  processResponse() extracts text, tokens, checks target/blacklist words
         →  updateUI() + saveGameState()
```

### Gemini Model

Current model: `gemini-3.1-flash-lite-preview`
Configured as default in `functions/index.js`. Can be overridden per-deployment via `GEMINI_API_URL` in `functions/.env`.

### Error Handling Convention

Cloud Function throws typed `HttpsError` with `details: { geminiStatus, retryAfterSeconds, quotaMetric }`. Client (`callArtyAPI`) switches on `error.code` and surfaces human-readable messages. Errors display inline in the trail via `showArtyError()` — no `alert()` in the share/API flows.

### Share Cards

`share-card-generator.js` dispatches to versioned generators. Default is **v5** (`share-card-v5.js`). All three call sites in `game.js` use `buildCardData()` helper. `shareImage()` in the generator handles Web Share API (mobile) vs PNG download (desktop) and returns `'shared' | 'downloaded' | 'cancelled'`.

### Firestore Collections

| Collection | Notes |
|---|---|
| `dailyWords/{YYYY-MM-DD}` | Written only by Cloud Function. Public read. |
| `users/` | Owner write, public read |
| `sessions/` | Owner write, public read |
| `leaderboard/` | Auth write, public read |

All Firestore calls must specify database ID `alpha`:
```js
// firebase-config.js already handles this via initializeApp + db.settings
```

---

## Environment

Functions require `functions/.env` (gitignored):
```
GEMINI_API_KEY=...
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent
```
See `functions/.env.example` for the template. `GEMINI_API_URL` overrides the hardcoded default in `functions/index.js`.

---

## CSS / Theming

`dos-theme.css` is the primary stylesheet and sets `body { font-size: 15px }` — making `1rem = 15px`. All mobile inputs must use `font-size: 16px` explicitly (already in the `@media (max-width: 768px)` block in `styles.css`) to prevent iOS auto-zoom. Themes override CSS variables defined in `dos-theme.css`.

---

## Pending Work

See `docs/future-work.md` for scoped, ready-to-implement items. The two highest-priority items are:
1. **Result URL** — encode score in `#r=<base64>` hash for shareable read-only result links
2. **Streak counter** — day-over-day retention feature
