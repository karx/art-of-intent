# Session Tracking & Analytics

## Overview

The Art of Intent game implements comprehensive session tracking with JSON-LD export capabilities. All user interactions, game events, and performance metrics are captured and can be exported in a structured, semantic format.

## What We Track

### Session Information
- **Session ID**: Unique identifier for each daily session
- **Start Time**: ISO 8601 timestamp when session begins
- **End Time**: ISO 8601 timestamp when session completes
- **Duration**: Total session length in seconds
- **Game Date**: The calendar date for the challenge

### Game Configuration
- **Target Words**: The 3 words the player must guide Arty to say
- **Blacklist Words**: The 5-7 forbidden words
- **Word Counts**: Number of target and blacklist words

### Attempts (Response Trail)
Each attempt captures:
- **Attempt Number**: Sequential attempt counter
- **Timestamp**: When the attempt was made
- **User Prompt**: The text input from the player
  - Text content
  - Character length
  - Word count
- **AI Response**: Arty's haiku response
  - Text content
  - Character length
  - Word count
- **Token Usage**:
  - Prompt tokens consumed
  - Output tokens generated
  - Total tokens for the attempt
- **Word Matching**:
  - Words found in this response
  - New words discovered
  - Cumulative matches
  - Violation status
  - Violated words (if any)

### Events
All game events are tracked with timestamps:
- `session_start` - New daily session begins
- `session_resume` - Returning to existing session
- `prompt_submitted` - User submits a prompt
- `blacklist_violation_detected` - User used forbidden word
- `api_response_received` - Gemini API responds
- `api_error` - API call fails
- `response_processed` - Response analyzed and stored
- `voice_input_started` - Voice recording begins
- `voice_input_completed` - Voice transcription succeeds
- `voice_input_error` - Voice recognition fails
- `game_over` - Session ends (victory or defeat)
- `session_exported` - Data exported to JSON-LD

## Key Performance Indicators (KPIs)

### Success Rate
- **Value**: Percentage of target words matched (0-1)
- **Unit**: percentage
- **Description**: Measures how close the player got to winning

### Token Efficiency
- **Value**: Average tokens per attempt
- **Unit**: tokens_per_attempt
- **Description**: Lower is better - measures prompt efficiency

### Attempt Efficiency
- **Value**: Average attempts per matched word
- **Unit**: attempts_per_word
- **Description**: How many tries needed per successful word

### Completion Score
- **Value**: Overall efficiency score (attempts × 10 + tokens ÷ 10)
- **Unit**: score
- **Description**: Lower is better - only calculated on victory

## Metrics

### Prompt Metrics
- Average, min, max prompt length
- Total number of prompts

### Response Metrics
- Average, min, max response length
- Total number of responses

### Token Metrics
- Total tokens consumed
- Average, min, max per attempt
- Breakdown: prompt tokens vs output tokens

### Timing Metrics
- Total session duration
- Average time between attempts

### Event Metrics
- Total events logged
- Event type distribution
- API call count
- Error count

## JSON-LD Export Format

The export follows JSON-LD (JSON for Linking Data) format with Schema.org vocabulary plus custom Art of Intent extensions.

### Schema Structure

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aoi": "https://artofintent.game/schema#",
    "Event": "https://schema.org/Event",
    "GameSession": "aoi:GameSession",
    "Attempt": "aoi:Attempt",
    "KPI": "aoi:KPI",
    "Metric": "aoi:Metric"
  },
  "@type": "GameSession",
  "@id": "urn:session:{sessionId}",
  "identifier": "session_...",
  "name": "Art of Intent - Haiku Challenge",
  "startTime": "2025-01-24T10:30:00.000Z",
  "endTime": "2025-01-24T10:45:00.000Z",
  "duration": "PT900S",
  "gameConfiguration": { ... },
  "gameOutcome": { ... },
  "kpis": { ... },
  "metrics": { ... },
  "attempts": [ ... ],
  "events": [ ... ],
  "aggregateStatistics": { ... }
}
```

### Custom Vocabulary

**aoi:GameSession** - A complete game session
**aoi:GameConfiguration** - Target and blacklist word setup
**aoi:GameOutcome** - Win/loss status and reason
**aoi:Attempt** - A single prompt-response interaction
**aoi:UserPrompt** - Player's input text
**aoi:AIResponse** - Arty's haiku response
**aoi:TokenUsage** - LLM token consumption
**aoi:WordMatching** - Target word detection results
**aoi:KPI** - Key performance indicator
**aoi:Metric** - Measurement data
**aoi:AggregateStatistics** - Summary statistics

## How to Export

1. Play the game (make at least one attempt)
2. Click the "Export Session Data" button in the score card
3. A `.jsonld` file will download with format:
   `art-of-intent-session-{sessionId}-{date}.jsonld`

## Use Cases

### Analytics
- Track player behavior patterns
- Identify successful prompt strategies
- Measure token efficiency trends
- Analyze time-to-completion

### Research
- Study human-AI interaction patterns
- Analyze prompt engineering effectiveness
- Measure learning curves
- Compare strategies across players

### Leaderboards
- Rank by efficiency score
- Compare token usage
- Track attempt counts
- Measure success rates

### Machine Learning
- Train models on successful prompts
- Predict optimal strategies
- Classify prompt effectiveness
- Generate insights

## Privacy

All data is stored locally in the browser's localStorage. No data is sent to external servers except:
- Prompts sent to Gemini API for generating responses
- Export files are downloaded locally to your device

## Data Persistence

- Session data persists for the current day
- At midnight (local time), a new session begins
- Previous day's data can be exported before it resets
- Export your data daily to maintain a complete history

## Example Export

See `example-session.jsonld` for a complete example of exported session data.
