# Feedback System - Maintainer Guide

## Overview

The feedback system provides subtle, brand-aligned indicators for game events (input rejections, blacklist violations, creep progression). This guide helps future maintainers understand and modify the system.

---

## Architecture

### File Structure

```
src/
├── css/
│   ├── themes.css          ← Feedback styling (EDIT HERE)
│   └── styles.css          ← Reference only (styling moved to themes.css)
└── js/
    └── game.js             ← Feedback logic
```

**IMPORTANT**: All feedback styling is in `themes.css` for theme consistency. Do NOT add feedback styles to `styles.css`.

---

## Feedback Types

### 1. Input Rejected (No Tokens Consumed)

**When**: User types target or blacklist words directly
**Tokens**: None (system prevents API call)
**Visual**: Dimmed response + yellow inline feedback

```javascript
// game.js: handleDirectWordUsage()
const trailItem = {
    directWordUsage: true,
    forbiddenWords: ['word1', 'word2'],
    creepIncrease: 10,
    creepMaxed: false  // or true if threshold reached
};
```

**Rendered as**:
```html
<div class="trail-response trail-response--rejected">...</div>
<div class="feedback-inline feedback-inline--rejected">
    <span class="feedback-label">input rejected</span>
    <span class="feedback-words">(word1, word2)</span>
    <span class="feedback-creep">creep +10</span>
    <span class="feedback-hint">no tokens consumed</span>
</div>
```

**Styling** (themes.css):
- `.feedback-inline--rejected`: opacity 0.6
- `.trail-response--rejected`: opacity 0.5 (dimmed)
- Label color: `var(--warning-color)` (yellow)

---

### 2. Darkness Creeps (Tokens Consumed)

**When**: Arty's response contains blacklist words
**Tokens**: Yes (real API response)
**Visual**: Normal response + darkness indicator

```javascript
// game.js: processResponse()
const trailItem = {
    blacklistWordsInResponse: ['word1'],
    creepIncrease: 25,
    creepLevel: 50
};
```

**Rendered as**:
```html
<div class="trail-response">...</div>
<div class="feedback-inline feedback-inline--darkness">
    <span class="feedback-icon">▓</span>
    <span class="feedback-label">darkness creeps</span>
    <span class="feedback-words">(word1)</span>
    <span class="feedback-creep">+25</span>
    <span class="feedback-level">[50/100]</span>
</div>
```

**Styling** (themes.css):
- `.feedback-inline--darkness`: opacity 0.8
- Label color: `var(--text-secondary)` (neutral)
- Icon: ▓ (single darkness block)

---

### 3. Critical Violation (Game Over)

**When**: Creep reaches 100 (threshold)
**Visual**: Critical feedback with multiple darkness icons

```javascript
// game.js: handleDirectWordUsage() or processResponse()
const trailItem = {
    creepMaxed: true,
    creepLevel: 100
};
```

**Rendered as**:
```html
<div class="feedback-inline feedback-inline--critical">
    <span class="feedback-icon">▓▓▓</span>
    <span class="feedback-label">threshold reached</span>
    <span class="feedback-words">(word1)</span>
    <span class="feedback-creep">+25</span>
    <span class="feedback-level">[100/100]</span>
</div>
```

**Styling** (themes.css):
- `.feedback-inline--critical`: opacity 0.9
- Label color: `var(--error-color)` (red)
- Icon: ▓▓▓ (triple darkness blocks)

---

## Styling Guide

### Location: `src/css/themes.css`

Search for: `FEEDBACK SYSTEM - INLINE INDICATORS`

### Key Classes

| Class | Purpose | Theme Variable |
|-------|---------|----------------|
| `.feedback-inline` | Base container | `--text-secondary` |
| `.feedback-inline--rejected` | Input rejection | `--warning-color` |
| `.feedback-inline--darkness` | Arty violation | `--text-secondary` |
| `.feedback-inline--critical` | Game over | `--error-color` |
| `.feedback-label` | Action label | Varies by type |
| `.feedback-words` | Violated words | `--text-secondary` |
| `.feedback-creep` | Creep change | Varies by type |
| `.feedback-level` | Creep level | `--text-secondary` |
| `.feedback-hint` | Helper text | `--text-secondary` |
| `.feedback-icon` | Darkness icon | `--text-secondary` |

### Design Principles

1. **Subtle**: Small font (0.65-0.7rem), low opacity (0.6-0.9)
2. **Inline**: Flex layout, minimal vertical space
3. **Monospace**: Terminal aesthetic consistency
4. **Theme-aware**: Uses CSS variables for colors
5. **Responsive**: Flex-wrap for small screens

### Modifying Styles

**Example: Change rejected input color**

```css
/* themes.css */
.feedback-inline--rejected .feedback-label {
    color: var(--warning-color); /* Change this variable */
}
```

**Example: Increase font size**

```css
/* themes.css */
.feedback-inline {
    font-size: 0.75rem; /* Was 0.7rem */
}
```

**Example: Add new feedback type**

```css
/* themes.css */
.feedback-inline--custom {
    opacity: 0.85;
}

.feedback-inline--custom .feedback-label {
    color: var(--info-color);
}
```

---

## Logic Guide

### Location: `src/js/game.js`

### Key Functions

#### 1. `handleDirectWordUsage(prompt, forbiddenWords)`

**Purpose**: Handle user input with target/blacklist words
**Tokens**: None consumed
**Creep**: +10

**Flow**:
1. Increment attempts
2. Add creep (+10)
3. Check if threshold reached
4. Create trail item with `directWordUsage: true`
5. Save state
6. Show game over modal if `creepMaxed`

**Critical Code**:
```javascript
const creepMaxed = gameState.creepLevel >= gameState.creepThreshold;

if (creepMaxed) {
    gameState.gameOver = true;
    // ... game over logic
}
```

#### 2. `processResponse(prompt, apiResponse, securityAnalysis)`

**Purpose**: Process Arty's response
**Tokens**: Yes (consumed)
**Creep**: +25 per blacklist word

**Flow**:
1. Extract response text
2. Check for target words (score increase)
3. Check for blacklist words
4. Add creep if blacklist words found
5. Check if threshold reached
6. Create trail item with `blacklistWordsInResponse`
7. Show game over modal if threshold reached

**Critical Code**:
```javascript
const blacklistWordsInResponse = gameState.blacklistWords.filter(word => 
    responseLower.includes(word.toLowerCase())
);

if (blacklistWordsInResponse.length > 0) {
    creepIncrease = blacklistWordsInResponse.length * gameState.creepPerViolation;
    gameState.creepLevel = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);
}

if (gameState.creepLevel >= gameState.creepThreshold) {
    gameState.gameOver = true;
    // ... game over logic
}
```

#### 3. `updateResponseTrail()`

**Purpose**: Render trail items with feedback
**Location**: Lines 1518-1600

**Rendering Logic**:
```javascript
// Input rejected (not game over)
${item.directWordUsage && !item.creepMaxed ? `
    <div class="feedback-inline feedback-inline--rejected">...</div>
` : ''}

// Input rejected (game over)
${item.directWordUsage && item.creepMaxed ? `
    <div class="feedback-inline feedback-inline--critical">...</div>
` : ''}

// Arty violation
${item.blacklistWordsInResponse && item.blacklistWordsInResponse.length > 0 ? `
    <div class="feedback-inline feedback-inline--darkness">...</div>
` : ''}
```

---

## Game Over Detection

### Three Paths to Game Over

1. **User Input Rejection** (`handleDirectWordUsage`)
   - Creep +10
   - Check: `gameState.creepLevel >= gameState.creepThreshold`
   - Line: ~819

2. **Arty Response Violation** (`processResponse`)
   - Creep +25 per word
   - Check: `gameState.creepLevel >= gameState.creepThreshold`
   - Line: ~765

3. **Legacy Blacklist Violation** (`handleBlacklistViolation`)
   - Creep +25 per word
   - Check: `gameState.creepLevel >= gameState.creepThreshold`
   - Line: ~904

### Critical: All Paths Must Check Threshold

**Bug Prevention**: Always check `creepLevel >= creepThreshold` after adding creep.

**Example**:
```javascript
gameState.creepLevel = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);

// ALWAYS CHECK AFTER ADDING CREEP
if (gameState.creepLevel >= gameState.creepThreshold) {
    gameState.gameOver = true;
    // ... game over logic
}
```

---

## Testing Checklist

### Visual Testing

- [ ] Input rejection shows dimmed response
- [ ] Input rejection shows yellow feedback
- [ ] Input rejection shows "no tokens consumed"
- [ ] Arty violation shows normal response
- [ ] Arty violation shows darkness icon (▓)
- [ ] Arty violation shows creep level [X/100]
- [ ] Critical shows triple darkness (▓▓▓)
- [ ] Critical shows red feedback
- [ ] All feedback uses monospace font
- [ ] All feedback is subtle (low opacity)

### Logic Testing

- [ ] User input with target word → rejected
- [ ] User input with blacklist word → rejected
- [ ] Creep increases by 10 on rejection
- [ ] Arty says blacklist word → darkness creeps
- [ ] Creep increases by 25 per word
- [ ] Game ends when creep reaches 100 (any path)
- [ ] Game over modal shows on threshold
- [ ] Creep persists across page refresh

### Theme Testing

- [ ] Feedback colors adapt to theme
- [ ] Yellow uses `--warning-color`
- [ ] Red uses `--error-color`
- [ ] Text uses `--text-secondary`
- [ ] All themes render correctly

---

## Common Modifications

### Change Creep Values

```javascript
// game.js
const creepIncrease = 10; // Change for input rejection
gameState.creepPerViolation = 25; // Change for violations
```

### Change Feedback Text

```javascript
// game.js: updateResponseTrail()
<span class="feedback-label">input rejected</span> // Change this
<span class="feedback-label">darkness creeps</span> // Or this
```

### Add New Feedback Type

1. **Add logic** (game.js):
```javascript
const trailItem = {
    customFeedback: true,
    customData: 'value'
};
```

2. **Add rendering** (game.js: updateResponseTrail):
```javascript
${item.customFeedback ? `
    <div class="feedback-inline feedback-inline--custom">
        <span class="feedback-label">custom event</span>
    </div>
` : ''}
```

3. **Add styling** (themes.css):
```css
.feedback-inline--custom {
    opacity: 0.85;
}

.feedback-inline--custom .feedback-label {
    color: var(--info-color);
}
```

---

## Troubleshooting

### Feedback Not Showing

1. Check trail item has correct flag (`directWordUsage`, `blacklistWordsInResponse`)
2. Verify rendering condition in `updateResponseTrail()`
3. Check CSS classes are correct

### Wrong Colors

1. Verify theme variable usage in themes.css
2. Check theme is loaded correctly
3. Inspect element to see computed styles

### Game Not Ending

1. Check creep threshold logic in all three paths
2. Verify `gameState.creepLevel >= gameState.creepThreshold`
3. Ensure `gameState.gameOver = true` is set
4. Check `showGameOverModal()` is called

### Styling Not Applied

1. Ensure styles are in `themes.css`, not `styles.css`
2. Check CSS specificity
3. Verify theme variables are defined
4. Clear browser cache

---

## Version History

- **v1.2.0**: Initial feedback system with inline indicators
- **v1.2.1**: Moved styling to themes.css for theme consistency
- **v1.2.2**: Fixed game over detection for user input path

---

## Contact

For questions or issues, refer to:
- `VIOLATION_UX_GUIDE.md` - Design philosophy
- `CHANGELOG.md` - Recent changes
- `src/css/themes.css` - Styling reference
- `src/js/game.js` - Logic reference
