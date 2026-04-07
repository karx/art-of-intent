# Vision — Art of Intent

## What It Is

Art of Intent is a daily browser-based word puzzle. Players write prompts to guide "Arty" (a haiku bot powered by a large language model) to include 3 target words in its responses — without using blacklisted words. Score is based on token efficiency and attempt count. New words generate daily via Cloud Scheduler.

The game is simple to start, deep to master. It is about the craft of language: choosing words precisely, thinking indirectly, saying more with less.

---

## Where It's Going

### 1. Multi-Platform

The same game, everywhere. A single SvelteKit codebase compiles to:

- **Web** — deployed to Netlify, fast, no install
- **iOS** — App Store, native feel via Capacitor
- **Android** — Play Store, same codebase

### 2. Bring Your Own Model (BYOM)

Players are no longer locked to one AI. They can route their prompts through their own API key — OpenAI, Anthropic, Gemini, or any OpenAI-compatible local model (Ollama, LM Studio). The in-house AI Gateway handles provider routing and response normalisation server-side. API keys are encrypted at rest and never exposed to the browser.

This turns the game into a model benchmarking tool. The same puzzle, played across different models, reveals how each one thinks.

### 3. Competitive & Social

- Daily leaderboard by token efficiency
- Shareable score cards (already shipped)
- Streak counters (upcoming)
- Result URLs — encode score in a hash for read-only shareable links (upcoming)

### 4. Agent-Friendly Codebase

The old stack (35 vanilla JS files, load-order-dependent script tags, no bundler) made AI-assisted development unreliable. The new stack — SvelteKit, TypeScript, Vitest, Svelte 5 runes — is designed to be reasoned about by both humans and agents. One file = one responsibility. Tests live next to code. Types catch mistakes before runtime.

---

## Design Principles

- **Token efficiency is the score.** Say exactly what you need. Every word costs.
- **Indirect > direct.** You can't name the target. You must evoke it.
- **Server-side truth.** Daily words, system prompts, and API keys live on the server. The client cannot tamper with them.
- **Simple, direct, maintainable.** No abstractions invented for one use. No speculative features. No backwards-compatibility shims.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 2 + Svelte 5 (TypeScript, Vite) |
| AI Gateway | Firebase Cloud Functions (multi-provider) |
| Mobile | Capacitor (iOS + Android) |
| Database | Firestore (`alpha` db) |
| Auth | Firebase Auth (anonymous + Google) |
| Hosting | Netlify |
| CI/CD | GitHub Actions |
| Tests | Vitest (frontend) + Node test runner (functions) |
