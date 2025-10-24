# Firebase Setup Guide

## Quick Start - Enable Firebase Services

### ✅ Step 1: Firebase Project Created
- Project: `art-of-intent`
- Project ID: `art-of-intent`
- Web App Created ✅
- Configuration Added ✅

---

### 📋 Step 2: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **art-of-intent**
3. Click **Authentication** in left sidebar
4. Click **Get Started**
5. Go to **Sign-in method** tab

#### Enable Anonymous Authentication
1. Click **Anonymous**
2. Toggle **Enable**
3. Click **Save**

#### Enable Google Sign-In
1. Click **Google**
2. Toggle **Enable**
3. Enter **Project support email**: your-email@example.com
4. Click **Save**

**Status:** ⚪ Pending

---

### 💾 Step 3: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **art-of-intent**
3. Click **Firestore Database** in left sidebar
4. Click **Create database**

#### Database Settings
- **Mode:** Start in **production mode**
- **Location:** `us-central1` (or closest to your users)
- Click **Enable**

**Status:** ⚪ Pending

---

### 🔒 Step 4: Deploy Security Rules

#### Option A: Using Firebase Console

1. Go to **Firestore Database** → **Rules** tab
2. Copy content from `firestore.rules` file
3. Paste into the rules editor
4. Click **Publish**

#### Option B: Using Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Use existing project: art-of-intent

# Deploy rules
firebase deploy --only firestore:rules
```

**Status:** ⚪ Pending

---

### 📊 Step 5: Deploy Database Indexes

#### Option A: Using Firebase Console

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Add Index**
3. Create each index from `firestore.indexes.json`:

**Index 1: User Sessions**
- Collection: `sessions`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Index 2: Daily Sessions**
- Collection: `sessions`
- Fields:
  - `userId` (Ascending)
  - `gameDate` (Descending)

**Index 3: Leaderboard**
- Collection: `sessions`
- Fields:
  - `gameDate` (Ascending)
  - `efficiencyScore` (Ascending)

**Index 4: Daily Leaderboard (Complex)**
- Collection: `sessions`
- Fields:
  - `gameDate` (Ascending)
  - `status` (Ascending)
  - `result` (Ascending)
  - `efficiencyScore` (Ascending)

**Index 5: Public Leaderboard**
- Collection: `sessions`
- Fields:
  - `isPublic` (Ascending)
  - `gameDate` (Ascending)
  - `efficiencyScore` (Ascending)

#### Option B: Using Firebase CLI

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Wait 5-10 minutes for indexes to build
```

**Status:** ⚪ Pending

---

### 🧪 Step 6: Test the Integration

#### Test Authentication

1. Open the game: http://localhost:8000
2. Open browser console (F12)
3. Click **"Sign in with Google"**
4. Complete OAuth flow
5. Check console for: `✅ Google sign-in successful`
6. Verify user info appears in header

#### Test Anonymous Auth

1. Click **"Play as Guest"**
2. Check console for: `✅ Anonymous sign-in successful`
3. Verify game starts

#### Test Firestore

1. Play a complete game
2. Check console for: `✅ Game saved to Firestore`
3. Go to Firebase Console → Firestore Database
4. Verify collections created:
   - `users` (with your user document)
   - `sessions` (with game session)

#### Test Sign Out

1. Click **"Sign Out"**
2. Check console for: `✅ Sign-out successful`
3. Verify auth buttons reappear

**Status:** ⚪ Pending

---

### 🔍 Step 7: Verify in Firebase Console

#### Check Authentication
1. Go to **Authentication** → **Users** tab
2. Verify your user appears
3. Check user UID matches console logs

#### Check Firestore Data
1. Go to **Firestore Database** → **Data** tab
2. Verify collections:
   - `users/{userId}` - Your profile
   - `sessions/{sessionId}` - Game sessions

#### Check Analytics (Optional)
1. Go to **Analytics** → **Dashboard**
2. Verify events are being tracked

---

## Troubleshooting

### Issue: "Firebase not defined"

**Solution:**
- Check browser console for module loading errors
- Verify Firebase CDN URLs are accessible
- Clear browser cache and reload

### Issue: "Missing or insufficient permissions"

**Solution:**
- Verify security rules are deployed
- Check user is authenticated
- Ensure userId matches in requests

### Issue: "Index not found"

**Solution:**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 5-10 minutes for index creation
- Check Firebase Console → Firestore → Indexes tab

### Issue: Google Sign-In popup blocked

**Solution:**
- Allow popups for your domain
- Try again
- Check browser console for errors

### Issue: "Auth domain not authorized"

**Solution:**
- Go to Firebase Console → Authentication → Settings
- Add your domain to **Authorized domains**
- For local development, `localhost` should be pre-authorized

---

## Configuration Checklist

- [x] Firebase project created
- [x] Web app configured
- [x] Configuration added to code
- [ ] Authentication enabled (Anonymous + Google)
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Database indexes deployed
- [ ] Authentication tested
- [ ] Firestore save tested
- [ ] Sign out tested

---

## Firebase Console Links

- **Project Overview:** https://console.firebase.google.com/project/art-of-intent
- **Authentication:** https://console.firebase.google.com/project/art-of-intent/authentication
- **Firestore:** https://console.firebase.google.com/project/art-of-intent/firestore
- **Analytics:** https://console.firebase.google.com/project/art-of-intent/analytics

---

## Next Steps After Setup

1. ✅ Test authentication flow
2. ✅ Verify data is saving to Firestore
3. ⚪ Implement leaderboard UI
4. ⚪ Add user profile page
5. ⚪ Implement session history view
6. ⚪ Add achievement notifications
7. ⚪ Deploy to production

---

## Production Deployment

### Before Deploying

1. **Update Firebase config** in `firebase-config.js` if needed
2. **Test all features** locally
3. **Verify security rules** are restrictive
4. **Check indexes** are created
5. **Test on multiple browsers**

### Deploy Steps

1. Build production assets
2. Deploy to Firebase Hosting (optional):
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```
3. Or deploy to your preferred hosting service
4. **Add production domain** to Firebase authorized domains
5. **Test on production** URL

---

## Support

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firebase Console:** https://console.firebase.google.com/
- **Stack Overflow:** https://stackoverflow.com/questions/tagged/firebase

---

**Current Status:** Firebase modules integrated, UI ready, awaiting service enablement in Firebase Console.
