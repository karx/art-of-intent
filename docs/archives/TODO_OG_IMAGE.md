# TODO: Update OG Image PNG

## Action Required Before Launch

The OG image needs to be regenerated with the new compact stats design.

### Steps:

1. Open `generate-og-image.html` in a browser
2. Click "Use Mock Data" button
3. Click "Generate Image" button
4. Click "Download PNG" button
5. Replace `src/assets/og_image.png` with the downloaded file
6. Delete this TODO file

### Current Status:
- ✅ New SVG template created with compact stats (`og-leaderboard.svg`)
- ✅ OG tags updated with launch-ready messaging
- ⚠️ PNG file still uses old design (needs regeneration)

### Why PNG?
Social media platforms (Facebook, Twitter, LinkedIn) have better compatibility with PNG than SVG for Open Graph images.

### Alternative:
If browser-based conversion doesn't work, you can:
1. Use the SVG directly (already at `src/assets/og-leaderboard.svg`)
2. Update OG tags to point to SVG instead of PNG
3. Note: Some platforms may not display SVG correctly
