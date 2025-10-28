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
- **Target Hits**: Green circles (6px radius)
- **Blacklist Detection**: Small red rectangles (8x10px)
- **Security Violations**: Small red triangles
- **Security Warnings**: Small yellow diamonds
- All indicators positioned after hit circles, no emojis

### 5. Creep Visualization (Step-Based Progression)
- **Step-Based**: Shows creep growth per attempt (not full overlay)
- **Theme Colors**: Uses darkness/shadow colors from theme
- **Cumulative Display**: Each step shows creep accumulation
- **Labels**: Shows `+X` for creep increases ≥5
- **Visual Flow**: Creates step progression showing darkness growth

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
│ Response Trail                                               │
├──────────────────────────────────────────────────────────────┤
│ #1      ████████████████████████████████████ 45    ●●●      │
│ #2      ░░░░░░░░░░██████████████████████ 38        ●●       │
│ #3      ████████████████████████████████████ 42    ●●● ▭    │
│ #4      ░░░░░░░░░░██████████████████████ 40        ●● ▲     │
│ #5  ████████████████████████████████████████ 48    ●●●      │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘

Note: Bars end at same position, creating step chart effect
      ░ = Creep steps (darkness progression)
      ● = Target hits (green circles)
      ▭ = Blacklist detected (red rectangle)
      ▲ = Security violation (red triangle)
      ◆ = Security warning (yellow diamond)
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

### 1. Target Word Hits (Green Circles)
**When**: Arty's response contains target words
**Visual**: Green circles (6px radius)
**Position**: Right of token bar
**Logic**:
```javascript
if (hasHits) {
    for (let i = 0; i < Math.min(hitCount, 3); i++) {
        const circleX = hitStartX + (i * 14);
        <circle cx="${circleX}" cy="17" r="6" fill="${colors.green}"/>
    }
}
```

### 2. Blacklist Detection (Red Rectangle)
**When**: Arty's response contains blacklist words
**Visual**: Small red rectangle (8x10px)
**Position**: After hit indicators
**Logic**:
```javascript
if (attempt.blacklistWordsInResponse > 0) {
    <rect x="${eventX}" y="12" width="8" height="10" 
          fill="${colors.red}" opacity="0.8" rx="1"/>
}
```

### 3. Security Violations (Red Triangle)
**When**: Security threat detected
**Visual**: Small red triangle
**Position**: After blacklist indicator
**Logic**:
```javascript
if (attempt.securityViolations > 0) {
    <polygon points="${eventX},22 ${eventX + 4},12 ${eventX + 8},22" 
             fill="${colors.red}" opacity="0.8"/>
}
```

### 4. Security Warnings (Yellow Diamond)
**When**: Security warning detected
**Visual**: Small yellow diamond
**Position**: After security violation indicator
**Logic**:
```javascript
if (attempt.securityWarnings > 0) {
    <polygon points="${eventX + 4},12 ${eventX + 8},17 ${eventX + 4},22 ${eventX},17" 
             fill="${colors.yellow}" opacity="0.8"/>
}
```

### 5. Creep Progression (Step-Based)
**When**: Creep increases during attempt
**Visual**: Darkness-colored steps showing cumulative growth
**Position**: Overlaid on token bars
**Logic**:
```javascript
if (attempt.creepIncrease > 0) {
    const creepHeight = (attempt.creepLevel / 100) * barHeight;
    <rect x="${startX}" y="${y}" width="${stepWidth}" height="${creepHeight}" 
          fill="${colors.dim}" opacity="0.3"/>
    // Show +X label for increases ≥5
    if (attempt.creepIncrease >= 5) {
        <text>+${attempt.creepIncrease}</text>
    }
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

### Example 3: Mixed Events with Creep
```
#1      ████████████████████████████████████ 45    ●●●
#2      ░░░░░░░░░░██████████████████████ 38        ●●
#3      ████████████████████████████████████ 42    ●●● ▭
#4      ░░░░░░░░░░██████████████████████ 40        ●● ▲
#5  ████████████████████████████████████████ 48    ●●●
```
Note: ░ shows creep steps, ▭ = blacklist, ▲ = security threat

### Example 4: Creep Progression
```
#1      ████████████████████████████████████ 45    ●●●
#2      ░░░░░░░░░░██████████████████████ 38  +5    ●●
#3      ░░░░░░░░░░░░░░░░████████████████ 42  +8    ●●●
```
Note: Creep steps show cumulative growth, +X labels for increases

---

## Legend Display

The trail header includes a legend for event indicators:

```
Response Trail              ● = hits  ▭ = blacklist  ▲ = threat  ◆ = warning
```

**Position**: Right side of trail header
**Font**: 10px, gray, 0.7 opacity
**Purpose**: Help viewers understand event symbols
**Note**: No emojis used, only simple geometric shapes

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

2. **Add indicator** (use simple shapes, no emojis):
```javascript
if (hasNewEvent) {
    eventIndicators += `
        <circle cx="${eventX}" cy="17" r="5" 
                fill="${colors.blue}" opacity="0.8"/>
    `;
    eventX += 12;
}
```

3. **Update legend**:
```javascript
<text>● = hits  ▭ = blacklist  ▲ = threat  ◆ = warning  ○ = new</text>
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
- [ ] Green circles show for hits
- [ ] Red rectangles show for blacklist detection
- [ ] Red triangles show for security violations
- [ ] Yellow diamonds show for security warnings
- [ ] Creep steps show progression per attempt
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
2. **Token Efficiency**: Color-code by efficiency
3. **Attempt Grouping**: Collapse similar attempts
4. **Interactive Legend**: Hover to highlight events
5. **Creep Threshold Indicator**: Show when creep reaches critical levels

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
- **v4.1**: Step-based creep progression and shape-based event indicators

---

## Questions?

For issues or questions:
1. Check `share-card-v4.js` for implementation
2. Verify event detection in trail items
3. Test with different game states
4. Compare with V3 for reference
