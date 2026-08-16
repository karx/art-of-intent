---
published: false
title: "Pipeline — Next Five: Audit, Training Log, You-vs-Arty, Evocability, Doc Refresh"
tags:
  - pipeline
  - planning
  - audit
  - training-log
description: "Batch pipeline for the next five items, stacked on kaaro/fable-loop. Server-side score audit (nightly sweep), full Training Log post-game tab, You-vs-Arty share line, evocability probe batch, and backlog doc refresh."
date: 2026-07-19
layer: L1-Instance
maturity: EVERGREEN
para: Pipeline
status: closed
---

# Pipeline — Next Five

> **CLOSED 2026-07-19** — implementation complete on `kaaro/grok-goes-burr`.
> Crystallization: `docs/crystallized/NEXT_FIVE_SPRINT.md`.

**Branch:** `kaaro/grok-goes-burr` (stacked lineage from `kaaro/fable-loop`; merge to main still gates production).
**Gate:** every functions change here is inert until `firebase deploy --only functions`.

## Grounding (verified in code 2026-07-19)

- v2 AI evaluation already runs nightly in `functions/index.js` (`runAIEvaluation`,
  zero-shot + one-shot probes, `deriveWordDifficulty`, `embeddabilityCount` rename done).
  `aiEvaluation` lands on `dailyWords/{date}` — public read, so the frontend can use it freely.
- No Training Log UI exists anywhere in the frontend.
- `auditSession` has 6 red tests in `functions/test/game-logic.test.js` and no implementation.
- Scoring source of truth: `computeEfficiencyScore` in `frontend/src/lib/scoring.ts` —
  `attempts * 10 + floor(totalTokens / 10)`, `null` on loss/cheat. Red tests match it.
- `docs/future-work.md` is stale: practice mode shipped but unmarked.

## Items

### 1. auditSession — finish the TDD cycle (red → green) + nightly sweep
- Implement `auditSession(sessionDoc)` in `functions/game-logic.js` returning
  `{ corrections, reasons }` per the 6 red tests: recompute score/attempts/totalTokens
  from `attemptsData`, null score on cheat/loss, fix contradictory `isWin`/`result`,
  `corrections: null` when nothing to fix, skip in-progress / missing `attemptsData`.
  Port the scoring formula server-side (server copy becomes authoritative for audit).
- Wire `auditDailySessions` scheduled function (after midnight UTC, after word gen):
  query previous day's `sessions`, apply corrections with `scoreAudited: true`.
- **Decision (user, 2026-07-19):** nightly sweep, not onWrite trigger — cheaper/simpler;
  accepted trade-off: a tampered score can sit on the leaderboard until the sweep.

### 2. Training Log — full post-game tab
- Per `docs/areas/AI_EVALUATION.md` UI spec: "ARTY LEARNS" tab alongside the trail,
  zero-shot / one-shot steps in trail-item style, learning signal, hardest word,
  "what happened" explainer; difficulty badges on word chips post-game.
- Data: `aiEvaluation` on the already-fetched `dailyWords` doc — no new reads.
- Extract formatting/mapping logic to `frontend/src/lib/training-log.ts`, Vitest first.
- Load the kaaro-design skill before writing any UI.

### 3. "You vs Arty" share line
- Compare player tokens/attempts vs `aiEvaluation.summary` (and hardest word) in the
  share text and card. Pure comparison fn (TDD), then wire through `buildCardData()`.
- Zero extra API cost; handles days where `aiEvaluation` is absent (fallback: omit line).

### 4. Evocability probe batch
- 3 extra nightly calls: "write haikus about [word's category] without using the word" —
  the deferred true-difficulty signal from AI_EVALUATION.md. Stores `evocabilityScore`
  per word next to `embeddabilityScore`. Budget grows 7 → 10 calls/night.
- Non-fatal on failure, same pattern as dictionary haikus.

### 5. Doc refresh
- `docs/future-work.md`: mark practice mode shipped; add pointers to this pipeline.
- Update `docs/areas/AI_EVALUATION.md`: v2 is implemented; record sweep-not-trigger
  decision on the audit; evocability moves from future to in-progress.
- Crystallization note when this pipeline closes.

## Order & verification

Audit (1) → Training Log (2) → Share line (3) → Evocability (4) → Docs (5, plus inline
decision notes as they happen). Each item: tests first, `npm run check` + both suites
green before moving on. CI (`.github/workflows/web.yml`) runs svelte-check + vitest +
node:test on PR.
