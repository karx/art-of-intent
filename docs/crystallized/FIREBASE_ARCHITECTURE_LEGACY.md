---
published: false
title: "Crystallized: Firebase Architecture (Vanilla JS Era)"
tags:
  - crystallized
  - firebase
  - architecture
  - legacy
description: "STALE historical record of the Firestore schema from the vanilla JS era. References dead collections (leaderboards, dailyChallenges). Superseded by data-model.md and FIREBASE_FUNCTIONS_ARCHITECTURE.md."
date: 2026-05-17
layer: L1-Instance
maturity: STUB
para: Crystallized
---

> **Historical record only.** This document was written during the vanilla JS era. It references collections (`leaderboards`, `dailyChallenges`) and structures that no longer exist. See [[docs/data-model.md]] for the current Firestore schema and [[docs/areas/FIREBASE_FUNCTIONS_ARCHITECTURE.md]] for current Cloud Function architecture.

# Firebase Architecture

## Overview

The Art of Intent game uses Firebase for user authentication, session persistence, and leaderboards. This document outlines the complete data architecture and implementation strategy.

---

## Firebase Services Used

### 1. Firebase Authentication
- **Purpose:** User sign-in and identity management
- **Methods:** 
  - Anonymous authentication (play without account)
  - Google Sign-In
  - Email/Password (optional)
- **Benefits:** Secure, scalable, easy integration

### 2. Cloud Firestore
- **Purpose:** Real-time database for game data
- **Features:**
  - Real-time synchronization
  - Offline support
  - Scalable queries
  - Security rules
- **Collections:** users, sessions, leaderboards, dailyChallenges

### 3. Firebase Hosting (Optional)
- **Purpose:** Deploy the game
- **Benefits:** CDN, SSL, custom domain

---

## Data Models

### Collection: `users`

Stores user profiles and statistics.

```javascript
{
  userId: "firebase_auth_uid",
  displayName: "Player123",
  email: "user@example.com",
  photoURL: "https://...",
  isAnonymous: false,
  
  // Statistics
  stats: {
    totalGames: 42,
    totalWins: 28,
    totalLosses: 14,
    winRate: 0.67,
    totalAttempts: 156,
    totalTokens: 38420,
    averageTokensPerGame: 915,
    bestScore: 29,
    currentStreak: 5,
    longestStreak: 12,
    totalWordsMatched: 84,
    averageAttemptsPerWin: 3.7
  },
  
  // Achievements
  achievements: [
    {
      id: "first_win",
      name: "First Victory",
      unlockedAt: "2025-01-24T10:30:00Z"
    },
    {
      id: "perfect_score",
      name: "Perfect Score",
      description: "Win with score under 50",
      unlockedAt: "2025-01-25T14:20:00Z"
    }
  ],
  
  // Preferences
  preferences: {
    theme: "dark",
    voiceEnabled: true,
    notifications: true,
    shareByDefault: false
  },
  
  // Metadata
  createdAt: "2025-01-20T08:00:00Z",
  lastLoginAt: "2025-01-24T10:00:00Z",
  lastGameAt: "2025-01-24T10:45:00Z"
}
```

**Indexes:**
- `userId` (primary key)
- `stats.totalWins` (for leaderboards)
- `stats.bestScore` (for leaderboards)
- `createdAt` (for user analytics)

---

### Collection: `sessions`

Stores individual game sessions.

```javascript
{
  sessionId: "session_1729789200000_abc123xyz",
  userId: "firebase_auth_uid",
  
  // Game Configuration
  gameDate: "2025-01-24",
  targetWords: ["mountain", "peace", "dawn"],
  blacklistWords: ["river", "night", "shadow", "bloom", "winter"],
  
  // Session Data
  startTime: "2025-01-24T10:30:00Z",
  endTime: "2025-01-24T10:45:23Z",
  duration: 923, // seconds
  
  // Game Outcome
  status: "completed", // "in_progress", "completed", "abandoned"
  result: "victory", // "victory", "defeat", "abandoned"
  completionReason: "all_words_matched", // or "blacklist_violation"
  
  // Statistics
  attempts: 7,
  totalTokens: 1715,
  matchedWords: ["mountain", "peace", "dawn"],
  matchedWordsCount: 3,
  efficiencyScore: 241,
  
  // Attempts (denormalized for quick access)
  attemptsData: [
    {
      attemptNumber: 1,
      timestamp: "2025-01-24T10:30:15Z",
      prompt: "Tell me about...",
      response: "Mountain peaks rise high...",
      promptTokens: 156,
      outputTokens: 42,
      totalTokens: 198,
      foundWords: ["mountain", "peace", "dawn"],
      isViolation: false
    }
  ],
  
  // Events (summary)
  eventsSummary: {
    totalEvents: 22,
    voiceInputUses: 2,
    exportsCount: 1,
    apiErrors: 0
  },
  
  // Metadata
  createdAt: "2025-01-24T10:30:00Z",
  updatedAt: "2025-01-24T10:45:23Z",
  isPublic: true, // for leaderboards
  
  // Full event log stored separately for detailed analytics
  fullEventsRef: "sessionEvents/session_1729789200000_abc123xyz"
}
```

---

### Collection: `leaderboards` *(dead — does not exist in current stack)*

Aggregated leaderboard data was planned here. The current leaderboard reads directly from `sessions`.

---

### Collection: `dailyChallenges` *(dead — replaced by `dailyWords/{YYYY-MM-DD}`)*

Daily word configuration was stored here. The current stack uses `dailyWords/{YYYY-MM-DD}` written by the `generateDailyWords` Cloud Function.

---

## Security Rules (Historical)

The rules below reflect the vanilla JS era and are **not current**. See `firestore.rules` in the repo root for the active rules.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == userId;
      allow delete: if false;
    }
    
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() 
        && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    match /leaderboards/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /dailyChallenges/{date} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```
