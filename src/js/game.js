// ============================================
// ASCII Chart Utilities
// ============================================

// Import analytics
import { GameAnalytics, UserAnalytics } from './analytics.js';

// Import Firebase Functions
import { functions, httpsCallable, db, collection, doc, getDoc } from './firebase-config.js';

// Arty thinking remarks — loaded from JSON, fallback if fetch fails
let artyRemarks = ['contemplating...'];
fetch('src/data/arty-remarks.json')
    .then(r => r.json())
    .then(data => { if (Array.isArray(data.remarks)) artyRemarks = data.remarks; })
    .catch(() => {});

// Track if last input was via voice
let lastInputWasVoice = false;

// System prompt token overhead (approximate, measured from API)
// This is subtracted from promptTokens to show only user's contribution
const SYSTEM_PROMPT_TOKENS = 915;

// Text-to-Speech function
function speakText(text) {
    try {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (window.themeManager) {
            const settings = window.themeManager.getVoiceSettings();
            if (settings.voice) utterance.voice = settings.voice;
            utterance.rate = settings.rate;
            utterance.pitch = settings.pitch;
            utterance.volume = settings.volume;
        } else {
            utterance.rate = 0.7;
            utterance.pitch = 0.9;
            utterance.volume = 1.0;
        }

        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.warn('speakText failed (non-fatal):', err);
    }
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
    creepPerViolation: 25,      // NEW: Creep added per blacklist word
    dictionaryHaikus: null,     // Dictionary haikus per target word (from Firestore)
    aiEvaluation: null,         // AI benchmark evaluation (from Firestore, revealed post-game)
    cheated: false,             // True if any cheat code was used this session
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
    dismissSplash();
});

function dismissSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // Reveal "Ready." line
    const readyLine = document.getElementById('splash-ready');
    if (readyLine) readyLine.style.opacity = '1';

    // Hold on "Ready." long enough to read, then fade out
    setTimeout(() => {
        splash.classList.add('dismissed');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, 1400);
}

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
        // dictionaryHaikus and aiEvaluation are server-side data, not game progress —
        // always fetch fresh from Firestore so they're available on resumed sessions.
        try {
            const docRef = doc(db, 'dailyWords', today);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                gameState.dictionaryHaikus = data.dictionaryHaikus || null;
                gameState.aiEvaluation = data.aiEvaluation || null;
            }
        } catch (e) {
            console.warn('⚠️ Could not fetch dictionary/eval data:', e.message);
        }
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
        revealTrainingLog();
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
            gameState.dictionaryHaikus = data.dictionaryHaikus || null;
            gameState.aiEvaluation = data.aiEvaluation || null;
            
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

    // Char counter
    const charCounter = document.getElementById('charCounter');
    const MAX_PROMPT = 500;
    promptInput.addEventListener('input', () => {
        const len = promptInput.value.length;
        if (charCounter) {
            charCounter.textContent = `${len} / ${MAX_PROMPT}`;
            charCounter.classList.toggle('warn', len >= MAX_PROMPT * 0.8 && len < MAX_PROMPT * 0.95);
            charCounter.classList.toggle('danger', len >= MAX_PROMPT * 0.95);
        }
    });

    // Keep input above virtual keyboard on mobile (visualViewport API)
    if (window.visualViewport) {
        const inputSection = document.querySelector('.input-section');
        window.visualViewport.addEventListener('resize', () => {
            if (!inputSection || window.innerWidth > 768) return;
            const gap = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
            inputSection.style.bottom = gap > 50 ? `${gap}px` : '';
        });
    }

    voiceBtn.addEventListener('click', handleVoiceInput);
    closeModalBtn.addEventListener('click', closeModal);
    shareBtn.addEventListener('click', shareScore);
    previewCardBtn.addEventListener('click', previewShareCard);
    shareWithTextBtn.addEventListener('click', shareWithText);

    // Adapt button labels to platform
    if (navigator.share) {
        if (shareBtn) shareBtn.textContent = 'Share Card';
        if (shareWithTextBtn) shareWithTextBtn.textContent = 'Share';
    }
    
    // Help modal
    if (helpBtn) {
        helpBtn.addEventListener('click', showGettingStarted);
    }
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', closeGettingStarted);
    }

    // Dictionary modal
    const closeDictionaryBtn = document.getElementById('closeDictionaryBtn');
    const dictionaryModal = document.getElementById('dictionaryModal');
    if (closeDictionaryBtn) {
        closeDictionaryBtn.addEventListener('click', closeDictionary);
    }
    if (dictionaryModal) {
        dictionaryModal.addEventListener('click', (e) => {
            if (e.target === dictionaryModal) closeDictionary();
        });
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

// ============================================
// Arty Thinking Placeholder
// ============================================

function getRandomRemark(exclude = new Set()) {
    const pool = artyRemarks.filter(r => !exclude.has(r));
    const source = pool.length > 0 ? pool : artyRemarks;
    return source[Math.floor(Math.random() * source.length)];
}

function showArtyThinking() {
    const trail = document.getElementById('trailContainer');
    if (!trail) return null;

    const remark = getRandomRemark();
    const el = document.createElement('div');
    el.id = 'arty-thinking';
    el.className = 'trail-item trail-item--thinking';
    el.innerHTML = `
        <div class="thinking-header">
            <span class="thinking-label">ARTY</span>
            <span class="loading" aria-hidden="true"></span>
        </div>
        <div class="thinking-remark">${remark}</div>
    `;
    trail.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Cycle remarks every 2.5 s
    const remarkEl = el.querySelector('.thinking-remark');
    const seen = new Set([remark]);
    el._remarkInterval = setInterval(() => {
        const next = getRandomRemark(seen);
        seen.add(next);
        remarkEl.classList.add('thinking-remark--fade');
        setTimeout(() => {
            remarkEl.textContent = next;
            remarkEl.classList.remove('thinking-remark--fade');
        }, 300);
    }, 2500);

    return el;
}

function removeArtyThinking(el) {
    if (!el) return;
    clearInterval(el._remarkInterval);
    el.remove();
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
    
    // ── Cheat code detection ─────────────────────────────────────────────────
    if (window.CheatCodes) {
        const cheatMatch = window.CheatCodes.detectCheatCode(sanitizedPrompt);
        if (cheatMatch) {
            promptInput.value = '';
            processCheatResponse(cheatMatch.code);
            return;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

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

    const thinkingEl = showArtyThinking();
    const apiCallStart = Date.now();

    try {
        const response = await callArtyAPI(sanitizedPrompt);
        const apiCallDuration = Date.now() - apiCallStart;

        trackEvent('api_response_received', {
            duration: apiCallDuration,
            hasResponse: !!response
        });

        removeArtyThinking(thinkingEl);
        processResponse(sanitizedPrompt, response, purifyResult);
    } catch (error) {
        removeArtyThinking(thinkingEl);
        console.error('Error calling API:', error);
        const duration = Date.now() - apiCallStart;
        trackEvent('api_error', { error: error.message, duration });
        GameAnalytics.apiError('api_call_failed', error.message);
        showArtyError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Prompt';
        promptInput.value = '';
    }
}

async function callArtyAPI(userPrompt) {
    try {
        const artyGenerateHaiku = httpsCallable(functions, 'artyGenerateHaiku');
        const result = await artyGenerateHaiku({
            userPrompt,
            sessionId: gameState.sessionId
        });

        if (!result.data.success) {
            throw new Error(result.data.error || 'Failed to generate haiku');
        }

        return result.data.data;

    } catch (error) {
        console.error('Firebase function error:', error);

        // Map Firebase HttpsError codes to user-facing messages.
        // error.code is the HttpsError code; error.details carries structured info from the function.
        const retryAfter = error.details?.retryAfterSeconds;
        switch (error.code) {
            case 'unauthenticated':
                throw new Error('Please sign in to play.');
            case 'invalid-argument':
                throw new Error('Your prompt was rejected. Please try a different approach.');
            case 'resource-exhausted':
                throw new Error(
                    retryAfter
                        ? `Arty is resting. Try again in ${retryAfter}s.`
                        : 'Too many requests. Please wait a moment and try again.'
                );
            case 'unavailable':
                throw new Error('Arty is temporarily unavailable. Please try again shortly.');
            case 'deadline-exceeded':
                throw new Error('Arty took too long to respond. Please try again.');
            case 'not-found':
                throw new Error("Today's words aren't loaded yet. Try refreshing the page.");
            case 'permission-denied':
                throw new Error('Service configuration error. Please contact support.');
            default:
                throw new Error(error.message || 'Could not reach Arty. Please try again.');
        }
    }
}


/**
 * Display an API error inline in the response trail instead of blocking with alert().
 * Keeps the user in context and preserves their prompt text.
 */
function showArtyError(message) {
    const trail = document.getElementById('trailContainer');
    if (!trail) { showToast(message, 'error'); return; }

    // Remove any previous error entry (avoid stacking)
    const prev = trail.querySelector('.trail-error');
    if (prev) prev.remove();

    const el = document.createElement('div');
    el.className = 'trail-error';
    el.innerHTML = `
        <span class="trail-error-icon">⚠</span>
        <span class="trail-error-msg">${message}</span>
    `;
    trail.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-remove after 8 s so stale errors don't confuse later attempts
    setTimeout(() => el.remove(), 8000);
}

function processResponse(prompt, apiResponse, securityAnalysis = null) {
    gameState.attempts++;
    
    // apiResponse is result.data.data = { fullResponse, userPromptTokens, systemPromptTokens, ... }
    const geminiResponse = apiResponse.fullResponse || apiResponse;
    const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const usageMetadata = geminiResponse.usageMetadata || {};

    // Get raw token counts from API
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    // Use server-computed user token count; fall back to heuristic if older function version
    const userPromptTokens = apiResponse.userPromptTokens
        ?? Math.max(0, (usageMetadata.promptTokenCount || 0) - SYSTEM_PROMPT_TOKENS);
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
    
    // If voice input was used, read the response back (isolated — must never interrupt game logic)
    if (lastInputWasVoice) {
        lastInputWasVoice = false;
        try { speakText(responseText); } catch (err) { console.warn('speakText error:', err); }
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

        // Save to Firestore — skip if the player used a cheat code
        if (window.saveGameToFirestore && !gameState.cheated) {
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

/**
 * Handle a cheat-code prompt.
 *
 * Picks the first remaining unmatched target word, generates a tongue-in-cheek
 * haiku that contains it, and records the attempt in the trail — but marks
 * the session as cheated so no leaderboard entry is created.
 */
function processCheatResponse(cheatCode) {
    if (gameState.gameOver) return;

    gameState.cheated = true;
    gameState.attempts++;

    // Pick the first unmatched target word to gift the player.
    const unmatchedWords = gameState.targetWords.filter(
        (w) => !gameState.matchedWords.has(w)
    );
    const giftedWord = unmatchedWords.length > 0
        ? unmatchedWords[0]
        : gameState.targetWords[0];

    const responseText = cheatCode.funResponse(giftedWord);

    // Mark the gifted word as found.
    const previousMatchCount = gameState.matchedWords.size;
    gameState.matchedWords.add(giftedWord);

    // No tokens consumed — this was free!
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: `✦ ${cheatCode.lines.join(' / ')}`,
        response: responseText,
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        foundWords: [giftedWord],
        matchedSoFar: [...gameState.matchedWords],
        isCheat: true,
        cheatCode: {
            id: cheatCode.id,
            title: cheatCode.title,
            author: cheatCode.author,
            year: cheatCode.year,
            wink: cheatCode.wink,
        },
    };

    gameState.responseTrail.push(trailItem);

    if (typeof soundManager !== 'undefined') soundManager.playCheatCode();

    saveGameState();
    updateUI();

    trackEvent('cheat_code_used', {
        cheatCodeId: cheatCode.id,
        giftedWord,
        attemptNumber: gameState.attempts,
    });

    // Win condition check (same as normal).
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

    // Save to Firestore — skip if the player used a cheat code
    if (window.saveGameToFirestore && !gameState.cheated) {
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

    // Save to Firestore — skip if the player used a cheat code
    if (window.saveGameToFirestore && !gameState.cheated) {
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
    
    // Save to Firestore — skip if the player used a cheat code
    if (window.saveGameToFirestore && !gameState.cheated) {
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
                    <button id="shareScoreBtn" class="btn-primary" style="min-width: 120px;">${navigator.share ? 'Share Card' : 'Share Image'}</button>
                    <button id="shareWithTextScoreBtn" class="btn-primary" style="min-width: 120px;">${navigator.share ? 'Share' : 'Share to Social'}</button>
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
    
    const cheatBanner = gameState.cheated ? `
        <div style="background: var(--bg-secondary); border: 1px solid var(--dos-yellow, #f0c040); padding: var(--spacing-sm) var(--spacing-md); margin-bottom: var(--spacing-md); font-size: 11px; text-align: center; color: var(--dos-yellow, #f0c040);">
            ✦ CHEAT CODE SESSION — score not counted on the leaderboard ✦<br>
            <a href="cheat-the-code.html" target="_blank" style="color: inherit; text-decoration: underline; opacity: 0.8;">view all cheat codes</a>
        </div>
    ` : '';

    if (isWin) {
        modalTitle.textContent = gameState.cheated ? 'VICTORY! (✦ cheated)' : 'VICTORY!';
        modalBody.innerHTML = `
            ${cheatBanner}
            <p style="text-align: center; color: var(--success-color); margin-bottom: var(--spacing-md);">
                You successfully guided Arty to speak all target words!
            </p>
            <div style="background: var(--bg-primary); border: 1px solid var(--success-color); padding: var(--spacing-md); font-family: inherit; font-size: 12px;">
                <div style="margin-bottom: var(--spacing-xs);">ATTEMPTS: ${gameState.attempts}/10</div>
                <div style="margin-bottom: var(--spacing-xs);">TOKENS: ${gameState.totalTokens}</div>
                <div style="margin-bottom: var(--spacing-xs);">EFFICIENCY: ${efficiency} tok/att [${efficiencyBar}]</div>
                ${gameState.cheated ? '<div style="color: var(--dos-yellow, #f0c040);">SCORE: not ranked (cheat session)</div>' : `<div>SCORE: ${calculateEfficiencyScore()}</div>`}
            </div>
            <p style="text-align: center; color: var(--text-dim); margin-top: var(--spacing-md); font-size: 11px;">
                Come back tomorrow for a new challenge!
            </p>
        `;
    } else {
        modalTitle.textContent = 'GAME OVER';
        modalBody.innerHTML = `
            ${cheatBanner}
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
    
    // AI benchmark section — hidden pending redesign
    // TODO: rethink aiEvaluation UX (see docs/future-work.md)
    if (false) { // eslint-disable-line no-constant-condition
        const benchmarkHTML = buildAIBenchmarkHTML();
        if (benchmarkHTML) {
            const benchmarkDiv = document.createElement('div');
            benchmarkDiv.innerHTML = DOMPurify.sanitize(benchmarkHTML);
            modalBody.appendChild(benchmarkDiv);

            const toggle = modalBody.querySelector('.ai-benchmark-toggle');
            const benchContent = modalBody.querySelector('.ai-benchmark-content');
            if (toggle && benchContent) {
                toggle.addEventListener('click', () => {
                    const isHidden = benchContent.classList.toggle('hidden');
                    toggle.textContent = (isHidden ? '▶' : '▼') + ' Compare with AI';
                });
            }
        }
    } // end if (false) — benchmark hidden

    // Morph input section to share buttons
    morphInputToShare();

    // Reveal training log tab and populate it
    revealTrainingLog();

    modal.classList.remove('hidden');
}

/**
 * Build the HTML for the AI benchmark section shown in the game-over modal.
 * Returns empty string if aiEvaluation data is unavailable.
 */
function buildAIBenchmarkHTML() {
    const ev = gameState.aiEvaluation?.fullRun;
    if (!ev || !ev.attempts?.length) return '';

    const aiSummary = ev.won
        ? `Solved in ${ev.totalAttempts} attempt${ev.totalAttempts === 1 ? '' : 's'} · ${ev.totalTokens} tokens`
        : `Matched ${ev.attempts[ev.attempts.length - 1]?.cumulativeMatched?.length ?? 0}/${gameState.targetWords.length} words in ${ev.totalAttempts} attempts`;

    const playerSummary = `${gameState.attempts} attempt${gameState.attempts === 1 ? '' : 's'} · ${gameState.totalTokens} tokens`;

    const attemptsHTML = ev.attempts.map(a => {
        const matchedLabel = a.wordsFoundThisRound.length > 0
            ? `Matched: ${a.wordsFoundThisRound.join(' · ')}`
            : 'No new matches';
        const allDone = a.cumulativeMatched.length === gameState.targetWords.length;
        return `
            <div class="ai-attempt-block">
                <div class="ai-attempt-label">ATTEMPT ${a.attemptNumber}${allDone ? ' ✓' : ''}</div>
                <div class="ai-attempt-prompt">"${DOMPurify.sanitize(a.prompt)}"</div>
                <div class="ai-attempt-response">${DOMPurify.sanitize(a.response).replace(/\n/g, '<br>')}</div>
                <div class="ai-attempt-matched">${matchedLabel}</div>
            </div>`;
    }).join('');

    return `
        <div class="ai-benchmark-toggle">▶ Compare with AI</div>
        <div class="ai-benchmark-content hidden">
            <div class="ai-benchmark-compare">
                <span><strong>AI:</strong> ${aiSummary}</span>
                <span><strong>You:</strong> ${playerSummary}</span>
            </div>
            ${attemptsHTML}
        </div>`;
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

/**
 * Brief toast notification — replaces all alert() calls in share flows.
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 */
function showToast(message, type = 'info') {
    const existing = document.getElementById('shareToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'shareToast';
    const colors = { success: 'var(--accent-green)', error: 'var(--accent-red)', info: 'var(--accent-blue)' };
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: var(--bg-secondary); border: 1px solid ${colors[type] || colors.info};
        color: var(--text-primary); padding: 10px 20px; border-radius: 6px;
        font-size: 14px; z-index: 9999; white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: toastIn 0.2s ease;
    `;
    toast.textContent = message;

    // Inject keyframe once
    if (!document.getElementById('toastStyle')) {
        const s = document.createElement('style');
        s.id = 'toastStyle';
        s.textContent = '@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }';
        document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Build the hook text used in native share sheets and social posts.
 * Includes the first line of the best matching haiku as an intriguing preview.
 */
function buildShareText() {
    const isWin = gameState.matchedWords.size === gameState.targetWords.length;
    const bestAttempt = (gameState.responseTrail || [])
        .filter(a => a.foundWords && a.foundWords.length > 0)
        .sort((a, b) => b.foundWords.length - a.foundWords.length)[0];

    const firstLine = bestAttempt?.response?.trim().split('\n')[0] || '';
    const haikuHint = firstLine ? `\n"${firstLine}…"` : '';

    if (isWin) {
        return `🎯 Art of Intent — ${gameState.matchedWords.size}/${gameState.targetWords.length} words in ${gameState.attempts} attempts${haikuHint}\n\nCan you beat it? → https://art-of-intent.netlify.app`;
    } else {
        return `🎮 Art of Intent — ${gameState.matchedWords.size}/${gameState.targetWords.length} words. This haiku bot is tricky!${haikuHint}\n\nTry today's puzzle → https://art-of-intent.netlify.app`;
    }
}

function buildCardData(userName, userPhoto) {
    const isWin = gameState.matchedWords.size === gameState.targetWords.length;
    const efficiency = gameState.attempts > 0
        ? (gameState.totalTokens / gameState.attempts).toFixed(1) : '0.0';
    return {
        result: isWin ? 'WIN' : 'LOSS',
        attempts: gameState.attempts,
        tokens: gameState.totalTokens,
        matches: `${gameState.matchedWords.size}/${gameState.targetWords.length}`,
        efficiency,
        date: new Date().toLocaleDateString('en-CA'),
        userName,
        userPhoto,
        globalMaxTokens: 1000,
        responseTrail: gameState.responseTrail || [],
        targetWords: gameState.targetWords || [],
        matchedWords: [...(gameState.matchedWords || [])],
        creepLevel: gameState.creepLevel || 0,
        creepThreshold: gameState.creepThreshold || 100,
        cheated: gameState.cheated || false,
        efficiencyScore: gameState.cheated ? null : calculateEfficiencyScore(),
    };
}

async function shareScore() {
    UserAnalytics.shareClick('image');

    if (typeof shareCardGenerator === 'undefined') {
        const shareText = buildShareText();
        if (navigator.share) {
            navigator.share({ title: 'Art of Intent', text: shareText, url: 'https://art-of-intent.netlify.app' })
                .catch(err => { if (err.name !== 'AbortError') console.error(err); });
        } else {
            navigator.clipboard.writeText(shareText);
            showToast('Score copied to clipboard!', 'success');
        }
        return;
    }

    try {
        const { userName, userPhoto } = getUserDisplayInfo();
        const cardData = buildCardData(userName, userPhoto);
        const svg = shareCardGenerator.generateSVG(cardData, 'v6');
        const shareText = buildShareText();

        const outcome = await shareCardGenerator.shareImage(svg, 'Art of Intent', shareText);
        if (outcome === 'downloaded') showToast('Card saved — share it anywhere!', 'success');

    } catch (error) {
        console.error('Error sharing image:', error);
        try {
            await navigator.clipboard.writeText(buildShareText());
            showToast('Could not share image. Score copied instead.', 'info');
        } catch { /* clipboard denied */ }
    }
}

function previewShareCard() {
    if (typeof shareCardGenerator === 'undefined') {
        showToast('Share card not available', 'error');
        return;
    }

    try {
        const { userName, userPhoto } = getUserDisplayInfo();
        const cardData = buildCardData(userName, userPhoto);
        const svg = shareCardGenerator.generateSVG(cardData, 'v6');
        shareCardGenerator.previewImage(svg);
    } catch (error) {
        console.error('Error previewing card:', error);
        showToast('Could not generate preview', 'error');
    }
}

async function shareWithText() {
    UserAnalytics.shareClick('text');

    const shareText = buildShareText();

    if (typeof shareCardGenerator === 'undefined') {
        if (navigator.share) {
            navigator.share({ title: 'Art of Intent', text: shareText, url: 'https://art-of-intent.netlify.app' })
                .catch(err => { if (err.name !== 'AbortError') console.error(err); });
        } else {
            navigator.clipboard.writeText(shareText);
            showToast('Score copied to clipboard!', 'success');
        }
        return;
    }

    try {
        const { userName, userPhoto } = getUserDisplayInfo();
        const cardData = buildCardData(userName, userPhoto);
        const svg = shareCardGenerator.generateSVG(cardData, 'v6');

        if (navigator.share) {
            // Mobile: native share sheet handles image + text together
            const outcome = await shareCardGenerator.shareImage(svg, 'Art of Intent', shareText);
            if (outcome === 'downloaded') showToast('Card saved — share it anywhere!', 'success');
        } else {
            // Desktop: download card + copy text to clipboard
            await shareCardGenerator.downloadImage(svg);
            await navigator.clipboard.writeText(shareText);
            showToast('Card downloaded + text copied!', 'success');
        }

    } catch (error) {
        console.error('Error sharing:', error);
        try {
            await navigator.clipboard.writeText(shareText);
            showToast('Could not share image. Text copied instead.', 'info');
        } catch { /* clipboard denied */ }
    }
}

function copyWithTrail() {
    const shareText = generateShareText(true);
    navigator.clipboard.writeText(shareText)
        .then(() => showToast('Score + trail copied!', 'success'))
        .catch(() => showToast('Could not copy to clipboard', 'error'));
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
    container.innerHTML = '';
    gameState.targetWords.forEach(word => {
        const matched = gameState.matchedWords.has(word);
        const hasDict = !!gameState.dictionaryHaikus?.[word];

        const tag = document.createElement('span');
        tag.className = `word-tag${matched ? ' matched' : ''}${hasDict ? ' has-dict' : ''}`;
        if (matched) {
            tag.style.opacity = '0.5';
        }
        tag.textContent = DOMPurify.sanitize(word);
        if (hasDict) {
            tag.title = `View example haikus for "${word}"`;
            tag.addEventListener('click', () => showDictionary(word));
        }
        container.appendChild(tag);
    });
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
        if (item.isCheat) itemClass = 'trail-item--cheat';
        else if (isVictory) itemClass = 'trail-item--victory';
        else if (isDefeat) itemClass = 'trail-item--violation';
        else if (item.foundWords && item.foundWords.length > 0) itemClass = 'trail-item--success';

        let headerIcon = '';
        if (item.isCheat) headerIcon = `✦ CHEAT CODE — ${DOMPurify.sanitize(item.cheatCode.title)}`;
        else if (isVictory) headerIcon = 'VICTORY';
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
                ${item.isCheat ? `
                    <div class="cheat-badge">
                        <span class="cheat-badge-icon">✦</span>
                        <span class="cheat-badge-text">${DOMPurify.sanitize(item.cheatCode.author)}, ${DOMPurify.sanitize(item.cheatCode.year)}</span>
                        <span class="cheat-badge-sep">·</span>
                        <span class="cheat-badge-wink">${DOMPurify.sanitize(item.cheatCode.wink)}</span>
                        <span class="cheat-badge-sep">·</span>
                        <a href="cheat-the-code.html" class="cheat-badge-link" target="_blank">all cheat codes →</a>
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

// ============================================
// ============================================
// Training Log
// ============================================

async function revealTrainingLog() {
    const tabs = document.getElementById('trailTabs');
    if (tabs) tabs.removeAttribute('hidden');

    // Wire tab switching — clone to avoid duplicate listeners on repeated calls
    tabs?.querySelectorAll('.filter-btn').forEach(btn => {
        const fresh = btn.cloneNode(true);
        btn.parentNode.replaceChild(fresh, btn);
        fresh.addEventListener('click', () => {
            const tab = fresh.dataset.tab;
            tabs.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === fresh));
            document.getElementById('trailContainer').classList.toggle('hidden', tab !== 'trail');
            document.getElementById('trainingLogContainer').classList.toggle('hidden', tab !== 'training');
        });
    });

    // Show loading state immediately, then fetch field stats and render
    const container = document.getElementById('trainingLogContainer');
    if (!container) return;
    container.innerHTML = `<div class="tlog-empty">loading session analysis...</div>`;

    let fieldStats = null;
    try {
        if (typeof fetchLeaderboardData === 'function') {
            fieldStats = await fetchLeaderboardData();
        }
    } catch (e) {
        console.warn('Could not fetch field stats for training log:', e.message);
    }
    container.innerHTML = buildTrainingLogHTML(fieldStats);
}

function buildTrainingLogHTML(fieldStats) {
    const ev = gameState.aiEvaluation;
    const date = new Date().toISOString().split('T')[0];

    if (!ev?.zeroShot || !ev?.oneShot) {
        return `<div class="tlog-empty">No training data for today yet.<br>Check back after midnight UTC.</div>`;
    }

    const { zeroShot, oneShot, summary, wordDifficulty, model } = ev;
    const modelShort = (model || 'gemini').split('-').slice(0, 3).join('-');

    // ── User stats ──
    const userAttempts = gameState.attempts;
    const userTokens   = gameState.totalTokens;
    const userScore    = calculateEfficiencyScore();
    const isWin        = gameState.matchedWords.size === gameState.targetWords.length;
    const userResult   = isWin ? 'WIN' : `${gameState.matchedWords.size}/${gameState.targetWords.length}`;

    // ── AI stats ──
    // Use same char-based estimation as user trail (Math.ceil(text.length / 4)) so the
    // comparison is apples-to-apples. summary.totalTokens includes system-prompt and
    // strategy-generation overhead from both API calls, which the user's score never sees.
    const aiTokens =
        Math.ceil((zeroShot.prompt?.length    || 0) / 4) + Math.ceil((zeroShot.response?.length || 0) / 4) +
        Math.ceil((oneShot.prompt?.length     || 0) / 4) + Math.ceil((oneShot.response?.length  || 0) / 4);
    // oneShotScore is already cumulative (includes zero-shot matches) — don't add zeroShotScore
    const aiResult = summary.converged ? 'WIN'
        : `${summary.oneShotScore || 0}/${gameState.targetWords.length}`;

    // ── Field stats ──
    const fstats     = fieldStats?.stats   || {};
    const topPlayers = fieldStats?.topPlayers || [];
    const avgAttempts = fstats.avgAttempts ? (+fstats.avgAttempts).toFixed(1) : '—';
    const avgTokens   = fstats.avgTokens   ? fstats.avgTokens.toLocaleString() : '—';
    const gamesToday  = fstats.gamesToday  || null;

    // Approximate rank by counting top players with a better score (lower = better)
    let rankStr = '';
    if (topPlayers.length && gamesToday) {
        const beatenBy = topPlayers.filter(p => {
            const pScore = (p.attempts * 10) + Math.floor((p.tokens || 0) / 10);
            return pScore < userScore;
        }).length;
        rankStr = `#${beatenBy + 1} of ${gamesToday}`;
    }

    // ── Section 1: SESSION ANALYSIS ──
    const scorecardHTML = `
    <div class="tlog-section">
        <div class="tlog-sect-hd">&gt; SESSION ANALYSIS <span class="tlog-sect-meta">${date} · ${DOMPurify.sanitize(modelShort)}</span></div>
        <table class="tlog-table">
            <thead>
                <tr>
                    <th></th>
                    <th>YOU</th>
                    <th>AI</th>
                    <th>TODAY</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="tlog-row-label">ATTEMPTS</td>
                    <td class="tlog-you">${userAttempts}</td>
                    <td>2 probes</td>
                    <td>avg ${avgAttempts}</td>
                </tr>
                <tr>
                    <td class="tlog-row-label">TOKENS</td>
                    <td class="tlog-you">${userTokens.toLocaleString()}</td>
                    <td>${aiTokens}</td>
                    <td>avg ${avgTokens}</td>
                </tr>
                <tr>
                    <td class="tlog-row-label">RESULT</td>
                    <td class="tlog-you ${isWin ? 'tlog-win' : 'tlog-miss'}">${userResult}</td>
                    <td class="${summary.converged ? 'tlog-win' : 'tlog-miss'}">${aiResult}</td>
                    <td>${gamesToday ? gamesToday + ' played' : '—'}</td>
                </tr>
                ${rankStr ? `<tr>
                    <td class="tlog-row-label">RANK</td>
                    <td class="tlog-you tlog-rank" colspan="3">${rankStr}</td>
                </tr>` : ''}
            </tbody>
        </table>
    </div>`;

    // ── Section 2: TRAINING RUN ──
    function probeBlock(stepNum, label, sublabel, probe) {
        const matchedHTML = probe.wordsMatched.length > 0
            ? `<div class="match-indicator">
                <strong>matched:</strong>
                ${probe.wordsMatched.map(w => `<span class="match-word found">${DOMPurify.sanitize(w)}</span>`).join('')}
               </div>`
            : `<div class="match-indicator"><span class="match-word not-found">no match</span></div>`;

        const blacklistFlag = probe.blacklistHit
            ? `<div class="feedback-inline feedback-inline--darkness"><span class="feedback-icon">▓</span><span class="feedback-label">blacklist hit in response</span></div>` : '';

        // Mirror the user-trail token logic:
        // promptTokens = Math.ceil(prompt.length / 4) — same formula the server uses for userPromptTokens
        // outputTokens = Math.ceil(response.length / 4) — char-based estimate (no candidatesTokenCount available)
        // total = sum of both, excluding system-prompt and strategy-generation overhead (t1+t2 totals)
        const promptEst = Math.ceil((probe.prompt?.length   || 0) / 4);
        const outputEst = Math.ceil((probe.response?.length || 0) / 4);
        const totalEst  = promptEst + outputEst;
        const tokenBar  = generateTrailStats(
            { promptTokens: promptEst, outputTokens: outputEst, totalTokens: totalEst },
            probe.wordsMatched
        );

        return `
        <div class="trail-item tlog-probe-item ${probe.wordsMatched.length > 0 ? 'trail-item--success' : ''}">
            <div class="trail-header">
                <span class="trail-number">PROBE ${stepNum} — ${label}</span>
                <span class="trail-timestamp">${sublabel}</span>
            </div>
            <div class="tlog-probe-prompt">${DOMPurify.sanitize(probe.prompt)}</div>
            <div class="trail-response">${DOMPurify.sanitize(probe.response)}</div>
            ${blacklistFlag}
            ${matchedHTML}
            <div class="trail-stats">${tokenBar}</div>
        </div>`;
    }

    const delta = summary.improvementDelta || 0;
    const deltaHTML = delta > 0
        ? `<div class="tlog-delta tlog-delta--up">▲ +${delta} word${delta > 1 ? 's' : ''} surfaced after feedback</div>`
        : delta === 0 && (summary.zeroShotScore || 0) > 0
            ? `<div class="tlog-delta tlog-delta--flat">◆ no change — strong zero-shot baseline</div>`
            : `<div class="tlog-delta tlog-delta--down">▼ no improvement — word difficulty held</div>`;

    const trainingRunHTML = `
    <div class="tlog-section">
        <div class="tlog-sect-hd">TRAINING RUN</div>
        ${probeBlock(1, 'ZERO SHOT', 'no hints. first instinct.', zeroShot)}
        ${deltaHTML}
        ${probeBlock(2, 'ONE SHOT', 'given feedback. one chance to adapt.', oneShot)}
    </div>`;

    // ── Section 3: THE SIGNAL ──
    const diffChips = wordDifficulty ? gameState.targetWords.map(w => {
        const d = wordDifficulty[w];
        if (!d) return '';
        const cls = { low: 'ok', medium: 'warn', high: 'err' }[d.difficulty] || 'warn';
        return `<span class="tlog-word-diff"><span class="tlog-word-name">${DOMPurify.sanitize(w)}</span><span class="tlog-badge tlog-badge--${cls}">${d.difficulty.toUpperCase()}</span></span>`;
    }).join('') : '';

    let verdictLine;
    if (isWin && !summary.converged) {
        verdictLine = `<span class="tlog-signal-val tlog-win">you solved it. AI didn't.</span>`;
    } else if (isWin && summary.converged) {
        verdictLine = userTokens < aiTokens
            ? `<span class="tlog-signal-val tlog-win">both solved it — you used fewer tokens</span>`
            : `<span class="tlog-signal-val">both solved it — AI used fewer tokens (${aiTokens})</span>`;
    } else {
        verdictLine = summary.converged
            ? `<span class="tlog-signal-val tlog-miss">AI solved it. You didn't.</span>`
            : `<span class="tlog-signal-val">neither converged — hard words today</span>`;
    }

    const mechanismNote = summary.converged
        ? 'one-shot feedback was enough — the model adapted in context'
        : summary.hardestWord
            ? `"${DOMPurify.sanitize(summary.hardestWord)}" resisted both probes`
            : 'two probes were not enough to converge';

    const signalHTML = `
    <div class="tlog-section">
        <div class="tlog-sect-hd">THE SIGNAL</div>
        <table class="tlog-table tlog-table--signal">
            <tbody>
                <tr>
                    <td class="tlog-row-label">VERDICT</td>
                    <td>${verdictLine}</td>
                </tr>
                ${diffChips ? `<tr>
                    <td class="tlog-row-label">DIFFICULTY</td>
                    <td><span class="tlog-difficulty-chips">${diffChips}</span></td>
                </tr>` : ''}
                ${summary.hardestWord ? `<tr>
                    <td class="tlog-row-label">HARDEST</td>
                    <td class="tlog-signal-val">"${DOMPurify.sanitize(summary.hardestWord)}" — not surfaced in either probe</td>
                </tr>` : ''}
                <tr>
                    <td class="tlog-row-label">MECHANISM</td>
                    <td class="tlog-signal-val">${mechanismNote}</td>
                </tr>
                <tr class="tlog-row-dim">
                    <td class="tlog-row-label">MODEL</td>
                    <td class="tlog-signal-val">${DOMPurify.sanitize(modelShort)} · in-context learning, no weight updates</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    return `<div class="tlog">${scorecardHTML}${trainingRunHTML}${signalHTML}</div>`;
}

// ============================================
// Dictionary Modal
// ============================================

function showDictionary(word) {
    const modal = document.getElementById('dictionaryModal');
    const content = document.getElementById('dictionaryContent');
    const title = modal?.querySelector('h2');
    if (!modal || !content) return;

    if (title) title.textContent = word.toUpperCase();

    const data = gameState.dictionaryHaikus?.[word];

    if (!data || !data.haikus?.length) {
        content.innerHTML = '<p class="dict-empty">No dictionary entries available for this word yet.</p>';
    } else {
        const top3 = data.haikus.slice(0, 3);
        const haikuHTML = top3.map((h, i) =>
            `<div class="trail-item dict-haiku-item">
                <div class="dict-haiku-label">example ${i + 1}</div>
                <div class="trail-response">${DOMPurify.sanitize(h)}</div>
            </div>`
        ).join('');

        const statsHTML = '';

        // AI working prompt card — only shown post-game
        const evalEntry = gameState.gameOver ? gameState.aiEvaluation?.perWord?.[word] : null;
        const promptCardHTML = evalEntry?.success ? `
            <div class="dict-prompt-card">
                <div class="dict-prompt-card-label">&gt; AI example prompt</div>
                <div class="dict-prompt-text">${DOMPurify.sanitize(evalEntry.prompt)}</div>
                <div class="trail-item dict-haiku-item" style="margin-top:0.5rem">
                    <div class="dict-haiku-label">arty responded</div>
                    <div class="trail-response">${DOMPurify.sanitize(evalEntry.response)}</div>
                </div>
            </div>` : '';

        content.innerHTML = `${haikuHTML}${statsHTML}${promptCardHTML}`;
    }

    modal.classList.remove('hidden');
    trackEvent('dictionary_viewed', { word });
}

function closeDictionary() {
    const modal = document.getElementById('dictionaryModal');
    if (modal) modal.classList.add('hidden');
}
