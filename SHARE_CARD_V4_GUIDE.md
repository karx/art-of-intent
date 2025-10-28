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

### 3. Smart Token Scaling
- **Session-Based Max**: Bars scale to session's max tokens (not arbitrary 1000)
- **End-Aligned Bars**: Creates step chart showing token progression
- **Visual Comparison**: Easy to see which attempts used more tokens

### 4. Event Visualization (Separated & Prominent)
- **Prominent Events** (large badges):
  - ●N = Target hits (green badge with count)
  - ▓N = Blacklist detected (red badge with count)
  - ✗ = Severe violation (red circle)
- **Secondary Events** (subtle, below):
  - ⚠ input = Direct word usage warning (yellow, small)

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

### Trail Layout (430px height) - End-Aligned Step Chart
```
┌──────────────────────────────────────────────────────────────┐
│ Response Trail    Bars end-aligned · ●N = hits · ▓N = black│
├──────────────────────────────────────────────────────────────┤
│ #1      ████████████████████████████████████ 45    [●3]    │
│ #2            ██████████████████████████ 38        [●2]    │
│ #3      ████████████████████████████████████ 42    [●3]    │
│         ⚠ input                                              │
│ #4            ██████████████████████████ 40        [●2]    │
│ #5  ████████████████████████████████████████ 48    [●3][▓1]│
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘

Note: Bars end at same position, creating step chart effect
      Prominent events shown as badges: [●3] [▓1]
      Secondary events shown below: ⚠ input
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

### 1. Target Word Hits (Green Badge) - PROMINENT
**When**: Arty's response contains target words
**Visual**: Green badge with count (●3)
**Position**: Right of token bar
**Size**: 35x16px badge
**Logic**:
```javascript
if (hasHits) {
    // Green badge with count
    <rect fill="${colors.green}" width="35" height="16"/>
    <text>●${hitCount}</text>
}
```

### 2. Blacklist Detection (Red Badge) - PROMINENT
**When**: Arty's response contains blacklist words
**Visual**: Red badge with count (▓2)
**Position**: Right of hits badge
**Size**: 35x16px badge
**Logic**:
```javascript
if (hasBlacklistInResponse) {
    const blacklistCount = attempt.blacklistWordsInResponse.length;
    // Red badge with count
    <rect fill="${colors.red}" width="35" height="16"/>
    <text>▓${blacklistCount}</text>
}
```

### 3. Direct Word Usage Warning (Yellow ⚠) - SECONDARY
**When**: User types target/blacklist words directly
**Visual**: Small yellow text below bar
**Position**: Below token bar (y=30)
**Size**: 8px text, 0.8 opacity
**Logic**:
```javascript
if (isDirectWordUsage) {
    // Small yellow warning below
    <text y="30" opacity="0.8">⚠ input</text>
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

#### Token Bar Calculation (Session-Based Scaling)
```javascript
const labelWidth = 40;              // "#1" label
const eventWidth = 100;             // Event indicators (increased)
const tokenBarMaxWidth = trailWidth - labelWidth - eventWidth - 40;

// Scale based on session max (not arbitrary 1000)
const maxTokensInSession = Math.max(...recentAttempts.map(a => a.totalTokens || 0), 1);
const totalTokenRatio = (attempt.totalTokens || 0) / maxTokensInSession;
const tokenBarWidth = tokenBarMaxWidth * totalTokenRatio;

// Split into prompt/output proportionally
const promptRatio = (attempt.promptTokens || 0) / (attempt.totalTokens || 1);
const promptWidth = tokenBarWidth * promptRatio;
const outputWidth = tokenBarWidth * (1 - promptRatio);

// End-align for step chart effect
const barEndX = labelWidth + tokenBarMaxWidth;
const barStartX = barEndX - tokenBarWidth;
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

### Example 1: Clean Run (No Events) - End-Aligned
```
#1      ████████████████████████████████████ 45
#2            ██████████████████████████ 38
#3      ████████████████████████████████████ 42
```
Note: Bars end at same position, shorter bars start later

### Example 2: Successful Hits (Prominent Badges)
```
#1      ████████████████████████████████████ 45    [●3]
#2            ██████████████████████████ 38        [●2]
#3      ████████████████████████████████████ 42    [●3]
```
Note: Green badges show hit count prominently

### Example 3: Mixed Events (Separated)
```
#1      ████████████████████████████████████ 45    [●3]
#2            ██████████████████████████ 38        [●2]
#3      ████████████████████████████████████ 42    [●3]
        ⚠ input
#4            ██████████████████████████ 40        [●2]
#5  ████████████████████████████████████████ 48    [●3][▓1]
```
Note: Prominent events (badges) vs secondary events (below)

### Example 4: Blacklist Detection (Red Badge)
```
#1      ████████████████████████████████████ 45    [●3]
#2            ██████████████████████████ 38        [●2]
#3  ████████████████████████████████████████ 48    [●3][▓2]
```
Note: Red badge shows blacklist count, very prominent

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
