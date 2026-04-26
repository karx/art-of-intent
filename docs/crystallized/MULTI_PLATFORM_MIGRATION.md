---
published: false
title: "Crystallized: Multi-Platform Migration"
tags:
  - crystallized
  - sveltekit
  - migration
description: "Learnings from migrating Art of Intent from 35 vanilla JS files to a SvelteKit monorepo with TypeScript, Svelte 5 runes, Capacitor mobile, and CI/CD. Phases 1–4 complete."
date: 2026-04-25
layer: L1-Instance
maturity: EVERGREEN
para: Crystallized
---

# Crystallized: Multi-Platform Migration

> Pipeline closed. This note captures what was built, what was learned, and what patterns are reusable.
> For the full phase log, see [[docs/projects/MULTI_PLATFORM.md]].

---

## What Was Built

A full-stack migration from a load-order-sensitive vanilla JS app to a modern monorepo:

| Phase | What shipped |
|---|---|
| 1 — AI Gateway | Multi-provider dispatcher (Gemini, OpenAI, Anthropic, Custom), AES-256-GCM key encryption, BYOM support |
| 2 — SvelteKit Frontend | TypeScript, Svelte 5 runes, `adapter-static`, typed game state, scoring, Firebase SDK init |
| 3 — Secondary Pages | Leaderboard, Settings (BYOM config + theme picker), shared auth store, nav layout |
| 4 — CI/CD | Netlify deploy pipeline, Android APK/AAB, iOS IPA, pre-commit hook mirroring CI |

Phase 5 (native project dirs, iOS export options, archive old files) is still open.

---

## Key Decisions and Why

**Svelte 5 runes over Svelte 4 stores.** `$state`, `$derived`, `$effect` made the game store (`game.svelte.ts`) testable as a plain module — no mock required. The runes compile to reactive primitives that read naturally in tests.

**`adapter-static` over `adapter-node`.** Art of Intent has no server-rendered pages. Static adapter + Netlify CDN gives zero cold-start latency on every route. Firebase Hosting as a secondary target works identically.

**Firestore `alpha` database ID must be explicit.** The project uses a non-default Firestore database. Every SDK call that omits the ID silently queries the default (empty) database. Centralised in `firebase.ts` — not repeated per call.

**BYOM keys encrypted server-side.** The browser never sees a plaintext API key. `saveUserSettings` callable encrypts with AES-256-GCM before writing. `GATEWAY_ENCRYPTION_KEY` lives only in `functions/.env`.

**Error codes, not error strings.** Cloud Function throws `HttpsError` with typed `code` + structured `details`. `callArtyAPI()` switches on `code` and maps to human-readable messages. This means error copy can change without touching the function.

---

## What Surprised Us

**The pre-commit hook is the safety net, not the CI.** CI catches failures after a push; the pre-commit hook (`svelte-check + vitest + functions tests`) catches them before. The extra 15-second check-on-commit pays off every time a type error would have blocked the deploy pipeline.

**Svelte 5 runes require `.svelte.ts` extension.** Files that use `$state` outside `.svelte` components must use the `.svelte.ts` extension or the compiler ignores the rune syntax. This isn't documented prominently.

**`adapter-static` + SPA fallback.** SvelteKit's static adapter generates a 404.html for SPA fallback. Netlify needs `[[redirects]] from = "/*" to = "/index.html"` in `netlify.toml`. Without it, deep-links 404 in production but work in `vite dev` (confusing).

---

## Reusable Patterns

- **Multi-provider AI gateway pattern** — `routeToProvider(provider, systemPrompt, userPrompt, config)` with per-provider adapters normalising to a common shape. See `functions/gateway/`.
- **Server-side encrypted key storage** — AES-256-GCM with a hex-encoded 32-byte key. See `functions/crypto.js`.
- **Svelte 5 typed game store** — pure functions on state, exported for testing. See `frontend/src/lib/stores/game.svelte.ts`.
- **CI pipeline with pre-commit mirror** — `.githooks/pre-commit` runs the same `check` job as `web.yml`. See `Phase 4 — CI/CD` in [[docs/projects/MULTI_PLATFORM.md]].

---

## What's Next

- Phase 5: commit native project dirs, add `ios/ExportOptions.plist`, archive old `src/js/`
- Enhanced gateway: retry, cache, logging, rate limiting — see [[docs/projects/AI_GATEWAY_ENHANCED.md]]
- Result URL + Streak counter — see [[docs/future-work.md]]
