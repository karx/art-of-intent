// Welcome Modal for First-Time Visitors
// Shows authentication options on first visit

class WelcomeModal {
    constructor() {
        this.modal = document.getElementById('welcomeModal');
        this.hasSeenWelcome = localStorage.getItem('artOfIntent_hasSeenWelcome');
        this.signInBtn = document.getElementById('welcomeSignInBtn');
        this.guestBtn = document.getElementById('welcomeGuestBtn');
        
        this.init();
    }
    
    init() {
        if (!this.modal) {
            console.warn('Welcome modal element not found');
            return;
        }
        
        // Set up event listeners
        if (this.signInBtn) {
            this.signInBtn.addEventListener('click', () => this.handleSignIn());
        }
        
        if (this.guestBtn) {
            this.guestBtn.addEventListener('click', () => this.handleGuest());
        }
        
        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                // Escape chooses guest mode
                this.handleGuest();
            }
        });
        
        console.log('✅ Welcome modal initialized');
    }
    
    shouldShow() {
        // Show if:
        // 1. User hasn't seen welcome modal before
        // 2. User is not currently authenticated
        const hasAuth = window.firebaseAuth && window.firebaseAuth.getCurrentUser();
        return !this.hasSeenWelcome && !hasAuth;
    }
    
    show() {
        if (!this.modal) return;
        
        console.log('👋 Showing welcome modal');
        this.modal.classList.remove('hidden');
        
        // Focus on primary button
        setTimeout(() => {
            if (this.signInBtn) {
                this.signInBtn.focus();
            }
        }, 100);
        
        // Track analytics
        if (typeof trackEvent === 'function') {
            trackEvent('welcome_modal_shown', {});
        }
    }
    
    hide() {
        if (!this.modal) return;
        
        this.modal.classList.add('hidden');
        
        // Set flag so we don't show again
        localStorage.setItem('artOfIntent_hasSeenWelcome', 'true');
        this.hasSeenWelcome = 'true';
    }
    
    handleSignIn() {
        console.log('🔵 User chose Google sign-in from welcome modal');
        
        // Track analytics
        if (typeof trackEvent === 'function') {
            trackEvent('welcome_google_signin', {});
        }
        
        // Hide modal
        this.hide();
        
        // Trigger Google sign-in
        const mainSignInBtn = document.getElementById('signInGoogleBtn');
        if (mainSignInBtn) {
            mainSignInBtn.click();
        } else if (window.firebaseAuth && window.firebaseAuth.signInWithGoogle) {
            window.firebaseAuth.signInWithGoogle();
        }
    }
    
    handleGuest() {
        console.log('👤 User chose guest mode from welcome modal');
        
        // Track analytics
        if (typeof trackEvent === 'function') {
            trackEvent('welcome_guest_mode', {});
        }
        
        // Hide modal
        this.hide();
        
        // Sign in anonymously
        if (window.firebaseAuth && window.firebaseAuth.signInAnon) {
            window.firebaseAuth.signInAnon()
                .then(() => {
                    console.log('✅ Guest mode activated');
                })
                .catch(err => {
                    console.error('❌ Guest mode failed:', err);
                });
        }
    }
}

// Initialize welcome modal when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.welcomeModal = new WelcomeModal();
    });
} else {
    window.welcomeModal = new WelcomeModal();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomeModal;
}
