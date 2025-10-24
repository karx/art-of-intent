// ============================================
// UI Components - Leaderboard & Profile
// ============================================

import { auth, db } from './firebase-config.js';
import { collection, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { UserAnalytics } from './analytics.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper function to check if a session is a win
 * Supports multiple field formats for backward compatibility
 */
function isSessionWin(session) {
    return session.isWin === true || 
           session.result === 'victory' || 
           session.success === true;
}

// ============================================
// LEADERBOARD
// ============================================

let currentFilter = 'daily';

export function initializeLeaderboard() {
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    leaderboardBtn.addEventListener('click', () => {
        UserAnalytics.leaderboardView(currentFilter);
        openLeaderboard();
    });

    closeLeaderboardBtn.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            UserAnalytics.leaderboardView(currentFilter);
            loadLeaderboard(currentFilter);
        });
    });

    // Close on background click
    leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            leaderboardModal.classList.add('hidden');
        }
    });
}

async function openLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    modal.classList.remove('hidden');
    await loadLeaderboard(currentFilter);
}

async function loadLeaderboard(filter = 'daily') {
    const content = document.getElementById('leaderboardContent');
    content.innerHTML = '<div class="loading">Loading leaderboard data...</div>';

    try {
        console.log('Loading leaderboard with filter:', filter);
        const user = auth.currentUser;
        console.log('Current user:', user ? user.uid : 'Not signed in');
        
        let leaderboardData = [];

        if (filter === 'daily') {
            leaderboardData = await getDailyLeaderboard();
        } else if (filter === 'weekly') {
            leaderboardData = await getWeeklyLeaderboard();
        } else if (filter === 'alltime') {
            leaderboardData = await getAllTimeLeaderboard();
        }

        console.log('Leaderboard data loaded:', leaderboardData.length, 'entries');

        if (leaderboardData.length === 0) {
            content.innerHTML = '<div class="leaderboard-empty">No data available yet. Be the first to play!</div>';
            return;
        }

        // Render leaderboard table
        const table = document.createElement('table');
        table.className = 'leaderboard-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="rank">Rank</th>
                    <th class="player">Player</th>
                    <th class="tokens">Tokens</th>
                    <th class="time">Time</th>
                    <th class="attempts">Attempts</th>
                </tr>
            </thead>
            <tbody>
                ${leaderboardData.map((entry, index) => {
                    const isCurrentUser = user && entry.userId === user.uid;
                    const rowClass = isCurrentUser ? 'current-user' : '';
                    const playerName = isCurrentUser ? 'YOU' : (entry.displayName || `GUEST_${entry.userId.slice(-4)}`);
                    
                    return `
                        <tr class="${rowClass}">
                            <td class="rank">${index + 1}</td>
                            <td class="player">${playerName}</td>
                            <td class="tokens">${entry.totalTokens}</td>
                            <td class="time">${formatTime(entry.duration)}</td>
                            <td class="attempts">${entry.attempts}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;

        content.innerHTML = '';
        content.appendChild(table);

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        content.innerHTML = '<div class="leaderboard-empty">Error loading leaderboard. Please try again.</div>';
    }
}

async function getDailyLeaderboard() {
    const today = new Date().toISOString().split('T')[0];
    const sessionsRef = collection(db, 'sessions');
    
    // Simplified query - just get today's sessions
    const q = query(
        sessionsRef,
        where('gameDate', '==', today),
        limit(50) // Get more to filter client-side
    );

    const snapshot = await getDocs(q);
    
    // Filter and sort client-side
    const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => isSessionWin(session))
        .sort((a, b) => (a.totalTokens || 0) - (b.totalTokens || 0))
        .slice(0, 10);
    
    console.log('Daily leaderboard:', sessions.length, 'winners found');
    return sessions;
}

async function getWeeklyLeaderboard() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const sessionsRef = collection(db, 'sessions');
    const q = query(
        sessionsRef,
        where('gameDate', '>=', weekAgoStr),
        limit(100) // Get more to filter client-side
    );

    const snapshot = await getDocs(q);
    
    // Filter and sort client-side
    const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => isSessionWin(session))
        .sort((a, b) => (a.totalTokens || 0) - (b.totalTokens || 0))
        .slice(0, 10);
    
    console.log('Weekly leaderboard:', sessions.length, 'winners found');
    return sessions;
}

async function getAllTimeLeaderboard() {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
        sessionsRef,
        limit(100) // Get top 100 to filter client-side
    );

    const snapshot = await getDocs(q);
    
    // Filter and sort client-side
    const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => isSessionWin(session))
        .sort((a, b) => (a.totalTokens || 0) - (b.totalTokens || 0))
        .slice(0, 10);
    
    console.log('All-time leaderboard:', sessions.length, 'winners found');
    
    return sessions;
}

function formatTime(seconds) {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// USER PROFILE
// ============================================

export function initializeProfile() {
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const exportProfileBtn = document.getElementById('exportProfileBtn');
    const exportSessionBtn = document.getElementById('exportSessionBtn');

    profileBtn.addEventListener('click', () => {
        openProfile();
    });

    closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.add('hidden');
    });

    exportProfileBtn.addEventListener('click', () => {
        exportProfileData();
    });

    exportSessionBtn.addEventListener('click', () => {
        // Call the existing exportSessionData function from game.js
        if (typeof window.exportSessionData === 'function') {
            window.exportSessionData();
        }
    });

    // Close on background click
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.add('hidden');
        }
    });
}

async function openProfile() {
    const modal = document.getElementById('profileModal');
    const user = auth.currentUser;

    if (!user) {
        alert('Please sign in to view your profile');
        return;
    }

    modal.classList.remove('hidden');
    await loadProfile(user.uid);
}

async function loadProfile(userId) {
    const content = document.getElementById('profileContent');
    content.innerHTML = '<div class="loading">Loading profile data...</div>';

    try {
        // Get user profile
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId), limit(1)));
        const userData = userDoc.docs[0]?.data() || {};

        // Get user sessions
        const sessionsRef = collection(db, 'sessions');
        const sessionsQuery = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate stats
        const totalGames = userData.gamesPlayed || sessions.length;
        const wins = sessions.filter(s => isSessionWin(s)).length;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
        const avgTokens = sessions.length > 0 
            ? Math.round(sessions.reduce((sum, s) => sum + (s.totalTokens || 0), 0) / sessions.length)
            : 0;
        const bestScore = sessions.length > 0
            ? Math.min(...sessions.filter(s => isSessionWin(s)).map(s => s.totalTokens || Infinity))
            : 0;
        const currentStreak = userData.currentStreak || 0;
        const longestStreak = userData.longestStreak || 0;

        // Render profile
        content.innerHTML = `
            <div class="profile-header">
                <div class="profile-username">${userData.displayName || auth.currentUser.email || 'GUEST'}</div>
                <div class="profile-meta">
                    Joined: ${userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'Unknown'} | 
                    Status: ${userData.isAnonymous ? 'GUEST' : 'AUTHENTICATED'}
                </div>
            </div>

            <div class="profile-section">
                <div class="profile-section-title">Statistics</div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-label">Total Games</span>
                        <span class="profile-stat-value">${totalGames}</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-label">Win Rate</span>
                        <span class="profile-stat-value">${winRate}%</span>
                        <div class="profile-progress">
                            <div class="profile-progress-bar">
                                <div class="profile-progress-fill" style="width: ${winRate}%"></div>
                            </div>
                            <span class="profile-progress-text">${winRate}%</span>
                        </div>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-label">Avg Tokens</span>
                        <span class="profile-stat-value">${avgTokens}</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-label">Best Score</span>
                        <span class="profile-stat-value">${bestScore > 0 ? bestScore + ' tokens' : 'N/A'}</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-label">Current Streak</span>
                        <span class="profile-stat-value">${currentStreak} days</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-label">Longest Streak</span>
                        <span class="profile-stat-value">${longestStreak} days</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <div class="profile-section-title">Achievements</div>
                <div class="profile-achievements">
                    <div class="profile-achievement ${wins > 0 ? 'unlocked' : 'locked'}">First Win</div>
                    <div class="profile-achievement ${bestScore > 0 && bestScore < 200 ? 'unlocked' : 'locked'}">Perfect Score</div>
                    <div class="profile-achievement ${currentStreak >= 7 ? 'unlocked' : 'locked'}">Week Warrior</div>
                    <div class="profile-achievement ${longestStreak >= 30 ? 'unlocked' : 'locked'}">Month Master</div>
                    <div class="profile-achievement ${totalGames >= 10 ? 'unlocked' : 'locked'}">Dedicated Player</div>
                    <div class="profile-achievement ${totalGames >= 100 ? 'unlocked' : 'locked'}">Century Club</div>
                </div>
            </div>

            <div class="profile-section">
                <div class="profile-section-title">Recent Sessions</div>
                <div class="profile-sessions">
                    ${sessions.length > 0 ? sessions.map(session => {
                        const isWin = isSessionWin(session);
                        return `
                        <div class="profile-session">
                            <span class="profile-session-date">${session.gameDate || 'Unknown'}</span>
                            <span class="profile-session-result ${isWin ? 'win' : 'loss'}">
                                ${isWin ? 'WIN' : 'LOSS'}
                            </span>
                            <span class="profile-session-stats">
                                ${session.totalTokens || 0} tokens | ${session.attempts || 0} attempts
                            </span>
                        </div>`;
                    }).join('') : '<div class="profile-empty">No sessions yet</div>'}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading profile:', error);
        content.innerHTML = '<div class="leaderboard-empty">Error loading profile. Please try again.</div>';
    }
}

async function exportProfileData() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Get all user data
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid), limit(1)));
        const userData = userDoc.docs[0]?.data() || {};

        const sessionsRef = collection(db, 'sessions');
        const sessionsQuery = query(sessionsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const exportData = {
            user: userData,
            sessions: sessions,
            exportDate: new Date().toISOString()
        };

        // Download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `art-of-intent-profile-${user.uid}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error exporting profile:', error);
        alert('Error exporting profile data');
    }
}

// ============================================
// INITIALIZE
// ============================================

export function initializeUIComponents() {
    initializeLeaderboard();
    initializeProfile();
}
