/**
 * Achievements Module
 * Handles achievement checking and unlocking
 */

import { ACHIEVEMENTS_CONFIG, CONSTANTS } from '../config/constants.js';
import { userManager } from './user.js';
import { storageManager } from './storage.js';
import { getUserRank } from '../utils/calculations.js';

class AchievementManager {
    constructor() {
        this.achievements = ACHIEVEMENTS_CONFIG;
    }

    /**
     * Check and unlock achievements based on user data
     * @returns {Promise<Array>} Newly unlocked achievement IDs
     */
    async checkAchievements() {
        const user = userManager.getCurrentUser();
        if (!user) return [];

        const sessions = userManager.sessions;
        const stats = userManager.getStatistics();
        const currentAchievements = user.achievements || [];
        const newlyUnlocked = [];

        // First Steps - Complete first session
        if (sessions.length >= 1 && !currentAchievements.includes('first_steps')) {
            await userManager.addAchievement('first_steps');
            newlyUnlocked.push('first_steps');
        }

        // Perfect 10 - Make 10 putts at 100%
        const perfectSession = sessions.find(s => 
            s.makes >= CONSTANTS.ACHIEVEMENTS.PERFECT_10_THRESHOLD && 
            s.percentage === 100
        );
        if (perfectSession && !currentAchievements.includes('perfect_10')) {
            await userManager.addAchievement('perfect_10');
            newlyUnlocked.push('perfect_10');
        }

        // Century Club - Score 100+ points in one session
        const centurySession = sessions.find(s => 
            s.points >= CONSTANTS.ACHIEVEMENTS.CENTURY_CLUB_POINTS
        );
        if (centurySession && !currentAchievements.includes('century_club')) {
            await userManager.addAchievement('century_club');
            newlyUnlocked.push('century_club');
        }

        // Week Warrior - 7 day streak
        if (stats.currentStreak >= CONSTANTS.ACHIEVEMENTS.WEEK_WARRIOR_DAYS && 
            !currentAchievements.includes('week_warrior')) {
            await userManager.addAchievement('week_warrior');
            newlyUnlocked.push('week_warrior');
        }

        // Month Master - 30 day streak
        if (stats.longestStreak >= CONSTANTS.ACHIEVEMENTS.MONTH_MASTER_DAYS && 
            !currentAchievements.includes('month_master')) {
            await userManager.addAchievement('month_master');
            newlyUnlocked.push('month_master');
        }

        // Distance Demon - Make 5+ putts from 40+ feet
        const distanceSession = sessions.find(s => 
            s.distance >= CONSTANTS.ACHIEVEMENTS.DISTANCE_DEMON_FEET && 
            s.makes >= CONSTANTS.ACHIEVEMENTS.DISTANCE_DEMON_PUTTS
        );
        if (distanceSession && !currentAchievements.includes('distance_demon')) {
            await userManager.addAchievement('distance_demon');
            newlyUnlocked.push('distance_demon');
        }

        // Social Butterfly - Add 5 friends
        const friends = await storageManager.getUserFriends(user.id);
        if (friends.length >= CONSTANTS.ACHIEVEMENTS.SOCIAL_BUTTERFLY_FRIENDS && 
            !currentAchievements.includes('social_butterfly')) {
            await userManager.addAchievement('social_butterfly');
            newlyUnlocked.push('social_butterfly');
        }

        // Point King - Earn 1000+ total points
        if (user.totalPoints >= CONSTANTS.ACHIEVEMENTS.POINT_KING_TOTAL && 
            !currentAchievements.includes('point_king')) {
            await userManager.addAchievement('point_king');
            newlyUnlocked.push('point_king');
        }

        // Podium Finish - Top 3 on leaderboard
        const leaderboard = await storageManager.getLeaderboard();
        const rank = getUserRank(leaderboard, user.id);
        if (rank > 0 && rank <= CONSTANTS.ACHIEVEMENTS.PODIUM_POSITION && 
            !currentAchievements.includes('podium_finish')) {
            await userManager.addAchievement('podium_finish');
            newlyUnlocked.push('podium_finish');
        }

        if (newlyUnlocked.length > 0) {
            console.log('🏆 New achievements unlocked:', newlyUnlocked);
        }

        return newlyUnlocked;
    }

    /**
     * Get all achievements with unlock status
     * @returns {Array} Achievements with isUnlocked flag
     */
    getAchievementsWithStatus() {
        const user = userManager.getCurrentUser();
        const unlockedIds = user?.achievements || [];

        return this.achievements.map(achievement => ({
            ...achievement,
            isUnlocked: unlockedIds.includes(achievement.id)
        }));
    }

    /**
     * Get unlocked achievements
     * @returns {Array} Array of unlocked achievements
     */
    getUnlockedAchievements() {
        return this.getAchievementsWithStatus().filter(a => a.isUnlocked);
    }

    /**
     * Get locked achievements
     * @returns {Array} Array of locked achievements
     */
    getLockedAchievements() {
        return this.getAchievementsWithStatus().filter(a => !a.isUnlocked);
    }

    /**
     * Get achievement progress percentage
     * @returns {number} Percentage of achievements unlocked
     */
    getProgress() {
        const total = this.achievements.length;
        const unlocked = this.getUnlockedAchievements().length;
        return Math.round((unlocked / total) * 100);
    }
}

// Export singleton instance
export const achievementManager = new AchievementManager();
