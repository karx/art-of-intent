---
published: false
title: "Practice Mode — replay the archive"
tags:
  - pipeline
  - gameplay
  - retention
description: "?practice=1 replays a random archived daily puzzle with no leaderboard, session, or streak footprint. Server-side date validation keeps the prompt-injection surface closed."
date: 2026-07-07
layer: L1-Instance
maturity: BUDDING
para: Pipeline
---

# Pipeline: Practice Mode

Branch `kaaro/fable-loop`. Backlog: future-work §3 (final item).

## The design decision

The backlog said "random words" — but client-chosen words would let the
client influence the server-built system prompt, the one thing this
architecture explicitly forbids. Instead: **practice = replaying a random
archived day**. The client sends only a past `gameDate`; the Cloud
Function validates it (`isValidArchiveDate`, archive-only, real calendar
dates) and loads that day's `dailyWords` doc itself. Zero new
prompt-injection surface, and the word archive becomes content.

## Behavior

- `/?practice=1` → random date from the last 60 days, re-rolls up to 4× past archive gaps.
- Normal rules (creep, hints, cheat codes) — but **no footprint**: `saveSessionStart`, `saveSessionToFirestore`, `logEvent`, and the streak effect all early-return. localStorage uses a separate `aoi_practice` slot and never restores.
- Result links still work (they stamp the archived date); shares just aren't ranked.
- Entry: Practice button on the daily game-over panel; New Practice Puzzle re-rolls.

## Status

- [x] Server: `gameDate` param + `isValidArchiveDate` (9 tests; functions suite 69 green, now in CI)
- [x] Client: plumbing + UI (svelte-check 0 errors, 151 tests, build clean)
- [ ] Deploy `firebase deploy --only functions` (also carries word hints)
- [ ] Merge — maintainer's call
