# Data Pipeline Documentation

**Version:** 1.0.0  
**Last Updated:** 2025-01-24

## Overview

This document describes how game data flows from gameplay through Firebase to the leaderboard display.

## Data Flow

```
Game Play
    ↓
gameState (in-memory)
    ↓
saveSession() [firebase-db.js]
    ↓
Firestore 'sessions' collection
    ↓
fetchLeaderboardData() [leaderboard-data.js]
    ↓
Leaderboard Display / OG Image
```

## Session Data Structure

### Saved to Firestore

When a game ends, the following data is saved to the `sessions` collection:

```javascript
{
  // Identifiers
  sessionId: "uuid-string",
  userId: "firebase-uid",
  userName: "Player Name",
  displayName: "Player Name",
  
  // Dates (both formats for compatibility)
  gameDate: "2025-01-24",  // YYYY-MM-DD
  date: "2025-01-24",      // Alias for easier querying
  
  // Game Configuration
  targetWords: ["word1", "word2", "word3"],
  blacklistWords: ["bad1", "bad2", ...],
  
  // Session Timing
  startTime: "2025-01-24T10:00:00Z",
  endTime: "2025-01-24T10:05:00Z",
  duration: 300, // seconds
  
  // Game Outcome
  status: "completed" | "in_progress",
  result: "victory" | "defeat" | null,
  isWin: true | false,  // Boolean for easier querying
  completionReason: "all_words_matched" | "blacklist_violation" | null,
  
  // Statistics
  attempts: 5,
  totalTokens: 234,
  matchedWords: ["word1", "word2", "word3"],
  matchedWordsCount: 3,
  efficiencyScore: 187,
  
  // Attempts Data (limited to 20)
  attemptsData: [
    {
      attemptNumber: 1,
      timestamp: "2025-01-24T10:01:00Z",
      prompt: "user prompt...",
      response: "haiku response...",
      promptTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      foundWords: ["word1"],
      isViolation: false
    },
    // ... more attempts
  ],
  
  // Events Summary
  eventsSummary: {
    totalEvents: 15,
    voiceInputUses: 2,
    exportsCount: 1,
    apiErrors: 0
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActivity: Timestamp,  // For tracking active users
  isPublic: true
}
```

## Leaderboard Queries

### Query Strategy (Multiple Fallbacks)

The leaderboard data fetcher tries multiple approaches:

#### 1. Leaderboard Collection (Primary)
```javascript
query(
  collection(db, 'leaderboard'),
  where('date', '==', today),
  orderBy('score', 'asc'),
  limit(5)
)
```

#### 2. Recent Leaderboard Entries (Fallback 1)
```javascript
query(
  collection(db, 'leaderboard'),
  orderBy('score', 'asc'),
  limit(5)
)
```

#### 3. Victory Sessions (Fallback 2)
```javascript
query(
  collection(db, 'sessions'),
  where('result', '==', 'victory'),
  orderBy('totalTokens', 'asc'),
  limit(5)
)
```

#### 4. Completed Sessions (Fallback 3)
```javascript
query(
  collection(db, 'sessions'),
  where('status', '==', 'completed'),
  orderBy('totalTokens', 'asc'),
  limit(5)
)
```

## Aggregate Statistics

### Queries Used

#### Total Players
```javascript
getCountFromServer(collection(db, 'users'))
```

#### Games Today
```javascript
query(
  collection(db, 'sessions'),
  where('gameDate', '==', today)
)
```

**Note:** Uses `gameDate` field (not `date`)

#### Active Now
```javascript
query(
  collection(db, 'sessions'),
  where('lastActivity', '>=', fiveMinutesAgo)
)
```

#### Win Rate Calculation
```javascript
// From today's sessions
sessions.forEach(session => {
  if (session.result === 'victory' || session.isWin === true) {
    wins++;
  }
});

winRate = (wins / totalGames) * 100;
```

## Field Name Mapping

### Important Field Names

| Purpose | Field Name | Type | Notes |
|---------|-----------|------|-------|
| Date | `gameDate` | string | Primary date field |
| Date | `date` | string | Alias for queries |
| Win Status | `result` | string | "victory" or "defeat" |
| Win Status | `isWin` | boolean | For easier filtering |
| Player Name | `userName` | string | Display name |
| Player Name | `displayName` | string | Alias |
| Last Update | `lastActivity` | Timestamp | For active users |

## Common Issues

### Issue 1: Stats Show Zero

**Symptom:** `gamesToday: 0`, `winRate: 0`, etc.

**Causes:**
1. No sessions saved for today
2. Wrong field name in query (`date` vs `gameDate`)
3. Wrong result value (`isWin` vs `result`)
4. Firestore rules blocking read

**Solution:**
- Check field names match actual data
- Use `gameDate` for date queries
- Use `result === 'victory'` for wins
- Verify Firestore rules allow read

### Issue 2: Leaderboard Empty

**Symptom:** "No players yet" message

**Causes:**
1. No `leaderboard` collection
2. No sessions with `result: 'victory'`
3. Date filter too restrictive
4. Firestore rules blocking read

**Solution:**
- Fallback queries handle this
- Check console logs for query results
- Use "Inspect Database" button
- Verify data exists in Firestore

### Issue 3: Player Names Missing

**Symptom:** All players show as "GUEST"

**Causes:**
1. `userName` field not saved
2. User not authenticated
3. Field name mismatch

**Solution:**
- Ensure `userName` and `displayName` saved
- Check user authentication
- Verify field names in queries

## Debugging

### Enable Debug Mode

1. Visit `/generate-og-image.html`
2. Check "Enable Debug Mode"
3. Click "Inspect Database"
4. Check browser console

### Console Output

```
🔍 Inspecting Firestore collections...
📊 users: 5 documents
   Sample document: { userId: "...", displayName: "..." }
📊 sessions: 10 documents
   Sample document: { gameDate: "2025-01-24", result: "victory", ... }
📊 leaderboard: 0 documents
```

### Check Session Data

```javascript
// In browser console
const { collection, getDocs, query, limit } = window.firestoreModules;
const q = query(collection(window.db, 'sessions'), limit(1));
const snapshot = await getDocs(q);
snapshot.forEach(doc => console.log(doc.data()));
```

## Data Validation

### Required Fields

For leaderboard to work, sessions must have:
- ✅ `gameDate` or `date`
- ✅ `result` or `isWin`
- ✅ `totalTokens`
- ✅ `attempts`
- ✅ `userName` or `displayName`
- ✅ `status: 'completed'`

### Field Types

```javascript
{
  gameDate: string,      // "YYYY-MM-DD"
  date: string,          // "YYYY-MM-DD"
  result: string,        // "victory" | "defeat"
  isWin: boolean,        // true | false
  totalTokens: number,   // integer
  attempts: number,      // integer
  userName: string,      // display name
  status: string,        // "completed" | "in_progress"
  lastActivity: Timestamp // Firestore Timestamp
}
```

## Indexes Required

### Composite Indexes

For efficient queries, create these indexes in Firestore:

1. **Sessions by Date and Tokens**
   ```
   Collection: sessions
   Fields: gameDate (Ascending), totalTokens (Ascending)
   ```

2. **Sessions by Result and Tokens**
   ```
   Collection: sessions
   Fields: result (Ascending), totalTokens (Ascending)
   ```

3. **Sessions by Status and Tokens**
   ```
   Collection: sessions
   Fields: status (Ascending), totalTokens (Ascending)
   ```

4. **Sessions by Last Activity**
   ```
   Collection: sessions
   Fields: lastActivity (Descending)
   ```

### Create Indexes

Firebase Console will prompt to create indexes when queries fail.
Or create manually:
1. Firebase Console > Firestore > Indexes
2. Click "Create Index"
3. Add fields as listed above

## Testing

### Test Data Creation

To test leaderboard with real data:

1. **Play a game to completion**
   - Win or lose
   - Session auto-saves

2. **Check Firestore**
   ```
   Firebase Console > Firestore > sessions
   Verify document exists with today's date
   ```

3. **Test Leaderboard**
   ```
   Visit /generate-og-image.html
   Click "Fetch Live Data"
   Should show your session
   ```

### Mock Data

For testing without real data:
```javascript
// Use mock data
const mockData = getMockLeaderboardData();
```

## Future Improvements

### Planned Features

1. **Dedicated Leaderboard Collection**
   - Aggregate daily winners
   - Pre-calculated rankings
   - Faster queries

2. **Caching Layer**
   - Cache leaderboard data
   - Reduce Firestore reads
   - Improve performance

3. **Real-time Updates**
   - Live leaderboard updates
   - WebSocket connections
   - Instant rank changes

4. **Historical Data**
   - Weekly/monthly leaderboards
   - All-time rankings
   - Trend analysis

## Resources

- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

---

*"C:\> DATA_PIPELINE.EXE --analyze"*
