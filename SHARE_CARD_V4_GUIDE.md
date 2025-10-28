# Share Card V4 - Full-Width Trail with Event Indicators

## Overview

Share Card V4 redesigns the layout to maximize trail visualization space and add comprehensive event indicators for all game events (hits, warnings, darkness, violations).

---

## Key Improvements Over V3

### 1. Space Utilization
- **V3**: Trail used ~800px width (67% of card)
- **V4**: Trail uses ~1080px width (90% of card)
- **Improvement**: 35% more space for trail visualization

### 2. Layout Redesign
- **Compact Header**: Single-line horizontal layout (140px height vs 195px)
- **Full-Width Trail**: Spans nearly entire card width
- **Event Indicators**: Dedicated space for all event types

### 3. Event Visualization
- **Hits**: Green dots (●) for target word matches
- **Warnings**: Yellow warning symbol (⚠) for direct word usage
- **Darkness**: Red darkness block (▓) for blacklist in Arty response
- **Violations**: Red X (✗) for severe violations

---

## Layout Specifications

### Card Dimensions
```
Width: 1200px
Height: 630px
Margins: 60px left/right, 20px top/bottom
```

### Header Layout (140px height)
```
┌─────────────────────────────────────────────────────────────┐
│ ART OF INTENT                                               │
│ HAIKU CHALLENGE                                             │
│ UserName                    RESULT: WIN                     │
│ 3/3 words · 5 attempts · 250 tokens    CREEP: ▓▓▓░░░░░░░  │
└─────────────────────────────────────────────────────────────┘
```

### Trail Layout (430px height)
```
┌─────────────────────────────────────────────────────────────┐
│ Response Trail              ● = hits  ⚠ = warning  ▓ = dark│
├─────────────────────────────────────────────────────────────┤
│ #1  ████████████████████████████████████ 45    ●●●         │
│ #2  ██████████████████████████████ 38          ●●          │
│ #3  ████████████████████████████████████ 42    ●●● ⚠       │
│ #4  ██████████████████████████████████ 40      ●●          │
│ #5  ████████████████████████████████████ 48    ●●● ▓       │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Trail Item Structure

### Components (left to right)

1. **Attempt Number** (40px)
   - Format: `#1`, `#2`, etc.
   - Font: 13px, bold, gray
   - Position: Left-aligned

2. **Token Bars** (variable width, ~900px)
   - **Prompt tokens**: Cyan bar
   - **Output tokens**: Yellow bar
   - **Token count**: White text on bar (right-aligned)
   - Opacity: 0.7 for subtle appearance

3. **Event Indicators** (80px)
   - **Hits**: Green dots (5px radius)
   - **Warning**: Yellow ⚠ symbol
   - **Darkness**: Red ▓ symbol
   - **Violation**: Red circle with ✗

### Event Indicator Positions
```
Token Bar End → [Hits: 0-36px] [Warning: 40px] [Darkness: 55px] [Violation: 70px]
```

---

## Event Types

### 1. Target Word Hits (Green Dots)
**When**: Arty's response contains target words
**Visual**: Green circles (●)
**Position**: Right of token bar
**Logic**:
```javascript
if (hasHits) {
    // Show up to 3 dots
    for (let i = 0; i < Math.min(hitCount, 3); i++) {
        // Green circle at eventX + (i * 12)
    }
    // Show "+N" if more than 3
    if (hitCount > 3) {
        // "+2" text
    }
}
```

### 2. Direct Word Usage Warning (Yellow ⚠)
**When**: User types target/blacklist words directly
**Visual**: Yellow warning symbol
**Position**: eventX + 40px
**Logic**:
```javascript
if (isDirectWordUsage) {
    // Yellow ⚠ symbol
}
```

### 3. Darkness Creep (Red ▓)
**When**: Arty's response contains blacklist words
**Visual**: Red darkness block
**Position**: eventX + 55px
**Logic**:
```javascript
if (hasBlacklistInResponse) {
    // Red ▓ symbol
}
```

### 4. Severe Violation (Red ✗)
**When**: Legacy blacklist violation (game-ending)
**Visual**: Red circle with X
**Position**: eventX + 70px
**Logic**:
```javascript
if (isViolation) {
    // Red circle + white ✗
}
```

---

## Implementation Details

### File: `src/js/share-card-v4.js`

#### Key Variables
```javascript
const headerHeight = 140;           // Compact header
const trailStartY = headerHeight + 20;
const trailMargin = 60;             // Left/right margins
const trailWidth = width - (trailMargin * 2); // ~1080px
const attemptHeight = 40;           // Height per attempt
```

#### Token Bar Calculation
```javascript
const labelWidth = 40;              // "#1" label
const eventWidth = 80;              // Event indicators
const tokenWidth = trailWidth - labelWidth - eventWidth - 40;

const promptWidth = Math.min((attempt.promptTokens / 200) * tokenWidth, tokenWidth * 0.6);
const outputWidth = Math.min((attempt.outputTokens / 200) * tokenWidth, tokenWidth * 0.4);
```

#### Event Detection
```javascript
const isViolation = attempt.violation || false;
const isDirectWordUsage = attempt.directWordUsage || false;
const hasCreepIncrease = (attempt.creepIncrease || 0) > 0;
const hasBlacklistInResponse = (attempt.blacklistWordsInResponse || []).length > 0;
const hitCount = attempt.foundWords ? attempt.foundWords.length : 0;
```

---

## Usage

### Default Version
V4 is now the default share card version:

```javascript
// game.js
const svg = shareCardGenerator.generateSVG(cardData, 'v4');
```

### Switching Versions
To use a different version:

```javascript
// V3 (compact with creep)
const svg = shareCardGenerator.generateSVG(cardData, 'v3');

// V2 (minimalist)
const svg = shareCardGenerator.generateSVG(cardData, 'v2');

// V1 (original)
const svg = shareCardGenerator.generateSVG(cardData, 'v1');
```

---

## Visual Examples

### Example 1: Clean Run (No Events)
```
#1  ████████████████████████████████████ 45
#2  ██████████████████████████████ 38
#3  ████████████████████████████████████ 42
```

### Example 2: Successful Hits
```
#1  ████████████████████████████████████ 45    ●●●
#2  ██████████████████████████████ 38          ●●
#3  ████████████████████████████████████ 42    ●●●
```

### Example 3: Mixed Events
```
#1  ████████████████████████████████████ 45    ●●●
#2  ██████████████████████████████ 38          ●●
#3  ████████████████████████████████████ 42    ●●● ⚠
#4  ██████████████████████████████████ 40      ●●
#5  ████████████████████████████████████ 48    ●●● ▓
```

### Example 4: Violation
```
#1  ████████████████████████████████████ 45    ●●●
#2  ██████████████████████████████ 38          ●●
#3  ████████████████████████████████████ 42    ●●● ✗
```

---

## Legend Display

The trail header includes a legend for event indicators:

```
Response Trail              ● = hits  ⚠ = warning  ▓ = darkness  ✗ = violation
```

**Position**: Right side of trail header
**Font**: 10px, gray, 0.7 opacity
**Purpose**: Help viewers understand event symbols

---

## Theme Integration

### Colors
All colors use theme variables:
```javascript
const colors = {
    background: getThemeColor('--bg-primary', '#002b36'),
    cyan: getThemeColor('--accent-secondary', '#2aa198'),
    green: getThemeColor('--success', '#859900'),
    red: getThemeColor('--error', '#dc322f'),
    yellow: getThemeColor('--warning', '#b58900'),
    // ...
};
```

### Automatic Adaptation
Colors automatically adapt to active theme (Solarized, Polarized, Dark, Light, Cartoon).

---

## Performance Considerations

### SVG Optimization
- Minimal use of filters/effects
- Simple shapes (rectangles, circles, text)
- No gradients or complex paths
- Efficient rendering for PNG conversion

### Token Bar Scaling
- Max width prevents overflow
- Proportional scaling maintains readability
- Token count always visible

---

## Maintenance

### Adding New Event Types

1. **Detect event** in trail item:
```javascript
const hasNewEvent = attempt.newEventFlag || false;
```

2. **Add indicator**:
```javascript
if (hasNewEvent) {
    eventIndicators += `
        <text x="${eventX + 85}" y="18" 
              style="font-size: 10px; fill: ${colors.blue};">
            ★
        </text>
    `;
}
```

3. **Update legend**:
```javascript
<text>● = hits  ⚠ = warning  ▓ = darkness  ✗ = violation  ★ = new</text>
```

### Adjusting Layout

**Change header height**:
```javascript
const headerHeight = 140; // Increase/decrease
```

**Change trail width**:
```javascript
const trailMargin = 60; // Adjust margins
```

**Change attempt height**:
```javascript
const attemptHeight = 40; // Increase/decrease spacing
```

---

## Testing Checklist

### Visual Testing
- [ ] Header displays correctly (compact, horizontal)
- [ ] Trail spans full width
- [ ] Token bars scale properly
- [ ] Event indicators positioned correctly
- [ ] Legend displays on right side
- [ ] All themes render correctly

### Event Testing
- [ ] Green dots show for hits
- [ ] Yellow ⚠ shows for direct word usage
- [ ] Red ▓ shows for blacklist in response
- [ ] Red ✗ shows for violations
- [ ] Multiple events display together
- [ ] No events = clean trail

### Edge Cases
- [ ] 0 attempts (empty trail)
- [ ] 10 attempts (full trail)
- [ ] Very long token counts
- [ ] All event types in one attempt
- [ ] No events in any attempt

---

## Migration from V3

### Differences
1. **Layout**: Horizontal header vs vertical card
2. **Trail Width**: 1080px vs 800px
3. **Event Indicators**: Comprehensive vs basic
4. **Legend**: Included vs not included

### Backward Compatibility
V3 is still available and functional. To revert:

```javascript
// In game.js, change:
const svg = shareCardGenerator.generateSVG(cardData, 'v3');
```

---

## Future Enhancements

### Potential Improvements
1. **Animated Events**: Pulsing indicators for critical events
2. **Creep Progression**: Visual creep increase per attempt
3. **Token Efficiency**: Color-code by efficiency
4. **Attempt Grouping**: Collapse similar attempts
5. **Interactive Legend**: Hover to highlight events

---

## Related Files

- `src/js/share-card-v4.js` - V4 implementation
- `src/js/share-card-v3.js` - V3 implementation (legacy)
- `src/js/share-card-generator.js` - Version router
- `src/js/game.js` - Card data generation
- `index.html` - Script includes

---

## Version History

- **v1.0**: Original share card
- **v2.0**: Minimalist redesign
- **v3.0**: Added creep display
- **v4.0**: Full-width trail with event indicators

---

## Questions?

For issues or questions:
1. Check `share-card-v4.js` for implementation
2. Verify event detection in trail items
3. Test with different game states
4. Compare with V3 for reference
