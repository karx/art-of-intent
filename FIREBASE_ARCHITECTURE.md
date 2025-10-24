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

**Indexes:**
- `sessionId` (primary key)
- `userId` (for user's session history)
- `gameDate` (for daily leaderboards)
- `efficiencyScore` (for leaderboards)
- `createdAt` (for chronological queries)
- Composite: `gameDate + efficiencyScore` (daily leaderboards)
- Composite: `userId + gameDate` (user's daily session)

---

### Collection: `sessionEvents`

Stores detailed event logs for sessions (separate for performance).

```javascript
{
  sessionId: "session_1729789200000_abc123xyz",
  events: [
    {
      eventType: "session_start",
      timestamp: "2025-01-24T10:30:00Z",
      data: { reason: "new_day" }
    },
    {
      eventType: "prompt_submitted",
      timestamp: "2025-01-24T10:30:15Z",
      data: { promptLength: 78, attemptNumber: 1 }
    },
    // ... all events
  ]
}
```

**Purpose:** Detailed analytics without bloating main session document.

---

### Collection: `leaderboards`

Aggregated leaderboard data for performance.

#### Document: `daily/{date}`

```javascript
{
  date: "2025-01-24",
  
  // Top scores
  topScores: [
    {
      userId: "user123",
      displayName: "Player123",
      photoURL: "https://...",
      efficiencyScore: 29,
      attempts: 1,
      totalTokens: 198,
      completedAt: "2025-01-24T10:30:17Z",
      rank: 1
    },
    // ... top 100
  ],
  
  // Statistics
  stats: {
    totalPlayers: 1247,
    totalGames: 1583,
    averageScore: 245,
    averageAttempts: 5.2,
    averageTokens: 1280,
    winRate: 0.68
  },
  
  // Target words for the day
  targetWords: ["mountain", "peace", "dawn"],
  blacklistWords: ["river", "night", "shadow", "bloom", "winter"],
  
  // Metadata
  updatedAt: "2025-01-24T23:59:59Z"
}
```

#### Document: `allTime/global`

```javascript
{
  // All-time top scores
  topScores: [
    {
      userId: "user456",
      displayName: "ProPlayer",
      efficiencyScore: 20,
      gameDate: "2025-01-15",
      attempts: 1,
      totalTokens: 150,
      rank: 1
    },
    // ... top 100
  ],
  
  // Global statistics
  stats: {
    totalPlayers: 15420,
    totalGames: 48392,
    averageScore: 258,
    bestScore: 20,
    worstScore: 850
  },
  
  updatedAt: "2025-01-24T23:59:59Z"
}
```

#### Document: `weekly/{weekId}`

```javascript
{
  weekId: "2025-W04",
  startDate: "2025-01-20",
  endDate: "2025-01-26",
  
  topScores: [
    // Top 100 for the week
  ],
  
  stats: {
    totalPlayers: 3842,
    totalGames: 12456,
    averageScore: 242
  },
  
  updatedAt: "2025-01-24T23:59:59Z"
}
```

**Indexes:**
- `date` (for daily leaderboards)
- `weekId` (for weekly leaderboards)
- `topScores.efficiencyScore` (for ranking)

---

### Collection: `dailyChallenges`

Stores daily word configurations.

```javascript
{
  date: "2025-01-24",
  
  // Words
  targetWords: ["mountain", "peace", "dawn"],
  blacklistWords: ["river", "night", "shadow", "bloom", "winter"],
  
  // Word metadata
  wordCategories: {
    "mountain": "nature",
    "peace": "emotions",
    "dawn": "time"
  },
  
  // Difficulty (calculated)
  difficulty: "medium",
  difficultyScore: 5.2,
  
  // Statistics
  stats: {
    totalAttempts: 8234,
    totalCompletions: 5602,
    completionRate: 0.68,
    averageAttempts: 5.1,
    averageTokens: 1245,
    fastestCompletion: 45, // seconds
    slowestCompletion: 3600
  },
  
  // Metadata
  createdAt: "2025-01-24T00:00:00Z",
  seed: "Fri Jan 24 2025" // for reproducibility
}
```

**Purpose:** Track daily challenge statistics and difficulty.

---

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isOwner(userId);
      
      // Users can create/update their own profile
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == userId;
      
      // No deletes
      allow delete: if false;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      // Users can read their own sessions
      allow read: if isAuthenticated() 
        && resource.data.userId == request.auth.uid;
      
      // Users can create their own sessions
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid;
      
      // Users can update their own sessions
      allow update: if isAuthenticated()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      
      // No deletes
      allow delete: if false;
    }
    
    // Session events (detailed logs)
    match /sessionEvents/{sessionId} {
      // Users can read their own session events
      allow read: if isAuthenticated();
      
      // Users can create/update their own events
      allow create, update: if isAuthenticated();
      
      // No deletes
      allow delete: if false;
    }
    
    // Leaderboards (read-only for users)
    match /leaderboards/{document=**} {
      // Anyone can read leaderboards
      allow read: if true;
      
      // Only server can write
      allow write: if false;
    }
    
    // Daily challenges (read-only)
    match /dailyChallenges/{date} {
      // Anyone can read
      allow read: if true;
      
      // Only server can write
      allow write: if false;
    }
  }
}
```

---

## Data Flow

### 1. User Authentication

```
User clicks "Sign In"
  ↓
Firebase Auth (Google/Email/Anonymous)
  ↓
Create/Update user document in Firestore
  ↓
Load user profile and stats
  ↓
Sync with UI
```

### 2. Starting a Game

```
User loads game
  ↓
Check if authenticated
  ↓
Load daily challenge from Firestore
  ↓
Create session document
  ↓
Initialize game state
  ↓
Sync with localStorage (offline support)
```

### 3. Playing the Game

```
User submits prompt
  ↓
Update session document (attempts, tokens)
  ↓
Add event to sessionEvents
  ↓
Update local state
  ↓
Sync to Firestore (debounced)
```

### 4. Completing a Game

```
Game ends (win/loss)
  ↓
Finalize session document
  ↓
Update user stats
  ↓
Check for achievements
  ↓
Update leaderboard (Cloud Function)
  ↓
Show results and rank
```

### 5. Viewing Leaderboards

```
User opens leaderboard
  ↓
Query leaderboards collection
  ↓
Real-time listener for updates
  ↓
Display rankings
  ↓
Highlight user's position
```

---

## Cloud Functions

### Function: `updateLeaderboard`

Triggered when a session is completed.

```javascript
exports.updateLeaderboard = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const session = change.after.data();
    
    // Only process completed sessions
    if (session.status !== 'completed') return;
    
    // Update daily leaderboard
    await updateDailyLeaderboard(session);
    
    // Update weekly leaderboard
    await updateWeeklyLeaderboard(session);
    
    // Update all-time leaderboard
    await updateAllTimeLeaderboard(session);
    
    // Update user stats
    await updateUserStats(session);
  });
```

### Function: `generateDailyChallenge`

Scheduled to run at midnight UTC.

```javascript
exports.generateDailyChallenge = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Generate words using same algorithm as client
    const { targetWords, blacklistWords } = generateDailyWords(today);
    
    // Store in Firestore
    await db.collection('dailyChallenges').doc(today).set({
      date: today,
      targetWords,
      blacklistWords,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
```

### Function: `calculateAchievements`

Check for new achievements after game completion.

```javascript
exports.calculateAchievements = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const session = change.after.data();
    const userId = session.userId;
    
    // Check various achievement conditions
    const newAchievements = [];
    
    // First win
    if (session.result === 'victory') {
      const userSessions = await getUserSessions(userId);
      if (userSessions.length === 1) {
        newAchievements.push('first_win');
      }
    }
    
    // Perfect score
    if (session.efficiencyScore < 50) {
      newAchievements.push('perfect_score');
    }
    
    // Update user document
    if (newAchievements.length > 0) {
      await updateUserAchievements(userId, newAchievements);
    }
  });
```

---

## Offline Support

### Strategy

1. **localStorage as primary cache**
   - Game state stored locally
   - Syncs to Firestore when online
   - Works offline seamlessly

2. **Firestore offline persistence**
   ```javascript
   firebase.firestore().enablePersistence()
     .catch((err) => {
       console.error('Persistence error:', err);
     });
   ```

3. **Sync on reconnect**
   - Detect online/offline status
   - Queue writes when offline
   - Sync when connection restored

---

## Performance Optimization

### 1. Denormalization
- Store frequently accessed data in session documents
- Avoid deep queries
- Trade storage for speed

### 2. Pagination
- Leaderboards limited to top 100
- User history paginated (10 per page)
- Infinite scroll for session list

### 3. Caching
- Cache leaderboards (5 minute TTL)
- Cache user profile (session duration)
- Cache daily challenge (24 hours)

### 4. Indexes
- Create composite indexes for common queries
- Index on frequently filtered fields
- Monitor query performance

---

## Cost Estimation

### Firestore Pricing (as of 2025)

**Free Tier:**
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1 GB storage

**Estimated Usage (1000 daily users):**
- Reads: ~15K/day (leaderboards, profiles)
- Writes: ~8K/day (sessions, stats)
- Storage: ~500 MB (sessions, users)

**Cost:** Free tier sufficient for initial launch.

### Authentication Pricing

**Free Tier:**
- Unlimited authentication
- 10K phone auth/month

**Cost:** Free

---

## Migration Strategy

### Phase 1: Add Firebase (Non-Breaking)
- Add Firebase SDK
- Implement authentication (optional)
- Keep localStorage as fallback
- No breaking changes

### Phase 2: Sync to Firestore
- Sync sessions to Firestore
- Keep localStorage for offline
- Dual-write strategy

### Phase 3: Leaderboards
- Implement leaderboard queries
- Add UI components
- Real-time updates

### Phase 4: Full Migration
- Make Firestore primary
- localStorage as cache only
- Remove legacy code

---

## Testing Strategy

### Unit Tests
- Data model validation
- Security rules testing
- Cloud function logic

### Integration Tests
- Authentication flow
- Session creation/update
- Leaderboard updates

### E2E Tests
- Complete game flow
- Offline/online transitions
- Multi-device sync

---

## Monitoring

### Metrics to Track
- Authentication success rate
- Session write latency
- Leaderboard query performance
- Error rates
- Offline sync success

### Alerts
- High error rates
- Slow queries
- Failed syncs
- Security rule violations

---

## Next Steps

1. Set up Firebase project
2. Install Firebase SDK
3. Implement authentication
4. Create Firestore collections
5. Deploy security rules
6. Implement Cloud Functions
7. Add leaderboard UI
8. Test and iterate

---

This architecture provides a scalable, secure, and performant foundation for adding statefulness to the Art of Intent game.
