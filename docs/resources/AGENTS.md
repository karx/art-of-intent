---
published: false
title: "Agent Guidelines — Art of Intent"
tags:
  - agents
  - reference
description: "How AI agents should orient in this codebase. Stack facts, key files, patterns to follow, and known pitfalls."
date: 2026-04-25
layer: L2-System
maturity: BUDDING
para: SkillSurface
---

# Agent Guidelines — Art of Intent

> Read this before making any changes. It encodes hard-won context that isn't obvious from the code.

---

## Stack (current)

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 2 + Svelte 5 runes (TypeScript, Vite, `adapter-static`) |
| Cloud Functions | Firebase Cloud Functions v2, Node 20, ES modules |
| Database | Firestore, database ID **`alpha`** (non-default — must be explicit in all queries) |
| Auth | Firebase Auth — anonymous + Google OAuth |
| Hosting | Netlify (primary), Firebase Hosting (secondary) |
| Mobile | Capacitor — wraps `frontend/build` into Android + iOS |
| AI | Gemini via Cloud Function; user-swappable via BYOM gateway |

The old stack (vanilla JS, 35 files, Python dev server) is fully retired. Any doc referencing `src/js/`, `index.html` at repo root, `game.js`, or `python3 -m http.server` is stale.

---

## Key Entry Points

| File | What it is |
|---|---|
| `frontend/src/routes/+page.svelte` | Main game UI — auth, prompt input, trail, score bar, game-over |
| `frontend/src/lib/stores/game.svelte.ts` | All reactive game state via Svelte 5 `$state` runes |
| `frontend/src/lib/api.ts` | `callArtyAPI()`, `saveUserSettings()` — Cloud Function callers |
| `frontend/src/lib/share-card.ts` | SVG share card generator — cheat-aware, gold branding for cheat sessions |
| `frontend/src/lib/firebase.ts` | Firebase SDK init — Firestore `alpha` db, Auth, Functions |
| `frontend/src/lib/scoring.ts` | Pure scoring logic — `calculateEfficiency()`, `getRating()` |
| `functions/index.js` | Both Cloud Functions: `artyGenerateHaiku` + `generateDailyWords` |
| `functions/gateway/` | Multi-provider AI dispatcher — Gemini, OpenAI, Anthropic, Custom |
| `functions/crypto.js` | AES-256-GCM encrypt/decrypt for BYOM API keys |

---

## Critical Patterns

**Firestore database ID.** Every Firestore call must specify `{ databaseId: 'alpha' }`. This is handled in `firebase.ts`. If you add a new Cloud Function that touches Firestore, use `getFirestore(app, 'alpha')` — not `getFirestore(app)`.

**Server-side truth.** Daily words, system prompts, and user API keys live only in Cloud Functions. The client sends only `userPrompt` + `sessionId`. Never move word/key logic client-side.

**No `alert()`.** All error and status messages surface inline — in the trail or via `showToast()`. Never use `alert()`, `confirm()`, or `prompt()`.

**iOS zoom fix.** All mobile inputs must have `font-size: 16px` explicitly to prevent iOS auto-zoom. Enforce this in CSS, not JS.

**Share card single source of truth.** `buildCardData()` in `+page.svelte` is the only place that assembles share card data. `shareCard()` returns `'shared' | 'downloaded' | 'cancelled'` — callers show a toast based on that return value.

**Error propagation.** Cloud Function throws typed `HttpsError` with structured `details`. `callArtyAPI()` in `api.ts` switches on `error.code` and returns a typed result — callers render it inline, never throw to the browser.

**Cheat sessions.** If a player uses a BYOM key against the live puzzle, `cheated = true` is written to the session. Cheat sessions show gold card branding, have `efficiencyScore: null`, and are separated into a "cheat hall" on the leaderboard.

---

## Do Not

- Do not read `src/js/` — that directory is from the retired stack
- Do not use `alert()` for any user-visible message
- Do not write new Firestore code without specifying `alpha` as the database ID
- Do not move daily word logic or API keys to the client
- Do not create notes without frontmatter (see [[docs/README.md]] conventions)

---

## Related

- [[docs/data-model.md]] — Firestore collections and field inventory
- [[docs/areas/FIREBASE_FUNCTIONS_ARCHITECTURE.md]] — Cloud Function internals
- [[docs/areas/SECURITY_FLOW.md]] — prompt sanitisation and injection defence
- [[docs/VISION.md]] — product north star and stack rationale
