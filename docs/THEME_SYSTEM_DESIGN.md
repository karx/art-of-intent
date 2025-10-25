# Theme System Design

## Overview

Multi-theme system allowing users to customize the visual appearance of Art of Intent. Themes affect the entire application including the share card generation.

## Themes

### 1. Solarized (Default)
**Inspiration**: Solarized Dark color scheme
- **Background**: Deep blue-black (#002b36)
- **Text**: Warm gray (#839496)
- **Accents**: Cyan, green, yellow
- **Aesthetic**: Terminal, retro computing, DOS-era
- **Mood**: Focused, professional, nostalgic

### 2. Polarized
**Inspiration**: High contrast, inverted Solarized
- **Background**: Light cream (#fdf6e3)
- **Text**: Dark blue-gray (#073642)
- **Accents**: Bold blues, oranges, magentas
- **Aesthetic**: Bright, energetic, modern
- **Mood**: Vibrant, alert, dynamic

### 3. Light
**Inspiration**: Clean, minimal, modern light theme
- **Background**: Pure white (#ffffff)
- **Text**: Charcoal (#2d3748)
- **Accents**: Soft blues, greens
- **Aesthetic**: Clean, professional, accessible
- **Mood**: Clear, open, friendly

### 4. Dark
**Inspiration**: Modern dark mode (GitHub, VSCode)
- **Background**: True black (#0d1117)
- **Text**: Light gray (#c9d1d9)
- **Accents**: Bright blues, greens
- **Aesthetic**: Modern, sleek, OLED-friendly
- **Mood**: Immersive, focused, battery-saving

### 5. Cartoon
**Inspiration**: Playful, colorful, game-like
- **Background**: Soft pastels (#f0f4ff)
- **Text**: Deep purple (#4a1d96)
- **Accents**: Rainbow colors, gradients
- **Aesthetic**: Fun, whimsical, approachable
- **Mood**: Playful, creative, joyful

## Technical Architecture

### CSS Variables Structure

```css
:root {
  /* Base Colors */
  --bg-primary: #002b36;
  --bg-secondary: #073642;
  --bg-tertiary: #0a4a5a;
  
  /* Text Colors */
  --text-primary: #839496;
  --text-secondary: #586e75;
  --text-bright: #93a1a1;
  --text-dim: #657b83;
  
  /* Accent Colors */
  --accent-primary: #2aa198;
  --accent-secondary: #268bd2;
  --accent-success: #859900;
  --accent-warning: #b58900;
  --accent-error: #dc322f;
  
  /* UI Elements */
  --border-color: #586e75;
  --border-active: #2aa198;
  --shadow-color: rgba(0, 0, 0, 0.3);
  
  /* Interactive States */
  --hover-bg: #0a4a5a;
  --active-bg: #0d5766;
  --focus-outline: #2aa198;
}
```

### Theme Data Structure

```javascript
const themes = {
  solarized: {
    name: 'Solarized',
    description: 'Classic terminal aesthetic',
    colors: { /* ... */ }
  },
  polarized: {
    name: 'Polarized',
    description: 'High contrast light theme',
    colors: { /* ... */ }
  },
  light: {
    name: 'Light',
    description: 'Clean and minimal',
    colors: { /* ... */ }
  },
  dark: {
    name: 'Dark',
    description: 'Modern dark mode',
    colors: { /* ... */ }
  },
  cartoon: {
    name: 'Cartoon',
    description: 'Playful and colorful',
    colors: { /* ... */ }
  }
};

const textSizes = {
  small: { name: 'Small', multiplier: 0.9, lineHeight: 1.4 },
  medium: { name: 'Medium', multiplier: 1.0, lineHeight: 1.5 },
  large: { name: 'Large', multiplier: 1.1, lineHeight: 1.6 },
  xlarge: { name: 'Extra Large', multiplier: 1.25, lineHeight: 1.7 },
  huge: { name: 'Huge', multiplier: 1.5, lineHeight: 1.8 }
};

const voiceStyles = {
  contemplative: {
    name: 'Contemplative',
    description: 'Slow and calm',
    rate: 0.7,
    pitch: 0.9
  },
  natural: {
    name: 'Natural',
    description: 'Balanced reading',
    rate: 0.85,
    pitch: 1.0
  },
  expressive: {
    name: 'Expressive',
    description: 'Slightly animated',
    rate: 0.95,
    pitch: 1.1
  }
};
```

### User Preferences Structure

```javascript
const userPreferences = {
  theme: 'solarized',        // Current theme
  textSize: 'medium',        // Current text size
  voiceStyle: 'contemplative', // Voice reading style
  voiceName: null,           // Selected voice (null = default)
  reducedMotion: false,      // Respect prefers-reduced-motion
  autoTheme: false,          // Follow system dark mode
  customColors: null         // Future: custom theme colors
};

// Stored in localStorage
localStorage.setItem('artOfIntent_preferences', JSON.stringify(userPreferences));
```

## Voice Settings

### Voice Styles

Three preset voice styles for haiku readout:

1. **Contemplative** (Default)
   - Rate: 0.7 (slow, meditative)
   - Pitch: 0.9 (slightly lower, calm)
   - Best for: Traditional haiku reading, mindful experience

2. **Natural**
   - Rate: 0.85 (balanced)
   - Pitch: 1.0 (neutral)
   - Best for: General use, comfortable listening

3. **Expressive**
   - Rate: 0.95 (slightly faster)
   - Pitch: 1.1 (slightly higher, animated)
   - Best for: Energetic reading, playful tone

### Voice Selection

Users can select from available system voices:
- Browser provides list via `speechSynthesis.getVoices()`
- Voices vary by OS and browser
- Preference for English voices by default
- Voice selection persisted in localStorage

### Integration

Voice settings integrate with the `speakText()` function:
```javascript
function speakText(text) {
  const settings = themeManager.getVoiceSettings();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = settings.voice;
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  window.speechSynthesis.speak(utterance);
}
```

## Implementation Plan

### Phase 1: Core Theme System
1. Create theme CSS files
2. Implement theme switcher logic
3. Add localStorage persistence
4. Create theme preview component

### Phase 2: UI Integration
1. Add theme selector to navigation
2. Create theme picker modal
3. Add keyboard shortcut (Ctrl+T)
4. Show current theme indicator

### Phase 3: Share Card Integration
1. Pass theme to share card generator
2. Update canvas rendering with theme colors
3. Add theme badge to share card
4. Test all themes in share card

### Phase 4: Polish
1. Smooth theme transitions
2. Respect prefers-color-scheme
3. Add theme-specific assets
4. Accessibility testing

## Text Size Settings

### Size Options

**Small (90%)**
- Base: 13.5px
- Use case: Power users, large screens, more content visible
- Line height: 1.4

**Medium (100%) - Default**
- Base: 15px
- Use case: Standard reading, balanced
- Line height: 1.5

**Large (110%)**
- Base: 16.5px
- Use case: Comfortable reading, accessibility
- Line height: 1.6

**Extra Large (125%)**
- Base: 18.75px
- Use case: Accessibility, vision impairment, mobile
- Line height: 1.7

**Huge (150%)**
- Base: 22.5px
- Use case: Severe vision impairment, presentations
- Line height: 1.8

### CSS Implementation

```css
:root {
  --text-size-multiplier: 1.0; /* Default: Medium */
  --base-font-size: 15px;
  --computed-font-size: calc(var(--base-font-size) * var(--text-size-multiplier));
  
  /* Responsive scaling */
  --h1-size: calc(var(--computed-font-size) * 2.0);
  --h2-size: calc(var(--computed-font-size) * 1.5);
  --h3-size: calc(var(--computed-font-size) * 1.25);
  --small-size: calc(var(--computed-font-size) * 0.875);
}

body {
  font-size: var(--computed-font-size);
}
```

### Text Size Presets

```javascript
const textSizes = {
  small: {
    name: 'Small',
    multiplier: 0.9,
    description: 'Compact, more content',
    lineHeight: 1.4
  },
  medium: {
    name: 'Medium',
    multiplier: 1.0,
    description: 'Default size',
    lineHeight: 1.5
  },
  large: {
    name: 'Large',
    multiplier: 1.1,
    description: 'Comfortable reading',
    lineHeight: 1.6
  },
  xlarge: {
    name: 'Extra Large',
    multiplier: 1.25,
    description: 'Accessibility',
    lineHeight: 1.7
  },
  huge: {
    name: 'Huge',
    multiplier: 1.5,
    description: 'Maximum readability',
    lineHeight: 1.8
  }
};
```

## User Experience

### Settings Location
- **Desktop**: Settings icon in sidebar → Appearance
- **Mobile**: Profile button → Settings → Appearance
- **Keyboard**: 
  - `Ctrl+T` - Open theme picker
  - `Ctrl++` - Increase text size
  - `Ctrl+-` - Decrease text size
  - `Ctrl+0` - Reset to default

### Appearance Settings UI
```
┌─────────────────────────────────────┐
│ Appearance Settings                 │
├─────────────────────────────────────┤
│                                     │
│ Theme                               │
│ ○ Solarized (Current)              │
│ ○ Polarized                        │
│ ○ Light                            │
│ ○ Dark                             │
│ ○ Cartoon                          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Text Size                           │
│ ○ Small (90%)                      │
│ ● Medium (100%) - Default          │
│ ○ Large (110%)                     │
│ ○ Extra Large (125%)               │
│ ○ Huge (150%)                      │
│                                     │
│ [Preview Text Sample]               │
│ The quick brown fox jumps over...  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ [Apply] [Reset to Defaults]        │
└─────────────────────────────────────┘
```

### Theme Preview
- Live preview when hovering over theme option
- Show sample UI elements in theme colors
- Instant feedback without committing

## Accessibility Considerations

### Color Contrast
- All themes must meet WCAG AA standards (4.5:1 for text)
- Test with contrast checker tools
- Provide high contrast option if needed

### Text Size
- Support browser zoom (200%+)
- Maintain readability at all sizes
- Ensure UI elements scale proportionally
- Test with screen magnifiers
- Respect user's browser font size preferences

### Motion
- Respect `prefers-reduced-motion`
- Smooth transitions (200ms) by default
- Instant switching if motion reduced

### Color Blindness
- Test with color blindness simulators
- Don't rely solely on color for information
- Use patterns/icons in addition to colors

### Keyboard Shortcuts for Text Size
- `Ctrl++` or `Ctrl+=` - Increase text size
- `Ctrl+-` - Decrease text size
- `Ctrl+0` - Reset to default (100%)
- Works independently of browser zoom

## Share Card Theme Integration

### Theme Badge
Add small badge to share card showing theme used:
```
┌─────────────────────────────┐
│ Art of Intent               │
│                             │
│ [Game Stats]                │
│                             │
│ Theme: Solarized         🎨 │
└─────────────────────────────┘
```

### Color Mapping
Share card uses theme colors for:
- Background
- Text
- Progress bars
- Borders
- Accents

### Theme Consistency
- Share card matches current app theme
- Option to generate in different theme
- Preview before sharing

## Performance

### Optimization
- CSS variables for instant switching
- No page reload required
- Minimal JavaScript overhead
- Cached theme preference

### Loading
- Apply saved theme before first paint
- Prevent flash of wrong theme
- Inline critical theme CSS

## Future Enhancements

### Custom Themes
- User-created color schemes
- Import/export theme JSON
- Community theme sharing

### Theme Scheduling
- Auto-switch based on time of day
- Follow system dark mode
- Custom schedule (work hours vs. evening)

### Theme Variants
- Solarized Light/Dark variants
- High contrast versions
- Colorblind-friendly variants

### Advanced Features
- Per-component theme overrides
- Gradient backgrounds
- Animated themes
- Seasonal themes

## Testing Checklist

### Visual Testing
- [ ] All UI components render correctly in all themes
- [ ] Text is readable in all themes and sizes
- [ ] Borders and dividers are visible
- [ ] Hover states work properly
- [ ] Focus indicators are clear
- [ ] Layout doesn't break at largest text size
- [ ] Icons scale proportionally with text

### Functional Testing
- [ ] Theme persists across sessions
- [ ] Text size persists across sessions
- [ ] Theme applies to all pages
- [ ] Text size applies to all pages
- [ ] Share card uses correct theme
- [ ] Keyboard shortcuts work (Ctrl+T, Ctrl++, Ctrl+-, Ctrl+0)
- [ ] Mobile theme picker works
- [ ] Mobile text size picker works
- [ ] Preview updates in real-time

### Text Size Testing
- [ ] Small (90%) - All text readable
- [ ] Medium (100%) - Default, balanced
- [ ] Large (110%) - Comfortable, no overflow
- [ ] Extra Large (125%) - Accessible, layout intact
- [ ] Huge (150%) - Maximum size, usable
- [ ] Line height adjusts appropriately
- [ ] Headings scale proportionally
- [ ] UI elements don't overlap
- [ ] Mobile layout adapts correctly

### Accessibility Testing
- [ ] Color contrast meets WCAG AA in all themes
- [ ] Text size meets WCAG AAA (user control)
- [ ] Screen reader announces theme change
- [ ] Screen reader announces text size change
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Reduced motion respected
- [ ] Works with browser zoom (200%+)
- [ ] Works with screen magnifiers

### Cross-Browser Testing
- [ ] Chrome/Edge - All themes and sizes
- [ ] Firefox - All themes and sizes
- [ ] Safari - All themes and sizes
- [ ] Mobile browsers - All themes and sizes
- [ ] Dark mode compatibility
- [ ] High contrast mode compatibility

## Documentation

### User Documentation
- How to change themes
- Theme descriptions
- Keyboard shortcuts
- Troubleshooting

### Developer Documentation
- Theme variable reference
- Adding new themes
- Theme system API
- Best practices

---

**Status**: Design Phase
**Priority**: High
**Estimated Effort**: 2-3 days
**Dependencies**: None
