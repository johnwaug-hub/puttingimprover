/**
 * Challenges Module
 * Manages weekly challenges
 */

import { CHALLENGE_TYPES, CONSTANTS } from '../config/constants.js';
import { storageManager } from './storage.js';
import { userManager } from './user.js';

class ChallengeManager {
    constructor() {
        this.currentChallenge = null;
    }

    /**
     * Load or create weekly challenge
     * @returns {Promise<Object>} Current challenge
     */
    async loadWeeklyChallenge() {
        const challenge = await storageManager.getWeeklyChallenge();

        if (challenge) {
            const challengeDate = new Date(challenge.startDate);
            const now = new Date();
            const daysDiff = Math.floor((now - challengeDate) / (1000 * 60 * 60 * 24));

            // Check if challenge is still valid (less than 7 days old)
            if (daysDiff < CONSTANTS.CHALLENGE.DURATION_DAYS) {
                this.currentChallenge = challenge;
                return challenge;
            }
        }

        // Create new challenge if none exists or old one expired
        return await this.createNewChallenge();
    }

    /**
     * Create a new weekly challenge
     * @returns {Promise<Object>} New challenge
     */
    async createNewChallenge() {
        // Randomly select a challenge type
        const randomIndex = Math.floor(Math.random() * CHALLENGE_TYPES.length);
        const challengeType = CHALLENGE_TYPES[randomIndex];

        const newChallenge = {
            ...challengeType,
            startDate: new Date().toISOString(),
            id: `challenge_${Date.now()}`,
            completed: false,
            completedBy: []
        };

        await storageManager.saveWeeklyChallenge(newChallenge);
        this.currentChallenge = newChallenge;

        console.log('📋 New weekly challenge created:', newChallenge.desc);
        return newChallenge;
    }

    /**
     * Check if session completes the current challenge
     * @param {Object} session - Session to check
     * @returns {Promise<boolean>} True if challenge was completed
     */
    async checkChallengeCompletion(session) {
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

        switch (this.currentChallenge.type) {
            case 'accuracy':
                // Achieve target accuracy or higher in a session
                if (session.percentage >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'distance':
                // Make 5+ putts from target distance or higher
                if (session.distance >= this.currentChallenge.target && session.makes >= 5) {
                    completed = true;
                }
                break;

            case 'volume':
                // Make target number of putts this week
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const thisWeekSessions = userManager.sessions.filter(s => 
                    new Date(s.date) >= weekAgo
                );
                const totalMakes = thisWeekSessions.reduce((sum, s) => sum + s.makes, 0);
                if (totalMakes >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'streak':
                // Practice target number of days this week
                const stats = userManager.getStatistics();
                if (stats.currentStreak >= this.currentChallenge.target) {
                    completed = true;
                }
                break;

            case 'points':
                // Score target points in one session
                if (session.points >= this.currentChallenge.target) {
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

            // Award points
            user.totalPoints += this.currentChallenge.reward;
            await storageManager.saveUser(user);

            // Check for challenge achievement
            await userManager.addAchievement('challenge_accepted');

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
     * Get challenge progress for current user
     * @returns {Object} Progress information
     */
    getChallengeProgress() {
        if (!this.currentChallenge) return null;

        const user = userManager.getCurrentUser();
        if (!user) return null;

        const sessions = userManager.sessions;
        const stats = userManager.getStatistics();

        let progress = 0;
        let target = this.currentChallenge.target;

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

            case 'volume':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const thisWeekSessions = sessions.filter(s => new Date(s.date) >= weekAgo);
                progress = thisWeekSessions.reduce((sum, s) => sum + s.makes, 0);
                break;

            case 'streak':
                progress = stats.currentStreak;
                break;

            case 'points':
                const bestPoints = Math.max(...sessions.map(s => s.points), 0);
                progress = Math.min(bestPoints, target);
                break;
        }

        return {
            current: progress,
            target,
            percentage: Math.round((progress / target) * 100),
            completed: this.isCompletedByUser()
        };
    }
}

// Export singleton instance
export const challengeManager = new ChallengeManager();
