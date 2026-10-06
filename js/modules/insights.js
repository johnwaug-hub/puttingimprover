/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Insights Module
 * Handles daily challenges, streak warnings, smart recommendations, and practice analysis
 */

import { storageManager } from './storage.js';
import { userManager } from './user.js';
import { calculateAllActivitiesStreaks } from '../utils/calculations.js';

// ============================================
// LOCAL TIMEZONE HELPER FUNCTIONS
// ============================================
// These ensure daily/weekly challenges use the USER's local time, not UTC server time

/**
 * Get local date string in YYYY-MM-DD format
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Local date string like "2025-01-27"
 */
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get local start of day as ISO string (for Firestore queries)
 * @param {Date} date - Date object (defaults to today)
 * @returns {string} ISO string representing local midnight
 */
function getLocalStartOfDayISO(date = new Date()) {
    const localMidnight = new Date(date);
    localMidnight.setHours(0, 0, 0, 0);
    return localMidnight.toISOString();
}

/**
 * Get local end of day as ISO string (for Firestore queries)
 * @param {Date} date - Date object (defaults to today)
 * @returns {string} ISO string representing local 23:59:59.999
 */
function getLocalEndOfDayISO(date = new Date()) {
    const localEndOfDay = new Date(date);
    localEndOfDay.setHours(23, 59, 59, 999);
    return localEndOfDay.toISOString();
}

/**
 * Check if a timestamp/date string is "today" in local time
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {boolean} True if the timestamp is today in local time
 */
function isLocalToday(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Get local date string from a timestamp (handles both ISO strings and Date objects)
 * @param {string|Date} timestamp - Timestamp to convert
 * @returns {string} Local date string like "2025-01-27"
 */
function timestampToLocalDateString(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return getLocalDateString(date);
}

// Daily mini-challenge types - quick 5-minute tasks (60 total)
const DAILY_CHALLENGES = [
    // === MAKES CHALLENGES (12) ===
    { id: 'quick_10', type: 'makes', target: 10, distance: 15, desc: 'Make 10 putts from 15 feet', reward: 25, icon: '🎯' },
    { id: 'quick_20', type: 'makes', target: 20, distance: 10, desc: 'Make 20 putts from 10 feet', reward: 30, icon: '🔥' },
    { id: 'quick_15', type: 'makes', target: 15, distance: 12, desc: 'Make 15 putts from 12 feet', reward: 28, icon: '🎯' },
    { id: 'quick_25', type: 'makes', target: 25, distance: 8, desc: 'Make 25 putts from 8 feet', reward: 32, icon: '💪' },
    { id: 'quick_5_long', type: 'makes', target: 5, distance: 20, desc: 'Make 5 putts from 20 feet', reward: 30, icon: '📍' },
    { id: 'quick_8_mid', type: 'makes', target: 8, distance: 18, desc: 'Make 8 putts from 18 feet', reward: 28, icon: '🎯' },
    { id: 'warmup_10', type: 'makes', target: 10, distance: 5, desc: 'Make 10 putts from 5 feet', reward: 15, icon: '☀️' },
    { id: 'solid_12', type: 'makes', target: 12, distance: 15, desc: 'Make 12 putts from 15 feet', reward: 30, icon: '✅' },
    { id: 'dozen_maker', type: 'makes', target: 12, distance: 10, desc: 'Make a dozen from 10 feet', reward: 25, icon: '🔢' },
    { id: 'fifteen_fifteen', type: 'makes', target: 15, distance: 15, desc: 'Make 15 putts from 15 feet', reward: 35, icon: '1️⃣5️⃣' },
    { id: 'twenty_ten', type: 'makes', target: 20, distance: 10, desc: 'Make 20 putts from 10 feet', reward: 28, icon: '2️⃣0️⃣' },
    { id: 'chain_burner', type: 'makes', target: 30, distance: 10, desc: 'Make 30 putts from 10 feet', reward: 40, icon: '⛓️' },

    // === ACCURACY CHALLENGES (12) ===
    { id: 'accuracy_80', type: 'accuracy', target: 80, minAttempts: 10, desc: 'Hit 80%+ accuracy (min 10 attempts)', reward: 35, icon: '💯' },
    { id: 'accuracy_90', type: 'accuracy', target: 90, minAttempts: 10, desc: 'Hit 90%+ accuracy (min 10 attempts)', reward: 50, icon: '⭐' },
    { id: 'accuracy_75', type: 'accuracy', target: 75, minAttempts: 15, desc: 'Hit 75%+ accuracy (min 15 attempts)', reward: 30, icon: '📊' },
    { id: 'accuracy_85', type: 'accuracy', target: 85, minAttempts: 12, desc: 'Hit 85%+ accuracy (min 12 attempts)', reward: 40, icon: '🎖️' },
    { id: 'accuracy_95', type: 'accuracy', target: 95, minAttempts: 10, desc: 'Hit 95%+ accuracy (min 10 attempts)', reward: 60, icon: '💎' },
    { id: 'perfect_10', type: 'accuracy', target: 100, minAttempts: 10, desc: 'Go perfect on 10 attempts', reward: 75, icon: '🏆' },
    { id: 'accuracy_70_20', type: 'accuracy', target: 70, minAttempts: 20, desc: 'Hit 70%+ accuracy (min 20 attempts)', reward: 35, icon: '📈' },
    { id: 'accuracy_80_25', type: 'accuracy', target: 80, minAttempts: 25, desc: 'Hit 80%+ accuracy (min 25 attempts)', reward: 50, icon: '🎯' },
    { id: 'accuracy_60_30', type: 'accuracy', target: 60, minAttempts: 30, desc: 'Hit 60%+ accuracy (min 30 attempts)', reward: 35, icon: '💪' },
    { id: 'sharp_shooter', type: 'accuracy', target: 88, minAttempts: 15, desc: 'Hit 88%+ accuracy (min 15 attempts)', reward: 45, icon: '🔫' },
    { id: 'laser_precision', type: 'accuracy', target: 92, minAttempts: 12, desc: 'Hit 92%+ accuracy (min 12 attempts)', reward: 55, icon: '🔬' },
    { id: 'flawless_five', type: 'accuracy', target: 100, minAttempts: 5, desc: 'Go 5 for 5 perfect', reward: 40, icon: '✨' },

    // === DISTANCE CHALLENGES (12) ===
    { id: 'distance_25', type: 'distance', target: 5, distance: 25, desc: 'Make 5 putts from 25+ feet', reward: 40, icon: '📏' },
    { id: 'distance_30', type: 'distance', target: 3, distance: 30, desc: 'Make 3 putts from 30+ feet', reward: 45, icon: '🚀' },
    { id: 'circle_edge', type: 'distance', target: 5, distance: 33, desc: 'Make 5 putts from Circle 1 edge (33ft)', reward: 50, icon: '⭕' },
    { id: 'distance_20', type: 'distance', target: 8, distance: 20, desc: 'Make 8 putts from 20+ feet', reward: 35, icon: '📍' },
    { id: 'distance_35', type: 'distance', target: 3, distance: 35, desc: 'Make 3 putts from 35+ feet', reward: 55, icon: '🎯' },
    { id: 'distance_40', type: 'distance', target: 2, distance: 40, desc: 'Make 2 putts from 40+ feet', reward: 60, icon: '🏹' },
    { id: 'long_range_5', type: 'distance', target: 5, distance: 28, desc: 'Make 5 putts from 28+ feet', reward: 45, icon: '🌟' },
    { id: 'mid_range_10', type: 'distance', target: 10, distance: 18, desc: 'Make 10 putts from 18+ feet', reward: 35, icon: '📐' },
    { id: 'circle_2_starter', type: 'distance', target: 2, distance: 45, desc: 'Make 2 putts from 45+ feet', reward: 65, icon: '🔵' },
    { id: 'downtown', type: 'distance', target: 1, distance: 50, desc: 'Make 1 putt from 50+ feet', reward: 50, icon: '🏙️' },
    { id: 'consistent_25', type: 'distance', target: 7, distance: 25, desc: 'Make 7 putts from 25+ feet', reward: 50, icon: '📊' },
    { id: 'edge_master', type: 'distance', target: 8, distance: 30, desc: 'Make 8 putts from 30+ feet', reward: 65, icon: '👑' },

    // === VOLUME CHALLENGES (8) ===
    { id: 'volume_30', type: 'volume', target: 30, desc: 'Make 30 total putts today', reward: 25, icon: '💪' },
    { id: 'volume_50', type: 'volume', target: 50, desc: 'Make 50 total putts today', reward: 35, icon: '🔥' },
    { id: 'volume_75', type: 'volume', target: 75, desc: 'Make 75 total putts today', reward: 45, icon: '💥' },
    { id: 'volume_100', type: 'volume', target: 100, desc: 'Make 100 total putts today', reward: 60, icon: '💯' },
    { id: 'volume_40', type: 'volume', target: 40, desc: 'Make 40 total putts today', reward: 30, icon: '📈' },
    { id: 'volume_60', type: 'volume', target: 60, desc: 'Make 60 total putts today', reward: 40, icon: '⚡' },
    { id: 'volume_150', type: 'volume', target: 150, desc: 'Make 150 total putts today', reward: 80, icon: '🏆' },
    { id: 'volume_200', type: 'volume', target: 200, desc: 'Make 200 total putts today', reward: 100, icon: '🌟' },

    // === STREAK CHALLENGES (6) ===
    { id: 'streak_5', type: 'streak', target: 5, desc: 'Make 5 putts in a row', reward: 35, icon: '🔗' },
    { id: 'streak_8', type: 'streak', target: 8, desc: 'Make 8 putts in a row', reward: 50, icon: '⛓️' },
    { id: 'streak_10', type: 'streak', target: 10, desc: 'Make 10 putts in a row', reward: 65, icon: '🔥' },
    { id: 'streak_3', type: 'streak', target: 3, desc: 'Make 3 putts in a row', reward: 20, icon: '🔗' },
    { id: 'streak_7', type: 'streak', target: 7, desc: 'Make 7 putts in a row', reward: 45, icon: '7️⃣' },
    { id: 'streak_12', type: 'streak', target: 12, desc: 'Make 12 putts in a row', reward: 80, icon: '💎' },

    // === TIME-BASED CHALLENGES (5) ===
    { id: 'morning_session', type: 'time', timeWindow: 'morning', desc: 'Complete a session before noon', reward: 20, icon: '🌅' },
    { id: 'early_bird', type: 'time', timeWindow: 'early', desc: 'Complete a session before 8am', reward: 35, icon: '🐦' },
    { id: 'lunch_break', type: 'time', timeWindow: 'lunch', desc: 'Complete a session between 11am-1pm', reward: 25, icon: '🍽️' },
    { id: 'evening_practice', type: 'time', timeWindow: 'evening', desc: 'Complete a session after 5pm', reward: 25, icon: '🌆' },
    { id: 'golden_hour', type: 'time', timeWindow: 'golden', desc: 'Complete a session between 6-8pm', reward: 30, icon: '🌇' },

    // === CONSISTENCY CHALLENGES (5) ===
    { id: 'consistency', type: 'consistency', target: 2, desc: 'Log 2 separate practice sessions', reward: 40, icon: '📊' },
    { id: 'triple_session', type: 'consistency', target: 3, desc: 'Log 3 separate practice sessions', reward: 60, icon: '3️⃣' },
    { id: 'activity_variety', type: 'variety', target: 2, desc: 'Complete 2 different activity types', reward: 35, icon: '🎨' },
    { id: 'full_variety', type: 'variety', target: 3, desc: 'Complete session, routine, AND game', reward: 75, icon: '🌈' },
    { id: 'mixed_practice', type: 'distances', target: 3, desc: 'Practice from 3 different distances', reward: 30, icon: '🎨' }
];

class InsightsManager {
    constructor() {
        this.dailyChallenge = null;
        this.todaysSessions = [];
    }

    /**
     * Get or create today's daily challenge
     */
    async getDailyChallenge() {
        const user = userManager.getCurrentUser();
        if (!user) return null;

        const today = new Date().toDateString();
        const stored = user.dailyChallenge;

        // Check if we have a valid challenge for today
        if (stored && stored.date === today) {
            this.dailyChallenge = stored;
            
            // Recalculate progress for accumulation-type challenges to fix stale values
            if (!stored.completed && ['volume', 'consistency', 'distances', 'makes', 'distance'].includes(stored.type)) {
                try {
                    let freshProgress = 0;
                    if (stored.type === 'volume') {
                        freshProgress = await this.getTodaysTotalMakes();
                    } else if (stored.type === 'consistency') {
                        freshProgress = await this.getTodaysActivityCount();
                    } else if (stored.type === 'distances') {
                        freshProgress = await this.getTodaysUniqueDistances();
                    } else if (stored.type === 'makes' || stored.type === 'distance') {
                        freshProgress = await this.getTodaysMakesAtDistance(stored.distance || 0);
                    }

                    this.dailyChallenge.progress = freshProgress;

                    // If progress meets or exceeds target, mark complete and award points
                    if (freshProgress >= stored.target && !this.dailyChallenge.completed) {
                        this.dailyChallenge.completed = true;
                        console.log(`✅ Daily challenge auto-completed on load: ${freshProgress}/${stored.target}`);
                        await storageManager.updateUser(user.id, {
                            dailyChallenge: this.dailyChallenge,
                            totalPoints: firebase.firestore.FieldValue.increment(stored.reward || 0),
                            dailyChallengesCompleted: firebase.firestore.FieldValue.increment(1)
                        });
                    } else if (freshProgress !== stored.progress) {
                        console.log(`🔄 Daily challenge progress corrected: ${stored.progress} → ${freshProgress}`);
                        user.dailyChallenge = this.dailyChallenge;
                        await storageManager.updateUser(user.id, { dailyChallenge: this.dailyChallenge });
                    }
                } catch (e) {
                    console.warn('Could not recalculate daily progress on load:', e);
                }
            }
            
            return this.dailyChallenge;
        }

        // Create new daily challenge
        const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length);
        const challengeTemplate = DAILY_CHALLENGES[randomIndex];

        const newChallenge = {
            ...challengeTemplate,
            date: today,
            completed: false,
            progress: 0
        };

        // Save to user — use updateUser (partial) to guarantee the field reaches Firestore
        user.dailyChallenge = newChallenge;
        await storageManager.updateUser(user.id, { dailyChallenge: newChallenge });

        this.dailyChallenge = newChallenge;
        return newChallenge;
    }

    /**
     * Check daily challenge progress
     * @param {Object} activity - Activity data (session, routine, or game)
     * @param {string} activityType - 'session', 'routine', or 'game'
     */
    async checkDailyChallengeProgress(activity, activityType = 'session') {
        if (!this.dailyChallenge || this.dailyChallenge.completed) return null;

        const user = userManager.getCurrentUser();
        if (!user) return null;

        const today = new Date().toDateString();
        if (this.dailyChallenge.date !== today) {
            await this.getDailyChallenge();
            return null;
        }

        // Normalize activity data
        const makes = activity.makes || activity.totalStats?.totalMakes || activity.totalMakes || 0;
        const attempts = activity.attempts || activity.totalStats?.totalAttempts || activity.totalAttempts || 0;
        const percentage = attempts > 0 ? (makes / attempts) * 100 : (activity.percentage || 0);
        const distance = activity.distance || activity.drills?.[0]?.distance || activity.drillScores?.[0]?.distance || 0;

        let completed = false;
        let progress = 0;

        switch (this.dailyChallenge.type) {
            case 'makes': {
                const minDist = this.dailyChallenge.distance || 0;
                // Get accumulated total from cache/Firestore
                let todayMakesAtDist = await this.getTodaysMakesAtDistance(minDist);
                // If current activity qualifies and accumulated total seems low, ensure it's counted
                // (handles timing gap where session not yet in userManager.sessions cache)
                if (distance >= minDist && todayMakesAtDist < makes) {
                    todayMakesAtDist = makes; // at minimum, count this activity
                }
                progress = todayMakesAtDist;
                if (todayMakesAtDist >= this.dailyChallenge.target) completed = true;
                break;
            }

            case 'accuracy':
                if (percentage >= this.dailyChallenge.target &&
                    attempts >= (this.dailyChallenge.minAttempts || 10)) {
                    completed = true;
                }
                progress = percentage;
                break;

            case 'distance': {
                const minDistReq = this.dailyChallenge.distance || 0;
                let todayMakesAtReqDist = await this.getTodaysMakesAtDistance(minDistReq);
                if (distance >= minDistReq && todayMakesAtReqDist < makes) {
                    todayMakesAtReqDist = makes;
                }
                progress = todayMakesAtReqDist;
                if (todayMakesAtReqDist >= this.dailyChallenge.target) completed = true;
                break;
            }

            case 'volume':
                // Need to count all today's activities (sessions, routines, games)
                const todayMakes = await this.getTodaysTotalMakes();
                if (todayMakes >= this.dailyChallenge.target) {
                    completed = true;
                }
                progress = todayMakes;
                break;

            case 'time':
                const hour = new Date().getHours();
                const timeWindow = this.dailyChallenge.timeWindow;
                if (timeWindow === 'morning' && hour < 12) {
                    completed = true;
                } else if (timeWindow === 'early' && hour < 8) {
                    completed = true;
                } else if (timeWindow === 'lunch' && hour >= 11 && hour < 13) {
                    completed = true;
                } else if (timeWindow === 'evening' && hour >= 17) {
                    completed = true;
                } else if (timeWindow === 'golden' && hour >= 18 && hour < 20) {
                    completed = true;
                }
                progress = completed ? 1 : 0;
                break;

            case 'streak':
                // Check for consecutive makes in the activity
                const streakTarget = this.dailyChallenge.target || 5;
                // Simple check: if accuracy is high enough with enough attempts, likely had a streak
                if (makes >= streakTarget && percentage >= 80) {
                    completed = true;
                }
                progress = makes;
                break;

            case 'variety':
                // Check for different activity types today
                const activityTypes = await this.getTodaysActivityTypes();
                if (activityTypes >= this.dailyChallenge.target) {
                    completed = true;
                }
                progress = activityTypes;
                break;

            case 'consistency':
                const todayActivities = await this.getTodaysActivityCount();
                if (todayActivities >= this.dailyChallenge.target) {
                    completed = true;
                }
                progress = todayActivities;
                break;

            case 'distances':
                const uniqueDistances = await this.getTodaysUniqueDistances();
                if (uniqueDistances >= this.dailyChallenge.target) {
                    completed = true;
                }
                progress = uniqueDistances;
                break;
        }

        // Update progress directly (volume/consistency types do full recounts)
        this.dailyChallenge.progress = progress;

        if (completed && !this.dailyChallenge.completed) {
            this.dailyChallenge.completed = true;

            // Use partial update to avoid overwriting stats set by accept methods
            await storageManager.updateUser(user.id, {
                dailyChallenge: this.dailyChallenge,
                totalPoints: firebase.firestore.FieldValue.increment(this.dailyChallenge.reward),
                dailyChallengesCompleted: firebase.firestore.FieldValue.increment(1)
            });

            // Update local cache to reflect changes
            user.dailyChallenge = this.dailyChallenge;
            user.totalPoints = (user.totalPoints || 0) + this.dailyChallenge.reward;
            user.dailyChallengesCompleted = (user.dailyChallengesCompleted || 0) + 1;

            return {
                completed: true,
                reward: this.dailyChallenge.reward,
                challenge: this.dailyChallenge
            };
        }

        // Save progress only (partial update to avoid overwriting stats)
        await storageManager.updateUser(user.id, {
            dailyChallenge: this.dailyChallenge
        });
        user.dailyChallenge = this.dailyChallenge;

        return { completed: false, progress };
    }

    /**
     * Recalculate daily challenge from all today's activities
     * @returns {Promise<Object>} Result with completed status
     */
    async recalculateDailyChallenge() {
        const user = userManager.getCurrentUser();
        if (!user) return { completed: false, error: 'No user' };

        // Make sure we have today's challenge
        await this.getDailyChallenge();
        
        if (!this.dailyChallenge) {
            return { completed: false, error: 'No daily challenge' };
        }

        // Already completed
        if (this.dailyChallenge.completed) {
            return { completed: true, alreadyCompleted: true, challenge: this.dailyChallenge };
        }

        const today = new Date().toDateString();
        // Use LOCAL date string, not UTC!
        const todayStr = getLocalDateString();
        
        // Create LOCAL timestamp range for today (more reliable than date string matching)
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();

        try {
            const db = firebase.firestore();
            
            // Gather all today's activities
            const allActivities = [];

            // Sessions from userManager
            const sessions = userManager.sessions || [];
            sessions.forEach(s => {
                if (new Date(s.timestamp || s.date).toDateString() === today && !s.excludeFromStats && !s.pending) {
                    allActivities.push({
                        type: 'session',
                        makes: s.makes || 0,
                        attempts: s.attempts || 0,
                        percentage: s.percentage || 0,
                        distance: s.distance || 0
                    });
                }
            });

            // Routines from Firebase - query by both date string AND timestamp for robustness
            let routinesSnapshot;
            try {
                // Try timestamp-based query first (more reliable)
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                // Fallback to date string query
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                // Use local time helpers for date comparison
                const routineLocalDate = routine.timestamp ? timestampToLocalDateString(routine.timestamp) : (routine.date || '');
                const isToday = routineLocalDate === todayStr || isLocalToday(routine.timestamp);
                
                if (isToday && !routine.excludeFromStats && !routine.pending) {
                    const makes = routine.totalStats?.totalMakes || 
                                  routine.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                    const attempts = routine.totalStats?.totalAttempts || 
                                     routine.drillScores?.reduce((sum, d) => sum + (d.attempts || 0), 0) || 0;
                    allActivities.push({
                        type: 'routine',
                        makes,
                        attempts,
                        percentage: attempts > 0 ? (makes / attempts) * 100 : 0,
                        distance: routine.drillScores?.[0]?.distance || routine.drillResults?.[0]?.distance || 0
                    });
                }
            });

            // Games from Firebase - query by both date string AND timestamp for robustness
            let gamesSnapshot;
            try {
                // Try timestamp-based query first (more reliable)
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                // Fallback to date string query
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                // Use local time helpers for date comparison
                const gameLocalDate = game.timestamp ? timestampToLocalDateString(game.timestamp) : (game.date || '');
                const isToday = gameLocalDate === todayStr || isLocalToday(game.timestamp);
                
                if (isToday && !game.excludeFromStats && !game.pending) {
                    allActivities.push({
                        type: 'game',
                        makes: game.totalMakes || 0,
                        attempts: game.totalAttempts || 0,
                        percentage: game.percentage || 0,
                        distance: game.distance || 0
                    });
                }
            });

            console.log(`🎯 Recalculating daily challenge with ${allActivities.length} activities`);

            let completed = false;
            let progress = 0;

            switch (this.dailyChallenge.type) {
                case 'makes':
                case 'distance':
                    // Check if any activity meets the criteria
                    for (const a of allActivities) {
                        if (a.distance >= this.dailyChallenge.distance && a.makes >= this.dailyChallenge.target) {
                            completed = true;
                            break;
                        }
                        if (a.distance >= this.dailyChallenge.distance) {
                            progress = Math.max(progress, a.makes);
                        }
                    }
                    console.log(`   Makes/Distance: best=${progress}, target=${this.dailyChallenge.target} from ${this.dailyChallenge.distance}ft`);
                    break;

                case 'accuracy':
                    // Best accuracy from any activity with enough attempts
                    for (const a of allActivities) {
                        if (a.percentage >= this.dailyChallenge.target && a.attempts >= (this.dailyChallenge.minAttempts || 10)) {
                            completed = true;
                            break;
                        }
                        if (a.attempts >= (this.dailyChallenge.minAttempts || 10)) {
                            progress = Math.max(progress, a.percentage);
                        }
                    }
                    console.log(`   Accuracy: best=${progress.toFixed(1)}%, target=${this.dailyChallenge.target}%`);
                    break;

                case 'volume':
                    // Total makes from all activities
                    progress = allActivities.reduce((sum, a) => sum + a.makes, 0);
                    if (progress >= this.dailyChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Volume: ${progress}/${this.dailyChallenge.target} makes`);
                    break;

                case 'time':
                    const hour = new Date().getHours();
                    if (this.dailyChallenge.timeWindow === 'morning' && hour < 12 && allActivities.length > 0) {
                        completed = true;
                        progress = 1;
                    }
                    console.log(`   Time: ${allActivities.length > 0 ? 'practiced' : 'not practiced'}, morning=${hour < 12}`);
                    break;

                case 'consistency':
                    progress = allActivities.length;
                    if (progress >= this.dailyChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Consistency: ${progress}/${this.dailyChallenge.target} activities`);
                    break;

                case 'distances':
                    const distances = new Set(allActivities.map(a => a.distance).filter(d => d > 0));
                    progress = distances.size;
                    if (progress >= this.dailyChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Distances: ${progress}/${this.dailyChallenge.target} unique distances`);
                    break;
            }

            // Set progress from full recalculation (authoritative recount)
            this.dailyChallenge.progress = progress;

            if (completed) {
                this.dailyChallenge.completed = true;
                user.dailyChallenge = this.dailyChallenge;
                user.totalPoints = (user.totalPoints || 0) + this.dailyChallenge.reward;
                user.dailyChallengesCompleted = (user.dailyChallengesCompleted || 0) + 1;
                await storageManager.saveUser(user);
                console.log('🎉 Daily challenge completed via recalculation!');
                return { completed: true, reward: this.dailyChallenge.reward, challenge: this.dailyChallenge };
            }

            // Save progress
            user.dailyChallenge = this.dailyChallenge;
            await storageManager.saveUser(user);

            return { completed: false, progress, target: this.dailyChallenge.target, challenge: this.dailyChallenge };

        } catch (error) {
            console.error('Error recalculating daily challenge:', error);
            return { completed: false, error: error.message };
        }
    }

    /**
     * Recheck daily challenge after an activity is deleted
     * This can UNCOMPLETE a challenge and remove points if no longer qualifying
     * @returns {Promise<Object>} Result with wasCompleted, isNowCompleted, pointsToRemove
     */
    async recheckDailyChallengeAfterDelete() {
        const user = userManager.getCurrentUser();
        if (!user) return { wasCompleted: false, isNowCompleted: false, pointsToRemove: 0 };

        // Get today's challenge
        await this.getDailyChallenge();
        
        if (!this.dailyChallenge) {
            return { wasCompleted: false, isNowCompleted: false, pointsToRemove: 0 };
        }

        const wasCompleted = this.dailyChallenge.completed;
        if (!wasCompleted) {
            return { wasCompleted: false, isNowCompleted: false, pointsToRemove: 0 };
        }

        const today = new Date().toDateString();
        const todayStr = getLocalDateString();
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();

        try {
            const db = firebase.firestore();
            const allActivities = [];

            // Sessions from userManager (already updated after delete)
            const sessions = userManager.sessions || [];
            sessions.forEach(s => {
                if (new Date(s.timestamp || s.date).toDateString() === today && !s.excludeFromStats && !s.pending) {
                    allActivities.push({
                        type: 'session',
                        makes: s.makes || 0,
                        attempts: s.attempts || 0,
                        percentage: s.percentage || 0,
                        distance: s.distance || 0
                    });
                }
            });

            // Routines from Firebase
            let routinesSnapshot;
            try {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                const routineLocalDate = routine.timestamp ? timestampToLocalDateString(routine.timestamp) : (routine.date || '');
                const isToday = routineLocalDate === todayStr || isLocalToday(routine.timestamp);
                
                if (isToday && !routine.excludeFromStats && !routine.pending) {
                    const makes = routine.totalStats?.totalMakes || 
                                  routine.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                    const attempts = routine.totalStats?.totalAttempts || 
                                     routine.drillScores?.reduce((sum, d) => sum + (d.attempts || 0), 0) || 0;
                    allActivities.push({
                        type: 'routine',
                        makes,
                        attempts,
                        percentage: attempts > 0 ? (makes / attempts) * 100 : 0,
                        distance: routine.drillScores?.[0]?.distance || routine.drillResults?.[0]?.distance || 0
                    });
                }
            });

            // Games from Firebase
            let gamesSnapshot;
            try {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                const gameLocalDate = game.timestamp ? timestampToLocalDateString(game.timestamp) : (game.date || '');
                const isToday = gameLocalDate === todayStr || isLocalToday(game.timestamp);
                
                if (isToday && !game.excludeFromStats && !game.pending) {
                    allActivities.push({
                        type: 'game',
                        makes: game.totalMakes || 0,
                        attempts: game.totalAttempts || 0,
                        percentage: game.percentage || 0,
                        distance: game.distance || 0
                    });
                }
            });

            console.log(`🔄 Rechecking daily challenge after delete with ${allActivities.length} remaining activities`);

            let stillCompleted = false;

            switch (this.dailyChallenge.type) {
                case 'makes':
                case 'distance':
                    for (const a of allActivities) {
                        if (a.distance >= this.dailyChallenge.distance && a.makes >= this.dailyChallenge.target) {
                            stillCompleted = true;
                            break;
                        }
                    }
                    break;

                case 'accuracy':
                    for (const a of allActivities) {
                        if (a.percentage >= this.dailyChallenge.target && a.attempts >= (this.dailyChallenge.minAttempts || 10)) {
                            stillCompleted = true;
                            break;
                        }
                    }
                    break;

                case 'volume':
                    const totalMakes = allActivities.reduce((sum, a) => sum + a.makes, 0);
                    stillCompleted = totalMakes >= this.dailyChallenge.target;
                    break;

                case 'time':
                    // Time-based can't be uncompleted once done
                    stillCompleted = true;
                    break;

                case 'consistency':
                    stillCompleted = allActivities.length >= this.dailyChallenge.target;
                    break;

                case 'distances':
                    const distances = new Set(allActivities.map(a => a.distance).filter(d => d > 0));
                    stillCompleted = distances.size >= this.dailyChallenge.target;
                    break;
            }

            if (!stillCompleted) {
                // Uncomplete the challenge and remove points
                const reward = this.dailyChallenge.reward || 0;
                
                this.dailyChallenge.completed = false;
                this.dailyChallenge.progress = 0;
                user.dailyChallenge = this.dailyChallenge;
                user.totalPoints = Math.max(0, (user.totalPoints || 0) - reward);
                user.dailyChallengesCompleted = Math.max(0, (user.dailyChallengesCompleted || 0) - 1);
                
                await storageManager.saveUser(user);
                
                console.log(`⚠️ Daily challenge uncompleted after delete, removed ${reward} points`);
                
                return {
                    wasCompleted: true,
                    isNowCompleted: false,
                    pointsToRemove: reward
                };
            }

            return { wasCompleted: true, isNowCompleted: true, pointsToRemove: 0 };

        } catch (error) {
            console.error('Error rechecking daily challenge after delete:', error);
            return { wasCompleted: true, isNowCompleted: true, pointsToRemove: 0, error: error.message };
        }
    }

    /**
     * Get today's total makes across all activities (sessions, routines, games)
     */
    async getTodaysTotalMakes() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        const today = new Date().toDateString();
        // Use LOCAL date string, not UTC!
        const todayStr = getLocalDateString();
        
        // Create LOCAL timestamp range for today
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();
        
        let totalMakes = 0;

        // Sessions from userManager
        const sessions = userManager.sessions || [];
        sessions.forEach(s => {
            if (isLocalToday(s.timestamp || s.date) && !s.excludeFromStats && !s.pending) {
                totalMakes += s.makes || 0;
            }
        });

        // Routines and games from Firebase
        try {
            const db = firebase.firestore();

            // Try timestamp-based query first for routines
            let routinesSnapshot;
            try {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                const routineLocalDate = routine.timestamp ? timestampToLocalDateString(routine.timestamp) : (routine.date || '');
                const isToday = routineLocalDate === todayStr || isLocalToday(routine.timestamp);
                
                if (isToday && !routine.excludeFromStats && !routine.pending) {
                    const makes = routine.totalStats?.totalMakes || 
                                  routine.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                    totalMakes += makes;
                }
            });

            // Try timestamp-based query first for games
            let gamesSnapshot;
            try {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                const gameLocalDate = game.timestamp ? timestampToLocalDateString(game.timestamp) : (game.date || '');
                const isToday = gameLocalDate === todayStr || isLocalToday(game.timestamp);
                
                if (isToday && !game.excludeFromStats && !game.pending) {
                    totalMakes += game.totalMakes || 0;
                }
            });
        } catch (error) {
            console.warn('Could not fetch routines/games for daily makes:', error);
        }

        return totalMakes;
    }

    /**
     * Get today's activity count (sessions, routines, games)
     */
    async getTodaysActivityCount() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        const today = new Date().toDateString();
        // Use LOCAL date string, not UTC!
        const todayStr = getLocalDateString();
        
        // Create LOCAL timestamp range for today
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();
        
        let count = 0;

        // Sessions
        const sessions = userManager.sessions || [];
        count += sessions.filter(s => 
            isLocalToday(s.timestamp || s.date) && !s.excludeFromStats && !s.pending
        ).length;

        // Routines and games from Firebase
        try {
            const db = firebase.firestore();

            // Try timestamp-based query first for routines
            let routinesSnapshot;
            try {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            count += routinesSnapshot.docs.filter(doc => {
                const r = doc.data();
                const routineLocalDate = r.timestamp ? timestampToLocalDateString(r.timestamp) : (r.date || '');
                const isToday = routineLocalDate === todayStr || isLocalToday(r.timestamp);
                return isToday && !r.excludeFromStats && !r.pending;
            }).length;

            // Try timestamp-based query first for games
            let gamesSnapshot;
            try {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '>=', todayStr)
                    .where('date', '<=', todayStr)
                    .get();
            }

            count += gamesSnapshot.docs.filter(doc => {
                const g = doc.data();
                const gameLocalDate = g.timestamp ? timestampToLocalDateString(g.timestamp) : (g.date || '');
                const isToday = gameLocalDate === todayStr || isLocalToday(g.timestamp);
                return isToday && !g.excludeFromStats && !g.pending;
            }).length;
        } catch (error) {
            console.warn('Could not fetch routines/games for activity count:', error);
        }

        return count;
    }

    /**
     * Get today's session count (legacy - sessions only)
     */
    async getTodaysSessionCount() {
        const sessions = userManager.sessions || [];
        return sessions.filter(s => isLocalToday(s.timestamp || s.date)).length;
    }

    /**
     * Get unique distances practiced today
     */
    /**
     * Get total makes today at or beyond a minimum distance
     * Used for 'makes' and 'distance' type daily challenges
     */
    async getTodaysMakesAtDistance(minDistance) {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        const todayStr = getLocalDateString();
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();

        let totalMakes = 0;

        // Sessions
        const sessions = userManager.sessions || [];
        sessions.forEach(s => {
            if (isLocalToday(s.timestamp || s.date) && !s.excludeFromStats && !s.pending) {
                if ((s.distance || 0) >= minDistance) {
                    totalMakes += s.makes || 0;
                }
            }
        });

        // Routines — check each drill's distance
        try {
            const db = firebase.firestore();
            let routinesSnapshot;
            try {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '==', todayStr)
                    .get();
            }
            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                const routineLocalDate = routine.timestamp ? timestampToLocalDateString(routine.timestamp) : (routine.date || '');
                if ((routineLocalDate === todayStr || isLocalToday(routine.timestamp)) && !routine.excludeFromStats) {
                    const drills = routine.drillScores || routine.drills || [];
                    drills.forEach(d => {
                        if ((d.distance || 0) >= minDistance) {
                            totalMakes += d.makes || 0;
                        }
                    });
                }
            });

            // Games
            let gamesSnapshot;
            try {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .get();
            } catch (e) {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '==', todayStr)
                    .get();
            }
            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                const gameLocalDate = game.timestamp ? timestampToLocalDateString(game.timestamp) : (game.date || '');
                if ((gameLocalDate === todayStr || isLocalToday(game.timestamp)) && !game.excludeFromStats) {
                    if ((game.distance || 0) >= minDistance) {
                        totalMakes += game.totalMakes || 0;
                    }
                }
            });
        } catch (error) {
            console.warn('Could not fetch routines/games for distance makes:', error);
        }

        return totalMakes;
    }

    async getTodaysUniqueDistances() {
        const sessions = userManager.sessions || [];

        const distances = new Set(
            sessions
                .filter(s => isLocalToday(s.timestamp || s.date))
                .map(s => s.distance)
        );

        return distances.size;
    }

    /**
     * Get count of different activity types completed today
     */
    async getTodaysActivityTypes() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        // Use LOCAL date string, not UTC!
        const todayStr = getLocalDateString();
        
        // Create LOCAL timestamp range for today
        const startOfTodayISO = getLocalStartOfDayISO();
        const endOfTodayISO = getLocalEndOfDayISO();
        
        let types = 0;

        // Check sessions
        const sessions = userManager.sessions || [];
        if (sessions.some(s => isLocalToday(s.timestamp || s.date))) {
            types++;
        }

        // Check routines
        try {
            const db = firebase.firestore();
            let routinesSnapshot;
            try {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .limit(1)
                    .get();
            } catch (e) {
                routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                    .where('date', '==', todayStr)
                    .limit(1)
                    .get();
            }
            
            // Verify the result is actually from today using local time
            const hasRoutineToday = routinesSnapshot.docs.some(doc => {
                const r = doc.data();
                const routineLocalDate = r.timestamp ? timestampToLocalDateString(r.timestamp) : (r.date || '');
                return routineLocalDate === todayStr || isLocalToday(r.timestamp);
            });
            
            if (hasRoutineToday) {
                types++;
            }
        } catch (error) {
            // Ignore
        }

        // Check games
        try {
            const db = firebase.firestore();
            let gamesSnapshot;
            try {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('timestamp', '>=', startOfTodayISO)
                    .where('timestamp', '<=', endOfTodayISO)
                    .limit(1)
                    .get();
            } catch (e) {
                gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                    .where('date', '==', todayStr)
                    .limit(1)
                    .get();
            }
            
            // Verify the result is actually from today using local time
            const hasGameToday = gamesSnapshot.docs.some(doc => {
                const g = doc.data();
                const gameLocalDate = g.timestamp ? timestampToLocalDateString(g.timestamp) : (g.date || '');
                return gameLocalDate === todayStr || isLocalToday(g.timestamp);
            });
            
            if (hasGameToday) {
                types++;
            }
        } catch (error) {
            // Ignore
        }

        return types;
    }

    /**
     * Get streak warning if user is at risk of losing their streak
     */
    getStreakWarning(sessions = [], games = [], routines = []) {
        const user = userManager.getCurrentUser();
        if (!user) return null;

        // Use provided data or fallback to userManager.sessions
        const allSessions = sessions.length > 0 ? sessions : (userManager.sessions || []);
        
        // Check if user has practiced today (ANY activity counts) using local time
        const practicedToday = 
            allSessions.some(s => isLocalToday(s.timestamp || s.date)) ||
            routines.some(r => isLocalToday(r.endTime || r.timestamp || r.date)) ||
            games.some(g => isLocalToday(g.endTime || g.timestamp || g.date));

        if (practicedToday) return null;

        // Calculate current streak from all activities (using imported function)
        const streaks = calculateAllActivitiesStreaks(allSessions, games, routines);
        const currentStreak = streaks.current || 0;

        if (currentStreak === 0) return null;

        // Calculate hours until midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const hoursLeft = Math.floor((midnight - now) / (1000 * 60 * 60));

        return {
            currentStreak,
            hoursLeft,
            urgent: hoursLeft <= 4,
            message: hoursLeft <= 4
                ? `⚠️ Only ${hoursLeft} hours left to save your ${currentStreak}-day streak!`
                : `📅 Practice today to keep your ${currentStreak}-day streak going!`
        };
    }

    /**
     * Analyze user's practice patterns and identify weaknesses
     */
    analyzeWeaknesses() {
        const sessions = userManager.sessions || [];
        if (sessions.length < 5) {
            return {
                hasEnoughData: false,
                message: "Log at least 5 sessions to see your analysis"
            };
        }

        // Group sessions by distance ranges
        const distanceRanges = {
            short: { min: 0, max: 15, sessions: [], label: '0-15ft (Short)' },
            medium: { min: 16, max: 25, sessions: [], label: '16-25ft (Medium)' },
            long: { min: 26, max: 33, sessions: [], label: '26-33ft (Circle 1)' },
            extraLong: { min: 34, max: 100, sessions: [], label: '34ft+ (Circle 2)' }
        };

        sessions.forEach(s => {
            const d = s.distance || 0;
            if (d <= 15) distanceRanges.short.sessions.push(s);
            else if (d <= 25) distanceRanges.medium.sessions.push(s);
            else if (d <= 33) distanceRanges.long.sessions.push(s);
            else distanceRanges.extraLong.sessions.push(s);
        });

        // Calculate accuracy for each range
        const rangeStats = {};
        let weakestRange = null;
        let weakestAccuracy = 100;
        let strongestRange = null;
        let strongestAccuracy = 0;

        Object.entries(distanceRanges).forEach(([key, range]) => {
            if (range.sessions.length >= 2) {
                const totalMakes = range.sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                const totalAttempts = range.sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

                rangeStats[key] = {
                    ...range,
                    accuracy: accuracy.toFixed(1),
                    sessionCount: range.sessions.length,
                    totalMakes,
                    totalAttempts
                };

                if (accuracy < weakestAccuracy) {
                    weakestAccuracy = accuracy;
                    weakestRange = key;
                }
                if (accuracy > strongestAccuracy) {
                    strongestAccuracy = accuracy;
                    strongestRange = key;
                }
            } else {
                rangeStats[key] = {
                    ...range,
                    accuracy: null,
                    sessionCount: range.sessions.length,
                    needsMoreData: true
                };
            }
        });

        // Analyze time of day performance
        const timeAnalysis = this.analyzeTimeOfDay(sessions);

        // Generate recommendations
        const recommendations = this.generateRecommendations(rangeStats, weakestRange, strongestRange, timeAnalysis);

        return {
            hasEnoughData: true,
            rangeStats,
            weakestRange: weakestRange ? {
                key: weakestRange,
                ...rangeStats[weakestRange]
            } : null,
            strongestRange: strongestRange ? {
                key: strongestRange,
                ...rangeStats[strongestRange]
            } : null,
            timeAnalysis,
            recommendations
        };
    }

    /**
     * Analyze performance by time of day
     */
    analyzeTimeOfDay(sessions) {
        const timeSlots = {
            morning: { start: 5, end: 12, sessions: [], label: 'Morning (5am-12pm)' },
            afternoon: { start: 12, end: 17, sessions: [], label: 'Afternoon (12pm-5pm)' },
            evening: { start: 17, end: 22, sessions: [], label: 'Evening (5pm-10pm)' }
        };

        sessions.forEach(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            if (hour >= 5 && hour < 12) timeSlots.morning.sessions.push(s);
            else if (hour >= 12 && hour < 17) timeSlots.afternoon.sessions.push(s);
            else if (hour >= 17 && hour < 22) timeSlots.evening.sessions.push(s);
        });

        const results = {};
        let bestTime = null;
        let bestAccuracy = 0;

        Object.entries(timeSlots).forEach(([key, slot]) => {
            if (slot.sessions.length >= 3) {
                const totalMakes = slot.sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                const totalAttempts = slot.sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

                results[key] = {
                    ...slot,
                    accuracy: accuracy.toFixed(1),
                    sessionCount: slot.sessions.length
                };

                if (accuracy > bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestTime = key;
                }
            }
        });

        return {
            slots: results,
            bestTime: bestTime ? { key: bestTime, ...results[bestTime] } : null
        };
    }

    /**
     * Generate smart practice recommendations
     */
    generateRecommendations(rangeStats, weakestRange, strongestRange, timeAnalysis) {
        const recommendations = [];

        // Distance-based recommendation
        if (weakestRange && rangeStats[weakestRange]) {
            const weak = rangeStats[weakestRange];
            recommendations.push({
                type: 'weakness',
                icon: '🎯',
                title: `Work on ${weak.label}`,
                desc: `Your accuracy is ${weak.accuracy}% from this range. Try the "Circle Edge Training" routine to improve.`,
                priority: 'high'
            });
        }

        // Check for neglected distances
        Object.entries(rangeStats).forEach(([key, stats]) => {
            if (stats.needsMoreData || stats.sessionCount < 3) {
                recommendations.push({
                    type: 'variety',
                    icon: '🎨',
                    title: `Practice more from ${stats.label}`,
                    desc: `You've only logged ${stats.sessionCount} sessions from this range. Mix it up!`,
                    priority: 'medium'
                });
            }
        });

        // Time-based recommendation
        if (timeAnalysis.bestTime) {
            recommendations.push({
                type: 'timing',
                icon: '⏰',
                title: `Your best time is ${timeAnalysis.bestTime.label}`,
                desc: `You average ${timeAnalysis.bestTime.accuracy}% accuracy during this time. Schedule important practice then!`,
                priority: 'low'
            });
        }

        // Strength acknowledgment
        if (strongestRange && rangeStats[strongestRange]) {
            const strong = rangeStats[strongestRange];
            recommendations.push({
                type: 'strength',
                icon: '💪',
                title: `You're strong from ${strong.label}`,
                desc: `${strong.accuracy}% accuracy! Keep it up and challenge yourself from longer distances.`,
                priority: 'info'
            });
        }

        return recommendations.slice(0, 4); // Return top 4 recommendations
    }

    /**
     * Get suggested routine based on weaknesses
     */
    getSuggestedRoutine() {
        const analysis = this.analyzeWeaknesses();

        if (!analysis.hasEnoughData) {
            return {
                routineId: 'beginner_confidence',
                reason: 'Start with confidence-building practice'
            };
        }

        if (analysis.weakestRange) {
            const weak = analysis.weakestRange.key;

            switch (weak) {
                case 'short':
                    return {
                        routineId: 'beginner_confidence',
                        reason: `Improve your short game (currently ${analysis.weakestRange.accuracy}%)`
                    };
                case 'medium':
                    return {
                        routineId: 'intermediate_mixed',
                        reason: `Work on 16-25ft range (currently ${analysis.weakestRange.accuracy}%)`
                    };
                case 'long':
                    return {
                        routineId: 'intermediate_circle_edge',
                        reason: `Master Circle 1 edge (currently ${analysis.weakestRange.accuracy}%)`
                    };
                case 'extraLong':
                    return {
                        routineId: 'advanced_long_range',
                        reason: `Build Circle 2 confidence (currently ${analysis.weakestRange.accuracy}%)`
                    };
            }
        }

        return {
            routineId: 'intermediate_mixed',
            reason: 'Well-rounded practice for continued improvement'
        };
    }
}

// Export singleton
export const insightsManager = new InsightsManager();
