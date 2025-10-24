# Mobile-First Layout Redesign
## Art of Intent - UX Improvements

---

## Design Philosophy

**Mobile-First Approach:**
- Optimize for small screens (320px+)
- Maximize usable space
- Fixed sections for critical info
- Scrollable middle canvas for content
- Touch-friendly controls

---

## New Layout Structure

```
┌─────────────────────────────────┐
│ HEADER (Compact, Fixed Top)    │ ← Minimal, essential controls
├─────────────────────────────────┤
│ TARGET │ BLACKLIST (Sticky Top)│ ← Always visible, combined
│ ATT: 3/10 │ TOK: 245 │ MAT: 1/3│ ← Compact score bar
├─────────────────────────────────┤
│                                 │
│   CONVERSATION TRAIL            │
│   (Scrollable Middle Canvas)    │ ← Flex-grow, main content
│                                 │
│   > USER: prompt                │
│   < ARTY: haiku response        │
│                                 │
│   [More conversation...]        │
│                                 │
├─────────────────────────────────┤
│ INPUT SECTION (Sticky Bottom)  │ ← Always accessible
│ [Text Input]                    │
│ [MIC] [SUBMIT]                  │
└─────────────────────────────────┘
```

---

## Key Changes

### 1. Header - Compact & Minimal
**Before:**
- Large title with gradient
- Subtitle text
- ASCII art borders
- Lots of padding

**After:**
- Small uppercase title (11px)
- No subtitle on mobile
- No ASCII borders
- Minimal padding (4px 8px)
- Buttons compressed (9px font)

### 2. Game Info - Combined Top Section
**Before:**
- 3 separate cards (Target, Blacklist, Score)
- Grid layout
- Lots of vertical space
- Separate sections

**After:**
- Single combined section
- Target | Blacklist side-by-side
- Compact score bar below
- Sticky at top (always visible)
- Minimal padding

### 3. Response Trail - Scrollable Canvas
**Before:**
- Fixed height (400px)
- Nested scrolling
- Extra borders
- Section header

**After:**
- Flex-grow (fills available space)
- Main scrollable area
- No nested containers
- No header (space saving)
- Compact trail items

### 4. Input Section - Sticky Bottom
**Before:**
- Static position
- Could scroll off screen
- Large padding

**After:**
- Sticky bottom (always visible)
- Never scrolls away
- Compact padding
- Easy thumb access

---

## CSS Architecture

### Flexbox Layout
```css
body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.response-trail {
    flex: 1; /* Grows to fill space */
    overflow-y: auto;
    min-height: 0; /* Important for flex scrolling */
}
```

### Sticky Positioning
```css
.game-words-section {
    position: sticky;
    top: 0;
    z-index: 100;
}

.input-section {
    position: sticky;
    bottom: 0;
    z-index: 100;
}
```

---

## Space Optimization

### Header
- **Before:** ~80px height
- **After:** ~32px height
- **Saved:** 48px (60% reduction)

### Game Info
- **Before:** ~200px height (3 cards)
- **After:** ~60px height (combined)
- **Saved:** 140px (70% reduction)

### Trail Section
- **Before:** Fixed 400px + padding
- **After:** Dynamic (fills screen)
- **Gained:** Variable, typically 200-400px more

### Input Section
- **Before:** ~120px
- **After:** ~80px
- **Saved:** 40px (33% reduction)

**Total Space Gained:** ~230px for content on typical mobile screen

---

## Mobile-Specific Features

### Touch Targets
- Minimum 44x44px for buttons
- Adequate spacing between controls
- Large input area
- Easy-to-tap word badges

### Typography
- Reduced font sizes for mobile
- Maintained readability (min 9px)
- Uppercase for clarity
- Monospace for consistency

### Scrolling
- Single scroll area (trail)
- No nested scrolling
- Smooth momentum scrolling
- Pull-to-refresh compatible

### Performance
- Hardware-accelerated sticky positioning
- Minimal repaints
- Efficient flexbox layout
- No JavaScript layout calculations

---

## Responsive Breakpoints

### Mobile (Default: 320px - 768px)
- Compact header
- Combined word section
- Single column layout
- Sticky top/bottom
- Hidden live stats

### Tablet (768px - 1024px)
- Slightly larger fonts
- More padding
- Show subtitle
- Optional: Show live stats

### Desktop (1024px+)
- Full header with ASCII borders
- Separate game info cards
- Side-by-side layouts
- Show all features
- Max-width container

---

## Implementation Details

### HTML Changes
```html
<!-- Before: 3 separate cards -->
<div class="game-info">
    <div class="info-card target-card">...</div>
    <div class="info-card blacklist-card">...</div>
    <div class="info-card score-card">...</div>
</div>

<!-- After: Combined section -->
<div class="game-words-section">
    <div class="words-container">
        <div class="words-group target-group">
            <h3>TARGET</h3>
            <div id="targetWords" class="word-list"></div>
        </div>
        <div class="words-divider">│</div>
        <div class="words-group blacklist-group">
            <h3>BLACKLIST</h3>
            <div id="blacklistWords" class="word-list"></div>
        </div>
    </div>
    <div class="score-compact">
        <span>ATT: <strong id="attempts">0</strong>/10</span>
        <span>│</span>
        <span>TOK: <strong id="totalTokens">0</strong></span>
        <span>│</span>
        <span>MAT: <strong id="matches">0/3</strong></span>
    </div>
</div>
```

### CSS Changes
- Flexbox container layout
- Sticky positioning for top/bottom
- Flex-grow for middle section
- Compact spacing variables
- Hidden elements on mobile

---

## Testing Checklist

### Layout
- [ ] Header stays at top
- [ ] Words section sticky at top
- [ ] Trail scrolls independently
- [ ] Input section sticky at bottom
- [ ] No horizontal scroll
- [ ] Proper spacing throughout

### Functionality
- [ ] All buttons accessible
- [ ] Input always reachable
- [ ] Words always visible
- [ ] Score updates correctly
- [ ] Trail items display properly
- [ ] Modals work correctly

### Devices
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] iPad Mini (768x1024)
- [ ] iPad Pro (1024x1366)

### Orientations
- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Rotation handling

---

## Known Issues & Solutions

### Issue: Keyboard Overlap
**Problem:** Mobile keyboard covers input section

**Solution:** 
- Use `visualViewport` API
- Adjust bottom padding when keyboard opens
- Scroll to input on focus

### Issue: Safari Address Bar
**Problem:** Address bar affects viewport height

**Solution:**
- Use `100vh` with fallback
- Account for dynamic viewport units
- Test with/without address bar

### Issue: Pull-to-Refresh
**Problem:** May interfere with trail scrolling

**Solution:**
- Disable on trail container
- Use `overscroll-behavior: contain`

---

## Future Enhancements

### Gestures
- Swipe to navigate trail
- Pull down to refresh
- Pinch to zoom (disabled for consistency)

### Animations
- Smooth scroll to new messages
- Fade in new trail items
- Slide in/out modals

### Accessibility
- Larger touch targets option
- High contrast mode
- Screen reader optimization
- Keyboard navigation

---

## Files Modified

1. **index.html**
   - Restructured game info section
   - Combined target/blacklist
   - Compact score display

2. **dos-theme.css**
   - Flexbox layout system
   - Sticky positioning
   - Mobile-first styles
   - Compact spacing
   - Hidden elements

---

*Last Updated: 2025-01-24*
*Version: 0.3.0 - Mobile-First Redesign*
