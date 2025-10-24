/**
 * Leaderboard Data Fetcher
 * Fetches and aggregates leaderboard and stats data from Firebase
 */

/**
 * Fetch daily leaderboard data
 * @returns {Promise<object>} Leaderboard data with top players and stats
 */
async function fetchLeaderboardData() {
    try {
        // Check if Firebase is available
        if (typeof window !== 'undefined' && !window.db) {
            console.warn('Firebase not available, using mock data');
            return getMockLeaderboardData();
        }
        
        // Use globally available modules or import them
        let collection, query, where, orderBy, limit, getDocs, getCountFromServer;
        
        if (typeof window !== 'undefined' && window.firestoreModules) {
            ({ collection, query, where, orderBy, limit, getDocs, getCountFromServer } = window.firestoreModules);
        } else {
            const modules = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            ({ collection, query, where, orderBy, limit, getDocs, getCountFromServer } = modules);
        }
        
        const db = typeof window !== 'undefined' ? window.db : global.db;
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch top 5 players for today
        const leaderboardQuery = query(
            collection(db, 'leaderboard'),
            where('date', '==', today),
            orderBy('score', 'asc'), // Lower score is better
            limit(5)
        );
        
        const leaderboardSnapshot = await getDocs(leaderboardQuery);
        const topPlayers = [];
        
        leaderboardSnapshot.forEach((doc, index) => {
            const data = doc.data();
            topPlayers.push({
                rank: index + 1,
                name: data.userName || 'GUEST',
                tokens: data.tokens || 0,
                attempts: data.attempts || 0,
                efficiency: data.efficiency || 0,
                time: formatTime(data.duration || 0)
            });
        });
        
        // Fetch aggregate statistics
        const stats = await fetchAggregateStats(today);
        
        return {
            date: new Date().toLocaleDateString(),
            topPlayers,
            stats
        };
        
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return getMockLeaderboardData();
    }
}

/**
 * Fetch aggregate statistics
 */
async function fetchAggregateStats(today) {
    try {
        // Use globally available modules or import them
        let collection, query, where, getDocs, getCountFromServer;
        
        if (typeof window !== 'undefined' && window.firestoreModules) {
            ({ collection, query, where, getDocs, getCountFromServer } = window.firestoreModules);
        } else {
            const modules = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            ({ collection, query, where, getDocs, getCountFromServer } = modules);
        }
        
        const db = typeof window !== 'undefined' ? window.db : global.db;
        
        // Total players (unique users)
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        const totalPlayers = usersSnapshot.data().count;
        
        // Games today
        const todayQuery = query(
            collection(db, 'sessions'),
            where('date', '==', today)
        );
        const todaySnapshot = await getDocs(todayQuery);
        const gamesToday = todaySnapshot.size;
        
        // Calculate averages from today's games
        let totalTokens = 0;
        let totalAttempts = 0;
        let wins = 0;
        
        todaySnapshot.forEach(doc => {
            const data = doc.data();
            totalTokens += data.totalTokens || 0;
            totalAttempts += data.attempts || 0;
            if (data.isWin) wins++;
        });
        
        const avgTokens = gamesToday > 0 ? Math.round(totalTokens / gamesToday) : 0;
        const avgAttempts = gamesToday > 0 ? (totalAttempts / gamesToday).toFixed(1) : 0;
        const winRate = gamesToday > 0 ? Math.round((wins / gamesToday) * 100) : 0;
        
        // Active now (sessions in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeQuery = query(
            collection(db, 'sessions'),
            where('lastActivity', '>=', fiveMinutesAgo)
        );
        const activeSnapshot = await getDocs(activeQuery);
        const activeNow = activeSnapshot.size;
        
        return {
            totalPlayers,
            gamesToday,
            activeNow,
            winRate,
            avgTokens,
            avgAttempts: parseFloat(avgAttempts)
        };
        
    } catch (error) {
        console.error('Error fetching aggregate stats:', error);
        return {
            totalPlayers: 0,
            gamesToday: 0,
            activeNow: 0,
            winRate: 0,
            avgTokens: 0,
            avgAttempts: 0
        };
    }
}

/**
 * Format duration in seconds to MM:SS
 */
function formatTime(seconds) {
    if (!seconds || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get mock data for testing/fallback
 */
function getMockLeaderboardData() {
    return {
        date: new Date().toLocaleDateString(),
        topPlayers: [
            {
                rank: 1,
                name: 'PLAYER_ONE',
                tokens: 187,
                attempts: 4,
                efficiency: 46.8,
                time: '02:34'
            },
            {
                rank: 2,
                name: 'GUEST_42',
                tokens: 203,
                attempts: 5,
                efficiency: 40.6,
                time: '03:12'
            },
            {
                rank: 3,
                name: 'WORDSMITH',
                tokens: 245,
                attempts: 7,
                efficiency: 35.0,
                time: '04:56'
            },
            {
                rank: 4,
                name: 'HAIKU_MASTER',
                tokens: 289,
                attempts: 8,
                efficiency: 36.1,
                time: '05:23'
            },
            {
                rank: 5,
                name: 'PROMPT_NINJA',
                tokens: 312,
                attempts: 9,
                efficiency: 34.7,
                time: '06:45'
            }
        ],
        stats: {
            totalPlayers: 1247,
            gamesToday: 342,
            activeNow: 89,
            winRate: 67,
            avgTokens: 234,
            avgAttempts: 5.8
        }
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchLeaderboardData,
        getMockLeaderboardData
    };
}
