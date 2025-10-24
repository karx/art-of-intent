// ============================================
// Sound Effects System
// DOS-Style Audio Feedback
// ============================================

class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false'; // Default enabled
        this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
        this.audioContext = null;
        this.sounds = {};
        
        // Initialize Web Audio API
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // Generate DOS-style beep sounds
    generateBeep(frequency, duration, type = 'square') {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Play different sound effects
    playSubmit() {
        // Short beep for submit
        this.generateBeep(800, 0.1);
    }
    
    playSuccess() {
        // Ascending tones for success
        setTimeout(() => this.generateBeep(523, 0.1), 0);    // C
        setTimeout(() => this.generateBeep(659, 0.1), 100);  // E
        setTimeout(() => this.generateBeep(784, 0.15), 200); // G
    }
    
    playError() {
        // Descending tones for error
        setTimeout(() => this.generateBeep(400, 0.15), 0);
        setTimeout(() => this.generateBeep(300, 0.2), 150);
    }
    
    playMatch() {
        // Quick ascending chirp for word match
        this.generateBeep(600, 0.05);
        setTimeout(() => this.generateBeep(800, 0.05), 50);
    }
    
    playVictory() {
        // Victory fanfare
        setTimeout(() => this.generateBeep(523, 0.1), 0);    // C
        setTimeout(() => this.generateBeep(659, 0.1), 100);  // E
        setTimeout(() => this.generateBeep(784, 0.1), 200);  // G
        setTimeout(() => this.generateBeep(1047, 0.3), 300); // C (high)
    }
    
    playDefeat() {
        // Sad trombone effect
        setTimeout(() => this.generateBeep(400, 0.2), 0);
        setTimeout(() => this.generateBeep(350, 0.2), 200);
        setTimeout(() => this.generateBeep(300, 0.3), 400);
    }
    
    playClick() {
        // Short click sound
        this.generateBeep(1000, 0.03);
    }
    
    playNotification() {
        // Notification beep
        this.generateBeep(800, 0.1);
        setTimeout(() => this.generateBeep(1000, 0.1), 100);
    }
    
    playType() {
        // Typing sound (very short)
        this.generateBeep(1200, 0.02);
    }
    
    // Settings
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        if (this.enabled) {
            this.playClick();
        }
        return this.enabled;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.volume);
        this.playClick();
    }
    
    isEnabled() {
        return this.enabled;
    }
    
    getVolume() {
        return this.volume;
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = soundManager;
}
