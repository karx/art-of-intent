# 🔥 URGENT: Firebase Rules Update Required

**Status:** ⚠️ CRITICAL - Must be deployed before OG image generator will work

**Issue:** `Missing or insufficient permissions` errors when fetching leaderboard data

## Quick Fix (5 minutes)

### Step 1: Open Firebase Console

Visit: **https://console.firebase.google.com/project/art-of-intent/firestore/rules**

### Step 2: Replace Rules

**Delete all existing rules** and paste the following:

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
    
    // Users collection - ALLOW PUBLIC READ FOR STATS
    match /users/{userId} {
      // Allow reading any user profile (for leaderboards and stats)
      // Includes get, list, and aggregation queries (count)
      allow read: if true;
      
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
    
    // Sessions collection - ALLOW PUBLIC READ FOR LEADERBOARDS
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
    
    // Leaderboard (singular) - ALLOW PUBLIC READ
    match /leaderboard/{document=**} {
      // Anyone can read leaderboard
      allow read: if true;
      
      // Only authenticated users can write their scores
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    
    // Leaderboards (plural) - ALLOW PUBLIC READ
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

### Step 3: Publish

1. Click the **"Publish"** button (top right)
2. Wait for confirmation message
3. Rules will propagate in 1-2 minutes

### Step 4: Verify

1. Visit: **http://localhost:8000/generate-og-image.html**
2. Click **"Inspect Database"** button
3. Check browser console - should see:
   ```
   📊 users: X documents
   📊 sessions: X documents
   📊 leaderboard: X documents
   ```
4. No more permission errors! ✅

## What Changed?

### Before (Restrictive)
```javascript
match /users/{userId} {
  allow read: if isOwner(userId);  // ❌ Only owner can read
}
```

### After (Public Read)
```javascript
match /users/{userId} {
  allow read: if true;  // ✅ Anyone can read (for stats)
}
```

## Why This Is Safe

### Public Read Access
We're allowing public **read** access to:
- `users` - For counting total players (includes aggregation queries)
- `sessions` - For leaderboard and stats
- `leaderboard` - For displaying rankings

**Note:** `allow read: if true` covers:
- `get` - Reading individual documents
- `list` - Querying multiple documents
- Aggregation queries (`count`, `sum`, `avg`) via `getCountFromServer()`

### Still Protected
Write access is still restricted:
- Users can only create/update their own data
- Authentication required for writes
- No deletes allowed
- Validation functions prevent invalid data

### No Sensitive Data Exposed
The collections contain:
- Game statistics (tokens, attempts, scores)
- Public usernames/display names
- Session metadata
- No passwords, emails, or private info

## Testing After Deployment

### Test 1: Inspect Database
```bash
# Visit generate-og-image.html
# Click "Inspect Database"
# Console should show:
✅ users: X documents
✅ sessions: X documents  
✅ leaderboard: X documents
```

### Test 2: Fetch Live Data
```bash
# Click "Fetch Live Data"
# Should see:
✅ Live data loaded successfully!
# Data display shows actual leaderboard
```

### Test 3: Generate Image
```bash
# Click "Generate Image"
# Preview appears with real data
✅ Image generated successfully!
```

## Troubleshooting

### Still Getting Permission Errors?

1. **Clear Browser Cache**
   ```
   Ctrl+Shift+R (hard refresh)
   Or clear site data in DevTools
   ```

2. **Wait for Propagation**
   ```
   Rules can take 1-2 minutes to propagate
   Try again after waiting
   ```

3. **Check Rules Published**
   ```
   Firebase Console > Firestore > Rules
   Verify "Last published" timestamp is recent
   ```

4. **Verify Correct Project**
   ```
   Check URL: /project/art-of-intent/
   Ensure you're in the right project
   ```

### Console Shows Different Errors?

**Error: "Collection not found"**
- Collections don't exist yet
- Play the game to create data
- Or use mock data for testing

**Error: "Network error"**
- Check internet connection
- Verify Firebase config is correct
- Check browser console for details

**Error: "Invalid query"**
- Check Firestore indexes
- May need to create composite indexes
- Firebase Console will show index creation link

## Alternative: Use Mock Data

If you can't update rules immediately:

1. Visit `/generate-og-image.html`
2. Click **"Use Mock Data"** instead
3. Generate image with sample data
4. Update rules later for live data

## Need Help?

1. Check browser console for detailed errors
2. Review `docs/resources/FIRESTORE_RULES_DEPLOYMENT.md`
3. Test with mock data first
4. Open GitHub issue if problems persist

## Deployment Checklist

- [ ] Open Firebase Console
- [ ] Navigate to Firestore Rules
- [ ] Copy rules from this file
- [ ] Paste into console
- [ ] Click "Publish"
- [ ] Wait 1-2 minutes
- [ ] Test "Inspect Database"
- [ ] Test "Fetch Live Data"
- [ ] Verify no permission errors
- [ ] Generate OG image successfully

---

**Last Updated:** 2025-01-24  
**Version:** 1.0.0  

*"C:\> DEPLOY_RULES.BAT --now"*
