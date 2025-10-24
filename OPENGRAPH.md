# Open Graph Implementation

## Overview

The Art of Intent game implements comprehensive Open Graph (OG) and Twitter Card metadata to ensure rich social media previews when the game is shared on platforms like Facebook, Twitter, LinkedIn, Discord, and Slack.

---

## What is Open Graph?

Open Graph is a protocol created by Facebook that enables web pages to become rich objects in a social graph. When you share a URL on social media, OG tags control:

- **Title** - The headline shown
- **Description** - The summary text
- **Image** - The preview image
- **Type** - The content type (website, article, video, etc.)
- **URL** - The canonical URL

---

## Implementation

### Location
All Open Graph and Twitter Card tags are in the `<head>` section of `index.html`.

### Tags Implemented

#### Core Open Graph Tags

```html
<!-- Basic OG Tags -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://artofintent.game">
<meta property="og:title" content="Art of Intent - Haiku Challenge">
<meta property="og:description" content="Guide Arty the Haiku Bot to speak target words without using blacklisted words. A daily word puzzle game with AI interaction and token-based scoring.">
<meta property="og:site_name" content="Art of Intent">
<meta property="og:locale" content="en_US">
```

**Purpose:**
- `og:type` - Defines content as a website
- `og:url` - Canonical URL for the page
- `og:title` - Title shown in social previews
- `og:description` - Description shown in previews
- `og:site_name` - Name of the website
- `og:locale` - Language and region

#### Image Tags

```html
<!-- OG Image -->
<meta property="og:image" content="https://artofintent.game/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Art of Intent - Daily Haiku Challenge Game">
```

**Purpose:**
- `og:image` - URL of preview image
- `og:image:width` - Image width in pixels
- `og:image:height` - Image height in pixels
- `og:image:alt` - Accessibility description

**Image Requirements:**
- **Size:** 1200 x 630 pixels (recommended)
- **Format:** PNG or JPG
- **Max file size:** 8 MB (< 300 KB recommended)
- **Aspect ratio:** 1.91:1

#### Game-Specific Tags

```html
<!-- Game Metadata -->
<meta property="game:points_system" content="Token Efficiency">
<meta property="game:player_count" content="1">
<meta property="game:difficulty" content="Medium">
```

**Purpose:**
- `game:points_system` - How scoring works
- `game:player_count` - Number of players
- `game:difficulty` - Difficulty level

---

### Twitter Card Tags

Twitter uses its own meta tags for card previews:

```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://artofintent.game">
<meta name="twitter:title" content="Art of Intent - Haiku Challenge">
<meta name="twitter:description" content="Guide Arty the Haiku Bot to speak target words without using blacklisted words. Daily word puzzle with AI interaction.">
<meta name="twitter:image" content="https://artofintent.game/twitter-image.png">
<meta name="twitter:image:alt" content="Art of Intent - Daily Haiku Challenge Game">
<meta name="twitter:creator" content="@artofintent">
<meta name="twitter:site" content="@artofintent">
```

**Card Types:**
- `summary` - Small image card
- `summary_large_image` - Large image card (used)
- `app` - App install card
- `player` - Media player card

**Image Requirements:**
- **Size:** 1200 x 675 pixels (16:9 ratio)
- **Format:** PNG or JPG
- **Max file size:** 5 MB

---

### Additional Meta Tags

```html
<!-- SEO & Browser -->
<meta name="description" content="...">
<meta name="keywords" content="word game, haiku, AI game, puzzle, daily challenge, prompt engineering, LLM game">
<meta name="author" content="Art of Intent">
<meta name="theme-color" content="#0d1117">
<meta name="robots" content="index, follow">
<meta name="language" content="English">

<!-- Canonical URL -->
<link rel="canonical" href="https://artofintent.game">
```

---

### PWA Manifest

The `site.webmanifest` file provides metadata for Progressive Web App installation:

```json
{
  "name": "Art of Intent - Haiku Challenge",
  "short_name": "Art of Intent",
  "description": "Guide Arty the Haiku Bot...",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "icons": [...],
  "shortcuts": [...]
}
```

**Features:**
- App name and description
- Display mode (standalone)
- Theme colors
- App icons (192x192, 512x512)
- Shortcuts to key features

---

## Platform Support

### Facebook
- ✅ Title, description, image
- ✅ Large image preview
- ✅ Site name
- ✅ Game metadata

### Twitter
- ✅ Large image card
- ✅ Title, description, image
- ✅ Creator attribution
- ✅ Site handle

### LinkedIn
- ✅ Professional preview
- ✅ Title, description, image
- ✅ Company branding

### Discord
- ✅ Rich embed
- ✅ Image, title, description
- ✅ Color theming

### Slack
- ✅ Link unfurling
- ✅ Preview card
- ✅ Image display

### WhatsApp
- ✅ Link preview
- ✅ Image thumbnail
- ✅ Title and description

---

## Benefits

### 1. Increased Engagement
- **Visual appeal** - Eye-catching images
- **Clear messaging** - Descriptive titles
- **Professional appearance** - Consistent branding

### 2. Better Click-Through Rates
- **Rich previews** - More information visible
- **Trust signals** - Professional presentation
- **Call to action** - Compelling descriptions

### 3. Brand Consistency
- **Unified look** - Same appearance across platforms
- **Recognition** - Consistent branding
- **Professionalism** - Polished presentation

### 4. SEO Benefits
- **Search appearance** - Rich snippets
- **Social signals** - Sharing metrics
- **Discoverability** - Better indexing

---

## Testing

### Before Deployment

1. **Validate HTML**
   - Check meta tag syntax
   - Verify all required tags present
   - Ensure proper nesting

2. **Test Locally**
   ```javascript
   // In browser console
   const ogTags = Array.from(document.querySelectorAll('meta[property^="og:"]'))
     .map(tag => ({
       property: tag.getAttribute('property'),
       content: tag.getAttribute('content')
     }));
   console.table(ogTags);
   ```

3. **Validate Images**
   - Check image URLs are absolute
   - Verify images load correctly
   - Confirm dimensions are correct

### After Deployment

1. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test URL and scrape metadata
   - Verify preview appearance

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Preview card appearance
   - Check image and text

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Verify professional appearance
   - Check image quality

4. **Test on Actual Platforms**
   - Share URL on Facebook (private post)
   - Tweet the URL (draft)
   - Post on LinkedIn (test)
   - Paste in Discord/Slack

See [OPENGRAPH_TESTING.md](./OPENGRAPH_TESTING.md) for complete testing guide.

---

## Maintenance

### When to Update

Update Open Graph tags when:
- Game title changes
- Description is updated
- New features are added
- Branding changes
- Images are updated

### How to Update

1. Edit `index.html` meta tags
2. Update image files if needed
3. Test with validators
4. Clear platform caches:
   - Facebook: Use Sharing Debugger
   - Twitter: Wait or contact support
   - LinkedIn: Use Post Inspector

### Cache Busting

If platforms show old previews:

```html
<!-- Add version parameter -->
<meta property="og:image" content="https://artofintent.game/og-image.png?v=2">
```

---

## Image Assets

### Required Images

See [IMAGES.md](./IMAGES.md) for complete image creation guide.

**Priority:**
1. `og-image.png` (1200x630) - Facebook, LinkedIn
2. `twitter-image.png` (1200x675) - Twitter
3. `favicon-32x32.png` (32x32) - Browser tab
4. `apple-touch-icon.png` (180x180) - iOS home screen

**Optional:**
5. `icon-192x192.png` (192x192) - Android home screen
6. `icon-512x512.png` (512x512) - PWA splash screen
7. Screenshots for app stores

### Image Guidelines

**Design:**
- Use brand colors (#0d1117, #58a6ff, #3fb950)
- Include game title prominently
- Show key game elements
- Maintain readability at small sizes

**Technical:**
- Optimize file size (< 300 KB)
- Use PNG for transparency
- Provide alt text
- Test on multiple backgrounds

---

## Best Practices

### 1. Use Descriptive Titles
```html
<!-- ❌ Too generic -->
<meta property="og:title" content="Game">

<!-- ✅ Descriptive -->
<meta property="og:title" content="Art of Intent - Haiku Challenge">
```

### 2. Write Compelling Descriptions
```html
<!-- ❌ Too short -->
<meta property="og:description" content="A word game">

<!-- ✅ Informative -->
<meta property="og:description" content="Guide Arty the Haiku Bot to speak target words without using blacklisted words. A daily word puzzle game with AI interaction and token-based scoring.">
```

### 3. Always Use Absolute URLs
```html
<!-- ❌ Relative URL -->
<meta property="og:image" content="/og-image.png">

<!-- ✅ Absolute URL -->
<meta property="og:image" content="https://artofintent.game/og-image.png">
```

### 4. Provide Image Dimensions
```html
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

### 5. Include Alt Text
```html
<meta property="og:image:alt" content="Art of Intent - Daily Haiku Challenge Game">
```

### 6. Set Canonical URL
```html
<link rel="canonical" href="https://artofintent.game">
```

### 7. Keep Content Updated
- Review quarterly
- Update after major changes
- Test after updates
- Monitor analytics

---

## Common Issues

### Issue: Image Not Showing

**Causes:**
- Relative URL instead of absolute
- Image not publicly accessible
- Wrong image dimensions
- File size too large

**Solutions:**
- Use absolute URLs
- Check image permissions
- Resize to 1200x630
- Optimize file size

### Issue: Old Preview Showing

**Causes:**
- Platform cache
- CDN cache
- Browser cache

**Solutions:**
- Use platform debuggers to refresh
- Add cache-busting parameter
- Wait for cache expiration
- Clear CDN cache

### Issue: Text Truncated

**Causes:**
- Title/description too long
- Platform character limits

**Solutions:**
- Shorten text
- Front-load important info
- Test on multiple platforms
- Use character counters

---

## Analytics

### Track Social Shares

```javascript
// Track when users share
document.getElementById('shareBtn').addEventListener('click', () => {
  trackEvent('social_share', {
    platform: 'native_share',
    url: window.location.href
  });
});
```

### Monitor Referrals

Check analytics for traffic from:
- facebook.com
- t.co (Twitter)
- linkedin.com
- discord.com
- slack.com

### Measure Engagement

Track:
- Click-through rate from social
- Time on site from social referrals
- Conversion rate by platform
- Share count by platform

---

## Resources

### Documentation
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing](https://developers.facebook.com/docs/sharing/webmasters)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Tools
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Validator](https://cards-dev.twitter.com/validator)
- [Metatags.io](https://metatags.io/)
- [OpenGraph.xyz](https://www.opengraph.xyz/)

### Image Tools
- [Figma](https://www.figma.com/) - Design tool
- [Canva](https://www.canva.com/) - Easy design
- [TinyPNG](https://tinypng.com/) - Image optimization
- [Squoosh](https://squoosh.app/) - Image compression

---

## Checklist

### Implementation
- [x] Core OG tags added
- [x] Twitter Card tags added
- [x] Game-specific tags added
- [x] Image tags with dimensions
- [x] PWA manifest created
- [x] Canonical URL set
- [ ] Images created and uploaded
- [ ] Tested with validators
- [ ] Tested on actual platforms

### Maintenance
- [ ] Review quarterly
- [ ] Update after changes
- [ ] Monitor analytics
- [ ] Track social shares
- [ ] Optimize based on data

---

**Status:** Open Graph and Twitter Card tags are fully implemented. Create and upload images, then test with validators before deployment.
