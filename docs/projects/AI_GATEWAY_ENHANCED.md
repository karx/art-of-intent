# Project: Enhanced AI Gateway

**Branch:** `kaaro/feat/gateway-enhanced` (planned)  
**Status:** Planning  
**Depends on:** Phase 1 of MULTI_PLATFORM.md (AI Gateway ✓)  
**Tests:** `functions/test/gateway.test.js` (extend existing suite)

---

## Motivation

The current gateway (`functions/gateway/`) is a clean provider dispatcher: it routes a
request to one of four adapters and returns a normalised `{ text, inputTokens,
outputTokens, finishReason }`. That covers the happy path.

**Cloudflare AI Gateway** — a production proxy for AI providers — exposes the gaps:
it layers caching, retry/fallback, per-request observability, rate limiting, and cost
tracking on top of exactly this kind of dispatch layer. None of those cross-cutting
concerns belong in individual adapters; they belong in the gateway itself.

Art of Intent needs a subset of those features for three concrete reasons:

1. **Player experience** — transient 429s and 5xx errors from providers end a run with
   a confusing message. Auto-retry with backoff should be invisible to the player.
2. **Cost control** — BYOM users run their own keys. Without rate limiting or cost
   visibility, one session could drain a budget accidentally.
3. **Observability** — token usage, latency, and provider errors are currently invisible
   once a request leaves the Cloud Function. Logging enables the analytics strategy
   in `docs/areas/ANALYTICS_STRATEGY.md`.

---

## Feature Plan (Phases)

### Phase 6a — Retry with Exponential Backoff

**Files:** `functions/gateway/retry.js`, `functions/gateway/index.js`  
**Tests:** `functions/test/gateway.test.js` (new `RetryBehavior` suite)

Wrap `routeToProvider` in a retry loop before the error reaches the Cloud Function.

**Retry matrix:**

| HTTP Status | Retry? | Reason |
|---|---|---|
| 429 | Yes | Rate-limited — provider is temporarily full |
| 500 / 503 | Yes | Transient server error |
| 400 | No | Bad request — retrying won't help |
| 401 / 403 | No | Key is wrong/revoked — retrying won't help |
| Any other 4xx | No | Client fault |

**Behaviour:**
- Max 3 attempts (1 original + 2 retries).
- Backoff: `200ms → 400ms` (fixed jitter-free for deterministic testing).
- If the provider returns `Retry-After` on a 429, honour it (cap at 5 s).
- After exhausting attempts, re-throw the last error unchanged — callers see the
  same error shape as today.

**API change:** `routeToProvider` signature is **unchanged**. Retry is opt-in via a
`retryOptions` field on `config`:
```js
// config.retryOptions: { maxAttempts?: number, backoffMs?: number }
// Defaults: { maxAttempts: 3, backoffMs: 200 }
```

---

### Phase 6b — Gateway Logging

**Files:** `functions/gateway/logger.js`, `functions/gateway/index.js`  
**Firestore:** `gateway_logs/{autoId}` (no new rules needed — server-side write only)

After every `routeToProvider` call (success or failure), write a log document
non-blocking (`void db.collection(...).add(...)`):

```js
{
  ts:            Timestamp,    // server time
  provider:      string,       // 'gemini' | 'openai' | 'anthropic' | 'custom'
  model:         string,       // model identifier from config
  inputTokens:   number,
  outputTokens:  number,
  latencyMs:     number,       // wall-clock time of the provider call
  finishReason:  string,
  cacheHit:      boolean,      // Phase 6c
  retryCount:    number,       // Phase 6a
  error:         string|null,  // error.message if call ultimately failed
  userId:        string|null,  // uid (anonymised — no PII beyond uid)
  sessionId:     string|null,  // from request context
  date:          string        // 'YYYY-MM-DD' for easy range queries
}
```

The write is **fire-and-forget** — a logging failure must never surface to the player.

**Firestore index to add:** `gateway_logs` — compound on `(date ASC, provider ASC)`.

---

### Phase 6c — Exact-Match Response Cache

**Files:** `functions/gateway/cache.js`, `functions/gateway/index.js`  
**Firestore:** `gateway_cache/{hash}`  
**Tests:** `functions/test/gateway.test.js` (new `CacheBehavior` suite)

Cache AI responses to reduce provider API spend on repeated prompts. This is
especially effective for Art of Intent because the system prompt is deterministic
(same daily words → same system prompt every call) and many players will write
similar short prompts.

**Cache key:** `sha256(provider + model + systemPrompt + userPrompt)` — hex string,
truncated to 40 chars for the document ID.

**Cache document:**
```js
{
  text:         string,
  inputTokens:  number,
  outputTokens: number,
  finishReason: string,
  cachedAt:     Timestamp,
  expiresAt:    Timestamp    // cachedAt + 24h (tied to daily word rotation)
}
```

**Flow:**
1. Compute hash before calling the provider.
2. Check `gateway_cache/{hash}` — if exists and `expiresAt > now`, return cached
   result with `cacheHit: true`.
3. On cache miss, call provider, write result to cache (non-blocking), return
   result with `cacheHit: false`.
4. Expired documents are left to expire naturally; a Cloud Scheduler sweep can
   clean them up later (out of scope here).

**Important:** The cache is **opt-out** per call. Pass `config.noCache = true` to
bypass (used by the daily word generator to ensure fresh responses).

---

### Phase 6d — Per-User Rate Limiting

**Files:** `functions/index.js` (pre-dispatch check)  
**Firestore:** `gateway_ratelimit/{uid}` (daily counter)  
**Tests:** `functions/test/gateway.test.js` (new `RateLimit` suite)

Enforce a daily request cap per user before hitting any provider. Protects against:
- Runaway automation / bots using the built-in Gemini key.
- BYOM users accidentally draining their own provider budget.

**Limits (configurable via Firestore `config/gateway` document):**

| User type | Default daily cap |
|---|---|
| Anonymous (built-in Gemini) | 30 requests/day |
| Authenticated, built-in key | 50 requests/day |
| BYOM (user's own key) | 200 requests/day |

**Counter document:** `gateway_ratelimit/{uid}/{YYYY-MM-DD}` (sub-collection by date
for automatic natural expiry without a sweep job):
```js
{ count: number, lastUpdated: Timestamp }
```

Use a Firestore transaction to atomically read-and-increment. If `count >= limit`,
throw `HttpsError('resource-exhausted', ..., { retryAfterSeconds: secondsUntilMidnightUTC })`.

The client already handles `resource-exhausted` in `callArtyAPI()` — it will show a
sensible inline message with the retry time.

---

### Phase 6e — Cost Estimation

**Files:** `functions/gateway/cost.js`  
**Tests:** `functions/test/gateway.test.js` (new `CostEstimation` suite)

Pure function — no I/O, fully unit-testable:

```js
estimateCost(provider, model, inputTokens, outputTokens)
  → { inputCostUSD, outputCostUSD, totalCostUSD }
```

**Pricing table** (per 1M tokens, as of 2026-04):

| Provider | Model | Input $/1M | Output $/1M |
|---|---|---|---|
| gemini | gemini-3.1-flash-lite-preview | $0.075 | $0.30 |
| gemini | gemini-2.0-flash | $0.10 | $0.40 |
| openai | gpt-4o-mini | $0.15 | $0.60 |
| openai | gpt-4o | $2.50 | $10.00 |
| anthropic | claude-haiku-4-5 | $0.80 | $4.00 |
| anthropic | claude-sonnet-4-6 | $3.00 | $15.00 |

Unknown models fall back to `{ inputCostUSD: null, outputCostUSD: null, totalCostUSD: null }`.

**Usage:**
- Gateway logger includes `estimateCost(...)` in every log document.
- BYOM settings page (`/settings`) shows a "today's estimated spend" figure from
  querying today's `gateway_logs` for the user's uid. This is purely informational.

---

## Architecture After All Phases

```
routeToProvider(provider, systemPrompt, userPrompt, config, fetchFn)
  │
  ├─ 1. Check cache (Phase 6c)          → cache hit: return early, log hit
  │
  ├─ 2. withRetry(callAdapter, options)  (Phase 6a)
  │       └─ callGemini / callOpenAI / callAnthropic / callCustom
  │
  ├─ 3. estimateCost(...)               (Phase 6e)  [pure, sync]
  │
  └─ 4. void logToFirestore(...)        (Phase 6b)  [fire-and-forget]
       └─ includes cacheHit, retryCount, cost, latencyMs
```

Rate limiting (Phase 6d) happens **outside** `routeToProvider`, in the Cloud Function,
before the gateway is called — it's a request-level guard, not a provider-level concern.

---

## File Plan

```
functions/gateway/
  index.js          ← updated: orchestrates retry + cache + log
  gemini.js         ← unchanged
  openai.js         ← unchanged
  anthropic.js      ← unchanged
  custom.js         ← unchanged
  retry.js          ← new: withRetry(fn, options)
  cache.js          ← new: checkCache / writeCache
  logger.js         ← new: logGatewayCall(db, payload)
  cost.js           ← new: estimateCost(provider, model, in, out)

functions/test/
  gateway.test.js   ← extended: RetryBehavior, CacheBehavior, CostEstimation suites
  ratelimit.test.js ← new: tests for the rate-limit logic extracted to a helper
```

`functions/index.js` changes:
- Add rate-limit check to `artyGenerateHaiku` (Phase 6d).
- Pass `db` and `sessionId` into an options bag for the logger (Phase 6b).
- Pass `config.noCache = false` by default (Phase 6c).

---

## What This Does NOT Include

- **Semantic caching** (embedding-based similarity) — overkill for haiku prompts; exact
  match is sufficient and has zero vector DB cost.
- **Provider fallback** ("if Anthropic fails, try Gemini") — adds complexity and
  surprising billing behaviour for BYOM users. Retries within the same provider are
  sufficient.
- **Streaming** — the game UI renders the complete haiku at once; streaming would
  require significant frontend changes for marginal UX gain.
- **Content moderation guardrails** — the server-side system prompt already constrains
  output; provider-side safety filters handle the rest.

---

## Sequencing

These phases are **independent and can ship in any order**, but the recommended sequence
optimises player impact first, then cost, then visibility:

1. **6a (Retry)** — immediate UX win, zero new infrastructure.
2. **6b (Logging)** — unlocks data for all future decisions.
3. **6d (Rate Limiting)** — protects production from abuse before wider promotion.
4. **6c (Cache)** — cost saving once logging confirms repeated-prompt patterns.
5. **6e (Cost)** — polish for BYOM settings page.
