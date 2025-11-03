# Firebase Functions Deployment Guide

This guide walks through deploying Firebase Cloud Functions for Art of Intent.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project set up
- Gemini API key from Google AI Studio

## Step 1: Install Dependencies

```bash
cd functions
npm install
```

## Step 2: Configure Environment Variables

### Option A: Firebase Functions Config (Recommended for Production)

```bash
# Set Gemini API key
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY_HERE"

# Set Gemini API URL (optional, uses default if not set)
firebase functions:config:set gemini.url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

# Verify configuration
firebase functions:config:get
```

### Option B: .env File (For Local Development)

```bash
cd functions
cp .env.example .env
# Edit .env and add your API key
```

## Step 3: Deploy Firestore Rules

```bash
# Deploy updated Firestore rules (includes dailyWords collection)
firebase deploy --only firestore:rules
```

## Step 4: Deploy Functions

### Deploy All Functions

```bash
firebase deploy --only functions
```

### Deploy Specific Functions

```bash
# Deploy only the haiku generation function
firebase deploy --only functions:artyGenerateHaiku

# Deploy only the daily words function
firebase deploy --only functions:generateDailyWords
```

## Step 5: Verify Deployment

### Check Function URLs

```bash
firebase functions:list
```

You should see:
- `artyGenerateHaiku` (callable)
- `generateDailyWords` (scheduled)

### View Logs

```bash
# View all function logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --follow
```

## Step 6: Test Functions

### Test in Browser

1. Open `test-functions.html` in your browser
2. Click "Sign In Anonymously"
3. Click "Test Generate Haiku"
4. Click "Load Daily Words"

### Test via Console

```javascript
// In browser console on your site
const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
artyGenerateHaiku({
  userPrompt: 'Write about nature',
  systemInstruction: 'You are a haiku bot...',
  sessionId: 'test-123'
}).then(result => console.log(result));
```

## Step 7: Trigger Daily Words Generation

The `generateDailyWords` function runs automatically at 00:00 UTC daily. To trigger it manually:

### Option A: Firebase Console

1. Go to Firebase Console → Functions
2. Find `generateDailyWords`
3. Click "..." → "Trigger function"

### Option B: Firebase CLI

```bash
firebase functions:shell
> generateDailyWords()
```

### Option C: Manually Create Document

```javascript
// In browser console
const db = firebase.firestore();
const dateKey = new Date().toISOString().split('T')[0];

// This will be done automatically by the function, but you can test manually
db.collection('dailyWords').doc(dateKey).set({
  date: dateKey,
  seed: parseInt(dateKey.replace(/-/g, '')),
  targetWords: ['mountain', 'river', 'forest'],
  blacklistWords: ['rain', 'snow', 'wind', 'storm', 'thunder'],
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  version: '1.0'
});
```

## Step 8: Remove Client-Side API Key

Once functions are deployed and tested:

1. Remove `GEMINI_API_KEY` from `src/js/config.js`
2. Remove `GEMINI_API_URL` from `src/js/config.js`
3. Commit changes

```bash
git add src/js/config.js
git commit -m "security: remove Gemini API key from client-side code"
```

## Troubleshooting

### Function Not Found

**Error**: `Function not found: artyGenerateHaiku`

**Solution**:
```bash
# Redeploy functions
firebase deploy --only functions

# Check deployment status
firebase functions:list
```

### Unauthenticated Error

**Error**: `unauthenticated: Must be authenticated to generate haiku`

**Solution**:
- Ensure user is signed in (anonymous or Google)
- Check Firebase Auth is initialized
- Verify auth state: `firebase.auth().currentUser`

### API Key Not Configured

**Error**: `failed-precondition: API configuration error`

**Solution**:
```bash
# Check current config
firebase functions:config:get

# Set API key
firebase functions:config:set gemini.key="YOUR_KEY"

# Redeploy
firebase deploy --only functions
```

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Functions are configured with `cors: true`
- Ensure you're calling from the correct domain
- Check Firebase Console for function region (should be us-central1)

### Daily Words Not Generated

**Issue**: No words in Firestore for today

**Solution**:
1. Check function logs: `firebase functions:log --only generateDailyWords`
2. Manually trigger function (see Step 7)
3. Verify Firestore rules allow reading `dailyWords` collection
4. Check Cloud Scheduler in Google Cloud Console

### Rate Limiting

**Issue**: Too many requests

**Solution**:
- Current limit: 20 requests/minute per user
- Implement client-side caching
- Add exponential backoff for retries

## Monitoring

### Firebase Console

1. Go to Firebase Console → Functions
2. View metrics:
   - Invocations
   - Execution time
   - Memory usage
   - Error rate

### Cloud Logging

```bash
# View logs in Google Cloud Console
gcloud logging read "resource.type=cloud_function" --limit 50
```

### Set Up Alerts

1. Go to Google Cloud Console → Monitoring
2. Create alert policies for:
   - High error rate (> 5%)
   - High latency (> 5s)
   - High invocation count (> 1000/hour)

## Cost Management

### Current Usage

- **artyGenerateHaiku**: ~10K calls/day = 300K/month
- **generateDailyWords**: 1 call/day = 30/month

### Free Tier Limits

- Cloud Functions: 2M invocations/month
- Gemini API: 15 requests/minute, 1M tokens/day

### Monitor Costs

```bash
# View billing in Firebase Console
firebase projects:list

# Check usage
gcloud billing accounts list
```

## Rollback

If issues occur, rollback to previous version:

```bash
# List function versions
firebase functions:list

# Rollback specific function
firebase functions:rollback artyGenerateHaiku --version VERSION_ID
```

Or revert client-side code to use direct API calls temporarily.

## Next Steps

1. ✅ Deploy functions
2. ✅ Test thoroughly
3. ✅ Remove client-side API key
4. ✅ Monitor for 24 hours
5. ✅ Set up alerts
6. ✅ Document any issues

## Support

For issues or questions:
1. Check function logs: `firebase functions:log`
2. Review [FIREBASE_FUNCTIONS_ARCHITECTURE.md](./FIREBASE_FUNCTIONS_ARCHITECTURE.md)
3. Test with [test-functions.html](./test-functions.html)
4. Check Firebase Console for errors
