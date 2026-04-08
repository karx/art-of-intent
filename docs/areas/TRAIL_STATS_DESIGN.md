# Trail Stats Design Specification

## Overview

Trail stats display token consumption and game progress for each attempt. Design follows cognitive principles for clarity, scannability, and meaningful feedback.

## Cognitive Design Principles

### 1. Progressive Disclosure
- **Primary Info**: Always visible (tokens, matches)
- **Secondary Info**: Revealed on interaction (efficiency metrics, timestamps)
- **Tertiary Info**: Available in modals (detailed breakdown)

### 2. Visual Hierarchy
- **Most Important**: Match indicators (success/failure)
- **Important**: Token consumption (cost of attempt)
- **Supporting**: Metadata (timestamp, attempt number)

### 3. Gestalt Principles
- **Proximity**: Related info grouped together
- **Similarity**: Consistent styling for similar elements
- **Continuity**: Visual flow from top to bottom
- **Closure**: Complete visual units for each trail item

### 4. Feedback & Affordance
- **Immediate**: Visual indication of success/failure
- **Clear**: Color coding matches game semantics
- **Actionable**: Game-ending items clearly distinguished

## Trail Item Types

### Type 1: Standard Attempt (In Progress)
**State**: Game continues, no matches or partial matches

**Information Displayed:**
1. **Attempt Number** - Sequential identifier
2. **Timestamp** - When attempt was made
3. **User Prompt** - What user asked
4. **Arty Response** - Haiku generated
5. **Token Consumption** - Compact bar visualization:
   - Two-segment bar (prompt + output)
   - Total tokens displayed as "X tok"
   - Gradient colors: cyan→amber (prompt), amber→green (output)
6. **Match Indicator** - Green dots (●) for each hit

**Visual Treatment:**
- Border: Neutral (base color)
- Background: Standard
- Compact, scannable layout

```
┌─────────────────────────────────────────┐
│ #3 • 2:45:12 PM                         │
│                                         │
│ > USER: Write about cherry blossoms    │
│ < ARTY: Pink petals dance...           │
│                                         │
│ ✓ Found: cherry                         │
│                                         │
│ [████████░░░░░░░░] 137 tok ●           │
│  prompt  output                         │
└─────────────────────────────────────────┘
```

**Compact Stats Design:**
- Inspired by share-card SVG aesthetic
- Single-line horizontal bar
- Hover tooltips show exact token counts
- Green dots (●) indicate matched words
- Minimal visual clutter

### Type 2: Victory Attempt (Game Win)
**State**: All target words matched, game won

**Information Displayed:**
1. All standard info (above)
2. **Victory Badge** - 🏆 VICTORY header
3. **Efficiency Score** - Performance metric
4. **Final Stats Summary**:
   - Total attempts
   - Total tokens consumed
   - Average tokens per attempt

**Visual Treatment:**
- Border: Success color (green/cyan, 3px)
- Background: Subtle success tint (rgba green 0.05)
- Victory icon/badge prominent
- Pulse animation (respects reduced-motion)

```
┌═════════════════════════════════════════┐
║ 🏆 VICTORY • 2:47:30 PM                ║
║                                         ║
║ > USER: Speak of spring's arrival      ║
║ < ARTY: Cherry blossoms fall...        ║
║                                         ║
║ ✓ Found: cherry, spring, blossom       ║
║ ✓ ALL TARGETS MATCHED!                 ║
║                                         ║
║ [████████░░░░░░░░] 127 tok ●●●         ║
║                                         ║
║ ┌─────────────────────────────────┐   ║
║ │ GAME COMPLETE                   │   ║
║ │ Efficiency Score: 87            │   ║
║ │ Total Attempts: 5               │   ║
║ │ Total Tokens: 623               │   ║
║ │ Avg per Attempt: 124.6          │   ║
║ └─────────────────────────────────┘   ║
╚═════════════════════════════════════════╝
```

### Type 3: Blacklist Violation (Game Loss)
**State**: User used forbidden word, game lost

**Information Displayed:**
1. Attempt number and timestamp
2. **User Prompt** - Shows the violation
3. **Violation Warning** - Clear error message
4. **Violated Words** - Which blacklist words were used
5. **Arty's Farewell** - Poetic game-over message
6. **Final Stats Summary**:
   - Attempts made
   - Words matched before violation
   - Total tokens consumed

**Visual Treatment:**
- Border: Error color (red)
- Background: Subtle error tint
- Warning icon prominent
- Violated words highlighted in red
- No token bars (violation has no API call)

```
┌═════════════════════════════════════════┐
║ ⚠️ VIOLATION • #4 • 2:46:15 PM         ║
║                                         ║
║ > USER: Write a haiku about sunset     ║
║                                         ║
║ ❌ BLACKLIST VIOLATION                  ║
║ Forbidden words used: sunset            ║
║                                         ║
║ < ARTY: Words are now proscribed,      ║
║         A silent path must be found,   ║
║         Speak in a new way.            ║
║                                         ║
║ ┌─────────────────────────────────┐   ║
║ │ GAME OVER                       │   ║
║ │ Attempts: 4                     │   ║
║ │ Words Matched: 2/3              │   ║
║ │ Total Tokens: 496               │   ║
║ └─────────────────────────────────┘   ║
╚═════════════════════════════════════════╝
```

## Token Calculation Rules

### System Prompt Exclusion
**Problem**: API returns total prompt tokens including system instruction (~920 tokens)
**Solution**: Subtract system prompt contribution from displayed user prompt tokens

**Calculation**:
```javascript
const systemPromptTokens = 920; // Approximate, measured from API
const userPromptTokens = apiResponse.promptTokenCount - systemPromptTokens;
const displayPromptTokens = Math.max(0, userPromptTokens); // Never negative
```

**Rationale**:
- Users should only see tokens they "spent" with their input
- System prompt is game infrastructure, not user cost
- Makes token optimization more meaningful
- Aligns with user mental model of "my prompt = my tokens"

### Token Display
- **Prompt Tokens**: User input only (system excluded)
- **Output Tokens**: Arty's response (unchanged)
- **Total Tokens**: Sum of adjusted prompt + output

## View States & Interactions

### Collapsed View (Default)
- Shows: Attempt #, timestamp, prompt, response, matches, token bars
- Height: Auto (content-based)
- Scrollable: Yes (in trail container)

### Expanded View (Future)
- Shows: All collapsed info + detailed metrics
- Additional Info:
  - Token efficiency vs. average
  - Cumulative token graph
  - Match progress timeline
  - Confidence scores (if available)
- Trigger: Click/tap on trail item
- Animation: Smooth expand/collapse

### Hover State (Desktop)
- Subtle highlight
- Cursor: pointer (if expandable)
- Border color intensifies

## Responsive Behavior

### Desktop (>768px)
- Full layout with all information
- Token bars: 8px height
- Grid: 50px | 1fr | 45px

### Tablet (768px - 480px)
- Slightly condensed
- Token bars: 7px height
- Grid: 48px | 1fr | 42px

### Mobile (<480px)
- Compact layout
- Token bars: 6px height
- Grid: 45px | 1fr | 40px
- Smaller fonts
- Reduced padding

## Color Semantics

### Token Bars
- **Prompt**: Cyan → Amber gradient (input energy)
- **Output**: Amber → Green gradient (output value)

### Border Colors
- **Standard**: `--border-color` (neutral)
- **Victory**: `--success` (green/cyan)
- **Violation**: `--error` (red)
- **Active/Hover**: `--border-active` (bright cyan)

### Background Tints
- **Standard**: `--bg-primary`
- **Victory**: `rgba(success, 0.05)` (subtle green tint)
- **Violation**: `rgba(error, 0.05)` (subtle red tint)

## Accessibility

### Screen Readers
- Semantic HTML structure
- ARIA labels for token bars
- Clear text alternatives for icons
- Announced state changes

### Keyboard Navigation
- Tab through trail items
- Enter to expand (future)
- Arrow keys to navigate between items

### Color Contrast
- All text meets WCAG AA standards
- Icons supplemented with text
- Color not sole indicator of state

## Animation & Transitions

### New Trail Item
- Fade in from top
- Duration: 300ms
- Easing: ease-out
- Auto-scroll to new item

### Game End
- Pulse animation on final item
- Border glow effect
- Duration: 500ms
- Easing: ease-in-out

### Token Bars
- Width transition: 300ms ease
- Smooth fill animation
- Respects prefers-reduced-motion

## Implementation Notes

### Data Structure
```javascript
const trailItem = {
  number: 1,                    // Attempt number
  timestamp: '2:45:12 PM',      // Display time
  isoTimestamp: '2025-10-25...', // ISO format
  prompt: 'User input',         // User's prompt
  response: 'Arty output',      // Haiku response
  promptTokens: 42,             // User tokens (system excluded)
  outputTokens: 95,             // Response tokens
  totalTokens: 137,             // Sum
  foundWords: ['cherry'],       // Matched targets
  matchedSoFar: ['cherry', 'spring'], // Cumulative
  violation: false,             // Blacklist flag
  violatedWords: [],            // If violation
  gameEnding: false,            // Win or loss
  gameResult: null              // 'victory' | 'defeat'
};
```

### CSS Classes
- `.trail-item` - Base container
- `.trail-item--victory` - Win state
- `.trail-item--violation` - Loss state
- `.trail-item--standard` - Normal state
- `.token-consumption` - Token display
- `.game-summary` - Final stats box

## Future Enhancements

1. **Expandable Details**
   - Click to see full metrics
   - Token efficiency graph
   - Historical comparison

2. **Filtering & Search**
   - Filter by matches
   - Search prompts
   - Sort by tokens

3. **Export & Share**
   - Export trail as JSON
   - Share specific attempts
   - Copy formatted text

4. **Analytics Overlay**
   - Token trend line
   - Efficiency heatmap
   - Match probability

5. **Undo/Replay**
   - Replay attempt
   - Fork from checkpoint
   - Compare strategies
