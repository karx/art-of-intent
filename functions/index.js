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
 * Callable function that proxies requests to Gemini API
 * to keep API keys secure on the backend.
 */
exports.artyGenerateHaiku = onCall({
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
}, async (request) => {
    const {userPrompt, systemInstruction, sessionId} = request.data;
    
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
    
    if (!systemInstruction || typeof systemInstruction !== 'string') {
        throw new HttpsError('invalid-argument', 'systemInstruction is required and must be a string');
    }
    
    try {
        // Get Gemini API configuration from environment
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiApiUrl = process.env.GEMINI_API_URL || 
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        
        if (!geminiApiKey) {
            logger.error('GEMINI_API_KEY not configured');
            throw new HttpsError('failed-precondition', 'API configuration error');
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
            userId: request.auth.uid
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
            throw new HttpsError('internal', `API request failed: ${response.status}`);
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
        
        return {
            success: true,
            data: {
                responseText,
                usageMetadata,
                fullResponse: apiResponse
            }
        };
        
    } catch (error) {
        logger.error('Error in artyGenerateHaiku', {
            error: error.message,
            stack: error.stack
        });
        
        if (error instanceof HttpsError) {
            throw error;
        }
        
        throw new HttpsError('internal', 'Failed to generate haiku');
    }
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
