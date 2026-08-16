---
published: false
title: "Future Work â€” Art of Intent"
tags:
  - backlog
  - planning
description: "Scoped, ready-to-implement backlog items ordered by priority. Each item has a clear goal, approach, and the exact files to change."
date: 2026-04-25
layer: L1-Instance
maturity: BUDDING
para: Pipeline
---

# Future Work

Items documented here are scoped, ready to implement, and ordered by priority.

---

## 1. Share Card Copy Improvements â€” âœ… SHIPPED (verified 2026-07-07)

> **Status:** Already implemented in `share-card.ts` â€” the card features the best-matching
> haiku in a quote box, shows `â˜… N/M WORDS FOUND` with per-word badges, and closes with
> "Can you guide Arty better?". The share *text* also quotes the winning haiku and links
> to a `#r=` result URL (see Â§2). Section kept for the original rationale.

**Goal:** Make the end-game share image compelling enough that non-players want to click through.

**Current state (stale):** The share card shows score, attempts, tokens, and a "Play at: â€¦" link. It reads like a stats dump â€” no emotional hook for someone seeing it cold.

**What to change:**

### Include the winning haiku(s)
- Surface the haiku(s) that matched a target word in the card.
- Format as styled blockquote text â€” the haiku itself is the hook. It's poetic, brief, and surprising.
- Example layout:
  ```
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚  ART OF INTENT  â€¢  2026-03-09   â”‚
  â”‚                                 â”‚
  â”‚  "Shadows start to creep,       â”‚
  â”‚   Guarding city, dark knight    â”‚
  â”‚   Justice will arrive."         â”‚
  â”‚                         âœ“ night â”‚
  â”‚                                 â”‚
  â”‚  3/3 words  â€¢  12 attempts      â”‚
  â”‚  Score: 1261                    â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
  ```

### Show target words matched vs total
- Replace the raw token count with `â˜… 3/3 words found` â€” more scannable for non-players.
- Token count can stay as a secondary stat for the community.

### Add a "Can you do better?" CTA
- Replace the plain URL with: `Can you beat this? â†’ art-of-intent.netlify.app`
- This reframes the share as a challenge, not a brag.

**Files to change:**
- `frontend/src/lib/share-card.ts` â€” card layout and text rendering
- `frontend/src/routes/+page.svelte` â€” pass winning haiku(s) into `buildCardData()` (already available in `gameState.trail`)

---

## 2. Result URL / Shareable Link â€” âœ… BUILT on `kaaro/fable-loop` (2026-07-07, pending merge)

> **Status:** Implemented per this spec â€” see `docs/projects/RESULT_URL.md`.
> Codec in `frontend/src/lib/result-url.ts` (TDD), read-only `#r=` view + Copy Link
> button in `+page.svelte`, and share text links to the result URL. QR code remains phase 2.

**Goal:** Let a result link reconstruct a read-only view of someone's game without requiring a Firestore lookup.

**Approach:** Encode a compact result token in the URL hash.

### URL format
```
https://art-of-intent.netlify.app/#r=<base64-token>
```

### Token payload (keep small â€” fits in a tweet)
```json
{
  "d": "2026-03-09",       // date (determines which daily puzzle)
  "a": 12,                  // attempts
  "t": 11419,               // total tokens
  "m": 3,                   // matches out of 3
  "s": 1261,                // score
  "w": [1, 0, 1]            // which target words were found (bit array)
}
```
Encode with `btoa(JSON.stringify(payload))` â†’ ~80 chars. Stays under URL limits easily.

### Read-only result view
- When the page loads and detects `#r=`, decode the token and show a static result card (no game UI).
- Shows: date, score breakdown, which words were found/missed, "Play today's puzzle" CTA.
- No Firestore read needed â€” everything is in the URL.

### Where the link appears
1. End-game modal â€” "Copy Result Link" button alongside existing share buttons.
2. Share card image â€” encode the URL as a QR code in the bottom-right corner (optional / phase 2).

**Files to change:**
- `frontend/src/routes/+page.svelte` â€” detect `#r=` hash on load, show result view; add "Copy Link" button to game-over banner
- `frontend/src/lib/stores/game.svelte.ts` â€” `generateResultUrl()` helper

---

## 3. Playability (backlog)

- **Streak counter** â€” âœ… BUILT on `kaaro/fable-loop` (2026-07-07), see `docs/projects/STREAK_COUNTER.md`.
- **Word hint** â€” âœ… BUILT on `kaaro/fable-loop` (2026-07-07). Category reveals after 3 attempts; needs `firebase deploy --only functions` for `targetCategories` to appear in new dailyWords docs. Decision note in `docs/areas/DAILY_WORDS_SYSTEM.md`.
- **Creep animation** â€” âœ… BUILT on `kaaro/fable-loop` (2026-07-07). Counter flashes on any rise, words section shakes when an increase lands at 75+; `prefers-reduced-motion` disables both. Thresholds live in `frontend/src/lib/creep.ts`.
- **Practice mode** — ✅ SHIPPED. Archive-date replay via `?practice=1`; server validates past `YYYY-MM-DD` (`isValidArchiveDate`); no sessions/streak/leaderboard. See `docs/projects/PRACTICE_MODE.md`.

---

## 4. Next Five (audit / training log / you-vs-arty / evocability / docs) — ✅ BUILT on `kaaro/grok-goes-burr` (2026-07-19)

> **Status:** Pipeline closed — see `docs/projects/NEXT_FIVE.md` and crystallization
> `docs/crystallized/NEXT_FIVE_SPRINT.md`.
>
> 1. **auditSession** — pure recompute from `attemptsData` + nightly `auditDailySessions` (00:30 UTC). Sweep-not-trigger decision.
> 2. **Training Log** — post-game `ARTY LEARNS` tab from `dailyWords.aiEvaluation`; difficulty badges on target chips.
> 3. **You vs Arty** — share text + share card footer line when evaluation exists.
> 4. **Evocability probes** — 3 extra midnight calls; `evocabilityScore` next to embeddability; budget 7 → 10.
> 5. **Doc refresh** — this file + AI_EVALUATION area + crystallization.

**Deploy gate:** `firebase deploy --only functions` required for audit + evocability (frontend-only pieces ship with hosting).

---

