# Schema.org Validation Guide

## Quick Validation

### Method 1: View in Browser

1. Open the game: http://localhost:8000
2. Right-click → "View Page Source"
3. Find `<script type="application/ld+json" id="game-schema">`
4. Copy the entire JSON-LD block

### Method 2: Browser Console

```javascript
// Get current schema
const schema = JSON.parse(
  document.getElementById('game-schema').textContent
);

// Pretty print
console.log(JSON.stringify(schema, null, 2));

// Check specific counters
schema.interactionStatistic.forEach(counter => {
  console.log(`${counter.name}: ${counter.userInteractionCount}`);
});

// List all actions
schema.potentialAction.forEach(action => {
  console.log(`${action['@type']}: ${action.name}`);
});
```

## Online Validators

### 1. Google Rich Results Test
**URL**: https://search.google.com/test/rich-results

**Steps:**
1. Copy the JSON-LD from page source
2. Paste into the "Code" tab
3. Click "Test Code"
4. Check for errors/warnings

**Expected Results:**
- ✅ Valid structured data detected
- ✅ Game type recognized
- ⚠️ May show warnings about missing properties (normal for custom game types)

### 2. Schema.org Validator
**URL**: https://validator.schema.org/

**Steps:**
1. Select "Code Snippet" tab
2. Paste the JSON-LD
3. Click "Run Test"

**Expected Results:**
- ✅ No syntax errors
- ✅ All types recognized
- ✅ Properties properly formatted

### 3. Structured Data Linter
**URL**: http://linter.structured-data.org/

**Steps:**
1. Paste the JSON-LD
2. Click "Lint"
3. Review the visual tree

**Expected Results:**
- ✅ Clean tree structure
- ✅ All nested objects visible
- ✅ No red error indicators

## Testing Dynamic Updates

### Test Scenario 1: Submit a Prompt

```javascript
// Before submission
const before = JSON.parse(
  document.getElementById('game-schema').textContent
);
console.log('Attempts before:', 
  before.interactionStatistic.find(c => c['@id'] === '#attempts-counter')
    .userInteractionCount
);

// Submit a prompt via UI

// After submission
const after = JSON.parse(
  document.getElementById('game-schema').textContent
);
console.log('Attempts after:', 
  after.interactionStatistic.find(c => c['@id'] === '#attempts-counter')
    .userInteractionCount
);
```

**Expected:** Counter increments by 1

### Test Scenario 2: Voice Input

```javascript
// Track voice counter
const getVoiceCount = () => {
  const schema = JSON.parse(
    document.getElementById('game-schema').textContent
  );
  return schema.interactionStatistic
    .find(c => c['@id'] === '#voice-uses-counter')
    .userInteractionCount;
};

console.log('Before voice:', getVoiceCount());
// Use voice input button
console.log('After voice:', getVoiceCount());
```

**Expected:** Counter increments after successful voice input

### Test Scenario 3: Export Session

```javascript
// Track export counter
const getExportCount = () => {
  const schema = JSON.parse(
    document.getElementById('game-schema').textContent
  );
  return schema.interactionStatistic
    .find(c => c['@id'] === '#exports-counter')
    .userInteractionCount;
};

console.log('Before export:', getExportCount());
// Click export button
console.log('After export:', getExportCount());
```

**Expected:** Counter increments after export

## Validation Checklist

### Structure
- [ ] JSON-LD is valid JSON
- [ ] `@context` is "https://schema.org"
- [ ] `@type` is "Game"
- [ ] `@id` is present and unique

### potentialAction
- [ ] 5 actions defined
- [ ] Each has `@type`, `@id`, `name`, `description`
- [ ] Each has `target` with `EntryPoint`
- [ ] Action types are appropriate:
  - [ ] CommunicateAction for prompts
  - [ ] InteractAction for voice
  - [ ] DownloadAction for export
  - [ ] ShareAction for sharing
  - [ ] ViewAction for viewing

### interactionStatistic
- [ ] 5 counters defined
- [ ] Each has `@type` = "InteractionCounter"
- [ ] Each has `@id`, `name`, `description`
- [ ] Each has `interactionType` (Schema.org URL)
- [ ] Each has `userInteractionCount` (number)
- [ ] Counters update dynamically

### Dynamic Updates
- [ ] Schema updates on page load
- [ ] Schema updates after prompt submission
- [ ] Schema updates after voice input
- [ ] Schema updates after export
- [ ] Schema updates on game over
- [ ] No JavaScript errors in console

## Common Issues

### Issue: Schema not updating

**Symptoms:**
- Counters stay at 0
- No changes after actions

**Solutions:**
1. Check console for errors
2. Verify `updateSchemaMetadata()` is called
3. Check `gameState` is properly updated
4. Ensure `game-schema` element exists

### Issue: Invalid JSON

**Symptoms:**
- Validators show syntax errors
- Console shows parse errors

**Solutions:**
1. Check for trailing commas
2. Verify all quotes are properly escaped
3. Ensure proper nesting
4. Use JSON.stringify() to generate

### Issue: Unknown types

**Symptoms:**
- Validators don't recognize types
- Warnings about invalid properties

**Solutions:**
1. Verify `@context` is set correctly
2. Check type names match Schema.org exactly
3. Ensure proper capitalization
4. Some custom properties may show warnings (normal)

## Performance Testing

### Check Update Frequency

```javascript
let updateCount = 0;
const originalUpdate = updateSchemaMetadata;
updateSchemaMetadata = function() {
  updateCount++;
  console.log('Schema update #', updateCount);
  return originalUpdate.apply(this, arguments);
};
```

**Expected:** Updates should be minimal and efficient

### Check Schema Size

```javascript
const schema = document.getElementById('game-schema').textContent;
console.log('Schema size:', schema.length, 'bytes');
console.log('Parsed size:', JSON.stringify(
  JSON.parse(schema)
).length, 'bytes');
```

**Expected:** ~5-10KB (reasonable for structured data)

## Automated Testing

### Jest Test Example

```javascript
describe('Schema.org Metadata', () => {
  test('should have valid JSON-LD', () => {
    const schema = JSON.parse(
      document.getElementById('game-schema').textContent
    );
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Game');
  });

  test('should update counters', () => {
    const before = JSON.parse(
      document.getElementById('game-schema').textContent
    );
    
    // Simulate action
    gameState.attempts++;
    updateSchemaMetadata();
    
    const after = JSON.parse(
      document.getElementById('game-schema').textContent
    );
    
    expect(after.interactionStatistic[0].userInteractionCount)
      .toBe(before.interactionStatistic[0].userInteractionCount + 1);
  });
});
```

## Continuous Validation

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Extract and validate schema
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script type=\"application\/ld\+json\"[^>]*>(.*?)<\/script>/s);
if (match) {
  try {
    JSON.parse(match[1]);
    console.log('✅ Schema.org JSON-LD is valid');
  } catch (e) {
    console.error('❌ Invalid JSON-LD:', e.message);
    process.exit(1);
  }
}
"
```

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)
- [JSON-LD Playground](https://json-ld.org/playground/)
- [Schema.org Actions](https://schema.org/docs/actions.html)

## Support

If validation fails:
1. Check browser console for errors
2. Verify game state is updating correctly
3. Test with online validators
4. Review SCHEMA_ORG.md for implementation details
5. Check that config.js is loaded before game.js
