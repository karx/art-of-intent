# Feedback System - Art of Intent Brand

## Design Philosophy

**Contemplative, Not Punitive**: Blacklist hits are game progression, not errors
**Subtle Presence**: Feedback whispers, doesn't shout
**Poetic Consistency**: Aligned with Arty's contemplative nature
**Cognitive Clarity**: Token consumption vs system prevention

---

## Feedback Types

### 1. Input Rejected (No Tokens Consumed)

**Trigger**: User directly types target or blacklist words
**Visual**: Dimmed response + inline feedback
**Tokens**: None consumed (system prevented API call)

```
Don't use these words directly—it's no fun then! The game is about clever prompting, not direct usage.

input rejected (word1, word2) creep +10 no tokens consumed
```

**Design Decisions**:
- Response shown at 50% opacity (dimmed)
- Inline feedback, not a box
- Yellow accent (gentle warning)
- Explicit "no tokens consumed" hint
- Minimal vertical space
- Lowercase labels (less aggressive)

**Brand Alignment**:
- Gentle nudge, not error message
- Encourages trying again
- No dramatic visual weight

---

### 2. Darkness Creeps (Tokens Consumed)

**Trigger**: Arty's haiku contains blacklist words
**Visual**: Normal response + subtle darkness indicator
**Tokens**: Consumed (real API response)

```
Silent, cold, and deep,
Ancient stars in dark expanse,
Galaxies ignite.

▓ darkness creeps (star) +25 [50/100]
```

**Design Decisions**:
- Haiku displayed normally (it's a valid response)
- Darkness icon (▓) suggests creeping shadow
- Shows which words triggered it
- Displays creep progression [current/max]
- No "error" or "violation" language
- Lowercase "darkness creeps" (poetic)

**Brand Alignment**:
- Treats blacklist as game mechanic
- Poetic language ("darkness creeps")
- Shows consequence without judgment
- Emphasizes progression, not failure

---

### 3. Critical Violation (Legacy)

**Trigger**: Severe blacklist violation (legacy path)
**Visual**: Inline feedback with critical indicator

```
▓▓▓ threshold reached (word1, word2) +25 [100/100]
```

**Design Decisions**:
- Multiple darkness icons (▓▓▓) for severity
- Red accent for critical state
- Still inline, not a box
- Shows final creep level

---

## Visual Specifications

### Inline Feedback Structure
```
[icon] [label] ([words]) [creep] [level] [hint]
```

### Typography
- **Font**: Monaco, Menlo, Ubuntu Mono (monospace)
- **Size**: 0.65-0.7rem (very small, unobtrusive)
- **Opacity**: 0.6-0.8 (subtle presence)
- **Color**: Secondary text (not bright)

### Spacing
- **Margin Top**: 6px (tight to response)
- **Padding**: 4px 0 (minimal)
- **Gap**: 8px between elements
- **Flex Wrap**: Yes (responsive)

### Color Accents
- **Rejected**: Yellow (gentle warning)
- **Darkness**: Secondary text (neutral)
- **Critical**: Red (severe)

---

## Cognitive Patterns

### Token Consumption Clarity

| Scenario | Tokens | Visual Cue | Message |
|----------|--------|------------|---------|
| Input Rejected | ❌ None | Dimmed response + "no tokens consumed" | System prevented |
| Darkness Creeps | ✅ Yes | Normal response + darkness indicator | Game progressed |

### Space Efficiency

**Before** (Box Model):
```
┌─────────────────────────────────┐
│ [SYSTEM] INPUT REJECTED         │
│ Detected: word1, word2          │
│ Creep: 0 → 10 (+10)            │
└─────────────────────────────────┘
```
~60px vertical space

**After** (Inline):
```
input rejected (word1, word2) creep +10 no tokens consumed
```
~20px vertical space (67% reduction)

---

## Brand Alignment Checklist

✅ **Contemplative**: Lowercase labels, poetic language
✅ **Subtle**: Small font, low opacity, minimal space
✅ **Progressive**: Shows game state, not errors
✅ **Informative**: Clear about tokens and consequences
✅ **Consistent**: Monospace, terminal aesthetic
✅ **Non-Punitive**: "darkness creeps" not "violation"

---

## Implementation

**File**: `src/js/game.js` (Lines 1513-1540)
**Styles**: `src/css/styles.css` (Inline Feedback section)

**Classes**:
- `.feedback-inline` - Base inline feedback
- `.feedback-inline--rejected` - Input rejection (yellow)
- `.feedback-inline--darkness` - Arty violation (neutral)
- `.feedback-inline--critical` - Severe violation (red)
- `.trail-response--rejected` - Dimmed response styling

---

## User Experience Goals

1. **Whisper, Don't Shout**: Feedback is present but not dominant
2. **Poetic Consistency**: Language matches Arty's contemplative nature
3. **Space Efficient**: Minimal vertical space consumption
4. **Token Clarity**: Explicit about whether tokens were consumed
5. **Game Progression**: Treats blacklist as mechanic, not error
