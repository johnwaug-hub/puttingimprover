/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Achievements Module
 * Handles achievement checking and unlocking
 */

import { ACHIEVEMENTS_CONFIG, CONSTANTS, isStickyAchievement } from '../config/constants.js';
import { userManager } from './user.js';
import { storageManager } from './storage.js';
import { getUserRank } from '../utils/calculations.js';

class AchievementManager {
    constructor() {
        this.achievements = ACHIEVEMENTS_CONFIG;
    }

    /**
     * Check and unlock achievements based on user data
     * @param {Array} routines - Array of routine completions (optional)
     * @param {Array} games - Array of game completions (optional)
     * @returns {Promise<Array>} Newly unlocked achievement IDs
     */
    async checkAchievements(routines = [], games = []) {
        const user = userManager.getCurrentUser();
        if (!user) return [];

        const sessions = userManager.sessions || [];
        const stats = userManager.getStatistics();
        const currentAchievements = user.achievements || [];
        const newlyUnlocked = [];

        // Use passed routines array for routine achievements
        const routineCompletions = routines || [];
        const gameCompletions = games || [];

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

        // Week Warrior - 7 day streak (use longestStreak - once you've had a 7-day streak, you've earned it)
        if (stats.longestStreak >= CONSTANTS.ACHIEVEMENTS.WEEK_WARRIOR_DAYS &&
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

        // Podium Finish - Top 3 on leaderboard (excluding hidden users)
        const leaderboard = await storageManager.getLeaderboard();
        // Filter hidden users AND check if current user is hidden
        const isHidden = user.hideFromLeaderboard;
        const rank = isHidden ? -1 : getUserRank(leaderboard, user.id, true); // true = filter hidden
        if (rank > 0 && rank <= CONSTANTS.ACHIEVEMENTS.PODIUM_POSITION &&
            !currentAchievements.includes('podium_finish')) {
            await userManager.addAchievement('podium_finish');
            newlyUnlocked.push('podium_finish');
        }

        // Routine Rookie - Complete first routine
        // Check both sessions with routineName AND routineCompletions
        const routineSessions = sessions.filter(s => s.routineName);
        const allRoutineActivity = [...routineSessions, ...routineCompletions];
        
        if (allRoutineActivity.length >= 1 && !currentAchievements.includes('routine_rookie')) {
            await userManager.addAchievement('routine_rookie');
            newlyUnlocked.push('routine_rookie');
        }

        // Routine Regular - Complete 5 different routines
        const uniqueRoutineNames = new Set([
            ...routineSessions.map(s => s.routineName),
            ...routineCompletions.map(r => r.routineName)
        ]);
        if (uniqueRoutineNames.size >= 5 && !currentAchievements.includes('routine_regular')) {
            await userManager.addAchievement('routine_regular');
            newlyUnlocked.push('routine_regular');
        }

        // Routine Master - Complete all 4 routines
        const routineNames = ['Beginner 10ft', 'Intermediate Mixed', 'Advanced Ladder', 'Consistency Builder'];
        const completedAll = routineNames.every(name =>
            routineSessions.some(s => s.routineName === name) ||
            routineCompletions.some(r => r.routineName === name)
        );
        if (completedAll && !currentAchievements.includes('routine_master')) {
            await userManager.addAchievement('routine_master');
            newlyUnlocked.push('routine_master');
        }

        // Ladder Climber - Complete Advanced Ladder
        const ladderSession = routineSessions.find(s => s.routineName === 'Advanced Ladder') ||
                             routineCompletions.find(r => r.routineName === 'Advanced Ladder');
        if (ladderSession && !currentAchievements.includes('ladder_climber')) {
            await userManager.addAchievement('ladder_climber');
            newlyUnlocked.push('ladder_climber');
        }

        // Consistency King - Complete Consistency Builder 3 times
        const consistencyCount = routineSessions.filter(s => s.routineName === 'Consistency Builder').length +
                                routineCompletions.filter(r => r.routineName === 'Consistency Builder').length;
        if (consistencyCount >= 3 && !currentAchievements.includes('consistency_king')) {
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

        // Game On - Complete first game (must have completed at least 1 game)
        // Fixed: Previously awarded when viewing Games tab, now requires actual game completion
        if (gameCompletions.length >= 1 && !currentAchievements.includes('game_on')) {
            await userManager.addAchievement('game_on');
            newlyUnlocked.push('game_on');
        }

        // ==================== ADDITIONAL ACHIEVEMENTS ====================

        // ========== GETTING STARTED ==========

        // Early Bird - Practice before 8am
        const earlyBirdSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const hour = date.getHours();
            return hour < 8;
        });
        if (earlyBirdSession && !currentAchievements.includes('early_bird')) {
            await userManager.addAchievement('early_bird');
            newlyUnlocked.push('early_bird');
        }

        // Night Owl - Practice after 8pm
        const nightOwlSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const hour = date.getHours();
            return hour >= 20;
        });
        if (nightOwlSession && !currentAchievements.includes('night_owl')) {
            await userManager.addAchievement('night_owl');
            newlyUnlocked.push('night_owl');
        }

        // First Friend - Add first friend
        if (friends.length >= 1 && !currentAchievements.includes('first_friend')) {
            await userManager.addAchievement('first_friend');
            newlyUnlocked.push('first_friend');
        }

        // Tutorial Complete - Complete the getting started tutorial
        if (user.tutorialCompleted && !currentAchievements.includes('tutorial_complete')) {
            await userManager.addAchievement('tutorial_complete');
            newlyUnlocked.push('tutorial_complete');
        }

        // First Week - Practice for 7 total days
        const uniqueDays = new Set(sessions.map(s => {
            const date = new Date(s.timestamp || s.date);
            return date.toDateString();
        }));
        if (uniqueDays.size >= 7 && !currentAchievements.includes('first_week')) {
            await userManager.addAchievement('first_week');
            newlyUnlocked.push('first_week');
        }

        // Morning Person - Practice 5 times before noon (any activity type)
        const allActivitiesWithTime = [
            ...sessions.map(s => new Date(s.timestamp || s.date)),
            ...routineCompletions.map(r => new Date(r.endTime || r.timestamp || r.date)),
            ...gameCompletions.map(g => new Date(g.endTime || g.timestamp || g.date))
        ];
        const morningPractice = allActivitiesWithTime.filter(date => date.getHours() < 12);
        if (morningPractice.length >= 5 && !currentAchievements.includes('morning_person')) {
            await userManager.addAchievement('morning_person');
            newlyUnlocked.push('morning_person');
        }

        // Afternoon Delight - Practice 5 times between 12pm-5pm (any activity type)
        const afternoonPractice = allActivitiesWithTime.filter(date => {
            const hour = date.getHours();
            return hour >= 12 && hour < 17;
        });
        if (afternoonPractice.length >= 5 && !currentAchievements.includes('afternoon_delight')) {
            await userManager.addAchievement('afternoon_delight');
            newlyUnlocked.push('afternoon_delight');
        }

        // ========== ACCURACY ==========

        // 80% Pro - 80%+ accuracy in a session
        const eightyPercent = sessions.find(s => s.percentage >= 80);
        if (eightyPercent && !currentAchievements.includes('eighty_percent_pro')) {
            await userManager.addAchievement('eighty_percent_pro');
            newlyUnlocked.push('eighty_percent_pro');
        }

        // Deadeye - 98%+ accuracy in a 25+ putt session
        const deadeye = sessions.find(s => s.attempts >= 25 && s.percentage >= 98);
        if (deadeye && !currentAchievements.includes('deadeye')) {
            await userManager.addAchievement('deadeye');
            newlyUnlocked.push('deadeye');
        }

        // Perfect Circle - 100% accuracy from Circle 1 (33ft)
        const perfectCircle = sessions.find(s => s.distance === 33 && s.percentage === 100);
        if (perfectCircle && !currentAchievements.includes('perfect_circle')) {
            await userManager.addAchievement('perfect_circle');
            newlyUnlocked.push('perfect_circle');
        }

        // Laser Focus - 90%+ accuracy from 25+ feet
        const laserFocus = sessions.find(s => s.distance >= 25 && s.percentage >= 90);
        if (laserFocus && !currentAchievements.includes('laser_focus')) {
            await userManager.addAchievement('laser_focus');
            newlyUnlocked.push('laser_focus');
        }

        // Consistent Accuracy - 85%+ average over 10 sessions
        if (sessions.length >= 10) {
            const last10 = sessions.slice(0, 10);
            const avgAccuracy = last10.reduce((sum, s) => sum + (s.percentage || 0), 0) / 10;
            if (avgAccuracy >= 85 && !currentAchievements.includes('consistent_accuracy')) {
                await userManager.addAchievement('consistent_accuracy');
                newlyUnlocked.push('consistent_accuracy');
            }
        }

        // Triple Perfect - 3 consecutive 100% sessions (sorted by date)
        // NOTE: This requires chronological session analysis - handled by MCP audit
        // The previous check didn't ensure sessions were consecutive by DATE
        // for (let i = 0; i < sessions.length - 2; i++) {
        //     if (sessions[i].percentage === 100 &&
        //         sessions[i+1].percentage === 100 &&
        //         sessions[i+2].percentage === 100 &&
        //         !currentAchievements.includes('triple_perfect')) {
        //         await userManager.addAchievement('triple_perfect');
        //         newlyUnlocked.push('triple_perfect');
        //         break;
        //     }
        // }

        // ========== POINTS & SESSIONS ==========

        // Quick Start - 25+ points in one session
        const quickStart = sessions.find(s => s.points >= 25);
        if (quickStart && !currentAchievements.includes('quick_start')) {
            await userManager.addAchievement('quick_start');
            newlyUnlocked.push('quick_start');
        }

        // Double Century - 200+ points in one session
        const doubleCentury = sessions.find(s => s.points >= 200);
        if (doubleCentury && !currentAchievements.includes('double_century')) {
            await userManager.addAchievement('double_century');
            newlyUnlocked.push('double_century');
        }

        // Triple Threat - 300+ points in one session
        const tripleThreat = sessions.find(s => s.points >= 300);
        if (tripleThreat && !currentAchievements.includes('triple_threat')) {
            await userManager.addAchievement('triple_threat');
            newlyUnlocked.push('triple_threat');
        }

        // Session Veteran - 250 sessions
        if (user.totalSessions >= 250 && !currentAchievements.includes('session_veteran')) {
            await userManager.addAchievement('session_veteran');
            newlyUnlocked.push('session_veteran');
        }

        // Session Legend - 500 sessions
        if (user.totalSessions >= 500 && !currentAchievements.includes('session_legend')) {
            await userManager.addAchievement('session_legend');
            newlyUnlocked.push('session_legend');
        }

        // Point Millionaire - 10,000+ points
        if (user.totalPoints >= 10000 && !currentAchievements.includes('point_millionaire')) {
            await userManager.addAchievement('point_millionaire');
            newlyUnlocked.push('point_millionaire');
        }

        // Point Titan - 25,000+ points
        if (user.totalPoints >= 25000 && !currentAchievements.includes('point_titan')) {
            await userManager.addAchievement('point_titan');
            newlyUnlocked.push('point_titan');
        }

        // Ten Sessions Week - 10 sessions in one week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const lastWeekSessions = sessions.filter(s => {
            const sessionDate = new Date(s.timestamp || s.date);
            return sessionDate >= oneWeekAgo;
        });
        if (lastWeekSessions.length >= 10 && !currentAchievements.includes('ten_sessions_week')) {
            await userManager.addAchievement('ten_sessions_week');
            newlyUnlocked.push('ten_sessions_week');
        }

        // ========== STREAKS ==========

        // Three Day Starter - 3 days in a row (use longestStreak - once achieved, you've earned it)
        if (stats.longestStreak >= 3 && !currentAchievements.includes('three_day_starter')) {
            await userManager.addAchievement('three_day_starter');
            newlyUnlocked.push('three_day_starter');
        }

        // Quarter Year - 90 days in a row
        if (stats.longestStreak >= 90 && !currentAchievements.includes('quarter_year')) {
            await userManager.addAchievement('quarter_year');
            newlyUnlocked.push('quarter_year');
        }

        // Weekend Streak - Practice every weekend for a month (8+ weekend days in 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const weekendSessions = sessions.filter(s => {
            const date = new Date(s.timestamp || s.date);
            const day = date.getDay();
            return (day === 0 || day === 6) && date >= thirtyDaysAgo;
        });
        const weekendDays = new Set(weekendSessions.map(s => new Date(s.timestamp || s.date).toDateString()));
        if (weekendDays.size >= 8 && !currentAchievements.includes('weekend_streak')) {
            await userManager.addAchievement('weekend_streak');
            newlyUnlocked.push('weekend_streak');
        }

        // Phoenix Rising - Rebuild 30+ day streak after breaking one
        // This requires tracking previous streak breaks - simplified: has 30+ streak and previously had one
        if (stats.longestStreak >= 30 && stats.currentStreak >= 30 &&
            stats.longestStreak > stats.currentStreak &&
            !currentAchievements.includes('phoenix_rising')) {
            await userManager.addAchievement('phoenix_rising');
            newlyUnlocked.push('phoenix_rising');
        }

        // ========== DISTANCE ==========

        // Baby Steps - Practice from 5-10ft
        const babySteps = sessions.find(s => s.distance >= 5 && s.distance <= 10);
        if (babySteps && !currentAchievements.includes('baby_steps')) {
            await userManager.addAchievement('baby_steps');
            newlyUnlocked.push('baby_steps');
        }

        // Mid-Range Master - 20+ putts from 20-25ft
        const midRange = sessions.find(s => s.distance >= 20 && s.distance <= 25 && s.makes >= 20);
        if (midRange && !currentAchievements.includes('mid_range_master')) {
            await userManager.addAchievement('mid_range_master');
            newlyUnlocked.push('mid_range_master');
        }

        // Circle 2 Hero - 10+ putts from Circle 2 (66ft)
        const circle2 = sessions.find(s => s.distance === 66 && s.makes >= 10);
        if (circle2 && !currentAchievements.includes('circle_2_hero')) {
            await userManager.addAchievement('circle_2_hero');
            newlyUnlocked.push('circle_2_hero');
        }

        // Ultra Range - Make putt from 70+ feet
        const ultraRange = sessions.find(s => s.distance >= 70 && s.makes >= 1);
        if (ultraRange && !currentAchievements.includes('ultra_range')) {
            await userManager.addAchievement('ultra_range');
            newlyUnlocked.push('ultra_range');
        }

        // Distance Variety - Make putts from 15, 20, 25, 30ft
        const hasDistances = [15, 20, 25, 30];
        const hasAllDistances = hasDistances.every(d => sessions.some(s => s.distance === d && s.makes >= 1));
        if (hasAllDistances && !currentAchievements.includes('distance_variety')) {
            await userManager.addAchievement('distance_variety');
            newlyUnlocked.push('distance_variety');
        }

        // Graduated Distances - Sessions at every 5ft from 10-50ft
        const graduatedDists = [10, 15, 20, 25, 30, 35, 40, 45, 50];
        const hasGraduated = graduatedDists.every(d => sessions.some(s => s.distance === d));
        if (hasGraduated && !currentAchievements.includes('graduated_distances')) {
            await userManager.addAchievement('graduated_distances');
            newlyUnlocked.push('graduated_distances');
        }

        // ========== VOLUME ==========

        // Fifty Club - 50 makes in one session
        const fifty = sessions.find(s => s.makes >= 50);
        if (fifty && !currentAchievements.includes('fifty_club')) {
            await userManager.addAchievement('fifty_club');
            newlyUnlocked.push('fifty_club');
        }

        // Three Hundred Club - 300 makes
        const threeHundred = sessions.find(s => s.makes >= 300);
        if (threeHundred && !currentAchievements.includes('three_hundred_club')) {
            await userManager.addAchievement('three_hundred_club');
            newlyUnlocked.push('three_hundred_club');
        }

        // Five Hundred Club - 500 makes
        const fiveHundred = sessions.find(s => s.makes >= 500);
        if (fiveHundred && !currentAchievements.includes('five_hundred_club')) {
            await userManager.addAchievement('five_hundred_club');
            newlyUnlocked.push('five_hundred_club');
        }

        // Total Makes achievements
        const totalMakes = user.totalMakes || 0;
        if (totalMakes >= 1000 && !currentAchievements.includes('total_makes_1000')) {
            await userManager.addAchievement('total_makes_1000');
            newlyUnlocked.push('total_makes_1000');
        }
        if (totalMakes >= 5000 && !currentAchievements.includes('total_makes_5000')) {
            await userManager.addAchievement('total_makes_5000');
            newlyUnlocked.push('total_makes_5000');
        }
        if (totalMakes >= 10000 && !currentAchievements.includes('total_makes_10000')) {
            await userManager.addAchievement('total_makes_10000');
            newlyUnlocked.push('total_makes_10000');
        }

        // Daily Hundred - 100+ makes in a single day
        // NOTE: This requires summing makes across all activities (sessions + routines + games) by date
        // The previous check only looked at sessions. MCP audit handles this properly.
        // const sessionsByDay = {};
        // sessions.forEach(s => {
        //     const day = new Date(s.timestamp || s.date).toDateString();
        //     sessionsByDay[day] = (sessionsByDay[day] || 0) + (s.makes || 0);
        // });
        // const hasDaily100 = Object.values(sessionsByDay).some(makes => makes >= 100);
        // if (hasDaily100 && !currentAchievements.includes('daily_hundred')) {
        //     await userManager.addAchievement('daily_hundred');
        //     newlyUnlocked.push('daily_hundred');
        // }

        // ========== ROUTINES ==========

        // Routine Completionist - Complete every available routine at least once
        // Simplified: Complete 10+ different routines (as a proxy for "all available")
        if (uniqueRoutineNames.size >= 10 && !currentAchievements.includes('routine_completionist')) {
            await userManager.addAchievement('routine_completionist');
            newlyUnlocked.push('routine_completionist');
        }

        // Routine Specialist - Complete same routine 10 times
        // Combine routineSessions and routineCompletions for count
        const routineCounts = {};
        routineSessions.forEach(s => {
            routineCounts[s.routineName] = (routineCounts[s.routineName] || 0) + 1;
        });
        routineCompletions.forEach(r => {
            routineCounts[r.routineName] = (routineCounts[r.routineName] || 0) + 1;
        });
        const hasSpecialist = Object.values(routineCounts).some(count => count >= 10);
        if (hasSpecialist && !currentAchievements.includes('routine_specialist')) {
            await userManager.addAchievement('routine_specialist');
            newlyUnlocked.push('routine_specialist');
        }

        // Routine Marathon - 3 routines in one day
        const routinesByDay = {};
        routineSessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            routinesByDay[day] = (routinesByDay[day] || 0) + 1;
        });
        routineCompletions.forEach(r => {
            const day = new Date(r.timestamp || r.date).toDateString();
            routinesByDay[day] = (routinesByDay[day] || 0) + 1;
        });
        const hasMarathon = Object.values(routinesByDay).some(count => count >= 3);
        if (hasMarathon && !currentAchievements.includes('routine_marathon')) {
            await userManager.addAchievement('routine_marathon');
            newlyUnlocked.push('routine_marathon');
        }

        // Fifty Routines - 50 total routines
        if (user.totalRoutines >= 50 && !currentAchievements.includes('fifty_routines')) {
            await userManager.addAchievement('fifty_routines');
            newlyUnlocked.push('fifty_routines');
        }

        // Routine Century - 100 total routines
        if (user.totalRoutines >= 100 && !currentAchievements.includes('routine_century')) {
            await userManager.addAchievement('routine_century');
            newlyUnlocked.push('routine_century');
        }

        // ========== GAMES ==========

        // First Game - Complete first game
        if (user.totalGames >= 1 && !currentAchievements.includes('first_game')) {
            await userManager.addAchievement('first_game');
            newlyUnlocked.push('first_game');
        }

        // Game Sampler - Play 5 different game types
        const uniqueGameTypes = new Set();
        if (user.gameStats) {
            Object.keys(user.gameStats).forEach(gameKey => {
                uniqueGameTypes.add(gameKey);
            });
        }

        if (uniqueGameTypes.size >= 5 && !currentAchievements.includes('game_sampler')) {
            await userManager.addAchievement('game_sampler');
            newlyUnlocked.push('game_sampler');
        }

        // Game Master - Complete all 7 different game types
        if (uniqueGameTypes.size >= 7 && !currentAchievements.includes('game_master')) {
            await userManager.addAchievement('game_master');
            newlyUnlocked.push('game_master');
        }

        // Competitive Spirit - 25 total games
        if (user.totalGames >= 25 && !currentAchievements.includes('competitive_spirit')) {
            await userManager.addAchievement('competitive_spirit');
            newlyUnlocked.push('competitive_spirit');
        }

        // Game Legend - 50 total games
        if (user.totalGames >= 50 && !currentAchievements.includes('game_legend')) {
            await userManager.addAchievement('game_legend');
            newlyUnlocked.push('game_legend');
        }

        // Game Streak - Play 5 games in a row (within one week)
        const oneWeekAgoGames = new Date();
        oneWeekAgoGames.setDate(oneWeekAgoGames.getDate() - 7);
        const lastWeekGames = gameCompletions.filter(g => {
            const gameDate = new Date(g.timestamp || g.date);
            return gameDate >= oneWeekAgoGames;
        });
        if (lastWeekGames.length >= 5 && !currentAchievements.includes('game_streak')) {
            await userManager.addAchievement('game_streak');
            newlyUnlocked.push('game_streak');
        }

        // Note: Game-specific achievements (HORSE, Around the World, etc.)
        // are tracked via gameStats in the user model

        // ========== SOCIAL ==========

        // Squad Goals - 20 friends
        if (friends.length >= 20 && !currentAchievements.includes('squad_goals')) {
            await userManager.addAchievement('squad_goals');
            newlyUnlocked.push('squad_goals');
        }

        // Social Network - 50 friends
        if (friends.length >= 50 && !currentAchievements.includes('social_network')) {
            await userManager.addAchievement('social_network');
            newlyUnlocked.push('social_network');
        }

        // Top Five - Top 5 on leaderboard
        if (rank > 0 && rank <= 5 && !currentAchievements.includes('top_five')) {
            await userManager.addAchievement('top_five');
            newlyUnlocked.push('top_five');
        }

        // Top Twenty - Top 20 on leaderboard
        if (rank > 0 && rank <= 20 && !currentAchievements.includes('top_twenty')) {
            await userManager.addAchievement('top_twenty');
            newlyUnlocked.push('top_twenty');
        }

        // ========== VARIETY (Time-based, Weather, etc.) ==========

        // Golden Hour - Practice during golden hour (within 1 hour of sunrise/sunset)
        // Simplified: Practice between 6-7am or 6-7pm, 5 times
        const goldenHourSessions = sessions.filter(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            return (hour === 6 || hour === 18);
        });
        if (goldenHourSessions.length >= 5 && !currentAchievements.includes('golden_hour')) {
            await userManager.addAchievement('golden_hour');
            newlyUnlocked.push('golden_hour');
        }

        // Lunch Break Putter - Practice between 11am-1pm 10 times
        const lunchBreakSessions = sessions.filter(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            return hour >= 11 && hour < 13;
        });
        if (lunchBreakSessions.length >= 10 && !currentAchievements.includes('lunch_break_putter')) {
            await userManager.addAchievement('lunch_break_putter');
            newlyUnlocked.push('lunch_break_putter');
        }

        // Night Session - Practice between 10pm-12am
        const nightSession = sessions.find(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            return hour >= 22 || hour < 1;
        });
        if (nightSession && !currentAchievements.includes('night_session')) {
            await userManager.addAchievement('night_session');
            newlyUnlocked.push('night_session');
        }

        // Sunrise Session - Practice between 5-7am
        const sunriseSession = sessions.find(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            return hour >= 5 && hour < 7;
        });
        if (sunriseSession && !currentAchievements.includes('sunrise_session')) {
            await userManager.addAchievement('sunrise_session');
            newlyUnlocked.push('sunrise_session');
        }

        // Weekend Warrior - Practice on both weekend days in one weekend
        const weekendsByWeek = {};
        sessions.forEach(s => {
            const date = new Date(s.timestamp || s.date);
            const day = date.getDay();
            if (day === 0 || day === 6) {
                // Get week number
                const onejan = new Date(date.getFullYear(), 0, 1);
                const week = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
                const weekKey = `${date.getFullYear()}-W${week}`;
                weekendsByWeek[weekKey] = weekendsByWeek[weekKey] || new Set();
                weekendsByWeek[weekKey].add(day);
            }
        });
        const hasWeekendWarrior = Object.values(weekendsByWeek).some(days => days.size === 2);
        if (hasWeekendWarrior && !currentAchievements.includes('weekend_warrior')) {
            await userManager.addAchievement('weekend_warrior');
            newlyUnlocked.push('weekend_warrior');
        }

        // Weather Warrior - Practice in 5+ different weather conditions
        const weatherConditions = user.weatherConditions || [];
        if (weatherConditions.length >= 5 && !currentAchievements.includes('weather_warrior')) {
            await userManager.addAchievement('weather_warrior');
            newlyUnlocked.push('weather_warrior');
        }

        // Four Seasons - Practice in all 4 seasons
        const sessionMonths = sessions.map(s => new Date(s.timestamp || s.date).getMonth());
        const hasWinter = sessionMonths.some(m => m === 11 || m === 0 || m === 1);
        const hasSpring = sessionMonths.some(m => m === 2 || m === 3 || m === 4);
        const hasSummer = sessionMonths.some(m => m === 5 || m === 6 || m === 7);
        const hasFall = sessionMonths.some(m => m === 8 || m === 9 || m === 10);
        if (hasWinter && hasSpring && hasSummer && hasFall && !currentAchievements.includes('four_seasons')) {
            await userManager.addAchievement('four_seasons');
            newlyUnlocked.push('four_seasons');
        }

        // ========== DEDICATION ==========

        // Daily Grinder - Practice 365 total days
        if (uniqueDays.size >= 365 && !currentAchievements.includes('daily_grinder')) {
            await userManager.addAchievement('daily_grinder');
            newlyUnlocked.push('daily_grinder');
        }

        // Committed - Practice 20+ days in a month
        const monthSessions = {};
        sessions.forEach(s => {
            const date = new Date(s.timestamp || s.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthSessions[monthKey] = monthSessions[monthKey] || new Set();
            monthSessions[monthKey].add(date.getDate());
        });
        const hasCommitted = Object.values(monthSessions).some(days => days.size >= 20);
        // Note: This is for future "Dedication: Month" achievement
        
        // Committed - Account active for 30 days
        if (user.createdAt) {
            const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAge >= 30 && !currentAchievements.includes('committed')) {
                await userManager.addAchievement('committed');
                newlyUnlocked.push('committed');
            }
        }

        // Month Complete - Practice every single day in a calendar month
        const hasMonthComplete = Object.values(monthSessions).some(days => days.size >= 28);
        if (hasMonthComplete && !currentAchievements.includes('month_complete')) {
            await userManager.addAchievement('month_complete');
            newlyUnlocked.push('month_complete');
        }

        // Holiday Dedication - Practice on a major holiday
        const holidays = ['01-01', '07-04', '12-25']; // New Year, July 4, Christmas
        const holidaySession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return holidays.includes(monthDay);
        });
        if (holidaySession && !currentAchievements.includes('holiday_dedication')) {
            await userManager.addAchievement('holiday_dedication');
            newlyUnlocked.push('holiday_dedication');
        }

        // New Year Resolution - Practice on January 1st
        const newYearSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            return date.getMonth() === 0 && date.getDate() === 1;
        });
        if (newYearSession && !currentAchievements.includes('new_year_resolution')) {
            await userManager.addAchievement('new_year_resolution');
            newlyUnlocked.push('new_year_resolution');
        }

        // Birthday Putts - Practice on your birthday
        // NOTE: This should only check sessions from the current user's account creation onwards
        // The previous check could match sessions before account creation. MCP audit handles this properly.
        // if (user.birthday && sessions.length > 0) {
        //     const birthdayMonth = new Date(user.birthday).getMonth();
        //     const birthdayDay = new Date(user.birthday).getDate();
        //     const birthdaySession = sessions.find(s => {
        //         const date = new Date(s.timestamp || s.date);
        //         return date.getMonth() === birthdayMonth && date.getDate() === birthdayDay;
        //     });
        //     if (birthdaySession && !currentAchievements.includes('birthday_putts')) {
        //         await userManager.addAchievement('birthday_putts');
        //         newlyUnlocked.push('birthday_putts');
        //     }
        // }

        // ========== IMPROVEMENT & PROGRESS ==========

        // Personal Best - Beat your best session score
        // Simplified: Have a session with 150+ points
        const personalBest = sessions.find(s => s.points >= 150);
        if (personalBest && !currentAchievements.includes('personal_best')) {
            await userManager.addAchievement('personal_best');
            newlyUnlocked.push('personal_best');
        }

        // Personal Record - Set new accuracy record
        // Simplified: Achieve 95%+ accuracy
        const personalRecord = sessions.find(s => s.percentage >= 95);
        if (personalRecord && !currentAchievements.includes('personal_record')) {
            await userManager.addAchievement('personal_record');
            newlyUnlocked.push('personal_record');
        }

        // Accuracy Climb - Best accuracy 3 sessions in a row (each better than previous)
        // NOTE: This requires chronological session analysis - handled by MCP audit
        // The previous check (maxDiff >= 20) was incorrect
        // if (sessions.length >= 2) {
        //     const accuracies = sessions.map(s => s.percentage || 0);
        //     const maxDiff = Math.max(...accuracies) - Math.min(...accuracies);
        //     if (maxDiff >= 20 && !currentAchievements.includes('accuracy_climb')) {
        //         await userManager.addAchievement('accuracy_climb');
        //         newlyUnlocked.push('accuracy_climb');
        //     }
        // }

        // Distance Progression - Progress from 10ft to 40ft+ over time
        const has10ft = sessions.some(s => s.distance === 10);
        const has40ft = sessions.some(s => s.distance >= 40);
        if (has10ft && has40ft && !currentAchievements.includes('distance_progression')) {
            await userManager.addAchievement('distance_progression');
            newlyUnlocked.push('distance_progression');
        }

        // Volume Increase - Double your session volume
        // Simplified: Have sessions with 50+ and 100+ makes
        const has50Makes = sessions.some(s => s.makes >= 50);
        const has100Makes = sessions.some(s => s.makes >= 100);
        if (has50Makes && has100Makes && !currentAchievements.includes('volume_increase')) {
            await userManager.addAchievement('volume_increase');
            newlyUnlocked.push('volume_increase');
        }

        // Comeback Kid - Return to practice after a 30+ day gap between sessions
        if (!currentAchievements.includes('comeback_kid') && sessions.length >= 2) {
            const sortedForComeback = [...sessions].sort((a, b) =>
                new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
            );
            let hadComeback = false;
            for (let i = 1; i < sortedForComeback.length; i++) {
                const prev = new Date(sortedForComeback[i - 1].timestamp || sortedForComeback[i - 1].date);
                const curr = new Date(sortedForComeback[i].timestamp || sortedForComeback[i].date);
                const gapDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
                if (gapDays >= 30) { hadComeback = true; break; }
            }
            if (hadComeback) {
                await userManager.addAchievement('comeback_kid');
                newlyUnlocked.push('comeback_kid');
            }
        }

        // Points Surge - Earn 500+ points in one day
        const pointsByDay = {};
        sessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            pointsByDay[day] = (pointsByDay[day] || 0) + (s.points || 0);
        });
        const hasPointsSurge = Object.values(pointsByDay).some(points => points >= 500);
        if (hasPointsSurge && !currentAchievements.includes('points_surge')) {
            await userManager.addAchievement('points_surge');
            newlyUnlocked.push('points_surge');
        }

        // Points Doubler - Double your total points
        // Simplified: Reach 2000+ points
        if (user.totalPoints >= 2000 && !currentAchievements.includes('points_doubler')) {
            await userManager.addAchievement('points_doubler');
            newlyUnlocked.push('points_doubler');
        }

        // ========== SPECIAL CHALLENGES ==========

        // Marathon Session - Practice for 60+ minutes
        // Requires session duration tracking - check if available
        const marathonSession = sessions.find(s => s.duration >= 60);
        if (marathonSession && !currentAchievements.includes('marathon_session')) {
            await userManager.addAchievement('marathon_session');
            newlyUnlocked.push('marathon_session');
        }

        // Quick Session - Complete session in under 5 minutes with 10+ putts
        const quickSession = sessions.find(s => s.duration && s.duration <= 5 && s.attempts >= 10);
        if (quickSession && !currentAchievements.includes('quick_session')) {
            await userManager.addAchievement('quick_session');
            newlyUnlocked.push('quick_session');
        }

        // Double Trouble - Practice twice in one day (any activity type counts)
        // Count ALL activities per day (sessions + routines + games)
        const activitiesPerDay = {};
        sessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        routineCompletions.forEach(r => {
            const day = new Date(r.endTime || r.timestamp || r.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        gameCompletions.forEach(g => {
            const day = new Date(g.endTime || g.timestamp || g.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        const doubleDay = Object.values(activitiesPerDay).some(count => count >= 2);
        if (doubleDay && !currentAchievements.includes('double_trouble')) {
            await userManager.addAchievement('double_trouble');
            newlyUnlocked.push('double_trouble');
        }

        // Triple Play - 3 activities in one day
        const tripleDay = Object.values(activitiesPerDay).some(count => count >= 3);
        if (tripleDay && !currentAchievements.includes('triple_play')) {
            await userManager.addAchievement('triple_play');
            newlyUnlocked.push('triple_play');
        }

        // Consistency Builder - Complete Consistency Builder routine
        const consistencyBuilder = routineSessions.find(s =>
            s.routineName && s.routineName.toLowerCase().includes('consistency')
        );
        if (consistencyBuilder && !currentAchievements.includes('consistency_builder')) {
            await userManager.addAchievement('consistency_builder');
            newlyUnlocked.push('consistency_builder');
        }

        // Challenge Accepted - Complete a community challenge
        // Placeholder for future community challenge feature
        if (user.completedChallenges >= 1 && !currentAchievements.includes('challenge_accepted')) {
            await userManager.addAchievement('challenge_accepted');
            newlyUnlocked.push('challenge_accepted');
        }

        // Undefeated Week - Win every game in a week
        // Requires win/loss tracking - placeholder
        if (user.weeklyWins >= 5 && !currentAchievements.includes('undefeated_week')) {
            await userManager.addAchievement('undefeated_week');
            newlyUnlocked.push('undefeated_week');
        }

        // ========== SPECIAL (Community, Beta, etc.) ==========

        // Early Adopter - Join in first month of launch
        // Check if user created before Feb 2025
        if (user.createdAt) {
            const joinDate = new Date(user.createdAt);
            const launchDate = new Date('2025-01-01');
            const oneMonthLater = new Date('2025-02-01');
            if (joinDate >= launchDate && joinDate < oneMonthLater && !currentAchievements.includes('early_adopter')) {
                await userManager.addAchievement('early_adopter');
                newlyUnlocked.push('early_adopter');
            }
        }

        // Beta Tester - Participate in beta testing
        if (user.betaTester && !currentAchievements.includes('beta_tester')) {
            await userManager.addAchievement('beta_tester');
            newlyUnlocked.push('beta_tester');
        }

        // Bug Reporter - Report a bug
        if (user.communityStats?.bugReports >= 1 && !currentAchievements.includes('bug_reporter')) {
            await userManager.addAchievement('bug_reporter');
            newlyUnlocked.push('bug_reporter');
        }

        // Feature Requester - Request a feature
        if (user.communityStats?.featureRequests >= 1 && !currentAchievements.includes('feature_requester')) {
            await userManager.addAchievement('feature_requester');
            newlyUnlocked.push('feature_requester');
        }

        // Feedback Contributor - Provide feedback
        if (user.communityStats?.feedbackSubmissions >= 1 && !currentAchievements.includes('feedback_contributor')) {
            await userManager.addAchievement('feedback_contributor');
            newlyUnlocked.push('feedback_contributor');
        }

        // Community Leader - Help other players
        if (user.communityStats?.helpfulVotes >= 10 && !currentAchievements.includes('community_leader')) {
            await userManager.addAchievement('community_leader');
            newlyUnlocked.push('community_leader');
        }

        // Data Enthusiast - Export your data
        if (user.communityStats?.dataExports >= 10 && !currentAchievements.includes('data_enthusiast')) {
            await userManager.addAchievement('data_enthusiast');
            newlyUnlocked.push('data_enthusiast');
        }

        // Coach - Log for 10 different players
        // NOTE: Uses bulkLogStats.uniquePlayersLogged (unique players, not total sessions)
        // The bulk log achievements handler also checks this, so this is a backup
        if (user.bulkLogStats?.uniquePlayersLogged >= 10 && !currentAchievements.includes('coach')) {
            await userManager.addAchievement('coach');
            newlyUnlocked.push('coach');
        }

        // Team Player - Log for 5 different friends (handled by bulk log achievements)
        // NOTE: The correct check is in checkBulkLogAchievements with uniquePlayersLogged
        // if (user.communityStats?.multiplayerSessions >= 5 && !currentAchievements.includes('team_player')) {
        //     await userManager.addAchievement('team_player');
        //     newlyUnlocked.push('team_player');
        // }

        // ========== GAME-SPECIFIC ==========

        // HORSE achievements
        if (user.gameStats?.horse?.wins >= 3 && !currentAchievements.includes('horse_master')) {
            await userManager.addAchievement('horse_master');
            newlyUnlocked.push('horse_master');
        }

        if (user.gameStats?.horse?.wins >= 10 && !currentAchievements.includes('horse_warrior')) {
            await userManager.addAchievement('horse_warrior');
            newlyUnlocked.push('horse_warrior');
        }

        // Around the World achievements
        if (user.gameStats?.around_the_world?.under15Min >= 1 && !currentAchievements.includes('around_the_world_champ')) {
            await userManager.addAchievement('around_the_world_champ');
            newlyUnlocked.push('around_the_world_champ');
        }

        // Putt 100 achievements
        if (user.gameStats?.putt_100?.over80 >= 1 && !currentAchievements.includes('putt_100_master')) {
            await userManager.addAchievement('putt_100_master');
            newlyUnlocked.push('putt_100_master');
        }

        if (user.gameStats?.putt_100?.over90 >= 1 && !currentAchievements.includes('perfect_score')) {
            await userManager.addAchievement('perfect_score');
            newlyUnlocked.push('perfect_score');
        }

        // Distance Ladder achievements
        if (user.gameStats?.distance_ladder?.completions >= 1 && !currentAchievements.includes('distance_champion')) {
            await userManager.addAchievement('distance_champion');
            newlyUnlocked.push('distance_champion');
        }

        // Perfect Ten achievements
        if (user.gameStats?.perfect_ten?.perfectRuns >= 1 && !currentAchievements.includes('perfect_streak')) {
            await userManager.addAchievement('perfect_streak');
            newlyUnlocked.push('perfect_streak');
        }

        // Points Poker achievements
        if (user.gameStats?.points_poker?.over150 >= 1 && !currentAchievements.includes('poker_pro')) {
            await userManager.addAchievement('poker_pro');
            newlyUnlocked.push('poker_pro');
        }

        if (user.gameStats?.points_poker?.over200 >= 1 && !currentAchievements.includes('poker_king')) {
            await userManager.addAchievement('poker_king');
            newlyUnlocked.push('poker_king');
        }

        // Putting Par achievements
        if (user.gameStats?.putting_par?.parOrBetter >= 1 && !currentAchievements.includes('par_shooter')) {
            await userManager.addAchievement('par_shooter');
            newlyUnlocked.push('par_shooter');
        }

        // ========== COMPETITION ==========

        // Undefeated Week - Win 5+ games in one week
        if (user.competitiveStats?.weeklyWins >= 5 && !currentAchievements.includes('undefeated_week')) {
            await userManager.addAchievement('undefeated_week');
            newlyUnlocked.push('undefeated_week');
        }

        // Rising Star - Improve accuracy by 10% over 10 sessions
        // Requires at least 10 sessions and 10 percentage point improvement from first 5 to last 5
        if (sessions.length >= 10 && !currentAchievements.includes('rising_star')) {
            // Sort sessions by date
            const sortedSessions = [...sessions].sort((a, b) => 
                new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
            );
            
            // Get first 5 sessions average accuracy
            const first5 = sortedSessions.slice(0, 5);
            const firstAvg = first5.reduce((sum, s) => sum + (s.percentage || 0), 0) / 5;
            
            // Get last 5 sessions average accuracy
            const last5 = sortedSessions.slice(-5);
            const lastAvg = last5.reduce((sum, s) => sum + (s.percentage || 0), 0) / 5;
            
            // Check for 10 percentage point improvement (e.g., 60% -> 70%)
            if (lastAvg - firstAvg >= 10) {
                await userManager.addAchievement('rising_star');
                newlyUnlocked.push('rising_star');
            }
        }

        // Veteran - Account active for 90 days
        if (user.createdAt) {
            const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAge >= 90 && !currentAchievements.includes('veteran')) {
                await userManager.addAchievement('veteran');
                newlyUnlocked.push('veteran');
            }
        }

        // Legend - Account active for 365 days
        if (user.createdAt) {
            const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAge >= 365 && !currentAchievements.includes('legend')) {
                await userManager.addAchievement('legend');
                newlyUnlocked.push('legend');
            }
        }

        // First Competitor - Complete first H2H challenge
        // Check h2hCompleted count instead of multiplayerSessions
        if (user.h2hCompleted >= 1 && !currentAchievements.includes('first_competitor')) {
            await userManager.addAchievement('first_competitor');
            newlyUnlocked.push('first_competitor');
        }

        // Friendly Rivalry - Have 3+ friends using the app
        if (friends.length >= 3 && !currentAchievements.includes('friendly_rivalry')) {
            await userManager.addAchievement('friendly_rivalry');
            newlyUnlocked.push('friendly_rivalry');
        }

        // Underdog Victory - Improve rank by 10+ positions in one week
        // Both ranks must be real/positive to prevent spurious fires
        if (user.previousRank > 0 && rank > 0 &&
            user.previousRank - rank >= 10 && !currentAchievements.includes('underdog_victory')) {
            await userManager.addAchievement('underdog_victory');
            newlyUnlocked.push('underdog_victory');
        }

        // Store current rank for next check
        user.previousRank = rank;

        // Versatile Putter - Complete all 3 activity types (session + routine + game)
        const hasSessionActivity = sessions.length >= 1;
        const hasRoutineActivity = routineCompletions.length >= 1 || routineSessions.length >= 1;
        const hasGameActivity = gameCompletions.length >= 1 || (user.totalGames || 0) >= 1;
        if (hasSessionActivity && hasRoutineActivity && hasGameActivity && !currentAchievements.includes('versatile_putter')) {
            await userManager.addAchievement('versatile_putter');
            newlyUnlocked.push('versatile_putter');
        }

        // ========== NEW ACHIEVEMENTS v8.3.26 ==========

        // ===== SKILL-BASED =====

        // Sniper - Make 10 consecutive putts from 30+ feet (100% accuracy, 10+ makes)
        const sniperSession = sessions.find(s => s.distance >= 30 && s.makes >= 10 && s.percentage === 100);
        if (sniperSession && !currentAchievements.includes('sniper')) {
            await userManager.addAchievement('sniper');
            newlyUnlocked.push('sniper');
        }

        // Clutch Performer - 90%+ accuracy in a 25+ putt session from 20+ feet
        const clutchSession = sessions.find(s => s.distance >= 20 && s.attempts >= 25 && s.percentage >= 90);
        if (clutchSession && !currentAchievements.includes('clutch_performer')) {
            await userManager.addAchievement('clutch_performer');
            newlyUnlocked.push('clutch_performer');
        }

        // Range Finder - Practice from 5 different distances in one week
        const weekDistances = new Set();
        const oneWeekAgoRF = new Date();
        oneWeekAgoRF.setDate(oneWeekAgoRF.getDate() - 7);
        sessions.filter(s => new Date(s.timestamp || s.date) >= oneWeekAgoRF)
            .forEach(s => weekDistances.add(s.distance));
        if (weekDistances.size >= 5 && !currentAchievements.includes('range_finder')) {
            await userManager.addAchievement('range_finder');
            newlyUnlocked.push('range_finder');
        }

        // No Warm-Up Needed - 15+ makes at 100% accuracy (harder than Perfect 10's 10 makes)
        const noWarmupSession = sessions.find(s => s.makes >= 15 && s.percentage === 100);
        if (noWarmupSession && !currentAchievements.includes('no_warmup_needed')) {
            await userManager.addAchievement('no_warmup_needed');
            newlyUnlocked.push('no_warmup_needed');
        }

        // Finishing Strong - Complete 5 sessions with 90%+ accuracy
        const strongSessions = sessions.filter(s => s.percentage >= 90);
        if (strongSessions.length >= 5 && !currentAchievements.includes('finishing_strong')) {
            await userManager.addAchievement('finishing_strong');
            newlyUnlocked.push('finishing_strong');
        }

        // ===== STREAK & CONSISTENCY =====

        // Hump Day Hero - Practice on 4 Wednesdays in a month
        const wednesdaySessions = sessions.filter(s => {
            const date = new Date(s.timestamp || s.date);
            return date.getDay() === 3; // Wednesday
        });
        const wednesdayDays = new Set(wednesdaySessions.map(s => new Date(s.timestamp || s.date).toDateString()));
        if (wednesdayDays.size >= 4 && !currentAchievements.includes('hump_day_hero')) {
            await userManager.addAchievement('hump_day_hero');
            newlyUnlocked.push('hump_day_hero');
        }

        // Monday Motivation - Practice on 10 Mondays
        const mondaySessions = sessions.filter(s => {
            const date = new Date(s.timestamp || s.date);
            return date.getDay() === 1; // Monday
        });
        const mondayDays = new Set(mondaySessions.map(s => new Date(s.timestamp || s.date).toDateString()));
        if (mondayDays.size >= 10 && !currentAchievements.includes('monday_motivation')) {
            await userManager.addAchievement('monday_motivation');
            newlyUnlocked.push('monday_motivation');
        }

        // Streak Saver - 18 day streak (fills gap between 14 and 21)
        if (stats.longestStreak >= 18 && !currentAchievements.includes('streak_saver')) {
            await userManager.addAchievement('streak_saver');
            newlyUnlocked.push('streak_saver');
        }

        // Twice is Nice - Complete 2 activities in one day, 10 different days
        // Uses activitiesPerDay defined earlier (includes sessions + routines + games)
        const daysWithTwoPlus = Object.values(activitiesPerDay).filter(count => count >= 2).length;
        if (daysWithTwoPlus >= 10 && !currentAchievements.includes('twice_is_nice')) {
            await userManager.addAchievement('twice_is_nice');
            newlyUnlocked.push('twice_is_nice');
        }

        // Streak Builder - Achieve a 7+ day streak 3 different times (simplified: longest streak >= 21)
        if (stats.longestStreak >= 21 && !currentAchievements.includes('streak_builder')) {
            await userManager.addAchievement('streak_builder');
            newlyUnlocked.push('streak_builder');
        }

        // ===== GAME-SPECIFIC =====

        // Around the World Traveler - Complete Around the World 10 times
        const atwCount = gameCompletions.filter(g => 
            g.gameId === 'around_the_world' || g.gameName?.toLowerCase().includes('around the world')
        ).length;
        if (atwCount >= 10 && !currentAchievements.includes('atw_traveler')) {
            await userManager.addAchievement('atw_traveler');
            newlyUnlocked.push('atw_traveler');
        }

        // Ladder Master - Reach 50ft in Distance Ladder
        const ladderMax = gameCompletions
            .filter(g => g.gameId === 'distance_ladder' || g.gameName?.toLowerCase().includes('ladder'))
            .reduce((max, g) => Math.max(max, g.maxDistance || g.score || 0), 0);
        if (ladderMax >= 50 && !currentAchievements.includes('ladder_master')) {
            await userManager.addAchievement('ladder_master');
            newlyUnlocked.push('ladder_master');
        }

        // Perfect Ten Legend - Get 15+ streak in Perfect 10
        const perfectTenBest = gameCompletions
            .filter(g => g.gameId === 'perfect_10' || g.gameName?.toLowerCase().includes('perfect'))
            .reduce((max, g) => Math.max(max, g.streak || g.score || 0), 0);
        if (perfectTenBest >= 15 && !currentAchievements.includes('perfect_ten_legend')) {
            await userManager.addAchievement('perfect_ten_legend');
            newlyUnlocked.push('perfect_ten_legend');
        }

        // ===== PUTTING TOURNAMENT =====
        // Metadata written by the tournament scorer: placement, wins, losses.
        const tournaments = gameCompletions.filter(g =>
            g.gameId === 'putting_tournament' || g.metadata?.format === 'double_elimination'
        );
        const tourneyWins = tournaments.filter(g => (g.metadata?.placement ?? 0) === 1);

        // Bracket Debut - play in a tournament
        if (tournaments.length >= 1 && !currentAchievements.includes('bracket_debut')) {
            await userManager.addAchievement('bracket_debut');
            newlyUnlocked.push('bracket_debut');
        }

        // Tournament Champion - win a tournament
        if (tourneyWins.length >= 1 && !currentAchievements.includes('tournament_champion')) {
            await userManager.addAchievement('tournament_champion');
            newlyUnlocked.push('tournament_champion');
        }

        // Flawless Champion - win a tournament without losing a single match
        // (named distinctly: `flawless` is already declared above for the
        //  50-putt perfect session achievement)
        const tourneyFlawlessWin = tourneyWins.some(g => (g.metadata?.losses ?? 1) === 0);
        if (tourneyFlawlessWin && !currentAchievements.includes('flawless_champion')) {
            await userManager.addAchievement('flawless_champion');
            newlyUnlocked.push('flawless_champion');
        }

        // Bracket Survivor - win a tournament after losing a match (came back
        // through the losers bracket)
        const tourneyComebackWin = tourneyWins.some(g => (g.metadata?.losses ?? 0) >= 1);
        if (tourneyComebackWin && !currentAchievements.includes('bracket_survivor')) {
            await userManager.addAchievement('bracket_survivor');
            newlyUnlocked.push('bracket_survivor');
        }

        // Tournament Dynasty - win 5 tournaments
        if (tourneyWins.length >= 5 && !currentAchievements.includes('tournament_dynasty')) {
            await userManager.addAchievement('tournament_dynasty');
            newlyUnlocked.push('tournament_dynasty');
        }

        // Poker Face - Score 100+ in Points Poker 5 times
        const pokerOver100 = gameCompletions.filter(g => 
            (g.gameId === 'points_poker' || g.gameName?.toLowerCase().includes('poker')) && 
            (g.score || 0) >= 100
        ).length;
        if (pokerOver100 >= 5 && !currentAchievements.includes('poker_face')) {
            await userManager.addAchievement('poker_face');
            newlyUnlocked.push('poker_face');
        }

        // Joe's Regular - Play Joe's Putting League game 10 times
        const joesCount = gameCompletions.filter(g => 
            g.gameId === 'joes_21' || g.gameName?.toLowerCase().includes('joe')
        ).length;
        if (joesCount >= 10 && !currentAchievements.includes('joes_regular')) {
            await userManager.addAchievement('joes_regular');
            newlyUnlocked.push('joes_regular');
        }

        // Par Excellence - Shoot under par in Putting Par 3 times
        const parUnder = gameCompletions.filter(g => 
            (g.gameId === 'putting_par' || g.gameName?.toLowerCase().includes('par')) && 
            g.underPar === true
        ).length;
        if (parUnder >= 3 && !currentAchievements.includes('par_excellence')) {
            await userManager.addAchievement('par_excellence');
            newlyUnlocked.push('par_excellence');
        }

        // HORSE Whisperer - Win 5 games of HORSE
        const horseWins = gameCompletions.filter(g => 
            (g.gameId === 'horse' || g.gameName?.toLowerCase().includes('horse')) && 
            g.won === true
        ).length;
        if (horseWins >= 5 && !currentAchievements.includes('horse_whisperer')) {
            await userManager.addAchievement('horse_whisperer');
            newlyUnlocked.push('horse_whisperer');
        }

        // ===== ROUTINE-SPECIFIC =====

        // Routine Machine - Complete 5 routines in one day (harder than Routine Marathon's 3)
        const hasRoutineMachine = Object.values(routinesByDay).some(count => count >= 5);
        if (hasRoutineMachine && !currentAchievements.includes('routine_machine')) {
            await userManager.addAchievement('routine_machine');
            newlyUnlocked.push('routine_machine');
        }

        // Perfect Routine - Complete any routine at 95%+ accuracy
        const perfectRoutine = routineCompletions.find(r => {
            const accuracy = r.totalMakes && r.totalAttempts ? (r.totalMakes / r.totalAttempts) * 100 : 0;
            return accuracy >= 95;
        });
        if (perfectRoutine && !currentAchievements.includes('perfect_routine')) {
            await userManager.addAchievement('perfect_routine');
            newlyUnlocked.push('perfect_routine');
        }

        // Routine Speedster - Complete a routine in under 15 minutes
        const speedRoutine = routineCompletions.find(r => r.duration && r.duration < 15);
        if (speedRoutine && !currentAchievements.includes('routine_speedster')) {
            await userManager.addAchievement('routine_speedster');
            newlyUnlocked.push('routine_speedster');
        }

        // All-Rounder - Complete all 9 suggested routines
        const allRoutineNames = [
            'Beginner 10ft', 'Beginner Circle 1', 'Beginner Consistency',
            'Intermediate Mixed', 'Intermediate Pressure', 'Intermediate Comeback',
            'Advanced Ladder', 'Advanced Long Range', 'Advanced Tournament Prep'
        ];
        const completedRoutineNames = new Set([
            ...routineSessions.map(s => s.routineName),
            ...routineCompletions.map(r => r.routineName)
        ]);
        const hasAllRoutines = allRoutineNames.filter(name => 
            [...completedRoutineNames].some(completed => completed?.includes(name.split(' ')[0]))
        ).length >= 9;
        if (hasAllRoutines && !currentAchievements.includes('all_rounder')) {
            await userManager.addAchievement('all_rounder');
            newlyUnlocked.push('all_rounder');
        }

        // ===== WEATHER & CONDITIONS =====

        // Heat Wave - Practice when temperature is 100°F+
        const heatWaveSession = sessions.find(s => s.weather?.temperature >= 100);
        if (heatWaveSession && !currentAchievements.includes('heat_wave')) {
            await userManager.addAchievement('heat_wave');
            newlyUnlocked.push('heat_wave');
        }

        // Cold Blooded - Practice when temperature is below 50°F
        const coldSession = sessions.find(s => s.weather?.temperature && s.weather.temperature < 50);
        if (coldSession && !currentAchievements.includes('cold_blooded')) {
            await userManager.addAchievement('cold_blooded');
            newlyUnlocked.push('cold_blooded');
        }

        // Wind Warrior - Practice in 15+ mph winds
        const windySession = sessions.find(s => s.weather?.windSpeed >= 15);
        if (windySession && !currentAchievements.includes('wind_warrior')) {
            await userManager.addAchievement('wind_warrior');
            newlyUnlocked.push('wind_warrior');
        }

        // Rain or Shine - Practice in rainy conditions
        const rainySession = sessions.find(s => 
            s.weather?.condition?.toLowerCase().includes('rain') ||
            s.weather?.condition?.toLowerCase().includes('drizzle')
        );
        if (rainySession && !currentAchievements.includes('rain_or_shine')) {
            await userManager.addAchievement('rain_or_shine');
            newlyUnlocked.push('rain_or_shine');
        }

        // Desert Rat - Practice 10 times in hot weather (90°F+) - Arizona themed!
        const hotWeatherSessions = sessions.filter(s => s.weather?.temperature >= 90);
        if (hotWeatherSessions.length >= 10 && !currentAchievements.includes('desert_rat')) {
            await userManager.addAchievement('desert_rat');
            newlyUnlocked.push('desert_rat');
        }

        // ===== SOCIAL & MULTIPLAYER =====

        // Party Host - Log a multiplayer session with 4+ players
        // Check if any bulk log had 4+ players
        if (user.maxMultiplayerSize >= 4 && !currentAchievements.includes('party_host')) {
            await userManager.addAchievement('party_host');
            newlyUnlocked.push('party_host');
        }

        // Generous Logger - Log 50 activities for other players
        const loggedForOthers = sessions.filter(s => s.loggedBy && s.loggedBy !== user.id).length +
                               routineCompletions.filter(r => r.loggedBy && r.loggedBy !== user.id).length +
                               gameCompletions.filter(g => g.loggedBy && g.loggedBy !== user.id).length;
        if (user.activitiesLoggedForOthers >= 50 && !currentAchievements.includes('generous_logger')) {
            await userManager.addAchievement('generous_logger');
            newlyUnlocked.push('generous_logger');
        }

        // Rivalry - Complete 10 H2H challenges
        if (user.h2hChallengesCompleted >= 10 && !currentAchievements.includes('rivalry')) {
            await userManager.addAchievement('rivalry');
            newlyUnlocked.push('rivalry');
        }

        // Challenge Champion - Win 10 H2H challenges
        if (user.h2hChallengesWon >= 10 && !currentAchievements.includes('challenge_champion')) {
            await userManager.addAchievement('challenge_champion');
            newlyUnlocked.push('challenge_champion');
        }

        // Social Scorer - Have 10 friends on the app
        if (friends.length >= 10 && !currentAchievements.includes('social_scorer')) {
            await userManager.addAchievement('social_scorer');
            newlyUnlocked.push('social_scorer');
        }

        // ===== STATS & MILESTONES =====

        // 50K Club - Reach 50,000 total points
        if (user.totalPoints >= 50000 && !currentAchievements.includes('fifty_k_club')) {
            await userManager.addAchievement('fifty_k_club');
            newlyUnlocked.push('fifty_k_club');
        }

        // 100K Legend - Reach 100,000 total points
        if (user.totalPoints >= 100000 && !currentAchievements.includes('hundred_k_legend')) {
            await userManager.addAchievement('hundred_k_legend');
            newlyUnlocked.push('hundred_k_legend');
        }

        // 25K Makes - Make 25,000 total putts
        if (totalMakes >= 25000 && !currentAchievements.includes('twenty_five_k_makes')) {
            await userManager.addAchievement('twenty_five_k_makes');
            newlyUnlocked.push('twenty_five_k_makes');
        }

        // Hour Logger - Log 100 hours of practice time
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        if (totalMinutes >= 6000 && !currentAchievements.includes('hour_logger')) { // 100 hours = 6000 minutes
            await userManager.addAchievement('hour_logger');
            newlyUnlocked.push('hour_logger');
        }

        // Distance Traveler - Cumulative putting distance of 1 mile (5280 feet)
        const totalDistance = sessions.reduce((sum, s) => sum + ((s.distance || 0) * (s.attempts || 0)), 0);
        if (totalDistance >= 5280 && !currentAchievements.includes('distance_traveler')) {
            await userManager.addAchievement('distance_traveler');
            newlyUnlocked.push('distance_traveler');
        }

        // ===== FUN & QUIRKY =====

        // Lucky 7 - Log a session with exactly 77% accuracy
        const lucky7Session = sessions.find(s => Math.round(s.percentage) === 77);
        if (lucky7Session && !currentAchievements.includes('lucky_seven')) {
            await userManager.addAchievement('lucky_seven');
            newlyUnlocked.push('lucky_seven');
        }

        // Nice - Score exactly 69 points in a session
        const niceSession = sessions.find(s => s.points === 69);
        if (niceSession && !currentAchievements.includes('nice')) {
            await userManager.addAchievement('nice');
            newlyUnlocked.push('nice');
        }

        // Century Match - Make exactly 100 putts at 100% accuracy
        const centuryMatchSession = sessions.find(s => s.makes === 100 && s.percentage === 100);
        if (centuryMatchSession && !currentAchievements.includes('century_match')) {
            await userManager.addAchievement('century_match');
            newlyUnlocked.push('century_match');
        }

        // Palindrome - Log a session at 11:11 AM or PM
        const palindromeSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            return (hours === 11 || hours === 23) && minutes === 11;
        });
        if (palindromeSession && !currentAchievements.includes('palindrome')) {
            await userManager.addAchievement('palindrome');
            newlyUnlocked.push('palindrome');
        }

        // Full Moon Putter - Practice during a full moon phase
        // Simplified: Check if any session was during days 14-16 of lunar cycle
        const fullMoonSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            // Approximate lunar phase calculation (full moon ~every 29.5 days)
            const lunationNumber = (date.getTime() - new Date('2000-01-06').getTime()) / (29.530588853 * 24 * 60 * 60 * 1000);
            const phase = (lunationNumber % 1) * 29.5;
            return phase >= 13 && phase <= 16; // Full moon window
        });
        if (fullMoonSession && !currentAchievements.includes('full_moon_putter')) {
            await userManager.addAchievement('full_moon_putter');
            newlyUnlocked.push('full_moon_putter');
        }

        // ===== SEASON & COMPETITION =====

        // Season Starter - Earn XP on first day of a season
        const seasonStartDays = ['01-01', '04-01', '07-01', '10-01']; // Q1-Q4 start dates
        const seasonStartSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return seasonStartDays.includes(monthDay);
        });
        if (seasonStartSession && !currentAchievements.includes('season_starter')) {
            await userManager.addAchievement('season_starter');
            newlyUnlocked.push('season_starter');
        }

        // Season Finisher - Earn XP on last day of a season
        const seasonEndDays = ['03-31', '06-30', '09-30', '12-31']; // Q1-Q4 end dates
        const seasonEndSession = sessions.find(s => {
            const date = new Date(s.timestamp || s.date);
            const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return seasonEndDays.includes(monthDay);
        });
        if (seasonEndSession && !currentAchievements.includes('season_finisher')) {
            await userManager.addAchievement('season_finisher');
            newlyUnlocked.push('season_finisher');
        }

        // Level 10 - Reach Season Level 10
        const seasonLevel = user.seasonXp ? Math.floor(user.seasonXp / 500) + 1 : 1;
        if (seasonLevel >= 10 && !currentAchievements.includes('level_10')) {
            await userManager.addAchievement('level_10');
            newlyUnlocked.push('level_10');
        }

        // Level 25 - Reach Season Level 25
        if (seasonLevel >= 25 && !currentAchievements.includes('level_25')) {
            await userManager.addAchievement('level_25');
            newlyUnlocked.push('level_25');
        }

        // Max Level - Reach Season Level 50
        if (seasonLevel >= 50 && !currentAchievements.includes('max_level')) {
            await userManager.addAchievement('max_level');
            newlyUnlocked.push('max_level');
        }

        if (newlyUnlocked.length > 0) {
            console.log('🏆 New achievements unlocked:', newlyUnlocked);
        }

        // Save user with updated previousRank for future rank comparison
        if (user.previousRank !== undefined) {
            await storageManager.saveUser(user);
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

    /**
     * Revalidate achievements after activity deletion
     * Checks if user still qualifies for each achievement they have
     * @param {Array} routines - Current routine completions
     * @param {Array} games - Current game completions
     * @returns {Promise<Array>} List of revoked achievement IDs
     */
    async revalidateAchievements(routines = [], games = []) {
        const user = userManager.getCurrentUser();
        if (!user) return [];

        const sessions = userManager.sessions || [];
        const stats = userManager.getStatistics();
        const currentAchievements = user.achievements || [];
        const revokedAchievements = [];

        const routineCompletions = routines || [];
        const gameCompletions = games || [];
        const routineSessions = sessions.filter(s => s.routineName);
        const allRoutineActivity = [...routineSessions, ...routineCompletions];

        // Helper to check and revoke
        const checkAndRevoke = async (achievementId, isStillValid) => {
            // Sticky achievements are earned once and never taken away. A failed
            // re-check just means current data can no longer prove the moment
            // (session deleted/edited, timestamp not re-derivable) — not that the
            // user never earned it. Only live, user-reversible state is revocable.
            if (isStickyAchievement(achievementId)) return;

            if (currentAchievements.includes(achievementId) && !isStillValid) {
                await userManager.removeAchievement(achievementId);
                revokedAchievements.push(achievementId);
            }
        };

        // ==================== GETTING STARTED ====================
        await checkAndRevoke('first_steps', sessions.length >= 1);
        
        // Get unique practice days
        const uniqueDays = new Set(sessions.map(s => {
            const date = new Date(s.timestamp || s.date);
            return date.toDateString();
        }));
        await checkAndRevoke('first_week', uniqueDays.size >= 7);

        // ==================== ACCURACY ====================
        await checkAndRevoke('eighty_percent_pro', sessions.some(s => s.percentage >= 80));
        await checkAndRevoke('ninety_percent_club', sessions.some(s => s.percentage >= 90));
        await checkAndRevoke('perfect_10', sessions.some(s => s.makes >= 10 && s.percentage === 100));
        await checkAndRevoke('no_warmup_needed', sessions.some(s => s.makes >= 15 && s.percentage === 100));
        await checkAndRevoke('flawless', sessions.some(s => s.makes >= 50 && s.percentage === 100));
        await checkAndRevoke('sharpshooter', sessions.some(s => s.distance >= 20 && s.percentage >= 95));
        await checkAndRevoke('laser_focus', sessions.some(s => s.distance >= 25 && s.percentage >= 90));
        await checkAndRevoke('deadeye', sessions.some(s => s.attempts >= 25 && s.percentage >= 98));
        await checkAndRevoke('sniper', sessions.some(s => s.distance >= 30 && s.makes >= 10 && s.percentage === 100));
        await checkAndRevoke('clutch_performer', sessions.some(s => s.distance >= 20 && s.attempts >= 25 && s.percentage >= 90));
        await checkAndRevoke('personal_record', sessions.some(s => s.percentage >= 95));
        
        // Consistent Accuracy - 85%+ average over 10 sessions
        if (sessions.length >= 10) {
            const last10 = sessions.slice(0, 10);
            const avgAccuracy = last10.reduce((sum, s) => sum + (s.percentage || 0), 0) / 10;
            await checkAndRevoke('consistent_accuracy', avgAccuracy >= 85);
        } else {
            await checkAndRevoke('consistent_accuracy', false);
        }
        
        // Finishing Strong - 5 sessions with 90%+ accuracy
        const strongSessions = sessions.filter(s => s.percentage >= 90);
        await checkAndRevoke('finishing_strong', strongSessions.length >= 5);

        // Rising Star - Improve accuracy by 10 percentage points over 10 sessions
        if (sessions.length >= 10) {
            const sortedSessions = [...sessions].sort((a, b) => 
                new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
            );
            const first5 = sortedSessions.slice(0, 5);
            const firstAvg = first5.reduce((sum, s) => sum + (s.percentage || 0), 0) / 5;
            const last5 = sortedSessions.slice(-5);
            const lastAvg = last5.reduce((sum, s) => sum + (s.percentage || 0), 0) / 5;
            await checkAndRevoke('rising_star', lastAvg - firstAvg >= 10);
        } else {
            await checkAndRevoke('rising_star', false);
        }

        // ==================== STREAKS ====================
        await checkAndRevoke('three_day_starter', stats.longestStreak >= 3);
        await checkAndRevoke('week_warrior', stats.longestStreak >= 7);
        await checkAndRevoke('two_week_streak', stats.longestStreak >= 14);
        await checkAndRevoke('streak_saver', stats.longestStreak >= 18);
        await checkAndRevoke('streak_builder', stats.longestStreak >= 21);
        await checkAndRevoke('month_master', stats.longestStreak >= 30);
        await checkAndRevoke('iron_will', stats.longestStreak >= 60);
        await checkAndRevoke('quarter_year', stats.longestStreak >= 90);
        await checkAndRevoke('unstoppable', stats.longestStreak >= 100);

        // ==================== POINTS - SESSION ====================
        await checkAndRevoke('quick_start', sessions.some(s => s.points >= 25));
        await checkAndRevoke('century_club', sessions.some(s => s.points >= 100));
        await checkAndRevoke('personal_best', sessions.some(s => s.points >= 150));
        await checkAndRevoke('double_century', sessions.some(s => s.points >= 200));
        await checkAndRevoke('triple_threat', sessions.some(s => s.points >= 300));
        
        // Points Surge - 500+ points in one day
        const pointsByDay = {};
        sessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            pointsByDay[day] = (pointsByDay[day] || 0) + (s.points || 0);
        });
        await checkAndRevoke('points_surge', Object.values(pointsByDay).some(pts => pts >= 500));

        // ==================== POINTS - TOTAL ====================
        await checkAndRevoke('point_king', user.totalPoints >= 1000);
        await checkAndRevoke('points_doubler', user.totalPoints >= 2000);
        await checkAndRevoke('point_legend', user.totalPoints >= 5000);
        await checkAndRevoke('point_millionaire', user.totalPoints >= 10000);
        await checkAndRevoke('point_titan', user.totalPoints >= 25000);
        await checkAndRevoke('fifty_k_club', user.totalPoints >= 50000);
        await checkAndRevoke('hundred_k_legend', user.totalPoints >= 100000);

        // ==================== SESSIONS ====================
        await checkAndRevoke('half_century', sessions.length >= 50);
        await checkAndRevoke('centurion', sessions.length >= 100);
        await checkAndRevoke('session_veteran', sessions.length >= 250);
        await checkAndRevoke('session_legend', sessions.length >= 500);
        
        // Activities per day (sessions + routines + games)
        const activitiesPerDay = {};
        sessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        routineCompletions.forEach(r => {
            const day = new Date(r.endTime || r.timestamp || r.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        gameCompletions.forEach(g => {
            const day = new Date(g.endTime || g.timestamp || g.date).toDateString();
            activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
        });
        await checkAndRevoke('double_trouble', Object.values(activitiesPerDay).some(count => count >= 2));
        await checkAndRevoke('triple_play', Object.values(activitiesPerDay).some(count => count >= 3));
        
        // 10 sessions in one week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const lastWeekSessions = sessions.filter(s => new Date(s.timestamp || s.date) >= oneWeekAgo);
        await checkAndRevoke('ten_sessions_week', lastWeekSessions.length >= 10);
        
        // Days with 2+ activities
        const daysWithTwoPlus = Object.values(activitiesPerDay).filter(count => count >= 2).length;
        await checkAndRevoke('twice_is_nice', daysWithTwoPlus >= 10);

        // ==================== DISTANCE ====================
        await checkAndRevoke('baby_steps', sessions.some(s => s.distance >= 5 && s.distance <= 10));
        await checkAndRevoke('long_ranger', sessions.some(s => s.distance >= 30));
        await checkAndRevoke('distance_demon', sessions.some(s => s.distance >= 40 && s.makes >= 5));
        await checkAndRevoke('downtown_driver', sessions.some(s => s.distance >= 50 && s.makes >= 1));
        await checkAndRevoke('extreme_range', sessions.some(s => s.distance >= 60 && s.makes >= 3));
        await checkAndRevoke('ultra_range', sessions.some(s => s.distance >= 70 && s.makes >= 1));
        await checkAndRevoke('mid_range_master', sessions.some(s => s.distance >= 20 && s.distance <= 25 && s.makes >= 20));
        
        // Distance Explorer - 10 different distances
        const uniqueDistances = new Set(sessions.map(s => s.distance));
        await checkAndRevoke('distance_explorer', uniqueDistances.size >= 10);
        
        // All Ranges - 10, 20, 30, 40, 50
        const requiredDistances = [10, 20, 30, 40, 50];
        await checkAndRevoke('all_ranges', requiredDistances.every(d => sessions.some(s => s.distance === d)));
        
        // Distance Variety - 15, 20, 25, 30
        const varietyDistances = [15, 20, 25, 30];
        await checkAndRevoke('distance_variety', varietyDistances.every(d => sessions.some(s => s.distance === d && s.makes >= 1)));
        
        // Graduated Distances - 10, 15, 20, 25, 30, 35, 40, 45, 50
        const graduatedDists = [10, 15, 20, 25, 30, 35, 40, 45, 50];
        await checkAndRevoke('graduated_distances', graduatedDists.every(d => sessions.some(s => s.distance === d)));
        
        // Distance Progression - 10ft and 40ft+
        const has10ft = sessions.some(s => s.distance === 10);
        const has40ft = sessions.some(s => s.distance >= 40);
        await checkAndRevoke('distance_progression', has10ft && has40ft);

        // ==================== VOLUME - SESSION ====================
        await checkAndRevoke('fifty_club', sessions.some(s => s.makes >= 50));
        await checkAndRevoke('hundred_club', sessions.some(s => s.makes >= 100));
        await checkAndRevoke('two_hundred_club', sessions.some(s => s.makes >= 200));
        await checkAndRevoke('three_hundred_club', sessions.some(s => s.makes >= 300));
        await checkAndRevoke('five_hundred_club', sessions.some(s => s.makes >= 500));
        await checkAndRevoke('marathon_putter', sessions.some(s => s.attempts >= 500));
        await checkAndRevoke('iron_man', sessions.some(s => s.attempts >= 1000));
        
        // Daily Hundred - 100+ makes in one day
        const makesByDay = {};
        sessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            makesByDay[day] = (makesByDay[day] || 0) + (s.makes || 0);
        });
        await checkAndRevoke('daily_hundred', Object.values(makesByDay).some(makes => makes >= 100));

        // ==================== VOLUME - TOTAL ====================
        const totalMakes = user.totalMakes || sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
        await checkAndRevoke('total_makes_1000', totalMakes >= 1000);
        await checkAndRevoke('total_makes_5000', totalMakes >= 5000);
        await checkAndRevoke('total_makes_10000', totalMakes >= 10000);
        await checkAndRevoke('twenty_five_k_makes', totalMakes >= 25000);
        
        // Volume Increase - 50+ and 100+ makes
        const has50Makes = sessions.some(s => s.makes >= 50);
        const has100Makes = sessions.some(s => s.makes >= 100);
        await checkAndRevoke('volume_increase', has50Makes && has100Makes);

        // Comeback Kid - revalidate: did the user ever have a 30+ day gap?
        if (currentAchievements.includes('comeback_kid') && sessions.length >= 2) {
            const sortedForComeback = [...sessions].sort((a, b) =>
                new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
            );
            let hadGap = false;
            for (let i = 1; i < sortedForComeback.length; i++) {
                const prev = new Date(sortedForComeback[i - 1].timestamp || sortedForComeback[i - 1].date);
                const curr = new Date(sortedForComeback[i].timestamp || sortedForComeback[i].date);
                if (Math.floor((curr - prev) / (1000 * 60 * 60 * 24)) >= 30) { hadGap = true; break; }
            }
            await checkAndRevoke('comeback_kid', hadGap);
        }

        // Versatile Putter - revalidate: must have session + routine + game
        const hasSessionActivity2 = sessions.length >= 1;
        const hasRoutineActivity2 = routineCompletions.length >= 1 || routineSessions.length >= 1;
        const hasGameActivity2 = gameCompletions.length >= 1 || (user.totalGames || 0) >= 1;
        await checkAndRevoke('versatile_putter', hasSessionActivity2 && hasRoutineActivity2 && hasGameActivity2);

        // ==================== ROUTINES ====================
        await checkAndRevoke('routine_rookie', allRoutineActivity.length >= 1);
        
        const uniqueRoutineNames = new Set([
            ...routineSessions.map(s => s.routineName),
            ...routineCompletions.map(r => r.routineName)
        ]);
        await checkAndRevoke('routine_regular', uniqueRoutineNames.size >= 5);
        await checkAndRevoke('routine_completionist', uniqueRoutineNames.size >= 10);
        
        await checkAndRevoke('routine_addict', user.totalRoutines >= 25);
        await checkAndRevoke('fifty_routines', user.totalRoutines >= 50);
        await checkAndRevoke('routine_century', user.totalRoutines >= 100);
        
        // Routine Master - all 4 built-in routines
        const builtInRoutines = ['Beginner 10ft', 'Intermediate Mixed', 'Advanced Ladder', 'Consistency Builder'];
        const completedAllBuiltIn = builtInRoutines.every(name =>
            routineSessions.some(s => s.routineName === name) ||
            routineCompletions.some(r => r.routineName === name)
        );
        await checkAndRevoke('routine_master', completedAllBuiltIn);
        
        // Ladder Climber - Advanced Ladder
        const ladderSession = routineSessions.find(s => s.routineName === 'Advanced Ladder') ||
                             routineCompletions.find(r => r.routineName === 'Advanced Ladder');
        await checkAndRevoke('ladder_climber', !!ladderSession);
        
        // Consistency King - Consistency Builder 3x
        const consistencyCount = routineSessions.filter(s => s.routineName === 'Consistency Builder').length +
                                routineCompletions.filter(r => r.routineName === 'Consistency Builder').length;
        await checkAndRevoke('consistency_king', consistencyCount >= 3);
        
        // Consistency Builder achievement
        const consistencyBuilder = routineSessions.find(s => s.routineName?.toLowerCase().includes('consistency')) ||
                                  routineCompletions.find(r => r.routineName?.toLowerCase().includes('consistency'));
        await checkAndRevoke('consistency_builder', !!consistencyBuilder);
        
        // Routine Specialist - same routine 10 times
        const routineCounts = {};
        routineSessions.forEach(s => { routineCounts[s.routineName] = (routineCounts[s.routineName] || 0) + 1; });
        routineCompletions.forEach(r => { routineCounts[r.routineName] = (routineCounts[r.routineName] || 0) + 1; });
        await checkAndRevoke('routine_specialist', Object.values(routineCounts).some(count => count >= 10));
        
        // Routines per day
        const routinesByDay = {};
        routineSessions.forEach(s => {
            const day = new Date(s.timestamp || s.date).toDateString();
            routinesByDay[day] = (routinesByDay[day] || 0) + 1;
        });
        routineCompletions.forEach(r => {
            const day = new Date(r.timestamp || r.date || r.endTime).toDateString();
            routinesByDay[day] = (routinesByDay[day] || 0) + 1;
        });
        await checkAndRevoke('routine_marathon', Object.values(routinesByDay).some(count => count >= 3));
        await checkAndRevoke('routine_machine', Object.values(routinesByDay).some(count => count >= 5));

        // ==================== GAMES ====================
        await checkAndRevoke('first_game', user.totalGames >= 1);
        await checkAndRevoke('game_on', user.totalGames >= 1);
        await checkAndRevoke('game_enthusiast', user.totalGames >= 10);
        await checkAndRevoke('competitive_spirit', user.totalGames >= 25);
        await checkAndRevoke('game_legend', user.totalGames >= 50);
        
        // Game Sampler - 5 different game types
        const uniqueGameTypes = new Set();
        if (user.gameStats) {
            Object.keys(user.gameStats).forEach(gameKey => uniqueGameTypes.add(gameKey));
        }
        await checkAndRevoke('game_sampler', uniqueGameTypes.size >= 5);
        await checkAndRevoke('game_master', uniqueGameTypes.size >= 7);
        
        // Games in one week
        const lastWeekGames = gameCompletions.filter(g => new Date(g.timestamp || g.date || g.endTime) >= oneWeekAgo);
        await checkAndRevoke('game_streak', lastWeekGames.length >= 5);

        // ==================== SEASON ====================
        const seasonLevel = user.seasonXp ? Math.floor(user.seasonXp / 500) + 1 : 1;
        await checkAndRevoke('level_10', seasonLevel >= 10);
        await checkAndRevoke('level_25', seasonLevel >= 25);
        await checkAndRevoke('max_level', seasonLevel >= 50);

        // ==================== H2H / CHALLENGES ====================
        await checkAndRevoke('rivalry', (user.h2hChallengesCompleted || 0) >= 10);
        await checkAndRevoke('challenge_champion', (user.h2hChallengesWon || 0) >= 10);

        // ==================== TIME-BASED (can be revalidated) ====================
        // Build all activity timestamps for time-based checks
        const allActivityTimes = [
            ...sessions.map(s => new Date(s.timestamp || s.date)),
            ...routineCompletions.map(r => new Date(r.endTime || r.timestamp || r.date)),
            ...gameCompletions.map(g => new Date(g.endTime || g.timestamp || g.date))
        ];
        // Early Bird - before 8am
        await checkAndRevoke('early_bird', allActivityTimes.some(d => d.getHours() < 8));
        // Night Owl - after 8pm
        await checkAndRevoke('night_owl', allActivityTimes.some(d => d.getHours() >= 20));
        // Morning Person - 5 times before noon
        const morningPractice = allActivityTimes.filter(d => d.getHours() < 12);
        await checkAndRevoke('morning_person', morningPractice.length >= 5);
        // Afternoon Delight - 5 times 12pm-5pm
        const afternoonPractice = allActivityTimes.filter(d => {
            const hour = d.getHours();
            return hour >= 12 && hour < 17;
        });
        await checkAndRevoke('afternoon_delight', afternoonPractice.length >= 5);
        // Night Session - 10pm-12am
        await checkAndRevoke('night_session', allActivityTimes.some(d => {
            const hour = d.getHours();
            return hour >= 22 || hour < 1;
        }));
        // Sunrise Session - 5-7am
        await checkAndRevoke('sunrise_session', allActivityTimes.some(d => {
            const hour = d.getHours();
            return hour >= 5 && hour < 7;
        }));
        // Lunch Break Putter - 10 times 11am-1pm
        const lunchSessions = allActivityTimes.filter(d => {
            const hour = d.getHours();
            return hour >= 11 && hour < 13;
        });
        await checkAndRevoke('lunch_break_putter', lunchSessions.length >= 10);
        // Golden Hour - 5 times at 6am or 6pm
        const goldenHourSessions = allActivityTimes.filter(d => {
            const hour = d.getHours();
            return hour === 6 || hour === 18;
        });
        await checkAndRevoke('golden_hour', goldenHourSessions.length >= 5);

        // ==================== DAY-OF-WEEK ACHIEVEMENTS ====================
        // Hump Day Hero - 4 Wednesdays (any activity)
        const wednesdayDays = new Set(allActivityTimes.filter(d => d.getDay() === 3)
            .map(d => d.toDateString()));
        await checkAndRevoke('hump_day_hero', wednesdayDays.size >= 4);
        // Monday Motivation - 10 Mondays (any activity)
        const mondayDays = new Set(allActivityTimes.filter(d => d.getDay() === 1)
            .map(d => d.toDateString()));
        await checkAndRevoke('monday_motivation', mondayDays.size >= 10);
        // Weekend Warrior - both weekend days in one weekend (any activity)
        const weekendsByWeek = {};
        allActivityTimes.forEach(date => {
            const day = date.getDay();
            if (day === 0 || day === 6) {
                const onejan = new Date(date.getFullYear(), 0, 1);
                const week = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
                const weekKey = `${date.getFullYear()}-W${week}`;
                weekendsByWeek[weekKey] = weekendsByWeek[weekKey] || new Set();
                weekendsByWeek[weekKey].add(day);
            }
        });
        await checkAndRevoke('weekend_warrior', Object.values(weekendsByWeek).some(days => days.size === 2));
        // Weekend Streak - 8+ weekend days in 30 days (any activity)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentWeekendDays = new Set(allActivityTimes.filter(d => {
            const day = d.getDay();
            return (day === 0 || day === 6) && d >= thirtyDaysAgo;
        }).map(d => d.toDateString()));
        await checkAndRevoke('weekend_streak', recentWeekendDays.size >= 8);

        // ==================== SEASONAL ====================
        const sessionMonths = sessions.map(s => new Date(s.timestamp || s.date).getMonth());
        const hasWinter = sessionMonths.some(m => m === 11 || m === 0 || m === 1);
        const hasSpring = sessionMonths.some(m => m === 2 || m === 3 || m === 4);
        const hasSummer = sessionMonths.some(m => m === 5 || m === 6 || m === 7);
        const hasFall = sessionMonths.some(m => m === 8 || m === 9 || m === 10);
        await checkAndRevoke('four_seasons', hasWinter && hasSpring && hasSummer && hasFall);

        // ==================== DEDICATION ====================
        await checkAndRevoke('daily_grinder', uniqueDays.size >= 365);
        // Month Complete - 28+ days in one month
        const monthSessions = {};
        sessions.forEach(s => {
            const date = new Date(s.timestamp || s.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthSessions[monthKey] = monthSessions[monthKey] || new Set();
            monthSessions[monthKey].add(date.getDate());
        });
        await checkAndRevoke('month_complete', Object.values(monthSessions).some(days => days.size >= 28));

        // ==================== LEADERBOARD (Hidden Users Only) ====================
        // If user is hidden from leaderboard, revoke all leaderboard achievements
        if (user.hideFromLeaderboard) {
            await checkAndRevoke('podium_finish', false);
            await checkAndRevoke('top_five', false);
            await checkAndRevoke('top_ten', false);
            await checkAndRevoke('top_twenty', false);
            await checkAndRevoke('number_one', false);
        }

        // NOTE: The following achievement categories are NOT revalidated because they depend on
        // external factors that shouldn't be revoked when activities are deleted:
        // - Social achievements (friends)
        // - Account age achievements (committed, veteran, legend)
        // - Profile achievements (disc_collector, profile_complete)
        // - Community achievements (feedback, bug reports)
        // - Special date achievements (holidays, birthday)
        // - Weather achievements (heat_wave, cold_blooded, etc.)
        // - Early adopter / beta tester

        if (revokedAchievements.length > 0) {
            console.log(`🔻 Revoked ${revokedAchievements.length} achievements:`, revokedAchievements);
        }

        return revokedAchievements;
    }

    /**
     * Check leaderboard achievements when user's rank changes
     * @param {number} currentRank - User's current leaderboard rank (among visible users only)
     */
    async checkLeaderboardAchievements(currentRank) {
        try {
            const user = userManager.getCurrentUser();
            if (!user) return;

            // Hidden users cannot earn leaderboard achievements
            if (user.hideFromLeaderboard) {
                console.log('🔒 User is hidden from leaderboard - skipping leaderboard achievements');
                return [];
            }

            const currentAchievements = user.achievements || [];
            const newlyUnlocked = [];

            // Check each leaderboard achievement threshold
            if (currentRank === 1 && !currentAchievements.includes('number_one')) {
                await userManager.addAchievement('number_one');
                newlyUnlocked.push('number_one');
            }
            if (currentRank <= 3 && !currentAchievements.includes('podium_finish')) {
                await userManager.addAchievement('podium_finish');
                newlyUnlocked.push('podium_finish');
            }
            if (currentRank <= 5 && !currentAchievements.includes('top_five')) {
                await userManager.addAchievement('top_five');
                newlyUnlocked.push('top_five');
            }
            if (currentRank <= 10 && !currentAchievements.includes('top_ten')) {
                await userManager.addAchievement('top_ten');
                newlyUnlocked.push('top_ten');
            }
            if (currentRank <= 20 && !currentAchievements.includes('top_twenty')) {
                await userManager.addAchievement('top_twenty');
                newlyUnlocked.push('top_twenty');
            }

            if (newlyUnlocked.length > 0) {
                console.log('🏆 Leaderboard achievements unlocked:', newlyUnlocked);
            }

            return newlyUnlocked;
        } catch (error) {
            console.error('Error checking leaderboard achievements:', error);
            return [];
        }
    }

    /**
     * Check bulk logging achievements when user logs for others
     * @param {Object} bulkLogStats - User's bulk logging statistics
     */
    async checkBulkLogAchievements(bulkLogStats) {
        try {
            const user = userManager.getCurrentUser();
            if (!user) return;

            const currentAchievements = user.achievements || [];
            const newlyUnlocked = [];

            const { uniquePlayersLogged, totalLogsForOthers, maxPlayersInSession } = bulkLogStats;

            // team_player: Log for 5 different friends
            if (uniquePlayersLogged >= 5 && !currentAchievements.includes('team_player')) {
                await userManager.addAchievement('team_player');
                newlyUnlocked.push('team_player');
            }

            // coach: Log for 10 different players
            if (uniquePlayersLogged >= 10 && !currentAchievements.includes('coach')) {
                await userManager.addAchievement('coach');
                newlyUnlocked.push('coach');
            }

            // generous_logger: Log 50 activities for others
            if (totalLogsForOthers >= 50 && !currentAchievements.includes('generous_logger')) {
                await userManager.addAchievement('generous_logger');
                newlyUnlocked.push('generous_logger');
            }

            // party_host: Log multiplayer session with 4+ players
            if (maxPlayersInSession >= 4 && !currentAchievements.includes('party_host')) {
                await userManager.addAchievement('party_host');
                newlyUnlocked.push('party_host');
            }

            if (newlyUnlocked.length > 0) {
                console.log('📋 Bulk log achievements unlocked:', newlyUnlocked);
            }

            return newlyUnlocked;
        } catch (error) {
            console.error('Error checking bulk log achievements:', error);
            return [];
        }
    }

    /**
     * Check and award achievements for any user (used in group/multiplayer sessions).
     * Does NOT touch userManager.currentUser — reads/writes Firestore directly.
     * @param {string} userId - Target user ID
     * @returns {Promise<string[]>} Array of newly unlocked achievement IDs
     */
    async checkAchievementsForUser(userId) {
        try {
            const user = await storageManager.getUser(userId);
            if (!user) return [];

            const sessions = (await storageManager.getUserSessions(userId))
                .filter(s => !s.excludeFromStats && !s.pending);

            const currentAchievements = [...(user.achievements || [])];
            const newlyUnlocked = [];

            const tryUnlock = async (id) => {
                if (!currentAchievements.includes(id)) {
                    currentAchievements.push(id); // prevent double-unlock in this pass
                    await userManager.addAchievementForUser(userId, id);
                    newlyUnlocked.push(id);
                }
            };

            // ── Session-count achievements ───────────────────────────────────
            if (sessions.length >= 1)   await tryUnlock('first_steps');
            if (sessions.length >= 50)  await tryUnlock('half_century');
            if (sessions.length >= 100) await tryUnlock('centurion');

            // ── Accuracy / score in a single session ─────────────────────────
            if (sessions.find(s => s.makes >= CONSTANTS.ACHIEVEMENTS.PERFECT_10_THRESHOLD && s.percentage === 100))
                await tryUnlock('perfect_10');
            if (sessions.find(s => s.points >= CONSTANTS.ACHIEVEMENTS.CENTURY_CLUB_POINTS))
                await tryUnlock('century_club');
            if (sessions.find(s => s.percentage >= 90))
                await tryUnlock('ninety_percent_club');
            if (sessions.find(s => s.makes >= 50 && s.percentage === 100))
                await tryUnlock('flawless');
            if (sessions.find(s => s.distance >= 20 && s.percentage >= 95))
                await tryUnlock('sharpshooter');

            // ── Distance achievements ─────────────────────────────────────────
            if (sessions.find(s => s.distance >= CONSTANTS.ACHIEVEMENTS.DISTANCE_DEMON_FEET && s.makes >= CONSTANTS.ACHIEVEMENTS.DISTANCE_DEMON_PUTTS))
                await tryUnlock('distance_demon');
            if (sessions.find(s => s.distance >= 30))
                await tryUnlock('long_ranger');
            if (sessions.find(s => s.distance >= 50 && s.makes >= 1))
                await tryUnlock('downtown_driver');
            if (sessions.find(s => s.distance >= 60 && s.makes >= 3))
                await tryUnlock('extreme_range');

            // ── Volume in a single session ────────────────────────────────────
            if (sessions.find(s => s.makes >= 100))    await tryUnlock('hundred_club');
            if (sessions.find(s => s.makes >= 200))    await tryUnlock('two_hundred_club');
            if (sessions.find(s => s.attempts >= 500)) await tryUnlock('marathon_putter');
            if (sessions.find(s => s.attempts >= 1000)) await tryUnlock('iron_man');

            // ── Points totals (use freshly read user doc) ─────────────────────
            const pts = user.totalPoints || 0;
            if (pts >= CONSTANTS.ACHIEVEMENTS.POINT_KING_TOTAL) await tryUnlock('point_king');
            if (pts >= 5000)  await tryUnlock('point_legend');

            // ── Streak achievements ───────────────────────────────────────────
            const streaks = this._calculateStreaksFromSessions(sessions);
            if (streaks.longest >= CONSTANTS.ACHIEVEMENTS.WEEK_WARRIOR_DAYS)  await tryUnlock('week_warrior');
            if (streaks.longest >= CONSTANTS.ACHIEVEMENTS.MONTH_MASTER_DAYS)  await tryUnlock('month_master');
            if (streaks.longest >= 14)  await tryUnlock('two_week_streak');
            if (streaks.longest >= 60)  await tryUnlock('iron_will');
            if (streaks.longest >= 100) await tryUnlock('unstoppable');

            // ── Routine / game counts (from user doc totals) ──────────────────
            if ((user.totalRoutines || 0) >= 25) await tryUnlock('routine_addict');
            if ((user.totalGames || 0) >= 10)    await tryUnlock('game_enthusiast');

            console.log(`🏆 Group session achievements for ${userId}:`, newlyUnlocked);
            return newlyUnlocked;
        } catch (error) {
            console.error('Error checking achievements for user:', userId, error);
            return [];
        }
    }

    /**
     * Check and award time-based achievements that only depend on account age
     * or calendar date — not on activity completion. Called on every login so
     * users who sign up and later return don't miss passive achievements like
     * "Committed" (30-day account age) which would otherwise never fire for
     * inactive users.
     *
     * @param {Object} user - The current user object (must have createdAt)
     */
    async checkTimeBasedAchievements(user) {
        if (!user || !user.createdAt) return;

        try {
            const currentAchievements = user.achievements || [];
            const newlyUnlocked = [];
            const accountAge = Math.floor(
                (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            const tryUnlock = async (id) => {
                if (!currentAchievements.includes(id)) {
                    await userManager.addAchievement(id);
                    newlyUnlocked.push(id);
                }
            };

            // Account age milestones
            if (accountAge >= 30)  await tryUnlock('committed');
            if (accountAge >= 90)  await tryUnlock('veteran');
            if (accountAge >= 365) await tryUnlock('legend');

            // First week — also time-based (7 unique practice days handled in
            // checkAchievements, but account age of 7+ days is a safe fallback
            // only if the user actually has sessions; skip here, leave to normal flow)

            if (newlyUnlocked.length > 0) {
                console.log(`🏆 Time-based achievements unlocked on login for ${user.displayName}:`, newlyUnlocked);
            }

            return newlyUnlocked;
        } catch (error) {
            console.error('Error checking time-based achievements:', error);
            return [];
        }
    }

    /**
     * Calculate longest streak from a sessions array (no userManager dependency).
     * @param {Array} sessions
     * @returns {{longest: number}}
     */
    _calculateStreaksFromSessions(sessions) {
        const days = new Set();
        sessions.forEach(s => {
            const raw = s.date || (s.timestamp ? s.timestamp.substring(0, 10) : null);
            if (raw) days.add(raw.substring(0, 10));
        });
        const sorted = Array.from(days).sort();
        if (!sorted.length) return { longest: 0 };
        let longest = 1, temp = 1;
        for (let i = 1; i < sorted.length; i++) {
            const diff = Math.round(
                (new Date(sorted[i] + 'T12:00:00') - new Date(sorted[i - 1] + 'T12:00:00')) / 86400000
            );
            if (diff === 1) { temp++; if (temp > longest) longest = temp; }
            else temp = 1;
        }
        return { longest };
    }
}

// Export singleton instance
export const achievementManager = new AchievementManager();
