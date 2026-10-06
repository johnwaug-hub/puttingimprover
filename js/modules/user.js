/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * User Module
 * Manages user data, sessions, and statistics
 */

import { storageManager } from './storage.js';
import { calculateSessionPoints, calculateStats, calculateAllActivitiesStreaks } from '../utils/calculations.js';
import { validateSessionInput } from '../utils/validation.js';
import { CONSTANTS, ACHIEVEMENTS_CONFIG } from '../config/constants.js';
import { putterRatingManager, SCRATCH_BASELINES } from './putterRating.js';
import { teamsLeaguesManager } from './teamsLeagues.js';

/**
 * Get local date string in YYYY-MM-DD format (avoids UTC timezone issues)
 */
function getLocalDateString(dateInput = new Date()) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

class UserManager {
    constructor() {
        this.currentUser = null;
        this.sessions = [];
        this.isInitializing = false; // Guard to prevent duplicate initialization
    }

    /**
     * Initialize or load user data
     * @param {Object} firebaseUser - Firebase user object
     * @returns {Promise<Object>} User data
     */
    async initializeUser(firebaseUser) {
        if (!firebaseUser) {
            throw new Error('No Firebase user provided');
        }

        // Prevent duplicate initialization
        if (this.isInitializing) {
            console.log('⏳ User initialization already in progress, waiting...');
            // Wait for current initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.currentUser;
        }

        this.isInitializing = true;

        try {
            // Try to load existing user
            let user = await storageManager.getUser(firebaseUser.uid);

        // Create new user if doesn't exist
        if (!user) {
            console.log('🆕 Creating new user for:', firebaseUser.email);

            // CRITICAL: Double-check user doesn't exist (race condition protection)
            user = await storageManager.getUser(firebaseUser.uid);
            if (user) {
                console.log('✅ User was created by another process, using existing');
                this.currentUser = user;
                await this.loadSessions();
                return user;
            }

            // Prompt for gender
            const gender = prompt('Please select your gender:\nType "male" or "female":', 'male');
            const validGender = (gender && (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female'))
                ? gender.toLowerCase()
                : 'male'; // Default to male if invalid input

            user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                photoURL: firebaseUser.photoURL,
                profilePictureURL: firebaseUser.photoURL || null,
                gender: validGender,
                birthday: null,
                location: {
                    zipCode: null,
                    city: null,
                    state: null,
                    country: 'us'
                },
                favoritePutter: null,
                favoriteMidrange: null,
                favoriteDriver: null,
                hideFromLeaderboard: false,
                totalPoints: 0,
                totalSessions: 0,
                totalRoutines: 0,
                totalGames: 0,
                achievements: [],
                weatherEnabled: false, // User can enable weather tracking
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            console.log('🔍 Creating user with ID:', firebaseUser.uid, 'Email:', firebaseUser.email);

            // One final check before saving
            const existingUser = await storageManager.getUser(firebaseUser.uid);
            if (existingUser) {
                console.log('✅ User created by another process during prompt, using existing');
                this.currentUser = existingUser;
                await this.loadSessions();
                return existingUser;
            }

            await storageManager.saveUser(user);
            console.log('✅ New user created and saved:', user.email, 'ID:', user.id, 'Gender:', user.gender);
        } else {
            // Update last login
            user.lastLogin = new Date().toISOString();

            // Initialize counters if they don't exist
            if (user.totalRoutines === undefined) user.totalRoutines = 0;
            if (user.totalGames === undefined) user.totalGames = 0;

            // Initialize gender if it doesn't exist (for existing users)
            if (!user.gender) {
                user.gender = 'male'; // Default for existing users
            }

            // Initialize profile fields if they don't exist
            if (user.profilePictureURL === undefined) user.profilePictureURL = user.photoURL || null;
            if (user.birthday === undefined) user.birthday = null;
            if (user.favoritePutter === undefined) user.favoritePutter = null;
            if (user.favoriteMidrange === undefined) user.favoriteMidrange = null;
            if (user.favoriteDriver === undefined) user.favoriteDriver = null;
            if (user.hideFromLeaderboard === undefined) user.hideFromLeaderboard = false;

            // Initialize location and weather fields for existing users
            if (!user.location) {
                user.location = {
                    zipCode: null,
                    city: null,
                    state: null,
                    country: 'us'
                };
            }
            if (user.weatherEnabled === undefined) user.weatherEnabled = false;

            // CRITICAL: Backfill createdAt for existing users (needed for achievements)
            if (!user.createdAt) {
                user.createdAt = new Date().toISOString(); // Set to now as fallback
                console.log('📅 Backfilled createdAt for existing user');
            }

            // Initialize achievement tracking fields if they don't exist
            if (user.dataDownloads === undefined) user.dataDownloads = 0;
            if (user.bestPointsRank === undefined) user.bestPointsRank = 999999;
            if (user.bestEloRank === undefined) user.bestEloRank = 999999;
            if (user.bestSeasonRank === undefined) user.bestSeasonRank = 999999;
            if (!user.bulkLogStats) {
                user.bulkLogStats = {
                    uniquePlayersLogged: 0,
                    totalLogsForOthers: 0,
                    maxPlayersInSession: 0,
                    playersLoggedSet: []
                };
            }

            await storageManager.saveUser(user);
            console.log('✅ User loaded:', user.email);
        }

        this.currentUser = user;
        await this.loadSessions();

        // Fix totalSessions count for existing users if it's wrong
        if (this.currentUser.totalSessions === undefined || this.currentUser.totalSessions === 0) {
            const actualSessionCount = this.sessions.length;
            if (actualSessionCount > 0) {
                this.currentUser.totalSessions = actualSessionCount;
                await storageManager.saveUser(this.currentUser);
                console.log('✅ Session count updated:', actualSessionCount);
            }
        }

        // Note: totalRoutines and totalGames are managed by add/delete operations
        // Do NOT recalculate from document count as this would override admin corrections
        // await this.updateActivityCounts();

        return user;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Update user's routine and game completion counts
     */
    async updateActivityCounts() {
        if (!this.currentUser) return;

        try {
            const routines = await storageManager.getRoutineCompletions(this.currentUser.id);
            const games = await storageManager.getGameCompletions(this.currentUser.id);

            this.currentUser.totalRoutines = routines.length;
            this.currentUser.totalGames = games.length;

            await storageManager.saveUser(this.currentUser);
        } catch (error) {
            console.error('Error updating activity counts:', error);
        }
    }

    /**
     * Load user sessions
     * @returns {Promise<Array>} Array of sessions
     */
    async loadSessions() {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        this.sessions = await storageManager.getUserSessions(this.currentUser.id);
        return this.sessions;
    }

    /**
     * Add a new practice session
     * @param {Object} sessionData - Session input data
     * @returns {Promise<Object>} Created session
     */
    async addSession(sessionData) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        const { makes, attempts, distance, date, timestamp, routineName, duration, notes, disc } = sessionData;

        // Validate input
        const validation = validateSessionInput(
            parseInt(makes),
            parseInt(attempts),
            parseInt(distance)
        );

        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }

        // Calculate points and percentage
        const { points, percentage } = calculateSessionPoints(
            parseInt(makes),
            parseInt(attempts),
            parseInt(distance)
        );

        // Fetch weather data if enabled and location is set
        let weatherData = null;
        console.log('🌤️ Weather check:', {
            weatherEnabled: this.currentUser.weatherEnabled,
            hasZipCode: !!this.currentUser.location?.zipCode,
            zipCode: this.currentUser.location?.zipCode,
            location: this.currentUser.location
        });

        if (this.currentUser.weatherEnabled && this.currentUser.location?.zipCode) {
            try {
                console.log('🌤️ Fetching weather for ZIP:', this.currentUser.location.zipCode);
                const { weatherService } = await import('./weather.js');
                weatherData = await weatherService.getWeatherByZipCode(
                    this.currentUser.location.zipCode,
                    this.currentUser.location.country || 'us'
                );
                console.log('🌤️ Weather data received:', weatherData);
            } catch (error) {
                // Silently fail - weather is optional
            }
        } else {
            console.log('⚠️ Weather not enabled or ZIP code not set');
        }

        // Create session object
        const session = {
            id: `session_${Date.now()}`,
            date: date || getLocalDateString(),
            timestamp: timestamp || new Date().toISOString(),
            startTime: sessionData.startTime || timestamp || new Date().toISOString(),
            endTime: sessionData.endTime || new Date().toISOString(),
            duration: duration || null, // Duration in minutes
            distance: parseInt(distance),
            makes: parseInt(makes),
            attempts: parseInt(attempts),
            percentage,
            points,
            routineName: routineName || null,
            notes: notes || null,
            disc: disc || null,
            weather: weatherData // Add weather data to session
        };

        console.log('💾 Saving session with weather:', {
            sessionId: session.id,
            hasWeather: !!session.weather,
            weather: session.weather,
            duration: session.duration
        });

        // Save session
        await storageManager.saveSession(this.currentUser.id, session);

        // Update user points and session count
        this.currentUser.totalPoints += points;
        this.currentUser.totalSessions = (this.currentUser.totalSessions || 0) + 1;

        // Update aggregate performance stats
        this.currentUser.totalPutts = (this.currentUser.totalPutts || 0) + parseInt(attempts);
        this.currentUser.totalMakes = (this.currentUser.totalMakes || 0) + parseInt(makes);

        // Track weather conditions if present
        if (weatherData && weatherData.condition) {
            const conditions = new Set(this.currentUser.weatherConditions || []);
            conditions.add(weatherData.condition.toLowerCase());
            this.currentUser.weatherConditions = Array.from(conditions);
            this.currentUser.weatherSessions = (this.currentUser.weatherSessions || 0) + 1;
        }

        // Update best session if this one is better
        if (!this.currentUser.bestSession || points > (this.currentUser.bestSession.points || 0)) {
            this.currentUser.bestSession = {
                distance: parseInt(distance),
                makes: parseInt(makes),
                attempts: parseInt(attempts),
                percentage,
                points,
                date: session.date
            };
        }

        // Update best accuracy
        if (!this.currentUser.bestAccuracy || percentage > this.currentUser.bestAccuracy) {
            this.currentUser.bestAccuracy = percentage;
        }

        console.log(`💰 Points updated for user ${this.currentUser.id}:`, {
            pointsAdded: points,
            newTotalPoints: this.currentUser.totalPoints,
            newTotalSessions: this.currentUser.totalSessions,
            sessionId: session.id
        });

        await storageManager.saveUser(this.currentUser);

        // Update putter rating incrementally (O(1) — no history scan needed)
        try {
            const ratingUpdates = putterRatingManager.updateRatingFromSession(
                this.currentUser, session, SCRATCH_BASELINES
            );
            if (ratingUpdates && ratingUpdates.putterRating != null) {
                Object.assign(this.currentUser, ratingUpdates);
                await storageManager.saveUser(this.currentUser);
                console.log(`🎯 Putter rating updated: ${ratingUpdates.putterRating} (${putterRatingManager.getTier(ratingUpdates.putterRating).name})`);
            }
        } catch (ratingError) {
            // Silently fail — rating is non-critical
            console.warn('⚠️ Rating update failed (non-critical):', ratingError);
        }

        // Reload sessions
        await this.loadSessions();

        console.log('✅ Session added:', session);
        return session;
    }

    /**
     * Delete a session
     * @param {string} sessionId - Session ID to delete
     * @returns {Promise<void>}
     */
    async deleteSession(sessionId) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Only remove points and stats if session wasn't pending
        // (pending sessions never had points added)
        if (!session.pending) {
            this.currentUser.totalPoints = Math.max(0, this.currentUser.totalPoints - (session.points || 0));
            this.currentUser.totalSessions = Math.max(0, (this.currentUser.totalSessions || 0) - 1);
            this.currentUser.totalPutts = Math.max(0, (this.currentUser.totalPutts || 0) - (session.attempts || 0));
            this.currentUser.totalMakes = Math.max(0, (this.currentUser.totalMakes || 0) - (session.makes || 0));
            await storageManager.saveUser(this.currentUser);
        }

        // Delete session using the storage manager's deleteSession method
        await storageManager.deleteSession(this.currentUser.id, sessionId);

        // Reload sessions
        await this.loadSessions();

        console.log('✅ Session deleted:', sessionId);
    }

    /**
     * Update an existing session
     * @param {string} sessionId - Session ID to update
     * @param {Object} sessionData - Updated session data
     * @returns {Promise<Object>} Updated session
     */
    async updateSession(sessionId, sessionData) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        const oldSession = this.sessions.find(s => s.id === sessionId);
        if (!oldSession) {
            throw new Error('Session not found');
        }

        const { makes, attempts, distance, date, timestamp } = sessionData;

        // Validate input
        const validation = validateSessionInput(
            parseInt(makes),
            parseInt(attempts),
            parseInt(distance)
        );

        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }

        // Calculate new points and percentage
        const { points, percentage } = calculateSessionPoints(
            parseInt(makes),
            parseInt(attempts),
            parseInt(distance)
        );

        // Calculate points difference
        const pointsDiff = points - oldSession.points;

        // Calculate makes and attempts difference
        const makesDiff = parseInt(makes) - (oldSession.makes || 0);
        const attemptsDiff = parseInt(attempts) - (oldSession.attempts || 0);

        // Update session object
        const updatedSession = {
            ...oldSession,
            distance: parseInt(distance),
            makes: parseInt(makes),
            attempts: parseInt(attempts),
            percentage,
            points
        };

        // Update date and timestamp if provided
        if (date) updatedSession.date = date;
        if (timestamp) updatedSession.timestamp = timestamp;

        // Save updated session
        await storageManager.saveSession(this.currentUser.id, updatedSession);

        // Update user's total points and makes/putts
        this.currentUser.totalPoints = (this.currentUser.totalPoints || 0) + pointsDiff;
        if (makesDiff !== 0) {
            this.currentUser.totalMakes = Math.max(0, (this.currentUser.totalMakes || 0) + makesDiff);
        }
        if (attemptsDiff !== 0) {
            this.currentUser.totalPutts = Math.max(0, (this.currentUser.totalPutts || 0) + attemptsDiff);
        }
        await storageManager.saveUser(this.currentUser);

        // Reload sessions
        await this.loadSessions();

        console.log('✅ Session updated:', updatedSession);
        return updatedSession;
    }

    /**
     * Get user statistics
     * @returns {Object} User statistics
     */
    getStatistics(games = [], routines = []) {
        // Calculate stats from all activities (sessions, games, routines)
        console.log('🔥 getStatistics called with:', {
            sessionsCount: (this.sessions || []).length,
            gamesCount: games.length,
            routinesCount: routines.length
        });
        
        const stats = this.calculateAllActivitiesStats(games, routines);

        const totalPoints = this.currentUser?.totalPoints || 0;
        
        // If games/routines haven't loaded yet, use stored user values instead of calculated
        // This prevents showing stale "sessions-only" stats on initial render
        const activitiesNotLoaded = games.length === 0 && routines.length === 0 && 
                                    (this.currentUser?.totalRoutines > 0 || this.currentUser?.totalGames > 0);
        
        if (activitiesNotLoaded && this.currentUser?.totalMakes !== undefined) {
            console.log('📊 Using stored user values (activities not loaded yet)');
            const storedMakes = this.currentUser.totalMakes || 0;
            const storedPutts = this.currentUser.totalPutts || 0;
            const storedAccuracy = storedPutts > 0 ? parseFloat(((storedMakes / storedPutts) * 100).toFixed(1)) : 0;
            
            stats.totalMakes = storedMakes;
            stats.totalPutts = storedPutts;
            stats.accuracy = storedAccuracy;
            // Use stored streak when activities haven't loaded — live calc would miss games/routines
            stats.currentStreak = this.currentUser.currentStreak || 0;
            stats.longestStreak = this.currentUser.longestStreak || 0;
        }

        // If live streak differs from stored value, sync it back to Firestore.
        // This resets a stale streak (e.g. missed a day) even when no activity is logged.
        if (this.currentUser && !activitiesNotLoaded) {
            const liveStreak = stats.currentStreak;
            if (liveStreak !== (this.currentUser.currentStreak || 0)) {
                console.log(`🔥 Streak mismatch — stored: ${this.currentUser.currentStreak}, live: ${liveStreak}. Syncing.`);
                this.currentUser.currentStreak = liveStreak;
                if (stats.longestStreak > (this.currentUser.longestStreak || 0)) {
                    this.currentUser.longestStreak = stats.longestStreak;
                }
                storageManager.saveUser(this.currentUser).catch(err =>
                    console.warn('⚠️ Non-critical: failed to persist streak reset:', err)
                );
            }
        }
        
        console.log(`📊 getStatistics called:`, {
            currentUserTotalPoints: this.currentUser?.totalPoints,
            returnedTotalPoints: totalPoints,
            userId: this.currentUser?.id,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            usingStoredValues: activitiesNotLoaded
        });

        return {
            ...stats,
            totalPoints: totalPoints,
            achievements: this.currentUser?.achievements || []
        };
    }

    /**
     * Calculate statistics from all activities (sessions, games, routines)
     * @param {Array} games - Array of completed games
     * @param {Array} routines - Array of completed routines
     * @returns {Object} Combined statistics
     */
    calculateAllActivitiesStats(games = [], routines = []) {
        const sessions = this.sessions || [];

        let totalPutts = 0;
        let totalMakes = 0;
        let totalWeightedDistance = 0;
        let bestAccuracy = 0;
        let allPercentages = [];

        let excludedCount = 0;
        let includedCount = 0;

        // Add sessions data (exclude pending sessions logged for others)
        sessions.forEach(session => {
            // Skip sessions that are excluded from stats (logged for others)
            if (session.excludeFromStats) {
                excludedCount++;
                console.log('⏭️ Excluding session from stats:', {
                    id: session.id,
                    forUserId: session.forUserId,
                    forUserName: session.forUserName,
                    attempts: session.attempts,
                    points: session.points
                });
                return;
            }

            includedCount++;
            totalPutts += session.attempts || 0;
            totalMakes += session.makes || 0;
            totalWeightedDistance += (session.distance || 0) * (session.attempts || 0);

            if (session.percentage) {
                allPercentages.push(session.percentage);
            }
        });

        console.log('📊 Session stats calculation:', {
            totalSessions: sessions.length,
            included: includedCount,
            excluded: excludedCount,
            totalPutts,
            totalMakes
        });

        // Add games data (only games that track makes/attempts like Putt 100)
        games.forEach(game => {
            // Skip games that are excluded from stats (logged for others)
            if (game.excludeFromStats) {
                return;
            }

            if (game.totalAttempts && game.totalMakes) {
                totalPutts += game.totalAttempts;
                totalMakes += game.totalMakes;

                if (game.distance) {
                    totalWeightedDistance += game.distance * game.totalAttempts;
                }

                if (game.percentage) {
                    allPercentages.push(game.percentage);
                }
            }
        });

        // Add routines data
        routines.forEach(routine => {
            // Skip routines that are excluded from stats (logged for others)
            if (routine.excludeFromStats) {
                return;
            }

            if (routine.totalStats) {
                totalPutts += routine.totalStats.totalAttempts || 0;
                totalMakes += routine.totalStats.totalMakes || 0;

                if (routine.totalStats.overallPercentage) {
                    allPercentages.push(routine.totalStats.overallPercentage);
                }
            } else if (routine.drillScores) {
                // Fallback: calculate from drillScores if totalStats missing
                let routineMakes = 0;
                let routineAttempts = 0;
                routine.drillScores.forEach(d => {
                    if (d) {
                        routineMakes += d.makes || 0;
                        routineAttempts += d.attempts || 0;
                    }
                });
                totalMakes += routineMakes;
                totalPutts += routineAttempts;
                if (routineAttempts > 0) {
                    const pct = (routineMakes / routineAttempts) * 100;
                    if (!isNaN(pct) && isFinite(pct)) {
                        allPercentages.push(parseFloat(pct.toFixed(1)));
                    }
                }
            }
        });

        // Calculate overall metrics with safety checks
        let accuracy = 0;
        let avgDistance = 0;
        // bestAccuracy already declared above at line 379

        // Calculate accuracy from LOADED sessions (for display purposes only)
        let loadedAccuracy = 0;
        if (totalPutts > 0) {
            const accVal = (totalMakes / totalPutts) * 100;
            loadedAccuracy = (!isNaN(accVal) && isFinite(accVal)) ? parseFloat(accVal.toFixed(1)) : 0;

            const distVal = totalWeightedDistance / totalPutts;
            avgDistance = (!isNaN(distVal) && isFinite(distVal)) ? parseFloat(distVal.toFixed(1)) : 0;
        }

        if (allPercentages.length > 0) {
            const maxVal = Math.max(...allPercentages);
            bestAccuracy = (!isNaN(maxVal) && isFinite(maxVal)) ? parseFloat(maxVal.toFixed(1)) : 0;
        }

        // Get streak data from ALL activities (sessions, games, and routines)
        console.log('🔥 About to calculate streaks with:', {
            sessionsCount: sessions.length,
            gamesCount: games.length,
            routinesCount: routines.length,
            firstSession: sessions[0] ? { date: sessions[0].date, timestamp: sessions[0].timestamp } : null,
            firstGame: games[0] ? { endTime: games[0].endTime, timestamp: games[0].timestamp } : null,
            firstRoutine: routines[0] ? { endTime: routines[0].endTime, timestamp: routines[0].timestamp } : null
        });
        const streaks = calculateAllActivitiesStreaks(sessions, games, routines);
        console.log('🔥 Streaks result:', streaks);

        // Get best session for display
        const sessionStats = calculateStats(sessions);

        // Use counters from currentUser instead of counting loaded activities
        // This ensures consistency with leaderboard and accounts for ALL activities, not just loaded ones
        const totalSessions = this.currentUser?.totalSessions || 0;
        const totalGames = this.currentUser?.totalGames || 0;
        const totalRoutines = this.currentUser?.totalRoutines || 0;
        const totalActivities = totalSessions + totalGames + totalRoutines;

        // Calculate overall accuracy from LOADED activities (sessions + games + routines)
        // This is more accurate than Firebase stored values which may be out of sync
        let overallAccuracy = 0;
        if (totalPutts > 0) {
            const accVal = (totalMakes / totalPutts) * 100;
            overallAccuracy = (!isNaN(accVal) && isFinite(accVal)) ? parseFloat(accVal.toFixed(1)) : 0;
        }

        console.log('📊 calculateAllActivitiesStats:', {
            totalSessions,
            totalGames,
            totalRoutines,
            totalActivities,
            calculatedTotalPutts: totalPutts,
            calculatedTotalMakes: totalMakes,
            overallAccuracy,
            loadedSessionsCount: sessions.length,
            loadedGamesCount: games.length,
            loadedRoutinesCount: routines.length,
            loadedTotal: sessions.length + games.length + routines.length
        });

        return {
            totalSessions: totalSessions,
            totalGames: totalGames,
            totalRoutines: totalRoutines,
            totalActivities: totalActivities,
            totalPutts: totalPutts,  // Use calculated value from all activities
            totalMakes: totalMakes,  // Use calculated value from all activities
            accuracy: overallAccuracy,  // Use calculated accuracy from all activities
            avgDistance: avgDistance,
            bestAccuracy: bestAccuracy,
            bestSession: sessionStats.bestSession,
            currentStreak: streaks.current,
            longestStreak: streaks.longest
        };
    }

    /**
     * Add achievement to user
     * @param {string} achievementId - Achievement ID
     * @returns {Promise<void>}
     */
    async addAchievement(achievementId) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        if (!this.currentUser.achievements.includes(achievementId)) {
            // Find achievement in config to get points
            const achievement = ACHIEVEMENTS_CONFIG.find(a => a.id === achievementId);
            const points = achievement ? achievement.points : 0;

            // Add achievement to user's list
            this.currentUser.achievements.push(achievementId);

            // Record WHEN it was earned. Achievements were previously stored as a
            // bare id array with no timestamp, which made it impossible to tell
            // which ones were earned in the current season — so season XP tools
            // had to fall back to the lifetime count. This map fixes that.
            if (!this.currentUser.achievementDates) this.currentUser.achievementDates = {};
            this.currentUser.achievementDates[achievementId] = new Date().toISOString();

            // Award points
            if (points > 0) {
                this.currentUser.totalPoints = (this.currentUser.totalPoints || 0) + points;
                console.log(`🏆 Achievement unlocked: ${achievementId} (+${points} points)`);
            } else {
                console.log('🏆 Achievement unlocked:', achievementId);
            }

            // Save user
            await storageManager.saveUser(this.currentUser);

            // Award Season XP for earning the achievement. This is the canonical
            // unlock write path, so crediting XP here covers every unlock source
            // (real-time, time-based-on-login, leaderboard, bulk/group scorer).
            // The achievement id is passed as the idempotency key so re-checks
            // never double-credit. Symmetric with removeSeasonXp('earnAchievement').
            await teamsLeaguesManager.addSeasonXp(this.currentUser.id, 'earnAchievement', null, `ach_${achievementId}`);
        }
    }

    /**
     * Remove achievement from user (when no longer qualified)
     * @param {string} achievementId - Achievement ID
     * @returns {Promise<boolean>} True if achievement was removed
     */
    async removeAchievement(achievementId) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        const index = this.currentUser.achievements.indexOf(achievementId);
        if (index === -1) {
            return false; // Achievement not found
        }

        // Find achievement in config to get points
        const achievement = ACHIEVEMENTS_CONFIG.find(a => a.id === achievementId);
        const points = achievement ? achievement.points : 0;

        // Remove achievement from user's list
        this.currentUser.achievements.splice(index, 1);

        // Keep the earned-date map in sync
        if (this.currentUser.achievementDates) {
            delete this.currentUser.achievementDates[achievementId];
        }

        // Remove points
        if (points > 0) {
            this.currentUser.totalPoints = Math.max(0, (this.currentUser.totalPoints || 0) - points);
            console.log(`🔻 Achievement revoked: ${achievementId} (-${points} points)`);
        } else {
            console.log('🔻 Achievement revoked:', achievementId);
        }

        // Save user
        await storageManager.saveUser(this.currentUser);
        return true;
    }

    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Reload current user from storage
     * This is needed when user data is updated directly in storage
     * @returns {Promise<Object|null>} Reloaded user or null
     */
    async reloadCurrentUser() {
        if (!this.currentUser) {
            console.warn('⚠️ No current user to reload');
            return null;
        }

        try {
            const reloadedUser = await storageManager.getUser(this.currentUser.id);
            if (reloadedUser) {
                this.currentUser = reloadedUser;
                console.log('🔄 Current user reloaded:', {
                    id: reloadedUser.id,
                    displayName: reloadedUser.displayName,
                    totalPoints: reloadedUser.totalPoints,
                    totalSessions: reloadedUser.totalSessions,
                    totalRoutines: reloadedUser.totalRoutines,
                    totalGames: reloadedUser.totalGames,
                    calculatedTotal: (reloadedUser.totalSessions || 0) + (reloadedUser.totalRoutines || 0) + (reloadedUser.totalGames || 0)
                });
                return this.currentUser;
            } else {
                console.error('❌ User not found in storage during reload');
                return null;
            }
        } catch (error) {
            console.error('❌ Error reloading current user:', error);
            return null;
        }
    }

    /**
     * Update user profile
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No user is currently set');
        }

        this.currentUser = {
            ...this.currentUser,
            ...updates
        };

        await storageManager.saveUser(this.currentUser);
        return this.currentUser;
    }


    /**
     * Award an achievement to any user by ID (used in group/multiplayer sessions).
     * Reads and writes directly to Firestore — does NOT touch this.currentUser.
     * @param {string} userId - Target user ID
     * @param {string} achievementId - Achievement to unlock
     */
    async addAchievementForUser(userId, achievementId) {
        try {
            const user = await storageManager.getUser(userId);
            if (!user) return;
            const achievements = user.achievements || [];
            if (achievements.includes(achievementId)) return;

            const achievement = ACHIEVEMENTS_CONFIG.find(a => a.id === achievementId);
            const points = achievement ? achievement.points : 0;

            await storageManager.updateUser(userId, {
                achievements: [...achievements, achievementId],
                achievementDates: {
                    ...(user.achievementDates || {}),
                    [achievementId]: new Date().toISOString()
                },
                totalPoints: (user.totalPoints || 0) + points
            });

            console.log(`🏆 Achievement unlocked for ${userId}: ${achievementId} (+${points} pts)`);

            // Award Season XP for earning the achievement (idempotent via id key).
            await teamsLeaguesManager.addSeasonXp(userId, 'earnAchievement', null, `ach_${achievementId}`);
        } catch (error) {
            console.error(`Error adding achievement ${achievementId} for user ${userId}:`, error);
        }
    }

    /**
     * Clear current user
     */
    clearUser() {
        this.currentUser = null;
        this.sessions = [];
    }
}

// Export singleton instance
export const userManager = new UserManager();
