# Share Card Feature
## SVG-Based Shareable Images

---

## Overview

Replaced ASCII text sharing with beautiful SVG-based share cards that can be shared as images on social media and messaging apps.

---

## Features

### 1. SVG Share Card Generator
- **Size:** 1200x630px (standard OG image size)
- **Format:** SVG → PNG conversion
- **Style:** DOS aesthetic with scanlines and borders
- **Content:** Game stats, user info, branding

### 2. Share Options
- **Preview Card** - View before sharing
- **Share Image** - Native share with image file
- **Copy Text** - Fallback text option

### 3. User Personalization
- User name (from Firebase Auth)
- User photo (if available)
- Date and time
- Custom stats

---

## Share Card Design

```
┌─────────────────────────────────────────────┐
│ ╔                                         ╗ │
│                                             │
│           ART OF INTENT                     │
│           HAIKU CHALLENGE                   │
│                                             │
│               WIN / LOSS                    │
│                                             │
│   ATTEMPTS    TOKENS      MATCHES           │
│     4/10       187         3/3              │
│                                             │
│   EFFICIENCY: 46.8 TOK/ATT                  │
│   [████████████░░░░░░░░]                    │
│                                             │
│   👤 Username                               │
│      2025-01-24                             │
│                                             │
│                  art-of-intent.netlify.app  │
│                                             │
│ ╚                                         ╝ │
└─────────────────────────────────────────────┘
```

---

## Technical Implementation

### SVG Generation

**Class:** `ShareCardGenerator`

**Methods:**
- `generateSVG(data)` - Create SVG string
- `svgToDataURL(svg)` - Convert to data URL
- `svgToPNG(svg)` - Convert to PNG blob
- `shareImage(svg)` - Share via Web Share API
- `downloadImage(svg)` - Download PNG file
- `previewImage(svg)` - Show preview modal

### Data Structure

```javascript
const cardData = {
    result: 'WIN' | 'LOSS',
    attempts: 4,
    tokens: 187,
    matches: '3/3',
    efficiency: '46.8',
    date: '1/24/2025',
    userName: 'Player Name',
    userPhoto: 'https://...' // Optional
};
```

### SVG Template

```svg
<svg width="1200" height="630">
    <!-- Background with scanlines -->
    <rect fill="#000000"/>
    <pattern id="scanlines">...</pattern>
    
    <!-- Double border -->
    <rect stroke="#AAAAAA"/>
    
    <!-- Title -->
    <text class="title">ART OF INTENT</text>
    
    <!-- Result (WIN/LOSS) -->
    <text class="result" fill="#55FF55">WIN</text>
    
    <!-- Stats grid -->
    <g transform="translate(...)">
        <text class="stat-label">ATTEMPTS</text>
        <text class="stat-value">4/10</text>
        <!-- More stats... -->
    </g>
    
    <!-- Efficiency bar -->
    <rect fill="#555555"/> <!-- Background -->
    <rect fill="#55FFFF"/> <!-- Progress -->
    
    <!-- User info -->
    <image href="userPhoto"/>
    <text class="username">Player Name</text>
    <text class="date">1/24/2025</text>
    
    <!-- URL -->
    <text class="url">art-of-intent.netlify.app</text>
</svg>
```

---

## Color Palette

```javascript
colors: {
    background: '#000000',  // Black
    border: '#AAAAAA',      // Light Gray
    cyan: '#55FFFF',        // Bright Cyan
    green: '#55FF55',       // Bright Green (WIN)
    red: '#FF5555',         // Bright Red (LOSS)
    yellow: '#FFFF55',      // Bright Yellow
    white: '#FFFFFF',       // White
    gray: '#555555'         // Dark Gray
}
```

---

## Typography

**Font:** Courier Prime (web font)
- Fallback: Courier New, monospace
- Loaded from Google Fonts
- Monospace for DOS aesthetic

**Sizes:**
- Title: 48px
- Subtitle: 20px
- Result: 64px
- Stat labels: 18px
- Stat values: 32px
- Username: 24px
- Date: 16px
- URL: 18px

---

## Conversion Process

### SVG → PNG

1. **Create SVG string** with game data
2. **Convert to data URL** (base64 encoded)
3. **Load into Image element**
4. **Draw on Canvas** (1200x630)
5. **Export as PNG blob**
6. **Create File object** for sharing

```javascript
async svgToPNG(svgString) {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1200;
    canvas.height = 630;
    
    return new Promise((resolve) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(resolve, 'image/png');
        };
        img.src = this.svgToDataURL(svgString);
    });
}
```

---

## Sharing Methods

### 1. Web Share API (Preferred)

```javascript
const blob = await svgToPNG(svg);
const file = new File([blob], 'score.png', { type: 'image/png' });

if (navigator.canShare({ files: [file] })) {
    await navigator.share({
        title: 'Art of Intent Score',
        text: 'Check out my score!',
        files: [file]
    });
}
```

**Supported:**
- Mobile browsers (iOS Safari, Chrome, Edge)
- Desktop Chrome/Edge (with flag)
- Native share sheet

### 2. Download Fallback

```javascript
const blob = await svgToPNG(svg);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'art-of-intent-score.png';
a.click();
```

**Supported:**
- All modern browsers
- Desktop and mobile
- User manually shares downloaded file

### 3. Text Fallback

```javascript
const text = generateShareText(includeTrail);
navigator.clipboard.writeText(text);
alert('Score copied to clipboard!');
```

**Supported:**
- All browsers
- Clipboard API
- ASCII text format

---

## User Flow

### Game Over Modal

1. User completes game (win or loss)
2. Modal shows with 3 buttons:
   - **Preview Card** - See image before sharing
   - **Share Image** - Share directly
   - **Copy Text** - Get text version

### Preview Flow

1. Click "Preview Card"
2. SVG generated with user data
3. Full-screen preview modal opens
4. Click anywhere to close
5. Return to modal, click "Share Image"

### Share Flow

1. Click "Share Image"
2. SVG generated
3. Converted to PNG
4. Web Share API opens
5. User selects app (WhatsApp, Twitter, etc.)
6. Image shared with caption

### Fallback Flow

1. Web Share API not available
2. Image automatically downloads
3. Alert: "Image downloaded! Share manually"
4. User finds file in downloads
5. Manually shares via app

---

## Mobile Optimization

### Image Size
- 1200x630px (standard OG size)
- ~200-300KB PNG file
- Optimized for mobile networks

### Touch Targets
- Large buttons (min 44x44px)
- Clear labels
- Adequate spacing

### Performance
- SVG generation: <100ms
- PNG conversion: <500ms
- Total time: <1 second

---

## Browser Compatibility

### SVG Generation
- ✅ All modern browsers
- ✅ Mobile Safari
- ✅ Chrome/Edge/Firefox
- ✅ Android browsers

### Canvas Conversion
- ✅ All modern browsers
- ✅ Hardware accelerated
- ✅ High quality output

### Web Share API
- ✅ iOS Safari 12+
- ✅ Android Chrome 61+
- ✅ Desktop Chrome 89+ (with flag)
- ⚠️ Firefox (not supported)
- ⚠️ Desktop Safari (not supported)

### Fallback Support
- ✅ Download works everywhere
- ✅ Text copy works everywhere
- ✅ Graceful degradation

---

## Advantages Over ASCII Text

### 1. Visual Appeal
- ❌ ASCII: Plain text, formatting issues
- ✅ Image: Beautiful, consistent rendering

### 2. Messaging App Support
- ❌ ASCII: Breaks in WhatsApp, iMessage
- ✅ Image: Perfect in all apps

### 3. Social Media
- ❌ ASCII: No preview, poor engagement
- ✅ Image: Rich preview, high engagement

### 4. Branding
- ❌ ASCII: No logo, no colors
- ✅ Image: Full branding, colors, logo

### 5. User Info
- ❌ ASCII: Text only
- ✅ Image: Photo, name, styled

---

## Future Enhancements

### Customization
- [ ] Multiple color themes
- [ ] Custom backgrounds
- [ ] Avatar frames
- [ ] Stickers/badges

### Formats
- [ ] Instagram Story format (1080x1920)
- [ ] Twitter Card format (1200x675)
- [ ] Square format (1080x1080)

### Features
- [ ] QR code to game
- [ ] Animated GIF version
- [ ] Video replay
- [ ] Comparison cards (before/after)

### Social Integration
- [ ] Direct Twitter post
- [ ] Direct Instagram story
- [ ] Discord webhook
- [ ] Telegram bot

---

## Files

### New Files
- `share-card-generator.js` - SVG generator class
- `SHARE_CARD_FEATURE.md` - This documentation

### Modified Files
- `index.html` - Added script, updated buttons
- `game.js` - Updated share functions, added preview

---

## Testing Checklist

### Generation
- [x] SVG generates correctly
- [x] All stats display
- [x] User info included
- [x] Colors correct
- [x] Typography readable

### Conversion
- [x] SVG to PNG works
- [x] Image quality good
- [x] File size reasonable
- [x] No artifacts

### Sharing
- [ ] Web Share API works (mobile)
- [ ] Download fallback works
- [ ] Text fallback works
- [ ] Preview modal works
- [ ] Close preview works

### Platforms
- [ ] WhatsApp
- [ ] iMessage
- [ ] Twitter
- [ ] Facebook
- [ ] Instagram
- [ ] Discord
- [ ] Telegram

---

*Last Updated: 2025-01-24*
*Version: 0.3.1 - Share Card Feature*
