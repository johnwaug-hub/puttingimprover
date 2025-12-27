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
            user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                photoURL: firebaseUser.photoURL,
                totalPoints: 0,
                achievements: [],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            await storageManager.saveUser(user);
            console.log('✅ New user created:', user.email);
        } else {
            // Update last login
            user.lastLogin = new Date().toISOString();
            await storageManager.saveUser(user);
            console.log('✅ User loaded:', user.email);
        }

        this.currentUser = user;
        await this.loadSessions();

        return user;
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
            distance: parseInt(distance),
            makes: parseInt(makes),
            attempts: parseInt(attempts),
            percentage,
            points,
            routineName: routineName || null
        };

        // Save session
        await storageManager.saveSession(this.currentUser.id, session);

        // Update user points
        this.currentUser.totalPoints += points;
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
        await storageManager.saveUser(this.currentUser);

        // Delete session
        const key = `${CONSTANTS.STORAGE_KEYS.SESSIONS_PREFIX}${this.currentUser.id}:${sessionId}`;
        await storageManager.delete(key, false);

        // Reload sessions
        await this.loadSessions();

        console.log('✅ Session deleted:', sessionId);
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
