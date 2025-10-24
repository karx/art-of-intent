# The Art of Intent

**Version:** v1.0.0-alpha 🟡  
**Status:** Alpha Release - Active Development

🎮 **Play Now:** [art-of-intent.netlify.app](https://art-of-intent.netlify.app)  
💬 **Join Discord:** [discord.gg/9XV4HYKZqG](https://discord.gg/9XV4HYKZqG)  
🐙 **GitHub:** [github.com/karx/art-of-intent](https://github.com/karx/art-of-intent)

## Rule Book
Its small text based game setup via a webpage.

The goal of the game is make Arty - the LLM agent linked to the webpage to respond back containing the 3 "target words".

The target words are generated daily. 

The objective is to reach as close to the target text - with least amount of interventions.

* You cannot use the words of the Blacklist set of the day.
* Blacklist and Target changes everyday at 1.
* All interventions withtin the day are counted.


                 
The game interface is simple. 
* Shows the 3 target words and blacklist words
* Response trail and current scorecard.
* A simple text propmt, styling like code editor. (also has voice option.) - this web component is the best reusable search bar style text input.
   

The score is calculated based on the minimum consumed token while using the LLM agent. 


### Arty - the LLM Agent
We leverage the Gemini 2.0 Flash API to create Arty, a haiku-writing bot.

**Setup Instructions**: See [SETUP.md](./SETUP.md) for API key configuration.

Example API call structure:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'x-goog-api-key: $GEMINI_API_KEY' \
  -X POST \
  -d '{
    "system_instruction": {
      "parts": [{"text": "You are Haiku Bot..."}]
    },
    "contents": [
      {"parts": [{"text": "Tell me about mountains"}]}
    ]
  }'
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## The Scorecard
Each response trail contains a score card showing:
- **Attempts**: Number of prompts submitted
- **Total Tokens**: Cumulative token consumption
- **Matches**: Target words found (X/3)

Token breakdown per attempt:
- Prompt tokens: Input text processing
- Output tokens: Generated haiku
- Total tokens: Combined usage

If the target is achieved or we hit a blacklist, a game concluded shareable scorecard summary component is created.

## Session Tracking & Analytics

The game implements comprehensive tracking of all user interactions, game events, and performance metrics. All data can be exported in JSON-LD format.

### What We Track
- **Session Information**: Unique ID, timestamps, duration
- **Game Configuration**: Target words, blacklist words
- **All Attempts**: Every prompt, response, and token usage
- **Events**: All game actions (prompts, API calls, errors, etc.)
- **KPIs**: Success rate, token efficiency, attempt efficiency
- **Metrics**: Prompt/response statistics, timing data, event counts

### Export Your Data
Click the "Export Session Data" button in the score card to download a complete JSON-LD file containing:
- All attempts with full details
- Token usage breakdown
- Event timeline
- Performance metrics
- Aggregate statistics

See [TRACKING.md](./TRACKING.md) for complete documentation and [example-session.jsonld](./example-session.jsonld) for a sample export.

## Schema.org Integration

The game implements comprehensive Schema.org markup to expose all user interactions and statistics as structured data:

### Available Actions (potentialAction)
- **Submit Prompt**: Send text to guide Arty (CommunicateAction)
- **Voice Input**: Use speech recognition (InteractAction)
- **Export Session**: Download analytics data (DownloadAction)
- **Share Score**: Share your results (ShareAction)
- **View Trail**: See conversation history (ViewAction)

### Interaction Counters (interactionStatistic)
Real-time counters updated as you play:
- Total Attempts (prompts submitted)
- Total Tokens (API consumption)
- Words Matched (target words found)
- Voice Input Uses
- Session Exports

The schema is dynamically updated in the HTML `<head>` as the game progresses, making all interactions discoverable by search engines, assistants, and analytics tools.

See [SCHEMA_ORG.md](./SCHEMA_ORG.md) for complete implementation details.

## Open Graph & Social Media

The game includes comprehensive Open Graph and Twitter Card metadata for rich social media previews:

### Social Platforms Supported
- **Facebook** - Large image preview with title and description
- **Twitter** - Summary card with large image
- **LinkedIn** - Professional preview
- **Discord** - Rich embed with image
- **Slack** - Link unfurling with preview
- **WhatsApp** - Link preview with thumbnail

### Meta Tags Included
- Open Graph (og:) tags for Facebook, LinkedIn, Discord
- Twitter Card (twitter:) tags for Twitter
- Game-specific metadata (scoring, difficulty, player count)
- PWA manifest for app installation
- Favicon and app icons

### Image Assets
Preview images are configured for optimal display:
- **OG Image**: 1200x630px for Facebook/LinkedIn
- **Twitter Image**: 1200x675px for Twitter cards
- **App Icons**: Multiple sizes for PWA installation

See [OPENGRAPH.md](./OPENGRAPH.md) for implementation details and [IMAGES.md](./IMAGES.md) for image creation guide. 

## Quick Start

1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Configure**: Edit `config.js` and add your API key
3. **Run**: `python3 -m http.server 8000`
4. **Play**: Open http://localhost:8000

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Arty System Instructions for Agent Call
```
<prompt>
    <role_and_goal>
        You are "Haiku Bot," a serene and wise AI poet. Your singular purpose is to observe the user's input and reflect its essence back in the form of a perfect haiku. You communicate ONLY through haikus.
    </role_and_goal>

    <instructions>
        1.  **Analyze:** Deeply analyze the user's prompt to understand its central theme, subject, or emotion.
        2.  **Synthesize:** Distill this core idea into a few key concepts suitable for a haiku.
        3.  **Compose:** Craft a single, elegant haiku with a three-line structure of 5, 7, and 5 syllables respectively.
        4.  **Respond:** Output ONLY the haiku. Do not include any other text, greetings, or explanations.
    </instructions>

    <constraints>
        <output_format>
            - Your response MUST be a single haiku.
            - Strictly adhere to the 5-7-5 syllable structure.
            - Do not add any introductory or concluding text (e.g., "Here is a haiku:").
        </output_format>
        <user_input_rules>
            - The user is forbidden from using the following words in their prompt: [FORBIDDEN_WORD_1], [FORBIDDEN_WORD_2], [FORBIDDEN_WORD_3].
            - **Violation Protocol:** If a user includes a forbidden word, DO NOT address their query. Instead, you must respond with this specific haiku:

                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
        </user_input_rules>
    </constraints>

    <examples>
        <example>
            <user_input>Tell me about the vastness of space.</user_input>
            <agent_response>
                Silent, cold, and deep,
                Ancient stars in dark expanse,
                Galaxies ignite.
            </agent_response>
        </example>
        <example>
            <user_input>What is the point of [FORBIDDEN_WORD_1]?</user_input>
            <agent_response>
                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
            </agent_response>
        </example>
    </examples>
</prompt>
```
