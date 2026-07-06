---
published: false
title: "Streak Counter — day-over-day retention"
tags:
  - pipeline
  - retention
  - frontend
description: "Daily streak shown as 'Day N 🔥' in the top bar. Pure date logic, localStorage persistence, idempotent per day. future-work §3 item."
date: 2026-07-07
layer: L1-Instance
maturity: BUDDING
para: Pipeline
---

# Pipeline: Streak Counter

**Goal:** `Day N 🔥` in the top bar — the classic daily-puzzle retention lever.

## Decisions

- **A streak counts completed games, not wins.** Playing daily is the retention behavior we reward; punishing a loss with a broken streak discourages the return visit. Cheat runs count too — they played.
- **Idempotent by design:** `advanceStreak` with `lastPlayed === today` returns the record unchanged, so game-restore from localStorage can fire the game-over effect again without double-counting.
- **Grace window in display:** the top bar still shows the streak if you played yesterday but not yet today — it reads "your streak is alive, defend it", which is the whole nudge.
- **Client-only.** No Firestore field yet; if streaks later feed the leaderboard, add a server-verified variant then (client streaks are trivially forgeable).

## Files

- `frontend/src/lib/streak.ts` — pure `advanceStreak` / `displayStreak` (10 tests)
- `frontend/src/lib/stores/streak.svelte.ts` — runes store + localStorage (`aoi_streak`)
- `+layout.svelte` — top-bar display; `+page.svelte` — game-over effect + CTA copy

## Status

- [x] TDD module + store + UI (2026-07-07, branch `kaaro/fable-loop`)
- [ ] Merge to main
- [ ] Consider: streak in share text / result URL payload (v2 token field)
