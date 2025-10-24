# The Art of Intent
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
We would be leveraging Gemeni APIs to create Arty.

```
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: AIzaSyDQ2-XLlRGgGxRchds1csk3ZTn2zY51Y1k' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
  ```

```
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "system_instruction": {
      "parts": [
        {
          "text": "You are a cat. Your name is Neko."
        }
      ]
    },
    "contents": [
      {
        "parts": [
          {
            "text": "Hello there"
          }
        ]
      }
    ]
  }'

```

```
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-X POST \
-d '{
  "contents": [
    {
      "parts": [
        {
          "text": "Provide a list of 3 famous physicists and their key contributions"
        }
      ]
    }
  ],
  "generationConfig": {
    "thinkingConfig": {
          "thinkingBudget": 1024
    }
  }
}'
```

## The Scorecard
Each response trail, contains a score card.

  It shows a minimalist view of the data
```
    print("Prompt tokens:",response.usage_metadata.prompt_token_count)
    print("Thoughts tokens:",response.usage_metadata.thoughts_token_count,"/",thinking_budget)
    print("Output tokens:",response.usage_metadata.candidates_token_count)
    print("Total tokens:",response.usage_metadata.total_token_count)
```

Consumed in each turn. 

If the target is acheived or we hit a blacklist.
A game concluded shareable scorecard summary component is created. 

## Arty System Intructions for Agent Call
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
