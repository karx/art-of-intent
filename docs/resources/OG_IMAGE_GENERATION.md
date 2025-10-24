# OG Image Generation Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-24

## Overview

Guide for generating Open Graph images for Art of Intent using the leaderboard card generator.

## Quick Start

### 1. Open Generator

Navigate to:
```
http://localhost:8000/generate-og-image.html
```

Or on production:
```
https://art-of-intent.netlify.app/generate-og-image.html
```

### 2. Check Firebase Status

Look for the Firebase Status indicator:
- ✅ **Connected** - Live data available
- ⚠️ **Not connected** - Mock data only

### 3. Load Data

**Option A: Mock Data (Recommended for testing)**
1. Click "Use Mock Data"
2. Data appears in the display area
3. "Generate Image" button becomes enabled

**Option B: Live Data (Requires Firebase)**
1. Ensure Firebase Status shows "Connected"
2. Click "Fetch Live Data"
3. Wait for data to load
4. Check data in display area

### 4. Generate Image

1. Click "Generate Image"
2. Preview appears below
3. "Download PNG" and "Preview" buttons become enabled

### 5. Download

1. Click "Download PNG"
2. File saves as `art-of-intent-leaderboard.png`
3. Replace `src/assets/og_image.png` with downloaded file

## Firebase Connection

### Requirements

For live data fetching, you need:
1. Firebase project configured
2. `src/js/firebase-config.js` with valid credentials
3. Firestore database with data
4. Proper security rules

### Troubleshooting Firebase

**Issue: Firebase Status shows "Not connected"**

**Causes:**
1. Firebase config not loaded
2. Invalid credentials
3. Network issues
4. CORS restrictions

**Solutions:**

1. **Check Firebase Config**
   ```javascript
   // Open browser console
   console.log(window.db);
   // Should show Firestore instance, not undefined
   ```

2. **Verify Credentials**
   - Check `src/js/firebase-config.js`
   - Ensure API key is valid
   - Verify project ID is correct

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for Firebase errors
   - Check Network tab for failed requests

4. **Test Firebase Connection**
   ```javascript
   // In browser console
   import { db } from './src/js/firebase-config.js';
   console.log('DB:', db);
   ```

### Firestore Data Structure

For live data to work, your Firestore needs:

**Collections:**

1. **leaderboard**
   ```javascript
   {
     date: "2025-01-24",
     userName: "PLAYER_ONE",
     tokens: 187,
     attempts: 4,
     efficiency: 46.8,
     duration: 154, // seconds
     score: 187 // lower is better
   }
   ```

2. **users**
   ```javascript
   {
     uid: "user123",
     displayName: "PLAYER_ONE",
     email: "player@example.com"
   }
   ```

3. **sessions**
   ```javascript
   {
     date: "2025-01-24",
     totalTokens: 187,
     attempts: 4,
     isWin: true,
     lastActivity: Timestamp
   }
   ```

### Security Rules

Ensure your Firestore rules allow reading:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading leaderboard
    match /leaderboard/{document} {
      allow read: if true;
    }
    
    // Allow counting users
    match /users/{document} {
      allow read: if true;
    }
    
    // Allow reading sessions for stats
    match /sessions/{document} {
      allow read: if true;
    }
  }
}
```

## Mock Data

When Firebase is unavailable, the generator uses mock data:

```javascript
{
  date: "2025-01-24",
  topPlayers: [
    {
      rank: 1,
      name: "PLAYER_ONE",
      tokens: 187,
      attempts: 4,
      efficiency: 46.8,
      time: "02:34"
    }
    // ... 4 more players
  ],
  stats: {
    totalPlayers: 1247,
    gamesToday: 342,
    activeNow: 89,
    winRate: 67,
    avgTokens: 234,
    avgAttempts: 5.8
  }
}
```

## Command Line Generation

For automated generation:

```bash
# Generate SVG (Node.js)
npm run generate:og

# Output: src/assets/og_image.svg
```

**Note:** PNG generation requires browser environment (Canvas API).

## Deployment

### Manual Process

1. Generate image using web interface
2. Download PNG
3. Replace `src/assets/og_image.png`
4. Commit and push
5. Deploy to hosting

### Automated Process (Future)

```javascript
// Serverless function (e.g., Netlify Function)
exports.handler = async (event, context) => {
  const data = await fetchLeaderboardData();
  const svg = leaderboardCardGenerator.generateSVG(data);
  const png = await svgToPNG(svg);
  
  // Upload to CDN
  await uploadToStorage(png, 'og_image.png');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

## Troubleshooting

### Common Issues

#### 1. "Fetch Live Data" Does Nothing

**Symptoms:**
- Button click has no effect
- No error messages
- Status doesn't change

**Solutions:**
- Check browser console for errors
- Verify Firebase is initialized
- Check network tab for failed requests
- Try mock data instead

#### 2. Data Loads But Shows Empty Players

**Symptoms:**
- Data loads successfully
- "No players yet" message in preview
- Stats show zeros

**Solutions:**
- Check Firestore has data for today
- Verify date format matches (YYYY-MM-DD)
- Check leaderboard collection exists
- Verify query permissions

#### 3. Image Generation Fails

**Symptoms:**
- "Generate Image" button doesn't work
- Preview doesn't appear
- Console shows errors

**Solutions:**
- Check data is loaded
- Verify SVG generation in console
- Check for JavaScript errors
- Try refreshing page

#### 4. Download Doesn't Work

**Symptoms:**
- "Download PNG" button doesn't respond
- No file downloads
- Browser blocks download

**Solutions:**
- Check browser download permissions
- Disable popup blockers
- Try different browser
- Check console for Canvas errors

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

This will log:
- Firebase initialization
- Data fetching steps
- SVG generation
- PNG conversion

## Best Practices

### 1. Regular Updates

Update OG image:
- **Daily** - For active leaderboards
- **Weekly** - For stable games
- **On demand** - For special events

### 2. Image Quality

- Use PNG format (not JPEG)
- Maintain 1200x630px dimensions
- Keep file size under 1MB
- Test on multiple platforms

### 3. Data Validation

Before generating:
- Verify data is current
- Check player names are appropriate
- Ensure stats are accurate
- Test preview thoroughly

### 4. Backup

Always keep backup:
- `src/assets/og_image_backup.png`
- Previous versions in git history
- Test images before deploying

## Testing

### Test Checklist

- [ ] Firebase status indicator works
- [ ] Mock data loads correctly
- [ ] Live data fetches (if available)
- [ ] Image generates without errors
- [ ] Preview displays properly
- [ ] Download works
- [ ] File size is reasonable
- [ ] Image looks correct on social media

### Social Media Testing

Test OG image on:
1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
4. **Discord**: Share link in test server

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## Support

If you encounter issues:

1. Check this guide
2. Review browser console
3. Test with mock data
4. Check Firebase status
5. Verify Firestore data
6. Contact support

---

*"C:\> GENERATE_OG_IMAGE.EXE --help"*
