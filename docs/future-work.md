# Future Work

Items documented here are scoped, ready to implement, and ordered by priority.

---

## 1. Share Card Copy Improvements

**Goal:** Make the end-game share image compelling enough that non-players want to click through.

**Current state:** The share card shows score, attempts, tokens, and a "Play at: …" link. It reads like a stats dump — no emotional hook for someone seeing it cold.

**What to change:**

### Include the winning haiku(s)
- Surface the haiku(s) that matched a target word in the card.
- Format as styled blockquote text — the haiku itself is the hook. It's poetic, brief, and surprising.
- Example layout:
  ```
  ┌─────────────────────────────────┐
  │  ART OF INTENT  •  2026-03-09   │
  │                                 │
  │  "Shadows start to creep,       │
  │   Guarding city, dark knight    │
  │   Justice will arrive."         │
  │                         ✓ night │
  │                                 │
  │  3/3 words  •  12 attempts      │
  │  Score: 1261                    │
  └─────────────────────────────────┘
  ```

### Show target words matched vs total
- Replace the raw token count with `★ 3/3 words found` — more scannable for non-players.
- Token count can stay as a secondary stat for the community.

### Add a "Can you do better?" CTA
- Replace the plain URL with: `Can you beat this? → art-of-intent.netlify.app`
- This reframes the share as a challenge, not a brag.

**Files to change:**
- `src/js/share-card-v4.js` / `src/js/share-card-generator.js` — card layout and text
- `src/js/game.js` — pass winning haiku(s) into share payload (already available in `gameState.responseTrail`)

---

## 2. Result URL / Shareable Link

**Goal:** Let a result link reconstruct a read-only view of someone's game without requiring a Firestore lookup.

**Approach:** Encode a compact result token in the URL hash.

### URL format
```
https://art-of-intent.netlify.app/#r=<base64-token>
```

### Token payload (keep small — fits in a tweet)
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
Encode with `btoa(JSON.stringify(payload))` → ~80 chars. Stays under URL limits easily.

### Read-only result view
- When the page loads and detects `#r=`, decode the token and show a static result card (no game UI).
- Shows: date, score breakdown, which words were found/missed, "Play today's puzzle" CTA.
- No Firestore read needed — everything is in the URL.

### Where the link appears
1. End-game modal — "Copy Result Link" button alongside existing share buttons.
2. Share card image — encode the URL as a QR code in the bottom-right corner (optional / phase 2).

**Files to change:**
- `index.html` — detect `#r=` hash on load, show result view
- `src/js/game.js` — `generateResultUrl()` helper, add "Copy Link" button to modal
- `src/css/styles.css` — result view styles (reuse modal-content)

---

## 3. Playability (backlog)

- **Streak counter** — `Day 3 🔥` in top bar. Strong daily retention.
- **Word hint** — show category (e.g. `[nature]`) after 3 failed attempts on a word.
- **Creep animation** — flash counter red on increase; shake game area at 75+.
- **Practice mode** — random words, no leaderboard, unlimited attempts.
- **Web Share API** — `navigator.share()` for native mobile share sheet.

---

## 4. Known Issues (low priority)

- `next.md` at repo root is a scratch file with mixed content — should be cleaned up or moved to `docs/`.
- `aboutV2.html` is untracked and possibly stale — verify and either commit or delete.
- The `version-badge` in `index.html` is hardcoded to `v1.0.0` but `package.json` says `1.1.0-alpha`.
