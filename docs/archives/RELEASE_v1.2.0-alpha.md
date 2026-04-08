# Release Notes: v1.2.0-alpha - The Black Update

**Release Date:** October 28, 2025  
**Commit:** `51865c8`  
**Branch:** `main`

## 🌑 The Black Update

This release introduces the **Creep/Darkness System** - a progressive penalty mechanic that transforms blacklist violations from instant failure to mounting tension.

---

## 🎯 Key Feature: Creep System

### Before (v1.1.0)
```
User uses blacklist word → Instant game over ❌
```

### After (v1.2.0)
```
Violation 1: Creep 0 → 25   ⚠️  (Continue playing)
Violation 2: Creep 25 → 50  ⚠️  (Continue playing)
Violation 3: Creep 50 → 75  🔴 (Continue playing)
Violation 4: Creep 75 → 100 ☠️  (Game over)
```

### Mechanics

- **Creep Level**: 0-100 scale
- **Threshold**: Game ends at 100
- **Per Violation**: +25 creep
- **Max Violations**: 4 before game over
- **Visual Feedback**: Color-coded indicator with pulsing animation

---

## 🎮 Gameplay Changes

### Progressive Penalty
- **Forgiving**: Players get 4 chances instead of instant failure
- **Tense**: Mounting pressure as creep increases
- **Strategic**: Must manage risk vs reward
- **Learning**: Room for mistakes while understanding mechanics

### Creep Levels

| Level | Range | Color | Status | Message |
|-------|-------|-------|--------|---------|
| Low | 0-24 | 🟢 Green | Safe | Normal gameplay |
| Medium | 25-49 | 🟡 Amber | Caution | "CAUTION: Creep increasing" |
| High | 50-74 | 🔴 Red | Warning | "WARNING: Shadows growing" |
| Critical | 75-99 | 🔴 Pulsing | Danger | "CRITICAL: Darkness closing in" |
| Maxed | 100 | 🔴 Pulsing | Game Over | "Darkness has consumed all" |

---

## 🎨 Visual Changes

### Score Bar
```
Before: ATT: 3/10 │ TOK: 450 │ MAT: 2/3
After:  ATT: 3/10 │ TOK: 450 │ MAT: 2/3 │ CREEP: 50/100
```

### Trail Item (Violation)
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

### Trail Item (Game Over)
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

---

## 📊 Statistics

### Code Changes
- **8 files changed**
- **954 insertions**
- **27 deletions**
- **2 new files created**
- **6 files modified**

### New Files
1. `docs/CREEP_SYSTEM.md` (11KB) - Complete system documentation
2. `RELEASE_v1.1.0-alpha.md` - Previous release notes

### Modified Files
1. `src/js/game.js` - Creep system implementation
2. `src/js/version.js` - Version bump to 1.2.0
3. `index.html` - Added creep indicator
4. `src/css/dos-theme.css` - Creep visual effects
5. `CHANGELOG.md` - Release notes
6. `about.html` - Version history

---

## 🔧 Technical Implementation

### Game State Changes
```javascript
const gameState = {
    // ... existing fields
    creepLevel: 0,              // NEW: 0-100 scale
    creepThreshold: 100,        // NEW: Game over threshold
    creepPerViolation: 25       // NEW: Creep per blacklist word
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
        showGameOverModal(false, violatedWords);
    } else {
        // Continue with warning
        // Play warning sound
        // Update UI
    }
}
```

### Trail Item Data
```javascript
const trailItem = {
    // ... existing fields
    violation: true,
    violatedWords: ['sunset'],
    creepIncrease: 25,          // NEW
    creepLevel: 50,             // NEW
    creepMaxed: false           // NEW
};
```

### CSS Classes
```css
/* Creep Indicator */
.creep-indicator              /* Base */
.creep-indicator.creep-low    /* Green */
.creep-indicator.creep-medium /* Amber */
.creep-indicator.creep-high   /* Red */
.creep-indicator.creep-critical /* Red pulsing */

/* Violation Warning */
.violation-warning    /* Container */
.violation-header     /* Title */
.violation-words      /* Forbidden words */
.creep-change         /* Level change */
.creep-warning        /* Warning message */
.creep-maxed          /* Game over message */
```

---

## 📈 Analytics

### New Events

**Non-Fatal Violation:**
```javascript
trackEvent('blacklist_violation_creep', {
    violatedWords: ['sunset'],
    creepIncrease: 25,
    previousCreep: 25,
    newCreep: 50,
    attemptsRemaining: 2
});
```

**Game Over:**
```javascript
trackEvent('game_over', {
    reason: 'creep_threshold_reached',
    violatedWords: ['night'],
    finalCreepLevel: 100,
    finalAttempts: 7,
    wordsMatched: 2
});
```

---

## 🎭 Haiku Responses

### Creep Increasing (Not Game Over)
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

---

## 🎯 Design Rationale

### Why Progressive Penalty?

1. **Forgiveness**: New players can learn without instant punishment
2. **Tension**: Mounting pressure creates drama
3. **Strategy**: Players must weigh risk vs reward
4. **Engagement**: More gameplay before failure
5. **Narrative**: "Darkness creeping in" fits haiku's contemplative mood

### Why 4 Violations?

- **Balance**: Forgiving but not too lenient
- **Clear Math**: 25 × 4 = 100 (easy to understand)
- **Tension Curve**: Each violation feels increasingly dangerous
- **Strategic Depth**: Must carefully manage remaining chances

### Why "Creep" Terminology?

- **Gaming Heritage**: Common in strategy games
- **Thematic Fit**: Darkness "creeping" in
- **Visual Metaphor**: Easy to visualize
- **Memorable**: Distinct from generic "penalty"

---

## 🧪 Testing Scenarios

### Test 1: Single Violation
```
Action: Use 1 blacklist word
Expected: Creep = 25, game continues
Result: ✅ Pass
```

### Test 2: Multiple Violations
```
Action: Use 3 blacklist words
Expected: Creep = 75, critical warning
Result: ✅ Pass
```

### Test 3: Game Over
```
Action: Use 4 blacklist words
Expected: Creep = 100, game ends
Result: ✅ Pass
```

### Test 4: Multiple Words in One Prompt
```
Action: Use 2 blacklist words in single prompt
Expected: Creep = 50 (2 × 25)
Result: ✅ Pass
```

### Test 5: UI Updates
```
Action: Trigger violations
Expected: Color changes, pulsing animation
Result: ✅ Pass
```

---

## 🔮 Future Enhancements

### Potential Features

1. **Creep Decay**
   - Successful attempts reduce creep by 5
   - Rewards good play

2. **Visual Darkening**
   - Screen gradually darkens
   - CSS filter based on creep level

3. **Difficulty Modes**
   - Easy: 20 creep/violation (5 chances)
   - Normal: 25 creep/violation (4 chances)
   - Hard: 33 creep/violation (3 chances)

4. **Creep Milestones**
   - Special messages at 25, 50, 75
   - Achievements for surviving high creep

---

## 📚 Documentation

### New Documentation
- **docs/CREEP_SYSTEM.md** (11KB)
  - Complete mechanics guide
  - Implementation details
  - Design rationale
  - Testing scenarios
  - Future enhancements

---

## 🚀 Deployment

### Git Commands
```bash
git add -A
git commit -m "feat: add creep/darkness system - The Black Update"
git push origin main
```

### Commit Details
- **Hash**: `51865c8`
- **Branch**: `main`
- **Status**: ✅ Pushed

---

## 📝 Version History

### v1.2.0-alpha (2025-10-28) - This Release
- Creep/Darkness system
- Progressive penalty for violations
- 4 chances before game over
- Color-coded visual feedback

### v1.1.0-alpha (2025-10-28)
- XSS protection with DOMPurify
- Prompt injection detection
- Security signals UI

### v1.0.0-alpha (2025-10-25)
- Side navigation system
- Keyboard shortcuts
- Mobile optimization

---

## 🎮 User Experience Impact

### Before
```
Player: "Write about sunset"
System: ☠️ GAME OVER
Player: "That was harsh..."
```

### After
```
Player: "Write about sunset"
System: ⚠️ Creep increased to 25
Player: "Oh! I can continue, but need to be careful"

[Later...]
Player: "Write about night"
System: ⚠️ Creep increased to 50
Player: "Getting dangerous..."

[Later...]
Player: "Write about moon"
System: 🔴 CRITICAL! Creep at 75
Player: "One more mistake and I'm done!"

[Later...]
Player: "Write about stars"
System: ☠️ GAME OVER - Darkness consumed all
Player: "I pushed my luck too far, but it was exciting!"
```

---

## 🙏 Acknowledgments

- **Gaming Community**: Creep mechanics inspiration
- **Players**: Feedback on instant-fail being too harsh
- **Design Philosophy**: Progressive disclosure and forgiveness

---

## 📞 Support

For questions about the creep system:
1. Read `docs/CREEP_SYSTEM.md`
2. Check trail item examples
3. Test with different violation counts
4. Open GitHub issue if needed

---

**Release prepared by:** Ona  
**Date:** October 28, 2025  
**Status:** ✅ Committed and Pushed  
**Theme:** 🌑 The Black Update - Darkness Creeps In
