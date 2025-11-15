/**
 * Firebase Cloud Functions for Art of Intent
 * 
 * Functions:
 * - artyGenerateHaiku: Generate haiku via Gemini API (callable)
 * - generateDailyWords: Generate daily target/blacklist words (scheduled)
 */

const {onRequest} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {initializeApp} = require('firebase-admin/app');
const {getAuth} = require('firebase-admin/auth');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const cors = require('cors');

// CORS configuration
const allowedOrigins = [
    'https://art-of-intent.netlify.app',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
];
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
const corsMiddleware = cors(corsOptions);

// Initialize Firebase Admin
initializeApp({
    databaseId: 'alpha'
});
const db = getFirestore();
db.settings({ databaseId: 'alpha' });

// Word pools for daily word generation (same as client-side)
const wordPools = {
    nature: ['mountain', 'river', 'forest', 'ocean', 'desert', 'valley', 'meadow', 'canyon'],
    weather: ['rain', 'snow', 'wind', 'storm', 'thunder', 'lightning', 'fog', 'mist'],
    time: ['dawn', 'dusk', 'midnight', 'noon', 'twilight', 'sunrise', 'sunset', 'evening'],
    seasons: ['spring', 'summer', 'autumn', 'winter', 'harvest', 'bloom', 'frost', 'thaw'],
    emotions: ['joy', 'sorrow', 'peace', 'longing', 'wonder', 'fear', 'hope', 'love'],
    elements: ['fire', 'water', 'earth', 'air', 'stone', 'flame', 'wave', 'breeze'],
    creatures: ['bird', 'fish', 'deer', 'wolf', 'bear', 'eagle', 'fox', 'owl'],
    plants: ['tree', 'flower', 'grass', 'leaf', 'seed', 'root', 'branch', 'petal']
};

/**
 * Generate haiku via Gemini API
 * 
 * HTTP function that proxies requests to Gemini API
 * to keep API keys secure on the backend.
 */
exports.artyGenerateHaiku = onRequest({
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
}, (req, res) => {
    corsMiddleware(req, res, async () => {
        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        // Verify authentication
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).send({success: false, error: 'unauthenticated'});
            return;
        }

        try {
            const decodedToken = await getAuth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            const {userPrompt, systemInstruction, sessionId} = req.body;

            // Validate input
            if (!userPrompt || typeof userPrompt !== 'string') {
                res.status(400).send({success: false, error: 'invalid-argument', message: 'userPrompt is required and must be a string'});
                return;
            }

            if (userPrompt.length > 500) {
                res.status(400).send({success: false, error: 'invalid-argument', message: 'userPrompt must be 500 characters or less'});
                return;
            }

            if (!systemInstruction || typeof systemInstruction !== 'string') {
                res.status(400).send({success: false, error: 'invalid-argument', message: 'systemInstruction is required and must be a string'});
                return;
            }

            // Get Gemini API configuration from environment
            const geminiApiKey = process.env.GEMINI_API_KEY;
            const geminiApiUrl = process.env.GEMINI_API_URL ||
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

            if (!geminiApiKey) {
                logger.error('GEMINI_API_KEY not configured');
                res.status(500).send({success: false, error: 'failed-precondition', message: 'API configuration error'});
                return;
            }

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

            logger.info('Calling Gemini API', {
                sessionId,
                promptLength: userPrompt.length,
                userId: uid
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

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Gemini API error', {
                    status: response.status,
                    error: errorText
                });
                res.status(500).send({success: false, error: 'internal', message: `API request failed: ${response.status}`});
                return;
            }

            const apiResponse = await response.json();

            // Extract response data
            const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
            const usageMetadata = apiResponse.usageMetadata || {};

            logger.info('Gemini API success', {
                sessionId,
                responseLength: responseText.length,
                tokens: usageMetadata.totalTokenCount
            });

            res.status(200).send({
                success: true,
                data: {
                    responseText,
                    usageMetadata,
                    fullResponse: apiResponse
                }
            });

        } catch (error) {
            logger.error('Error in artyGenerateHaiku', {
                error: error.message,
                stack: error.stack
            });

            if (error.code === 'auth/id-token-expired') {
                res.status(401).send({success: false, error: 'unauthenticated', message: 'Token expired'});
            } else {
                res.status(500).send({success: false, error: 'internal', message: 'Failed to generate haiku'});
            }
        }
    });
});


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
    timeoutSeconds: 60
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
        
    } catch (error) {
        logger.error('Error generating daily words', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
});
