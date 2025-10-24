// Configuration Management
// This file handles API configuration with environment variable support

const CONFIG = {
    // Gemini API Configuration
    // IMPORTANT: For production, use a backend proxy to hide the API key
    // Current setup exposes the key in client-side code (development only)
    GEMINI_API_KEY: window.ENV?.GEMINI_API_KEY || 'AIzaSyCCl_gcHDLqIfORp7ZkP66TscNWUEZ1BU4',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    
    // Game Configuration
    GAME_VERSION: '0.1.0',
    
    // Feature Flags
    ENABLE_VOICE_INPUT: true,
    ENABLE_ANALYTICS: true,
    ENABLE_EXPORT: true
};

// Validate configuration
if (CONFIG.GEMINI_API_KEY === 'REPLACE_WITH_YOUR_API_KEY') {
    console.warn('⚠️ Gemini API key not configured. Please set GEMINI_API_KEY in config.js or use a backend proxy.');
}

// Export for use in other modules
window.CONFIG = CONFIG;
