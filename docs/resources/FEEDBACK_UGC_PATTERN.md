---
published: false
title: "Feedback & UGC Pattern — Puzzle Rating + Community Gallery"
tags:
  - feedback
  - ugc
  - firestore
  - community
description: "How puzzle feedback (star rating) and UGC (community gallery with Recite) are wired in Art of Intent. Covers data model, write paths, deduplication strategy, and extension points."
date: 2026-06-09
layer: L2-System
maturity: BUDDING
para: SkillSurface
---

# Feedback & UGC Pattern

Two feedback tracks added to the post-game experience:

1. **Puzzle Rating** — 1–5 star rating per player per day. Qualitative signal on word difficulty/fun.
2. **Community Gallery** — Players publish their game card + haiku. Others **Recite** (annotated like). Reddit-style flat collections.

---

## Data Model (three new collections)

### `puzzleFeedback/{sessionId}`
One rating per session (= one per player per day).

```
{ sessionId, userId, date, rating: 1-5, createdAt }
```

### `communityPosts/{sessionId}`
One post per published session. `reciteCount` is denormalized for fast reads.

```
{ sessionId, userId, displayName, date, featuredHaiku, caption, score, attempts, reciteCount, createdAt }
```

### `recites/{sessionId}_{userId}`
Composite key enforces one recite per player per post — Firestore-native deduplication (no extra lookup). Same pattern as Reddit's votes table.

```
{ postId, userId, displayName, note, recitedAt }
```

`reciteCount` on the parent post is updated via `increment(1)` concurrently when the recite doc is created. Eventual consistency accepted (same tradeoff as Reddit vote score caching).

---

## Write Paths

| Action | Function | Collection written |
|---|---|---|
| Star rating | `submitPuzzleRating(n)` in `+page.svelte` | `puzzleFeedback/{sessionId}` |
| Publish to gallery | `confirmPublish()` in `+page.svelte` | `communityPosts/{sessionId}` |
| Recite a post | `confirmRecite(post)` in `community/+page.svelte` | `recites/{sessionId}_{userId}` + `communityPosts/{sessionId}` update |

### Deduplication strategy
- **Rating**: One per session. LocalStorage `aoi_rating_{today}` for immediate UI state.
- **Publish**: One per session. LocalStorage `aoi_published_{today}`. `setDoc` not `addDoc` so re-calling is idempotent.
- **Recite**: Composite key prevents duplicate docs. LocalStorage `aoi_recited_{sessionId}` for instant UI state without a read round-trip.

---

## Firestore Rules Pattern

```
// puzzleFeedback — owner write (userId must match auth), public read
match /puzzleFeedback/{sessionId} {
  allow read: if true;
  allow create, update: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}

// communityPosts — owner create, any-auth update (reciteCount increment), public read
match /communityPosts/{sessionId} {
  allow read: if true;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated();
}

// recites — owner create only (immutable), public read
match /recites/{reciteId} {
  allow read: if true;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}
```

---

## Firestore Index Required

Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "recites",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "postId",     "order": "ASCENDING" },
    { "fieldPath": "recitedAt",  "order": "DESCENDING" }
  ]
}
```

Also for `communityPosts`:

```json
{
  "collectionGroup": "communityPosts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "date",        "order": "ASCENDING" },
    { "fieldPath": "reciteCount", "order": "DESCENDING" },
    { "fieldPath": "score",       "order": "ASCENDING" }
  ]
}
```

---

## Extension Points

- **Insights page**: Query `puzzleFeedback` grouped by `date`, average rating per day → flag words with avg < 3 for quality review.
- **Trending recites**: Sort gallery by `reciteCount desc` over the past 7 days to surface evergreen creative plays.
- **Recite leaderboard**: Players with the most recites across the season — recognition for creative, not just efficient, play.
- **Gallery archive**: `/community?date=YYYY-MM-DD` — browse past days' galleries for retrospective appreciation.
