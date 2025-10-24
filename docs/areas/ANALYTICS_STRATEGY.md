# Analytics Strategy for Art of Intent

## Current Setup

### ✅ Already Implemented

1. **Firebase Analytics** (Google Analytics 4)
   - Measurement ID: `G-4FJ7J37XH8`
   - Initialized in `firebase-config.js`
   - **Status**: Configured but not actively used for custom events

2. **Custom Event Tracking** (Local)
   - Basic event tracking in `game.js`
   - Events stored in `gameState.events[]`
   - Currently only logs to console
   - **Events tracked**:
     - `session_start`
     - `session_resume`
     - `prompt_submitted`
     - `blacklist_violation_detected`
     - `api_response_received`
     - `api_error`
     - `response_processed`

3. **Firebase Firestore** (Session Data)
   - User sessions stored in `sessions` collection
   - Leaderboard data aggregated
   - Can query for usage analytics

## Recommended Analytics Stack

### 🎯 For Launch (Immediate)

#### 1. **Activate Firebase Analytics (GA4)**
**Why**: Already configured, free, comprehensive, integrates with Firebase

**Implementation**:
```javascript
// Add to game.js
import { logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { analytics } from './firebase-config.js';

// Replace console.log with actual tracking
function trackEvent(eventType, data = {}) {
    // Log to Firebase Analytics
    logEvent(analytics, eventType, data);
    
    // Keep local tracking for debugging
    const event = {
        '@type': 'Event',
        eventType: eventType,
        timestamp: new Date().toISOString(),
        data: data
    };
    gameState.events.push(event);
    saveGameState();
}
```

**Key Events to Track**:
- `page_view` - Automatic
- `game_start` - User starts playing
- `game_complete` - User finishes (win/lose)
- `prompt_submit` - Each prompt submission
- `share_click` - Share button clicks
- `leaderboard_view` - Leaderboard opens
- `auth_login` - User signs in
- `error_occurred` - API or game errors

**Benefits**:
- Free tier: 500 events/day (unlimited for standard events)
- Real-time dashboard
- User demographics
- Retention analysis
- Conversion funnels

#### 2. **Web Vitals Monitoring**
**Why**: Track performance metrics (LCP, FID, CLS, TTFB, INP)

**Implementation**:
```javascript
// Add to index.html or create web-vitals.js
import {onCLS, onFID, onLCP, onTTFB, onINP} from 'https://unpkg.com/web-vitals@3/dist/web-vitals.js?module';

function sendToAnalytics({name, value, id}) {
    logEvent(analytics, 'web_vitals', {
        metric_name: name,
        metric_value: value,
        metric_id: id
    });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
onINP(sendToAnalytics);
```

**Benefits**:
- Track Core Web Vitals
- Identify performance issues
- Monitor user experience
- SEO impact tracking

#### 3. **Netlify Analytics** (Optional - Paid)
**Why**: Server-side analytics, no client-side tracking, GDPR-friendly

**Cost**: $9/month
**Features**:
- Page views
- Unique visitors
- Top pages
- Traffic sources
- No cookie consent needed

**Setup**: Enable in Netlify dashboard

### 🚀 For Growth Phase (Post-Launch)

#### 4. **Plausible Analytics** (Privacy-Focused Alternative)
**Why**: GDPR compliant, no cookies, lightweight, beautiful UI

**Cost**: $9/month (10k pageviews)
**Features**:
- Simple, clean dashboard
- No cookie banners needed
- 1KB script size
- Custom events
- Goal tracking

**Implementation**:
```html
<script defer data-domain="art-of-intent.netlify.app" 
        src="https://plausible.io/js/script.js"></script>
```

#### 5. **Hotjar or Microsoft Clarity** (User Behavior)
**Why**: Heatmaps, session recordings, user feedback

**Hotjar**: $32/month (Basic)
**Clarity**: Free (Microsoft)

**Features**:
- Session recordings
- Heatmaps
- Click tracking
- User feedback surveys

**Recommendation**: Start with **Microsoft Clarity** (free)

## Metrics to Track

### Game Metrics
- **Engagement**:
  - Daily Active Users (DAU)
  - Sessions per user
  - Average session duration
  - Prompts per session
  - Completion rate (win/lose ratio)

- **Performance**:
  - Token efficiency (avg tokens per win)
  - Attempts per game
  - Time to completion
  - Blacklist violations

- **Social**:
  - Share button clicks
  - Share completion rate
  - Leaderboard views
  - Profile views

### Technical Metrics
- **Web Vitals**:
  - LCP (Largest Contentful Paint) - Target: <2.5s
  - FID (First Input Delay) - Target: <100ms
  - CLS (Cumulative Layout Shift) - Target: <0.1
  - TTFB (Time to First Byte) - Target: <600ms
  - INP (Interaction to Next Paint) - Target: <200ms

- **Errors**:
  - API failures
  - Firebase errors
  - JavaScript errors
  - Network failures

### Business Metrics
- **Acquisition**:
  - Traffic sources
  - Referrers
  - Campaign tracking (UTM parameters)
  - Landing pages

- **Retention**:
  - Return visitor rate
  - Day 1/7/30 retention
  - Churn rate

## Implementation Priority

### Phase 1: Launch (Week 1)
1. ✅ Activate Firebase Analytics with custom events
2. ✅ Add Web Vitals tracking
3. ✅ Set up error tracking
4. ⚠️ Add UTM parameter tracking for campaigns

### Phase 2: Optimization (Week 2-4)
1. Review Firebase Analytics dashboard
2. Identify drop-off points
3. Add Microsoft Clarity for session recordings
4. Set up conversion funnels

### Phase 3: Growth (Month 2+)
1. Consider Plausible for privacy-focused analytics
2. Add A/B testing framework
3. Implement user feedback surveys
4. Advanced cohort analysis

## Privacy Considerations

### GDPR Compliance
- Firebase Analytics: Requires cookie consent in EU
- Plausible/Netlify: No cookies, GDPR-friendly
- Microsoft Clarity: Requires consent

### Cookie Consent Banner
If using Firebase Analytics, add consent banner:
```html
<!-- Simple consent banner -->
<div id="cookieConsent" style="display:none;">
  <p>We use cookies to improve your experience. 
     <button onclick="acceptCookies()">Accept</button>
     <button onclick="declineCookies()">Decline</button>
  </p>
</div>
```

## Dashboard Access

### Firebase Analytics
- URL: https://console.firebase.google.com/project/art-of-intent/analytics
- Access: Project owners/editors

### Netlify Analytics
- URL: https://app.netlify.com/sites/art-of-intent/analytics
- Access: Site admins

## Quick Start Commands

```bash
# Install web-vitals (if using npm)
npm install web-vitals

# Or use CDN in HTML
<script type="module">
  import {onCLS, onFID, onLCP} from 'https://unpkg.com/web-vitals@3/dist/web-vitals.js?module';
</script>
```

## Monitoring Tools

### Free Tools
1. **Google Search Console** - SEO and search performance
2. **PageSpeed Insights** - Performance scoring
3. **Lighthouse** - Automated audits (built into Chrome DevTools)
4. **Firebase Performance Monitoring** - App performance
5. **Netlify Analytics** - Basic traffic (free tier limited)

### Recommended Setup
1. Firebase Analytics (GA4) - User behavior
2. Web Vitals - Performance
3. Microsoft Clarity - User experience
4. Google Search Console - SEO

**Total Cost**: $0/month (all free options)

## Next Steps

1. Implement Firebase Analytics custom events
2. Add Web Vitals tracking
3. Set up Firebase Performance Monitoring
4. Create analytics dashboard in Firebase Console
5. Document key metrics and KPIs
6. Set up weekly analytics review

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Web Vitals Guide](https://web.dev/vitals/)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Plausible Analytics](https://plausible.io/)
- [Microsoft Clarity](https://clarity.microsoft.com/)
