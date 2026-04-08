# Deployment - Next Steps

## Current Status

✅ **APIs Enabled** (as you confirmed)
- Cloud Functions API
- Cloud Build API
- Artifact Registry API

⏳ **Service Account Permissions** (needs your action)
- Service account: `firebase-adminsdk-1whdc@art-of-intent.iam.gserviceaccount.com`
- Missing IAM roles for deployment

✅ **Code Ready**
- Functions implemented and tested
- Daily words already in Firestore
- Gemini API working

## What You Need to Do

### Option 1: Grant Service Account Permissions (5 minutes)

**Quick Steps**:
1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=art-of-intent)
2. Find service account: `firebase-adminsdk-1whdc@art-of-intent.iam.gserviceaccount.com`
3. Click Edit (pencil icon)
4. Add role: **Firebase Admin** (`roles/firebase.admin`)
   - OR add individual roles (see GRANT_PERMISSIONS.md)
5. Click Save
6. Wait 1-2 minutes for changes to propagate
7. Tell me "permissions granted" and I'll retry deployment

**Detailed Guide**: See [GRANT_PERMISSIONS.md](./GRANT_PERMISSIONS.md)

### Option 2: Deploy from Your Local Machine (10 minutes)

**Steps**:
```bash
# Pull latest code
git pull origin main

# Authenticate
firebase login

# Deploy
firebase deploy --only functions,firestore:rules

# Test
# Open test-functions.html in browser
```

This bypasses the service account permission issue entirely.

## After Deployment

Once functions are deployed (via either option):

1. **Test Functions**
   - Open `test-functions.html`
   - Sign in anonymously
   - Test haiku generation
   - Test daily words loading

2. **Verify in Console**
   ```bash
   firebase functions:list
   firebase functions:log
   ```

3. **Remove Client-Side API Key**
   - Edit `src/js/config.js`
   - Remove `GEMINI_API_KEY` and `GEMINI_API_URL`
   - Commit changes

4. **Push to Main**
   - All changes verified
   - Ready to push

## What's Already Working

Even without function deployment, you can test:

### Daily Words Loading

Open browser console on your site:
```javascript
firebase.firestore().collection('dailyWords').doc('2025-11-03').get()
  .then(doc => console.log('Daily words:', doc.data()));
```

Expected output:
```javascript
{
  date: '2025-11-03',
  targetWords: ['flame', 'dawn', 'mist'],
  blacklistWords: ['petal', 'sunset', 'bear', 'summer', 'sunrise', 'bird']
}
```

This proves Firestore integration is working!

## Files Ready to Push (After Verification)

```
functions/index.js              # Updated with database ID
manual-deploy-words.cjs         # Manual deployment script
DEPLOYMENT_PROGRESS.md          # Status report
GRANT_PERMISSIONS.md            # Permission guide
DEPLOYMENT_NEXT_STEPS.md        # This file
```

## Recommendation

**Grant the service account permissions** (Option 1) - it's faster and allows deployment from Gitpod.

Just add the **Firebase Admin** role to the service account and we can deploy immediately.

## Questions?

Let me know:
- "permissions granted" - I'll retry deployment
- "deploying locally" - I'll wait for your confirmation
- "need help" - I'll provide more guidance
