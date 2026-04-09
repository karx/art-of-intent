# Data Model — Art of Intent

How data flows from player interactions into Firestore, and how it is read back.

---

## Collections

### `dailyWords/{YYYY-MM-DD}`

**Written by:** `generateDailyWords` Cloud Function — scheduled daily at 00:00 UTC.

| Field | Type | Description |
|---|---|---|
| `date` | string | YYYY-MM-DD key |
| `seed` | number | Deterministic RNG seed for word selection |
| `targetWords` | string[] | 3 words the player must get Arty to say |
| `blacklistWords` | string[] | 5–7 words the player must avoid |
| `dictionaryHaikus` | object | 10 haikus per target word, generated after word selection |
| `aiEvaluation` | object | Zero-shot + one-shot difficulty probes |
| `createdAt` | timestamp | |
| `version` | string | |

**Read by:**
- `+page.svelte` `loadDailyWords()` — fetches `targetWords` and `blacklistWords` at game start
- `leaderboard/+page.svelte` `fetchTargetWords()` — shows which words were in play for a date
- `insights/+page.svelte` — per-day breakdown table shows target words alongside win rate

---

### `sessions/{sessionId}`

**Written by:** `saveSessionToFirestore()` in `+page.svelte`.

**When it fires — three game-over paths:**

| Trigger | `result` | `cheated` |
|---|---|---|
| All 3 words matched via API | `victory` | `false` |
| Max attempts reached or creep maxed | `defeat` | `false` |
| All 3 words matched via cheat code | `victory` | `true` |

Partial / in-progress games are **not** saved. Only authenticated users are saved (anonymous users included — Firebase Auth treats them as authenticated).

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `sessionId` | string | UUID generated at game start |
| `userId` | string | Firebase Auth UID |
| `displayName` | string | From Auth profile |
| `userName` | string | Alias of displayName |
| `gameDate` | string | YYYY-MM-DD |
| `date` | string | Alias of gameDate |
| `targetWords` | string[] | |
| `blacklistWords` | string[] | |
| `status` | string | Always `'completed'` on save |
| `result` | string | `'victory'` or `'defeat'` |
| `isWin` | boolean | |
| `cheated` | boolean | `true` if any cheat code was used |
| `attempts` | number | Total attempt count |
| `totalTokens` | number | Sum of all prompt + output tokens |
| `creepLevel` | number | Creep meter value at game end |
| `matchedWords` | string[] | |
| `matchedWordsCount` | number | |
| `efficiencyScore` | number \| null | `attempts × 10 + floor(totalTokens / 10)`. `null` for defeats and cheat sessions |
| `attemptsData` | object[] | One entry per trail item (see below) |
| `isPublic` | boolean | Always `true` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**`attemptsData` entries:**

| Field | Type | Notes |
|---|---|---|
| `attemptNumber` | number | 1-based |
| `timestamp` | string | Local time string |
| `prompt` | string | Player's prompt (capped at 500 chars) |
| `response` | string | Arty's haiku (capped at 500 chars) |
| `promptTokens` | number | |
| `outputTokens` | number | |
| `totalTokens` | number | promptTokens + outputTokens |
| `foundWords` | string[] | Target words matched in this response |
| `isViolation` | boolean | Player's prompt contained a restricted word |
| `isCheat` | boolean | Entry was a cheat code activation |

**Read by:**

| Consumer | Query | Fields used |
|---|---|---|
| `leaderboard/+page.svelte` | `result == 'victory'`, `gameDate == date`, order by `efficiencyScore` asc, limit 25 | `displayName`, `attempts`, `totalTokens`, `efficiencyScore`, `cheated` |
| `insights/+page.svelte` | `gameDate >= start AND gameDate <= end`, limit 1000 | Nearly all fields — see panels below |

**Insights panels and what they consume:**

| Panel | Session fields | `attemptsData` fields |
|---|---|---|
| Snapshot | `isWin`, `efficiencyScore`, `attempts`, `totalTokens`, `gameDate`, `targetWords` | — |
| Words | `targetWords`, `gameDate` | `foundWords`, `totalTokens` per attempt |
| Prompts | `isWin`, `attemptsData` | `prompt` (length), `totalTokens`, `foundWords` |
| Violations | `isWin`, `creepLevel` | `isViolation` |
| Attempts | `isWin`, `attempts` | — |
| Efficiency | `isWin`, `efficiencyScore` | — |
| Session browser | `sessionId`, `userId`, `displayName`, `gameDate`, `result` | `prompt`, `response`, `promptTokens`, `outputTokens`, `foundWords`, `isViolation` |

---

### `userSettings/{userId}`

**Written by:** `saveUserSettings` Cloud Function (callable) — triggered when the player saves BYOM (Bring Your Own Model) settings in the UI.

**Fields:** encrypted API key, provider (`gemini` | `openai` | `anthropic` | `custom`), endpoint URL, model name.

**Read by:** `artyGenerateHaiku` Cloud Function — reads the user's settings to decide which AI provider and key to use for the haiku call.

**Access:** owner-only read/write (Firestore rules).

---

### `users/{userId}`

**Written by:** Old JS frontend only (`firebase-auth.js`) — **not ported to the Svelte rewrite**.

**Fields (as designed):** `userId`, `displayName`, `stats` (wins, total games), `preferences`.

**Read by:** `insights/+page.svelte` — checks `users/{uid}` for an admin flag to gate access.

> **Gap:** The Svelte rewrite never writes to this collection. The admin check works as long as the admin document was previously created by the old frontend. New admin accounts would need the document created manually.

---

### `leaderboard/` and `leaderboards/`

**Written by:** Unknown — rules permit authenticated writes to `leaderboard/` and Cloud Function writes to `leaderboards/`, but nothing in the current Svelte frontend writes to either.

**Read by:** Nothing in the current frontend.

> **Status:** Likely legacy / unused. Safe to leave in place; rules prevent player abuse.

---

### `sessionEvents/{sessionId}`

**Written by:** Old JS frontend — **not ported to the Svelte rewrite**.

**Fields (as designed):** per-interaction event log — voice input, exports, API errors, theme changes.

**Read by:** Nothing in the current frontend.

> **Status:** Not ported. The granular event log is gone in the Svelte rewrite.

---

### `dailyChallenges/{date}`

**Written by:** Cloud Functions only (rules block user writes).

**Read by:** Nothing visible in the current frontend.

> **Status:** Unclear — possibly an earlier design that predates the current `dailyWords` collection.

---

## Firestore Indexes

All indexes are on the `sessions` collection:

| Fields | Purpose |
|---|---|
| `userId` asc + `createdAt` desc | User's own session history |
| `userId` asc + `gameDate` desc | User's sessions by date |
| `gameDate` asc + `efficiencyScore` asc | (legacy) date-ranked scores |
| `result` asc + `gameDate` asc + `efficiencyScore` asc | **Leaderboard query** |
| `result` asc + `gameDate` desc | Fall-back: most recent date with victories |
| `gameDate` asc + `status` asc + `result` asc + `efficiencyScore` asc | (legacy) |
| `isPublic` asc + `gameDate` asc + `efficiencyScore` asc | (legacy) |

---

## Gaps & Known Issues

| # | Issue | Impact |
|---|---|---|
| 1 | `users/` never written in Svelte rewrite | Admin check in Insights relies on a pre-existing Firestore document from the old frontend |
| 2 | In-progress sessions not saved | A player who closes mid-game leaves no trace; no funnel/drop-off data |
| 3 | `sessionEvents` not ported | Granular event log (voice, exports, errors) no longer collected |
| 4 | Cheated victories have `efficiencyScore: null` | Firestore returns null-valued docs first in `orderBy efficiencyScore asc`, so cheaters appear before ranked players in the raw query. The leaderboard splits client-side after fetching 25, which works until cheater count approaches the limit |
| 5 | `leaderboard/` and `leaderboards/` collections are orphaned | Dead schema in Firestore rules — creates noise but no harm |
| 6 | Anonymous player sessions are saved | They are indistinguishable from signed-in players except by `userId` pattern; no `displayName` from Auth means they show as the email fallback or 'Anonymous' |
