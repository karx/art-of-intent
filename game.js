// Game State
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
    events: []
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
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    updateSchemaMetadata();
});

function initializeGame() {
    const today = new Date().toDateString();
    
    // Check if we need to generate new words for today
    const savedDate = localStorage.getItem('gameDate');
    if (savedDate !== today) {
        generateDailyWords();
        resetGameState();
        localStorage.setItem('gameDate', today);
        trackEvent('session_start', { reason: 'new_day' });
    } else {
        loadSavedGame();
        trackEvent('session_resume', { 
            attempts: gameState.attempts,
            matchedWords: gameState.matchedWords.size 
        });
    }
    
    updateUI();
}

function generateDailyWords() {
    // Use date as seed for consistent daily words
    const seed = new Date().toDateString();
    const random = seededRandom(seed);
    
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
    
    // Save to localStorage
    localStorage.setItem('targetWords', JSON.stringify(gameState.targetWords));
    localStorage.setItem('blacklistWords', JSON.stringify(gameState.blacklistWords));
}

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
    
    console.log('Event tracked:', event);
}

function setupEventListeners() {
    const submitBtn = document.getElementById('submitBtn');
    const promptInput = document.getElementById('promptInput');
    const voiceBtn = document.getElementById('voiceBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareBtn = document.getElementById('shareBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    submitBtn.addEventListener('click', handleSubmit);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    });
    
    voiceBtn.addEventListener('click', handleVoiceInput);
    closeModalBtn.addEventListener('click', closeModal);
    shareBtn.addEventListener('click', shareScore);
    exportBtn.addEventListener('click', exportSessionData);
}

async function handleSubmit() {
    if (gameState.gameOver) {
        alert('Game is over! Wait for tomorrow\'s challenge.');
        return;
    }
    
    const promptInput = document.getElementById('promptInput');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        alert('Please enter a prompt!');
        return;
    }
    
    trackEvent('prompt_submitted', { 
        promptLength: prompt.length,
        attemptNumber: gameState.attempts + 1 
    });
    
    // Check for blacklist words in user prompt
    const promptLower = prompt.toLowerCase();
    const violatedWords = gameState.blacklistWords.filter(word => 
        promptLower.includes(word.toLowerCase())
    );
    
    if (violatedWords.length > 0) {
        trackEvent('blacklist_violation_detected', { 
            violatedWords: violatedWords,
            promptLength: prompt.length 
        });
        handleBlacklistViolation(prompt, violatedWords);
        return;
    }
    
    // Disable input while processing
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Thinking...';
    
    const apiCallStart = Date.now();
    
    try {
        const response = await callArtyAPI(prompt);
        const apiCallDuration = Date.now() - apiCallStart;
        
        trackEvent('api_response_received', { 
            duration: apiCallDuration,
            hasResponse: !!response 
        });
        
        processResponse(prompt, response);
    } catch (error) {
        console.error('Error calling API:', error);
        trackEvent('api_error', { 
            error: error.message,
            duration: Date.now() - apiCallStart 
        });
        alert('Error communicating with Arty. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Prompt';
        promptInput.value = '';
    }
}

async function callArtyAPI(userPrompt) {
    const config = getConfig();
    const systemInstruction = generateSystemInstruction();
    
    const requestBody = {
        system_instruction: {
            parts: [{ text: systemInstruction }]
        },
        contents: [
            {
                parts: [{ text: userPrompt }]
            }
        ]
    };
    
    const response = await fetch(config.GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
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

function processResponse(prompt, apiResponse) {
    gameState.attempts++;
    
    // Extract response text and token usage
    const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const usageMetadata = apiResponse.usageMetadata || {};
    
    const promptTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || 0;
    
    gameState.totalTokens += totalTokens;
    
    // Check for target words in response
    const responseLower = responseText.toLowerCase();
    const foundWords = gameState.targetWords.filter(word => 
        responseLower.includes(word.toLowerCase())
    );
    
    const previousMatchCount = gameState.matchedWords.size;
    foundWords.forEach(word => gameState.matchedWords.add(word));
    const newMatchCount = gameState.matchedWords.size;
    
    // Track response processing
    trackEvent('response_processed', {
        attemptNumber: gameState.attempts,
        promptTokens,
        outputTokens,
        totalTokens,
        foundWords,
        newWordsFound: newMatchCount - previousMatchCount,
        totalMatches: newMatchCount,
        responseLength: responseText.length
    });
    
    // Create trail item
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: prompt,
        response: responseText,
        promptTokens,
        outputTokens,
        totalTokens,
        foundWords,
        matchedSoFar: [...gameState.matchedWords]
    };
    
    gameState.responseTrail.unshift(trailItem);
    saveGameState();
    updateUI();
    
    // Check win condition
    if (gameState.matchedWords.size === gameState.targetWords.length) {
        handleGameWin();
    }
}

function handleBlacklistViolation(prompt, violatedWords) {
    gameState.attempts++;
    gameState.gameOver = true;
    gameState.sessionEndTime = new Date().toISOString();
    
    trackEvent('game_over', {
        reason: 'blacklist_violation',
        violatedWords,
        finalAttempts: gameState.attempts,
        finalTokens: gameState.totalTokens,
        wordsMatched: gameState.matchedWords.size,
        wordsTotal: gameState.targetWords.length
    });
    
    const trailItem = {
        number: gameState.attempts,
        timestamp: new Date().toLocaleTimeString(),
        isoTimestamp: new Date().toISOString(),
        prompt: prompt,
        response: 'Words are now proscribed,\nA silent path must be found,\nSpeak in a new way.',
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        violation: true,
        violatedWords
    };
    
    gameState.responseTrail.unshift(trailItem);
    saveGameState();
    updateUI();
    
    showGameOverModal(false, violatedWords);
}

function handleGameWin() {
    gameState.gameOver = true;
    gameState.sessionEndTime = new Date().toISOString();
    
    trackEvent('game_over', {
        reason: 'victory',
        finalAttempts: gameState.attempts,
        finalTokens: gameState.totalTokens,
        wordsMatched: gameState.matchedWords.size,
        wordsTotal: gameState.targetWords.length,
        efficiencyScore: calculateEfficiencyScore()
    });
    
    saveGameState();
    showGameOverModal(true);
}

function showGameOverModal(isWin, violatedWords = []) {
    const modal = document.getElementById('gameOverModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (isWin) {
        modalTitle.textContent = '🎉 Victory!';
        modalBody.innerHTML = `
            <p>You successfully guided Arty to speak all target words!</p>
            <div style="margin: 20px 0; padding: 15px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="margin-bottom: 10px;"><strong>Attempts:</strong> ${gameState.attempts}</div>
                <div style="margin-bottom: 10px;"><strong>Total Tokens:</strong> ${gameState.totalTokens}</div>
                <div><strong>Efficiency Score:</strong> ${calculateEfficiencyScore()}</div>
            </div>
            <p>Come back tomorrow for a new challenge!</p>
        `;
    } else {
        modalTitle.textContent = '❌ Game Over';
        modalBody.innerHTML = `
            <p>You used a blacklisted word: <strong>${violatedWords.join(', ')}</strong></p>
            <div style="margin: 20px 0; padding: 15px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="margin-bottom: 10px;"><strong>Attempts:</strong> ${gameState.attempts}</div>
                <div style="margin-bottom: 10px;"><strong>Words Found:</strong> ${gameState.matchedWords.size}/${gameState.targetWords.length}</div>
                <div><strong>Total Tokens:</strong> ${gameState.totalTokens}</div>
            </div>
            <p>Try again tomorrow with a fresh challenge!</p>
        `;
    }
    
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

function shareScore() {
    const isWin = gameState.matchedWords.size === gameState.targetWords.length;
    const status = isWin ? '✅ Victory!' : '❌ Game Over';
    const score = isWin ? calculateEfficiencyScore() : 'DNF';
    
    const shareText = `Art of Intent - ${new Date().toLocaleDateString()}
${status}
Attempts: ${gameState.attempts}
Words Found: ${gameState.matchedWords.size}/${gameState.targetWords.length}
Tokens Used: ${gameState.totalTokens}
Score: ${score}

Can you guide Arty better?`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Art of Intent',
            text: shareText
        });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Score copied to clipboard!');
    }
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
        
        trackEvent('voice_input_completed', {
            transcriptLength: transcript.length,
            confidence: confidence,
            duration: Date.now() - voiceStartTime
        });
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
    updateSchemaMetadata();
}

function updateTargetWords() {
    const container = document.getElementById('targetWords');
    container.innerHTML = gameState.targetWords.map(word => {
        const matched = gameState.matchedWords.has(word);
        return `<span class="word-tag ${matched ? 'matched' : ''}" style="${matched ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${word}</span>`;
    }).join('');
}

function updateBlacklistWords() {
    const container = document.getElementById('blacklistWords');
    container.innerHTML = gameState.blacklistWords.map(word => 
        `<span class="word-tag">${word}</span>`
    ).join('');
}

function updateScore() {
    document.getElementById('attempts').textContent = gameState.attempts;
    document.getElementById('totalTokens').textContent = gameState.totalTokens;
    document.getElementById('matches').textContent = `${gameState.matchedWords.size}/${gameState.targetWords.length}`;
}

function updateResponseTrail() {
    const container = document.getElementById('trailContainer');
    
    if (gameState.responseTrail.length === 0) {
        container.innerHTML = '<div class="empty-state">No attempts yet. Start by entering your prompt below!</div>';
        return;
    }
    
    container.innerHTML = gameState.responseTrail.map(item => {
        const itemClass = item.violation ? 'violation' : 
                         (item.foundWords && item.foundWords.length > 0) ? 'success' : '';
        
        return `
            <div class="trail-item ${itemClass}">
                <div class="trail-header">
                    <span class="trail-number">Attempt #${item.number}</span>
                    <span class="trail-timestamp">${item.timestamp}</span>
                </div>
                <div class="trail-prompt">${escapeHtml(item.prompt)}</div>
                <div class="trail-response">${escapeHtml(item.response)}</div>
                ${item.violation ? `
                    <div style="color: var(--accent-red); font-weight: 600; margin-top: 10px;">
                        ⚠️ Blacklist Violation: ${item.violatedWords.join(', ')}
                    </div>
                ` : ''}
                ${item.foundWords && item.foundWords.length > 0 ? `
                    <div class="match-indicator">
                        <strong>Found:</strong>
                        ${item.foundWords.map(w => `<span class="match-word found">${w}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="trail-stats">
                    <div class="stat-item">
                        <span>Prompt:</span>
                        <span class="stat-value">${item.promptTokens}</span>
                    </div>
                    <div class="stat-item">
                        <span>Output:</span>
                        <span class="stat-value">${item.outputTokens}</span>
                    </div>
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-value">${item.totalTokens}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
