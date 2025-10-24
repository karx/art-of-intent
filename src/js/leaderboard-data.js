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
        
        console.log('Fetching leaderboard for date:', today);
        
        // Try to fetch leaderboard data - try multiple approaches
        let leaderboardSnapshot;
        let topPlayers = [];
        
        // Approach 1: Try with date filter
        try {
            const leaderboardQuery = query(
                collection(db, 'leaderboard'),
                where('date', '==', today),
                orderBy('score', 'asc'),
                limit(5)
            );
            leaderboardSnapshot = await getDocs(leaderboardQuery);
            console.log('Leaderboard with date filter:', leaderboardSnapshot.size);
        } catch (error) {
            console.warn('Date filter failed:', error.message);
        }
        
        // Approach 2: If no data with date, try without date filter (get recent entries)
        if (!leaderboardSnapshot || leaderboardSnapshot.empty) {
            console.log('No data for today, fetching recent entries...');
            try {
                const recentQuery = query(
                    collection(db, 'leaderboard'),
                    orderBy('score', 'asc'),
                    limit(5)
                );
                leaderboardSnapshot = await getDocs(recentQuery);
                console.log('Recent leaderboard entries:', leaderboardSnapshot.size);
            } catch (error) {
                console.warn('Recent query failed:', error.message);
            }
        }
        
        // Approach 3: Try sessions collection as fallback
        if (!leaderboardSnapshot || leaderboardSnapshot.empty) {
            console.log('No leaderboard data, trying sessions...');
            try {
                const sessionsQuery = query(
                    collection(db, 'sessions'),
                    where('isWin', '==', true),
                    orderBy('totalTokens', 'asc'),
                    limit(5)
                );
                const sessionsSnapshot = await getDocs(sessionsQuery);
                console.log('Sessions found:', sessionsSnapshot.size);
                
                sessionsSnapshot.forEach((doc, index) => {
                    const data = doc.data();
                    topPlayers.push({
                        rank: index + 1,
                        name: data.userName || data.displayName || 'GUEST',
                        tokens: data.totalTokens || 0,
                        attempts: data.attempts || 0,
                        efficiency: data.attempts > 0 ? (data.totalTokens / data.attempts).toFixed(1) : 0,
                        time: formatTime(data.duration || 0)
                    });
                });
            } catch (error) {
                console.warn('Sessions query failed:', error.message);
            }
        } else {
            // Parse leaderboard data
            leaderboardSnapshot.forEach((doc, index) => {
                const data = doc.data();
                topPlayers.push({
                    rank: index + 1,
                    name: data.userName || data.displayName || 'GUEST',
                    tokens: data.tokens || data.totalTokens || 0,
                    attempts: data.attempts || 0,
                    efficiency: data.efficiency || (data.attempts > 0 ? (data.tokens / data.attempts).toFixed(1) : 0),
                    time: formatTime(data.duration || 0)
                });
            });
        }
        
        console.log('Leaderboard data loaded:', topPlayers.length, 'entries');
        
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
        
        console.log('Fetching aggregate stats...');
        
        let totalPlayers = 0;
        let gamesToday = 0;
        let totalTokens = 0;
        let totalAttempts = 0;
        let wins = 0;
        let activeNow = 0;
        
        // Total players (unique users)
        try {
            const usersSnapshot = await getCountFromServer(collection(db, 'users'));
            totalPlayers = usersSnapshot.data().count;
            console.log('Total players:', totalPlayers);
        } catch (error) {
            console.warn('Could not count users:', error.message);
            // Fallback: try to get actual documents
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                totalPlayers = usersSnapshot.size;
            } catch (e) {
                console.warn('Could not fetch users:', e.message);
            }
        }
        
        // Games today - try with date field
        try {
            const todayQuery = query(
                collection(db, 'sessions'),
                where('date', '==', today)
            );
            const todaySnapshot = await getDocs(todayQuery);
            gamesToday = todaySnapshot.size;
            
            // Calculate averages from today's games
            todaySnapshot.forEach(doc => {
                const data = doc.data();
                totalTokens += data.totalTokens || 0;
                totalAttempts += data.attempts || 0;
                if (data.isWin) wins++;
            });
            
            console.log('Games today:', gamesToday);
        } catch (error) {
            console.warn('Could not fetch today sessions:', error.message);
            
            // Fallback: get recent sessions
            try {
                const recentQuery = query(
                    collection(db, 'sessions'),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                const recentSnapshot = await getDocs(recentQuery);
                gamesToday = recentSnapshot.size;
                
                recentSnapshot.forEach(doc => {
                    const data = doc.data();
                    totalTokens += data.totalTokens || 0;
                    totalAttempts += data.attempts || 0;
                    if (data.isWin) wins++;
                });
                
                console.log('Recent games:', gamesToday);
            } catch (e) {
                console.warn('Could not fetch recent sessions:', e.message);
            }
        }
        
        const avgTokens = gamesToday > 0 ? Math.round(totalTokens / gamesToday) : 0;
        const avgAttempts = gamesToday > 0 ? (totalAttempts / gamesToday).toFixed(1) : 0;
        const winRate = gamesToday > 0 ? Math.round((wins / gamesToday) * 100) : 0;
        
        // Active now (sessions in last 5 minutes)
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const activeQuery = query(
                collection(db, 'sessions'),
                where('lastActivity', '>=', fiveMinutesAgo)
            );
            const activeSnapshot = await getDocs(activeQuery);
            activeNow = activeSnapshot.size;
            console.log('Active now:', activeNow);
        } catch (error) {
            console.warn('Could not fetch active sessions:', error.message);
        }
        
        console.log('Stats:', { totalPlayers, gamesToday, avgTokens, avgAttempts, winRate, activeNow });
        
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
