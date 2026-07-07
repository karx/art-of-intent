---
published: false
title: "Firestore Rules Hardening — sessionEvents, leaderboard, sessions"
tags:
  - pipeline
  - security
  - firestore
description: "Closes three write-permission gaps: sessionEvents had no ownership check, legacy leaderboard accepted writes from any signed-in user, and sessions docs without a userId could be hijacked."
date: 2026-07-07
layer: L1-Instance
maturity: BUDDING
para: Pipeline
---

# Pipeline: Firestore Rules Hardening

Branch `kaaro/fix/firestore-rules` (off main, independent of `kaaro/fable-loop`).

## The gaps

1. **`sessionEvents/{sessionId}`** — `allow create, update: if isAuthenticated()`: any signed-in user (anonymous auth is one click) could read or overwrite *any* session's event log.
2. **`leaderboard/{**}`** — create/update open to all authenticated users. Nothing in `frontend/src` or `functions/` references this collection anymore (verified by grep); rankings are computed from public `sessions`. An attacker could still plant spoofed docs here.
3. **`sessions` update** — the `!resource.data.keys().hasAny(['userId'])` branch let any user claim a session doc that lacked a userId. Both write paths (`saveSessionStart`, `saveSessionToFirestore`) have stamped `userId` at create for a while, so the branch only served hijacking.

## The fixes

- `sessionEvents`: read/update require `resource.data.userId == request.auth.uid`; create requires the caller to stamp their own uid. `logEvent()` already writes `{ sessionId, userId, events: arrayUnion }` — no client change needed (merge-writes evaluate against the merged doc, so the always-present `userId` satisfies create and update).
- `leaderboard`: `write: if false` (reads stay public). The plural `leaderboards` was already locked.
- `sessions`: update requires stored **and** incoming `userId` to match the caller. Pre-existing orphan docs without a userId become immutable — acceptable; they were only hijackable before.

## What was checked

- `logEvent` is the sole `sessionEvents` writer (grep of `frontend/src`), and it always includes `userId`.
- No reader of `sessionEvents` outside the owner path — insights/leaderboard pages read `sessions` only.
- `dailyWords`, `dailyChallenges`, `leaderboards`, `userSettings` rules unchanged.

## Known residual risk (documented, not addressed here)

Scores in `sessions` are still client-computed — a motivated user can write a fabricated session. Fixing that requires server-side session validation (callable or trigger), a larger design. This pipeline only removes the *cross-user* tampering vectors.

## Verification / rollout

- Rules unit tests need the Firestore emulator (Java) — not set up in this repo; verified by code audit above instead. If emulator testing is added later, `@firebase/rules-unit-testing` cases are sketched in this doc's git history.
- Deploy with `firebase deploy --only firestore` (rules take effect immediately; watch for `permission-denied` in `logEvent` — it is try/caught and non-fatal by design).

## Status

- [x] Rules tightened + audit (2026-07-07)
- [ ] Deploy (`firebase deploy --only firestore`) — maintainer's call
- [ ] Merge to main — maintainer's call
