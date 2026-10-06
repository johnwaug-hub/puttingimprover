/**
 * Calculation Utilities
 * Business logic for points, statistics, and other calculations
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Calculate session points
 * @param {number} makes - Number of successful putts
 * @param {number} attempts - Total number of attempts
 * @param {number} distance - Distance in feet
 * @returns {Object} Calculation results with points and percentage
 */
export function calculateSessionPoints(makes, attempts, distance) {
    const percentage = ((makes / attempts) * 100).toFixed(1);
    const distanceMultiplier = distance / CONSTANTS.POINTS.DISTANCE_DIVISOR;
    const accuracyMultiplier = parseFloat(percentage) / CONSTANTS.POINTS.ACCURACY_DIVISOR;
    const points = Math.round(makes * distanceMultiplier * accuracyMultiplier * CONSTANTS.POINTS.BASE_MULTIPLIER);

    return {
        points,
        percentage: parseFloat(percentage),
        distanceMultiplier,
        accuracyMultiplier
    };
}

/**
 * Calculate statistics from sessions
 * @param {Array} sessions - Array of session objects
 * @returns {Object} Statistics summary
 */
export function calculateStats(sessions) {
    if (!sessions || sessions.length === 0) {
        return {
            totalSessions: 0,
            totalPutts: 0,
            totalMakes: 0,
            accuracy: 0,
            bestSession: null,
            currentStreak: 0,
            longestStreak: 0
        };
    }

    let totalPutts = 0;
    let totalMakes = 0;
    let bestSession = sessions[0];

    sessions.forEach(session => {
        totalPutts += session.attempts;
        totalMakes += session.makes;

        if (session.points > bestSession.points) {
            bestSession = session;
        }
    });

    const accuracy = totalPutts > 0 ? ((totalMakes / totalPutts) * 100).toFixed(1) : 0;
    const streaks = calculateStreaks(sessions);

    return {
        totalSessions: sessions.length,
        totalPutts,
        totalMakes,
        accuracy: parseFloat(accuracy),
        bestSession,
        currentStreak: streaks.current,
        longestStreak: streaks.longest
    };
}

/**
 * Calculate practice streaks from all activities (sessions, games, routines)
 * @param {Array} sessions - Array of session objects
 * @param {Array} games - Array of game completion objects
 * @param {Array} routines - Array of routine completion objects
 * @returns {Object} Current and longest streak
 */
export function calculateAllActivitiesStreaks(sessions = [], games = [], routines = []) {
    // Helper to get local date string (YYYY-MM-DD) from various date formats
    const getLocalDateString = (dateValue) => {
        if (!dateValue) return null;
        
        // If it's already a YYYY-MM-DD string, use it
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Convert to Date and get local date
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Combine all activities with their dates
    const allActivities = [];

    // Add sessions
    sessions.forEach(s => {
        const date = getLocalDateString(s.timestamp || s.date);
        if (date) {
            allActivities.push({ date, type: 'session' });
        }
    });

    // Add games
    games.forEach(g => {
        const date = getLocalDateString(g.endTime || g.timestamp || g.date);
        if (date) {
            allActivities.push({ date, type: 'game' });
        }
    });

    // Add routines
    routines.forEach(r => {
        const date = getLocalDateString(r.endTime || r.timestamp || r.date);
        if (date) {
            allActivities.push({ date, type: 'routine' });
        }
    });

    if (allActivities.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Get unique dates (any activity on a day counts)
    const uniqueDates = [...new Set(allActivities.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));

    // Debug logging
    console.log('🔥 Streak calculation - unique dates:', uniqueDates);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Get today's local date string
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    console.log('🔥 Today string:', todayStr);

    // Calculate current streak (from today backward)
    for (let i = 0; i < uniqueDates.length; i++) {
        const activityDate = new Date(uniqueDates[i]);
        activityDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));

        console.log(`🔥 Activity ${i}: date=${uniqueDates[i]}, daysDiff=${daysDiff}`);

        // Streak is valid if activity is today (0 days) or consecutive days back (1, 2, 3...)
        if (i === 0) {
            // First activity: only count if today or yesterday
            if (daysDiff <= 1) {
                currentStreak = 1;
            } else {
                console.log('🔥 No current streak - most recent activity is more than 1 day old');
                break; // No current streak if most recent activity is older than yesterday
            }
        } else {
            // Check if this activity is exactly one day before the previous one
            const prevActivityDate = new Date(uniqueDates[i - 1]);
            prevActivityDate.setHours(0, 0, 0, 0);
            const gapDays = Math.floor((prevActivityDate - activityDate) / (1000 * 60 * 60 * 24));

            console.log(`🔥 Gap from ${uniqueDates[i-1]} to ${uniqueDates[i]}: ${gapDays} days`);

            if (gapDays === 1) {
                currentStreak++;
            } else {
                console.log('🔥 Streak broken - gap is not 1 day');
                break; // Streak broken
            }
        }
    }

    console.log('🔥 Current streak:', currentStreak);

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        prevDate.setHours(0, 0, 0, 0);
        currDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
}

/**
 * Calculate practice streaks
 * @param {Array} sessions - Array of session objects sorted by date
 * @returns {Object} Current and longest streak
 */
export function calculateStreaks(sessions) {
    if (!sessions || sessions.length === 0) {
        return { current: 0, longest: 0 };
    }

    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const uniqueDates = [...new Set(sortedSessions.map(s => s.date))];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = new Date(uniqueDates[i]);
        sessionDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === i) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
}

/**
 * Calculate total points from routine drills
 * @param {Array} drills - Array of drill objects with distance, makes, attempts
 * @returns {number} Total points earned
 */
export function calculateRoutinePoints(drills) {
    return drills.reduce((total, drill) => {
        const { points } = calculateSessionPoints(drill.makes, drill.attempts, drill.distance);
        return total + points;
    }, 0);
}

/**
 * Calculate points for game completion
 * @param {Object} game - Game object with scoring info
 * @param {Object} scoreData - Score data from game
 * @returns {number} Points earned
 */
export function calculateGamePoints(game, scoreData) {
    // Base points for game completion
    // Single player gets 50 points, multiplayer gets 50 × number of players
    const playerCount = scoreData.playerCount || 1;
    let basePoints = 50 * playerCount;

    console.log('🎮 Calculating game points:', {
        playerCount,
        basePoints,
        scoringType: game.scoring?.type,
        scoreData
    });

    // If we have makes, attempts, and distance, use session-equivalent calculation
    // This ensures games receive fair points based on actual putting performance
    if (scoreData.totalMakes !== undefined && 
        scoreData.totalAttempts !== undefined && 
        scoreData.totalAttempts > 0 &&
        scoreData.distance !== undefined) {
        
        const { points: sessionPoints } = calculateSessionPoints(
            scoreData.totalMakes,
            scoreData.totalAttempts,
            scoreData.distance
        );
        
        // Add base points for completing the game + session-equivalent points
        const totalPoints = basePoints + sessionPoints;
        console.log('🎮 Using session-equivalent points:', {
            basePoints,
            sessionPoints,
            totalPoints,
            makes: scoreData.totalMakes,
            attempts: scoreData.totalAttempts,
            distance: scoreData.distance
        });
        return totalPoints;
    }

    // Bonus points based on performance (fallback for games without full putt data)
    let bonusPoints = 0;
    const scoringType = game.scoring?.type || 'points';

    switch (scoringType) {
        case 'time':
            // Faster time = more points
            if (scoreData.timeInMinutes <= scoreData.targetTime) {
                bonusPoints = Math.round((scoreData.targetTime - scoreData.timeInMinutes) * 20);
            }
            break;

        case 'strokes':
            // Under par = more points
            const underPar = scoreData.par - scoreData.score;
            if (underPar > 0) {
                bonusPoints = underPar * 10;
            }
            break;

        case 'points':
            // Higher score = more points (10% of game score)
            bonusPoints = Math.round(scoreData.score * 0.1);
            break;

        case 'distance':
            // Longer distance = more points
            bonusPoints = Math.round(scoreData.maxDistance * 2);
            break;

        case 'streak':
            // Longer streak = more points
            bonusPoints = scoreData.streak * 5;
            break;

        case 'elimination':
            // Win = big bonus
            bonusPoints = scoreData.won ? 100 : 0;
            break;

        case 'percentage':
            // Calculate based on accuracy percentage
            // Enhanced: scale bonus based on percentage (up to 500 bonus for perfect)
            const accuracyBonus = Math.round(scoreData.percentage * 5);
            bonusPoints = accuracyBonus;
            console.log('📊 Percentage bonus:', {
                percentage: scoreData.percentage,
                accuracyBonus,
                bonusPoints,
                basePoints,
                totalPoints: basePoints + bonusPoints,
                fullScoreData: scoreData
            });
            break;

        case 'rotations':
            // Calculate based on makes and distance (like regular session)
            if (scoreData.totalMakes && scoreData.totalAttempts && scoreData.distance) {
                const { points } = calculateSessionPoints(
                    scoreData.totalMakes,
                    scoreData.totalAttempts,
                    scoreData.distance
                );
                console.log('✅ Total points (rotations):', points);
                return basePoints + points;
            }
            break;
    }

    const totalPoints = basePoints + bonusPoints;
    console.log('✅ Total points calculated:', {
        basePoints,
        bonusPoints,
        totalPoints
    });

    return totalPoints;
}

/**
 * Get user rank from leaderboard
 * @param {Array} leaderboard - Sorted leaderboard array
 * @param {string} userId - User ID to find
 * @returns {number} Rank (1-indexed), or -1 if not found
 */
export function getUserRank(leaderboard, userId, filterHidden = false) {
    // Filter out hidden users if requested (for achievement calculations)
    const filteredLeaderboard = filterHidden 
        ? leaderboard.filter(user => !user.hideFromLeaderboard)
        : leaderboard;
    const index = filteredLeaderboard.findIndex(user => user.id === userId);
    return index === -1 ? -1 : index + 1;
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}
