# Release Notes: v2.0.0-alpha — The Intelligence Update

**Release Date:** 2026-03-22
**Branch:** `claude/add-haiku-dictionary-bR7ZI`

---

## Overview

v2.0.0 marks a major evolution of Art of Intent. This release adds AI-powered learning tools that turn the game into an educational experience about in-context learning — while also giving players new tools to improve their prompting skills.

Three major systems ship together:

1. **Haiku Dictionary** — per-word inspiration before you play
2. **AI Benchmark** — see how an AI performed the same puzzle post-game
3. **Training Log** — a post-game deep dive into AI learning mechanics
4. **Admin Console** — internal tooling for word management

---

## New Features

### Haiku Dictionary
Each target word now has a `[?]` button in the word list. Clicking it opens a modal showing 3 sample haikus that use the word — giving players inspiration without giving away solutions.

- Generated at word-creation time via `generateDictionaryHaikus` in the Cloud Function
- 10 haikus generated per word; top 3 shown in the modal
- Modal is non-spoiler: it shows *how* the word appears in haiku, not how to prompt for it
- Haikus include stats: tokens, syllable structure

### AI Benchmark (Post-Game)
After the game ends, the game-over modal gains a collapsible **Compare with AI** section. It shows how the AI attempted the same puzzle, including:

- Each prompt the AI tried
- The haiku response it received
- Which target words it matched per round

The AI runs up to 5 rounds and adapts based on which words are still unmatched — demonstrating in-context learning in real time.

### Training Log
A new **TRAINING LOG** tab appears in the response trail (alongside the existing TRAIL tab) after the game ends. It reframes the AI evaluation as an educational experience:

- Shows zero-shot and one-shot probe results per word
- Derives a **word difficulty score** from AI embeddability
- Illustrates how structured feedback improves AI performance across rounds
- Framed as "the AI tried the same puzzle — here's what it learned"

### Admin Console (`admin.html`)
A new internal admin page for managing daily words and Firestore documents:

- View and edit today's target words and blacklist
- Force-regenerate words for any date
- Preview dictionary haikus and AI evaluation data
- Protected by Firebase Auth (admin accounts only)

---

## Cloud Function Changes

- `generateDailyWords` now runs dictionary generation and AI evaluation **concurrently** via `Promise.all`, keeping total latency low
- Added `callGemini` shared helper to reduce duplication
- Added `runPerWordEvaluation` — runs zero-shot + one-shot probes per target word
- Added `runFullGameSimulation` — AI plays up to 5 rounds of the full puzzle
- Added `runAIEvaluation` — orchestrates both evaluations and stores results to Firestore
- Function timeout bumped to 120s to accommodate concurrent evaluation jobs
- AI evaluation returns `embeddability` count (not raw word count) for difficulty scoring

---

## UI Changes

- Response trail now has tabbed navigation: **TRAIL** / **TRAINING LOG**
- Dictionary modal styled with `.dict-haiku`, `.dict-stats`, `.dict-word` classes
- Training log styled with `.ai-benchmark-toggle`, `.ai-benchmark-content`, `.ai-attempt-block`
- Post-game modal extended with collapsible AI comparison section
- Version badge in header now dynamically reads from `window.APP_VERSION` (no longer hardcoded)

---

## Bug Fixes

- Version badge in the top header was hardcoded to `v1.0.0` — now reads from `APP_VERSION.display` via `id="appVersion"`

---

## Version History

| Version | Codename | Key Feature |
|---------|----------|-------------|
| v2.0.0-alpha | The Intelligence Update | AI evaluation, Training Log, Haiku Dictionary |
| v1.2.0-alpha | The Black Update | Creep/Darkness system |
| v1.1.0-alpha | — | Side navigation |
| v1.0.0-alpha | — | Initial release |
