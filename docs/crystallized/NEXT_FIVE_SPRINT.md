---
published: false
title: "Next Five Sprint — audit, Training Log, You-vs-Arty, evocability, docs"
tags:
  - crystallized
  - audit
  - training-log
  - tdd
description: "Closed pipeline for server score audit, post-game ARTY LEARNS tab, You-vs-Arty share line, evocability probes, and doc refresh. Functions + frontend; deploy gate for scheduled work."
date: 2026-07-19
layer: L1-Instance
maturity: EVERGREEN
para: Crystallized
---

# Crystallized: Next Five Sprint

**What was built** (branch `kaaro/grok-goes-burr`, pipeline `docs/projects/NEXT_FIVE.md`):

1. **auditSession** (`functions/game-logic.js`) — finishes the red→green TDD cycle. Recomputes `attempts`, `totalTokens`, `efficiencyScore`, `isWin`, `result` from `attemptsData` + matched words. Returns `{ corrections: null }` when clean (no write loop).
2. **auditDailySessions** — scheduled 00:30 UTC; queries previous day's `sessions`, applies corrections with `scoreAudited: true` + `auditedAt`. Batched writes.
3. **Training Log** — pure `frontend/src/lib/training-log.ts` + post-game **ARTY LEARNS** tab in `+page.svelte`; difficulty badges `[LOW|MEDIUM|HIGH]` on target chips after game-over. Data from already-fetched `dailyWords.aiEvaluation`.
4. **You vs Arty** — `buildYouVsArtyLine()` feeds share text and share-card footer; omitted when evaluation is missing for the day.
5. **Evocability probes** — 3 midnight calls (category haikus without the word); stores `evocability` on `dailyWords` and `evocabilityScore` on `wordDifficulty`. Non-fatal per word. Night budget **7 → 10**.
6. **Docs** — `future-work.md`, `AI_EVALUATION.md`, `data-model.md` refreshed; this crystallization.

## Decisions locked in

| Decision | Rationale |
|---|---|
| Nightly score **sweep**, not onWrite | Cheaper/simpler; accepted that a tampered score can sit until ~00:30 UTC |
| Server scoring formula is authoritative for audit | Port of `computeEfficiencyScore` into `game-logic.js` |
| Training Log uses public `aiEvaluation` only | Zero extra Firestore reads; tab hidden when data absent |
| Evocability = accidental word leaks / 10 | Parallel to embeddability; measures category→word binding |

## What was learned

- **Red tests as a contract** — the six `auditSession` tests were already written; implementing against them avoided over-specifying skip vs correct paths.
- **Post-game tabs compose with the trail** without a modal — same trail-item visual grammar for AI probes keeps the educational parallel explicit.
- **Share line must be optional** — days without `aiEvaluation` (scheduler miss, practice archive, pre-rollout) must not break share text or cards.
- **Functions deploy is still the activation gate** for anything scheduled; frontend Training Log lights up as soon as `aiEvaluation` exists on the day's doc.

## Reusable

- `auditSession` pattern: pure recompute → sparse corrections → stamp + reasons list — works for any client-written score surface.
- `buildTrainingLog` / `buildYouVsArtyLine` pure mappers: view models first, UI second; same module owns both human-facing educational surfaces.
- Evocability helper pair (`buildEvocabilityInstruction` + `countEvocabilityHits`) is the template for any "indirect signal" probe batch.

## Status at close

Code complete on `kaaro/grok-goes-burr`. **Inert until** `firebase deploy --only functions` (audit schedule + evocability + existing AI eval). Hosting deploy ships Training Log + share line for days that already have `aiEvaluation`.

## Verification at close

- `functions`: 80 tests green (`npm test` in `functions/`)
- `frontend`: 171+ tests green including 17 training-log + share-text You-vs-Arty cases; `svelte-check` 0 errors
