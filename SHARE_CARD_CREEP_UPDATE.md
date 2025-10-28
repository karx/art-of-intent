# Share Card Creep Display - Update Documentation

## Overview

Added creep level visualization to share cards to reflect the new darkness/creep mechanic introduced in The Black Update.

---

## Changes Made

### 1. Data Structure (`game.js`)

**Added to `cardData` object** (3 locations):
- `shareScore()` - Line ~1181
- `previewShareCard()` - Line ~1225  
- `shareWithText()` - Line ~1277

```javascript
const cardData = {
    // ... existing fields
    creepLevel: gameState.creepLevel || 0,
    creepThreshold: gameState.creepThreshold || 100
};
```

### 2. Share Card Generator (`share-card-v3.js`)

**Added parameters**:
```javascript
function generateShareCardV3(data) {
    const {
        // ... existing params
        creepLevel = 0,
        creepThreshold = 100
    } = data;
```

**Added creep visualization logic**:
```javascript
// Calculate creep color based on percentage
const creepPercentage = (creepLevel / creepThreshold) * 100;
let creepColor = colors.green;
if (creepPercentage >= 75) creepColor = colors.red;
else if (creepPercentage >= 50) creepColor = colors.yellow;
else if (creepPercentage >= 25) creepColor = colors.yellow;

// Generate darkness blocks (▓) based on creep level
const maxBlocks = 10;
const filledBlocks = Math.ceil((creepLevel / creepThreshold) * maxBlocks);
const emptyBlocks = maxBlocks - filledBlocks;
const darknessBar = '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
```

**Added visual display**:
- Expanded user info card height: 90px → 110px
- Added creep bar below stats
- Shows: Label + Darkness bar + Numeric value

```svg
<g transform="translate(20, 82)">
    <text>Creep</text>
    <text style="fill: ${creepColor};">${darknessBar}</text>
    <text>${creepLevel}/${creepThreshold}</text>
</g>
```

---

## Visual Design

### Creep Bar Display

```
Creep  ▓▓▓▓░░░░░░  35/100
```

**Components**:
1. **Label**: "Creep" (uppercase, gray, 11px)
2. **Bar**: Darkness blocks (14px, color-coded)
   - ▓ = Filled (creep accumulated)
   - ░ = Empty (remaining capacity)
3. **Value**: "35/100" (11px, color-coded)

### Color Coding

| Creep Level | Percentage | Color | Meaning |
|-------------|------------|-------|---------|
| 0-24 | 0-24% | Green | Safe |
| 25-49 | 25-49% | Yellow | Caution |
| 50-74 | 50-74% | Yellow | Warning |
| 75-100 | 75-100% | Red | Critical |

### Examples

**Low Creep (10/100)**:
```
Creep  ▓░░░░░░░░░  10/100
```
Color: Green

**Medium Creep (50/100)**:
```
Creep  ▓▓▓▓▓░░░░░  50/100
```
Color: Yellow

**High Creep (85/100)**:
```
Creep  ▓▓▓▓▓▓▓▓▓░  85/100
```
Color: Red

**Maxed Creep (100/100)**:
```
Creep  ▓▓▓▓▓▓▓▓▓▓  100/100
```
Color: Red

---

## Layout Changes

### User Info Card

**Before**:
```
┌─────────────────────────────────┐
│ UserName                        │
│ RESULT: WIN                     │
│ 3/3 words · 5 attempts · 250 t │
└─────────────────────────────────┘
Height: 90px
```

**After**:
```
┌─────────────────────────────────┐
│ UserName                        │
│ RESULT: WIN                     │
│ 3/3 words · 5 attempts · 250 t │
│ Creep  ▓▓▓▓░░░░░░  35/100      │
└─────────────────────────────────┘
Height: 110px (+20px)
```

---

## Theme Integration

### Color Variables Used

```javascript
const colors = {
    green: getThemeColor('--success', '#859900'),
    yellow: getThemeColor('--warning', '#b58900'),
    red: getThemeColor('--error', '#dc322f'),
    gray: getThemeColor('--text-secondary', '#586e75')
};
```

Colors automatically adapt to active theme (Solarized, Polarized, Dark, Light, Cartoon).

---

## Testing Checklist

### Visual Testing
- [ ] Creep bar displays correctly at 0%
- [ ] Creep bar displays correctly at 25%
- [ ] Creep bar displays correctly at 50%
- [ ] Creep bar displays correctly at 75%
- [ ] Creep bar displays correctly at 100%
- [ ] Colors match theme (green/yellow/red)
- [ ] Darkness blocks (▓) render properly
- [ ] Empty blocks (░) render properly
- [ ] Numeric value displays correctly

### Functional Testing
- [ ] Share card includes creep data
- [ ] Preview card includes creep data
- [ ] Share with text includes creep data
- [ ] Creep persists across page refresh
- [ ] Creep displays in all themes

### Edge Cases
- [ ] Creep = 0 (no darkness)
- [ ] Creep = 100 (full darkness)
- [ ] Creep = 1 (minimal darkness)
- [ ] Creep = 99 (almost full)
- [ ] Missing creepLevel (defaults to 0)

---

## Future Enhancements

### Potential Improvements
1. **Animated Darkness**: Pulsing effect for high creep levels
2. **Creep History**: Show creep progression over attempts
3. **Creep Breakdown**: Show sources (user input vs Arty violations)
4. **Darkness Gradient**: Smooth gradient instead of blocks
5. **Creep Achievements**: Special badges for low/high creep wins

### Accessibility
- Consider adding ARIA labels for screen readers
- Ensure sufficient color contrast for all themes
- Add text alternative for darkness blocks

---

## Maintenance Notes

### Modifying Creep Display

**Change block count**:
```javascript
const maxBlocks = 10; // Change this (currently 10)
```

**Change color thresholds**:
```javascript
if (creepPercentage >= 75) creepColor = colors.red;      // Critical
else if (creepPercentage >= 50) creepColor = colors.yellow; // Warning
else if (creepPercentage >= 25) creepColor = colors.yellow; // Caution
```

**Change position**:
```javascript
<g transform="translate(20, 82)"> // X=20, Y=82
```

**Change font sizes**:
```javascript
style="font-size: 11px;" // Label
style="font-size: 14px;" // Bar
style="font-size: 11px;" // Value
```

### Adding Creep to Other Card Versions

If adding to `share-card-generator.js` (v1/v2):

1. Add `creepLevel` and `creepThreshold` to function parameters
2. Calculate `creepColor` and `darknessBar` (copy logic from v3)
3. Add visual display to appropriate location
4. Test with all themes

---

## Related Files

- `src/js/game.js` - Card data generation
- `src/js/share-card-v3.js` - Share card rendering
- `src/js/share-card-generator.js` - Legacy card versions
- `CHANGELOG.md` - Version history
- `FEEDBACK_SYSTEM_MAINTAINER_GUIDE.md` - Related mechanics

---

## Version History

- **v1.2.0**: Initial creep system implementation
- **v1.2.1**: Added creep to share cards

---

## Questions?

For issues or questions about the share card system:
1. Check `share-card-v3.js` for rendering logic
2. Check `game.js` for data generation
3. Refer to theme colors in `themes.css`
4. Test with different creep levels (0, 25, 50, 75, 100)
