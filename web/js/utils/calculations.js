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
 * Get user rank from leaderboard
 * @param {Array} leaderboard - Sorted leaderboard array
 * @param {string} userId - User ID to find
 * @returns {number} Rank (1-indexed), or -1 if not found
 */
export function getUserRank(leaderboard, userId) {
    const index = leaderboard.findIndex(user => user.id === userId);
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
