---
published: false
title: "Fable Loop Sprint — result links, streak, hints, creep feedback"
tags:
  - crystallized
  - virality
  - retention
  - tdd
description: "One autonomous-loop sprint (2026-07-07) shipped the share/retention layer: result URLs, share-text composition, streak counter, word hints, creep feedback. 106→151 tests, 14 atomic commits on kaaro/fable-loop."
date: 2026-07-07
layer: L1-Instance
maturity: EVERGREEN
para: Crystallized
---

# Crystallized: Fable Loop Sprint

**What was built** (branch `kaaro/fable-loop`, 14 atomic commits, all TDD):

1. **Result URL** (`lib/result-url.ts`) — game results encode into a base64url `#r=` token; the page renders a read-only result card from the hash with no Firestore read. Spec: future-work §2.
2. **Share-text composition** (`lib/share-text.ts`) — extracted from `+page.svelte`; every share now links to the `#r=` result card instead of the bare homepage.
3. **Streak counter** (`lib/streak.ts` + runes store) — `Day N 🔥` in the top bar; counts completed games, not wins; idempotent per day.
4. **Word hints** (`lib/hints.ts` + `targetCategories` in `functions/index.js`) — unmatched target words reveal their pool category after 3 attempts. Needs a functions deploy to activate.
5. **Creep feedback** (`lib/creep.ts`) — counter flash on rise, section shake at critical; `prefers-reduced-motion` respected.

Suite went **106 → 151 tests**; `computeEfficiencyScore` also moved from inline UI code into `lib/scoring.ts`.

## What was learned

- **Read before building: future-work §1 was already shipped.** The share card had the haiku, word badges, and CTA all along — the backlog doc described a prior version. A stale backlog costs a whole planning cycle; correcting docs is shipping.
- **The features compose into one loop**: hints keep stuck players finishing → finishing feeds the streak → finishing produces a share → the share carries a result link → the link lands a new player on a result card with a "Play" CTA. Impact came from the *composition*, not any single feature.
- **The extract-pure-logic pattern scales**: every feature followed lib-module + test-first + thin UI wiring (established in the test-coverage sprint). Pre-PR review still found two integration bugs the unit tests could not see (init ordering between layout and page; wall-clock vs game date) — pure-logic TDD covers logic, not lifecycle.
- **PowerShell 5.1 corrupts emoji in here-strings** — commit messages must stay ASCII on this machine.

## Reusable

- The `#r=` token pattern (versioned, defensive decode, base64url) suits any future stateless share surface — leaderboard positions, practice-mode results.
- `advanceStreak`'s idempotent-per-day design is the template for any "count once per day" mechanic.
- The stuck-state detection in hints (threshold on attempts + unmatched) is the channel for smarter v2 hints from the existing dictionary-haiku embeddability data.

## Status at close

Pushed to `origin/kaaro/fable-loop`; merge deliberately left to the maintainer. Word hints activate only after `firebase deploy --only functions`. Remaining backlog: practice mode (next pipeline).
