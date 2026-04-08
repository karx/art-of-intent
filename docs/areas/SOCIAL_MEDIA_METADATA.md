# Social Media Metadata Strategy

## Overview

Art of Intent implements comprehensive Open Graph (OG) and Twitter Card metadata to ensure rich, engaging previews when shared across social media platforms.

## Platforms Supported

### ✅ Full Rich Preview Support
- **Facebook** - Open Graph protocol
- **Twitter/X** - Twitter Cards
- **LinkedIn** - Open Graph protocol
- **Discord** - Open Graph + embeds
- **Slack** - Open Graph + unfurling
- **WhatsApp** - Open Graph protocol
- **Telegram** - Open Graph protocol
- **iMessage** - Open Graph protocol

## Current Implementation

### Open Graph Tags

```html
<!-- Core OG Tags -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://art-of-intent.netlify.app/">
<meta property="og:title" content="Art of Intent - Master Prompt Engineering">
<meta property="og:description" content="Guide Arty the Haiku Bot with clever prompts! Hit target words, avoid forbidden ones. Daily AI puzzle with global leaderboard. Can you master the art of intent?">
<meta property="og:site_name" content="Art of Intent">
<meta property="og:locale" content="en_US">

<!-- Image Tags -->
<meta property="og:image" content="https://art-of-intent.netlify.app/src/assets/og_image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Art of Intent - Daily Leaderboard with Top Players">

<!-- Game-Specific Tags -->
<meta property="game:points_system" content="Token Efficiency">
<meta property="game:player_count" content="1">
<meta property="game:difficulty" content="Medium">
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://art-of-intent.netlify.app/">
<meta name="twitter:title" content="Art of Intent - Master Prompt Engineering">
<meta name="twitter:description" content="🎯 Guide Arty the Haiku Bot with clever prompts! Hit targets, avoid forbidden words. Daily AI puzzle with leaderboard. Master the art of intent!">
<meta name="twitter:image" content="https://art-of-intent.netlify.app/src/assets/og_image.png">
<meta name="twitter:image:alt" content="Art of Intent - Daily Leaderboard with Top Players">
<meta name="twitter:creator" content="@artofintent">
<meta name="twitter:site" content="@artofintent">
```

## Image Requirements

### OG Image Specifications

**Current Image:**
- **Dimensions**: 1200 x 630 pixels (1.91:1 ratio)
- **Format**: PNG
- **Size**: < 8 MB (recommended < 300 KB)
- **Location**: `/src/assets/og_image.png`

**Platform-Specific Requirements:**

| Platform | Recommended Size | Aspect Ratio | Max Size |
|----------|-----------------|--------------|----------|
| Facebook | 1200 x 630 | 1.91:1 | 8 MB |
| Twitter | 1200 x 628 | 1.91:1 | 5 MB |
| LinkedIn | 1200 x 627 | 1.91:1 | 5 MB |
| Discord | 1200 x 630 | 1.91:1 | 8 MB |
| Slack | 1200 x 630 | 1.91:1 | 5 MB |

**Safe Zone:**
- Keep important content within center 1000 x 500 pixels
- Avoid text near edges (may be cropped on mobile)

## Preview Examples

### Facebook/LinkedIn
```
┌─────────────────────────────────────────┐
│ [OG Image - 1200x630]                   │
│                                         │
│ Art of Intent - Master Prompt Engineering│
│ Guide Arty the Haiku Bot with clever   │
│ prompts! Hit target words, avoid...    │
│                                         │
│ art-of-intent.netlify.app               │
└─────────────────────────────────────────┘
```

### Twitter/X
```
┌─────────────────────────────────────────┐
│ [Large Image Card - 1200x628]          │
│                                         │
│ Art of Intent - Master Prompt Engineering│
│ 🎯 Guide Arty the Haiku Bot with clever│
│ prompts! Hit targets, avoid forbidden...│
│                                         │
│ 🔗 art-of-intent.netlify.app           │
└─────────────────────────────────────────┘
```

### Discord
```
┌─────────────────────────────────────────┐
│ Art of Intent                           │
│ Art of Intent - Master Prompt Engineering│
│                                         │
│ [Embedded Image - 1200x630]            │
│                                         │
│ Guide Arty the Haiku Bot with clever   │
│ prompts! Hit target words, avoid       │
│ forbidden ones. Daily AI puzzle with   │
│ global leaderboard.                    │
└─────────────────────────────────────────┘
```

## Testing Tools

### Validation & Preview Tools

1. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Tests: OG tags, image loading, cache refresh
   - Use: Paste URL, click "Debug" to see preview

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Tests: Twitter Card tags, image display
   - Use: Paste URL to see card preview

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Tests: OG tags for LinkedIn
   - Use: Paste URL to validate and refresh cache

4. **Discord Embed Visualizer**
   - URL: https://leovoel.github.io/embed-visualizer/
   - Tests: Discord embed appearance
   - Use: Preview how embeds look in Discord

5. **Open Graph Check**
   - URL: https://opengraphcheck.com/
   - Tests: All OG tags across platforms
   - Use: Comprehensive validation

## Schema.org Structured Data

In addition to OG tags, we implement Schema.org JSON-LD for enhanced SEO:

```json
{
  "@context": "https://schema.org",
  "@type": "Game",
  "name": "Art of Intent - Haiku Challenge",
  "description": "A text-based game where players guide an AI haiku bot...",
  "genre": "Word Puzzle",
  "gameMode": "SinglePlayer",
  "applicationCategory": "Game"
}
```

## Best Practices

### ✅ Do's
- Use absolute URLs for all images
- Keep titles under 60 characters
- Keep descriptions under 155 characters
- Use high-quality images (1200x630)
- Include alt text for accessibility
- Test on multiple platforms
- Update OG image when major features launch

### ❌ Don'ts
- Don't use relative URLs
- Don't exceed image size limits
- Don't use low-resolution images
- Don't forget to clear cache when updating
- Don't use special characters that break parsing
- Don't rely on default platform behavior

## Cache Management

### Clearing Social Media Caches

When updating OG tags or images:

1. **Facebook**: Use Sharing Debugger → "Scrape Again"
2. **Twitter**: Wait 7 days or use Card Validator
3. **LinkedIn**: Use Post Inspector → "Inspect"
4. **Discord**: Add `?v=timestamp` to URL
5. **Slack**: Unfurl cache clears automatically after 24h

### Cache-Busting Strategy

```html
<!-- Add version parameter to force refresh -->
<meta property="og:image" content="https://art-of-intent.netlify.app/src/assets/og_image.png?v=20251025">
```

## Future Enhancements

### Planned Improvements

1. **Dynamic OG Images**
   - Generate personalized images with user stats
   - Show current leaderboard position
   - Display daily challenge info

2. **Video Previews**
   - Add `og:video` tags for gameplay clips
   - Twitter video cards for tutorials

3. **Rich Snippets**
   - Add more Schema.org markup
   - Implement FAQ schema
   - Add review/rating schema

4. **Platform-Specific Optimization**
   - Pinterest-specific tags
   - Reddit-specific formatting
   - TikTok preview optimization

5. **A/B Testing**
   - Test different OG images
   - Optimize descriptions for CTR
   - Measure social traffic impact

## Analytics Integration

Track social media referrals:

```javascript
// Google Analytics 4
gtag('event', 'social_share', {
  method: 'Facebook',
  content_type: 'game',
  item_id: 'art-of-intent'
});
```

## Monitoring

### Key Metrics to Track
- Social media referral traffic
- Click-through rate from social previews
- Share count by platform
- Engagement rate on shared posts

### Tools
- Google Analytics 4 - Traffic sources
- Facebook Insights - Share analytics
- Twitter Analytics - Card performance
- Bitly/UTM parameters - Campaign tracking

## Resources

### Documentation
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org Game](https://schema.org/Game)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)

### Tools
- [OG Image Generator](https://og-image.vercel.app/)
- [Meta Tags](https://metatags.io/)
- [Social Share Preview](https://socialsharepreview.com/)

---

**Last Updated**: 2025-10-25
**Maintained By**: Product Team
**Review Frequency**: Quarterly or on major releases
