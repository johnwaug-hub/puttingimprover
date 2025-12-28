/**
 * User Module
 * Manages user data, sessions, and statistics
 */

import { storageManager } from './storage.js';
import { calculateSessionPoints, calculateStats } from '../utils/calculations.js';
import { validateSessionInput } from '../utils/validation.js';
import { CONSTANTS } from '../config/constants.js';

class UserManager {
    constructor() {
        this.currentUser = null;
        this.sessions = [];
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

        // Try to load existing user
        let user = await storageManager.getUser(firebaseUser.uid);

        // Create new user if doesn't exist
        if (!user) {
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
                favoritePutter: null,
                favoriteMidrange: null,
                favoriteDriver: null,
                hideFromLeaderboard: false,
                totalPoints: 0,
                totalSessions: 0,
                totalRoutines: 0,
                totalGames: 0,
                achievements: [],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            await storageManager.saveUser(user);
            console.log('✅ New user created:', user.email, 'Gender:', user.gender);
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
        
        // Update totalRoutines and totalGames counts
        await this.updateActivityCounts();

        return user;
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

        const { makes, attempts, distance, date, routineName } = sessionData;

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

        // Create session object
        const session = {
            id: `session_${Date.now()}`,
            date: date || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            distance: parseInt(distance),
            makes: parseInt(makes),
            attempts: parseInt(attempts),
            percentage,
            points,
            routineName: routineName || null
        };

        // Save session
        await storageManager.saveSession(this.currentUser.id, session);

        // Update user points and session count
        this.currentUser.totalPoints += points;
        this.currentUser.totalSessions = (this.currentUser.totalSessions || 0) + 1;
        
        // Update aggregate performance stats
        this.currentUser.totalPutts = (this.currentUser.totalPutts || 0) + parseInt(attempts);
        this.currentUser.totalMakes = (this.currentUser.totalMakes || 0) + parseInt(makes);
        
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
        
        await storageManager.saveUser(this.currentUser);

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

        // Remove points from user
        this.currentUser.totalPoints = Math.max(0, this.currentUser.totalPoints - session.points);
        this.currentUser.totalSessions = Math.max(0, (this.currentUser.totalSessions || 0) - 1);
        await storageManager.saveUser(this.currentUser);

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

        const { makes, attempts, distance } = sessionData;

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

        // Update session object
        const updatedSession = {
            ...oldSession,
            distance: parseInt(distance),
            makes: parseInt(makes),
            attempts: parseInt(attempts),
            percentage,
            points
        };

        // Save updated session
        await storageManager.saveSession(this.currentUser.id, updatedSession);

        // Update user's total points
        this.currentUser.totalPoints = (this.currentUser.totalPoints || 0) + pointsDiff;
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
    getStatistics() {
        const stats = calculateStats(this.sessions);
        
        return {
            ...stats,
            totalPoints: this.currentUser?.totalPoints || 0,
            achievements: this.currentUser?.achievements || []
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
            this.currentUser.achievements.push(achievementId);
            await storageManager.saveUser(this.currentUser);
            console.log('🏆 Achievement unlocked:', achievementId);
        }
    }

    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return this.currentUser;
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
     * Clear current user
     */
    clearUser() {
        this.currentUser = null;
        this.sessions = [];
    }
}

// Export singleton instance
export const userManager = new UserManager();
