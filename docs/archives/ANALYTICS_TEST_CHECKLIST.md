# Analytics Testing Checklist

## Pre-Deployment Test (Local)

### 1. Open Browser Console
- Open index.html in browser
- Open DevTools (F12)
- Go to Console tab

### 2. Check Initialization
Look for these console messages:
- ✅ `🔥 Firebase initialized successfully`
- ✅ `📊 Analytics initialized`
- ✅ `✅ Web Vitals tracking initialized`

### 3. Test Page View
On page load, you should see:
```
📊 Analytics Event: page_view {page_path: "/", page_title: "..."}
```

### 4. Test Game Events

**Start Game:**
- Play the game
- Look for: `📊 Analytics Event: game_start {game_date: "2025-10-24", ...}`

**Submit Prompt:**
- Enter a prompt
- Look for: `📊 Analytics Event: prompt_submit {prompt_length: X, token_count: 0}`

**Blacklist Violation:**
- Use a blacklisted word
- Look for: `📊 Analytics Event: blacklist_violation {violated_word: "...", ...}`

**Game Complete (Win):**
- Complete the game successfully
- Look for: `📊 Analytics Event: game_complete {result: "victory", ...}`

**Game Complete (Loss):**
- Trigger a blacklist violation
- Look for: `📊 Analytics Event: game_complete {result: "defeat", ...}`

### 5. Test User Events

**Share Click:**
- Click share button
- Look for: `📊 Analytics Event: share_click {share_type: "image"}`

**Leaderboard View:**
- Click leaderboard button
- Look for: `📊 Analytics Event: leaderboard_view {leaderboard_type: "daily"}`

**Filter Change:**
- Click "Weekly" or "All-Time" filter
- Look for: `📊 Analytics Event: leaderboard_view {leaderboard_type: "weekly"}`

### 6. Test Web Vitals
After page loads and interactions:
- Look for: `📊 Analytics Event: web_vitals {metric_name: "LCP", ...}`
- Look for: `📊 Analytics Event: web_vitals {metric_name: "FID", ...}`
- Look for: `📊 Analytics Event: web_vitals {metric_name: "CLS", ...}`

### 7. Test Error Tracking
Trigger an error (optional):
- Errors should log: `📊 Analytics Event: js_error {error_message: "...", ...}`

## Post-Deployment Test (Production)

### 1. Enable Debug Mode
Add `?debug_mode=true` to URL:
```
https://art-of-intent.netlify.app/?debug_mode=true
```

### 2. Open Firebase Console
1. Go to: https://console.firebase.google.com/project/art-of-intent/analytics
2. Navigate to: **DebugView** tab
3. You should see your device listed
4. Events should appear in real-time

### 3. Verify Events in DebugView
Play through the game and verify these events appear:
- ✅ `page_view`
- ✅ `game_start`
- ✅ `prompt_submit`
- ✅ `game_complete`
- ✅ `share_click`
- ✅ `leaderboard_view`
- ✅ `web_vitals`

### 4. Check Event Parameters
Click on each event to verify parameters are correct:
- `game_complete` should have: `result`, `total_tokens`, `attempts`, `duration_seconds`, `efficiency`
- `prompt_submit` should have: `prompt_length`, `token_count`
- `web_vitals` should have: `metric_name`, `metric_value`, `metric_rating`

## Production Data (24-48 hours after launch)

### 1. Check Events Tab
1. Go to: Analytics > Events
2. Verify these events are tracked:
   - `page_view`
   - `game_start`
   - `game_complete`
   - `prompt_submit`
   - `share_click`
   - `leaderboard_view`
   - `web_vitals`

### 2. Check Engagement Metrics
1. Go to: Analytics > Engagement
2. Verify:
   - Active users count
   - Sessions per user
   - Average engagement time

### 3. Create Custom Reports
1. Go to: Analytics > Analysis > Exploration
2. Create report for:
   - Win rate: `game_complete` where `result = victory`
   - Average tokens: `game_complete` average `total_tokens`
   - Share rate: `share_click` / `game_complete`

## Troubleshooting

### No events in console
- Check browser console for errors
- Verify analytics.js is loaded
- Check Firebase config is correct

### Events in console but not in Firebase
- Wait 24-48 hours for data to appear
- Use DebugView for real-time testing
- Check Firebase project ID matches

### Web Vitals not tracking
- Ensure HTTPS (required for some metrics)
- Check browser compatibility
- Verify web-vitals CDN is accessible

### Analytics errors
- Check Firebase Analytics is enabled in Firebase Console
- Verify measurementId in firebase-config.js
- Check browser allows third-party cookies

## Success Criteria

✅ All events appear in browser console  
✅ Events appear in Firebase DebugView  
✅ No JavaScript errors in console  
✅ Web Vitals tracked successfully  
✅ Data appears in Firebase Console after 24-48h  

## Next Steps After Testing

1. ✅ Remove debug logs from production (optional)
2. ✅ Set up conversion goals in Firebase
3. ✅ Create custom dashboards
4. ✅ Set up weekly analytics review
5. ✅ Monitor error rates
6. ✅ Track key metrics (win rate, share rate, retention)
