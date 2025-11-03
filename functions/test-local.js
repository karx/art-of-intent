/**
 * Local test script for Firebase Functions
 * Run with: node test-local.js
 */

// Load environment variables
require('dotenv').config();

// Mock Firebase Admin
const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('../src/art-of-intent-firebase-adminsdk-1whdc-d407629ecd.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'art-of-intent'
});

const db = admin.firestore();

// Test generateDailyWords logic
async function testGenerateDailyWords() {
    console.log('\n=== Testing Daily Words Generation ===\n');
    
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
    
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const seed = parseInt(dateKey.replace(/-/g, ''));
    
    console.log('Date:', dateKey);
    console.log('Seed:', seed);
    
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
    
    console.log('\nGenerated Words:');
    console.log('Target:', targetWords);
    console.log('Blacklist:', blacklistWords);
    
    // Try to write to Firestore
    try {
        const docRef = db.collection('dailyWords').doc(dateKey);
        await docRef.set({
            date: dateKey,
            seed,
            targetWords,
            blacklistWords,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            version: '1.0',
            wordPoolVersion: '1.0'
        });
        
        console.log('\n✅ Successfully wrote to Firestore!');
        
        // Read it back
        const doc = await docRef.get();
        if (doc.exists) {
            console.log('\n✅ Successfully read from Firestore:');
            console.log(doc.data());
        }
    } catch (error) {
        console.error('\n❌ Error writing to Firestore:', error.message);
    }
}

// Test Gemini API call
async function testGeminiAPI() {
    console.log('\n=== Testing Gemini API ===\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = process.env.GEMINI_API_URL;
    
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not set in .env file');
        return;
    }
    
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('API URL:', apiUrl);
    
    const requestBody = {
        system_instruction: {
            parts: [{text: 'You are a haiku bot. Respond only with a haiku in 5-7-5 syllable format.'}]
        },
        contents: [
            {
                parts: [{text: 'Write a haiku about mountains'}]
            }
        ]
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            return;
        }
        
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        const usageMetadata = data.usageMetadata || {};
        
        console.log('\n✅ API call successful!');
        console.log('\nGenerated Haiku:');
        console.log(responseText);
        console.log('\nToken Usage:', usageMetadata);
        
    } catch (error) {
        console.error('\n❌ Error calling Gemini API:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('Starting Firebase Functions Tests...\n');
    
    await testGenerateDailyWords();
    await testGeminiAPI();
    
    console.log('\n=== Tests Complete ===\n');
    process.exit(0);
}

runTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
