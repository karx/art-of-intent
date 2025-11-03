# Art of Intent - Firebase Cloud Functions

This directory contains Firebase Cloud Functions for Art of Intent.

## Functions

### 1. `artyGenerateHaiku`
**Type**: HTTPS Callable Function  
**Purpose**: Generate haiku responses via Gemini API without exposing API keys to client

**Usage**:
```javascript
const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
const result = await artyGenerateHaiku({
  userPrompt: 'Write about nature',
  systemInstruction: 'You are a haiku bot...',
  sessionId: 'session-123'
});
```

### 2. `generateDailyWords`
**Type**: Scheduled Function  
**Purpose**: Generate daily target and blacklist words at 00:00 UTC

**Schedule**: `0 0 * * *` (daily at midnight UTC)

## Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Environment Variables
```bash
# Set Gemini API key
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# Or use .env file for local development
cp .env.example .env
# Edit .env and add your API key
```

### 3. Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:artyGenerateHaiku
firebase deploy --only functions:generateDailyWords
```

## Local Development

### Start Emulators
```bash
firebase emulators:start --only functions,firestore
```

### Test Functions Locally
```bash
# In browser console
const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
artyGenerateHaiku({
  userPrompt: 'test',
  systemInstruction: 'test'
}).then(console.log);
```

## Monitoring

### View Logs
```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only artyGenerateHaiku

# Follow logs in real-time
firebase functions:log --follow
```

### Metrics
Monitor in Firebase Console:
- Invocations per day
- Execution time
- Error rate
- Memory usage

## Security

- API keys are stored in Firebase Functions config (not in code)
- Rate limiting: 20 requests per minute per user
- Input validation: max prompt length 500 chars
- Authentication required for all callable functions
- Firestore rules prevent direct writes to dailyWords collection

## Cost Estimation

### Cloud Functions
- **Free Tier**: 2M invocations/month
- **Estimated Usage**: ~10K calls/day = 300K/month (within free tier)

### Gemini API
- **Free Tier**: 15 requests/minute, 1M tokens/day
- **Estimated Usage**: Well within free tier for typical usage

## Troubleshooting

### Function not found
```bash
# Redeploy functions
firebase deploy --only functions
```

### API key not configured
```bash
# Check config
firebase functions:config:get

# Set config
firebase functions:config:set gemini.key="YOUR_KEY"
```

### CORS errors
- Functions are configured with `cors: true`
- Check Firebase Console for function URL
- Verify client is using correct region (us-central1)

## Documentation

See [FIREBASE_FUNCTIONS_ARCHITECTURE.md](../FIREBASE_FUNCTIONS_ARCHITECTURE.md) for detailed architecture documentation.
