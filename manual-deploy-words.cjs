/**
 * Manual deployment script for daily words
 * This creates today's daily words in Firestore directly
 */

const admin = require('firebase-admin');
const serviceAccount = require('./src/art-of-intent-firebase-adminsdk-1whdc-d407629ecd.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'art-of-intent',
    databaseId: 'alpha'
});

const db = admin.firestore();
db.settings({ databaseId: 'alpha' });

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

async function generateAndStoreDailyWords() {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const seed = parseInt(dateKey.replace(/-/g, ''));
    
    console.log('Generating daily words for:', dateKey);
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
    
    // Store in Firestore
    try {
        const docRef = db.collection('dailyWords').doc(dateKey);
        
        // Check if already exists
        const doc = await docRef.get();
        if (doc.exists) {
            console.log('\n⚠️  Daily words already exist for', dateKey);
            console.log('Existing data:', doc.data());
            return;
        }
        
        await docRef.set({
            date: dateKey,
            seed,
            targetWords,
            blacklistWords,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            version: '1.0',
            wordPoolVersion: '1.0'
        });
        
        console.log('\n✅ Successfully stored daily words in Firestore!');
        
        // Verify
        const verifyDoc = await docRef.get();
        if (verifyDoc.exists) {
            console.log('\n✅ Verified - document exists:');
            console.log(verifyDoc.data());
        }
        
    } catch (error) {
        console.error('\n❌ Error storing daily words:', error);
        throw error;
    }
}

generateAndStoreDailyWords()
    .then(() => {
        console.log('\n✅ Complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Failed:', error);
        process.exit(1);
    });
