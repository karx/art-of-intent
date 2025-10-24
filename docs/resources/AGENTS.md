# Art of Intent - Project Guidelines

## Project Overview
A text-based game where players guide "Arty" (an LLM haiku bot) to speak target words without using blacklisted words. Built with vanilla JavaScript, HTML, and CSS.

## Common Commands
- `python3 -m http.server 8000` - Start development server
- Game URL: Check port 8000 in the preview

## Project Structure
- `index.html` - Main game interface
- `game.js` - Game logic, API integration, tracking system
- `styles.css` - Dark theme styling with code editor aesthetics
- `TRACKING.md` - Documentation for analytics and export system
- `example-session.jsonld` - Sample export file

## Key Features

### Game Mechanics
- Daily target words (3) and blacklist words (5-7)
- Words generated using date-based seeding for consistency
- All progress persists in localStorage for the day
- Resets at midnight local time

### LLM Integration
- Uses Gemini 2.0 Flash API
- System instructions implement "Haiku Bot" persona
- Tracks token usage (prompt, output, total)
- API key stored in game.js (line 22)

### Tracking System
**IMPORTANT**: The game tracks comprehensive analytics:
- Every user prompt and AI response
- All token usage metrics
- Event timeline (submissions, API calls, errors)
- KPIs and aggregate statistics
- JSON-LD export functionality

### Data Storage
- localStorage for session persistence
- No backend server required
- Export generates `.jsonld` files locally

## Code Conventions

### JavaScript
- Use `const` for immutable values
- camelCase for function and variable names
- Track events with `trackEvent(type, data)`
- Always save state after mutations with `saveGameState()`

### Event Tracking
When adding new features, track relevant events:
```javascript
trackEvent('event_type', {
    key: 'value',
    timestamp: Date.now()
});
```

### JSON-LD Schema
Follow the established vocabulary:
- Use `aoi:` prefix for custom types
- Include `@type`, `@id` for all entities
- Maintain Schema.org compatibility

## Important Files to Preserve
- `game.js` - Contains all game logic and tracking
- `TRACKING.md` - Analytics documentation
- `example-session.jsonld` - Reference export format

## API Configuration
Gemini API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

System instruction template includes:
- Haiku Bot role definition
- 5-7-5 syllable structure requirement
- Blacklist word violation protocol
- Example interactions

## Testing
1. Start server: `python3 -m http.server 8000`
2. Open game in browser
3. Submit prompts to test tracking
4. Click "Export Session Data" to verify JSON-LD output
5. Check browser console for event logs

## Future Enhancements
Consider tracking:
- User session patterns across days
- Successful prompt strategies
- Token efficiency trends
- Word difficulty metrics
