---
published: false
title: "Daily Haiku Wall — communal gallery"
tags:
  - pipeline
  - community
  - retention
description: "/wall shows today's winning haikus from all players — the game's fiction (an AI poet) finally has a gallery. Frontend-only; reads the public sessions collection."
date: 2026-07-09
layer: L1-Instance
maturity: BUDDING
para: Pipeline
---

# Pipeline: Daily Haiku Wall

Branch `kaaro/fable-loop`. Origin: the "missing delight feature" from the 2026-07-07 project assessment — the game produces poetry daily and then discards it; the wall turns it into a communal gallery and a post-game destination.

## Decisions

- **Haikus, not prompts.** `attemptsData` stores both, but prompts can be personal — the wall shows only Arty's output plus the matched words. Revisit only with explicit player opt-in.
- **Frontend-only.** Sessions are already public-read and the leaderboard's composite index (result + cheated + gameDate + efficiencyScore) covers the queries — zero backend change.
- **Cheat runs included, gold-badged, sorted last** — consistent with the leaderboard's cheat-hall convention.
- **Best haiku per session** = non-violation attempt with the most `foundWords` (`buildWallEntries`, pure, 6 tests).

## Funnel

Finish daily puzzle → game-over links "See today's haiku wall" → wall's empty state and footer both CTA back to "Play today's puzzle". Wall works signed-out, so shared wall links are a cold-start entry too.

## Status

- [x] `lib/wall.ts` + tests; `/wall` route; nav item ❋; game-over link (2026-07-09)
- [ ] Merge — maintainer's call
- [ ] v2 ideas: per-day archive (`/wall?d=`), wall entry share cards
