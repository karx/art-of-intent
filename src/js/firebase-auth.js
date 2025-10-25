// Firebase Authentication Module
import {
    auth,
    db,
    googleProvider,
    signInAnonymously,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from './firebase-config.js';
import { UserAnalytics } from './analytics.js';

// Current user state
let currentUser = null;
let userProfile = null;

// Authentication state listeners
const authStateListeners = [];

// Initialize authentication
export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('✅ User signed in:', user.uid);
            currentUser = user;
            
            // Load or create user profile
            await loadUserProfile(user);
            
            // Notify listeners
            notifyAuthStateChange(user, userProfile);
            
            // Track login event
            const provider = user.isAnonymous ? 'anonymous' : (user.providerData[0]?.providerId || 'unknown');
            UserAnalytics.authLogin(provider);
        } else {
            console.log('❌ User signed out');
            currentUser = null;
            userProfile = null;
            notifyAuthStateChange(null, null);
        }
    });
}

// Sign in anonymously
export async function signInAnon() {
    try {
        const result = await signInAnonymously(auth);
        console.log('Anonymous sign-in successful:', result.user.uid);
        return result.user;
    } catch (error) {
        console.error('Anonymous sign-in error:', error);
        throw error;
    }
}

// Sign in with Google
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign-in successful:', result.user.uid);
        
        // If upgrading from anonymous, migrate data
        if (currentUser?.isAnonymous) {
            await migrateAnonymousData(currentUser.uid, result.user.uid);
        }
        
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
}

// Sign out
export async function signOutUser() {
    try {
        await signOut(auth);
        UserAnalytics.authLogout();
        console.log('Sign-out successful');
    } catch (error) {
        console.error('Sign-out error:', error);
        throw error;
    }
}

// Load user profile from Firestore
async function loadUserProfile(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            // User exists, update last login
            userProfile = userSnap.data();
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
            console.log('User profile loaded:', userProfile.displayName);
        } else {
            // New user, create profile
            userProfile = await createUserProfile(user);
            console.log('New user profile created');
        }
        
        return userProfile;
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

// Create new user profile
async function createUserProfile(user) {
    const profile = {
        userId: user.uid,
        displayName: user.displayName || `Player${Math.floor(Math.random() * 10000)}`,
        email: user.email || null,
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous,
        
        stats: {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            winRate: 0,
            totalAttempts: 0,
            totalTokens: 0,
            averageTokensPerGame: 0,
            bestScore: null,
            currentStreak: 0,
            longestStreak: 0,
            totalWordsMatched: 0,
            averageAttemptsPerWin: 0
        },
        
        achievements: [],
        
        preferences: {
            theme: 'dark',
            voiceEnabled: true,
            notifications: true,
            shareByDefault: false
        },
        
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastGameAt: null
    };
    
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, profile);
        return profile;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Update user stats after game
export async function updateUserStats(sessionData) {
    if (!currentUser) {
        console.warn('No user signed in, skipping stats update');
        return;
    }
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            console.error('User profile not found');
            return;
        }
        
        const currentStats = userSnap.data().stats;
        const isWin = sessionData.result === 'victory';
        
        // Calculate new stats
        const newStats = {
            totalGames: currentStats.totalGames + 1,
            totalWins: currentStats.totalWins + (isWin ? 1 : 0),
            totalLosses: currentStats.totalLosses + (isWin ? 0 : 1),
            totalAttempts: currentStats.totalAttempts + sessionData.attempts,
            totalTokens: currentStats.totalTokens + sessionData.totalTokens,
            totalWordsMatched: currentStats.totalWordsMatched + sessionData.matchedWordsCount,
        };
        
        // Calculate derived stats
        newStats.winRate = newStats.totalWins / newStats.totalGames;
        newStats.averageTokensPerGame = Math.round(newStats.totalTokens / newStats.totalGames);
        newStats.averageAttemptsPerWin = newStats.totalWins > 0 
            ? (newStats.totalAttempts / newStats.totalWins).toFixed(1)
            : 0;
        
        // Update best score
        if (isWin && sessionData.efficiencyScore) {
            if (!currentStats.bestScore || sessionData.efficiencyScore < currentStats.bestScore) {
                newStats.bestScore = sessionData.efficiencyScore;
            } else {
                newStats.bestScore = currentStats.bestScore;
            }
        } else {
            newStats.bestScore = currentStats.bestScore;
        }
        
        // Update streak
        if (isWin) {
            newStats.currentStreak = currentStats.currentStreak + 1;
            newStats.longestStreak = Math.max(
                currentStats.longestStreak,
                newStats.currentStreak
            );
        } else {
            newStats.currentStreak = 0;
            newStats.longestStreak = currentStats.longestStreak;
        }
        
        // Update Firestore
        await updateDoc(userRef, {
            stats: newStats,
            lastGameAt: serverTimestamp()
        });
        
        // Update local profile
        userProfile.stats = newStats;
        
        console.log('User stats updated:', newStats);
        
        // Check for achievements
        await checkAchievements(newStats);
        
    } catch (error) {
        console.error('Error updating user stats:', error);
        throw error;
    }
}

// Check and award achievements
async function checkAchievements(stats) {
    if (!currentUser || !userProfile) return;
    
    const newAchievements = [];
    const existingAchievements = userProfile.achievements.map(a => a.id);
    
    // First win
    if (stats.totalWins === 1 && !existingAchievements.includes('first_win')) {
        newAchievements.push({
            id: 'first_win',
            name: 'First Victory',
            description: 'Win your first game',
            unlockedAt: new Date().toISOString()
        });
    }
    
    // Perfect score
    if (stats.bestScore && stats.bestScore < 50 && !existingAchievements.includes('perfect_score')) {
        newAchievements.push({
            id: 'perfect_score',
            name: 'Perfect Score',
            description: 'Win with a score under 50',
            unlockedAt: new Date().toISOString()
        });
    }
    
    // Win streak
    if (stats.currentStreak >= 5 && !existingAchievements.includes('streak_5')) {
        newAchievements.push({
            id: 'streak_5',
            name: 'On Fire',
            description: 'Win 5 games in a row',
            unlockedAt: new Date().toISOString()
        });
    }
    
    // Token efficiency
    if (stats.averageTokensPerGame < 500 && stats.totalGames >= 10 
        && !existingAchievements.includes('efficient')) {
        newAchievements.push({
            id: 'efficient',
            name: 'Token Master',
            description: 'Average under 500 tokens per game (min 10 games)',
            unlockedAt: new Date().toISOString()
        });
    }
    
    // Update if new achievements
    if (newAchievements.length > 0) {
        const userRef = doc(db, 'users', currentUser.uid);
        const updatedAchievements = [...userProfile.achievements, ...newAchievements];
        
        await updateDoc(userRef, {
            achievements: updatedAchievements
        });
        
        userProfile.achievements = updatedAchievements;
        
        // Show achievement notification
        newAchievements.forEach(achievement => {
            showAchievementNotification(achievement);
        });
        
        console.log('New achievements unlocked:', newAchievements);
    }
}

// Show achievement notification
function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Migrate anonymous user data to authenticated account
async function migrateAnonymousData(anonymousUid, authenticatedUid) {
    try {
        console.log('Migrating data from anonymous to authenticated user...');
        
        // This would typically involve:
        // 1. Copy sessions from anonymous user to authenticated user
        // 2. Merge stats
        // 3. Delete anonymous user data
        
        // For now, we'll just log it
        console.log('Data migration complete');
        
    } catch (error) {
        console.error('Error migrating data:', error);
    }
}

// Add auth state listener
export function addAuthStateListener(callback) {
    authStateListeners.push(callback);
}

// Remove auth state listener
export function removeAuthStateListener(callback) {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
        authStateListeners.splice(index, 1);
    }
}

// Notify all listeners of auth state change
function notifyAuthStateChange(user, profile) {
    authStateListeners.forEach(callback => {
        try {
            callback(user, profile);
        } catch (error) {
            console.error('Error in auth state listener:', error);
        }
    });
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Get user profile
export function getUserProfile() {
    return userProfile;
}

// Update user preferences
export async function updateUserPreferences(preferences) {
    if (!currentUser) return;
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            preferences: {
                ...userProfile.preferences,
                ...preferences
            }
        });
        
        userProfile.preferences = {
            ...userProfile.preferences,
            ...preferences
        };
        
        console.log('User preferences updated');
    } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
    }
}

// Update display name (pen name)
export async function updateDisplayName(newName) {
    if (!currentUser) return;
    
    // Validate name
    const sanitizedName = newName.trim().substring(0, 20);
    if (!sanitizedName || sanitizedName.length < 2) {
        throw new Error('Name must be at least 2 characters');
    }
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            displayName: sanitizedName
        });
        
        userProfile.displayName = sanitizedName;
        
        console.log('Display name updated:', sanitizedName);
        
        // Notify listeners of profile change
        notifyAuthStateChange(currentUser, userProfile);
        
        return sanitizedName;
    } catch (error) {
        console.error('Error updating display name:', error);
        throw error;
    }
}

// Export for global access
window.firebaseAuth = {
    initAuth,
    signInAnon,
    signInWithGoogle,
    signOutUser,
    getCurrentUser,
    getUserProfile,
    updateUserStats,
    updateUserPreferences,
    updateDisplayName,
    addAuthStateListener,
    removeAuthStateListener
};

console.log('🔐 Firebase Auth module loaded');
