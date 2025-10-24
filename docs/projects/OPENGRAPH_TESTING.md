# Open Graph Testing Guide

## Quick Validation

### View Current Meta Tags

```bash
# In browser console
const metaTags = Array.from(document.querySelectorAll('meta'))
  .filter(tag => 
    tag.getAttribute('property')?.startsWith('og:') || 
    tag.getAttribute('name')?.startsWith('twitter:')
  )
  .map(tag => ({
    property: tag.getAttribute('property') || tag.getAttribute('name'),
    content: tag.getAttribute('content')
  }));

console.table(metaTags);
```

### Extract All OG Tags

```javascript
// Get all Open Graph tags
const ogTags = {};
document.querySelectorAll('meta[property^="og:"]').forEach(tag => {
  ogTags[tag.getAttribute('property')] = tag.getAttribute('content');
});
console.log('Open Graph Tags:', ogTags);

// Get all Twitter Card tags
const twitterTags = {};
document.querySelectorAll('meta[name^="twitter:"]').forEach(tag => {
  twitterTags[tag.getAttribute('name')] = tag.getAttribute('content');
});
console.log('Twitter Card Tags:', twitterTags);
```

---

## Online Validators

### 1. Facebook Sharing Debugger
**URL:** https://developers.facebook.com/tools/debug/

**Steps:**
1. Enter your game URL
2. Click "Debug"
3. Review detected metadata
4. Check image preview
5. Click "Scrape Again" to refresh cache

**What to Check:**
- ✅ Title appears correctly
- ✅ Description is complete
- ✅ Image loads and displays
- ✅ URL is canonical
- ⚠️ Warnings about missing optional tags (normal)

**Common Issues:**
- Image not loading → Check image URL and size
- Old data showing → Click "Scrape Again"
- Missing tags → Verify HTML syntax

### 2. Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator

**Steps:**
1. Enter your game URL
2. Click "Preview card"
3. Review card appearance
4. Check image and text

**Card Types:**
- `summary_large_image` - Large image card (recommended)
- `summary` - Small image card
- `app` - App install card
- `player` - Media player card

**What to Check:**
- ✅ Card type is correct
- ✅ Image displays properly
- ✅ Title and description fit
- ✅ No truncation issues

### 3. LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/

**Steps:**
1. Enter your game URL
2. Click "Inspect"
3. Review preview
4. Check professional appearance

**What to Check:**
- ✅ Professional presentation
- ✅ Image quality
- ✅ Description clarity
- ✅ No formatting issues

### 4. Metatags.io
**URL:** https://metatags.io/

**Steps:**
1. Enter your game URL
2. View previews for multiple platforms
3. Check Google, Facebook, Twitter, LinkedIn
4. Download preview images

**Benefits:**
- See all platforms at once
- Visual comparison
- Export previews
- Edit and test

### 5. OpenGraph.xyz
**URL:** https://www.opengraph.xyz/

**Steps:**
1. Enter your game URL
2. View parsed metadata
3. Check for errors
4. Validate structure

**Features:**
- Raw tag display
- Validation errors
- Missing tag warnings
- Best practice suggestions

---

## Manual Testing

### Test in Browser DevTools

```javascript
// Check if all required OG tags exist
const requiredOGTags = [
  'og:type',
  'og:url',
  'og:title',
  'og:description',
  'og:image'
];

const missingTags = requiredOGTags.filter(tag => 
  !document.querySelector(`meta[property="${tag}"]`)
);

if (missingTags.length > 0) {
  console.error('Missing required OG tags:', missingTags);
} else {
  console.log('✅ All required OG tags present');
}

// Check Twitter Card tags
const requiredTwitterTags = [
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image'
];

const missingTwitterTags = requiredTwitterTags.filter(tag => 
  !document.querySelector(`meta[name="${tag}"]`)
);

if (missingTwitterTags.length > 0) {
  console.error('Missing required Twitter tags:', missingTwitterTags);
} else {
  console.log('✅ All required Twitter tags present');
}
```

### Validate Image URLs

```javascript
// Test if OG image loads
const ogImage = document.querySelector('meta[property="og:image"]')
  ?.getAttribute('content');

if (ogImage) {
  const img = new Image();
  img.onload = () => console.log('✅ OG image loads successfully');
  img.onerror = () => console.error('❌ OG image failed to load');
  img.src = ogImage;
}

// Test Twitter image
const twitterImage = document.querySelector('meta[name="twitter:image"]')
  ?.getAttribute('content');

if (twitterImage) {
  const img = new Image();
  img.onload = () => console.log('✅ Twitter image loads successfully');
  img.onerror = () => console.error('❌ Twitter image failed to load');
  img.src = twitterImage;
}
```

---

## Platform-Specific Testing

### Facebook
1. Share the URL in a test post (use "Only Me" privacy)
2. Check preview appearance
3. Verify image, title, description
4. Delete test post

### Twitter
1. Compose a tweet with the URL
2. Check card preview
3. Verify appearance
4. Don't post (or delete after testing)

### LinkedIn
1. Create a test post with the URL
2. Check professional appearance
3. Verify image quality
4. Delete test post

### Discord
1. Paste URL in a test channel
2. Check embed appearance
3. Verify rich preview
4. Test on mobile

### Slack
1. Paste URL in a test channel
2. Check unfurl preview
3. Verify formatting
4. Test link expansion

---

## Validation Checklist

### Required Open Graph Tags
- [ ] `og:type` - Set to "website"
- [ ] `og:url` - Canonical URL
- [ ] `og:title` - Game title
- [ ] `og:description` - Game description
- [ ] `og:image` - Preview image URL
- [ ] `og:image:width` - Image width (1200)
- [ ] `og:image:height` - Image height (630)
- [ ] `og:image:alt` - Image description

### Optional but Recommended
- [ ] `og:site_name` - Site name
- [ ] `og:locale` - Language/region
- [ ] `game:points_system` - Scoring system
- [ ] `game:player_count` - Number of players
- [ ] `game:difficulty` - Difficulty level

### Required Twitter Card Tags
- [ ] `twitter:card` - Card type
- [ ] `twitter:title` - Tweet title
- [ ] `twitter:description` - Tweet description
- [ ] `twitter:image` - Preview image
- [ ] `twitter:image:alt` - Image description

### Optional Twitter Tags
- [ ] `twitter:site` - Site Twitter handle
- [ ] `twitter:creator` - Creator handle

### Additional Meta Tags
- [ ] `description` - Page description
- [ ] `keywords` - SEO keywords
- [ ] `author` - Content author
- [ ] `theme-color` - Browser theme
- [ ] `canonical` - Canonical URL

---

## Common Issues & Solutions

### Issue: Image Not Showing

**Symptoms:**
- Broken image in preview
- No image displayed
- Generic placeholder shown

**Solutions:**
1. Verify image URL is absolute (not relative)
2. Check image is publicly accessible
3. Ensure image meets size requirements:
   - OG: 1200x630px minimum
   - Twitter: 1200x675px minimum
4. Verify image file size < 8MB
5. Check image format (PNG, JPG, GIF)
6. Test image URL directly in browser

### Issue: Old Preview Showing

**Symptoms:**
- Updated content not reflected
- Old image or text showing
- Changes not visible

**Solutions:**
1. Clear platform cache:
   - Facebook: Use Sharing Debugger "Scrape Again"
   - Twitter: Wait 7 days or contact support
   - LinkedIn: Use Post Inspector
2. Add cache-busting parameter: `?v=2`
3. Wait for cache expiration (varies by platform)
4. Verify changes are live on server

### Issue: Text Truncated

**Symptoms:**
- Title or description cut off
- "..." appearing
- Missing content

**Solutions:**
1. Check character limits:
   - OG title: ~60 characters
   - OG description: ~200 characters
   - Twitter title: ~70 characters
   - Twitter description: ~200 characters
2. Shorten text to fit
3. Front-load important information
4. Test on multiple platforms

### Issue: Wrong Card Type

**Symptoms:**
- Small image instead of large
- Unexpected layout
- Missing elements

**Solutions:**
1. Verify `twitter:card` value:
   - Use `summary_large_image` for large images
   - Use `summary` for small images
2. Check tag order (card type should be first)
3. Validate with Twitter Card Validator

---

## Automated Testing

### Node.js Script

```javascript
// test-og-tags.js
const axios = require('axios');
const cheerio = require('cheerio');

async function testOGTags(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  const ogTags = {};
  $('meta[property^="og:"]').each((i, el) => {
    ogTags[$(el).attr('property')] = $(el).attr('content');
  });
  
  const twitterTags = {};
  $('meta[name^="twitter:"]').each((i, el) => {
    twitterTags[$(el).attr('name')] = $(el).attr('content');
  });
  
  console.log('Open Graph Tags:', ogTags);
  console.log('Twitter Card Tags:', twitterTags);
  
  // Validate required tags
  const required = ['og:type', 'og:url', 'og:title', 'og:description', 'og:image'];
  const missing = required.filter(tag => !ogTags[tag]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required tags:', missing);
  } else {
    console.log('✅ All required tags present');
  }
}

testOGTags('http://localhost:8000');
```

### Python Script

```python
# test_og_tags.py
import requests
from bs4 import BeautifulSoup

def test_og_tags(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    og_tags = {}
    for tag in soup.find_all('meta', property=lambda x: x and x.startswith('og:')):
        og_tags[tag['property']] = tag.get('content', '')
    
    twitter_tags = {}
    for tag in soup.find_all('meta', attrs={'name': lambda x: x and x.startswith('twitter:')}):
        twitter_tags[tag['name']] = tag.get('content', '')
    
    print('Open Graph Tags:', og_tags)
    print('Twitter Card Tags:', twitter_tags)
    
    required = ['og:type', 'og:url', 'og:title', 'og:description', 'og:image']
    missing = [tag for tag in required if tag not in og_tags]
    
    if missing:
        print(f'❌ Missing required tags: {missing}')
    else:
        print('✅ All required tags present')

test_og_tags('http://localhost:8000')
```

---

## Performance Testing

### Check Meta Tag Count

```javascript
const metaCount = document.querySelectorAll('meta').length;
console.log(`Total meta tags: ${metaCount}`);

const ogCount = document.querySelectorAll('meta[property^="og:"]').length;
console.log(`Open Graph tags: ${ogCount}`);

const twitterCount = document.querySelectorAll('meta[name^="twitter:"]').length;
console.log(`Twitter Card tags: ${twitterCount}`);
```

**Recommended:**
- Total meta tags: 20-40
- OG tags: 8-15
- Twitter tags: 5-10

### Check Page Load Impact

```javascript
// Measure meta tag parsing time
const start = performance.now();
const allMeta = document.querySelectorAll('meta');
const end = performance.now();
console.log(`Meta tag parsing: ${(end - start).toFixed(2)}ms`);
```

**Expected:** < 1ms (negligible impact)

---

## Best Practices

### 1. Use Absolute URLs
```html
<!-- ❌ Wrong -->
<meta property="og:image" content="/og-image.png">

<!-- ✅ Correct -->
<meta property="og:image" content="https://artofintent.game/og-image.png">
```

### 2. Provide Image Dimensions
```html
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

### 3. Include Alt Text
```html
<meta property="og:image:alt" content="Art of Intent - Daily Haiku Challenge Game">
```

### 4. Set Locale
```html
<meta property="og:locale" content="en_US">
```

### 5. Use Descriptive Titles
```html
<!-- ❌ Too generic -->
<meta property="og:title" content="Game">

<!-- ✅ Descriptive -->
<meta property="og:title" content="Art of Intent - Haiku Challenge">
```

---

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Discord Embed Guide](https://discord.com/developers/docs/resources/channel#embed-object)

---

## Continuous Monitoring

### Set Up Alerts

Monitor for:
- Broken image URLs
- Missing meta tags
- Invalid tag values
- Cache issues

### Regular Testing Schedule

- **Daily:** Check main validators
- **Weekly:** Test on actual platforms
- **Monthly:** Review analytics
- **After updates:** Full validation

---

**Status:** All Open Graph and Twitter Card tags are implemented. Update image URLs once assets are created, then test with validators.
