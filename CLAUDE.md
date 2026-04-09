# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Art of Intent** is a daily browser-based word puzzle. Players write prompts to guide "Arty" (a Gemini-powered haiku bot) to include 3 target words in its responses without using blacklisted words. Score is based on token efficiency and attempt count. New words generate daily via Cloud Scheduler.

Play: https://art-of-intent.netlify.app

---

## Commands

```bash
# Build the frontend
npm run build                         # runs: cd frontend && npm run build

# Deploy everything
firebase deploy

# Deploy only the Cloud Functions (most common during development)
firebase deploy --only functions

# Deploy only hosting (Svelte build output)
firebase deploy --only hosting

# Deploy only Firestore rules/indexes
firebase deploy --only firestore

# View live function logs
firebase functions:log

# Mobile (Capacitor)
npm run cap:sync                      # sync Svelte build into android/ ios/
npm run cap:open:android
npm run cap:open:ios
```

The frontend is a **SvelteKit app** in `frontend/`. Build output goes to `frontend/build/`, which is what Firebase Hosting and Capacitor both serve.

---

## Repo Structure

```
frontend/          SvelteKit app (the game UI)
  src/
    routes/        Pages: +page.svelte (game), leaderboard/, insights/, help/, about/
    lib/           Shared: firebase.ts, api.ts, share-card.ts, stores/, scoring.ts, sound.ts
  static/          PWA assets: manifest, favicons, og image, robots.txt, sitemap
functions/         Firebase Cloud Functions (Node.js 20)
docs/              Design docs, data model, future work
scripts/           Admin utilities (manual-deploy-words.cjs, repo-scan.js)
android/           Capacitor Android project
ios/               Capacitor iOS project
generate-og-image.{html,js}   OG image generator utility
generate-icons.{html,cjs}     Icon generator utility
```

---

## Architecture

### Deployment

- **Netlify** — primary hosting, serves `frontend/build` (SvelteKit static adapter)
- **Firebase Hosting** — alternative hosting, also serves `frontend/build`
- **Firebase Cloud Functions v2** (Node.js 20, `us-central1`) — `functions/` directory
- **Firestore** — database ID `alpha` (non-default; must be set explicitly in all queries)
- **Firebase Auth** — anonymous + Google OAuth
- **Capacitor** — wraps `frontend/build` into Android APK and iOS app

### Cloud Functions

**`artyGenerateHaiku`** (HTTPS Callable) — The core game loop:
1. Validates Firebase Auth token
2. Reads today's `dailyWords/{YYYY-MM-DD}` from Firestore server-side
3. Builds the full system prompt — client cannot influence this
4. Calls Gemini API (or user's BYOM provider via `userSettings`)
5. Maps errors to typed `HttpsError` codes with structured `details`

**`generateDailyWords`** (Scheduled, daily midnight UTC) — Generates today's 3 target words + 5–7 blacklist words using a date-seeded deterministic RNG. Stores to `dailyWords/{YYYY-MM-DD}`.

**`saveUserSettings`** (HTTPS Callable) — Encrypts and stores a player's BYOM API key in `userSettings/{uid}`.

### Key Data Flow

```
+page.svelte  →  callArtyAPI()          (frontend/src/lib/api.ts)
              →  httpsCallable(functions, 'artyGenerateHaiku')
              →  Cloud Function reads Firestore + calls Gemini
              →  returns { responseText, userPromptTokens, usageMetadata }
              →  applyAttemptResult()   (game.svelte store)
              →  trail[] updated → saveToStorage() + saveSessionToFirestore()
```

### Gemini Model

Current model: `gemini-3.1-flash-lite-preview`
Configured as default in `functions/index.js`. Can be overridden via `GEMINI_API_URL` in `functions/.env`.

### Error Handling Convention

Cloud Function throws typed `HttpsError` with `details: { geminiStatus, retryAfterSeconds, quotaMetric }`. Client (`callArtyAPI` in `api.ts`) switches on `error.code` and surfaces human-readable messages. Errors display inline in the trail — no `alert()`.

### Share Cards

`frontend/src/lib/share-card.ts` generates SVG share cards. Cheat sessions render with gold branding. `buildCardData()` in `+page.svelte` is the single source of truth. `shareCard()` handles Web Share API (mobile) vs PNG download (desktop), returns `'shared' | 'downloaded' | 'cancelled'`.

### Firestore Collections

See `docs/data-model.md` for the full field inventory.

| Collection | Written by | Notes |
|---|---|---|
| `dailyWords/{YYYY-MM-DD}` | Cloud Function | Public read |
| `sessions/{sessionId}` | Frontend on game-over | Owner write, public read |
| `sessionEvents/{sessionId}` | Frontend (logEvent) | Auth write |
| `users/{userId}` | Frontend on sign-in | Owner write, public read |
| `userSettings/{userId}` | Cloud Function | Owner read/write only |

All Firestore calls must specify database ID `alpha` — handled by `frontend/src/lib/firebase.ts`.

---

## Environment

Functions require `functions/.env` (gitignored):
```
GEMINI_API_KEY=...
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent
```
See `functions/.env.example` for the template.

---

## CSS / Theming

Theming is done via CSS variables defined in `frontend/src/app.css` (or imported dos-theme). The base font is 15px (`1rem = 15px`). All mobile inputs use `font-size: 16px` explicitly to prevent iOS auto-zoom.

---

## Pending Work

See `docs/future-work.md` for scoped, ready-to-implement items. The two highest-priority items are:
1. **Result URL** — encode score in `#r=<base64>` hash for shareable read-only result links
2. **Streak counter** — day-over-day retention feature
