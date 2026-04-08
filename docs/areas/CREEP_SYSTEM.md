# Creep/Darkness System

## Overview

The **Creep System** (also called "The Black Update") introduces a progressive penalty for using blacklisted words. Instead of immediately ending the game on first violation, darkness gradually accumulates until it consumes everything.

## Mechanics

### Core Concept
- **Creep Level**: 0-100 scale representing darkness/corruption
- **Threshold**: Game ends when creep reaches 100
- **Accumulation**: Each blacklist word adds +25 creep
- **Maximum Violations**: 4 blacklist words = game over (4 × 25 = 100)

### Game Flow

```
Violation 1: Creep 0 → 25   (Warning: Shadows appear)
Violation 2: Creep 25 → 50  (Warning: Darkness growing)
Violation 3: Creep 50 → 75  (Critical: Creep closing in)
Violation 4: Creep 75 → 100 (Game Over: Consumed by darkness)
```

### Creep Levels

| Level | Range | Status | Color | Message |
|-------|-------|--------|-------|---------|
| **Low** | 0-24 | Safe | Green | Normal gameplay |
| **Medium** | 25-49 | Caution | Amber | "CAUTION: Creep increasing" |
| **High** | 50-74 | Warning | Red | "WARNING: Shadows growing" |
| **Critical** | 75-99 | Danger | Red (pulsing) | "CRITICAL: Darkness closing in" |
| **Maxed** | 100 | Game Over | Red (pulsing) | "Darkness has consumed all" |

## Visual Feedback

### UI Indicator
Located in score bar:
```
ATT: 3/10 │ TOK: 450 │ MAT: 2/3 │ CREEP: 50/100
```

Color-coded based on danger level:
- **0-24**: Green (safe)
- **25-49**: Amber (caution)
- **50-74**: Red (warning)
- **75-99**: Red pulsing (critical)
- **100**: Red pulsing (game over)

### Trail Item Display

When blacklist word used:
```
┌─────────────────────────────────────────┐
│ #4 • 2:47:30 PM                         │
│                                         │
│ > USER: Write about sunset              │
│                                         │
│ ⚠️ BLACKLIST VIOLATION                  │
│ Forbidden: sunset                       │
│ Creep: 25 → 50 (+25)                    │
│ WARNING: Shadows growing                │
│                                         │
│ < ARTY: Shadows grow deeper now,       │
│         Darkness creeps (25 → 50),      │
│         Tread carefully forth.          │
└─────────────────────────────────────────┘
```

When creep maxed (game over):
```
┌─────────────────────────────────────────┐
│ #7 • 2:50:15 PM                         │
│                                         │
│ > USER: Write about night               │
│                                         │
│ ☠️ CREEP THRESHOLD REACHED              │
│ Forbidden: night                        │
│ Creep: 75 → 100 (+25)                   │
│ Darkness has consumed all               │
│                                         │
│ < ARTY: Darkness now consumes all,     │
│         The creep has claimed victory,  │
│         Silence falls complete.         │
└─────────────────────────────────────────┘
```

## Implementation

### Game State
```javascript
const gameState = {
    // ... existing fields
    creepLevel: 0,              // Current darkness level (0-100)
    creepThreshold: 100,        // Game ends at this level
    creepPerViolation: 25       // Creep added per blacklist word
};
```

### Violation Handler
```javascript
function handleBlacklistViolation(prompt, violatedWords) {
    // Calculate creep increase
    const creepIncrease = violatedWords.length * gameState.creepPerViolation;
    gameState.creepLevel = Math.min(
        gameState.creepLevel + creepIncrease, 
        gameState.creepThreshold
    );
    
    // Check if threshold reached
    const creepMaxed = gameState.creepLevel >= gameState.creepThreshold;
    
    if (creepMaxed) {
        // Game over
        gameState.gameOver = true;
        // ... end game logic
    } else {
        // Continue playing with warning
        // ... warning logic
    }
}
```

### Trail Item Data
```javascript
const trailItem = {
    // ... existing fields
    violation: true,
    violatedWords: ['sunset'],
    creepIncrease: 25,
    creepLevel: 50,
    creepMaxed: false
};
```

## Design Rationale

### Why Progressive Penalty?

1. **Forgiveness**: Players can make mistakes without instant failure
2. **Tension**: Mounting pressure as creep increases
3. **Strategy**: Players must decide if risk is worth reward
4. **Learning**: New players have room to understand mechanics
5. **Drama**: Progressive darkening creates narrative arc

### Why 4 Violations?

- **Balance**: Enough to be forgiving, not too lenient
- **Clear Math**: 25 × 4 = 100 (easy to understand)
- **Tension Curve**: Each violation feels increasingly dangerous
- **Strategic Depth**: Players must carefully manage remaining "lives"

### Why "Creep" Terminology?

- **Gaming Heritage**: Common in strategy games (tower defense, RTS)
- **Thematic Fit**: Darkness "creeping" in fits haiku's contemplative mood
- **Visual Metaphor**: Easy to visualize spreading darkness
- **Memorable**: Distinct from generic "penalty" or "damage"

## User Experience

### First Violation
```
Player: "Write about sunset"
System: ⚠️ Warning! Creep increased to 25
Player: "Oh no, but I can continue!"
```

### Second Violation
```
Player: "Write about night"
System: ⚠️ Warning! Creep increased to 50
Player: "Getting dangerous, need to be careful"
```

### Third Violation
```
Player: "Write about moon"
System: 🔴 CRITICAL! Creep at 75
Player: "One more mistake and I'm done!"
```

### Fourth Violation
```
Player: "Write about stars"
System: ☠️ GAME OVER - Darkness consumed all
Player: "I pushed my luck too far..."
```

## Analytics

### Tracked Events

**Violation (Not Game Over):**
```javascript
trackEvent('blacklist_violation_creep', {
    violatedWords: ['sunset'],
    creepIncrease: 25,
    previousCreep: 25,
    newCreep: 50,
    attemptsRemaining: 2
});
```

**Game Over (Creep Maxed):**
```javascript
trackEvent('game_over', {
    reason: 'creep_threshold_reached',
    violatedWords: ['night'],
    finalCreepLevel: 100,
    finalAttempts: 7,
    wordsMatched: 2
});
```

## CSS Classes

### Creep Indicator
```css
.creep-indicator              /* Base style */
.creep-indicator.creep-low    /* 0-24: Green */
.creep-indicator.creep-medium /* 25-49: Amber */
.creep-indicator.creep-high   /* 50-74: Red */
.creep-indicator.creep-critical /* 75-99: Red pulsing */
```

### Violation Warning
```css
.violation-warning    /* Container */
.violation-header     /* Title */
.violation-words      /* Forbidden words */
.creep-change         /* Level change display */
.creep-warning        /* Warning message */
.creep-maxed          /* Game over message */
```

## Haiku Responses

### Creep Increasing (Not Maxed)
```
Shadows grow deeper now,
Darkness creeps (X → Y),
Tread carefully forth.
```

### Creep Maxed (Game Over)
```
Darkness now consumes all,
The creep has claimed its victory,
Silence falls complete.
```

## Future Enhancements

### Potential Features

1. **Creep Decay**
   - Successful attempts reduce creep by 5
   - Rewards good play, extends gameplay

2. **Creep Multipliers**
   - Multiple blacklist words in one prompt = higher penalty
   - Currently: 2 words = 50 creep
   - Could be: 2 words = 60 creep (multiplier effect)

3. **Visual Darkening**
   - Screen gradually darkens as creep increases
   - CSS filter: `brightness(1 - creepLevel/100)`

4. **Creep Milestones**
   - Special messages at 25, 50, 75
   - Achievement: "Survived 75 creep"

5. **Difficulty Modes**
   - Easy: 20 creep per violation (5 violations)
   - Normal: 25 creep per violation (4 violations)
   - Hard: 33 creep per violation (3 violations)

## Testing

### Test Scenarios

1. **Single Violation**
   - Use 1 blacklist word
   - Verify creep = 25
   - Verify game continues

2. **Multiple Violations**
   - Use 3 blacklist words across attempts
   - Verify creep = 75
   - Verify critical warning

3. **Game Over**
   - Use 4 blacklist words
   - Verify creep = 100
   - Verify game ends

4. **Multiple Words in One Prompt**
   - Use 2 blacklist words in single prompt
   - Verify creep = 50 (2 × 25)

5. **UI Updates**
   - Verify creep indicator updates
   - Verify color changes
   - Verify pulsing animation at critical

## Accessibility

### Screen Readers
```html
<span id="creepLevel" 
      class="creep-indicator creep-high"
      aria-label="Creep level: 50 out of 100. Warning: Shadows growing">
    50
</span>
```

### Color Independence
- Not relying solely on color
- Text warnings accompany color changes
- Pulsing animation for critical state

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    .creep-indicator.creep-critical,
    .creep-maxed {
        animation: none;
    }
}
```

## Summary

The Creep System transforms blacklist violations from instant failure to progressive tension:

- ✅ **Forgiving**: 4 chances instead of 1
- ✅ **Tense**: Mounting pressure with each violation
- ✅ **Strategic**: Players must manage risk
- ✅ **Visual**: Clear feedback through color and animation
- ✅ **Thematic**: "Darkness creeping in" fits haiku mood
- ✅ **Balanced**: 4 violations feels fair yet challenging

**The Black Update** adds depth to gameplay while maintaining the contemplative, strategic nature of Art of Intent.
