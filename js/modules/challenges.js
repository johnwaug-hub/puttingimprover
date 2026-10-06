/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Challenges Module
 * Manages weekly challenges
 */

import { CHALLENGE_TYPES, CONSTANTS } from '../config/constants.js';
import { storageManager } from './storage.js';
import { userManager } from './user.js';
import { teamsLeaguesManager } from './teamsLeagues.js';

// ============================================
// LOCAL TIMEZONE HELPER FUNCTIONS
// ============================================
// These ensure weekly challenges use the USER's local time, not UTC server time

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
 * Get a date N days ago as a local date string
 * @param {number} days - Number of days ago
 * @returns {string} Local date string
 */
function getLocalDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getLocalDateString(date);
}

/**
 * Check if a timestamp/date string is within the last N days in local time
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within the last N days
 */
function isWithinLastDaysLocal(timestamp, days) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return date >= cutoff;
}

class ChallengeManager {
    constructor() {
        this.currentChallenge = null;
        this.recentRoutines = [];
        this.recentGames = [];
    }

    /**
     * Get the start of the current week (Monday at midnight local time)
     * @returns {Date} Monday at 00:00:00 local time
     */
    getWeekStartMonday() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 6 days from Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    /**
     * Load or create weekly challenge
     * Weekly challenges reset every Monday at midnight local time
     * @returns {Promise<Object>} Current challenge
     */
    async loadWeeklyChallenge() {
        const challenge = await storageManager.getWeeklyChallenge();
        const currentWeekStart = this.getWeekStartMonday();
        const currentWeekDateStr = getLocalDateString(currentWeekStart); // e.g., "2026-02-02"

        console.log('📅 Loading weekly challenge:', {
            existingChallenge: challenge ? challenge.desc : 'none',
            existingStartDate: challenge?.startDate,
            existingWeekDate: challenge?.weekDate,
            currentWeekDateStr
        });

        if (challenge) {
            // Use weekDate (local date string) if available, otherwise parse startDate
            const challengeWeekDate = challenge.weekDate || challenge.startDate?.split('T')[0];
            
            // Challenge is current if its weekDate matches current week's Monday
            if (challengeWeekDate === currentWeekDateStr) {
                console.log('✅ Challenge is current, using existing');
                this.currentChallenge = challenge;
                return challenge;
            }
            
            console.log('📅 Weekly challenge from previous week:', {
                challengeWeekDate,
                currentWeekDateStr
            });
        }

        // Create new challenge if none exists or it's from a previous week
        return await this.createNewChallenge();
    }

    /**
     * Create a new weekly challenge
     * Start date is set to Monday of the current week
     * @returns {Promise<Object>} New challenge
     */
    async createNewChallenge() {
        const currentWeekStart = this.getWeekStartMonday();
        const currentWeekDateStr = getLocalDateString(currentWeekStart);
        
        // Double-check that we really need to create a new challenge
        // This prevents race conditions where multiple tabs/sessions might try to create
        const existingChallenge = await storageManager.getWeeklyChallenge();
        
        if (existingChallenge) {
            const challengeWeekDate = existingChallenge.weekDate || existingChallenge.startDate?.split('T')[0];
            if (challengeWeekDate === currentWeekDateStr) {
                console.log('⚠️ Challenge already exists for this week, not creating new one');
                this.currentChallenge = existingChallenge;
                return existingChallenge;
            }
        }

        // Randomly select a challenge type, avoiding repeat of last week's challenge
        const existingDesc = existingChallenge?.desc || null;
        let availableChallenges = CHALLENGE_TYPES;
        if (existingDesc) {
            availableChallenges = CHALLENGE_TYPES.filter(c => c.desc !== existingDesc);
            // Fallback if somehow all filtered out
            if (availableChallenges.length === 0) availableChallenges = CHALLENGE_TYPES;
        }
        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        const challengeType = availableChallenges[randomIndex];

        const newChallenge = {
            ...challengeType,
            startDate: currentWeekStart.toISOString(),
            weekDate: currentWeekDateStr, // Store local date string for reliable comparison
            id: `challenge_${Date.now()}`,
            completed: false,
            completedBy: []
        };

        await storageManager.saveWeeklyChallenge(newChallenge);
        this.currentChallenge = newChallenge;

        console.log('📋 New weekly challenge created:', newChallenge.desc, '(Week of', currentWeekDateStr, ')');
        return newChallenge;
    }

    /**
     * Check if activity completes the current challenge
     * @param {Object} activity - Activity data (session, routine, or game)
     * @param {string} activityType - 'session', 'routine', or 'game'
     * @returns {Promise<boolean>} True if challenge was completed
     */
    async checkChallengeCompletion(activity, activityType = 'session') {
        if (!this.currentChallenge) {
            await this.loadWeeklyChallenge();
        }

        const user = userManager.getCurrentUser();
        if (!user) return false;

        // Check if user already completed this challenge
        if (this.currentChallenge.completedBy?.includes(user.id)) {
            return false;
        }

        let completed = false;

        // Normalize activity data
        const makes = activity.makes || activity.totalStats?.totalMakes || activity.totalMakes || 0;
        const attempts = activity.attempts || activity.totalStats?.totalAttempts || activity.totalAttempts || 0;
        const percentage = attempts > 0 ? (makes / attempts) * 100 : (activity.percentage || 0);
        const distance = activity.distance || activity.drills?.[0]?.distance || 0;
        const points = activity.points || 0;

        switch (this.currentChallenge.type) {
            case 'accuracy':
                // Achieve target accuracy or higher in any activity
                if (percentage >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'accuracy_sustained':
                // Hit target accuracy in X sessions this week
                const accurateSessions = await this.getWeeklySessionsWithAccuracy(this.currentChallenge.target);
                if (accurateSessions >= (this.currentChallenge.sessions || 3)) {
                    completed = true;
                }
                break;

            case 'accuracy_average':
                // Maintain target average accuracy this week
                const avgAccuracy = await this.getWeeklyAverageAccuracy();
                if (avgAccuracy >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'perfect_session':
                // Complete a perfect session with minimum attempts
                if (percentage === 100 && attempts >= (this.currentChallenge.minAttempts || 10)) {
                    completed = true;
                }
                break;

            case 'distance':
                // Make X putts from target distance or higher
                const minMakes = this.currentChallenge.makes || 5;
                if (distance >= this.currentChallenge.target && makes >= minMakes) {
                    completed = true;
                }
                break;

            case 'distance_variety':
                // Practice from multiple specific distances
                const distancesPracticed = await this.getWeeklyDistancesPracticed();
                const requiredDistances = this.currentChallenge.distances || [15, 20, 25, 30];
                if (requiredDistances.every(d => distancesPracticed.includes(d))) {
                    completed = true;
                }
                break;

            case 'long_range_total':
                // Make X putts from Y+ feet this week
                const longMakes = await this.getWeeklyMakesFromDistance(this.currentChallenge.distance || 25);
                if (longMakes >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'volume':
                // Make target number of putts this week (from ALL activities)
                const totalMakes = await this.getWeeklyMakes();
                if (totalMakes >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'volume_daily':
                // Make X putts on Y different days
                const daysWithMakes = await this.getDaysWithMinMakes(this.currentChallenge.target);
                if (daysWithMakes >= (this.currentChallenge.days || 5)) {
                    completed = true;
                }
                break;

            case 'volume_single':
                // Make X putts in a single session
                if (makes >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'streak':
                // Practice target number of days this week
                const weeklyDays = await this.getWeeklyPracticeDays();
                if (weeklyDays >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'weekend_warrior':
                // Practice both Saturday and Sunday
                const weekendDays = await this.getWeekendPracticeDays();
                if (weekendDays >= 2) {
                    completed = true;
                }
                break;

            case 'weekday_grinder':
                // Practice every weekday
                const weekdayCount = await this.getWeekdayPracticeDays();
                if (weekdayCount >= 5) {
                    completed = true;
                }
                break;

            case 'double_session':
                // Complete 2+ sessions on X different days
                const doubleDays = await this.getDaysWithMultipleSessions(2);
                if (doubleDays >= (this.currentChallenge.target || 3)) {
                    completed = true;
                }
                break;

            case 'points':
                // Score target points in one activity
                if (points >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'points_weekly':
                // Earn target total points this week
                const weeklyPoints = await this.getWeeklyPoints();
                if (weeklyPoints >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'routines':
                // Complete X routines this week
                const routineCount = await this.getWeeklyRoutineCount();
                if (routineCount >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'games':
                // Play X games this week
                const gameCount = await this.getWeeklyGameCount();
                if (gameCount >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'variety':
                // Complete sessions, routines, AND games
                const hasSession = await this.hasWeeklyActivityType('session');
                const hasRoutine = await this.hasWeeklyActivityType('routine');
                const hasGame = await this.hasWeeklyActivityType('game');
                if (hasSession && hasRoutine && hasGame) {
                    completed = true;
                }
                break;

            case 'all_rounder':
                // Complete specific counts of each type
                const sessionCount = await this.getWeeklySessionCount();
                const routinesCompleted = await this.getWeeklyRoutineCount();
                const gamesPlayed = await this.getWeeklyGameCount();
                if (sessionCount >= (this.currentChallenge.sessions || 3) &&
                    routinesCompleted >= (this.currentChallenge.routines || 2) &&
                    gamesPlayed >= (this.currentChallenge.games || 2)) {
                    completed = true;
                }
                break;
        }

        if (completed) {
            await this.completeChallenge();
        }

        return completed;
    }

    /**
     * Get total makes from all activities this week
     * @returns {Promise<number>} Total makes
     */
    async getWeeklyMakes() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        // Use LOCAL date string for week ago, not UTC!
        const weekAgoStr = getLocalDateDaysAgo(7);

        let totalMakes = 0;

        // Sessions - use local time comparison
        const sessions = userManager.sessions || [];
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                totalMakes += s.makes || 0;
            }
        });

        // Routines - need to fetch if not loaded
        try {
            const db = firebase.firestore();
            const routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                .where('date', '>=', weekAgoStr)
                .get();

            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                if (!routine.excludeFromStats && !routine.pending) {
                    const makes = routine.totalStats?.totalMakes || 
                                  routine.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                    totalMakes += makes;
                }
            });

            // Games
            const gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                .where('date', '>=', weekAgoStr)
                .get();

            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                if (!game.excludeFromStats && !game.pending) {
                    totalMakes += game.totalMakes || 0;
                }
            });
        } catch (error) {
            console.warn('Could not fetch routines/games for weekly makes:', error);
        }

        return totalMakes;
    }

    /**
     * Get count of sessions with target accuracy this week
     */
    async getWeeklySessionsWithAccuracy(targetAccuracy) {
        const sessions = userManager.sessions || [];
        return sessions.filter(s => {
            if (!isWithinLastDaysLocal(s.date || s.timestamp, 7) || s.excludeFromStats || s.pending) return false;
            return s.percentage >= targetAccuracy;
        }).length;
    }

    /**
     * Get average accuracy this week
     */
    async getWeeklyAverageAccuracy() {
        const sessions = userManager.sessions || [];
        const validSessions = sessions.filter(s => 
            isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending
        );
        
        if (validSessions.length === 0) return 0;
        const totalAccuracy = validSessions.reduce((sum, s) => sum + (s.percentage || 0), 0);
        return totalAccuracy / validSessions.length;
    }

    /**
     * Get unique distances practiced this week
     */
    async getWeeklyDistancesPracticed() {
        const sessions = userManager.sessions || [];
        const distances = new Set();
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                distances.add(s.distance);
            }
        });
        
        return Array.from(distances);
    }

    /**
     * Get total makes from a specific distance this week
     */
    async getWeeklyMakesFromDistance(minDistance) {
        const sessions = userManager.sessions || [];
        let totalMakes = 0;
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                if (s.distance >= minDistance) {
                    totalMakes += s.makes || 0;
                }
            }
        });
        
        return totalMakes;
    }

    /**
     * Get number of days with minimum makes
     */
    async getDaysWithMinMakes(minMakes) {
        const sessions = userManager.sessions || [];
        const dayMakes = {};
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                const date = s.date;
                dayMakes[date] = (dayMakes[date] || 0) + (s.makes || 0);
            }
        });
        
        return Object.values(dayMakes).filter(makes => makes >= minMakes).length;
    }

    /**
     * Get number of unique practice days this week
     */
    async getWeeklyPracticeDays() {
        const sessions = userManager.sessions || [];
        const days = new Set();
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                days.add(s.date);
            }
        });
        
        return days.size;
    }

    /**
     * Get number of weekend days practiced this week
     */
    async getWeekendPracticeDays() {
        const sessions = userManager.sessions || [];
        const weekendDays = new Set();
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                const dayOfWeek = new Date(s.date || s.timestamp).getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    weekendDays.add(s.date);
                }
            }
        });
        
        return weekendDays.size;
    }

    /**
     * Get number of weekdays practiced this week
     */
    async getWeekdayPracticeDays() {
        const sessions = userManager.sessions || [];
        const weekdays = new Set();
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                const dayOfWeek = new Date(s.date || s.timestamp).getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    weekdays.add(s.date);
                }
            }
        });
        
        return weekdays.size;
    }

    /**
     * Get number of days with multiple sessions
     */
    async getDaysWithMultipleSessions(minSessions) {
        const sessions = userManager.sessions || [];
        const dayCounts = {};
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                dayCounts[s.date] = (dayCounts[s.date] || 0) + 1;
            }
        });
        
        return Object.values(dayCounts).filter(count => count >= minSessions).length;
    }

    /**
     * Get total points earned this week
     */
    async getWeeklyPoints() {
        const sessions = userManager.sessions || [];
        let totalPoints = 0;
        
        sessions.forEach(s => {
            if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                totalPoints += s.points || 0;
            }
        });
        
        return totalPoints;
    }

    /**
     * Get routine count this week
     */
    async getWeeklyRoutineCount() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        // Use LOCAL date string for week ago, not UTC!
        const weekAgoStr = getLocalDateDaysAgo(7);

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                .where('date', '>=', weekAgoStr)
                .get();
            
            return snapshot.docs.filter(doc => {
                const data = doc.data();
                return !data.excludeFromStats && !data.pending;
            }).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get game count this week
     */
    async getWeeklyGameCount() {
        const user = userManager.getCurrentUser();
        if (!user) return 0;

        // Use LOCAL date string for week ago, not UTC!
        const weekAgoStr = getLocalDateDaysAgo(7);

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                .where('date', '>=', weekAgoStr)
                .get();
            
            return snapshot.docs.filter(doc => {
                const data = doc.data();
                return !data.excludeFromStats && !data.pending;
            }).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get session count this week
     */
    async getWeeklySessionCount() {
        const sessions = userManager.sessions || [];
        return sessions.filter(s => 
            isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending
        ).length;
    }

    /**
     * Check if user has completed any activity of a type this week
     */
    async hasWeeklyActivityType(type) {
        if (type === 'session') {
            return (await this.getWeeklySessionCount()) > 0;
        } else if (type === 'routine') {
            return (await this.getWeeklyRoutineCount()) > 0;
        } else if (type === 'game') {
            return (await this.getWeeklyGameCount()) > 0;
        }
        return false;
    }

    /**
     * Recalculate and check if weekly challenge should be completed
     * Based on ALL activities (sessions, routines, games) this week
     * @returns {Promise<boolean>} True if challenge was newly completed
     */
    async recalculateWeeklyChallenge() {
        if (!this.currentChallenge) {
            await this.loadWeeklyChallenge();
        }

        const user = userManager.getCurrentUser();
        if (!user) return false;

        // Already completed
        if (this.currentChallenge.completedBy?.includes(user.id)) {
            return false;
        }

        // Use LOCAL date string for week ago, not UTC!
        const weekAgoStr = getLocalDateDaysAgo(7);

        let completed = false;

        try {
            const db = firebase.firestore();

            // Gather all activities from this week
            const allActivities = [];

            // Sessions - use local time comparison
            const sessions = userManager.sessions || [];
            sessions.forEach(s => {
                if (isWithinLastDaysLocal(s.date || s.timestamp, 7) && !s.excludeFromStats && !s.pending) {
                    allActivities.push({
                        type: 'session',
                        makes: s.makes || 0,
                        attempts: s.attempts || 0,
                        percentage: s.percentage || 0,
                        distance: s.distance || 0,
                        points: s.points || 0
                    });
                }
            });

            // Routines
            const routinesSnapshot = await db.collection('users').doc(user.id).collection('routineCompletions')
                .where('date', '>=', weekAgoStr)
                .get();

            routinesSnapshot.docs.forEach(doc => {
                const routine = doc.data();
                if (!routine.excludeFromStats && !routine.pending) {
                    const makes = routine.totalStats?.totalMakes || 
                                  routine.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                    const attempts = routine.totalStats?.totalAttempts || 
                                     routine.drillScores?.reduce((sum, d) => sum + (d.attempts || 0), 0) || 0;
                    allActivities.push({
                        type: 'routine',
                        makes,
                        attempts,
                        percentage: attempts > 0 ? (makes / attempts) * 100 : 0,
                        distance: routine.drillScores?.[0]?.distance || 0,
                        points: routine.points || 0
                    });
                }
            });

            // Games
            const gamesSnapshot = await db.collection('users').doc(user.id).collection('gameCompletions')
                .where('date', '>=', weekAgoStr)
                .get();

            gamesSnapshot.docs.forEach(doc => {
                const game = doc.data();
                if (!game.excludeFromStats && !game.pending) {
                    allActivities.push({
                        type: 'game',
                        makes: game.totalMakes || 0,
                        attempts: game.totalAttempts || 0,
                        percentage: game.percentage || 0,
                        distance: game.distance || 0,
                        points: game.points || 0
                    });
                }
            });

            console.log(`🏆 Recalculating weekly challenge with ${allActivities.length} activities`);

            // Check challenge completion based on type
            switch (this.currentChallenge.type) {
                case 'accuracy':
                    // Best accuracy from any activity
                    const bestAccuracy = Math.max(...allActivities.map(a => a.percentage), 0);
                    if (bestAccuracy >= this.currentChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Accuracy: best=${bestAccuracy.toFixed(1)}%, target=${this.currentChallenge.target}%`);
                    break;

                case 'distance':
                    // Any activity with 5+ makes from target distance
                    const longActivities = allActivities.filter(a => a.distance >= this.currentChallenge.target);
                    const maxMakes = Math.max(...longActivities.map(a => a.makes), 0);
                    if (maxMakes >= 5) {
                        completed = true;
                    }
                    console.log(`   Distance: max makes from ${this.currentChallenge.target}ft+ = ${maxMakes}`);
                    break;

                case 'volume':
                    // Total makes this week from all activities
                    const totalMakes = allActivities.reduce((sum, a) => sum + a.makes, 0);
                    if (totalMakes >= this.currentChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Volume: ${totalMakes}/${this.currentChallenge.target} makes`);
                    break;

                case 'streak':
                    // Practice streak
                    const stats = userManager.getStatistics();
                    if (stats.currentStreak >= this.currentChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Streak: ${stats.currentStreak}/${this.currentChallenge.target} days`);
                    break;

                case 'points':
                    // Best points from any single activity
                    const bestPoints = Math.max(...allActivities.map(a => a.points), 0);
                    if (bestPoints >= this.currentChallenge.target) {
                        completed = true;
                    }
                    console.log(`   Points: best=${bestPoints}, target=${this.currentChallenge.target}`);
                    break;
            }

            if (completed) {
                await this.completeChallenge();
                console.log('🎉 Weekly challenge completed via recalculation!');
            }

        } catch (error) {
            console.error('Error recalculating weekly challenge:', error);
        }

        return completed;
    }

    /**
     * Mark challenge as completed for current user
     * @returns {Promise<void>}
     */
    async completeChallenge() {
        const user = userManager.getCurrentUser();
        if (!user) return;

        // Add user to completed list
        if (!this.currentChallenge.completedBy) {
            this.currentChallenge.completedBy = [];
        }

        if (!this.currentChallenge.completedBy.includes(user.id)) {
            this.currentChallenge.completedBy.push(user.id);
            await storageManager.saveWeeklyChallenge(this.currentChallenge);

            // Use partial update to avoid overwriting stats set by accept methods
            await storageManager.updateUser(user.id, {
                completedChallenges: firebase.firestore.FieldValue.increment(1),
                totalPoints: firebase.firestore.FieldValue.increment(this.currentChallenge.reward)
            });

            // Update local cache
            user.completedChallenges = (user.completedChallenges || 0) + 1;
            user.totalPoints = (user.totalPoints || 0) + this.currentChallenge.reward;

            // Check for challenge achievement
            await userManager.addAchievement('challenge_accepted');

            // Award Season XP for the weekly challenge. completeChallenge() is the
            // single sink for both the automatic play-flow path
            // (checkChallengeCompletion) and the manual recalc button, so awarding
            // here covers both. Keyed by the challenge's startDate for idempotency
            // so a given week is only ever credited once per user.
            const weeklyKey = `weekly_${this.currentChallenge.startDate || this.currentChallenge.id || 'current'}`;
            await teamsLeaguesManager.addSeasonXp(user.id, 'weeklyChallenge', null, weeklyKey);

            console.log('🎉 Challenge completed! Earned ' + this.currentChallenge.reward + ' bonus points');
        }
    }

    /**
     * Get current challenge
     * @returns {Object|null} Current challenge
     */
    getCurrentChallenge() {
        return this.currentChallenge;
    }

    /**
     * Check if user has completed current challenge
     * @returns {boolean} True if completed
     */
    isCompletedByUser() {
        const user = userManager.getCurrentUser();
        if (!user || !this.currentChallenge) return false;

        return this.currentChallenge.completedBy?.includes(user.id) || false;
    }

    /**
     * Get challenge progress for current user (includes all activity types)
     * @returns {Promise<Object>} Progress information
     */
    async getChallengeProgress() {
        if (!this.currentChallenge) return null;

        const user = userManager.getCurrentUser();
        if (!user) return null;

        const sessions = userManager.sessions || [];
        const stats = userManager.getStatistics();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        let progress = 0;
        let target = this.currentChallenge.target;

        // For volume type, get all weekly makes
        if (this.currentChallenge.type === 'volume') {
            progress = await this.getWeeklyMakes();
        } else {
            switch (this.currentChallenge.type) {
                case 'accuracy':
                    const bestAccuracy = Math.max(...sessions.map(s => s.percentage), 0);
                    progress = Math.min(bestAccuracy, target);
                    break;

                case 'distance':
                    const longSessions = sessions.filter(s => s.distance >= target);
                    const maxMakes = Math.max(...longSessions.map(s => s.makes), 0);
                    progress = Math.min(maxMakes, 5);
                    target = 5;
                    break;

                case 'streak':
                    progress = stats.currentStreak;
                    break;

                case 'points':
                    const bestPoints = Math.max(...sessions.map(s => s.points), 0);
                    progress = Math.min(bestPoints, target);
                    break;
            }
        }

        return {
            current: progress,
            target,
            percentage: Math.round((progress / target) * 100),
            completed: this.isCompletedByUser()
        };
    }

    /**
     * Recheck weekly challenge completion after an activity is deleted
     * @param {Array} sessions - All sessions this week
     * @param {Array} routines - All routines this week
     * @param {Array} games - All games this week
     * @returns {Promise<Object>} Result with wasCompleted, isNowCompleted, pointsToRemove
     */
    async recheckWeeklyChallengeAfterDelete(sessions = [], routines = [], games = []) {
        const user = userManager.getCurrentUser();
        if (!user || !this.currentChallenge) {
            return { wasCompleted: false, isNowCompleted: false, pointsToRemove: 0 };
        }

        const wasCompleted = this.isCompletedByUser();
        if (!wasCompleted) {
            return { wasCompleted: false, isNowCompleted: false, pointsToRemove: 0 };
        }

        // Filter activities to this week only
        const weekStart = this.getWeekStartMonday();
        const thisWeekSessions = sessions.filter(s => new Date(s.timestamp || s.date) >= weekStart);
        const thisWeekRoutines = routines.filter(r => new Date(r.endTime || r.timestamp) >= weekStart);
        const thisWeekGames = games.filter(g => new Date(g.endTime || g.timestamp) >= weekStart);

        // Recalculate based on challenge type
        let stillCompleted = false;
        const challenge = this.currentChallenge;
        const target = challenge.target;

        // Calculate totals from all activities
        const sessionMakes = thisWeekSessions.reduce((sum, s) => sum + (s.makes || 0), 0);
        const routineMakes = thisWeekRoutines.reduce((sum, r) => sum + (r.totalStats?.totalMakes || r.makes || 0), 0);
        const gameMakes = thisWeekGames.reduce((sum, g) => sum + (g.totalMakes || g.makes || 0), 0);
        const totalMakes = sessionMakes + routineMakes + gameMakes;

        const sessionAttempts = thisWeekSessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
        const routineAttempts = thisWeekRoutines.reduce((sum, r) => sum + (r.totalStats?.totalAttempts || r.attempts || 0), 0);
        const gameAttempts = thisWeekGames.reduce((sum, g) => sum + (g.totalAttempts || g.attempts || 0), 0);
        const totalAttempts = sessionAttempts + routineAttempts + gameAttempts;

        const sessionPoints = thisWeekSessions.reduce((sum, s) => sum + (s.points || 0), 0);
        const routinePoints = thisWeekRoutines.reduce((sum, r) => sum + (r.points || 0), 0);
        const gamePoints = thisWeekGames.reduce((sum, g) => sum + (g.points || 0), 0);
        const totalPoints = sessionPoints + routinePoints + gamePoints;

        const totalActivities = thisWeekSessions.length + thisWeekRoutines.length + thisWeekGames.length;

        switch (challenge.type) {
            case 'volume':
                stillCompleted = totalMakes >= target;
                break;
            case 'accuracy':
                const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;
                stillCompleted = accuracy >= target && totalAttempts >= (challenge.minAttempts || 50);
                break;
            case 'sessions':
                stillCompleted = totalActivities >= target;
                break;
            case 'points':
                stillCompleted = totalPoints >= target;
                break;
            case 'distance':
                const longDistanceMakes = thisWeekSessions.filter(s => s.distance >= target).reduce((sum, s) => sum + s.makes, 0);
                stillCompleted = longDistanceMakes >= 5;
                break;
            default:
                stillCompleted = totalMakes >= target;
        }

        if (!stillCompleted) {
            // Remove user from completedBy list
            const completedBy = challenge.completedBy || [];
            const index = completedBy.indexOf(user.id);
            if (index > -1) {
                completedBy.splice(index, 1);
                challenge.completedBy = completedBy;
                await storageManager.saveWeeklyChallenge(challenge);
                
                console.log('⚠️ Weekly challenge uncompleted after session delete');
            }

            return {
                wasCompleted: true,
                isNowCompleted: false,
                pointsToRemove: challenge.reward || 0
            };
        }

        return { wasCompleted: true, isNowCompleted: true, pointsToRemove: 0 };
    }
}

// Export singleton instance
export const challengeManager = new ChallengeManager();
