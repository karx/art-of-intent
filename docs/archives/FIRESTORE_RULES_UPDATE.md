# Firestore Rules Update
## Fix Leaderboard Permissions

---

## Issue

Leaderboard was failing with error:
```
FirebaseError: Missing or insufficient permissions
```

## Root Cause

The `sessions` collection rules only allowed users to read their own sessions:
```javascript
allow read: if isAuthenticated() 
  && resource.data.userId == request.auth.uid;
```

This prevented the leaderboard from querying all sessions to build rankings.

## Solution

Updated rules to allow public read access to sessions (needed for leaderboards):
```javascript
// Anyone can read sessions (needed for leaderboards)
allow read: if true;
```

## Security Considerations

### What's Exposed
- Session metadata (attempts, tokens, success/failure)
- Game date
- User ID (but not personal info)
- Timestamps

### What's Protected
- User profiles (still private)
- Personal information (email, name)
- Session events (detailed logs)
- Write access (only session owner can create/update)

### Why This Is Safe
1. **No Personal Data**: Sessions don't contain email, name, or sensitive info
2. **Game Data Only**: Only game statistics are visible
3. **Anonymous Friendly**: Works with anonymous users
4. **Standard Practice**: Leaderboards typically show public game data
5. **Write Protection**: Users can only create/update their own sessions

## Deployment

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `art-of-intent`
3. Navigate to **Firestore Database** → **Rules**
4. Copy contents from `firestore.rules`
5. Click **Publish**

### Option 2: Firebase CLI
```bash
firebase deploy --only firestore:rules
```

## Testing

After deploying rules:
1. Open game in browser
2. Click "Leaderboard" button
3. Verify data loads without errors
4. Check all three tabs: Daily, Weekly, All-Time
5. Verify current user is highlighted
6. Test with both authenticated and anonymous users

## Alternative Approach (More Restrictive)

If you want to keep sessions more private, you could:

1. **Create a separate leaderboards collection**
   - Cloud Function writes to it after each game
   - Only contains public leaderboard data
   - Sessions remain private

2. **Use Cloud Functions for queries**
   - Frontend calls Cloud Function
   - Function has admin access to read all sessions
   - Returns only leaderboard data

3. **Implement field-level security**
   - Allow reading only specific fields
   - Hide sensitive fields from public queries

## Current Rules Summary

### Public Read Access
- ✅ Sessions (for leaderboards)
- ✅ Leaderboards collection
- ✅ Daily challenges

### Private (Owner Only)
- 🔒 User profiles
- 🔒 Session events (detailed logs)

### Write Access
- ✅ Users can create/update their own sessions
- ✅ Users can create/update their own profiles
- ❌ No one can delete (data preservation)
- ❌ Only Cloud Functions can write to leaderboards

---

## Files Modified

- `firestore.rules` - Updated sessions read rule

---

*Last Updated: 2025-01-24*
