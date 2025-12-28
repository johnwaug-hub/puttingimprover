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

        // Routine Rookie - Complete first routine
        const routineSessions = sessions.filter(s => s.routineName);
        if (routineSessions.length >= 1 && !currentAchievements.includes('routine_rookie')) {
            await userManager.addAchievement('routine_rookie');
            newlyUnlocked.push('routine_rookie');
        }

        // Routine Regular - Complete 5 different routines
        const uniqueRoutines = new Set(routineSessions.map(s => s.routineName));
        if (uniqueRoutines.size >= 5 && !currentAchievements.includes('routine_regular')) {
            await userManager.addAchievement('routine_regular');
            newlyUnlocked.push('routine_regular');
        }

        // Routine Master - Complete all 4 routines
        const routineNames = ['Beginner 10ft', 'Intermediate Mixed', 'Advanced Ladder', 'Consistency Builder'];
        const completedAll = routineNames.every(name => 
            routineSessions.some(s => s.routineName === name)
        );
        if (completedAll && !currentAchievements.includes('routine_master')) {
            await userManager.addAchievement('routine_master');
            newlyUnlocked.push('routine_master');
        }

        // Ladder Climber - Complete Advanced Ladder
        const ladderSession = routineSessions.find(s => s.routineName === 'Advanced Ladder');
        if (ladderSession && !currentAchievements.includes('ladder_climber')) {
            await userManager.addAchievement('ladder_climber');
            newlyUnlocked.push('ladder_climber');
        }

        // Consistency King - Complete Consistency Builder 3 times
        const consistencySessions = routineSessions.filter(s => s.routineName === 'Consistency Builder');
        if (consistencySessions.length >= 3 && !currentAchievements.includes('consistency_king')) {
            await userManager.addAchievement('consistency_king');
            newlyUnlocked.push('consistency_king');
        }

        // NEW ACHIEVEMENTS
        
        // Ninety Percent Club - 90%+ accuracy
        const ninetyPercent = sessions.find(s => s.percentage >= 90);
        if (ninetyPercent && !currentAchievements.includes('ninety_percent_club')) {
            await userManager.addAchievement('ninety_percent_club');
            newlyUnlocked.push('ninety_percent_club');
        }

        // Flawless - 50+ putts at 100%
        const flawless = sessions.find(s => s.makes >= 50 && s.percentage === 100);
        if (flawless && !currentAchievements.includes('flawless')) {
            await userManager.addAchievement('flawless');
            newlyUnlocked.push('flawless');
        }

        // Sharpshooter - 95%+ from 20+ feet
        const sharpshooter = sessions.find(s => s.distance >= 20 && s.percentage >= 95);
        if (sharpshooter && !currentAchievements.includes('sharpshooter')) {
            await userManager.addAchievement('sharpshooter');
            newlyUnlocked.push('sharpshooter');
        }

        // Half Century - 50 sessions
        if (sessions.length >= 50 && !currentAchievements.includes('half_century')) {
            await userManager.addAchievement('half_century');
            newlyUnlocked.push('half_century');
        }

        // Centurion - 100 sessions
        if (sessions.length >= 100 && !currentAchievements.includes('centurion')) {
            await userManager.addAchievement('centurion');
            newlyUnlocked.push('centurion');
        }

        // Point Legend - 5000+ points
        if (user.totalPoints >= 5000 && !currentAchievements.includes('point_legend')) {
            await userManager.addAchievement('point_legend');
            newlyUnlocked.push('point_legend');
        }

        // Two Week Streak
        if (stats.longestStreak >= 14 && !currentAchievements.includes('two_week_streak')) {
            await userManager.addAchievement('two_week_streak');
            newlyUnlocked.push('two_week_streak');
        }

        // Iron Will - 60 day streak
        if (stats.longestStreak >= 60 && !currentAchievements.includes('iron_will')) {
            await userManager.addAchievement('iron_will');
            newlyUnlocked.push('iron_will');
        }

        // Unstoppable - 100 day streak
        if (stats.longestStreak >= 100 && !currentAchievements.includes('unstoppable')) {
            await userManager.addAchievement('unstoppable');
            newlyUnlocked.push('unstoppable');
        }

        // Long Ranger - Practice from 30+ feet
        const longRange = sessions.find(s => s.distance >= 30);
        if (longRange && !currentAchievements.includes('long_ranger')) {
            await userManager.addAchievement('long_ranger');
            newlyUnlocked.push('long_ranger');
        }

        // Downtown Driver - Make putt from 50+ feet
        const downtown = sessions.find(s => s.distance >= 50 && s.makes >= 1);
        if (downtown && !currentAchievements.includes('downtown_driver')) {
            await userManager.addAchievement('downtown_driver');
            newlyUnlocked.push('downtown_driver');
        }

        // Extreme Range - 3+ putts from 60+ feet
        const extreme = sessions.find(s => s.distance >= 60 && s.makes >= 3);
        if (extreme && !currentAchievements.includes('extreme_range')) {
            await userManager.addAchievement('extreme_range');
            newlyUnlocked.push('extreme_range');
        }

        // Hundred Club - 100 makes in one session
        const hundred = sessions.find(s => s.makes >= 100);
        if (hundred && !currentAchievements.includes('hundred_club')) {
            await userManager.addAchievement('hundred_club');
            newlyUnlocked.push('hundred_club');
        }

        // Two Hundred Club - 200 makes in one session
        const twoHundred = sessions.find(s => s.makes >= 200);
        if (twoHundred && !currentAchievements.includes('two_hundred_club')) {
            await userManager.addAchievement('two_hundred_club');
            newlyUnlocked.push('two_hundred_club');
        }

        // Marathon Putter - 500 attempts in one session
        const marathon = sessions.find(s => s.attempts >= 500);
        if (marathon && !currentAchievements.includes('marathon_putter')) {
            await userManager.addAchievement('marathon_putter');
            newlyUnlocked.push('marathon_putter');
        }

        // Iron Man - 1000 attempts in one session
        const ironMan = sessions.find(s => s.attempts >= 1000);
        if (ironMan && !currentAchievements.includes('iron_man')) {
            await userManager.addAchievement('iron_man');
            newlyUnlocked.push('iron_man');
        }

        // Routine Addict - 25 total routines
        if (user.totalRoutines >= 25 && !currentAchievements.includes('routine_addict')) {
            await userManager.addAchievement('routine_addict');
            newlyUnlocked.push('routine_addict');
        }

        // Game Enthusiast - 10 games
        if (user.totalGames >= 10 && !currentAchievements.includes('game_enthusiast')) {
            await userManager.addAchievement('game_enthusiast');
            newlyUnlocked.push('game_enthusiast');
        }

        // Friend Magnet - 10 friends
        const friends2 = await storageManager.getUserFriends(user.id);
        if (friends2.length >= 10 && !currentAchievements.includes('friend_magnet')) {
            await userManager.addAchievement('friend_magnet');
            newlyUnlocked.push('friend_magnet');
        }

        // Top Ten - Top 10 on leaderboard
        if (rank > 0 && rank <= 10 && !currentAchievements.includes('top_ten')) {
            await userManager.addAchievement('top_ten');
            newlyUnlocked.push('top_ten');
        }

        // Number One - #1 on leaderboard
        if (rank === 1 && !currentAchievements.includes('number_one')) {
            await userManager.addAchievement('number_one');
            newlyUnlocked.push('number_one');
        }

        // Distance Explorer - 10 different distances
        const uniqueDistances = new Set(sessions.map(s => s.distance));
        if (uniqueDistances.size >= 10 && !currentAchievements.includes('distance_explorer')) {
            await userManager.addAchievement('distance_explorer');
            newlyUnlocked.push('distance_explorer');
        }

        // All Ranges - Practice from 10, 20, 30, 40, 50 feet
        const requiredDistances = [10, 20, 30, 40, 50];
        const hasAllRanges = requiredDistances.every(d => sessions.some(s => s.distance === d));
        if (hasAllRanges && !currentAchievements.includes('all_ranges')) {
            await userManager.addAchievement('all_ranges');
            newlyUnlocked.push('all_ranges');
        }

        // Disc Collector - All 3 favorite discs
        if (user.favoritePutter && user.favoriteMidrange && user.favoriteDriver && 
            !currentAchievements.includes('disc_collector')) {
            await userManager.addAchievement('disc_collector');
            newlyUnlocked.push('disc_collector');
        }

        // Profile Complete - All profile fields
        if (user.displayName && user.gender && user.birthday && 
            user.favoritePutter && user.favoriteMidrange && user.favoriteDriver &&
            !currentAchievements.includes('profile_complete')) {
            await userManager.addAchievement('profile_complete');
            newlyUnlocked.push('profile_complete');
        }

        // Game On - View Games tab (checked in app.js when view changes)
        // This is a simple achievement just for viewing the tab
        if (!currentAchievements.includes('game_on')) {
            // Will be unlocked when Games tab is viewed
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
