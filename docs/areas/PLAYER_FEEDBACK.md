---
published: false
title: "Player & Contributor Feedback"
tags: [feedback, ux, player-experience, backlog]
description: "Raw player and contributor feedback collected during early playtesting. Organized by theme: UX/visual, onboarding, gameplay, and technical. Seeds for future-work items."
date: 2026-05-17
layer: L1-Instance
maturity: SEED
para: Area
---

# Player & Contributor Feedback

Collected feedback from real play sessions and contributor notes. Items here are raw seeds — not yet triaged into `future-work.md`. Before acting on any item, check if it has already been addressed in the current SvelteKit stack.

---

## UX / Visual

- **Theme darkness** — The default dark theme is too black. A Solarized CRT feel would be better (warmer, more period-accurate terminal aesthetic). *(See: [[docs/areas/THEME_SYSTEM_DESIGN.md]])*
- **Mobile text size** — Mobile UI text size can be bumped up slightly. Not a big change, but improves legibility on small screens.
- **Trail chronology** — The conversation trail should have the latest response at the bottom (natural reading order), not at the top.

---

## Onboarding

- **Getting Started splash** — An initial splash screen explaining how to play and what the game is. Shows only once per user (localStorage flag). Also accessible via a `?` help button.
- **Guest custom names** — Guest (anonymous) users should be able to set a display name. Currently they get an auto-generated identifier with no way to personalize it.

---

## Feature Ideas

- **In-trial loading animation** — When waiting for Arty's response, instead of static contemplating text, show a rotating list of fun/quirky remarks. Arty "contemplating" should feel alive. Maintain the remark pool in a separate JSON file so it can be improved without touching logic.

  Example remarks:
  ```
  "Arty is thinking deeply…"
  "Counting syllables…"
  "Consulting the haiku spirits…"
  "Finding the right word…"
  "Almost there…"
  ```

- **OG / Leaderboard image** — Social thumbnail should show top 2 players only (no explicit #1 section). Keep it minimal — not too text-heavy. Follow social media thumbnail design guidelines.

---

## Technical Notes (Dev)

- **Security signal styling** — `generateSecuritySignal(item.security)` was incorrectly placed inside `<div class="trail-prompt">`. It should be separated out and styled independently. *(May be resolved in SvelteKit rewrite — verify before acting.)*
- **Theme + style.css conflict** — When styling is theme-driven via CSS variables, changes to a raw `style.css` file don't reflect. All style overrides must go through the theme variable layer. *(Likely resolved — document here as a gotcha for future contributors.)*

---

## Reference: Real Session Trail — 2025-10-25

A real play session showing the game working well. Words: **wave**, **sorrow**, **night**. 12 attempts, score 1261.

Notable prompt that found `night`:
> *"deep after sunset / when batman is there"*
> → *"Shadows start to creep, / Guarding city, dark knight waits, / Justice will arrive."* ✓

This is a good example of the indirect prompting mechanic working as intended — the player evoked a concept, not the word.

<details>
<summary>Full trail (expand)</summary>

```
╔═══════════════════════════════════╗
║   ART OF INTENT - 25/10/2025      ║
╠═══════════════════════════════════╣
║ STATUS:    WIN                    ║
║ ATTEMPTS:  12                     ║
║ MATCHES:   3/3                    ║
║ TOKENS:    11419                  ║
║ EFFICIENCY: 951.6 tok/att         ║
║ SCORE:     1261                   ║
╚═══════════════════════════════════╝

#1  > Think of the word 'Rave'. Now, just change the first letter
    < Wave upon the shore, / Constant motion, never stilled, / Ocean's deep exhale.
    ✓ wave

#2  > Think of the word 'borrow'. Now, just change the first letter
    < Sorrow's heavy cloak, / Worn when kindred spirits part, / Tears obscure the path.
    ✓ sorrow

#3–6  > Think of the word 'borrow'. Now, just change the first letter from a 'B' to an 'S'
       (4 failed attempts — Arty kept responding with "pigs" and "grief" imagery)

#7  > hard and sad, i gloat alone
    < A lonely stone sits, / Bearing burdens, cold to touch, / Pride a heavy cloak.

#8  > In the oceans and seas, with tides
    < Water's vast embrace, / Mysteries in the deep blue, / Life in constant flow.

#9  > in the sea, with tides and currents, affects the beach
    < Ocean's deep embrace, / Shapes the sands of golden shore, / Nature's grand design.

#10 > in the ocean with tides it moves
    < Vast water's embrace, / Currents pull, the sea does shift, / Life's rhythm abides.

#11 > in the ocean with tides
    < Vast, the water breathes, / Pulling, pushing, to and fro, / Ocean's endless heart.

#12 > deep after sunset / when batman is there
    < Shadows start to creep, / Guarding city, dark knight waits, / Justice will arrive.
    ✓ night
```

</details>
