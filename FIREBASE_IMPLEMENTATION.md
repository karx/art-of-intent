# Firebase Implementation Guide

## Overview

This guide covers the complete implementation of Firebase for the Art of Intent game, including authentication, database, and leaderboards.

---

## Setup Steps

### 1. Firebase Project Setup ✅

**Already completed:**
- Firebase project created: `art-of-intent`
- Project ID: `art-of-intent`
- Configuration obtained

### 2. Enable Firebase Services

#### A. Authentication
1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable sign-in methods:
   - ✅ **Anonymous** (for guest play)
   - ✅ **Google** (for account creation)
   - ⚪ Email/Password (optional)

#### B. Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select region (us-central1 recommended)
5. Create database

#### C. Security Rules
Deploy the security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

### 3. Install Firebase CLI (Optional)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

---

## File Structure

```
art-of-intent/
├── firebase-config.js          # Firebase initialization
├── firebase-auth.js            # Authentication module
├── firebase-db.js              # Database operations
├── firestore.rules             # Security rules
├── firestore.indexes.json      # Database indexes
└── FIREBASE_IMPLEMENTATION.md  # This file
```

---

## Implementation Details

### 1. Firebase Configuration (`firebase-config.js`)

**Features:**
- Initializes Firebase app
- Sets up Auth, Firestore, Analytics
- Enables offline persistence
- Exports all Firebase services

**Usage:**
```javascript
import { auth, db, analytics } from './firebase-config.js';
```

### 2. Authentication Module (`firebase-auth.js`)

**Features:**
- Anonymous sign-in (play without account)
- Google Sign-In
- User profile management
- Stats tracking
- Achievement system
- Data migration (anonymous → authenticated)

**Key Functions:**
```javascript
// Initialize auth
initAuth();

// Sign in anonymously
await signInAnon();

// Sign in with Google
await signInWithGoogle();

// Sign out
await signOutUser();

// Get current user
const user = getCurrentUser();

// Update stats after game
await updateUserStats(sessionData);
```

### 3. Database Module (`firebase-db.js`)

**Features:**
- Session persistence
- Leaderboard queries
- Real-time updates
- Daily challenge management
- User rank calculation

**Key Functions:**
```javascript
// Save session
await saveSession(sessionData);

// Get leaderboard
const leaderboard = await getDailyLeaderboard();

// Subscribe to real-time updates
const unsubscribe = subscribeToLeaderboard(date, (data) => {
    updateLeaderboardUI(data);
});

// Get user's rank
const rank = await getUserRank(userId);

// Sync localStorage to Firestore
await syncLocalToFirestore();
```

---

## Integration with Existing Game

### Step 1: Add Firebase Scripts to HTML

Add before closing `</body>` tag in `index.html`:

```html
<!-- Firebase Modules -->
<script type="module" src="firebase-config.js"></script>
<script type="module" src="firebase-auth.js"></script>
<script type="module" src="firebase-db.js"></script>
```

### Step 2: Initialize Firebase in Game

In `game.js`, add after DOMContentLoaded:

```javascript
// Initialize Firebase
if (window.firebaseAuth) {
    window.firebaseAuth.initAuth();
    
    // Listen for auth state changes
    window.firebaseAuth.addAuthStateListener((user, profile) => {
        if (user) {
            console.log('User signed in:', user.uid);
            updateUIForAuthenticatedUser(user, profile);
        } else {
            console.log('User signed out');
            updateUIForAnonymousUser();
        }
    });
}
```

### Step 3: Save Sessions to Firestore

After game completion, in `handleGameWin()` and `handleBlacklistViolation()`:

```javascript
// Save to Firestore
if (window.firebaseDb) {
    const sessionData = {
        sessionId: gameState.sessionId,
        sessionStartTime: gameState.sessionStartTime,
        sessionEndTime: gameState.sessionEndTime,
        targetWords: gameState.targetWords,
        blacklistWords: gameState.blacklistWords,
        attempts: gameState.attempts,
        totalTokens: gameState.totalTokens,
        matchedWords: gameState.matchedWords,
        responseTrail: gameState.responseTrail,
        events: gameState.events,
        gameOver: gameState.gameOver
    };
    
    await window.firebaseDb.saveSession(sessionData);
    
    // Update user stats
    if (window.firebaseAuth) {
        await window.firebaseAuth.updateUserStats({
            result: gameState.matchedWords.size === gameState.targetWords.length ? 'victory' : 'defeat',
            attempts: gameState.attempts,
            totalTokens: gameState.totalTokens,
            matchedWordsCount: gameState.matchedWords.size,
            efficiencyScore: calculateEfficiencyScore()
        });
    }
}
```

### Step 4: Add Authentication UI

Add to `index.html` header:

```html
<div class="auth-section">
    <div id="userInfo" class="user-info hidden">
        <img id="userPhoto" class="user-photo" alt="User">
        <span id="userName" class="user-name"></span>
        <button id="signOutBtn" class="btn-secondary">Sign Out</button>
    </div>
    <div id="authButtons" class="auth-buttons">
        <button id="signInGoogleBtn" class="btn-primary">
            <svg><!-- Google icon --></svg>
            Sign in with Google
        </button>
        <button id="playAnonymousBtn" class="btn-secondary">
            Play as Guest
        </button>
    </div>
</div>
```

### Step 5: Add Leaderboard UI

Add new section in `index.html`:

```html
<div class="leaderboard-section">
    <h2>🏆 Daily Leaderboard</h2>
    <div id="leaderboardContainer" class="leaderboard-container">
        <div class="loading">Loading leaderboard...</div>
    </div>
</div>
```

---

## Data Flow

### Anonymous User Flow

```
1. User opens game
   ↓
2. Auto sign-in anonymously
   ↓
3. Create anonymous user profile
   ↓
4. Play game (localStorage + Firestore)
   ↓
5. Save session to Firestore
   ↓
6. Update anonymous user stats
```

### Authenticated User Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth popup
   ↓
3. Create/load user profile
   ↓
4. Migrate anonymous data (if exists)
   ↓
5. Play game (localStorage + Firestore)
   ↓
6. Save session to Firestore
   ↓
7. Update user stats
   ↓
8. Update leaderboards
   ↓
9. Check achievements
```

### Leaderboard Update Flow

```
1. User completes game
   ↓
2. Session saved to Firestore
   ↓
3. Cloud Function triggered (future)
   ↓
4. Calculate rank
   ↓
5. Update leaderboard document
   ↓
6. Real-time listeners notified
   ↓
7. UI updates automatically
```

---

## Security Rules

### Firestore Rules (`firestore.rules`)

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
    
    // Users can only read/write their own data
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId);
      allow delete: if false;
    }
    
    // Sessions
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() 
        && resource.data.userId == request.auth.uid;
      allow create, update: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid;
      allow delete: if false;
    }
    
    // Leaderboards (read-only for users)
    match /leaderboards/{document=**} {
      allow read: if true;
      allow write: if false; // Only Cloud Functions
    }
    
    // Daily challenges (read-only)
    match /dailyChallenges/{date} {
      allow read: if true;
      allow write: if false; // Only admin
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Database Indexes

### Required Indexes (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gameDate", "order": "ASCENDING" },
        { "fieldPath": "efficiencyScore", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gameDate", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "result", "order": "ASCENDING" },
        { "fieldPath": "efficiencyScore", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Testing

### 1. Test Authentication

```javascript
// Test anonymous sign-in
await window.firebaseAuth.signInAnon();
console.log('User:', window.firebaseAuth.getCurrentUser());

// Test Google sign-in
await window.firebaseAuth.signInWithGoogle();

// Test sign-out
await window.firebaseAuth.signOutUser();
```

### 2. Test Session Saving

```javascript
// Play a game and complete it
// Check Firestore console for new session document
```

### 3. Test Leaderboard

```javascript
// Get leaderboard
const leaderboard = await window.firebaseDb.getDailyLeaderboard();
console.log('Leaderboard:', leaderboard);

// Subscribe to updates
const unsubscribe = window.firebaseDb.subscribeToLeaderboard(null, (data) => {
    console.log('Leaderboard updated:', data);
});
```

---

## Offline Support

### Strategy

1. **Firestore Offline Persistence**
   - Enabled by default
   - Caches data locally
   - Syncs when online

2. **localStorage Fallback**
   - Game state in localStorage
   - Syncs to Firestore when online
   - Works completely offline

3. **Sync on Reconnect**
   ```javascript
   window.addEventListener('online', () => {
       console.log('Back online, syncing...');
       window.firebaseDb.syncLocalToFirestore();
   });
   ```

---

## Performance Optimization

### 1. Batch Writes
```javascript
// Instead of multiple updates
const batch = writeBatch(db);
batch.set(doc1, data1);
batch.set(doc2, data2);
await batch.commit();
```

### 2. Pagination
```javascript
// Limit queries
const q = query(collection(db, 'sessions'), limit(10));
```

### 3. Denormalization
- Store user display name in sessions
- Avoid joins
- Trade storage for speed

### 4. Caching
```javascript
// Cache leaderboard for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let leaderboardCache = null;
let cacheTime = 0;

if (Date.now() - cacheTime < CACHE_TTL) {
    return leaderboardCache;
}
```

---

## Cost Estimation

### Free Tier Limits
- **Firestore:**
  - 50K reads/day
  - 20K writes/day
  - 1 GB storage
  
- **Authentication:**
  - Unlimited

### Estimated Usage (1000 users/day)
- **Reads:** ~15K/day
  - Leaderboard: 1K
  - User profiles: 1K
  - Sessions: 3K
  - Daily challenges: 1K
  
- **Writes:** ~8K/day
  - Sessions: 5K
  - User stats: 2K
  - Achievements: 1K

**Cost:** Free tier sufficient

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:**
- Check security rules
- Verify user is authenticated
- Ensure userId matches

### Issue: "Index not found"

**Solution:**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 5-10 minutes for index creation
- Check Firebase Console → Firestore → Indexes

### Issue: Offline persistence not working

**Solution:**
- Check browser support (IndexedDB required)
- Only one tab can have persistence enabled
- Clear browser cache and retry

---

## Next Steps

1. ✅ Firebase project created
2. ✅ Configuration obtained
3. ✅ Modules created
4. ⚪ Enable Authentication methods
5. ⚪ Create Firestore database
6. ⚪ Deploy security rules
7. ⚪ Deploy indexes
8. ⚪ Integrate with game UI
9. ⚪ Test authentication flow
10. ⚪ Test session saving
11. ⚪ Implement leaderboard UI
12. ⚪ Deploy to production

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)

---

**Status:** Firebase modules created and ready for integration. Next: Enable services in Firebase Console and integrate with game UI.
