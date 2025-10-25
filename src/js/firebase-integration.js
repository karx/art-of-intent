// Firebase Integration with Game
// This file connects Firebase authentication and database with the game logic

// Wait for Firebase modules to load
window.addEventListener('load', () => {
    console.log('🎮 Initializing Firebase integration...');
    
    // Check if Firebase is loaded
    if (!window.firebaseAuth || !window.firebaseDb) {
        console.warn('⚠️ Firebase modules not loaded yet, retrying...');
        setTimeout(initializeFirebaseIntegration, 1000);
        return;
    }
    
    initializeFirebaseIntegration();
});

function initializeFirebaseIntegration() {
    console.log('🔥 Firebase integration starting...');
    
    // Initialize Firebase Auth
    if (window.firebaseAuth && window.firebaseAuth.initAuth) {
        window.firebaseAuth.initAuth();
        
        // Set up auth state listener
        window.firebaseAuth.addAuthStateListener((user, profile) => {
            handleAuthStateChange(user, profile);
        });
        
        // Set up auth button listeners
        setupAuthButtons();
        
        // Auto-authenticate as guest if user hasn't signed in after 2 seconds
        setTimeout(() => {
            const user = window.firebaseAuth.getCurrentUser();
            if (!user) {
                console.log('🎮 No user signed in, auto-authenticating as guest for session tracking...');
                window.firebaseAuth.signInAnon()
                    .then(() => {
                        console.log('✅ Auto-authenticated as guest');
                    })
                    .catch(err => {
                        console.error('❌ Auto-authentication failed:', err);
                    });
            } else {
                console.log('✅ User already authenticated:', user.uid);
            }
        }, 2000);
        
        console.log('✅ Firebase Auth initialized');
    }
    
    // Set up online/offline sync
    setupOfflineSync();
    
    console.log('✅ Firebase integration complete');
}

// Handle authentication state changes
function handleAuthStateChange(user, profile) {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const userName = document.getElementById('userName');
    const userPhoto = document.getElementById('userPhoto');
    
    if (user && profile) {
        // User is signed in
        console.log('👤 User signed in:', profile.displayName);
        
        // Update UI
        if (userName) userName.textContent = profile.displayName;
        if (userPhoto) {
            userPhoto.src = profile.photoURL || 'https://via.placeholder.com/32';
            userPhoto.alt = profile.displayName;
        }
        
        if (userInfo) userInfo.classList.remove('hidden');
        if (authButtons) authButtons.classList.add('hidden');
        
        // Update score card with user stats
        updateStatsDisplay(profile.stats);
        
        // Sync any pending local data to Firestore
        if (window.firebaseDb && window.firebaseDb.syncLocalToFirestore) {
            window.firebaseDb.syncLocalToFirestore().catch(err => {
                console.error('Error syncing to Firestore:', err);
            });
        }
    } else {
        // User is signed out
        console.log('👤 User signed out');
        
        // Update UI
        if (userInfo) userInfo.classList.add('hidden');
        if (authButtons) authButtons.classList.remove('hidden');
    }
}

// Set up authentication button listeners
function setupAuthButtons() {
    const signInGoogleBtn = document.getElementById('signInGoogleBtn');
    const playAnonymousBtn = document.getElementById('playAnonymousBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const editNameBtn = document.getElementById('editNameBtn');
    
    if (signInGoogleBtn) {
        signInGoogleBtn.addEventListener('click', async () => {
            try {
                signInGoogleBtn.disabled = true;
                signInGoogleBtn.textContent = 'Signing in...';
                
                await window.firebaseAuth.signInWithGoogle();
                console.log('✅ Google sign-in successful');
            } catch (error) {
                console.error('❌ Google sign-in error:', error);
                alert('Sign-in failed. Please try again.');
            } finally {
                signInGoogleBtn.disabled = false;
                signInGoogleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                        <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                `;
            }
        });
    }
    
    if (playAnonymousBtn) {
        playAnonymousBtn.addEventListener('click', async () => {
            try {
                playAnonymousBtn.disabled = true;
                playAnonymousBtn.textContent = 'Starting...';
                
                await window.firebaseAuth.signInAnon();
                console.log('✅ Anonymous sign-in successful');
            } catch (error) {
                console.error('❌ Anonymous sign-in error:', error);
                alert('Failed to start game. Please try again.');
            } finally {
                playAnonymousBtn.disabled = false;
                playAnonymousBtn.textContent = 'Play as Guest';
            }
        });
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await window.firebaseAuth.signOutUser();
                console.log('✅ Sign-out successful');
            } catch (error) {
                console.error('❌ Sign-out error:', error);
                alert('Sign-out failed. Please try again.');
            }
        });
    }
    
    if (editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            showPenNameModal();
        });
    }
    
    // Set up pen name modal
    setupPenNameModal();
}

// Pen Name Modal
function setupPenNameModal() {
    const modal = document.getElementById('penNameModal');
    const input = document.getElementById('penNameInput');
    const saveBtn = document.getElementById('savePenNameBtn');
    const cancelBtn = document.getElementById('cancelPenNameBtn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const newName = input.value.trim();
            if (!newName || newName.length < 2) {
                alert('Name must be at least 2 characters');
                return;
            }
            
            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                
                await window.firebaseAuth.updateDisplayName(newName);
                
                // Update UI
                const userName = document.getElementById('userName');
                if (userName) userName.textContent = newName;
                
                // Close modal
                modal.classList.add('hidden');
                input.value = '';
                
                console.log('✅ Pen name updated:', newName);
            } catch (error) {
                console.error('❌ Error updating pen name:', error);
                alert(error.message || 'Failed to update name. Please try again.');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            input.value = '';
        });
    }
    
    // Enter key to save
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }
}

function showPenNameModal() {
    const modal = document.getElementById('penNameModal');
    const input = document.getElementById('penNameInput');
    
    if (modal && input) {
        // Pre-fill with current name
        const profile = window.firebaseAuth.getUserProfile();
        if (profile) {
            input.value = profile.displayName;
        }
        
        modal.classList.remove('hidden');
        input.focus();
        input.select();
    }
}

// Update stats display with user data
function updateStatsDisplay(stats) {
    if (!stats) return;
    
    // You can add additional stats display here
    console.log('📊 User stats:', stats);
}

// Set up offline/online sync
function setupOfflineSync() {
    window.addEventListener('online', () => {
        console.log('🌐 Back online, syncing data...');
        if (window.firebaseDb && window.firebaseDb.syncLocalToFirestore) {
            window.firebaseDb.syncLocalToFirestore().catch(err => {
                console.error('Error syncing on reconnect:', err);
            });
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('📴 Offline mode - data will sync when connection is restored');
    });
}

// Hook into game completion to save to Firestore
// This will be called from game.js after a game ends
window.saveGameToFirestore = async function(gameData) {
    console.log('saveGameToFirestore called with:', {
        hasFirebaseDb: !!window.firebaseDb,
        hasFirebaseAuth: !!window.firebaseAuth,
        sessionId: gameData?.sessionId,
        gameOver: gameData?.gameOver
    });
    
    if (!window.firebaseDb || !window.firebaseAuth) {
        console.warn('Firebase not available, skipping save');
        return;
    }
    
    const user = window.firebaseAuth.getCurrentUser();
    if (!user) {
        console.warn('No user signed in, skipping Firestore save');
        return;
    }
    
    console.log('Attempting to save session for user:', user.uid);
    
    try {
        // Save session to Firestore
        await window.firebaseDb.saveSession(gameData);
        console.log('✅ Game saved to Firestore');
        
        // Update user stats
        const sessionData = {
            result: gameData.matchedWords?.size === gameData.targetWords?.length ? 'victory' : 'defeat',
            attempts: gameData.attempts || 0,
            totalTokens: gameData.totalTokens || 0,
            matchedWordsCount: gameData.matchedWords?.size || 0,
            efficiencyScore: gameData.gameOver && gameData.matchedWords?.size === gameData.targetWords?.length
                ? calculateEfficiencyScore()
                : null
        };
        
        await window.firebaseAuth.updateUserStats(sessionData);
        console.log('✅ User stats updated');
        
    } catch (error) {
        console.error('❌ Error saving to Firestore:', error);
    }
};

console.log('🔗 Firebase integration script loaded');
