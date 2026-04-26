---
published: false
title: "Docs Index — Art of Intent"
tags:
  - index
  - meta
description: "PARA-structured documentation index. Pipelines are bounded runs; Areas are maintained responsibilities; Skill Surfaces are callable HOWTOs; Crystallized are closed pipelines with learnings encoded."
date: 2026-04-25
layer: L2-System
maturity: BUDDING
para: Area
---

# Documentation

Follows PARA for the Agent Engineering Era:

| Folder | Role |
|---|---|
| `projects/` | **Pipelines** — bounded runs with a goal and an end. Feature sprints, experiments. |
| `areas/` | **Areas** — ongoing responsibilities with a quality bar to maintain. |
| `resources/` | **Skill Surfaces** — callable knowledge. HOWTOs, guides, patterns an agent can grip. |
| `crystallized/` | **Crystallized** — closed pipelines with learnings encoded. Static but invokable. |

---

## Frontmatter Convention

Every doc should carry:

```yaml
---
published: false
title: ""
tags: []
description: ""          # 1–3 sentences: what this is and why it matters
date: YYYY-MM-DD         # last meaningful update
layer: ""                # L4-Identity | L3-Principle | L2-System | L1-Instance
maturity: ""             # STUB | SEED | BUDDING | EVERGREEN
para: ""                 # Pipeline | Area | SkillSurface | Crystallized
---
```

**Maturity:** STUB < 50 words · SEED 50–249 · BUDDING 250–699 · EVERGREEN 700+

---

## Pipelines (`projects/`)

Active runs with a goal and a definition of done. When closed, write a crystallization note.

| File | Status |
|---|---|
| [MULTI_PLATFORM.md](projects/MULTI_PLATFORM.md) | Phases 1–4 complete — Phase 5 (native dirs, archive old files) open |
| [AI_GATEWAY_ENHANCED.md](projects/AI_GATEWAY_ENHANCED.md) | Planning — retry, cache, logging, rate limiting |

---

## Areas (`areas/`)

Ongoing responsibilities. No end date, but a quality bar to maintain.

> Docs marked **STALE** describe the old vanilla JS era — they are preserved for historical context but should not be trusted as current.

**Architecture & Systems**
- [FIREBASE_FUNCTIONS_ARCHITECTURE.md](areas/FIREBASE_FUNCTIONS_ARCHITECTURE.md)
- [DATA_PIPELINE.md](areas/DATA_PIPELINE.md)
- [DAILY_WORDS_SYSTEM.md](areas/DAILY_WORDS_SYSTEM.md)
- [CREEP_SYSTEM.md](areas/CREEP_SYSTEM.md)
- [FIREBASE_ARCHITECTURE.md](areas/FIREBASE_ARCHITECTURE.md) — **STALE** (superseded by data-model.md)

**Security**
- [SECURITY_SIGNALS_GUIDE.md](areas/SECURITY_SIGNALS_GUIDE.md)
- [SECURITY_SIGNALS_INTEGRATION.md](areas/SECURITY_SIGNALS_INTEGRATION.md)
- [PROMPT_PURIFY_README.md](areas/PROMPT_PURIFY_README.md)
- [VIOLATION_UX_GUIDE.md](areas/VIOLATION_UX_GUIDE.md)
- [VALIDATION.md](areas/VALIDATION.md)
- [SECURITY_FLOW.md](areas/SECURITY_FLOW.md) — **STALE** (PromptPurify removed)

**Design & UX**
- [DOS_THEME_GUIDELINES.md](areas/DOS_THEME_GUIDELINES.md)
- [THEME_SYSTEM_DESIGN.md](areas/THEME_SYSTEM_DESIGN.md)
- [TRAIL_STATS_DESIGN.md](areas/TRAIL_STATS_DESIGN.md)
- [AUTH_FLOW_DESIGN.md](areas/AUTH_FLOW_DESIGN.md)
- [MOBILE_AUTH_UX.md](areas/MOBILE_AUTH_UX.md)
- [FEEDBACK_SYSTEM_MAINTAINER_GUIDE.md](areas/FEEDBACK_SYSTEM_MAINTAINER_GUIDE.md)

**Analytics & SEO**
- [ANALYTICS_STRATEGY.md](areas/ANALYTICS_STRATEGY.md)
- [TRACKING.md](areas/TRACKING.md)
- [SCHEMA_ORG.md](areas/SCHEMA_ORG.md)
- [SOCIAL_MEDIA_METADATA.md](areas/SOCIAL_MEDIA_METADATA.md)
- [AI_EVALUATION.md](areas/AI_EVALUATION.md)

---

## Skill Surfaces (`resources/`)

Callable knowledge — HOWTOs and guides an agent can follow without asking.

- [AGENTS.md](resources/AGENTS.md) — **Start here.** Stack facts, key files, critical patterns, do-nots.
- [SETUP.md](resources/SETUP.md)
- [FIREBASE_SETUP.md](resources/FIREBASE_SETUP.md)
- [FIREBASE_FUNCTIONS_DEPLOYMENT.md](resources/FIREBASE_FUNCTIONS_DEPLOYMENT.md)
- [FIRESTORE_RULES_DEPLOYMENT.md](resources/FIRESTORE_RULES_DEPLOYMENT.md)
- [DEPLOY_INSTRUCTIONS.md](resources/DEPLOY_INSTRUCTIONS.md)
- [GRANT_PERMISSIONS.md](resources/GRANT_PERMISSIONS.md)
- [SERVICES_AND_APIS_GUIDE.md](resources/SERVICES_AND_APIS_GUIDE.md)
- [ANALYTICS_PLAN.md](resources/ANALYTICS_PLAN.md)
- [OG_IMAGE_GENERATION.md](resources/OG_IMAGE_GENERATION.md)
- [OPENGRAPH.md](resources/OPENGRAPH.md)
- [IMAGES.md](resources/IMAGES.md)
- [ICONS.md](resources/ICONS.md)
- [XSS_TEST_INSTRUCTIONS.md](resources/XSS_TEST_INSTRUCTIONS.md)

---

## Crystallized (`crystallized/`)

Closed pipelines with learnings encoded. Read-only — static but invokable.

- [MULTI_PLATFORM_MIGRATION.md](crystallized/MULTI_PLATFORM_MIGRATION.md) — What was built, key decisions, surprises, reusable patterns from the SvelteKit migration.

See [crystallized/](crystallized/) for historical deployment logs, release notes, and legacy design docs.

---

## Root Docs

- [VISION.md](VISION.md) — Product north star and design principles
- [future-work.md](future-work.md) — Scoped, ready-to-implement backlog (file paths updated for SvelteKit stack)
- [data-model.md](data-model.md) — Firestore collections and field inventory
