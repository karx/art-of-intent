# Icon System - Art of Intent

## Overview

The Art of Intent icon system features a DOS-themed design with an "AI" monogram, consistent with the game's retro aesthetic.

## Icon Styles

### 1. AI Monogram (Default)
- Bold "AI" text in yellow (#FFFF55)
- Cyan border (#55FFFF) with corner brackets
- Green accent line and prompt indicator (>)
- Scanline pattern for CRT effect
- **Best for**: 180px and larger

### 2. Haiku Lines
- 5-7-5 syllable pattern represented as lines
- Minimalist design
- "Art of Intent" text at bottom
- **Best for**: Alternative branding

### 3. Minimal
- Simple "AI" in bordered square
- No decorative elements
- **Best for**: 16px and 32px favicons

## Generated Sizes

| Size | Filename | Purpose | Format |
|------|----------|---------|--------|
| 16x16 | favicon-16x16 | Browser tab (small) | SVG/PNG |
| 32x32 | favicon-32x32 | Browser tab (standard) | SVG/PNG |
| 180x180 | apple-touch-icon | iOS home screen | SVG/PNG |
| 192x192 | android-chrome-192x192 | Android home screen | SVG/PNG |
| 512x512 | android-chrome-512x512 | Android splash screen | SVG/PNG |

## Color Palette

```css
--background: #000000  /* Black */
--border:     #55FFFF  /* Cyan */
--primary:    #FFFF55  /* Yellow */
--secondary:  #55FF55  /* Green */
--accent:     #FF5555  /* Red */
```

## Generation

### Using Node.js
```bash
node generate-icons.cjs
```

Generates SVG files for all sizes.

### Using Browser
1. Open `generate-icons.html` in a browser
2. Select icon style (AI Monogram, Haiku Lines, or Minimal)
3. Click "Generate All Icons"
4. Download individual icons (SVG or PNG)
5. Or click "Download All" for batch PNG export

## File Structure

```
/
├── favicon-16x16.svg           # Small favicon (SVG)
├── favicon-32x32.svg           # Standard favicon (SVG)
├── apple-touch-icon.svg        # iOS icon (SVG)
├── android-chrome-192x192.svg  # Android icon (SVG)
├── android-chrome-512x512.svg  # Android splash (SVG)
├── favicon-16x16.png           # Small favicon (PNG fallback)
├── favicon-32x32.png           # Standard favicon (PNG fallback)
├── apple-touch-icon.png        # iOS icon (PNG)
├── android-chrome-192x192.png  # Android icon (PNG)
├── android-chrome-512x512.png  # Android splash (PNG)
└── site.webmanifest            # PWA manifest
```

## HTML Integration

```html
<!-- Favicon (SVG preferred, PNG fallback) -->
<link rel="icon" type="image/svg+xml" href="/favicon-32x32.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">
```

## Web Manifest

The `site.webmanifest` file configures PWA behavior:

```json
{
  "name": "Art of Intent - Haiku Challenge",
  "short_name": "Art of Intent",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#0d1117",
  "background_color": "#0d1117",
  "display": "standalone"
}
```

## Browser Support

### SVG Favicons
- ✅ Chrome 80+
- ✅ Firefox 41+
- ✅ Safari 9+
- ✅ Edge 79+

### PNG Fallback
- ✅ All browsers
- Automatically used if SVG not supported

## Design Guidelines

### Do's
- ✅ Keep the DOS aesthetic (monospace fonts, terminal colors)
- ✅ Use high contrast for visibility
- ✅ Maintain square aspect ratio
- ✅ Test at small sizes (16x16)
- ✅ Use SVG for scalability

### Don'ts
- ❌ Don't use gradients (not DOS-style)
- ❌ Don't add too much detail for small sizes
- ❌ Don't use colors outside the palette
- ❌ Don't use anti-aliasing effects
- ❌ Don't make text too small to read

## Customization

To create custom icons:

1. Edit `src/js/icon-generator.js`
2. Modify colors, text, or layout
3. Run `node generate-icons.cjs`
4. Open `generate-icons.html` to preview
5. Download PNG versions if needed

## Testing

### Browser Tab
1. Open the game in a browser
2. Check the favicon in the tab
3. Verify it's visible and recognizable

### Mobile Home Screen
1. Add to home screen on iOS/Android
2. Check icon appearance
3. Verify it matches the design

### PWA Install
1. Install as PWA (if supported)
2. Check app icon
3. Verify splash screen

## Troubleshooting

### Icon not showing
- Clear browser cache
- Check file paths in HTML
- Verify files exist in root directory
- Check browser console for errors

### Wrong icon displayed
- Browser may cache old icon
- Hard refresh (Ctrl+Shift+R)
- Clear site data in browser settings

### Blurry on mobile
- Ensure PNG versions are generated
- Check manifest references correct files
- Verify icon sizes are correct

## Future Improvements

- [ ] Animated SVG icon for loading states
- [ ] Dark/light mode variants
- [ ] Seasonal themes
- [ ] Achievement badges
- [ ] Custom user icons

## Resources

- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Icons Guide](https://web.dev/add-manifest/)
- [SVG Favicon Support](https://caniuse.com/link-icon-svg)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
