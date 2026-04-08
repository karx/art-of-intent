# Daily Words Generation System

## Overview

Art of Intent generates new target and blacklist words daily using a seeded random algorithm. This ensures all players worldwide get the same words for each calendar day.

## Current Implementation

### Word Pools

Four categories of thematic words:

```javascript
const wordPools = {
    nature: ['mountain', 'river', 'forest', 'ocean', 'wind', 'rain', 'snow', 'cloud', 'moon', 'star', 'flower', 'tree', 'leaf', 'stone', 'wave'],
    emotions: ['joy', 'peace', 'sorrow', 'hope', 'fear', 'love', 'calm', 'wonder', 'dream', 'silence', 'light', 'shadow', 'warmth', 'cold', 'gentle'],
    time: ['dawn', 'dusk', 'night', 'day', 'spring', 'summer', 'autumn', 'winter', 'moment', 'eternal', 'fleeting', 'ancient', 'new', 'old', 'season'],
    actions: ['whisper', 'dance', 'flow', 'bloom', 'fade', 'rise', 'fall', 'drift', 'soar', 'rest', 'wake', 'sleep', 'breathe', 'sing', 'echo']
};
```

**Total Pool:** 60 words across 4 categories

### Daily Generation Algorithm

1. **Seed Generation**
   - Uses `new Date().toDateString()` as seed
   - Format: "Mon Oct 27 2025"
   - Ensures same words for all players on same day

2. **Target Words Selection**
   - Selects 3 categories randomly
   - Picks 1 word from each category
   - Result: 3 target words from different themes

3. **Blacklist Words Selection**
   - Filters out target words from pool
   - Randomly selects 5-7 words
   - Ensures no overlap with targets

4. **Persistence**
   - Saves to localStorage: `targetWords`, `blacklistWords`, `gameDate`
   - Loads on page refresh if same day
   - Regenerates if date changes

### Seeded Random Function

```javascript
function seededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    
    return function() {
        hash = (hash * 9301 + 49297) % 233280;
        return hash / 233280;
    };
}
```

**Algorithm:** Linear Congruential Generator (LCG)
- Deterministic: Same seed = same sequence
- Fast: O(1) per call
- Sufficient randomness for word selection

## Issues Identified

### Issue 1: Date Format Inconsistency

**Problem:**
- `toDateString()` returns locale-dependent format
- Different timezones may have different dates
- String comparison can fail with whitespace/encoding

**Example:**
```javascript
// US: "Mon Oct 27 2025"
// UK: "Mon Oct 27 2025" (same, but not guaranteed)
// Some locales: Different day names
```

### Issue 2: Timezone Edge Cases

**Problem:**
- User in timezone UTC+14 sees Oct 28
- User in timezone UTC-12 sees Oct 26
- Both should get same words for "today"

**Current Behavior:**
- Uses client's local date
- No UTC normalization
- Players in different timezones get different words

### Issue 3: No Fallback for Empty Words

**Problem:**
- If localStorage is corrupted or cleared mid-day
- If date comparison fails
- Game loads with empty word arrays

**Current Behavior:**
```javascript
gameState.targetWords = JSON.parse(localStorage.getItem('targetWords') || '[]');
// If empty, game is unplayable
```

### Issue 4: No Manual Refresh Mechanism

**Problem:**
- If words don't generate correctly
- No way for user to force regeneration
- Must clear localStorage manually

## Proposed Solutions

### Solution 1: UTC-Based Date Key

**Change date format to UTC-based YYYY-MM-DD:**

```javascript
function getDailyDateKey() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

**Benefits:**
- Consistent format worldwide
- No locale dependencies
- Easy to parse and compare
- Sortable (YYYY-MM-DD)

**Example:**
- All players see "2025-10-27" on Oct 27 UTC
- Resets at midnight UTC
- Predictable behavior

### Solution 2: Fallback Word Generation

**Always ensure words are available:**

```javascript
function ensureWordsAvailable() {
    if (gameState.targetWords.length === 0 || gameState.blacklistWords.length === 0) {
        console.warn('⚠️ Words missing, regenerating...');
        generateDailyWords();
    }
}
```

**Call after:**
- Page load
- localStorage load
- Any word-dependent operation

### Solution 3: Word Validation

**Validate words before starting game:**

```javascript
function validateWords() {
    const issues = [];
    
    if (gameState.targetWords.length !== 3) {
        issues.push(`Invalid target count: ${gameState.targetWords.length}`);
    }
    
    if (gameState.blacklistWords.length < 5 || gameState.blacklistWords.length > 7) {
        issues.push(`Invalid blacklist count: ${gameState.blacklistWords.length}`);
    }
    
    const overlap = gameState.targetWords.filter(w => 
        gameState.blacklistWords.includes(w)
    );
    if (overlap.length > 0) {
        issues.push(`Word overlap: ${overlap.join(', ')}`);
    }
    
    if (issues.length > 0) {
        console.error('❌ Word validation failed:', issues);
        generateDailyWords();
        return false;
    }
    
    return true;
}
```

### Solution 4: Manual Refresh Button

**Add debug/admin control:**

```javascript
// In console or admin panel
window.regenerateWords = function() {
    console.log('🔄 Manually regenerating words...');
    generateDailyWords();
    resetGameState();
    updateUI();
    console.log('✅ Words regenerated:', {
        target: gameState.targetWords,
        blacklist: gameState.blacklistWords
    });
};
```

**Usage:**
```javascript
// In browser console
window.regenerateWords();
```

### Solution 5: Server-Side Word Generation (Future)

**For production scale:**

```javascript
// API endpoint: GET /api/daily-words?date=2025-10-27
async function fetchDailyWords(date) {
    const response = await fetch(`/api/daily-words?date=${date}`);
    const data = await response.json();
    return {
        targetWords: data.target,
        blacklistWords: data.blacklist,
        seed: data.seed
    };
}
```

**Benefits:**
- Centralized control
- Can update word pools without client update
- Analytics on word difficulty
- A/B testing different word sets
- Seasonal/themed words

## Recommended Implementation

### Phase 1: Immediate Fix (Client-Side)

1. **Switch to UTC date key**
   - Replace `toDateString()` with `getDailyDateKey()`
   - Update localStorage key to `gameDate_v2`
   - Migrate existing users gracefully

2. **Add word validation**
   - Validate on load
   - Regenerate if invalid
   - Log errors for debugging

3. **Add fallback generation**
   - Check words before game start
   - Regenerate if empty
   - Show user notification

4. **Add manual refresh**
   - Console command for debugging
   - Hidden keyboard shortcut (Ctrl+Shift+R)
   - Admin panel option

### Phase 2: Enhanced Reliability

1. **Expand word pools**
   - Add more categories (colors, textures, sounds)
   - Increase words per category to 20+
   - Total pool: 100+ words

2. **Add word difficulty tiers**
   - Easy: Common words (mountain, river)
   - Medium: Abstract words (fleeting, eternal)
   - Hard: Rare words (ephemeral, luminous)

3. **Implement word history**
   - Track last 30 days of words
   - Avoid repeating recent combinations
   - Ensure variety

4. **Add word analytics**
   - Track win rates per word
   - Identify difficult words
   - Balance difficulty over time

### Phase 3: Server-Side (Production)

1. **API endpoint for daily words**
   - Centralized generation
   - Consistent across all clients
   - Can update without deployment

2. **Database storage**
   - Store daily words in database
   - Historical record
   - Analytics and insights

3. **Admin dashboard**
   - Preview upcoming words
   - Override specific days
   - Seasonal themes

## Testing Strategy

### Test Cases

1. **Date Change Test**
   ```javascript
   // Set date to yesterday
   localStorage.setItem('gameDate', 'Sun Oct 26 2025');
   // Reload page
   // Verify: New words generated
   ```

2. **Empty Words Test**
   ```javascript
   // Clear words
   localStorage.removeItem('targetWords');
   localStorage.removeItem('blacklistWords');
   // Reload page
   // Verify: Words regenerated
   ```

3. **Timezone Test**
   ```javascript
   // Test in different timezones
   // UTC, UTC+12, UTC-12
   // Verify: Same words for same UTC date
   ```

4. **Seed Consistency Test**
   ```javascript
   // Generate words for same date multiple times
   // Verify: Always same words
   ```

5. **Word Overlap Test**
   ```javascript
   // Generate 1000 days of words
   // Verify: No target/blacklist overlap
   ```

### Manual Testing

1. Clear localStorage
2. Reload page
3. Verify words appear
4. Note words
5. Reload page
6. Verify same words
7. Change system date
8. Reload page
9. Verify different words

### Automated Testing

```javascript
describe('Daily Words Generation', () => {
    it('generates consistent words for same date', () => {
        const date = '2025-10-27';
        const words1 = generateWordsForDate(date);
        const words2 = generateWordsForDate(date);
        expect(words1.target).toEqual(words2.target);
        expect(words1.blacklist).toEqual(words2.blacklist);
    });
    
    it('generates different words for different dates', () => {
        const words1 = generateWordsForDate('2025-10-27');
        const words2 = generateWordsForDate('2025-10-28');
        expect(words1.target).not.toEqual(words2.target);
    });
    
    it('never overlaps target and blacklist', () => {
        for (let i = 0; i < 365; i++) {
            const date = addDays(new Date(), i);
            const words = generateWordsForDate(formatDate(date));
            const overlap = words.target.filter(w => words.blacklist.includes(w));
            expect(overlap).toHaveLength(0);
        }
    });
});
```

## Monitoring & Debugging

### Console Logging

```javascript
console.log('📅 Daily Words System');
console.log('Date Key:', getDailyDateKey());
console.log('Target Words:', gameState.targetWords);
console.log('Blacklist Words:', gameState.blacklistWords);
console.log('Saved Date:', localStorage.getItem('gameDate'));
```

### Error Tracking

```javascript
if (gameState.targetWords.length === 0) {
    console.error('❌ CRITICAL: No target words generated');
    // Send to error tracking service
    trackError('no_target_words', {
        date: getDailyDateKey(),
        savedDate: localStorage.getItem('gameDate'),
        localStorage: Object.keys(localStorage)
    });
}
```

### Analytics Events

```javascript
trackEvent('daily_words_generated', {
    date: getDailyDateKey(),
    targetWords: gameState.targetWords.length,
    blacklistWords: gameState.blacklistWords.length,
    seed: seed
});
```

## Migration Plan

### For Existing Users

1. **Detect old date format**
   ```javascript
   const oldDate = localStorage.getItem('gameDate');
   if (oldDate && !oldDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
       // Old format detected, migrate
       console.log('🔄 Migrating to new date format');
       localStorage.removeItem('gameDate');
       generateDailyWords();
   }
   ```

2. **Preserve current game**
   - Don't reset if user is mid-game
   - Only regenerate on next day

3. **Show notification**
   - "Daily words system updated"
   - "Your progress is safe"

## Future Enhancements

1. **Themed Days**
   - Monday: Nature theme
   - Friday: Emotions theme
   - Seasonal variations

2. **Difficulty Progression**
   - Week 1: Easy words
   - Week 2: Medium words
   - Week 3: Hard words
   - Week 4: Mixed

3. **Community Voting**
   - Players vote on favorite words
   - Popular words appear more often
   - Unpopular words retired

4. **Word Suggestions**
   - Players suggest new words
   - Moderation and approval
   - Credit contributors

5. **Multilingual Support**
   - Word pools in different languages
   - Auto-detect user language
   - Consistent difficulty across languages
