# Schema.org Implementation

## Overview

The Art of Intent game implements comprehensive Schema.org markup to expose all user interactions and game statistics as structured data. This enables search engines, assistants, and other tools to understand the game's capabilities and current state.

## Implementation Approach

We use JSON-LD (JSON for Linking Data) embedded in the HTML `<head>` section. The schema is dynamically updated as the game progresses to reflect real-time statistics.

## Schema Types Used

### 1. Game (Primary Type)

The root type describing the game itself:

```json
{
  "@type": "Game",
  "name": "Art of Intent - Haiku Challenge",
  "description": "A text-based game where players guide an AI haiku bot...",
  "genre": "Word Puzzle",
  "gameMode": "SinglePlayer",
  "playMode": "SinglePlayer"
}
```

**Properties:**
- `name`: Game title
- `description`: What the game is about
- `genre`: Category (Word Puzzle)
- `gameMode`: Single player
- `gamePlatform`: Web Browser
- `offers`: Free to play

## 2. potentialAction (User Actions)

Describes all actions users can take in the game. Each action follows the Schema.org Action vocabulary.

### Submit Prompt Action

```json
{
  "@type": "CommunicateAction",
  "@id": "#submit-prompt-action",
  "name": "Submit Prompt",
  "description": "Submit a text prompt to guide Arty the Haiku Bot",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://artofintent.game",
    "actionPlatform": ["DesktopWebPlatform", "MobileWebPlatform"],
    "httpMethod": "POST",
    "contentType": "text/plain"
  },
  "object": {
    "@type": "Message",
    "description": "User's prompt to guide the AI"
  },
  "result": {
    "@type": "Message",
    "description": "AI-generated haiku response"
  }
}
```

**Why CommunicateAction?**
- Represents sending a message to the AI
- Has `object` (the prompt) and `result` (the response)
- Semantic meaning: user communicates with bot

### Voice Input Action

```json
{
  "@type": "InteractAction",
  "@id": "#voice-input-action",
  "name": "Voice Input",
  "description": "Use voice recognition to input your prompt",
  "instrument": {
    "@type": "SoftwareApplication",
    "name": "Web Speech API"
  }
}
```

**Why InteractAction?**
- Generic interaction with the interface
- Uses `instrument` to specify the technology (Web Speech API)
- Platform-specific capability

### Export Session Action

```json
{
  "@type": "DownloadAction",
  "@id": "#export-session-action",
  "name": "Export Session Data",
  "description": "Download complete session data in JSON-LD format",
  "result": {
    "@type": "DataDownload",
    "encodingFormat": "application/ld+json",
    "description": "Complete session analytics with KPIs and metrics"
  }
}
```

**Why DownloadAction?**
- User downloads a file
- `result` specifies the file type (JSON-LD)
- Clear semantic meaning for data export

### Share Score Action

```json
{
  "@type": "ShareAction",
  "@id": "#share-score-action",
  "name": "Share Score",
  "description": "Share your game score and statistics"
}
```

**Why ShareAction?**
- User shares content externally
- Standard social sharing action
- Platform-agnostic

### View Response Trail Action

```json
{
  "@type": "ViewAction",
  "@id": "#view-trail-action",
  "name": "View Response Trail",
  "description": "View complete conversation history with Arty",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://artofintent.game#trailContainer"
  }
}
```

**Why ViewAction?**
- User views content
- Links to specific section (#trailContainer)
- Navigation action

## 3. interactionStatistic (Counters)

Tracks cumulative user interactions using `InteractionCounter` type. These are **dynamically updated** as the game progresses.

### Attempts Counter

```json
{
  "@type": "InteractionCounter",
  "@id": "#attempts-counter",
  "interactionType": "https://schema.org/CommentAction",
  "name": "Total Attempts",
  "userInteractionCount": 0,
  "description": "Number of prompts submitted in current session"
}
```

**Mapping:**
- `interactionType`: CommentAction (submitting text)
- `userInteractionCount`: Updated from `gameState.attempts`
- Increments with each prompt submission

### Tokens Counter

```json
{
  "@type": "InteractionCounter",
  "@id": "#tokens-counter",
  "interactionType": "https://schema.org/ConsumeAction",
  "name": "Total Tokens",
  "userInteractionCount": 0,
  "description": "Total API tokens consumed in current session"
}
```

**Mapping:**
- `interactionType`: ConsumeAction (consuming API resources)
- `userInteractionCount`: Updated from `gameState.totalTokens`
- Accumulates with each API call

### Words Matched Counter

```json
{
  "@type": "InteractionCounter",
  "@id": "#matches-counter",
  "interactionType": "https://schema.org/AchieveAction",
  "name": "Words Matched",
  "userInteractionCount": 0,
  "description": "Number of target words successfully matched"
}
```

**Mapping:**
- `interactionType`: AchieveAction (achieving goals)
- `userInteractionCount`: Updated from `gameState.matchedWords.size`
- Increments when target words are found

### Voice Input Uses Counter

```json
{
  "@type": "InteractionCounter",
  "@id": "#voice-uses-counter",
  "interactionType": "https://schema.org/InteractAction",
  "name": "Voice Input Uses",
  "userInteractionCount": 0,
  "description": "Number of times voice input was used"
}
```

**Mapping:**
- `interactionType`: InteractAction (UI interaction)
- `userInteractionCount`: Count of `voice_input_completed` events
- Tracks voice feature usage

### Session Exports Counter

```json
{
  "@type": "InteractionCounter",
  "@id": "#exports-counter",
  "interactionType": "https://schema.org/DownloadAction",
  "name": "Session Exports",
  "userInteractionCount": 0,
  "description": "Number of times session data was exported"
}
```

**Mapping:**
- `interactionType`: DownloadAction (downloading files)
- `userInteractionCount`: Count of `session_exported` events
- Tracks export feature usage

## 4. aggregateRating

Provides an overall rating based on game performance:

```json
{
  "@type": "AggregateRating",
  "ratingValue": "0",
  "reviewCount": "0",
  "bestRating": "100",
  "worstRating": "0"
}
```

**Dynamic Calculation:**
- On game completion, converts efficiency score to 0-100 rating
- Lower efficiency score = higher rating (inverted)
- Formula: `rating = 100 - (efficiencyScore / 5)`
- Only updated on victory

## Dynamic Updates

The schema is updated in real-time via JavaScript:

### Update Triggers

1. **Page Load**: Initial schema loaded
2. **After Each Prompt**: Attempts and tokens updated
3. **Word Match**: Matches counter updated
4. **Voice Input**: Voice uses counter updated
5. **Export**: Exports counter updated
6. **Game Over**: Aggregate rating calculated

### Update Function

```javascript
function updateSchemaMetadata() {
    const schemaScript = document.getElementById('game-schema');
    const schema = JSON.parse(schemaScript.textContent);
    
    // Update counters from gameState
    schema.interactionStatistic.forEach(counter => {
        if (counter['@id'] === '#attempts-counter') {
            counter.userInteractionCount = gameState.attempts;
        }
        // ... other counters
    });
    
    // Write back to DOM
    schemaScript.textContent = JSON.stringify(schema, null, 2);
}
```

Called from:
- `initializeGame()`
- `updateUI()`
- `exportSessionData()`

## Benefits

### For Search Engines
- Understand game capabilities
- Index available actions
- Display rich snippets with interaction counts

### For Voice Assistants
- Discover available commands
- Understand game state
- Provide contextual help

### For Analytics Tools
- Track user behavior patterns
- Measure feature usage
- Identify popular actions

### For Developers
- Self-documenting API
- Clear action definitions
- Standardized vocabulary

## Validation

### Tools
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Structured Data Linter**: http://linter.structured-data.org/

### Testing Steps

1. Open the game in a browser
2. View page source
3. Copy the JSON-LD from `<script id="game-schema">`
4. Paste into validator
5. Check for errors/warnings

### Expected Results
- ✅ Valid Game type
- ✅ All potentialActions recognized
- ✅ InteractionCounters properly formatted
- ✅ No structural errors

## Best Practices

### 1. Keep Actions Discoverable
- Each action has clear `name` and `description`
- `target` specifies where action happens
- Platform support explicitly listed

### 2. Update Counters Frequently
- Update after every state change
- Ensure counts are accurate
- Log updates for debugging

### 3. Use Appropriate Action Types
- Match action to semantic meaning
- Use specific types over generic ones
- Follow Schema.org guidelines

### 4. Provide Rich Metadata
- Include descriptions for all properties
- Specify result types
- Document instruments/tools used

## Future Enhancements

### Potential Additions
- [ ] `GameServer` type for multiplayer
- [ ] `VideoGame` subtype for richer metadata
- [ ] `Review` type for user feedback
- [ ] `HowTo` type for tutorial steps
- [ ] `FAQPage` type for help section

### Advanced Features
- [ ] Real-time schema updates via WebSocket
- [ ] Historical interaction statistics
- [ ] Cross-session aggregate data
- [ ] Leaderboard integration

## References

- [Schema.org Game](https://schema.org/Game)
- [Schema.org Action](https://schema.org/Action)
- [Schema.org InteractionCounter](https://schema.org/InteractionCounter)
- [JSON-LD Specification](https://json-ld.org/)
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)

## Example Usage

### Viewing Current Schema

```javascript
// In browser console
const schema = JSON.parse(
  document.getElementById('game-schema').textContent
);
console.log('Current attempts:', 
  schema.interactionStatistic.find(c => c['@id'] === '#attempts-counter')
    .userInteractionCount
);
```

### Manually Triggering Update

```javascript
// Force schema update
updateSchemaMetadata();
```

### Extracting Action List

```javascript
// Get all available actions
const actions = schema.potentialAction.map(a => ({
  type: a['@type'],
  name: a.name,
  description: a.description
}));
console.table(actions);
```

---

This implementation provides a complete, standards-compliant way to expose game interactions and statistics as structured data, making the game more discoverable and interoperable with web technologies.
