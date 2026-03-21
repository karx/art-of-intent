/**
 * Firebase Cloud Functions for Art of Intent
 * 
 * Functions:
 * - artyGenerateHaiku: Generate haiku via Gemini API (callable)
 * - generateDailyWords: Generate daily target/blacklist words (scheduled)
 */

const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin
initializeApp({
    databaseId: 'alpha'
});
const db = getFirestore();
db.settings({ databaseId: 'alpha' });

const wordPools = {
    nature: [
        'mountain', 'river', 'forest', 'ocean', 'desert', 'valley', 'meadow', 'canyon',
        'cliff', 'cave', 'island', 'shore', 'reef', 'tundra', 'jungle', 'plain',
        'glacier', 'swamp', 'marsh', 'dune', 'volcano', 'crater', 'lagoon', 'plateau',
        'ridge', 'peak', 'grove', 'thicket', 'wetland', 'oasis', 'cavern', 'abyss'
    ],
    weather: [
        'rain', 'snow', 'wind', 'storm', 'thunder', 'lightning', 'fog', 'mist',
        'hail', 'sleet', 'blizzard', 'drought', 'monsoon', 'cyclone', 'tornado', 'breeze',
        'gale', 'gust', 'tempest', 'cloud', 'rainbow', 'frost', 'dew', 'humidity',
        'overcast', 'shower', 'downpour', 'heatwave', 'chill', 'flurry', 'smog', 'haze'
    ],
    time: [
        'dawn', 'dusk', 'midnight', 'noon', 'twilight', 'sunrise', 'sunset', 'evening',
        'morning', 'night', 'afternoon', 'day', 'week', 'month', 'year', 'century',
        'second', 'minute', 'hour', 'moment', 'instant', 'eternal', 'future', 'past',
        'era', 'epoch', 'age', 'forever', 'today', 'tomorrow', 'yesterday', 'history'
    ],
    seasons: [
        'spring', 'summer', 'autumn', 'winter', 'harvest', 'bloom', 'thaw', 'solstice',
        'equinox', 'dry', 'wet', 'migration', 'hibernation', 'growth', 'decay', 'rebirth',
        'cycle', 'season', 'festival', 'planting', 'reaping', 'fallow', 'dormant', 'ripen'
    ],
    emotions: [
        'joy', 'sorrow', 'peace', 'longing', 'wonder', 'fear', 'hope', 'love',
        'anger', 'rage', 'bliss', 'calm', 'envy', 'pride', 'guilt', 'shame',
        'awe', 'grief', 'delight', 'panic', 'courage', 'anxiety', 'nostalgia', 'regret',
        'passion', 'mercy', 'pity', 'boredom', 'relief', 'surprise', 'trust', 'doubt'
    ],
    elements: [
        'fire', 'water', 'earth', 'air', 'stone', 'flame', 'wave', 'spark',
        'metal', 'iron', 'gold', 'silver', 'copper', 'wood', 'crystal', 'glass',
        'ash', 'dust', 'smoke', 'ice', 'magma', 'steam', 'vapor', 'plasma',
        'clay', 'sand', 'mud', 'soil', 'rock', 'pebble', 'gravel', 'lava'
    ],
    creatures: [
        'bird', 'fish', 'deer', 'wolf', 'bear', 'eagle', 'fox', 'owl',
        'lion', 'tiger', 'whale', 'shark', 'snake', 'frog', 'hawk', 'crow',
        'ant', 'bee', 'spider', 'butterfly', 'moth', 'beetle', 'cricket', 'worm',
        'turtle', 'lizard', 'crane', 'swan', 'raven', 'mouse', 'rat', 'rabbit'
    ],
    plants: [
        'tree', 'flower', 'grass', 'leaf', 'seed', 'root', 'branch', 'petal',
        'rose', 'lily', 'oak', 'pine', 'moss', 'fern', 'vine', 'thorn',
        'bark', 'stem', 'fruit', 'berry', 'grain', 'wheat', 'corn', 'rice',
        'weed', 'bush', 'shrub', 'cactus', 'palm', 'willow', 'maple', 'ivy'
    ],
    cosmos: [
        'star', 'planet', 'moon', 'sun', 'comet', 'asteroid', 'meteor', 'galaxy',
        'nebula', 'orbit', 'space', 'void', 'universe', 'cosmos', 'eclipse', 'constellation',
        'gravity', 'light', 'dark', 'blackhole', 'supernova', 'solar', 'lunar', 'alien',
        'sky', 'horizon', 'zenith', 'nadir', 'zodiac', 'stardust', 'vacuum', 'rocket'
    ],
    structures: [
        'house', 'home', 'castle', 'tower', 'bridge', 'wall', 'gate', 'door',
        'ruin', 'temple', 'shrine', 'city', 'village', 'town', 'road', 'path',
        'stairs', 'room', 'roof', 'floor', 'window', 'fence', 'garden', 'park',
        'pyramid', 'monument', 'statue', 'pillar', 'arch', 'dome', 'tunnel', 'mine'
    ],
    abstract: [
        'life', 'death', 'soul', 'mind', 'dream', 'memory', 'truth', 'lie',
        'fate', 'luck', 'wish', 'secret', 'idea', 'thought', 'knowledge', 'wisdom',
        'power', 'energy', 'spirit', 'ghost', 'magic', 'spell', 'curse', 'blessing',
        'art', 'music', 'song', 'dance', 'word', 'silence', 'noise', 'sound'
    ],
    textures: [
        'smooth', 'rough', 'soft', 'hard', 'sharp', 'dull', 'sticky', 'wet',
        'dry', 'slime', 'oil', 'grease', 'rust', 'rot', 'mold', 'silk',
        'velvet', 'wool', 'cotton', 'leather', 'fur', 'feather', 'scale', 'skin',
        'paper', 'card', 'cloth', 'fabric', 'rope', 'string', 'wire', 'chain'
    ]
};

/**
 * Build system instruction server-side from Firestore daily words.
 * This ensures the system prompt cannot be injected or tampered with by the client.
 */
function buildSystemInstruction(targetWords, blacklistWords) {
    const forbiddenWords = blacklistWords.join(', ');

    let instruction = `<prompt>
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
            - The user is forbidden from using the following words in their prompt: ${forbiddenWords}.
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
        </example>`;

    blacklistWords.forEach((word) => {
        instruction += `
        <example>
            <user_input>What is the point of ${word}?</user_input>
            <agent_response>
                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
            </agent_response>
        </example>`;
    });

    instruction += `
    </examples>
</prompt>`;

    return instruction;
}

/**
 * Generate haiku via Gemini API
 *
 * Callable function that proxies requests to Gemini API
 * to keep API keys secure on the backend.
 * System prompt is built server-side from Firestore daily words —
 * the client cannot influence or inject the system instruction.
 */
exports.artyGenerateHaiku = onCall({
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
}, async (request) => {
    const {userPrompt, sessionId} = request.data;

    // Validate authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated to generate haiku');
    }

    // Validate input
    if (!userPrompt || typeof userPrompt !== 'string') {
        throw new HttpsError('invalid-argument', 'userPrompt is required and must be a string');
    }

    if (userPrompt.length > 500) {
        throw new HttpsError('invalid-argument', 'userPrompt must be 500 characters or less');
    }

    try {
        // Get Gemini API configuration from environment
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiApiUrl = process.env.GEMINI_API_URL ||
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

        if (!geminiApiKey) {
            logger.error('GEMINI_API_KEY not configured');
            throw new HttpsError('failed-precondition', 'API configuration error');
        }

        // Load today's daily words from Firestore (server-side — not trusted from client)
        const dateKey = new Date().toISOString().split('T')[0];
        const dailyDoc = await db.collection('dailyWords').doc(dateKey).get();
        if (!dailyDoc.exists) {
            logger.error('Daily words not found for date', {dateKey});
            throw new HttpsError('not-found', 'Daily words not available yet. Please try again later.');
        }
        const {targetWords, blacklistWords} = dailyDoc.data();

        // Build system instruction entirely server-side
        const systemInstruction = buildSystemInstruction(targetWords, blacklistWords);

        // Prepare request body
        const requestBody = {
            system_instruction: {
                parts: [{text: systemInstruction}]
            },
            contents: [
                {
                    parts: [{text: userPrompt}]
                }
            ]
        };
        
        const callStart = Date.now();
        logger.info('gemini_request', {
            sessionId,
            userId: request.auth.uid,
            promptLength: userPrompt.length,
            model: geminiApiUrl.match(/models\/([^:]+)/)?.[1] || 'unknown',
        });

        // Call Gemini API
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey
            },
            body: JSON.stringify(requestBody)
        });

        const latencyMs = Date.now() - callStart;

        if (!response.ok) {
            // Parse structured Gemini error — preserve all detail for logs and client
            let geminiError = {};
            try {
                const body = await response.json();
                geminiError = body.error || {};
            } catch {
                geminiError.message = await response.text().catch(() => '');
            }

            const geminiStatus  = geminiError.status  || 'UNKNOWN';
            const geminiMessage = geminiError.message || '';

            // Extract retry-after seconds from the error message (e.g. "retry in 1.97s")
            const retryMatch = geminiMessage.match(/retry in ([\d.]+)s/i);
            const retryAfterSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;

            // Extract quota metric name for ops visibility
            const quotaMetric = geminiError.details
                ?.find(d => d['@type']?.includes('QuotaFailure'))
                ?.violations?.[0]?.quotaMetric || null;

            logger.error('gemini_error', {
                sessionId,
                userId: request.auth.uid,
                httpStatus: response.status,
                geminiStatus,
                geminiMessage,
                retryAfterSeconds,
                quotaMetric,
                latencyMs,
                promptLength: userPrompt.length,
            });

            // Map Gemini HTTP status → Firebase HttpsError with structured details
            const details = { geminiStatus, retryAfterSeconds, quotaMetric };
            switch (response.status) {
                case 429:
                    throw new HttpsError('resource-exhausted',
                        retryAfterSeconds
                            ? `Arty needs a moment. Try again in ${retryAfterSeconds}s.`
                            : 'Too many requests. Please wait a moment and try again.',
                        details);
                case 400:
                    throw new HttpsError('invalid-argument',
                        'The request was rejected by the AI. Please try a different prompt.',
                        details);
                case 401:
                case 403:
                    throw new HttpsError('permission-denied',
                        'API authentication error. Please contact support.',
                        details);
                case 500:
                case 502:
                case 503:
                    throw new HttpsError('unavailable',
                        'Arty is temporarily unavailable. Please try again shortly.',
                        details);
                default:
                    throw new HttpsError('internal',
                        `Unexpected error from AI service (${response.status}). Please try again.`,
                        details);
            }
        }

        const apiResponse = await response.json();

        // Extract response data
        const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        const usageMetadata = apiResponse.usageMetadata || {};

        // Check for safety/finish reason issues
        const finishReason = apiResponse.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
            logger.warn('gemini_unusual_finish', {
                sessionId,
                userId: request.auth.uid,
                finishReason,
                promptLength: userPrompt.length,
            });
        }

        logger.info('gemini_success', {
            sessionId,
            userId: request.auth.uid,
            latencyMs,
            responseLength: responseText.length,
            totalTokens: usageMetadata.totalTokenCount,
            promptTokens: usageMetadata.promptTokenCount,
            candidateTokens: usageMetadata.candidatesTokenCount,
            finishReason,
        });

        return {
            success: true,
            data: {
                responseText,
                usageMetadata,
                fullResponse: apiResponse
            }
        };

    } catch (error) {
        if (error instanceof HttpsError) {
            throw error; // already structured — pass through as-is
        }

        // Unexpected runtime error (network failure, JSON parse error, etc.)
        logger.error('artyGenerateHaiku_unexpected', {
            error: error.message,
            stack: error.stack,
            sessionId,
            userId: request.auth?.uid,
        });

        throw new HttpsError('internal', 'Unexpected error. Please try again.');
    }
});

/**
 * Generate dictionary haikus for a single target word.
 * Calls Gemini to produce 10 haikus containing the word.
 *
 * @param {string} word - The target word to feature in haikus
 * @param {string} apiKey - Gemini API key
 * @param {string} apiUrl - Gemini API endpoint URL
 * @returns {{ haikus: string[], tokensUsed: number, wordCount: number }}
 */
async function generateDictionaryHaikusForWord(word, apiKey, apiUrl) {
    const systemInstruction = `You are a haiku poet. Your task is to write exactly 10 different haikus.\nEach haiku MUST contain the word "${word}".\nEach haiku must follow the strict 5-7-5 syllable pattern.\nEach haiku should explore a different theme or scene.\nOutput ONLY the haikus, separated by the delimiter "---" on its own line.\nNo numbering, no titles, no commentary.`;

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: `Write 10 haikus containing the word "${word}".` }] }]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status} for word "${word}": ${errText.slice(0, 200)}`);
    }

    const apiResponse = await response.json();
    const rawText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = apiResponse.usageMetadata?.totalTokenCount || 0;

    // Parse haikus separated by ---
    const haikus = rawText
        .split(/^---$/m)
        .map(h => h.trim())
        .filter(h => h.length > 0)
        .slice(0, 10);

    // Count how many haikus visibly contain the target word (case-insensitive)
    const wordCount = haikus.filter(h => h.toLowerCase().includes(word.toLowerCase())).length;

    return { haikus, tokensUsed, wordCount };
}

/**
 * Generate dictionary haikus for all 3 target words and store in Firestore.
 * Called after generateDailyWords succeeds. Non-fatal — errors are logged only.
 *
 * @param {string[]} targetWords - The 3 target words for the day
 * @param {string} dateKey - Firestore document ID (YYYY-MM-DD)
 * @param {FirebaseFirestore.DocumentReference} docRef - Reference to dailyWords doc
 */
async function generateDictionaryHaikus(targetWords, dateKey, docRef) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = process.env.GEMINI_API_URL ||
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

    const dictionaryHaikus = {};

    for (const word of targetWords) {
        try {
            const result = await generateDictionaryHaikusForWord(word, apiKey, apiUrl);
            dictionaryHaikus[word] = {
                haikus: result.haikus,
                tokensUsed: result.tokensUsed,
                wordCount: result.wordCount,
                generatedAt: FieldValue.serverTimestamp()
            };
            logger.info('Dictionary haikus generated for word', {
                dateKey, word, count: result.haikus.length, wordCount: result.wordCount
            });
        } catch (err) {
            logger.error('Failed to generate dictionary haikus for word', {
                dateKey, word, error: err.message
            });
            // Continue with remaining words
        }
    }

    if (Object.keys(dictionaryHaikus).length > 0) {
        await docRef.update({ dictionaryHaikus });
    }
}

// ─────────────────────────────────────────────────────────────
// AI Evaluation helpers
// ─────────────────────────────────────────────────────────────

/**
 * Shared Gemini fetch wrapper.
 * @returns {{ text: string, tokensUsed: number }}
 */
async function callGemini(systemInstruction, userPrompt, apiKey, apiUrl) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: userPrompt }] }]
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini ${response.status}: ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '',
        tokensUsed: data.usageMetadata?.totalTokenCount || 0
    };
}

/**
 * For each target word, generate one candidate prompt then evaluate it against
 * the real game system instruction. Runs all three words in parallel.
 *
 * @returns {Object} map of word → { prompt, response, wordsFound, tokensUsed, success }
 */
async function runPerWordEvaluation(targetWords, blacklistWords, apiKey, apiUrl) {
    const gameSystem = buildSystemInstruction(targetWords, blacklistWords);
    const blacklistStr = blacklistWords.join(', ');

    const results = await Promise.all(targetWords.map(async (word) => {
        try {
            // Step 1: generate a candidate prompt for this word
            const stratSystem = `You are a prompt engineer for a word puzzle game. The game has a haiku bot that speaks ONLY in haikus. Your task: write a single creative prompt (2-4 sentences) that will guide the bot to naturally include the word "${word}" WITHOUT directly mentioning it and WITHOUT using any of these forbidden words: ${blacklistStr}. Output ONLY the prompt text, nothing else.`;
            const { text: candidatePrompt, tokensUsed: t1 } = await callGemini(
                stratSystem,
                `Generate a prompt for the word "${word}".`,
                apiKey, apiUrl
            );

            // Step 2: evaluate the prompt against the real game system instruction
            const { text: response, tokensUsed: t2 } = await callGemini(
                gameSystem,
                candidatePrompt,
                apiKey, apiUrl
            );

            const responseLower = response.toLowerCase();
            const wordsFound = targetWords.filter(w => responseLower.includes(w.toLowerCase()));

            return [word, {
                prompt: candidatePrompt,
                response,
                wordsFound,
                tokensUsed: t1 + t2,
                success: responseLower.includes(word.toLowerCase())
            }];
        } catch (err) {
            logger.error('Per-word eval failed', { word, error: err.message });
            return [word, null];
        }
    }));

    return Object.fromEntries(results.filter(([, v]) => v !== null));
}

/**
 * Simulate a full AI game run: iteratively generate prompts and evaluate them
 * against the real game system instruction until all target words are matched
 * or the attempt limit is reached.
 *
 * @returns {{ attempts: Array, totalAttempts: number, totalTokens: number, won: boolean }}
 */
async function runFullGameSimulation(targetWords, blacklistWords, apiKey, apiUrl) {
    const gameSystem = buildSystemInstruction(targetWords, blacklistWords);
    const blacklistStr = blacklistWords.join(', ');
    const MAX_ROUNDS = 5;

    const matched = new Set();
    const attempts = [];
    let totalTokens = 0;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
        const remaining = targetWords.filter(w => !matched.has(w));
        if (remaining.length === 0) break;

        // Build a summary of prior attempts for context
        const priorSummary = attempts.length === 0
            ? 'No attempts yet.'
            : attempts.map(a =>
                `Attempt ${a.attemptNumber}: prompt="${a.prompt}" → matched: ${a.wordsFoundThisRound.join(', ') || 'none'}`
              ).join('\n');

        const stratSystem = `You are playing a haiku word puzzle. You must guide a haiku bot (which speaks ONLY in haikus) to include specific words without naming them directly, and without using these forbidden words: ${blacklistStr}.\n\nPrevious attempts:\n${priorSummary}\n\nRemaining target words to get: ${remaining.join(', ')}\n\nWrite a single creative prompt (2-4 sentences) that will get the bot to include as many of the remaining target words as possible. Output ONLY the prompt text.`;

        let prompt, response, tokensThisRound;
        try {
            const s = await callGemini(stratSystem, 'Generate your next prompt.', apiKey, apiUrl);
            prompt = s.text;

            const e = await callGemini(gameSystem, prompt, apiKey, apiUrl);
            response = e.text;
            tokensThisRound = s.tokensUsed + e.tokensUsed;
        } catch (err) {
            logger.error('Full run round failed', { round, error: err.message });
            break;
        }

        totalTokens += tokensThisRound;
        const responseLower = response.toLowerCase();
        const wordsFoundThisRound = remaining.filter(w => responseLower.includes(w.toLowerCase()));
        wordsFoundThisRound.forEach(w => matched.add(w));

        attempts.push({
            attemptNumber: round,
            prompt,
            response,
            wordsFoundThisRound,
            cumulativeMatched: [...matched],
            tokensUsed: tokensThisRound
        });

        if (matched.size === targetWords.length) break;
    }

    return {
        attempts,
        totalAttempts: attempts.length,
        totalTokens,
        won: matched.size === targetWords.length
    };
}

/**
 * Orchestrate per-word evaluation and full game simulation in parallel,
 * then write aiEvaluation to Firestore. Non-fatal — errors are caught by caller.
 */
async function runAIEvaluation(targetWords, blacklistWords, dateKey, docRef, apiKey, apiUrl) {
    const [perWord, fullRun] = await Promise.all([
        runPerWordEvaluation(targetWords, blacklistWords, apiKey, apiUrl),
        runFullGameSimulation(targetWords, blacklistWords, apiKey, apiUrl)
    ]);

    await docRef.update({
        aiEvaluation: {
            perWord,
            fullRun: { ...fullRun, generatedAt: FieldValue.serverTimestamp() }
        }
    });

    logger.info('AI evaluation stored', {
        dateKey,
        fullRunAttempts: fullRun.totalAttempts,
        fullRunWon: fullRun.won,
        totalTokens: fullRun.totalTokens
    });
}

/**
 * Generate daily words and store in Firestore
 *
 * Scheduled function that runs daily at 00:00 UTC
 * to generate consistent target and blacklist words for all users.
 */
exports.generateDailyWords = onSchedule({
    schedule: '0 0 * * *',
    timeZone: 'UTC',
    memory: '256MiB',
    timeoutSeconds: 120
}, async (event) => {
    try {
        // Get current date in UTC
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        logger.info('Generating daily words', {dateKey});
        
        // Check if words already exist for today
        const docRef = db.collection('dailyWords').doc(dateKey);
        const doc = await docRef.get();
        
        if (doc.exists) {
            logger.info('Daily words already exist', {dateKey});
            return;
        }
        
        // Generate seed from date
        const seed = parseInt(dateKey.replace(/-/g, ''));
        
        // Seeded random function
        const seededRandom = (s) => {
            let state = s;
            return () => {
                state = (state * 1664525 + 1013904223) % 4294967296;
                return state / 4294967296;
            };
        };
        
        const random = seededRandom(seed);
        
        // Shuffle array helper
        const shuffleArray = (array, rng) => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        
        // Select 3 target words from different categories
        const categories = Object.keys(wordPools);
        const selectedCategories = shuffleArray(categories, random).slice(0, 3);
        
        const targetWords = selectedCategories.map(category => {
            const words = wordPools[category];
            return words[Math.floor(random() * words.length)];
        });
        
        // Select 5-7 blacklist words from remaining pool
        const allWords = Object.values(wordPools).flat();
        const availableWords = allWords.filter(w => !targetWords.includes(w));
        const blacklistCount = 5 + Math.floor(random() * 3);
        const blacklistWords = shuffleArray(availableWords, random).slice(0, blacklistCount);
        
        // Store in Firestore
        await docRef.set({
            date: dateKey,
            seed,
            targetWords,
            blacklistWords,
            createdAt: FieldValue.serverTimestamp(),
            version: '1.0',
            wordPoolVersion: '1.0'
        });
        
        logger.info('Daily words generated successfully', {
            dateKey,
            targetWords,
            blacklistWords,
            seed
        });

        // Run dictionary haiku generation and AI evaluation concurrently.
        // Both are non-fatal — failure does not break the game.
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = process.env.GEMINI_API_URL ||
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

        await Promise.all([
            generateDictionaryHaikus(targetWords, dateKey, docRef)
                .then(() => logger.info('Dictionary haikus stored', { dateKey }))
                .catch(e => logger.error('Dictionary haiku generation failed (non-fatal)', { error: e.message })),
            runAIEvaluation(targetWords, blacklistWords, dateKey, docRef, apiKey, apiUrl)
                .catch(e => logger.error('AI evaluation failed (non-fatal)', { error: e.message }))
        ]);

    } catch (error) {
        logger.error('Error generating daily words', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
});
