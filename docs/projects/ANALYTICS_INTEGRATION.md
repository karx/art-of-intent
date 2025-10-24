# Analytics Integration Guide

## Quick Start (5 minutes)

### Step 1: Add Analytics Script to HTML

Add to `index.html` before closing `</body>` tag:

```html
<!-- Analytics -->
<script type="module">
    import { initAnalytics } from './src/js/analytics.js';
    initAnalytics();
</script>
```

### Step 2: Update game.js to Use Analytics

Replace the existing `trackEvent` function in `game.js`:

```javascript
// At the top of game.js
import { GameAnalytics, UserAnalytics } from './analytics.js';

// Replace existing trackEvent calls:

// Game start
GameAnalytics.gameStart(gameState.gameDate);

// Prompt submission
GameAnalytics.promptSubmit(prompt.length, tokenCount);

// Blacklist violation
GameAnalytics.blacklistViolation(word, gameState.attempts);

// Target hit
GameAnalytics.targetHit(word, gameState.attempts);

// Game complete
GameAnalytics.gameComplete(result, {
    totalTokens: gameState.totalTokens,
    attempts: gameState.attempts,
    duration: gameState.duration,
    efficiency: gameState.efficiency
});

// API error
GameAnalytics.apiError(errorType, error.message);

// Share click
UserAnalytics.shareClick('native'); // or 'copy', 'download'

// Leaderboard view
UserAnalytics.leaderboardView('daily'); // or 'weekly', 'all-time'
```

### Step 3: Test Analytics

1. Open browser DevTools Console
2. Play the game
3. Look for `📊 Analytics Event:` logs
4. Check Firebase Console after 24 hours for data

## What Gets Tracked

### Automatic Events
- ✅ Page views
- ✅ Web Vitals (LCP, FID, CLS, TTFB, INP)
- ✅ JavaScript errors
- ✅ UTM campaign parameters

### Game Events
- `game_start` - User starts a new game
- `game_complete` - User finishes (win/lose)
- `prompt_submit` - Each prompt submission
- `blacklist_violation` - Forbidden word used
- `target_hit` - Target word achieved
- `api_error` - API failures

### User Events
- `share_click` - Share button clicks
- `leaderboard_view` - Leaderboard opens
- `profile_view` - Profile viewed
- `login` - User authentication
- `logout` - User signs out

### Technical Events
- `web_vitals` - Performance metrics
- `js_error` - JavaScript errors
- `network_error` - Network failures

## View Analytics Data

### Firebase Console
1. Go to: https://console.firebase.google.com/project/art-of-intent/analytics
2. Navigate to "Events" tab
3. View real-time and historical data
4. Create custom reports

### Key Metrics to Monitor

**Engagement**:
- Active users (daily/weekly/monthly)
- Sessions per user
- Average session duration
- Events per session

**Game Performance**:
- Completion rate (wins vs losses)
- Average tokens per game
- Average attempts per game
- Blacklist violation rate

**User Behavior**:
- Share rate (shares / completions)
- Leaderboard view rate
- Return user rate

**Technical Health**:
- Error rate
- API failure rate
- Web Vitals scores (LCP, FID, CLS)

## Advanced: Custom Dashboards

### Create Funnel in Firebase
1. Go to Analytics > Analysis > Funnel Analysis
2. Create funnel:
   - Step 1: `page_view`
   - Step 2: `game_start`
   - Step 3: `prompt_submit`
   - Step 4: `game_complete`
3. Identify drop-off points

### Set Up Conversions
1. Go to Analytics > Events
2. Mark as conversion:
   - `game_complete` (with result = 'victory')
   - `share_click`
   - `login`

## Privacy & GDPR

### Current Setup
- Firebase Analytics uses cookies
- Requires consent in EU/UK

### Add Cookie Consent (Optional)

```html
<!-- Simple consent banner -->
<div id="cookieConsent" class="cookie-banner" style="display:none;">
    <div class="cookie-content">
        <p>We use cookies to improve your experience and analyze usage.</p>
        <button onclick="acceptCookies()" class="btn-primary">Accept</button>
        <button onclick="declineCookies()" class="btn-secondary">Decline</button>
    </div>
</div>

<script>
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieConsent').style.display = 'none';
    // Initialize analytics
    import('./src/js/analytics.js').then(m => m.initAnalytics());
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookieConsent').style.display = 'none';
}

// Check consent on load
if (!localStorage.getItem('cookieConsent')) {
    document.getElementById('cookieConsent').style.display = 'block';
} else if (localStorage.getItem('cookieConsent') === 'accepted') {
    import('./src/js/analytics.js').then(m => m.initAnalytics());
}
</script>
```

## Testing Checklist

- [ ] Analytics script loads without errors
- [ ] Page view tracked on load
- [ ] Game events tracked during gameplay
- [ ] Web Vitals appear in console
- [ ] No errors in DevTools Console
- [ ] Events appear in Firebase Console (after 24h)

## Troubleshooting

### Events not showing in Firebase Console
- Wait 24-48 hours for data to appear
- Check DebugView for real-time testing:
  1. Add `?debug_mode=true` to URL
  2. Go to Analytics > DebugView in Firebase Console

### Analytics script errors
- Check Firebase config is correct
- Verify analytics is initialized in firebase-config.js
- Check browser console for errors

### Web Vitals not tracking
- Ensure HTTPS (required for some metrics)
- Check browser compatibility
- Verify web-vitals CDN is accessible

## Next Steps

1. ✅ Integrate analytics.js into index.html
2. ✅ Update game.js to use new analytics functions
3. ✅ Test in development
4. ✅ Deploy to production
5. ⏳ Wait 24-48 hours for data
6. 📊 Review Firebase Analytics dashboard
7. 🎯 Set up conversion goals
8. 📈 Create custom reports

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Web Vitals Documentation](https://web.dev/vitals/)
- [Analytics Strategy](./ANALYTICS_STRATEGY.md)
