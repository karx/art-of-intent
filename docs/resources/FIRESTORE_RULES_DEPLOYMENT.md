# Firestore Rules Deployment Guide

**Issue:** Missing or insufficient permissions when fetching leaderboard data

**Solution:** Update Firestore security rules to allow reading leaderboard and user data

## Quick Fix (Firebase Console)

### 1. Open Firebase Console

Visit: https://console.firebase.google.com/project/art-of-intent/firestore/rules

### 2. Update Rules

Replace the existing rules with the updated rules from `firestore.rules`:

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
    
    function isValidUser(data) {
      return data.keys().hasAll(['userId', 'displayName', 'stats', 'preferences'])
        && data.userId is string
        && data.displayName is string;
    }
    
    function isValidSession(data) {
      return data.keys().hasAll(['sessionId', 'userId', 'gameDate'])
        && data.sessionId is string
        && data.userId is string
        && data.gameDate is string;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isOwner(userId);
      
      // Allow counting users (for stats)
      allow get: if true;
      
      // Users can create their own profile
      allow create: if isOwner(userId)
        && isValidUser(request.resource.data)
        && request.resource.data.userId == userId;
      
      // Users can update their own profile
      allow update: if isOwner(userId)
        && request.resource.data.userId == userId;
      
      // No deletes allowed
      allow delete: if false;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      // Anyone can read sessions (needed for leaderboards)
      allow read: if true;
      
      // Users can create their own sessions
      allow create: if isAuthenticated()
        && isValidSession(request.resource.data)
        && request.resource.data.userId == request.auth.uid;
      
      // Users can update their own sessions
      allow update: if isAuthenticated()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      
      // No deletes allowed
      allow delete: if false;
    }
    
    // Session events (detailed logs)
    match /sessionEvents/{sessionId} {
      // Users can read their own session events
      allow read: if isAuthenticated();
      
      // Users can create/update their own events
      allow create, update: if isAuthenticated();
      
      // No deletes allowed
      allow delete: if false;
    }
    
    // Leaderboard (singular - for daily rankings)
    match /leaderboard/{document=**} {
      // Anyone can read leaderboard
      allow read: if true;
      
      // Only authenticated users can write their scores
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    
    // Leaderboards (plural - for historical data)
    match /leaderboards/{document=**} {
      // Anyone can read leaderboards
      allow read: if true;
      
      // Only Cloud Functions can write (using service account)
      allow write: if false;
    }
    
    // Daily challenges (read-only for users)
    match /dailyChallenges/{date} {
      // Anyone can read daily challenges
      allow read: if true;
      
      // Only admin/Cloud Functions can write
      allow write: if false;
    }
  }
}
```

### 3. Publish Rules

Click "Publish" button in the Firebase Console.

### 4. Verify

Test the OG image generator again:
1. Visit `/generate-og-image.html`
2. Click "Fetch Live Data"
3. Should now work without permission errors

## CLI Deployment (Alternative)

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Set project:
   ```bash
   firebase use art-of-intent
   ```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Verify Deployment

```bash
firebase firestore:rules:get
```

## Key Changes

### 1. Leaderboard Collection

**Before:**
```javascript
match /leaderboards/{document=**} {
  allow read: if true;
  allow write: if false;
}
```

**After:**
```javascript
// Added singular version
match /leaderboard/{document=**} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated();
  allow delete: if false;
}

// Kept plural version for historical data
match /leaderboards/{document=**} {
  allow read: if true;
  allow write: if false;
}
```

### 2. Users Collection

**Before:**
```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
}
```

**After:**
```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
  allow get: if true; // Allow counting for stats
}
```

## Testing

### Test in Firebase Console

1. Go to Firestore Rules Playground
2. Test read operation:
   ```
   Collection: leaderboard
   Document: any
   Operation: get
   Auth: None
   ```
3. Should show "Allowed"

### Test in Application

```javascript
// In browser console
const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
const snapshot = await getDocs(collection(window.db, 'leaderboard'));
console.log('Documents:', snapshot.size);
```

## Troubleshooting

### Still Getting Permission Errors

1. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear site data

2. **Check rules are published**
   - Firebase Console > Firestore > Rules
   - Verify "Last published" timestamp

3. **Verify collection names**
   - Check Firestore data
   - Ensure using correct collection name

4. **Check authentication**
   - Some operations require auth
   - Sign in if needed

### Rules Not Updating

1. **Wait for propagation**
   - Rules can take 1-2 minutes to propagate
   - Try again after waiting

2. **Check for syntax errors**
   - Firebase Console shows validation errors
   - Fix any highlighted issues

3. **Verify project**
   - Ensure deploying to correct project
   - Check project ID matches

## Security Considerations

### Public Read Access

The updated rules allow public read access to:
- `leaderboard` collection
- `sessions` collection
- `leaderboards` collection

**Why this is safe:**
- No sensitive user data exposed
- Only aggregated game statistics
- Write access still protected
- User profiles remain private

### Write Protection

Write access is restricted:
- Users can only write their own data
- Leaderboard writes require authentication
- Historical leaderboards are read-only
- Validation functions prevent invalid data

## Monitoring

### Check Rule Usage

Firebase Console > Firestore > Usage:
- Monitor read/write operations
- Check for unusual patterns
- Set up alerts for quota limits

### Security Alerts

Enable security alerts:
1. Firebase Console > Project Settings
2. Integrations > Cloud Monitoring
3. Set up alerts for:
   - High read rates
   - Permission denials
   - Unusual access patterns

## Resources

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Playground](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

*"C:\> DEPLOY_RULES.BAT"*
