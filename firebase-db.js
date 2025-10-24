// Firebase Firestore Database Module
import {
    db,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from './firebase-config.js';

import { getCurrentUser } from './firebase-auth.js';

// Save session to Firestore
export async function saveSession(sessionData) {
    const user = getCurrentUser();
    if (!user) {
        console.warn('No user signed in, session not saved to Firestore');
        return null;
    }
    
    try {
        const sessionRef = doc(db, 'sessions', sessionData.sessionId);
        
        const firestoreSession = {
            sessionId: sessionData.sessionId,
            userId: user.uid,
            
            // Game configuration
            gameDate: new Date().toISOString().split('T')[0],
            targetWords: sessionData.targetWords || gameState.targetWords,
            blacklistWords: sessionData.blacklistWords || gameState.blacklistWords,
            
            // Session data
            startTime: sessionData.sessionStartTime,
            endTime: sessionData.sessionEndTime || null,
            duration: sessionData.sessionEndTime 
                ? Math.floor((new Date(sessionData.sessionEndTime) - new Date(sessionData.sessionStartTime)) / 1000)
                : null,
            
            // Game outcome
            status: sessionData.gameOver ? 'completed' : 'in_progress',
            result: sessionData.matchedWords?.size === sessionData.targetWords?.length 
                ? 'victory' 
                : sessionData.gameOver ? 'defeat' : null,
            completionReason: sessionData.gameOver 
                ? (sessionData.matchedWords?.size === sessionData.targetWords?.length 
                    ? 'all_words_matched' 
                    : 'blacklist_violation')
                : null,
            
            // Statistics
            attempts: sessionData.attempts || 0,
            totalTokens: sessionData.totalTokens || 0,
            matchedWords: Array.from(sessionData.matchedWords || []),
            matchedWordsCount: sessionData.matchedWords?.size || 0,
            efficiencyScore: sessionData.gameOver && sessionData.matchedWords?.size === sessionData.targetWords?.length
                ? calculateEfficiencyScore()
                : null,
            
            // Attempts data (limited to save space)
            attemptsData: (sessionData.responseTrail || []).slice(0, 20).map(trail => ({
                attemptNumber: trail.number,
                timestamp: trail.isoTimestamp || new Date().toISOString(),
                prompt: trail.prompt.substring(0, 500), // Limit length
                response: trail.response.substring(0, 500),
                promptTokens: trail.promptTokens,
                outputTokens: trail.outputTokens,
                totalTokens: trail.totalTokens,
                foundWords: trail.foundWords || [],
                isViolation: trail.violation || false
            })),
            
            // Events summary
            eventsSummary: {
                totalEvents: sessionData.events?.length || 0,
                voiceInputUses: (sessionData.events || []).filter(e => e.eventType === 'voice_input_completed').length,
                exportsCount: (sessionData.events || []).filter(e => e.eventType === 'session_exported').length,
                apiErrors: (sessionData.events || []).filter(e => e.eventType === 'api_error').length
            },
            
            // Metadata
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isPublic: true
        };
        
        await setDoc(sessionRef, firestoreSession, { merge: true });
        console.log('✅ Session saved to Firestore:', sessionData.sessionId);
        
        return sessionRef.id;
    } catch (error) {
        console.error('Error saving session:', error);
        throw error;
    }
}

// Update session (for in-progress games)
export async function updateSession(sessionId, updates) {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        console.log('Session updated:', sessionId);
    } catch (error) {
        console.error('Error updating session:', error);
        throw error;
    }
}

// Get user's session history
export async function getUserSessions(userId, limitCount = 10) {
    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const sessions = [];
        
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() });
        });
        
        return sessions;
    } catch (error) {
        console.error('Error getting user sessions:', error);
        return [];
    }
}

// Get daily leaderboard
export async function getDailyLeaderboard(date = null) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const leaderboardRef = doc(db, 'leaderboards', `daily/${targetDate}`);
        const leaderboardSnap = await getDoc(leaderboardRef);
        
        if (leaderboardSnap.exists()) {
            return leaderboardSnap.data();
        } else {
            // Generate leaderboard from sessions
            return await generateDailyLeaderboard(targetDate);
        }
    } catch (error) {
        console.error('Error getting daily leaderboard:', error);
        return null;
    }
}

// Generate daily leaderboard from sessions
async function generateDailyLeaderboard(date) {
    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(
            sessionsRef,
            where('gameDate', '==', date),
            where('status', '==', 'completed'),
            where('result', '==', 'victory'),
            orderBy('efficiencyScore', 'asc'),
            limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const topScores = [];
        
        querySnapshot.forEach((doc) => {
            const session = doc.data();
            topScores.push({
                userId: session.userId,
                displayName: 'Player', // Would need to join with users collection
                efficiencyScore: session.efficiencyScore,
                attempts: session.attempts,
                totalTokens: session.totalTokens,
                completedAt: session.endTime,
                rank: topScores.length + 1
            });
        });
        
        return {
            date,
            topScores,
            stats: {
                totalPlayers: topScores.length,
                averageScore: topScores.reduce((sum, s) => sum + s.efficiencyScore, 0) / topScores.length || 0
            }
        };
    } catch (error) {
        console.error('Error generating leaderboard:', error);
        return { date, topScores: [], stats: {} };
    }
}

// Subscribe to leaderboard updates (real-time)
export function subscribeToLeaderboard(date, callback) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const leaderboardRef = doc(db, 'leaderboards', `daily/${targetDate}`);
    
    const unsubscribe = onSnapshot(leaderboardRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            // Generate if doesn't exist
            generateDailyLeaderboard(targetDate).then(callback);
        }
    }, (error) => {
        console.error('Error subscribing to leaderboard:', error);
    });
    
    return unsubscribe;
}

// Get daily challenge
export async function getDailyChallenge(date = null) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const challengeRef = doc(db, 'dailyChallenges', targetDate);
        const challengeSnap = await getDoc(challengeRef);
        
        if (challengeSnap.exists()) {
            return challengeSnap.data();
        } else {
            // Generate locally if not in Firestore
            return null;
        }
    } catch (error) {
        console.error('Error getting daily challenge:', error);
        return null;
    }
}

// Save daily challenge (admin function)
export async function saveDailyChallenge(date, targetWords, blacklistWords) {
    try {
        const challengeRef = doc(db, 'dailyChallenges', date);
        await setDoc(challengeRef, {
            date,
            targetWords,
            blacklistWords,
            createdAt: serverTimestamp(),
            stats: {
                totalAttempts: 0,
                totalCompletions: 0,
                completionRate: 0
            }
        });
        
        console.log('Daily challenge saved:', date);
    } catch (error) {
        console.error('Error saving daily challenge:', error);
        throw error;
    }
}

// Update daily challenge stats
export async function updateChallengeStats(date, sessionData) {
    try {
        const challengeRef = doc(db, 'dailyChallenges', date);
        const challengeSnap = await getDoc(challengeRef);
        
        if (challengeSnap.exists()) {
            const currentStats = challengeSnap.data().stats;
            const isCompletion = sessionData.result === 'victory';
            
            const newStats = {
                totalAttempts: currentStats.totalAttempts + 1,
                totalCompletions: currentStats.totalCompletions + (isCompletion ? 1 : 0)
            };
            newStats.completionRate = newStats.totalCompletions / newStats.totalAttempts;
            
            await updateDoc(challengeRef, { stats: newStats });
        }
    } catch (error) {
        console.error('Error updating challenge stats:', error);
    }
}

// Get user's rank on leaderboard
export async function getUserRank(userId, date = null) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const leaderboard = await getDailyLeaderboard(targetDate);
        
        if (!leaderboard || !leaderboard.topScores) {
            return null;
        }
        
        const userScore = leaderboard.topScores.find(s => s.userId === userId);
        return userScore ? userScore.rank : null;
    } catch (error) {
        console.error('Error getting user rank:', error);
        return null;
    }
}

// Sync localStorage to Firestore
export async function syncLocalToFirestore() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Get current game state from localStorage
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) return;
        
        // Build session data from localStorage
        const sessionData = {
            sessionId,
            sessionStartTime: localStorage.getItem('sessionStartTime'),
            sessionEndTime: localStorage.getItem('sessionEndTime'),
            targetWords: JSON.parse(localStorage.getItem('targetWords') || '[]'),
            blacklistWords: JSON.parse(localStorage.getItem('blacklistWords') || '[]'),
            attempts: parseInt(localStorage.getItem('attempts') || '0'),
            totalTokens: parseInt(localStorage.getItem('totalTokens') || '0'),
            matchedWords: new Set(JSON.parse(localStorage.getItem('matchedWords') || '[]')),
            responseTrail: JSON.parse(localStorage.getItem('responseTrail') || '[]'),
            events: JSON.parse(localStorage.getItem('events') || '[]'),
            gameOver: localStorage.getItem('gameOver') === 'true'
        };
        
        await saveSession(sessionData);
        console.log('✅ Local data synced to Firestore');
    } catch (error) {
        console.error('Error syncing to Firestore:', error);
    }
}

// Export for global access
window.firebaseDb = {
    saveSession,
    updateSession,
    getUserSessions,
    getDailyLeaderboard,
    subscribeToLeaderboard,
    getDailyChallenge,
    getUserRank,
    syncLocalToFirestore
};

console.log('💾 Firebase DB module loaded');
