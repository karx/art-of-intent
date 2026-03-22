# AI Evaluation — Design & Methodology

> Status: v2 design (replacing original full-game-simulation approach)
> Scope: Cloud Function logic + Training Log UI

---

## Purpose

After generating daily words, Art of Intent runs a background AI evaluation session against
the same words every player will face. The results power the post-game **Training Log** — a
playful, educational view that shows players how in-context learning works using their own
game as the demonstration.

The evaluation is not a leaderboard. It is a teaching tool.

---

## Educational Frame

The core concept being illustrated:

> *A language model can improve its performance on a novel task through structured feedback,
> without any weight updates — demonstrating in-context learning (the mechanism underlying
> few-shot prompting and a key component of RLHF).*

In plain terms for the UI: "The AI tried the same puzzle you just played. Here's what it
learned — and how fast."

---

## Hypothesis

**H1 — In-context improvement:**
An LLM given structured feedback from a failed attempt (which target words appeared, which
did not) will match more target words on its second attempt compared to its first, across
a statistically meaningful range of word combinations.

**H2 — Word difficulty is real:**
Some target words are intrinsically harder to evoke indirectly than others. Difficulty is
measurable and consistent — not random noise.

**H3 — Small models still show learning signal:**
`gemini-flash-lite` (the current model) is a small, fast model. Even at this scale, the
improvement delta between zero-shot and one-shot attempts should be detectable.
Scale comparison (flash-lite vs. pro) is a future extension.

---

## What We Measure

### 1. Zero-shot probe

The model receives the game task with no examples and no prior context. It generates one
prompt and we evaluate it against the real game system instruction (same one players face).

**Captures:** baseline model capability, first-try intuition.

### 2. One-shot probe (with feedback)

The model receives the zero-shot result — which words appeared, which did not — and is
asked to generate an improved prompt. We evaluate this second attempt against the same
system.

**Captures:** in-context learning signal. The delta between zero-shot and one-shot word
coverage IS the measurable reward signal.

### 3. Word difficulty (derived — no extra API calls)

Derived from the dictionary haikus already generated at midnight. Specifically: the
**syllabic embeddability score** — how naturally each word integrates into the 5-7-5
haiku form when explicitly required.

> **Important:** this is NOT a measure of player difficulty or evocability. The dictionary
> haiku prompt uses `Each haiku MUST contain the word "${word}"` — an explicit constraint.
> This produces near-uniform scores (9-10/10) across most words and does not discriminate
> between easy and hard words for players.

**True difficulty signal** comes from the evaluation probes:
- Word matched zero-shot → LOW difficulty
- Word matched only after feedback → MEDIUM difficulty
- Word not matched in either attempt → HIGH difficulty

This classification is recorded per word in `wordDifficulty`.

---

## Data Schema

```js
aiEvaluation: {
  model: 'gemini-3.1-flash-lite-preview',   // model used — enables future comparisons
  generatedAt: Timestamp,

  wordDifficulty: {
    // One entry per target word. Derived from probe results, not dictionary haikus.
    'mountain': {
      difficulty: 'low',          // 'low' | 'medium' | 'high'
      matchedZeroShot: true,
      matchedOneShot: true,
      embeddabilityScore: 1.0,    // wordCount/10 from dictionary haikus — haiku form signal only
    },
    'sorrow': {
      difficulty: 'medium',
      matchedZeroShot: false,
      matchedOneShot: true,
      embeddabilityScore: 0.7,
    },
    'copper': {
      difficulty: 'high',
      matchedZeroShot: false,
      matchedOneShot: false,
      embeddabilityScore: 0.8,
    },
  },

  zeroShot: {
    prompt: '...',                 // the prompt the AI generated
    response: '...',               // Arty's haiku
    wordsMatched: ['mountain'],    // target words that appeared
    blacklistHit: false,           // did the prompt use a blacklist word
    tokensUsed: 124,
  },

  oneShot: {
    // feedback given to model: zeroShot.wordsMatched + which words still missing
    prompt: '...',
    response: '...',
    wordsMatched: ['mountain', 'sorrow'],
    blacklistHit: false,
    tokensUsed: 138,
    deltaWordsMatched: 1,          // improvement over zero-shot — the learning signal
  },

  summary: {
    zeroShotScore: 1,              // words matched on first attempt (0-3)
    oneShotScore: 2,               // words matched after feedback (0-3, cumulative)
    improvementDelta: 1,           // oneShotScore - zeroShotScore
    totalTokens: 262,
    converged: false,              // true if all 3 words matched across both attempts
    hardestWord: 'copper',         // word not matched in either attempt (if any)
  }
}
```

---

## API Call Budget

### Current (v1) — up to 19 calls at midnight

| Step | Calls |
|---|---|
| Dictionary haikus — 3 words × 1 | 3 |
| Per-word eval — 3 words × 2 (generate + evaluate) | 6 |
| Full game simulation — up to 5 rounds × 2 | up to 10 |
| **Total** | **up to 19** |

### Proposed (v2) — 7 calls at midnight

| Step | Calls | Notes |
|---|---|---|
| Dictionary haikus — 3 words × 1 | 3 | unchanged — UI value |
| Zero-shot probe — generate + evaluate | 2 | single combined prompt for all 3 words |
| One-shot probe — generate + evaluate | 2 | with feedback from zero-shot result |
| Word difficulty | 0 | derived from probe results |
| **Total** | **7** | 63% reduction |

---

## What the Current Dictionary Haiku Prompt Does and Does Not Capture

**Current prompt:**
```
You are a haiku poet. Your task is to write exactly 10 different haikus.
Each haiku MUST contain the word "${word}".
Each haiku must follow the strict 5-7-5 syllable pattern.
```

**What it captures (useful):**
- Example haikus for the UI dictionary feature — this is its primary purpose
- Haiku-embeddability: how naturally a word integrates into 5-7-5 form
- `wordCount/10` = embeddability score (keep as a secondary signal, label it correctly)

**What it does NOT capture (important):**
- Player difficulty — evoking a word *indirectly* is fundamentally different from
  being instructed to use it explicitly
- Evocability — how easily a concept comes to mind when describing adjacent ideas
- Spread — because the constraint is explicit, nearly all words score 9-10/10,
  giving almost no discriminating signal between words

**Correct labelling:** rename `wordCount` to `embeddabilityCount` in Firestore to prevent
misinterpretation as a difficulty metric.

**Future option (if evocability signal is needed):**
A separate "indirect" prompt batch — "write haikus about [word's category] without using
the word" — would give a true evocability score. This adds 3 more API calls. Defer until
there is a clear UI use case.

---

## Prompt Engineering Notes

### Zero-shot system instruction
The model is told: it is playing a word puzzle, the goal is to get a haiku bot to include
all 3 target words in one response, it must not use blacklist words. No examples given.

### One-shot feedback structure
After zero-shot, the model receives:
```
Attempt 1 result:
- Your prompt: "..."
- Arty responded: "..."
- Words matched: [mountain]
- Words still needed: [sorrow, copper]

Now write an improved prompt.
```

This mirrors the feedback structure players see in their own trail — making the educational
parallel explicit in the UI.

### Why not more than 2 probes?
- Statistical reliability: a single run of 2 probes is a demonstration, not a study.
  Running 10+ pairs would give reliable data but at 40+ API calls/day, not viable.
- The educational narrative only needs 2 points to show a delta.
- Diminishing returns: the in-context learning signal is clearest on the first feedback
  loop. Subsequent rounds conflate strategy with luck.

---

## UI — Training Log (Post-Game Tab)

Displayed after game completion in a dedicated "TRAINING LOG" tab alongside the response
trail. Not shown during active gameplay.

### Structure

```
ARTY LEARNS // 2026-03-22
──────────────────────────────────────
HUMAN   3 attempts · 847 tokens
AI      2 probes   · 262 tokens · partial

STEP 1 — ZERO SHOT ───────────────────
No hints. First instinct.

  > INPUT  "..."
  < ARTY   [haiku in trail-item style]
  ◈ REWARD  +mountain   (1 of 3)

STEP 2 — ONE SHOT ────────────────────
Given feedback. One chance to adapt.

  > INPUT  "..."
  < ARTY   [haiku in trail-item style]
  ◈ REWARD  +sorrow   (2 of 3)

──────────────────────────────────────
LEARNING SIGNAL  +1 word after feedback
HARDEST WORD     copper — neither attempt

WHAT HAPPENED? ───────────────────────
The AI saw which words appeared and
rewrote its prompt. That feedback loop —
generate → evaluate → adjust — is the
core mechanism behind RLHF and
in-context learning. No weights changed.
The model just... adapted.
```

### Word difficulty badges
Each target word chip in the game header gains a difficulty badge post-game:
`[LOW]` `[MEDIUM]` `[HIGH]` — sourced from `wordDifficulty` in `aiEvaluation`.

---

## How Compute/Scale Affects This

The current model (`gemini-flash-lite`) is intentionally small and fast. This is relevant:

- **Small models** show measurable in-context learning even with minimal context
- The improvement delta tends to be larger for semantically distant words (harder words
  benefit more from feedback, showing the model actually uses the signal)
- **Future extension:** run the same zero-shot/one-shot pair with a larger model
  (flash or pro) and compare improvement delta — directly demonstrating that scale
  improves zero-shot capability but the learning signal exists at all scales

The admin page (`/admin.html`) is the right place to surface model comparison data
before exposing it to players.

---

## Future Work

- [ ] Evocability prompt batch (3 extra calls) for true word difficulty signal
- [ ] Model comparison: flash-lite vs. pro on same daily words (via admin trigger)
- [ ] Aggregate difficulty across days: which word categories are hardest
- [ ] Player vs. AI efficiency chart over time (requires session data accumulation)
- [ ] Multi-run averaging: run 3 zero-shot probes, use median — more reliable signal
