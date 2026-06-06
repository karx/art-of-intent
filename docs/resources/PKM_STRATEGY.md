---
published: false
title: "PKM Strategy & Digital Garden — Art of Intent"
tags: [pkm, para, gardening, reference, meta]
description: "A reference document on the personal knowledge management strategy and digital garden mindset used in Art of Intent. Covers the PARA structure, maturity system, layer taxonomy, agent-era adaptations, and the gardening workflow that keeps docs alive over time."
date: 2026-05-25
layer: L3-Principle
maturity: EVERGREEN
para: SkillSurface
---

# PKM Strategy & Digital Garden — Art of Intent

> This document describes *how* knowledge is organised and maintained in this project — not just the structure, but the reasoning behind it. Read it when you want to understand why things are filed where they are, or when deciding where a new doc belongs.

---

## The Core Idea

Most project documentation is written *about code*, not *for people who will need to act later*. Notes accumulate in a flat pile: `DEPLOYMENT_STATUS.md`, `FIREBASE_IMPLEMENTATION.md`, `FINAL_UPDATES_SUMMARY.md`. Each made sense when it was written, but six months later they are an archaeological dig — you can see activity, not understanding.

The PKM strategy in Art of Intent treats documentation as a **living knowledge surface**. Rather than recording what happened, the system records what matters for the future: decisions that shaped the system, patterns worth reusing, responsibilities that must not atrophy, and closed work whose learnings should survive after the branch is deleted.

Two ideas underpin the system:

1. **PARA for the Agent Engineering Era** — a modified version of Tiago Forte's PARA method, re-tuned for a world where AI agents read and act on documentation alongside humans.
2. **Digital Garden philosophy** — documents are not changelogs. They grow, get pruned, cross-link, and change maturity over time, like plants.

---

## The PARA Structure

PARA organises knowledge by **actionability**, not by topic. The key question for each document is: *what will someone do with this?*

### `docs/projects/` — Pipelines

Bounded runs with a specific goal and a definition of done. A pipeline is opened when a feature or migration begins, updated as decisions are made, and closed when it ships. After closing, its learnings are extracted into `docs/crystallized/` and the pipeline itself is archived.

**When to write:** at the start of any meaningful feature sprint or experiment. Include: the goal, the files in scope, the success criterion.

**What not to write here:** running commentary or a log of what you did each day. Pipelines capture *intent and decisions*, not activity.

**Example:** `docs/projects/AI_GATEWAY_ENHANCED.md` opens with the motivation (player experience, cost control, observability), then specifies five independent phases in enough detail that an agent or engineer can pick up any one of them cold.

### `docs/areas/` — Maintained Responsibilities

Ongoing responsibilities with no end date but a clear quality bar. An area doc describes a system that must be kept working and understood. These are the docs you reach for when a behaviour changes unexpectedly and you want to understand *why things are the way they are*.

**When to write:** when a significant architectural decision is made. The doc should record what was decided, what was considered, and why this path — not just the outcome.

**Lifetime:** long. These docs should be updated when the system changes, not deleted.

**Staleness rule:** if an area doc becomes outdated, mark it `STALE` explicitly at the top. A stale doc without a warning is worse than no doc — it actively misleads.

**Example:** `docs/areas/FIREBASE_FUNCTIONS_ARCHITECTURE.md` describes the Cloud Function structure. When the project migrated from vanilla JS to SvelteKit, these docs weren't deleted — they were updated. Docs that described the old architecture were marked STALE.

### `docs/resources/` — Skill Surfaces

Callable knowledge. One document, one pattern. Written so that an agent or a human who has never worked on this project can follow it without asking questions.

The "Skill Surface" label is intentional: these are surfaces an agent can *grip*. A good Skill Surface is atomic (covers one thing), imperative (tells you what to do), and verifiable (you can tell when you've followed it correctly).

**When to write:** when a pattern solidifies through repeated use. Not the first time you do something — the second or third time, when you know the shape of it.

**Examples:** `DEPLOY_INSTRUCTIONS.md`, `FIRESTORE_RULES_DEPLOYMENT.md`, `XSS_TEST_INSTRUCTIONS.md`. Each is a checklist or procedure an agent can run without additional context.

`docs/resources/AGENTS.md` is a special case — it is the canonical orientation doc for AI agents entering the codebase. It lists key files, critical patterns, and hard-won do-nots that aren't obvious from the code.

### `docs/crystallized/` — Closed Pipelines

Pipelines that have closed, with their learnings encoded. Crystallized docs are read-only in spirit — you don't go back and change them, you reference them. They are the project's institutional memory.

**What a crystallized doc contains:**
- What was built (a brief inventory, not a log)
- Key decisions and why they were made
- What surprised us (the most valuable section — surprises encode things you couldn't have anticipated)
- Reusable patterns extracted from the work

**When to write:** as soon as a pipeline closes. Not later. The knowledge is freshest at ship time.

**Example:** `docs/crystallized/MULTI_PLATFORM_MIGRATION.md` records the SvelteKit migration: the four phases that shipped, the decisions that shaped the architecture (why static adapter, why Svelte 5 runes, why the `alpha` Firestore ID is centralised), and the surprises — like the `.svelte.ts` extension requirement and the SPA fallback configuration — that cost time and would cost time again without a record.

---

## The `docs/archives/` Folder

The archives folder exists as a record of the project's pre-gardening era. Before the PARA structure was introduced, documentation accumulated as flat-file summaries: `DEPLOYMENT_SUCCESS.md`, `RELEASE_v1.1.0-alpha.md`, `ANALYTICS_TEST_CHECKLIST.md`, and so on. These captured activity but not understanding.

Rather than deleting this history, the project archives it. The archives are not maintained and should not be cited as authoritative — they are an honest record of how the project's documentation practice evolved.

The existence of the archives folder is itself informative: it shows what documentation looks like *before* a gardening system is applied, which makes the contrast with the PARA structure visible.

---

## Frontmatter

Every document carries frontmatter. This is non-negotiable. Frontmatter makes documents machine-readable and searchable, and it forces you to be explicit about what a document *is*.

```yaml
---
published: false
title: ""
tags: []
description: ""       # 1–3 sentences: what this is and why it matters
date: YYYY-MM-DD      # last meaningful update
layer: ""             # L4-Identity | L3-Principle | L2-System | L1-Instance
maturity: ""          # STUB | SEED | BUDDING | EVERGREEN
para: ""              # Pipeline | Area | SkillSurface | Crystallized
---
```

### The Layer Taxonomy

The `layer` field places a document in an abstraction hierarchy. This matters when you're trying to understand the scope of an impact — a change to an L4-Identity doc (core philosophy) has different implications than a change to an L1-Instance doc (a specific run or event).

| Layer | Meaning | Examples |
|---|---|---|
| `L4-Identity` | Core philosophy or identity of the project | Design principles that constrain every decision |
| `L3-Principle` | A durable architectural or design principle | VISION.md, the PARA strategy itself |
| `L2-System` | A working system or subsystem | Firebase Functions architecture, the scoring system |
| `L1-Instance` | A specific instance, run, or event | A migration crystallization, a release note |

### The Maturity Scale

Maturity measures how complete and stable a document is. It frees you to write stubs — short, incomplete notes — without feeling like you're leaving a mess. A STUB is always better than nothing: it marks that something exists and needs attention.

| Maturity | Threshold | What it means |
|---|---|---|
| `STUB` | < 50 words | A placeholder: title + one sentence. Marks future work. |
| `SEED` | 50–249 words | Written but incomplete. Has substance but needs more thought. |
| `BUDDING` | 250–699 words | Mostly complete, actively being refined. |
| `EVERGREEN` | 700+ words | Stable, maintained, reusable as-is. |

A STUB that never gets promoted is still useful — it tells you that a pattern or decision exists even if it hasn't been documented yet. It is a seed that hasn't germinated, not a failure.

---

## The Gardening Workflow

Documentation without maintenance becomes archaeology. The gardening workflow is the set of habits that prevent drift.

### During a Feature

These are the five moments when documentation happens naturally — when the knowledge is freshest and easiest to capture:

**Before you build** — open or update a Pipeline doc in `docs/projects/`. Write the goal, the scope, and the files you expect to touch. This forces you to think through the shape of the work before starting and gives future-you the context for why the code changed.

**When you make a significant decision** — add a decision note to the relevant Area doc. Include what you decided, what you considered, and why this path. Decision notes are the most valuable thing in a knowledge base; they answer the question "why is it this way?" that code can never answer on its own.

**When a pattern solidifies** — encode it as a Skill Surface in `docs/resources/`. One doc, one pattern. Write it so an agent can follow it without asking questions.

**When something ships** — write a crystallization note in `docs/crystallized/`. This is the moment most people skip. Don't. The surprises section alone is worth the effort.

**When something breaks or surprises** — capture it immediately, even as a STUB. Surprises are the most valuable seeds. They encode things you couldn't have anticipated and would cost the same time again without a record.

### Pruning Rules

Gardening is not just adding. Pruning matters as much as planting.

**Remove** docs that only say what the code already says. Documentation that adds no context beyond what you could read in the source file wastes attention.

**Mark STALE** on docs that describe a system you've changed but haven't updated yet. Never leave a stale doc unmarked. A stale doc without a warning actively misleads; a stale doc marked STALE is honest archaeology.

**Crystallize, don't delete** — when a Pipeline closes, move learnings to `crystallized/` rather than deleting the project doc. Deletion destroys institutional memory. Crystallization preserves it in a static, clearly-scoped form.

**Cross-link freely** — use `[[other-doc-name]]` syntax (Obsidian-compatible) to link related documents. Links that don't resolve yet are not errors; they are markers of future work.

### Gardening Cadence

| Trigger | Action |
|---|---|
| Start of any new feature | Open or create a Pipeline doc |
| Significant architectural decision | Update the affected Area doc |
| PR merged | Check: is any existing doc now STALE? |
| Pipeline closes / sprint ends | Write a crystallization note |
| Quarterly | Full prune — review maturity labels, remove dead stubs, update STALE markers |

---

## The Agent-Era Adaptation

The standard PARA method was designed for human knowledge workers. The adaptation here extends it to a world where AI agents are first-class readers and actors in the codebase.

This changes what documentation needs to do. A human can ask a question; an agent reads and acts without asking. Documentation must therefore be **callable** — specific enough to execute without clarification.

This is why the `resources/` folder is called Skill Surfaces rather than Resources. A Skill Surface is a document an agent can *grip*: it has one job, it is written imperatively, and it tells you when you're done.

It is also why `docs/resources/AGENTS.md` exists as a dedicated orientation doc — a first file any agent entering the codebase should read. It surfaces stack facts, key file locations, critical patterns, and hard-won do-nots that aren't legible from the code structure alone.

The practical consequences for writing:
- **Write why, not what.** The code says what. Only the documentation can say why.
- **One doc, one pattern.** Compound docs with multiple patterns are hard to cite and hard to call.
- **Be imperative.** "Deploy with `firebase deploy --only functions`" is callable. "Deployment can be done via Firebase CLI" is not.
- **Mark uncertainty explicitly.** `STUB`, `SEED`, `STALE` — these signal to both humans and agents how much to trust a doc.

---

## What Not to Document

Not everything should be documented. The system is designed to surface what's valuable, which means it also requires judgment about what to leave out.

**Skip:** code patterns, architecture, file paths, or project structure that can be read directly from the codebase. Documentation should add context the code cannot express.

**Skip:** git history or who changed what. `git log` and `git blame` are authoritative for this.

**Skip:** debugging solutions or fix recipes. The fix is in the code; the commit message carries the context.

**Skip:** anything already in CLAUDE.md. CLAUDE.md is the agent's primary instruction set. Duplicating it in docs creates drift.

The hardest judgment call is the grey area: something is documented in the code but the *reason* it's that way is not. That is always worth capturing — even as a one-sentence STUB.

---

## Living Example: How a Feature Moves Through the System

To make the workflow concrete, here is how the Enhanced AI Gateway feature moves through the PKM system:

1. **Pipeline opened** — `docs/projects/AI_GATEWAY_ENHANCED.md` is created at planning time. It records the motivation (player UX, cost control, observability), five independent phases with file-level detail, and what's explicitly out of scope.

2. **Area docs updated** — as phases ship, `docs/areas/FIREBASE_FUNCTIONS_ARCHITECTURE.md` is updated to reflect the new gateway structure. A decision note records why semantic caching was excluded.

3. **Skill Surfaces extracted** — if the retry pattern proves reusable across other Cloud Functions, it gets encoded in `docs/resources/` as a standalone pattern doc.

4. **Pipeline crystallized** — when all phases ship, a crystallization note is written in `docs/crystallized/`. The surprises section will capture anything unexpected about the Firestore cache expiry, the rate-limit transaction behaviour, or the logging fire-and-forget pattern.

5. **Pipeline archived** — the original project doc is moved to `docs/archives/` or marked as crystallized. The living system reflects the current state; the archives preserve the history.

---

## References

- PARA Method — Tiago Forte: Projects, Areas, Resources, Archives
- Digital Garden philosophy — Maggie Appleton, "A Brief History & Ethos of the Digital Garden"
- `docs/README.md` — the live index of all docs in this project
- `docs/resources/PROJECT_STRUCTURE_TEMPLATE.md` — reusable template derived from this system
- `docs/resources/AGENTS.md` — agent orientation guide; canonical first read for AI agents
