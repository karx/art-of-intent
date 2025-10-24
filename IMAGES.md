# Image Assets Guide

## Required Images for Social Media & PWA

The following images need to be created for complete Open Graph, Twitter Card, and PWA support.

---

## Social Media Images

### 1. Open Graph Image (Facebook, LinkedIn, etc.)
**Filename:** `og-image.png`  
**Size:** 1200 x 630 pixels  
**Format:** PNG or JPG  
**Max file size:** 8 MB (recommended < 300 KB)

**Content Suggestions:**
- Game title: "Art of Intent"
- Subtitle: "Haiku Challenge"
- Visual: Haiku text with target words highlighted
- Background: Dark theme (#0d1117)
- Accent colors: Blue (#58a6ff) and Green (#3fb950)
- Include game elements: target words, blacklist indicator

**Design Tips:**
- Keep text large and readable
- Avoid placing important content near edges (safe zone: 1200x600)
- Test on both light and dark backgrounds
- Use high contrast for readability

### 2. Twitter Card Image
**Filename:** `twitter-image.png`  
**Size:** 1200 x 675 pixels (16:9 ratio)  
**Format:** PNG or JPG  
**Max file size:** 5 MB (recommended < 300 KB)

**Content Suggestions:**
- Similar to OG image but optimized for Twitter's aspect ratio
- Can be the same as OG image (will be cropped)
- Ensure key elements are centered

---

## Favicon & App Icons

### 3. Favicon (32x32)
**Filename:** `favicon-32x32.png`  
**Size:** 32 x 32 pixels  
**Format:** PNG with transparency

**Design:**
- Simple icon representing the game
- Options: Haiku symbol (三), speech bubble, target icon
- Use accent colors on dark background

### 4. Favicon (16x16)
**Filename:** `favicon-16x16.png`  
**Size:** 16 x 16 pixels  
**Format:** PNG with transparency

**Design:**
- Simplified version of 32x32 icon
- Ensure visibility at small size

### 5. Apple Touch Icon
**Filename:** `apple-touch-icon.png`  
**Size:** 180 x 180 pixels  
**Format:** PNG

**Design:**
- No transparency (iOS adds rounded corners)
- Full bleed design
- Consistent with app branding

### 6. PWA Icon (192x192)
**Filename:** `icon-192x192.png`  
**Size:** 192 x 192 pixels  
**Format:** PNG with transparency

**Design:**
- App icon for Android home screen
- Should work on various backgrounds
- Include padding (safe zone)

### 7. PWA Icon (512x512)
**Filename:** `icon-512x512.png`  
**Size:** 512 x 512 pixels  
**Format:** PNG with transparency

**Design:**
- High-resolution version of 192x192
- Used for splash screens
- Maintain consistency

---

## Screenshots (Optional but Recommended)

### 8. Desktop Screenshot
**Filename:** `screenshot-desktop.png`  
**Size:** 1280 x 720 pixels  
**Format:** PNG

**Content:**
- Full game interface
- Show target words, blacklist, and response trail
- Include some game progress

### 9. Mobile Screenshot
**Filename:** `screenshot-mobile.png`  
**Size:** 750 x 1334 pixels (iPhone 8 size)  
**Format:** PNG

**Content:**
- Mobile-optimized view
- Portrait orientation
- Show key game elements

---

## Quick Creation Guide

### Using Design Tools

#### Figma (Recommended)
1. Create artboard with required dimensions
2. Use dark theme colors:
   - Background: #0d1117
   - Text: #c9d1d9
   - Accent Blue: #58a6ff
   - Accent Green: #3fb950
3. Add game title and visual elements
4. Export as PNG

#### Canva
1. Use "Custom dimensions" template
2. Set dimensions (e.g., 1200 x 630)
3. Design with game branding
4. Download as PNG

#### Photoshop/GIMP
1. New file with required dimensions
2. Design with game theme
3. Export for web (PNG-24)

### Using Code (SVG to PNG)

Create an SVG template and convert to PNG:

```html
<!-- og-image-template.svg -->
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0d1117"/>
  <text x="600" y="250" font-family="Arial" font-size="80" 
        fill="#58a6ff" text-anchor="middle" font-weight="bold">
    Art of Intent
  </text>
  <text x="600" y="350" font-family="Arial" font-size="40" 
        fill="#c9d1d9" text-anchor="middle">
    Haiku Challenge
  </text>
  <text x="600" y="450" font-family="monospace" font-size="30" 
        fill="#3fb950" text-anchor="middle" font-style="italic">
    Guide Arty to speak your words
  </text>
</svg>
```

Convert using ImageMagick:
```bash
convert og-image-template.svg og-image.png
```

---

## Placeholder Images

Until custom images are created, you can use placeholder services:

### Temporary OG Image
```html
<!-- Use a placeholder service -->
<meta property="og:image" content="https://via.placeholder.com/1200x630/0d1117/58a6ff?text=Art+of+Intent">
```

### Generate Placeholders
```bash
# Using ImageMagick
convert -size 1200x630 xc:#0d1117 \
  -pointsize 80 -fill "#58a6ff" -gravity center \
  -annotate +0-50 "Art of Intent" \
  -pointsize 40 -fill "#c9d1d9" \
  -annotate +0+50 "Haiku Challenge" \
  og-image.png
```

---

## Image Optimization

After creating images, optimize them:

### Using Online Tools
- **TinyPNG**: https://tinypng.com/
- **Squoosh**: https://squoosh.app/
- **ImageOptim**: https://imageoptim.com/

### Using CLI Tools
```bash
# PNG optimization
pngquant --quality=65-80 og-image.png -o og-image-optimized.png

# JPG optimization
jpegoptim --max=85 og-image.jpg

# WebP conversion (modern browsers)
cwebp -q 80 og-image.png -o og-image.webp
```

---

## Testing Images

### Open Graph Debugger
- **Facebook**: https://developers.facebook.com/tools/debug/
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **Twitter**: https://cards-dev.twitter.com/validator

### Preview Tools
- **Metatags.io**: https://metatags.io/
- **OpenGraph.xyz**: https://www.opengraph.xyz/

### Testing Steps
1. Upload images to server
2. Update meta tags with actual URLs
3. Test with debuggers
4. Clear cache if needed
5. Verify on actual social platforms

---

## File Checklist

- [ ] `og-image.png` (1200x630)
- [ ] `twitter-image.png` (1200x675)
- [ ] `favicon-32x32.png` (32x32)
- [ ] `favicon-16x16.png` (16x16)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `icon-192x192.png` (192x192)
- [ ] `icon-512x512.png` (512x512)
- [ ] `screenshot-desktop.png` (1280x720) - Optional
- [ ] `screenshot-mobile.png` (750x1334) - Optional

---

## Brand Guidelines

### Colors
- **Background**: #0d1117 (Dark)
- **Text Primary**: #c9d1d9 (Light Gray)
- **Text Secondary**: #8b949e (Medium Gray)
- **Accent Blue**: #58a6ff
- **Accent Green**: #3fb950
- **Accent Red**: #f85149
- **Accent Yellow**: #d29922

### Typography
- **Headings**: System fonts (Arial, Helvetica, sans-serif)
- **Code**: Monaco, Menlo, Ubuntu Mono, monospace
- **Body**: -apple-system, BlinkMacSystemFont, 'Segoe UI'

### Visual Elements
- Haiku text (5-7-5 syllable structure)
- Target word badges (green)
- Blacklist word badges (red)
- Token counter
- Code editor aesthetic

---

## Quick Start

### Minimal Setup (5 minutes)
1. Create basic OG image (1200x630)
2. Create favicon (32x32)
3. Upload to root directory
4. Test with Facebook debugger

### Complete Setup (30 minutes)
1. Create all required images
2. Optimize file sizes
3. Upload to server
4. Update meta tags with actual URLs
5. Test on all platforms
6. Create PWA manifest
7. Test installation

---

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [PWA Icons Guide](https://web.dev/add-manifest/)
- [Favicon Generator](https://realfavicongenerator.net/)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)

---

**Note:** Until custom images are created, the meta tags reference placeholder URLs. Update these with actual image URLs once assets are ready.
