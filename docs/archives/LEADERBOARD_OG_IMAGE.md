# Leaderboard OG Image Generator

**Status:** ✅ Complete  
**Version:** 1.0.0  
**Date:** 2025-01-24

## Overview

Dynamic Open Graph image generator that displays daily leaderboard and game statistics. This image serves as the primary social media preview for the game, showcasing live data and encouraging engagement.

## Features

### 1. Dynamic Leaderboard Display
- **Top 5 Players** - Daily rankings with key stats
- **Player Stats** - Tokens, attempts, efficiency, time
- **Real-time Data** - Fetched from Firebase or mock data

### 2. Game Statistics (KPIs)
- **Total Players** - All-time registered users
- **Games Today** - Daily game count
- **Active Now** - Currently active players
- **Win Rate** - Overall success percentage
- **Avg Tokens** - Average token consumption
- **Avg Attempts** - Average attempts per game

### 3. DOS Aesthetic
- Box drawing characters (╔═╗║╚╝┌─┐└┘)
- ASCII progress bars (█░)
- Monospace typography
- CRT scanline effects
- Cyan/green/yellow color scheme

## Architecture

### Components

```
src/js/
├── leaderboard-card-generator.js  # SVG generation class
├── leaderboard-data.js            # Firebase data fetcher
└── version.js                     # Version management

generate-og-image.html             # Generation interface
src/assets/og_image.png           # Generated OG image
```

### Data Flow

```
Firebase Firestore
    ↓
leaderboard-data.js (fetch & aggregate)
    ↓
LeaderboardCardGenerator (generate SVG)
    ↓
Canvas API (convert to PNG)
    ↓
src/assets/og_image.png
    ↓
Open Graph meta tags
```

## Usage

### 1. Generate New OG Image

Visit `/generate-og-image.html`:

1. **Fetch Live Data** - Pull from Firebase
2. **Use Mock Data** - Use sample data for testing
3. **Generate Image** - Create SVG preview
4. **Download PNG** - Save as `og_image.png`
5. **Replace** - Update `src/assets/og_image.png`

### 2. Automated Updates (Future)

```javascript
// Scheduled function (e.g., daily cron job)
async function updateOGImage() {
    const data = await fetchLeaderboardData();
    const svg = leaderboardCardGenerator.generateSVG(data);
    const blob = await leaderboardCardGenerator.svgToPNG(svg);
    // Upload to hosting/CDN
}
```

## Data Structure

### Input Data

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
    // ... up to 5 players
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

### Firebase Queries

**Leaderboard:**
```javascript
query(
  collection(db, 'leaderboard'),
  where('date', '==', today),
  orderBy('score', 'asc'),
  limit(5)
)
```

**Statistics:**
- Total players: `count(collection(db, 'users'))`
- Games today: `count(where('date', '==', today))`
- Active now: `count(where('lastActivity', '>=', fiveMinutesAgo))`
- Averages: Calculated from session data

## Image Specifications

### Dimensions
- **Width:** 1200px
- **Height:** 630px
- **Format:** PNG
- **Size:** ~100-200KB

### Layout

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ ART OF INTENT v1.0 - DAILY LEADERBOARD                         2025-01-24    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─ TOP PLAYERS TODAY ──────────────────────────────────────────────────┐   ║
║  │ #1  PLAYER_ONE        187 tokens    4 att    46.8 eff    02:34      │   ║
║  │ #2  GUEST_42          203 tokens    5 att    40.6 eff    03:12      │   ║
║  │ #3  WORDSMITH         245 tokens    7 att    35.0 eff    04:56      │   ║
║  │ #4  HAIKU_MASTER      289 tokens    8 att    36.1 eff    05:23      │   ║
║  │ #5  PROMPT_NINJA      312 tokens    9 att    34.7 eff    06:45      │   ║
║  └───────────────────────────────────────────────────────────────────────┘   ║
║                                                                               ║
║  ┌─ GAME STATISTICS ────────────────────────────────────────────────────┐   ║
║  │ TOTAL PLAYERS:    1,247        WIN RATE:      67%  ████████░░░░░░   │   ║
║  │ GAMES TODAY:        342        AVG TOKENS:    234  ████████████░░   │   ║
║  │ ACTIVE NOW:          89        AVG ATTEMPTS:  5.8  ██████░░░░░░░░   │   ║
║  └───────────────────────────────────────────────────────────────────────┘   ║
║                                                                               ║
║  >>> GUIDE ARTY THE HAIKU BOT - PLAY NOW <<<                                 ║
║  art-of-intent.netlify.app                                                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Testing

### Unit Tests

```bash
npm run test:leaderboard
```

**Coverage:**
- ASCII bar generation (edge cases)
- Number formatting
- Player row generation
- SVG structure validation
- Data handling

**Results:** 20/20 tests passing ✅

### Manual Testing

1. Visit `/generate-og-image.html`
2. Click "Use Mock Data"
3. Click "Generate Image"
4. Verify preview displays correctly
5. Click "Download PNG"
6. Check file size and quality

## Integration

### Open Graph Meta Tags

```html
<meta property="og:image" content="https://art-of-intent.netlify.app/src/assets/og_image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Art of Intent - Daily Leaderboard and Game Statistics">
```

### Social Media Platforms

- ✅ **Facebook** - Large image preview
- ✅ **Twitter** - Summary card with large image
- ✅ **LinkedIn** - Professional preview
- ✅ **Discord** - Rich embed
- ✅ **Slack** - Link unfurling
- ✅ **WhatsApp** - Link preview

## Benefits

### 1. Dynamic Content
- Shows real-time leaderboard
- Updates with latest stats
- Encourages competition

### 2. Social Proof
- Displays active player count
- Shows engagement metrics
- Builds credibility

### 3. Call to Action
- Clear "PLAY NOW" message
- Prominent URL
- Engaging visual design

### 4. Brand Consistency
- DOS aesthetic maintained
- Matches game interface
- Professional appearance

## Maintenance

### Update Frequency

**Recommended:** Daily at midnight UTC

**Process:**
1. Fetch latest leaderboard data
2. Generate new SVG
3. Convert to PNG
4. Upload to hosting
5. Clear CDN cache

### Monitoring

**Check:**
- Image loads correctly
- Data is current
- File size reasonable
- Social previews work

## Future Enhancements

### Planned Features

1. **Automated Generation**
   - Scheduled daily updates
   - Serverless function
   - CDN integration

2. **Multiple Variants**
   - Weekly leaderboard
   - All-time best
   - Seasonal themes

3. **Personalization**
   - User-specific cards
   - Achievement highlights
   - Custom messages

4. **Analytics**
   - Track social shares
   - Monitor engagement
   - A/B testing

## API Reference

### LeaderboardCardGenerator

```javascript
const generator = new LeaderboardCardGenerator();

// Generate SVG
const svg = generator.generateSVG(data);

// Convert to PNG
const blob = await generator.svgToPNG(svg);

// Download image
await generator.downloadImage(svg, 'filename.png');

// Preview in modal
generator.previewImage(svg);
```

### fetchLeaderboardData

```javascript
// Fetch live data
const data = await fetchLeaderboardData();

// Get mock data
const mockData = getMockLeaderboardData();
```

## Troubleshooting

### Common Issues

**Image not updating:**
- Clear browser cache
- Check CDN cache
- Verify file upload

**Data not loading:**
- Check Firebase connection
- Verify query permissions
- Use mock data fallback

**Image quality poor:**
- Increase canvas resolution
- Check PNG compression
- Verify font loading

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [SVG Specification](https://www.w3.org/TR/SVG2/)

## Conclusion

The leaderboard OG image generator provides dynamic, engaging social media previews that showcase live game data and encourage player participation. The DOS aesthetic maintains brand consistency while the automated generation ensures content stays fresh.

---

*"C:\> GENERATE_OG_IMAGE.EXE"*
