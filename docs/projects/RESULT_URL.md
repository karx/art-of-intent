---
published: false
title: "Result URL — shareable read-only result links"
tags:
  - pipeline
  - virality
  - frontend
description: "Encode a game result in a #r=<base64url> URL hash so anyone can view a read-only result card without a Firestore read. CLAUDE.md's #1 pending item."
date: 2026-07-07
layer: L1-Instance
maturity: SEED
para: Pipeline
---

# Pipeline: Result URL

**Goal:** A result link that reconstructs a read-only view of someone's finished game purely from the URL hash — no Firestore lookup, fits in a tweet. Spec lives in [future-work.md](../future-work.md) §2.

## Starting context (repo survey, 2026-07-07)

**Completed recently (merged to main):**
- PR #15 — test-coverage pipeline: pure logic extracted to `frontend/src/lib/` (`scoring.ts`, `stores/game.svelte.ts` pure half, `cheat-codes.ts`, `prompt-purify.ts`), 106 Vitest tests across 5 suites, all green.
- PKM strategy skill surface (`docs/resources/PKM_STRATEGY.md`).
- Share text already carries a haiku hint + "Can you beat it?" CTA (partial overlap with future-work §1).

**In progress / open:**
- This pipeline (branch `kaaro/fable-loop`).
- future-work §1 (share card copy: winning haiku on the card) — not started.
- future-work §3 backlog: streak counter, word hints, creep animation, practice mode — not started.
- Known debt from security review: `sessionEvents` and `leaderboard` Firestore rules lack ownership checks (since fixed on `kaaro/fix/firestore-rules`). ~~No CI on PRs~~ — correction 2026-07-07: `.github/workflows/web.yml` already runs svelte-check + vitest + functions tests + build on PRs, and deploys Netlify on main push. Both open branches verified against it locally (svelte-check 0 errors, 151 + 21 tests green).

## Design decisions

- **Payload**: `{ v, d, a, t, m, n, s, w, r, c? }` — version, date, attempts, tokens, matched count, target count, score, per-word found bits, result W/L, cheated flag. ASCII-only JSON → `btoa` safe.
- **Encoding**: base64url (`+→-`, `/→_`, strip `=`) so the token never needs percent-encoding in a hash.
- **Score formula extracted**: `computeEfficiencyScore()` moves from inline `+page.svelte` into `lib/scoring.ts` — single source of truth shared by Firestore save and the URL payload. Formula: victory → `attempts*10 + floor(tokens/10)`, else/cheat → `null`.
- **Decode is defensive**: any malformed/wrong-version token → `null`, page falls back to normal game view. Never throw on user-supplied hashes.

## Files in scope

- `frontend/src/lib/result-url.ts` (new) — encode/decode/build/URL helpers
- `frontend/src/test/result-url.test.ts` (new) — TDD suite
- `frontend/src/lib/scoring.ts` + `src/test/scoring.test.ts` — `computeEfficiencyScore`
- `frontend/src/routes/+page.svelte` — "Copy Result Link" button; `#r=` detection → read-only result view

## Status

- [x] Pipeline opened, survey done
- [x] `computeEfficiencyScore` extracted (TDD) — worked example from the spec (12 att / 11419 tok → 1261) is now a test
- [x] result-url codec (TDD) — 18 new tests, suite at 124 green
- [x] UI integration (#r= view + copy-link button) — reuses game-over-panel styling per kaaro Register B
- [x] Sandbox verification — production build clean; preview server 200; shared-result view confirmed in compiled bundle. Manual click-through of a #r= link pending human eyes.
- [x] Share-flow composition — `buildShareText` extracted to `lib/share-text.ts` (TDD); shared text now carries the `#r=` link, so every share is a click-through to the result card. future-work §1 found already shipped in `share-card.ts`; backlog corrected.
- [ ] Merge to main (PR from kaaro/fable-loop — maintainer's call)
- [x] Crystallization note: `docs/crystallized/FABLE_LOOP_SPRINT.md`
