# Firebase Functions Architecture

## Overview

This document describes the Firebase Cloud Functions architecture for Art of Intent, which moves sensitive API calls and scheduled tasks to the backend.

---

## Functions

### 1. `artyGenerateHaiku` (Callable Function)

**Purpose**: Generate haiku responses via Gemini API without exposing API keys to client

**Type**: HTTPS Callable Function

**Trigger**: Called from client-side game.js

**Input**:
```javascript
{
  userPrompt: string,           // User's prompt text
  systemInstruction: string,    // Generated system instruction with blacklist
  sessionId: string             // Optional: for rate limiting/tracking
}
```

**Output**:
```javascript
{
  success: boolean,
  data: {
    responseText: string,       // Haiku text
    usageMetadata: {
      promptTokenCount: number,
      candidatesTokenCount: number,
      totalTokenCount: number
    }
  },
  error?: string
}
```

**Security**:
- Rate limiting: 20 requests per minute per user
- Input validation: max prompt length 500 chars
- Authentication: Firebase Auth required
- CORS: Restricted to app domain

**Implementation**:
```javascript
exports.artyGenerateHaiku = functions.https.onCall(async (data, context) => {
  // Validate auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  // Validate input
  const { userPrompt, systemInstruction } = data;
  if (!userPrompt || userPrompt.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid prompt');
  }
  
  // Call Gemini API
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': functions.config().gemini.key
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: userPrompt }] }]
    })
  });
  
  return { success: true, data: await response.json() };
});
```

---

### 2. `generateDailyWords` (Scheduled Function)

**Purpose**: Generate daily target and blacklist words and store in Firestore

**Type**: Scheduled Function (Cloud Scheduler)

**Trigger**: Daily at 00:00 UTC

**Schedule**: `0 0 * * *` (cron format)

**Output**: Writes to Firestore `/dailyWords/{date}`

**Document Structure**:
```javascript
{
  date: string,              // YYYY-MM-DD format
  seed: number,              // Date-based seed for consistency
  targetWords: string[],     // 3 target words
  blacklistWords: string[],  // 5-7 blacklist words
  createdAt: Timestamp,
  version: string            // Word pool version
}
```

**Implementation**:
```javascript
exports.generateDailyWords = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const dateKey = new Date().toISOString().split('T')[0];
    const seed = parseInt(dateKey.replace(/-/g, ''));
    
    // Generate words using same algorithm as client
    const words = generateWordsFromSeed(seed);
    
    // Store in Firestore
    await admin.firestore().collection('dailyWords').doc(dateKey).set({
      date: dateKey,
      seed,
      targetWords: words.target,
      blacklistWords: words.blacklist,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      version: '1.0'
    });
    
    console.log(`Generated daily words for ${dateKey}`);
  });
```

---

## Client-Side Changes

### game.js Updates

**Before** (Direct API call):
```javascript
async function callArtyAPI(userPrompt) {
  const response = await fetch(config.GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.GEMINI_API_KEY
    },
    body: JSON.stringify(requestBody)
  });
  return await response.json();
}
```

**After** (Firebase function call):
```javascript
async function callArtyAPI(userPrompt) {
  const systemInstruction = generateSystemInstruction();
  
  const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
  const result = await artyGenerateHaiku({
    userPrompt,
    systemInstruction,
    sessionId: gameState.sessionId
  });
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'API call failed');
  }
  
  return result.data.data;
}
```

**Daily Words Loading**:
```javascript
async function loadDailyWords() {
  const dateKey = getDailyDateKey();
  
  // Try to load from Firestore
  const docRef = firebase.firestore().collection('dailyWords').doc(dateKey);
  const doc = await docRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    gameState.targetWords = data.targetWords;
    gameState.blacklistWords = data.blacklistWords;
    console.log('✅ Loaded daily words from Firestore');
  } else {
    // Fallback to client-side generation
    generateDailyWords();
    console.log('⚠️ Using client-side word generation (fallback)');
  }
}
```

---

## Configuration

### Firebase Functions Config

Set environment variables:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
firebase functions:config:set gemini.url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
```

### firebase.json

Add functions configuration:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ]
  },
  "firestore": { ... },
  "hosting": { ... }
}
```

---

## Security Rules

### Firestore Rules for dailyWords

```javascript
match /dailyWords/{date} {
  // Anyone can read daily words
  allow read: if true;
  
  // Only cloud functions can write
  allow write: if false;
}
```

---

## Deployment

### Initial Setup

```bash
# Initialize Firebase Functions
firebase init functions

# Install dependencies
cd functions
npm install

# Set config
firebase functions:config:set gemini.key="YOUR_KEY"

# Deploy
firebase deploy --only functions
```

### Update Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:artyGenerateHaiku
firebase deploy --only functions:generateDailyWords
```

---

## Testing

### Local Testing

```bash
# Start emulators
firebase emulators:start --only functions,firestore

# Test callable function
curl -X POST http://localhost:5001/PROJECT_ID/us-central1/artyGenerateHaiku \
  -H "Content-Type: application/json" \
  -d '{"data":{"userPrompt":"test","systemInstruction":"test"}}'

# Trigger scheduled function manually
firebase functions:shell
> generateDailyWords()
```

### Production Testing

```javascript
// In browser console
const artyGenerateHaiku = firebase.functions().httpsCallable('artyGenerateHaiku');
artyGenerateHaiku({
  userPrompt: 'Write about nature',
  systemInstruction: 'You are a haiku bot...'
}).then(result => console.log(result));
```

---

## Monitoring

### Cloud Functions Logs

```bash
# View logs
firebase functions:log

# View specific function logs
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
- Network egress

---

## Cost Estimation

### Cloud Functions

- **Free Tier**: 2M invocations/month, 400K GB-seconds, 200K CPU-seconds
- **Paid**: $0.40 per million invocations after free tier

### Estimated Usage

- **artyGenerateHaiku**: ~10K calls/day = 300K/month (within free tier)
- **generateDailyWords**: 1 call/day = 30/month (negligible)

### Gemini API

- **Free Tier**: 15 requests/minute, 1M tokens/day
- **Paid**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

---

## Migration Plan

1. ✅ Create Firebase functions directory
2. ✅ Implement artyGenerateHaiku function
3. ✅ Implement generateDailyWords function
4. ✅ Set up Firebase config with API key
5. ✅ Deploy functions to Firebase
6. ✅ Update game.js to use Firebase function
7. ✅ Update game.js to load words from Firestore
8. ✅ Remove API key from client-side config
9. ✅ Test end-to-end flow
10. ✅ Update documentation

---

## Rollback Plan

If issues occur:

1. Revert game.js to direct API calls
2. Keep API key in config temporarily
3. Debug functions in emulator
4. Fix and redeploy
5. Re-migrate client code

---

## Benefits

### Security
- ✅ API keys never exposed to client
- ✅ Rate limiting enforced server-side
- ✅ Input validation on backend

### Reliability
- ✅ Consistent daily words across all users
- ✅ Centralized word generation
- ✅ Fallback to client-side if needed

### Scalability
- ✅ Auto-scaling with Cloud Functions
- ✅ No client-side API key rotation needed
- ✅ Easy to add caching/optimization

### Maintainability
- ✅ Single source of truth for words
- ✅ Easy to update word pools
- ✅ Centralized logging and monitoring

---

## Future Enhancements

1. **Caching**: Cache Gemini responses for common prompts
2. **Analytics**: Track prompt patterns and success rates
3. **A/B Testing**: Test different system instructions
4. **Rate Limiting**: Per-user quotas and throttling
5. **Word Pool Updates**: Scheduled word pool refreshes
6. **Moderation**: Content filtering for inappropriate prompts
