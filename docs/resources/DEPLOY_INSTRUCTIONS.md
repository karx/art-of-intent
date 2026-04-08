# Deployment Instructions for Firebase Functions

## Prerequisites

You need to deploy these functions from a machine where you can authenticate with Firebase.

## Option 1: Deploy from Local Machine (Recommended)

### Step 1: Authenticate with Firebase

```bash
firebase login
```

### Step 2: Set Firebase Project

```bash
cd /path/to/art-of-intent
firebase use art-of-intent
```

### Step 3: Set Environment Variables

```bash
firebase functions:config:set \
  gemini.key="AIzaSyCCl_gcHDLqIfORp7ZkP66TscNWUEZ1BU4" \
  gemini.url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
```

### Step 4: Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 5: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy individually
firebase deploy --only functions:artyGenerateHaiku
firebase deploy --only functions:generateDailyWords
```

### Step 6: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 7: Verify Deployment

```bash
# List deployed functions
firebase functions:list

# View logs
firebase functions:log
```

## Option 2: Deploy from CI/CD

### GitHub Actions

Create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Firebase Functions

on:
  push:
    branches: [main]
    paths:
      - 'functions/**'
      - 'firebase.json'
      - 'firestore.rules'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd functions
          npm ci
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions,firestore:rules
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
```

### Generate Firebase Token

```bash
firebase login:ci
```

Add the token to GitHub Secrets as `FIREBASE_TOKEN`.

## Option 3: Manual Deployment via Console

### Upload Function Code

1. Go to [Firebase Console](https://console.firebase.google.com/project/art-of-intent/functions)
2. Click "Create Function"
3. Upload the code from `functions/index.js`
4. Set environment variables:
   - `GEMINI_API_KEY`: `AIzaSyCCl_gcHDLqIfORp7ZkP66TscNWUEZ1BU4`
   - `GEMINI_API_URL`: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

### Configure Scheduled Function

1. Go to [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler?project=art-of-intent)
2. Create job:
   - Name: `generateDailyWords`
   - Frequency: `0 0 * * *` (daily at midnight UTC)
   - Target: Cloud Function `generateDailyWords`
   - Timezone: UTC

## Testing After Deployment

### Test Haiku Generation

Open browser console on your site:

```javascript
const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
artyGenerateHaiku({
  userPrompt: 'Write about mountains',
  systemInstruction: 'You are a haiku bot. Respond only with a haiku.',
  sessionId: 'test-' + Date.now()
}).then(result => {
  console.log('Success:', result.data);
}).catch(error => {
  console.error('Error:', error);
});
```

### Test Daily Words

```javascript
const dateKey = new Date().toISOString().split('T')[0];
firebase.firestore().collection('dailyWords').doc(dateKey).get()
  .then(doc => {
    if (doc.exists) {
      console.log('Daily words:', doc.data());
    } else {
      console.log('No words for today yet');
    }
  });
```

### Manually Trigger Daily Words Generation

```bash
# Using Firebase CLI
firebase functions:shell
> generateDailyWords()

# Or via Cloud Console
# Go to Functions → generateDailyWords → Testing tab → Test the function
```

## Troubleshooting

### Permission Denied Errors

The service account needs these roles:
- Cloud Functions Admin
- Cloud Scheduler Admin
- Service Usage Consumer
- Artifact Registry Administrator

Grant roles in [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=art-of-intent).

### Function Not Found

```bash
# Redeploy
firebase deploy --only functions

# Check status
firebase functions:list
```

### Environment Variables Not Set

```bash
# Check current config
firebase functions:config:get

# Set missing variables
firebase functions:config:set gemini.key="YOUR_KEY"

# Redeploy after config change
firebase deploy --only functions
```

## Verification Checklist

- [ ] Functions deployed successfully
- [ ] Environment variables set
- [ ] Firestore rules deployed
- [ ] Test haiku generation works
- [ ] Test daily words loading works
- [ ] Scheduled function configured
- [ ] Logs show no errors
- [ ] Remove API key from client-side code

## Next Steps After Deployment

1. **Test thoroughly** using test-functions.html
2. **Monitor logs** for 24 hours: `firebase functions:log --follow`
3. **Remove client-side API key** from src/js/config.js
4. **Set up monitoring alerts** in Firebase Console
5. **Document any issues** in MIGRATION_SUMMARY.md

## Support

If you encounter issues:
1. Check function logs: `firebase functions:log`
2. Verify environment variables: `firebase functions:config:get`
3. Test with test-functions.html
4. Check Firebase Console for detailed errors
