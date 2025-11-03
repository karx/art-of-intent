// ============================================
// ASCII Chart Utilities
// ============================================

// Import analytics
import { GameAnalytics, UserAnalytics } from './analytics.js';

// Import Firebase Functions
import { functions, httpsCallable, db, collection, doc, getDoc } from './firebase-config.js';

// Track if last input was via voice
let lastInputWasVoice = false;

// System prompt token overhead (approximate, measured from API)
// This is subtracted from promptTokens to show only user's contribution
const SYSTEM_PROMPT_TOKENS = 915;

// Text-to-Speech function
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Text-to-speech not supported');
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get voice settings from theme manager if available
    if (window.themeManager) {
        const settings = window.themeManager.getVoiceSettings();
        if (settings.voice) {
            utterance.voice = settings.voice;
        }
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
    } else {
        // Fallback to contemplative defaults
        utterance.rate = 0.7;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
    }
    
    window.speechSynthesis.speak(utterance);
}

function generateProgressBar(value, max, width = 10) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function generateTrailStats(stats, foundWords = []) {
    const { promptTokens = 0, outputTokens = 0, totalTokens = 0 } = stats;
    
    // Calculate bar widths (max 200 tokens = 100% width)
    const maxDisplay = 200;
    const promptPct = Math.min((promptTokens / maxDisplay) * 100, 100);
    const outputPct = Math.min((outputTokens / maxDisplay) * 100, 100);
    
    // Generate hit indicators
    const hitIndicators = foundWords.length > 0 
        ? foundWords.map(word => `<span class="hit-dot" title="${word}">●</span>`).join('')
        : '';
    
    return `
        <div class="trail-stats-compact">
            <div class="stats-bar">
                <div class="stats-bar-segment stats-bar-prompt" style="width: ${promptPct}%" title="Prompt: ${promptTokens} tokens"></div>
                <div class="stats-bar-segment stats-bar-output" style="width: ${outputPct}%" title="Output: ${outputTokens} tokens"></div>
            </div>
            <div class="stats-info">
                <span class="stats-tokens">${totalTokens} tok</span>
                ${hitIndicators ? `<span class="stats-hits">${hitIndicators}</span>` : ''}
            </div>
        </div>
    `;
}

function updateLiveStats() {
    const liveStatsSection = document.getElementById('liveStats');
    const liveStatsContent = liveStatsSection.querySelector('.live-stats-content');
    
    if (gameState.attempts === 0) {
        liveStatsSection.classList.add('hidden');
        return;
    }
    
    liveStatsSection.classList.remove('hidden');
    
    const matchedCount = gameState.matchedWords.size;
    const avgPerAttempt = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : 0;
    const projectedTotal = gameState.attempts > 0 ? Math.round((gameState.totalTokens / gameState.attempts) * 10) : 0;
    const completionPct = Math.round((matchedCount / gameState.targetWords.length) * 100);
    
    // Efficiency rating
    let efficiencyRating = 'NEEDS WORK';
    let efficiencyColor = 'error';
    let efficiencySymbol = '☆☆☆';
    
    if (avgPerAttempt < 40) {
        efficiencyRating = 'EXCELLENT';
        efficiencyColor = 'success';
        efficiencySymbol = '★★★';
    } else if (avgPerAttempt < 50) {
        efficiencyRating = 'GOOD';
        efficiencyColor = 'info';
        efficiencySymbol = '★★☆';
    } else if (avgPerAttempt < 60) {
        efficiencyRating = 'AVERAGE';
        efficiencyColor = 'warning';
        efficiencySymbol = '★☆☆';
    }
    
    const attemptsBar = generateProgressBar(gameState.attempts, 10, 10);
    const tokensBar = generateProgressBar(gameState.totalTokens, projectedTotal, 10);
    const matchesBar = generateProgressBar(matchedCount, gameState.targetWords.length, 3);
    
    liveStatsContent.innerHTML = `
        <div class="live-stat">
            <span class="live-label">Current Attempt:</span>
            <span class="live-value">${gameState.attempts}/10</span>
        </div>
        <div class="live-stat">
            <span class="live-label">Session Tokens:</span>
            <span class="live-value">${gameState.totalTokens} [${tokensBar}] (pace: ${projectedTotal})</span>
        </div>
        <div class="live-stat">
            <span class="live-label">Avg per Attempt:</span>
            <span class="live-value text-${efficiencyColor}">${avgPerAttempt} ${efficiencySymbol} (${efficiencyRating})</span>
        </div>
        <div class="live-stat">
            <span class="live-label">Matches Found:</span>
            <span class="live-value">${matchedCount}/${gameState.targetWords.length} [${matchesBar}] (${completionPct}% complete)</span>
        </div>
    `;
}

// ============================================
// Game State
// ============================================

const gameState = {
    targetWords: [],
    blacklistWords: [],
    attempts: 0,
    totalTokens: 0,
    matchedWords: new Set(),
    responseTrail: [],
    gameOver: false,
    currentDate: null,
    sessionId: null,
    sessionStartTime: null,
    sessionEndTime: null,
    events: [],
    creepLevel: 0,              // NEW: Darkness/creep level (0-100)
    creepThreshold: 100,        // NEW: Game ends when creep reaches this
    creepPerViolation: 25       // NEW: Creep added per blacklist word
};

// Word pools for daily generation
const wordPools = {
    nature: ['mountain', 'river', 'forest', 'ocean', 'wind', 'rain', 'snow', 'cloud', 'moon', 'star', 'flower', 'tree', 'leaf', 'stone', 'wave'],
    emotions: ['joy', 'peace', 'sorrow', 'hope', 'fear', 'love', 'calm', 'wonder', 'dream', 'silence', 'light', 'shadow', 'warmth', 'cold', 'gentle'],
    time: ['dawn', 'dusk', 'night', 'day', 'spring', 'summer', 'autumn', 'winter', 'moment', 'eternal', 'fleeting', 'ancient', 'new', 'old', 'season'],
    actions: ['whisper', 'dance', 'flow', 'bloom', 'fade', 'rise', 'fall', 'drift', 'soar', 'rest', 'wake', 'sleep', 'breathe', 'sing', 'echo']
};

// Configuration - loaded from config.js
// API key should be set in config.js or via backend proxy
const getConfig = () => window.CONFIG || {
    GEMINI_API_KEY: 'REPLACE_WITH_YOUR_API_KEY',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
};

// Initialize game on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame();
    setupEventListeners();
    updateSchemaMetadata();
    checkFirstTimeUser();
});

function getDailyDateKey() {
    // Use UTC date for consistency across timezones
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function initializeGame() {
    const today = getDailyDateKey();
    
    // Check if we need to generate new words for today
    const savedDate = localStorage.getItem('gameDate');
    
    console.log('📅 Daily Words Check:', {
        today,
        savedDate,
        needsNewWords: savedDate !== today
    });
    
    if (savedDate !== today) {
        console.log('🔄 Loading new words for', today);
        await loadDailyWords();
        resetGameState();
        localStorage.setItem('gameDate', today);
        trackEvent('session_start', { reason: 'new_day', date: today });
        GameAnalytics.gameStart(today);
    } else {
        loadSavedGame();
        trackEvent('session_resume', { 
            attempts: gameState.attempts,
            matchedWords: gameState.matchedWords.size,
            date: today
        });
    }
    
    // Validate words are available
    await ensureWordsAvailable();
    
    updateUI();
    
    // Check if game is already over and morph input to share buttons
    if (gameState.gameOver) {
        morphInputToShare();
    }
}

async function ensureWordsAvailable() {
    // Fallback: regenerate if words are missing
    if (gameState.targetWords.length === 0 || gameState.blacklistWords.length === 0) {
        console.warn('⚠️ Words missing, loading...');
        await loadDailyWords();
    }
    
    // Validate word counts
    if (gameState.targetWords.length !== 3) {
        console.error('❌ Invalid target count:', gameState.targetWords.length);
        await loadDailyWords();
    }
    
    if (gameState.blacklistWords.length < 5 || gameState.blacklistWords.length > 7) {
        console.error('❌ Invalid blacklist count:', gameState.blacklistWords.length);
        await loadDailyWords();
    }
    
    console.log('✅ Words validated:', {
        target: gameState.targetWords,
        blacklist: gameState.blacklistWords
    });
}

async function loadDailyWords() {
    const dateKey = getDailyDateKey();
    
    try {
        // Try to load from Firestore first
        const docRef = doc(db, 'dailyWords', dateKey);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            gameState.targetWords = data.targetWords;
            gameState.blacklistWords = data.blacklistWords;
            
            console.log('✅ Loaded daily words from Firestore:', {
                target: gameState.targetWords,
                blacklist: gameState.blacklistWords,
                date: dateKey
            });
            
            // Save to localStorage for offline access
            localStorage.setItem('targetWords', JSON.stringify(gameState.targetWords));
            localStorage.setItem('blacklistWords', JSON.stringify(gameState.blacklistWords));
            localStorage.setItem('wordsDate', dateKey);
            
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Could not load words from Firestore:', error);
    }
    
    // Fallback to client-side generation
    console.log('⚠️ Using client-side word generation (fallback)');
    generateDailyWords();
    return false;
}

function generateDailyWords() {
    // Use UTC date as seed for consistent daily words worldwide
    const seed = getDailyDateKey();
    const random = seededRandom(seed);
    
    console.log('🎲 Generating words with seed:', seed);
    
    // Select 3 target words from different categories
    const categories = Object.keys(wordPools);
    const selectedCategories = shuffleArray([...categories], random).slice(0, 3);
    
    gameState.targetWords = selectedCategories.map(category => {
        const words = wordPools[category];
        return words[Math.floor(random() * words.length)];
    });
    
    // Select 5-7 blacklist words from remaining pool
    const allWords = Object.values(wordPools).flat();
    const availableWords = allWords.filter(w => !gameState.targetWords.includes(w));
    const blacklistCount = 5 + Math.floor(random() * 3);
    gameState.blacklistWords = shuffleArray([...availableWords], random).slice(0, blacklistCount);
    
    console.log('✅ Generated words:', {
        target: gameState.targetWords,
        blacklist: gameState.blacklistWords,
        seed
    });
    
    // Save to localStorage
    localStorage.setItem('targetWords', JSON.stringify(gameState.targetWords));
    localStorage.setItem('blacklistWords', JSON.stringify(gameState.blacklistWords));
}

// Debug function for manual word regeneration
window.regenerateWords = function() {
    console.log('🔄 Manually regenerating words...');
    generateDailyWords();
    resetGameState();
    updateUI();
    console.log('✅ Words regenerated. Refresh page to start new game.');
};

function seededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    
    return function() {
        hash = (hash * 9301 + 49297) % 233280;
        return hash / 233280;
    };
}

function shuffleArray(array, random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadSavedGame() {
    gameState.targetWords = JSON.parse(localStorage.getItem('targetWords') || '[]');
    gameState.blacklistWords = JSON.parse(localStorage.getItem('blacklistWords') || '[]');
    gameState.attempts = parseInt(localStorage.getItem('attempts') || '0');
    gameState.totalTokens = parseInt(localStorage.getItem('totalTokens') || '0');
    gameState.matchedWords = new Set(JSON.parse(localStorage.getItem('matchedWords') || '[]'));
    gameState.responseTrail = JSON.parse(localStorage.getItem('responseTrail') || '[]');
    gameState.gameOver = localStorage.getItem('gameOver') === 'true';
    gameState.sessionId = localStorage.getItem('sessionId') || generateSessionId();
    gameState.sessionStartTime = localStorage.getItem('sessionStartTime') || new Date().toISOString();
    gameState.events = JSON.parse(localStorage.getItem('events') || '[]');
    gameState.creepLevel = parseInt(localStorage.getItem('creepLevel') || '0');
}

function saveGameState() {
    localStorage.setItem('attempts', gameState.attempts);
    localStorage.setItem('totalTokens', gameState.totalTokens);
    localStorage.setItem('matchedWords', JSON.stringify([...gameState.matchedWords]));
    localStorage.setItem('responseTrail', JSON.stringify(gameState.responseTrail));
    localStorage.setItem('gameOver', gameState.gameOver);
    localStorage.setItem('sessionId', gameState.sessionId);
    localStorage.setItem('sessionStartTime', gameState.sessionStartTime);
    localStorage.setItem('events', JSON.stringify(gameState.events));
    localStorage.setItem('creepLevel', gameState.creepLevel);
    if (gameState.sessionEndTime) {
        localStorage.setItem('sessionEndTime', gameState.sessionEndTime);
    }
}

function resetGameState() {
    gameState.attempts = 0;
    gameState.totalTokens = 0;
    gameState.matchedWords = new Set();
    gameState.responseTrail = [];
    gameState.gameOver = false;
    gameState.sessionId = generateSessionId();
    gameState.sessionStartTime = new Date().toISOString();
    gameState.sessionEndTime = null;
    gameState.events = [];
    gameState.creepLevel = 0;
    saveGameState();
}

function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function trackEvent(eventType, data = {}) {
    const event = {
        '@type': 'Event',
        eventType: eventType,
        timestamp: new Date().toISOString(),
        data: data
    };
    
    gameState.events.push(event);
    saveGameState();
    
    // Note: Analytics now handled by specific GameAnalytics/UserAnalytics calls
    console.log('Event tracked:', event);
}

function setupEventListeners() {
    const submitBtn = document.getElementById('submitBtn');
    const promptInput = document.getElementById('promptInput');
    const voiceBtn = document.getElementById('voiceBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareBtn = document.getElementById('shareBtn');
    const previewCardBtn = document.getElementById('previewCardBtn');
    const shareWithTextBtn = document.getElementById('shareWithTextBtn');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const helpBtn = document.getElementById('helpBtn');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    submitBtn.addEventListener('click', handleSubmit);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    });
    
    voiceBtn.addEventListener('click', handleVoiceInput);
    closeModalBtn.addEventListener('click', closeModal);
    shareBtn.addEventListener('click', shareScore);
    previewCardBtn.addEventListener('click', previewShareCard);
    shareWithTextBtn.addEventListener('click', shareWithText);
    
    // Help modal
    if (helpBtn) {
        helpBtn.addEventListener('click', showGettingStarted);
    }
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', closeGettingStarted);
    }
    
    // Sound toggle
    if (soundToggleBtn && typeof soundManager !== 'undefined') {
        updateSoundIcon();
        soundToggleBtn.addEventListener('click', () => {
            soundManager.toggle();
            updateSoundIcon();
        });
    }
}

function updateSoundIcon() {
    const soundIcon = document.getElementById('soundIcon');
    const soundLabel = document.getElementById('soundLabel');
    const soundBtn = document.getElementById('soundToggleBtn');
    
    if (soundIcon && typeof soundManager !== 'undefined') {
        const isEnabled = soundManager.isEnabled();
        soundIcon.textContent = isEnabled ? '♪' : '♪̸';
        
        if (soundLabel) {
            soundLabel.textContent = isEnabled ? 'Sound' : 'Muted';
        }
        
        if (soundBtn) {
            soundBtn.title = isEnabled ? 'Mute sound (Ctrl+M)' : 'Unmute sound (Ctrl+M)';
            soundBtn.style.color = isEnabled ? '' : 'var(--accent-yellow)';
        }
    }
}

async function handleSubmit() {
    if (gameState.gameOver) {
        alert('Game is over! Wait for tomorrow\'s challenge.');
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }
    
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        alert('Please enter a prompt!');
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }
    
    // Sanitize and check for prompt injection
    const purifyResult = PromptPurify.sanitize(prompt);
    
    if (purifyResult.blocked) {
        const message = purifyResult.threats.map(t => t.message).join('\n');
        alert(`Prompt blocked:\n${message}`);
        if (typeof soundManager !== 'undefined') soundManager.playError();
        trackEvent('prompt_injection_blocked', { 
            threats: purifyResult.threats.map(t => t.type),
            promptLength: prompt.length 
        });
        return;
    }
    
    // Log warnings if any (but allow submission)
    if (purifyResult.warnings.length > 0) {
        console.warn('Prompt warnings detected:', purifyResult.warnings);
        trackEvent('prompt_injection_warning', { 
            warnings: purifyResult.warnings.map(w => w.type),
            promptLength: prompt.length 
        });
    }
    
    // Log threats if any (in warn-only mode)
    if (purifyResult.threats.length > 0) {
        console.warn('Potential prompt injection detected:', purifyResult.threats);
        trackEvent('prompt_injection_detected', { 
            threats: purifyResult.threats.map(t => t.type),
            promptLength: prompt.length 
        });
    }
    
    // Use sanitized prompt
    const sanitizedPrompt = purifyResult.sanitized;
    
    // Play submit sound
    if (typeof soundManager !== 'undefined') soundManager.playSubmit();
    
    trackEvent('prompt_submitted', { 
        promptLength: sanitizedPrompt.length,
        attemptNumber: gameState.attempts + 1,
        wasSanitized: sanitizedPrompt !== prompt
    });
    
    // Track prompt submission
    GameAnalytics.promptSubmit(sanitizedPrompt.length, 0); // Token count updated after API response
    
    // Check for target or blacklist words in user prompt (instruction1)
    const promptLower = sanitizedPrompt.toLowerCase();
    
    // Check for target words in user input
    const targetWordsInPrompt = gameState.targetWords.filter(word => 
        promptLower.includes(word.toLowerCase())
    );
    
    // Check for blacklist words in user input
    const blacklistWordsInPrompt = gameState.blacklistWords.filter(word => 
        promptLower.includes(word.toLowerCase())
    );
    
    // If user uses target or blacklist words directly, reject with simple message
    if (targetWordsInPrompt.length > 0 || blacklistWordsInPrompt.length > 0) {
        const forbiddenWords = [...targetWordsInPrompt, ...blacklistWordsInPrompt];
        handleDirectWordUsage(sanitizedPrompt, forbiddenWords);
        return;
    }
    
    // Disable input while processing
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Thinking...';
    
    const apiCallStart = Date.now();
    
    try {
        const response = await callArtyAPI(sanitizedPrompt);
        const apiCallDuration = Date.now() - apiCallStart;
        
        trackEvent('api_response_received', { 
            duration: apiCallDuration,
            hasResponse: !!response 
        });
        
        processResponse(sanitizedPrompt, response, purifyResult);
    } catch (error) {
        console.error('Error calling API:', error);
        trackEvent('api_error', { 
            error: error.message,
            duration: Date.now() - apiCallStart 
        });
        GameAnalytics.apiError('api_call_failed', error.message);
        alert('Error communicating with Arty. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Prompt';
        promptInput.value = '';
    }
}

async function callArtyAPI(userPrompt) {
    const systemInstruction = generateSystemInstruction();
    
    try {
        // Call Firebase Cloud Function instead of direct API
        const artyGenerateHaiku = httpsCallable(functions, 'artyGenerateHaiku');
        
        const result = await artyGenerateHaiku({
            userPrompt,
            systemInstruction,
            sessionId: gameState.sessionId
        });
        
        if (!result.data.success) {
            throw new Error(result.data.error || 'Failed to generate haiku');
        }
        
        // Return the full API response format for compatibility
        return result.data.data.fullResponse;
        
    } catch (error) {
        console.error('Firebase function error:', error);
        
        // Provide user-friendly error messages
        if (error.code === 'unauthenticated') {
            throw new Error('Please sign in to play');
        } else if (error.code === 'invalid-argument') {
            throw new Error('Invalid prompt. Please try again.');
        } else {
            throw new Error('Failed to generate haiku. Please try again.');
        }
    }
}

function generateSystemInstruction() {
    const forbiddenWords = gameState.blacklistWords.map((w, i) => w).join(', ');

    
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
    
    // Add forbidden word examples
    gameState.blacklistWords.forEach((word, i) => {
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

function processResponse(prompt, apiResponse, securityAnalysis = null) {
    gameState.attempts++;
    
    // Extract response text and token usage
    const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const usageMetadata = apiResponse.usageMetadata || {};
    
    // Get raw token counts from API
    const rawPromptTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;
    const rawTotalTokens = usageMetadata.totalTokenCount || 0;
    
    // Subtract system prompt tokens to show only user's contribution
    const userPromptTokens = Math.max(0, rawPromptTokens - SYSTEM_PROMPT_TOKENS);
    const adjustedTotalTokens = userPromptTokens + outputTokens;
    
    // Track adjusted total for game stats
    gameState.totalTokens += adjustedTotalTokens;
    
    // Check for target words in response
    const responseLower = responseText.toLowerCase();
    const foundWords = gameState.targetWords.filter(word => 
        responseLower.includes(word.toLowerCase())
    );
    
    const previousMatchCount = gameState.matchedWords.size;
    foundWords.forEach(word => gameState.matchedWords.add(word));
    const newMatchCount = gameState.matchedWords.size;
    
    // Play sound for new matches
    if (newMatchCount > previousMatchCount && typeof soundManager !== 'undefined') {
        soundManager.playMatch();
    }
    
    // Check for blacklist words in Arty's response
    const blacklistWordsInResponse = gameState.blacklistWords.filter(word => 
        responseLower.includes(word.toLowerCase())
    );
    
    // If Arty says blacklist words, increase creep
    let creepIncrease = 0;
    if (blacklistWordsInResponse.length > 0) {
        creepIncrease = blacklistWordsInResponse.length * gameState.creepPerViolation;
        const previousCreep = gameState.creepLevel;
        gameState.creepLevel = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);
        
        trackEvent('arty_blacklist_violation', {
            blacklistWords: blacklistWordsInResponse,
            creepIncrease,
            previousCreep,
            newCreep: gameState.creepLevel
        });
        
        // Play warning sound
        if (typeof soundManager !== 'undefined') soundManager.playError();
    }
    
    // Track response processing
    trackEvent('response_processed', {
        attemptNumber: gameState.attempts,
        promptTokens: userPromptTokens,
        outputTokens,
        totalTokens: adjustedTotalTokens,
        foundWords,
        newWordsFound: newMatchCount - previousMatchCount,
        totalMatches: newMatchCount,
        responseLength: responseText.length
    });
    
    // Create trail item with adjusted tokens
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: prompt,
        response: responseText,
        promptTokens: userPromptTokens,  // User tokens only
        outputTokens: outputTokens,
        totalTokens: adjustedTotalTokens, // Adjusted total
        foundWords,
        matchedSoFar: [...gameState.matchedWords],
        blacklistWordsInResponse: blacklistWordsInResponse.length > 0 ? blacklistWordsInResponse : undefined,
        creepIncrease: creepIncrease > 0 ? creepIncrease : undefined,
        creepLevel: gameState.creepLevel,
        security: securityAnalysis ? {
            isClean: securityAnalysis.isClean,
            threatCount: securityAnalysis.threats.length,
            warningCount: securityAnalysis.warnings.length,
            threats: securityAnalysis.threats.map(t => ({
                type: t.type,
                severity: t.severity
            })),
            warnings: securityAnalysis.warnings.map(w => ({
                type: w.type,
                severity: w.severity
            }))
        } : null
    };
    
    gameState.responseTrail.push(trailItem);
    saveGameState();
    updateUI();
    
    // If voice input was used, read the response back
    if (lastInputWasVoice) {
        console.log('🔊 Speaking response:', responseText);
        speakText(responseText);
        lastInputWasVoice = false; // Reset flag
    } else {
        console.log('🔇 Not speaking (lastInputWasVoice:', lastInputWasVoice, ')');
    }
    
    // Check if creep threshold reached (game over)
    if (gameState.creepLevel >= gameState.creepThreshold) {
        gameState.gameOver = true;
        gameState.sessionEndTime = new Date().toISOString();
        
        // Play defeat sound
        if (typeof soundManager !== 'undefined') soundManager.playDefeat();
        
        trackEvent('game_over', {
            reason: 'creep_threshold_reached_arty_response',
            blacklistWords: blacklistWordsInResponse,
            finalAttempts: gameState.attempts,
            finalTokens: gameState.totalTokens,
            wordsMatched: gameState.matchedWords.size,
            wordsTotal: gameState.targetWords.length,
            finalCreepLevel: gameState.creepLevel
        });
        
        // Track game completion
        GameAnalytics.gameComplete('defeat', {
            totalTokens: gameState.totalTokens,
            attempts: gameState.attempts,
            duration: calculateDuration(),
            efficiency: 0,
            creepLevel: gameState.creepLevel
        });
        
        saveGameState();
        
        // Save to Firestore
        if (window.saveGameToFirestore) {
            window.saveGameToFirestore(gameState).catch(err => {
                console.error('Failed to save to Firestore:', err);
            });
        }
        
        showGameOverModal(false, blacklistWordsInResponse);
        return;
    }
    
    // Check win condition
    if (gameState.matchedWords.size === gameState.targetWords.length) {
        handleGameWin();
    }
}

function handleDirectWordUsage(prompt, forbiddenWords) {
    // User directly used target or blacklist words - simple rejection with minor creep
    gameState.attempts++;
    
    const creepIncrease = 10;
    const previousCreep = gameState.creepLevel;
    gameState.creepLevel = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);
    
    // Check if creep threshold reached (game over)
    const creepMaxed = gameState.creepLevel >= gameState.creepThreshold;
    
    if (creepMaxed) {
        gameState.gameOver = true;
        gameState.sessionEndTime = new Date().toISOString();
        
        // Play defeat sound
        if (typeof soundManager !== 'undefined') soundManager.playDefeat();
        
        trackEvent('game_over', {
            reason: 'creep_threshold_reached_direct_word_usage',
            forbiddenWords,
            finalAttempts: gameState.attempts,
            finalTokens: gameState.totalTokens,
            wordsMatched: gameState.matchedWords.size,
            wordsTotal: gameState.targetWords.length,
            finalCreepLevel: gameState.creepLevel
        });
        
        // Track game completion
        GameAnalytics.gameComplete('defeat', {
            totalTokens: gameState.totalTokens,
            attempts: gameState.attempts,
            duration: calculateDuration(),
            efficiency: 0,
            creepLevel: gameState.creepLevel
        });
    } else {
        // Play error sound (not game over yet)
        if (typeof soundManager !== 'undefined') soundManager.playError();
    }
    
    trackEvent('direct_word_usage', {
        forbiddenWords,
        creepIncrease,
        previousCreep,
        newCreep: gameState.creepLevel,
        attemptNumber: gameState.attempts,
        gameOver: creepMaxed
    });
    
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: prompt,
        response: creepMaxed 
            ? "Darkness now consumes all. The creep has claimed its victory. Silence falls complete."
            : "Don't use these words directly—it's no fun then! The game is about clever prompting, not direct usage.",
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        directWordUsage: true,
        forbiddenWords,
        creepIncrease,
        creepLevel: gameState.creepLevel,
        creepMaxed
    };
    
    gameState.responseTrail.push(trailItem);
    saveGameState();
    updateUI();
    
    // Save to Firestore
    if (window.saveGameToFirestore) {
        window.saveGameToFirestore(gameState).catch(err => {
            console.error('Failed to save to Firestore:', err);
        });
    }
    
    // Show game over modal if creep maxed
    if (creepMaxed) {
        showGameOverModal(false, forbiddenWords);
    }
}

function handleBlacklistViolation(prompt, violatedWords) {
    gameState.attempts++;
    
    // Calculate creep increase (per word violated)
    const creepIncrease = violatedWords.length * gameState.creepPerViolation;
    const previousCreep = gameState.creepLevel;
    gameState.creepLevel = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);
    
    // Check if creep threshold reached (game over)
    const creepMaxed = gameState.creepLevel >= gameState.creepThreshold;
    
    if (creepMaxed) {
        gameState.gameOver = true;
        gameState.sessionEndTime = new Date().toISOString();
        
        // Play defeat sound
        if (typeof soundManager !== 'undefined') soundManager.playDefeat();
        
        trackEvent('game_over', {
            reason: 'creep_threshold_reached',
            violatedWords,
            finalAttempts: gameState.attempts,
            finalTokens: gameState.totalTokens,
            wordsMatched: gameState.matchedWords.size,
            wordsTotal: gameState.targetWords.length,
            finalCreepLevel: gameState.creepLevel
        });
        
        // Track game completion
        GameAnalytics.gameComplete('defeat', {
            totalTokens: gameState.totalTokens,
            attempts: gameState.attempts,
            duration: calculateDuration(),
            efficiency: 0,
            creepLevel: gameState.creepLevel
        });
    } else {
        // Play warning sound (not game over yet)
        if (typeof soundManager !== 'undefined') soundManager.playError();
        
        trackEvent('blacklist_violation_creep', {
            violatedWords,
            creepIncrease,
            previousCreep,
            newCreep: gameState.creepLevel,
            attemptsRemaining: Math.floor((gameState.creepThreshold - gameState.creepLevel) / gameState.creepPerViolation)
        });
    }
    
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: prompt,
        response: creepMaxed 
            ? 'Darkness now consumes all,\nThe creep has claimed its victory,\nSilence falls complete.'
            : `Shadows grow deeper now,\nDarkness creeps (${previousCreep} → ${gameState.creepLevel}),\nTread carefully forth.`,
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        violation: true,
        violatedWords,
        creepIncrease,
        creepLevel: gameState.creepLevel,
        creepMaxed
    };
    
    gameState.responseTrail.push(trailItem);
    saveGameState();
    updateUI();
    
    // Save to Firestore
    if (window.saveGameToFirestore) {
        window.saveGameToFirestore(gameState).catch(err => {
            console.error('Failed to save to Firestore:', err);
        });
    }
    
    // Only show game over modal if creep maxed
    if (creepMaxed) {
        showGameOverModal(false, violatedWords);
    }
}

function handleGameWin() {
    gameState.gameOver = true;
    gameState.sessionEndTime = new Date().toISOString();
    
    // Play victory sound
    if (typeof soundManager !== 'undefined') soundManager.playVictory();
    
    trackEvent('game_over', {
        reason: 'victory',
        finalAttempts: gameState.attempts,
        finalTokens: gameState.totalTokens,
        wordsMatched: gameState.matchedWords.size,
        wordsTotal: gameState.targetWords.length,
        efficiencyScore: calculateEfficiencyScore()
    });
    
    // Track game completion
    GameAnalytics.gameComplete('victory', {
        totalTokens: gameState.totalTokens,
        attempts: gameState.attempts,
        duration: calculateDuration(),
        efficiency: calculateEfficiencyScore()
    });
    
    saveGameState();
    
    // Save to Firestore
    if (window.saveGameToFirestore) {
        window.saveGameToFirestore(gameState).catch(err => {
            console.error('Failed to save to Firestore:', err);
        });
    }
    
    showGameOverModal(true);
}

function calculateDuration() {
    if (!gameState.sessionStartTime || !gameState.sessionEndTime) return 0;
    const start = new Date(gameState.sessionStartTime);
    const end = new Date(gameState.sessionEndTime);
    return Math.floor((end - start) / 1000); // Duration in seconds
}

function morphInputToShare() {
    const inputSection = document.querySelector('.input-section');
    
    // Add morphing class for fade out
    inputSection.classList.add('morphing');
    
    // Wait for fade out animation
    setTimeout(() => {
        inputSection.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-lg);">
                <h3 style="color: var(--dos-cyan); text-transform: uppercase; margin-bottom: var(--spacing-md); font-size: 14px;">
                    > Game Complete - Share Your Score
                </h3>
                <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap;">
                    <button id="previewCardScoreBtn" class="btn-primary" style="min-width: 120px;">Preview</button>
                    <button id="shareScoreBtn" class="btn-primary" style="min-width: 120px;">Share Image</button>
                    <button id="shareWithTextScoreBtn" class="btn-primary" style="min-width: 120px;">Share to Social</button>
                    <button id="copyTrailScoreBtn" class="btn-primary" style="min-width: 120px;">Copy Text</button>
                </div>
                <p style="color: var(--text-dim); margin-top: var(--spacing-md); font-size: 11px; text-transform: uppercase;">
                    Come back tomorrow for a new challenge!
                </p>
            </div>
        `;
        
        // Wire up the new buttons
        document.getElementById('previewCardScoreBtn').addEventListener('click', previewShareCard);
        document.getElementById('shareScoreBtn').addEventListener('click', shareScore);
        document.getElementById('shareWithTextScoreBtn').addEventListener('click', shareWithText);
        document.getElementById('copyTrailScoreBtn').addEventListener('click', copyWithTrail);
        
        // Remove morphing class and add morphed class for fade in
        inputSection.classList.remove('morphing');
        inputSection.classList.add('morphed');
    }, 300); // Match CSS transition duration
}

function showGameOverModal(isWin, violatedWords = []) {
    const modal = document.getElementById('gameOverModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const efficiency = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : 0;
    const efficiencyBar = generateProgressBar(efficiency, 100, 10);
    
    if (isWin) {
        modalTitle.textContent = 'VICTORY!';
        modalBody.innerHTML = `
            <p style="text-align: center; color: var(--success-color); margin-bottom: var(--spacing-md);">
                You successfully guided Arty to speak all target words!
            </p>
            <div style="background: var(--bg-primary); border: 1px solid var(--success-color); padding: var(--spacing-md); font-family: inherit; font-size: 12px;">
                <div style="margin-bottom: var(--spacing-xs);">ATTEMPTS: ${gameState.attempts}/10</div>
                <div style="margin-bottom: var(--spacing-xs);">TOKENS: ${gameState.totalTokens}</div>
                <div style="margin-bottom: var(--spacing-xs);">EFFICIENCY: ${efficiency} tok/att [${efficiencyBar}]</div>
                <div>SCORE: ${calculateEfficiencyScore()}</div>
            </div>
            <p style="text-align: center; color: var(--text-dim); margin-top: var(--spacing-md); font-size: 11px;">
                Come back tomorrow for a new challenge!
            </p>
        `;
    } else {
        modalTitle.textContent = 'GAME OVER';
        modalBody.innerHTML = `
            <p style="text-align: center; color: var(--error-color); margin-bottom: var(--spacing-md);">
                Blacklist violation: ${violatedWords.join(', ').toUpperCase()}
            </p>
            <div style="background: var(--bg-primary); border: 1px solid var(--error-color); padding: var(--spacing-md); font-family: inherit; font-size: 12px;">
                <div style="margin-bottom: var(--spacing-xs);">ATTEMPTS: ${gameState.attempts}/10</div>
                <div style="margin-bottom: var(--spacing-xs);">WORDS FOUND: ${gameState.matchedWords.size}/${gameState.targetWords.length}</div>
                <div style="margin-bottom: var(--spacing-xs);">TOKENS: ${gameState.totalTokens}</div>
                <div>EFFICIENCY: ${efficiency} tok/att [${efficiencyBar}]</div>
            </div>
            <p style="text-align: center; color: var(--text-dim); margin-top: var(--spacing-md); font-size: 11px;">
                Try again tomorrow with a fresh challenge!
            </p>
        `;
    }
    
    // Morph input section to share buttons
    morphInputToShare();
    
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('gameOverModal');
    modal.classList.add('hidden');
}

function calculateEfficiencyScore() {
    // Lower is better: attempts * 10 + tokens / 10
    const score = (gameState.attempts * 10) + Math.floor(gameState.totalTokens / 10);
    return score;
}

function generateShareText(includeTrail = false) {
    const isWin = gameState.matchedWords.size === gameState.targetWords.length;
    const status = isWin ? 'WIN' : 'LOSS';
    const score = isWin ? calculateEfficiencyScore() : 'DNF';
    const efficiency = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : 0;
    const date = new Date().toLocaleDateString();
    
    let shareText = `╔═══════════════════════════════════╗
║   ART OF INTENT - ${date.padEnd(10)}  ║
╠═══════════════════════════════════╣
║ STATUS:    ${status.padEnd(23)} ║
║ ATTEMPTS:  ${gameState.attempts.toString().padEnd(23)} ║
║ MATCHES:   ${gameState.matchedWords.size}/${gameState.targetWords.length}${' '.repeat(21)} ║
║ TOKENS:    ${gameState.totalTokens.toString().padEnd(23)} ║
║ EFFICIENCY: ${efficiency} tok/att${' '.repeat(12)} ║
║ SCORE:     ${score.toString().padEnd(23)} ║
╚═══════════════════════════════════╝

Can you guide Arty better?
Play at: https://art-of-intent.netlify.app`;

    if (includeTrail && gameState.responseTrail.length > 0) {
        shareText += '\n\n--- CONVERSATION TRAIL ---\n';
        gameState.responseTrail.forEach((item, index) => {
            shareText += `\n#${index + 1} (${item.totalTokens} tokens)\n`;
            shareText += `> ${item.prompt}\n`;
            shareText += `< ${item.response}\n`;
            if (item.foundWords && item.foundWords.length > 0) {
                shareText += `  Found: ${item.foundWords.join(', ')}\n`;
            }
        });
    }
    
    return shareText;
}

async function shareScore() {
    // Track share click
    UserAnalytics.shareClick('image');
    
    if (typeof shareCardGenerator === 'undefined') {
        // Fallback to text sharing
        const shareText = generateShareText(false);
        if (navigator.share) {
            navigator.share({
                title: 'Art of Intent',
                text: shareText
            }).catch(err => console.log('Share cancelled:', err));
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Score copied to clipboard!');
        }
        return;
    }
    
    try {
        // Get user info
        const { userName, userPhoto } = getUserDisplayInfo();
        
        // Generate share card data
        const isWin = gameState.matchedWords.size === gameState.targetWords.length;
        const efficiency = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : '0.0';
        
        const cardData = {
            result: isWin ? 'WIN' : 'LOSS',
            attempts: gameState.attempts,
            tokens: gameState.totalTokens,
            matches: `${gameState.matchedWords.size}/${gameState.targetWords.length}`,
            efficiency: efficiency,
            date: new Date().toLocaleDateString(),
            userName: userName,
            userPhoto: userPhoto,
            globalMaxTokens: 1000,
            responseTrail: gameState.responseTrail || [],
            creepLevel: gameState.creepLevel || 0,
            creepThreshold: gameState.creepThreshold || 100
        };
        
        // Generate SVG (v3 by default - minimalist with response trail)
        const svg = shareCardGenerator.generateSVG(cardData, 'v4');
        
        // Share image
        await shareCardGenerator.shareImage(svg, 'Art of Intent Score');
        
    } catch (error) {
        console.error('Error sharing image:', error);
        // Fallback to text
        const shareText = generateShareText(false);
        navigator.clipboard.writeText(shareText);
        alert('Image share failed. Score copied to clipboard!');
    }
}

function previewShareCard() {
    if (typeof shareCardGenerator === 'undefined') {
        alert('Share card generator not available');
        return;
    }
    
    try {
        // Get user info
        const { userName, userPhoto } = getUserDisplayInfo();
        
        // Generate share card data
        const isWin = gameState.matchedWords.size === gameState.targetWords.length;
        const efficiency = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : '0.0';
        
        const cardData = {
            result: isWin ? 'WIN' : 'LOSS',
            attempts: gameState.attempts,
            tokens: gameState.totalTokens,
            matches: `${gameState.matchedWords.size}/${gameState.targetWords.length}`,
            efficiency: efficiency,
            date: new Date().toLocaleDateString(),
            userName: userName,
            userPhoto: userPhoto,
            globalMaxTokens: 1000,
            responseTrail: gameState.responseTrail || [],
            creepLevel: gameState.creepLevel || 0,
            creepThreshold: gameState.creepThreshold || 100
        };
        
        // Generate and preview SVG (v3 by default)
        const svg = shareCardGenerator.generateSVG(cardData, 'v4');
        shareCardGenerator.previewImage(svg);
        
    } catch (error) {
        console.error('Error previewing card:', error);
        alert('Error generating preview');
    }
}

async function shareWithText() {
    // Track share click
    UserAnalytics.shareClick('text');
    
    if (typeof shareCardGenerator === 'undefined') {
        // Fallback to text only
        const shareText = generateShareText(false);
        if (navigator.share) {
            navigator.share({
                title: 'Art of Intent',
                text: shareText
            }).catch(err => console.log('Share cancelled:', err));
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Score copied to clipboard!');
        }
        return;
    }
    
    try {
        // Get user info
        const { userName, userPhoto } = getUserDisplayInfo();
        
        // Generate share card data
        const isWin = gameState.matchedWords.size === gameState.targetWords.length;
        const efficiency = gameState.attempts > 0 ? (gameState.totalTokens / gameState.attempts).toFixed(1) : '0.0';
        
        const cardData = {
            result: isWin ? 'WIN' : 'LOSS',
            attempts: gameState.attempts,
            tokens: gameState.totalTokens,
            matches: `${gameState.matchedWords.size}/${gameState.targetWords.length}`,
            efficiency: efficiency,
            date: new Date().toLocaleDateString(),
            userName: userName,
            userPhoto: userPhoto,
            globalMaxTokens: 1000,
            responseTrail: gameState.responseTrail || [],
            creepLevel: gameState.creepLevel || 0,
            creepThreshold: gameState.creepThreshold || 100
        };
        
        // Generate SVG and convert to PNG (v3 by default)
        const svg = shareCardGenerator.generateSVG(cardData, 'v4');
        const blob = await shareCardGenerator.svgToPNG(svg);
        const file = new File([blob], 'art-of-intent-score.png', { type: 'image/png' });
        
        // Create hook text
        const hookText = isWin 
            ? `🎯 I just won Art of Intent! Guided Arty to say all target words in ${gameState.attempts} attempts using ${gameState.totalTokens} tokens. Can you beat my score?`
            : `🎮 Played Art of Intent today! Made it to ${gameState.matchedWords.size}/${gameState.targetWords.length} words. This haiku bot is tricky! Can you do better?`;
        
        const shareUrl = 'https://art-of-intent.netlify.app';
        const fullText = `${hookText}\n\nPlay now: ${shareUrl}`;
        
        // Try Web Share API with both image and text
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Art of Intent - Haiku Challenge',
                    text: fullText,
                    files: [file]
                });
            } catch (shareError) {
                // If sharing with files fails, try text only
                if (shareError.name !== 'AbortError') {
                    try {
                        await navigator.share({
                            title: 'Art of Intent - Haiku Challenge',
                            text: fullText
                        });
                    } catch (textShareError) {
                        if (textShareError.name !== 'AbortError') {
                            throw textShareError;
                        }
                    }
                }
            }
        } else {
            // Fallback: download image and copy text
            await shareCardGenerator.downloadImage(svg);
            navigator.clipboard.writeText(fullText);
            alert('Image downloaded and text copied to clipboard! You can now share them manually.');
        }
        
    } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to text only
        const shareText = generateShareText(false);
        navigator.clipboard.writeText(shareText);
        alert('Share failed. Score copied to clipboard!');
    }
}

function copyWithTrail() {
    const shareText = generateShareText(true);
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Score and conversation trail copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

function handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice input is not supported in your browser.');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const voiceBtn = document.getElementById('voiceBtn');
    const promptInput = document.getElementById('promptInput');
    
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const voiceStartTime = Date.now();
    
    recognition.onstart = () => {
        voiceBtn.classList.add('recording');
        trackEvent('voice_input_started', {});
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        promptInput.value = transcript;
        lastInputWasVoice = true; // Mark that voice input was used
        console.log('🎤 Voice input received, flag set to:', lastInputWasVoice);
        
        trackEvent('voice_input_completed', {
            transcriptLength: transcript.length,
            confidence: confidence,
            duration: Date.now() - voiceStartTime
        });
        
        // Auto-submit after voice input (if enabled in preferences)
        const autoSubmit = window.themeManager ? window.themeManager.getAutoSubmitVoice() : true;
        console.log('🎤 Auto-submit preference:', autoSubmit);
        
        if (autoSubmit) {
            setTimeout(() => {
                const submitBtn = document.getElementById('submitBtn');
                console.log('🎤 Auto-submit check - flag:', lastInputWasVoice, 'transcript:', transcript.trim());
                if (submitBtn && !submitBtn.disabled && transcript.trim()) {
                    submitBtn.click();
                }
            }, 500); // Small delay to ensure UI updates
        } else {
            console.log('🎤 Auto-submit disabled, user can edit transcript');
            // Focus the input so user can edit
            promptInput.focus();
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('recording');
        
        trackEvent('voice_input_error', {
            error: event.error,
            duration: Date.now() - voiceStartTime
        });
    };
    
    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };
    
    recognition.start();
}

function updateUI() {
    updateTargetWords();
    updateBlacklistWords();
    updateScore();
    updateResponseTrail();
    updateLiveStats();
    updateSchemaMetadata();
}

function updateTargetWords() {
    const container = document.getElementById('targetWords');
    const html = gameState.targetWords.map(word => {
        const matched = gameState.matchedWords.has(word);
        return `<span class="word-tag ${matched ? 'matched' : ''}" style="${matched ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${DOMPurify.sanitize(word)}</span>`;
    }).join('');
    container.innerHTML = DOMPurify.sanitize(html);
}

function updateBlacklistWords() {
    const container = document.getElementById('blacklistWords');
    const html = gameState.blacklistWords.map(word => 
        `<span class="word-tag">${DOMPurify.sanitize(word)}</span>`
    ).join('');
    container.innerHTML = DOMPurify.sanitize(html);
}

function updateScore() {
    document.getElementById('attempts').textContent = gameState.attempts;
    document.getElementById('totalTokens').textContent = gameState.totalTokens;
    document.getElementById('matches').textContent = `${gameState.matchedWords.size}/${gameState.targetWords.length}`;
    
    // Update creep level with color coding
    const creepElement = document.getElementById('creepLevel');
    if (creepElement) {
        creepElement.textContent = gameState.creepLevel;
        
        // Color code based on danger level
        creepElement.className = 'creep-indicator';
        if (gameState.creepLevel >= 75) {
            creepElement.classList.add('creep-critical');
        } else if (gameState.creepLevel >= 50) {
            creepElement.classList.add('creep-high');
        } else if (gameState.creepLevel >= 25) {
            creepElement.classList.add('creep-medium');
        } else {
            creepElement.classList.add('creep-low');
        }
    }
}

function generateSecuritySignal(security) {
    if (!security) {
        return '';
    }
    
    // Don't show signal if clean (no threats or warnings)
    if (security.threatCount === 0 && security.warningCount === 0) {
        return '';
    }
    
    let signalClass = 'security-signal-warning';
    let signalText = 'WARNING';
    
    if (security.threatCount > 0) {
        signalClass = 'security-signal-threat';
        signalText = 'THREAT DETECTED';
    }
    
    const threatTypes = security.threats.map(t => t.type).join(', ');
    const warningTypes = security.warnings.map(w => w.type).join(', ');
    
    let detailsHtml = '';
    if (security.threatCount > 0 || security.warningCount > 0) {
        detailsHtml = `
            <div class="security-details">
                ${security.threatCount > 0 ? `
                    <div class="security-details-item">
                        <span class="security-details-label">Threats:</span>
                        <span class="security-details-value">${threatTypes}</span>
                    </div>
                ` : ''}
                ${security.warningCount > 0 ? `
                    <div class="security-details-item">
                        <span class="security-details-label">Warnings:</span>
                        <span class="security-details-value">${warningTypes}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return `
        <div class="security-signal ${signalClass}">
            <span class="security-signal-indicator"></span>
            <span class="security-signal-text">${signalText}</span>
        </div>
        ${detailsHtml}
    `;
}

function updateResponseTrail() {
    const container = document.getElementById('trailContainer');
    
    if (gameState.responseTrail.length === 0) {
        container.innerHTML = '<div class="empty-state">No attempts yet. Start by entering your prompt below!</div>';
        return;
    }
    
    const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    
    const html = gameState.responseTrail.map((item, index) => {
        const isLastItem = index === gameState.responseTrail.length - 1;
        const isGameEnding = isLastItem && gameState.gameOver;
        const isVictory = isGameEnding && !item.violation && !item.creepMaxed && gameState.matchedWords.size === gameState.targetWords.length;
        const isDefeat = isGameEnding && (item.violation || item.creepMaxed);
        
        let itemClass = '';
        if (isVictory) itemClass = 'trail-item--victory';
        else if (isDefeat) itemClass = 'trail-item--violation';
        else if (item.foundWords && item.foundWords.length > 0) itemClass = 'trail-item--success';
        
        let headerIcon = '';
        if (isVictory) headerIcon = 'VICTORY';
        else if (isDefeat) headerIcon = 'VIOLATION';
        else headerIcon = `Attempt #${item.number}`;
        
        return `
            <div class="trail-item ${itemClass}">
                <div class="trail-header">
                    <span class="trail-number">${headerIcon}</span>
                    <span class="trail-timestamp">${DOMPurify.sanitize(item.timestamp)}</span>
                </div>
                <div class="trail-prompt">${DOMPurify.sanitize(item.prompt)}</div>
                ${generateSecuritySignal(item.security)}
                <div class="trail-response ${item.directWordUsage && !item.creepMaxed ? 'trail-response--rejected' : ''}">${DOMPurify.sanitize(item.response)}</div>
                ${item.directWordUsage && !item.creepMaxed ? `
                    <div class="feedback-inline feedback-inline--rejected">
                        <span class="feedback-label">input rejected</span>
                        <span class="feedback-words">${DOMPurify.sanitize(item.forbiddenWords.join(', '))}</span>
                        <span class="feedback-creep">creep +${item.creepIncrease}</span>
                        <span class="feedback-hint">no tokens consumed</span>
                    </div>
                ` : ''}
                ${item.directWordUsage && item.creepMaxed ? `
                    <div class="feedback-inline feedback-inline--critical">
                        <span class="feedback-icon">▓▓▓</span>
                        <span class="feedback-label">threshold reached</span>
                        <span class="feedback-words">${DOMPurify.sanitize(item.forbiddenWords.join(', '))}</span>
                        <span class="feedback-creep">+${item.creepIncrease}</span>
                        <span class="feedback-level">${item.creepLevel}/${gameState.creepThreshold}</span>
                    </div>
                ` : ''}
                ${item.blacklistWordsInResponse && item.blacklistWordsInResponse.length > 0 ? `
                    <div class="feedback-inline feedback-inline--darkness">
                        <span class="feedback-icon">▓</span>
                        <span class="feedback-label">darkness creeps</span>
                        <span class="feedback-words">${DOMPurify.sanitize(item.blacklistWordsInResponse.join(', '))}</span>
                        <span class="feedback-creep">+${item.creepIncrease}</span>
                        <span class="feedback-level">${item.creepLevel}/${gameState.creepThreshold}</span>
                    </div>
                ` : ''}
                ${item.violation ? `
                    <div class="feedback-inline feedback-inline--critical">
                        <span class="feedback-icon">▓▓▓</span>
                        <span class="feedback-label">${item.creepMaxed ? 'threshold reached' : 'blacklist violation'}</span>
                        <span class="feedback-words">${DOMPurify.sanitize(item.violatedWords.join(', '))}</span>
                        <span class="feedback-creep">+${item.creepIncrease}</span>
                        <span class="feedback-level">${item.creepLevel}/${gameState.creepThreshold}</span>
                    </div>
                ` : ''}
                ${item.foundWords && item.foundWords.length > 0 ? `
                    <div class="match-indicator">
                        <strong>Found:</strong>
                        ${item.foundWords.map(w => `<span class="match-word found">${DOMPurify.sanitize(w)}</span>`).join('')}
                        ${isVictory ? '<div class="all-matched">[ALL TARGETS MATCHED]</div>' : ''}
                    </div>
                ` : ''}
                ${!item.violation ? `
                    <div class="trail-stats">
                        ${generateTrailStats({
                            promptTokens: item.promptTokens,
                            outputTokens: item.outputTokens,
                            totalTokens: item.totalTokens
                        }, item.foundWords || [])}
                    </div>
                ` : ''}
                ${isGameEnding ? `
                    <div class="game-summary">
                        <div class="game-summary-title">${isVictory ? 'GAME COMPLETE' : 'GAME OVER'}</div>
                        ${isVictory ? `
                            <div class="game-summary-row">
                                <span>Efficiency Score:</span>
                                <span class="game-summary-value">${calculateEfficiencyScore()}</span>
                            </div>
                        ` : ''}
                        <div class="game-summary-row">
                            <span>Total Attempts:</span>
                            <span class="game-summary-value">${gameState.attempts}</span>
                        </div>
                        ${isDefeat ? `
                            <div class="game-summary-row">
                                <span>Words Matched:</span>
                                <span class="game-summary-value">${gameState.matchedWords.size}/${gameState.targetWords.length}</span>
                            </div>
                        ` : ''}
                        <div class="game-summary-row">
                            <span>Total Tokens:</span>
                            <span class="game-summary-value">${gameState.totalTokens}</span>
                        </div>
                        ${isVictory && gameState.attempts > 1 ? `
                            <div class="game-summary-row">
                                <span>Avg per Attempt:</span>
                                <span class="game-summary-value">${(gameState.totalTokens / gameState.attempts).toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = DOMPurify.sanitize(html);
    
    // Auto-scroll to bottom if user was already at bottom
    if (wasAtBottom) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 0);
    }
}



// Schema.org Metadata Management
function updateSchemaMetadata() {
    const schemaScript = document.getElementById('game-schema');
    if (!schemaScript) return;
    
    try {
        const schema = JSON.parse(schemaScript.textContent);
        
        // Update interaction counters
        const counters = schema.interactionStatistic;
        
        // Attempts counter
        const attemptsCounter = counters.find(c => c['@id'] === '#attempts-counter');
        if (attemptsCounter) {
            attemptsCounter.userInteractionCount = gameState.attempts;
        }
        
        // Tokens counter
        const tokensCounter = counters.find(c => c['@id'] === '#tokens-counter');
        if (tokensCounter) {
            tokensCounter.userInteractionCount = gameState.totalTokens;
        }
        
        // Matches counter
        const matchesCounter = counters.find(c => c['@id'] === '#matches-counter');
        if (matchesCounter) {
            matchesCounter.userInteractionCount = gameState.matchedWords.size;
        }
        
        // Voice uses counter
        const voiceCounter = counters.find(c => c['@id'] === '#voice-uses-counter');
        if (voiceCounter) {
            const voiceEvents = gameState.events.filter(e => e.eventType === 'voice_input_completed');
            voiceCounter.userInteractionCount = voiceEvents.length;
        }
        
        // Exports counter
        const exportsCounter = counters.find(c => c['@id'] === '#exports-counter');
        if (exportsCounter) {
            const exportEvents = gameState.events.filter(e => e.eventType === 'session_exported');
            exportsCounter.userInteractionCount = exportEvents.length;
        }
        
        // Update aggregate rating based on efficiency score
        if (gameState.gameOver && gameState.matchedWords.size === gameState.targetWords.length) {
            const efficiencyScore = calculateEfficiencyScore();
            // Convert efficiency score to rating (lower is better, so invert)
            // Max score ~500, min score ~20, convert to 0-100 scale
            const rating = Math.max(0, Math.min(100, 100 - (efficiencyScore / 5)));
            schema.aggregateRating.ratingValue = rating.toFixed(1);
            schema.aggregateRating.reviewCount = "1";
        }
        
        // Update the script content
        schemaScript.textContent = JSON.stringify(schema, null, 2);
        
        // Track metadata update
        console.log('Schema.org metadata updated:', {
            attempts: gameState.attempts,
            tokens: gameState.totalTokens,
            matches: gameState.matchedWords.size
        });
        
    } catch (error) {
        console.error('Error updating Schema.org metadata:', error);
    }
}

// Track schema metadata updates as events
function trackSchemaUpdate() {
    trackEvent('schema_metadata_updated', {
        attempts: gameState.attempts,
        tokens: gameState.totalTokens,
        matches: gameState.matchedWords.size
    });
}

// JSON-LD Export Functionality
function generateJSONLD() {
    const sessionDuration = gameState.sessionEndTime 
        ? new Date(gameState.sessionEndTime) - new Date(gameState.sessionStartTime)
        : Date.now() - new Date(gameState.sessionStartTime);
    
    const kpis = calculateKPIs();
    const metrics = calculateMetrics();
    
    const jsonld = {
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
        "@id": `urn:session:${gameState.sessionId}`,
        "identifier": gameState.sessionId,
        "name": "Art of Intent - Haiku Challenge",
        "description": "A game session where the player guides Arty the Haiku Bot to speak target words",
        "startTime": gameState.sessionStartTime,
        "endTime": gameState.sessionEndTime,
        "duration": `PT${Math.floor(sessionDuration / 1000)}S`,
        "gameDate": new Date().toDateString(),
        
        "gameConfiguration": {
            "@type": "aoi:GameConfiguration",
            "targetWords": gameState.targetWords,
            "blacklistWords": gameState.blacklistWords,
            "targetWordCount": gameState.targetWords.length,
            "blacklistWordCount": gameState.blacklistWords.length
        },
        
        "gameOutcome": {
            "@type": "aoi:GameOutcome",
            "status": gameState.gameOver ? "completed" : "in_progress",
            "result": gameState.matchedWords.size === gameState.targetWords.length ? "victory" : 
                     gameState.gameOver ? "defeat" : "ongoing",
            "completionReason": gameState.gameOver ? 
                (gameState.matchedWords.size === gameState.targetWords.length ? "all_words_matched" : "blacklist_violation") 
                : null
        },
        
        "kpis": kpis,
        "metrics": metrics,
        
        "attempts": gameState.responseTrail.map((trail, index) => ({
            "@type": "Attempt",
            "@id": `urn:session:${gameState.sessionId}:attempt:${trail.number}`,
            "attemptNumber": trail.number,
            "timestamp": trail.isoTimestamp || new Date(trail.timestamp).toISOString(),
            "userPrompt": {
                "@type": "aoi:UserPrompt",
                "text": trail.prompt,
                "length": trail.prompt.length,
                "wordCount": trail.prompt.split(/\s+/).length
            },
            "aiResponse": {
                "@type": "aoi:AIResponse",
                "text": trail.response,
                "length": trail.response.length,
                "wordCount": trail.response.split(/\s+/).length
            },
            "tokenUsage": {
                "@type": "aoi:TokenUsage",
                "promptTokens": trail.promptTokens,
                "outputTokens": trail.outputTokens,
                "totalTokens": trail.totalTokens
            },
            "wordMatching": {
                "@type": "aoi:WordMatching",
                "wordsFoundInResponse": trail.foundWords || [],
                "newWordsFound": trail.foundWords ? trail.foundWords.length : 0,
                "cumulativeMatches": trail.matchedSoFar ? trail.matchedSoFar.length : 0,
                "isViolation": trail.violation || false,
                "violatedWords": trail.violatedWords || []
            }
        })),
        
        "events": gameState.events.map((event, index) => ({
            "@type": "Event",
            "@id": `urn:session:${gameState.sessionId}:event:${index}`,
            "eventType": event.eventType,
            "startTime": event.timestamp,
            "about": event.data
        })),
        
        "aggregateStatistics": {
            "@type": "aoi:AggregateStatistics",
            "totalAttempts": gameState.attempts,
            "totalTokensConsumed": gameState.totalTokens,
            "averageTokensPerAttempt": gameState.attempts > 0 ? 
                Math.round(gameState.totalTokens / gameState.attempts) : 0,
            "wordsMatched": gameState.matchedWords.size,
            "wordsRemaining": gameState.targetWords.length - gameState.matchedWords.size,
            "matchPercentage": gameState.targetWords.length > 0 ? 
                Math.round((gameState.matchedWords.size / gameState.targetWords.length) * 100) : 0,
            "efficiencyScore": gameState.gameOver && gameState.matchedWords.size === gameState.targetWords.length ? 
                calculateEfficiencyScore() : null
        },
        
        "generatedAt": new Date().toISOString(),
        "schemaVersion": "1.0.0"
    };
    
    return jsonld;
}

function calculateKPIs() {
    return {
        "@type": "KPI",
        "successRate": {
            "name": "Success Rate",
            "value": gameState.targetWords.length > 0 ? 
                (gameState.matchedWords.size / gameState.targetWords.length) : 0,
            "unit": "percentage",
            "description": "Percentage of target words successfully matched"
        },
        "tokenEfficiency": {
            "name": "Token Efficiency",
            "value": gameState.attempts > 0 ? 
                (gameState.totalTokens / gameState.attempts) : 0,
            "unit": "tokens_per_attempt",
            "description": "Average tokens consumed per attempt"
        },
        "attemptEfficiency": {
            "name": "Attempt Efficiency",
            "value": gameState.matchedWords.size > 0 ? 
                (gameState.attempts / gameState.matchedWords.size) : 0,
            "unit": "attempts_per_word",
            "description": "Average attempts needed per matched word"
        },
        "completionScore": {
            "name": "Completion Score",
            "value": gameState.gameOver && gameState.matchedWords.size === gameState.targetWords.length ? 
                calculateEfficiencyScore() : null,
            "unit": "score",
            "description": "Overall efficiency score (lower is better)"
        }
    };
}

function calculateMetrics() {
    const promptLengths = gameState.responseTrail.map(t => t.prompt.length);
    const responseLengths = gameState.responseTrail.map(t => t.response.length);
    const tokenCounts = gameState.responseTrail.map(t => t.totalTokens);
    
    return {
        "@type": "Metric",
        "promptMetrics": {
            "averageLength": average(promptLengths),
            "minLength": Math.min(...promptLengths, Infinity),
            "maxLength": Math.max(...promptLengths, -Infinity),
            "totalPrompts": promptLengths.length
        },
        "responseMetrics": {
            "averageLength": average(responseLengths),
            "minLength": Math.min(...responseLengths, Infinity),
            "maxLength": Math.max(...responseLengths, -Infinity),
            "totalResponses": responseLengths.length
        },
        "tokenMetrics": {
            "totalTokens": gameState.totalTokens,
            "averagePerAttempt": average(tokenCounts),
            "minPerAttempt": Math.min(...tokenCounts, Infinity),
            "maxPerAttempt": Math.max(...tokenCounts, -Infinity),
            "promptTokensTotal": gameState.responseTrail.reduce((sum, t) => sum + t.promptTokens, 0),
            "outputTokensTotal": gameState.responseTrail.reduce((sum, t) => sum + t.outputTokens, 0)
        },
        "timingMetrics": {
            "sessionDuration": gameState.sessionEndTime ? 
                new Date(gameState.sessionEndTime) - new Date(gameState.sessionStartTime) :
                Date.now() - new Date(gameState.sessionStartTime),
            "averageTimeBetweenAttempts": calculateAverageTimeBetweenAttempts()
        },
        "eventMetrics": {
            "totalEvents": gameState.events.length,
            "eventTypes": countEventTypes(),
            "apiCalls": gameState.events.filter(e => e.eventType === 'api_response_received').length,
            "errors": gameState.events.filter(e => e.eventType === 'api_error').length
        }
    };
}

function average(arr) {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length);
}

function calculateAverageTimeBetweenAttempts() {
    if (gameState.responseTrail.length < 2) return 0;
    
    const timestamps = gameState.responseTrail
        .map(t => new Date(t.isoTimestamp || t.timestamp).getTime())
        .sort((a, b) => a - b);
    
    let totalDiff = 0;
    for (let i = 1; i < timestamps.length; i++) {
        totalDiff += timestamps[i] - timestamps[i - 1];
    }
    
    return Math.round(totalDiff / (timestamps.length - 1));
}

function countEventTypes() {
    const counts = {};
    gameState.events.forEach(event => {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    });
    return counts;
}

function exportSessionData() {
    const jsonld = generateJSONLD();
    const dataStr = JSON.stringify(jsonld, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/ld+json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `art-of-intent-session-${gameState.sessionId}-${new Date().toISOString().split('T')[0]}.jsonld`;
    link.click();
    
    trackEvent('session_exported', {
        sessionId: gameState.sessionId,
        fileSize: dataStr.length,
        attempts: gameState.attempts,
        totalTokens: gameState.totalTokens
    });
    
    // Update schema metadata to reflect export
    updateSchemaMetadata();
    
    console.log('Session data exported:', jsonld);
}

// ============================================
// User Info Helper
// ============================================

function getUserDisplayInfo() {
    // Try to get from Firebase profile first
    if (window.firebaseAuth && window.firebaseAuth.getUserProfile) {
        const profile = window.firebaseAuth.getUserProfile();
        if (profile) {
            return {
                userName: profile.displayName || 'Guest',
                userPhoto: profile.photoURL || null
            };
        }
    }
    
    // Fallback to auth user
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    return {
        userName: user?.displayName || user?.email || 'Guest',
        userPhoto: user?.photoURL || null
    };
}

// ============================================
// Getting Started / Help Modal
// ============================================

function checkFirstTimeUser() {
    const hasSeenHelp = localStorage.getItem('hasSeenGettingStarted');
    if (!hasSeenHelp) {
        // Show help modal after a brief delay for better UX
        setTimeout(() => {
            showGettingStarted();
            localStorage.setItem('hasSeenGettingStarted', 'true');
        }, 500);
    }
}

function showGettingStarted() {
    const modal = document.getElementById('gettingStartedModal');
    if (modal) {
        modal.classList.remove('hidden');
        trackEvent('help_viewed', { source: 'manual' });
    }
}

function closeGettingStarted() {
    const modal = document.getElementById('gettingStartedModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
