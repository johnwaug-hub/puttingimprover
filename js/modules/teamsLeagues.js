/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Teams, Leagues & Competitive Features Module
 * Phase 5: ELO ratings, Season/Battle Pass, Teams system
 */

import { storageManager } from './storage.js';

// ELO Configuration
export const ELO_DEFAULT = 1200;
export const ELO_K_FACTOR = 32;

export const ELO_TIERS = [
    { name: 'Iron', icon: '⚙️', min: 0, max: 799, color: '#6b7280' },
    { name: 'Bronze', icon: '🥉', min: 800, max: 999, color: '#cd7f32' },
    { name: 'Silver', icon: '🥈', min: 1000, max: 1199, color: '#c0c0c0' },
    { name: 'Gold', icon: '🥇', min: 1200, max: 1399, color: '#ffd700' },
    { name: 'Platinum', icon: '🔷', min: 1400, max: 1599, color: '#00d4ff' },
    { name: 'Diamond', icon: '💠', min: 1600, max: 1799, color: '#b9f2ff' },
    { name: 'Master', icon: '💎', min: 1800, max: 1999, color: '#9966cc' },
    { name: 'Grandmaster', icon: '👑', min: 2000, max: Infinity, color: '#ff6b6b' }
];

// Season Configuration
export const SEASON_CONFIG = {
    seasonDurationDays: 90,
    maxLevel: 15,
    xpPerLevel: 500,
    xpRewards: {
        practiceSession: 10,
        completeRoutine: 15,
        playGame: 20,
        dailyChallenge: 25,
        weeklyChallenge: 75,
        winH2H: 50,
        earnAchievement: 30
    },
    levelRewards: [
        { level: 1, type: 'points', value: 100, name: '100 Bonus Points' },
        { level: 2, type: 'title', value: 'Rookie Putter', name: 'Title: Rookie Putter' },
        { level: 3, type: 'points', value: 200, name: '200 Bonus Points' },
        { level: 4, type: 'badge', value: 'bronze_season', name: 'Bronze Season Badge' },
        { level: 5, type: 'points', value: 300, name: '300 Bonus Points' },
        { level: 6, type: 'title', value: 'Skilled Putter', name: 'Title: Skilled Putter' },
        { level: 7, type: 'points', value: 400, name: '400 Bonus Points' },
        { level: 8, type: 'badge', value: 'silver_season', name: 'Silver Season Badge' },
        { level: 9, type: 'points', value: 500, name: '500 Bonus Points' },
        { level: 10, type: 'title', value: 'Expert Putter', name: 'Title: Expert Putter' },
        { level: 11, type: 'points', value: 750, name: '750 Bonus Points' },
        { level: 12, type: 'badge', value: 'gold_season', name: 'Gold Season Badge' },
        { level: 13, type: 'points', value: 1000, name: '1000 Bonus Points' },
        { level: 14, type: 'title', value: 'Master Putter', name: 'Title: Master Putter' },
        { level: 15, type: 'badge', value: 'platinum_season', name: 'Platinum Season Badge' }
    ]
};

// Team Configuration
export const TEAM_CONFIG = {
    maxMembers: 10,
    icons: ['🏆', '⚔️', '🔥', '💎', '🦅', '🐺', '🦁', '🐉', '⭐', '🎯'],
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']
};

class TeamsLeaguesManager {
    constructor() {
        this.db = null;
    }

    setDb(db) {
        this.db = db;
    }

    // ==================== ELO SYSTEM ====================

    /**
     * Get ELO tier for a rating
     */
    getEloTier(elo) {
        return ELO_TIERS.find(tier => elo >= tier.min && elo <= tier.max) || ELO_TIERS[0];
    }

    /**
     * Calculate expected score (probability of winning)
     */
    calculateExpectedScore(playerElo, opponentElo) {
        return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    }

    /**
     * Calculate new ELO after a match
     * @param {number} playerElo - Current player ELO
     * @param {number} opponentElo - Opponent's ELO
     * @param {number} actualScore - 1 for win, 0.5 for draw, 0 for loss
     * @returns {number} New ELO rating
     */
    calculateNewElo(playerElo, opponentElo, actualScore) {
        const expected = this.calculateExpectedScore(playerElo, opponentElo);
        const newElo = Math.round(playerElo + ELO_K_FACTOR * (actualScore - expected));
        return Math.max(0, newElo); // Prevent negative ELO
    }

    /**
     * Update ELO ratings after H2H challenge
     */
    async updateEloAfterMatch(winnerId, loserId, isDraw = false) {
        if (!this.db) return null;

        try {
            const winnerDoc = await this.db.collection('users').doc(winnerId).get();
            const loserDoc = await this.db.collection('users').doc(loserId).get();

            if (!winnerDoc.exists || !loserDoc.exists) return null;

            const winnerElo = winnerDoc.data().elo || ELO_DEFAULT;
            const loserElo = loserDoc.data().elo || ELO_DEFAULT;

            let newWinnerElo, newLoserElo;

            if (isDraw) {
                newWinnerElo = this.calculateNewElo(winnerElo, loserElo, 0.5);
                newLoserElo = this.calculateNewElo(loserElo, winnerElo, 0.5);
            } else {
                newWinnerElo = this.calculateNewElo(winnerElo, loserElo, 1);
                newLoserElo = this.calculateNewElo(loserElo, winnerElo, 0);
            }

            // Update both users
            await this.db.collection('users').doc(winnerId).update({ elo: newWinnerElo });
            await this.db.collection('users').doc(loserId).update({ elo: newLoserElo });

            return {
                winner: { old: winnerElo, new: newWinnerElo, change: newWinnerElo - winnerElo },
                loser: { old: loserElo, new: newLoserElo, change: newLoserElo - loserElo }
            };
        } catch (error) {
            console.error('Error updating ELO:', error);
            return null;
        }
    }

    /**
     * Get ELO leaderboard - fetches all users and sorts by ELO client-side
     * This handles users who don't have an elo field yet
     */
    async getEloLeaderboard(limit = 50) {
        if (!this.db) return [];

        try {
            // Fetch users ordered by totalPoints (a field that exists on all users)
            // Then sort by ELO client-side
            const snapshot = await this.db.collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(100) // Get more to ensure we have enough after sorting
                .get();

            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                elo: doc.data().elo || ELO_DEFAULT,
                tier: this.getEloTier(doc.data().elo || ELO_DEFAULT)
            }))
            // Filter out users who have hidden themselves from leaderboard
            .filter(user => !user.hideFromLeaderboard);

            // Sort by ELO descending
            users.sort((a, b) => b.elo - a.elo);

            // Add ranks and limit
            return users.slice(0, limit).map((user, index) => ({
                ...user,
                rank: index + 1
            }));
        } catch (error) {
            console.error('Error fetching ELO leaderboard:', error);
            return [];
        }
    }

    /**
     * Get Season XP leaderboard
     * @param {number} limit - Max number of users to return
     * @returns {Promise<Array>} Array of users sorted by season XP
     */
    async getSeasonXpLeaderboard(limit = 50) {
        if (!this.db) return [];

        const season = this.getCurrentSeason();

        try {
            // First get all users
            const usersSnapshot = await this.db.collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(100)
                .get();

            const users = [];

            // For each user, get their season XP from the seasons subcollection
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                
                // Skip users who have hidden themselves from leaderboard
                if (userData.hideFromLeaderboard) continue;

                // Try to get season progress
                let seasonXp = 0;
                try {
                    const seasonDoc = await this.db.collection('users').doc(userDoc.id)
                        .collection('seasons').doc(season.id).get();
                    
                    if (seasonDoc.exists) {
                        seasonXp = seasonDoc.data().xp || 0;
                    }
                } catch (e) {
                    // If can't get season data, use 0
                    seasonXp = userData.seasonXp || 0;
                }

                // Only include users with some XP
                if (seasonXp > 0) {
                    users.push({
                        id: userDoc.id,
                        ...userData,
                        seasonXp: seasonXp
                    });
                }
            }

            // Sort by Season XP descending
            users.sort((a, b) => (b.seasonXp || 0) - (a.seasonXp || 0));

            // Add ranks and limit
            return users.slice(0, limit).map((user, index) => ({
                ...user,
                rank: index + 1
            }));
        } catch (error) {
            console.error('Error fetching Season XP leaderboard:', error);
            return [];
        }
    }

    // ==================== SEASON / BATTLE PASS ====================

    /**
     * Get current season info
     */
    getCurrentSeason() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // Seasons: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
        const quarter = Math.floor(month / 3) + 1;
        const seasonStart = new Date(year, (quarter - 1) * 3, 1);
        const seasonEnd = new Date(year, quarter * 3, 0, 23, 59, 59);

        return {
            id: `${year}-Q${quarter}`,
            name: `Season ${quarter} ${year}`,
            startDate: seasonStart,
            endDate: seasonEnd,
            daysRemaining: Math.ceil((seasonEnd - now) / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Get or initialize user's season progress
     */
    async getSeasonProgress(userId) {
        if (!this.db) return this.getDefaultSeasonProgress();

        const season = this.getCurrentSeason();

        try {
            const ref = this.db.collection('users').doc(userId)
                .collection('seasons').doc(season.id);
            const doc = await ref.get();

            if (doc.exists) {
                const data = doc.data();
                
                // Always recalculate level from XP to fix stale level fields
                const correctLevel = Math.min(
                    Math.floor((data.xp || 0) / SEASON_CONFIG.xpPerLevel) + 1,
                    SEASON_CONFIG.maxLevel
                );
                if (data.level !== correctLevel) {
                    console.log(`Fixing stale level: stored=${data.level}, correct=${correctLevel} (xp=${data.xp})`);
                    data.level = correctLevel;
                    await ref.update({ level: correctLevel });
                }
                
                return { ...data, season };
            }

            // Initialize new season progress
            const defaultProgress = this.getDefaultSeasonProgress();
            await ref.set(defaultProgress);

            return { ...defaultProgress, season };
        } catch (error) {
            console.error('Error getting season progress:', error);
            return this.getDefaultSeasonProgress();
        }
    }

    getDefaultSeasonProgress() {
        return {
            xp: 0,
            level: 1,
            claimedRewards: [],
            activitiesCompleted: {
                practiceSessions: 0,
                routines: 0,
                games: 0,
                dailyChallenges: 0,
                h2hWins: 0,
                achievements: 0
            }
        };
    }

    /**
     * Add XP to user's season progress
     * @param {string} userId
     * @param {string} xpType - XP type key (e.g. 'practiceSession')
     * @param {number|null} amount - Optional override amount
     * @param {string|null} activityId - Optional unique activity ID for idempotency guard
     */
    async addSeasonXp(userId, xpType, amount = null, activityId = null) {
        if (!this.db) return null;

        // Guard against typo'd XP types. SEASON_CONFIG.xpRewards[xpType] returns
        // undefined for an unknown key, which previously fell through to 0 XP —
        // silently awarding nothing and never incrementing the activity counter.
        // (This is how bulk-logged games/routines lost their XP: the call sites
        // passed 'game'/'routine' instead of 'playGame'/'completeRoutine'.)
        if (amount === null && !(xpType in SEASON_CONFIG.xpRewards)) {
            console.error(`❌ addSeasonXp: unknown xpType "${xpType}". Valid types: ${Object.keys(SEASON_CONFIG.xpRewards).join(', ')}. No XP awarded.`);
            return null;
        }

        const season = this.getCurrentSeason();
        const xpGain = amount || SEASON_CONFIG.xpRewards[xpType] || 0;

        try {
            const progressRef = this.db.collection('users').doc(userId)
                .collection('seasons').doc(season.id);

            // ── Idempotency guard ─────────────────────────────────────────────
            // If an activityId is provided, check whether XP was already awarded
            // for this exact activity. This prevents double-counting when a save
            // is retried (e.g. offline-sync replays or optimistic UI re-saves).
            if (activityId) {
                const logRef = progressRef.collection('xpLog').doc(activityId);
                const logDoc = await logRef.get();
                if (logDoc.exists) {
                    console.warn(`⚠️ Season XP already awarded for activity ${activityId} (${xpType}), skipping duplicate.`);
                    return null;
                }
                // Write the log entry first so concurrent calls also see it
                await logRef.set({
                    type: xpType,
                    xp: xpGain,
                    awardedAt: this.db.constructor.FieldValue
                        ? this.db.constructor.FieldValue.serverTimestamp()
                        : new Date().toISOString()
                });
            }
            // ─────────────────────────────────────────────────────────────────

            const doc = await progressRef.get();
            let progress = doc.exists ? doc.data() : this.getDefaultSeasonProgress();

            progress.xp += xpGain;

            // Update activity counter
            const activityMap = {
                practiceSession: 'practiceSessions',
                completeRoutine: 'routines',
                playGame: 'games',
                dailyChallenge: 'dailyChallenges',
                winH2H: 'h2hWins',
                earnAchievement: 'achievements',
                weeklyChallenge: 'weeklyChallenges'
            };
            if (activityMap[xpType]) {
                if (!progress.activitiesCompleted) progress.activitiesCompleted = {};
                progress.activitiesCompleted[activityMap[xpType]] =
                    (progress.activitiesCompleted[activityMap[xpType]] || 0) + 1;
            }

            // Calculate new level
            const newLevel = Math.min(
                Math.floor(progress.xp / SEASON_CONFIG.xpPerLevel) + 1,
                SEASON_CONFIG.maxLevel
            );
            const leveledUp = newLevel > progress.level;
            progress.level = newLevel;

            await progressRef.set(progress, { merge: true });

            return {
                xpGained: xpGain,
                totalXp: progress.xp,
                level: progress.level,
                leveledUp,
                xpToNextLevel: (progress.level * SEASON_CONFIG.xpPerLevel) - progress.xp
            };
        } catch (error) {
            console.error('Error adding season XP:', error);
            return null;
        }
    }

    /**
     * Remove season XP when activity is deleted
     * @param {string} userId - User ID
     * @param {string} xpType - Type of XP to remove
     * @param {string} activityDate - ISO date string of the activity (to determine season)
     * @param {number} amount - Optional specific amount to remove
     * @returns {Promise<Object|null>} Result with new XP total
     */
    async removeSeasonXp(userId, xpType, activityDate = null, amount = null) {
        if (!this.db) return null;

        // Determine which season the activity belonged to
        let season;
        if (activityDate) {
            const activityTimestamp = new Date(activityDate).getTime();
            const currentSeason = this.getCurrentSeason();
            const seasonStart = new Date(currentSeason.startDate).getTime();
            
            // Only remove XP if activity was in current season
            if (activityTimestamp < seasonStart) {
                console.log('⏭️ Activity predates current season, no XP to remove');
                return null;
            }
            season = currentSeason;
        } else {
            season = this.getCurrentSeason();
        }

        const xpLoss = amount || SEASON_CONFIG.xpRewards[xpType] || 0;

        try {
            const progressRef = this.db.collection('users').doc(userId)
                .collection('seasons').doc(season.id);

            const doc = await progressRef.get();
            if (!doc.exists) return null;

            let progress = doc.data();

            // Remove XP (don't go below 0)
            progress.xp = Math.max(0, (progress.xp || 0) - xpLoss);

            // Update activity counter
            const activityMap = {
                practiceSession: 'practiceSessions',
                completeRoutine: 'routines',
                playGame: 'games',
                dailyChallenge: 'dailyChallenges',
                winH2H: 'h2hWins',
                earnAchievement: 'achievements',
                weeklyChallenge: 'weeklyChallenges'
            };
            if (activityMap[xpType] && progress.activitiesCompleted?.[activityMap[xpType]] > 0) {
                progress.activitiesCompleted[activityMap[xpType]]--;
            }

            // Recalculate level (can go down!)
            const newLevel = Math.max(1, Math.min(
                Math.floor(progress.xp / SEASON_CONFIG.xpPerLevel) + 1,
                SEASON_CONFIG.maxLevel
            ));
            const leveledDown = newLevel < progress.level;
            progress.level = newLevel;

            await progressRef.set(progress, { merge: true });

            console.log(`🔻 Removed ${xpLoss} XP for ${xpType} from user ${userId}`);

            return {
                xpRemoved: xpLoss,
                totalXp: progress.xp,
                level: progress.level,
                leveledDown
            };
        } catch (error) {
            console.error('Error removing season XP:', error);
            return null;
        }
    }

    /**
     * Claim a season reward
     */
    async claimSeasonReward(userId, level) {
        if (!this.db) return null;

        const season = this.getCurrentSeason();
        const reward = SEASON_CONFIG.levelRewards.find(r => r.level === level);

        if (!reward) return null;

        try {
            const progressRef = this.db.collection('users').doc(userId)
                .collection('seasons').doc(season.id);

            const doc = await progressRef.get();
            if (!doc.exists) return null;

            const progress = doc.data();

            // Check if already claimed
            if (progress.claimedRewards?.includes(level)) {
                return { error: 'Already claimed' };
            }

            // Check if level reached
            if (progress.level < level) {
                return { error: 'Level not reached' };
            }

            // Add to claimed rewards
            progress.claimedRewards = [...(progress.claimedRewards || []), level];
            await progressRef.update({ claimedRewards: progress.claimedRewards });

            // Apply reward
            if (reward.type === 'points') {
                // Add bonus points to user
                const userRef = this.db.collection('users').doc(userId);
                const userDoc = await userRef.get();
                if (userDoc.exists) {
                    const currentPoints = userDoc.data().totalPoints || 0;
                    await userRef.update({ totalPoints: currentPoints + reward.value });
                }
            } else if (reward.type === 'title') {
                // Save title to user profile
                const userRef = this.db.collection('users').doc(userId);
                await userRef.update({ currentTitle: reward.value });
            } else if (reward.type === 'badge') {
                // Add badge to user's badges array
                const userRef = this.db.collection('users').doc(userId);
                const userDoc = await userRef.get();
                if (userDoc.exists) {
                    const badges = userDoc.data().seasonBadges || [];
                    if (!badges.includes(reward.value)) {
                        await userRef.update({ seasonBadges: [...badges, reward.value] });
                    }
                }
            }

            return { success: true, reward };
        } catch (error) {
            console.error('Error claiming reward:', error);
            return null;
        }
    }

    // ==================== TEAMS SYSTEM ====================

    /**
     * Create a new team
     */
    async createTeam(userId, teamData) {
        if (!this.db) return null;

        try {
            // Check if user already has a team
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().teamId) {
                return { error: 'Already in a team' };
            }

            const team = {
                name: teamData.name,
                tag: teamData.tag.toUpperCase().slice(0, 4),
                icon: teamData.icon || '🏆',
                color: teamData.color || '#3b82f6',
                isPublic: teamData.isPublic !== false,
                captainId: userId,
                members: [userId],
                totalPoints: 0,
                createdAt: new Date().toISOString()
            };

            const teamRef = await this.db.collection('teams').add(team);

            // Update user with team ID
            await this.db.collection('users').doc(userId).update({
                teamId: teamRef.id,
                isTeamCaptain: true
            });

            return { success: true, teamId: teamRef.id, team };
        } catch (error) {
            console.error('Error creating team:', error);
            return null;
        }
    }

    /**
     * Join an existing team
     */
    async joinTeam(userId, teamId) {
        if (!this.db) return null;

        try {
            // Check if user already has a team
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().teamId) {
                return { error: 'Already in a team' };
            }

            const teamDoc = await this.db.collection('teams').doc(teamId).get();
            if (!teamDoc.exists) {
                return { error: 'Team not found' };
            }

            const team = teamDoc.data();

            // Check if team is full
            if (team.members.length >= TEAM_CONFIG.maxMembers) {
                return { error: 'Team is full' };
            }

            // Check if team is public
            if (!team.isPublic) {
                return { error: 'Team is private' };
            }

            // Add user to team
            await this.db.collection('teams').doc(teamId).update({
                members: [...team.members, userId]
            });

            // Update user with team ID
            await this.db.collection('users').doc(userId).update({
                teamId: teamId,
                isTeamCaptain: false
            });

            return { success: true };
        } catch (error) {
            console.error('Error joining team:', error);
            return null;
        }
    }

    /**
     * Leave a team
     */
    async leaveTeam(userId) {
        if (!this.db) return null;

        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data().teamId) {
                return { error: 'Not in a team' };
            }

            const teamId = userDoc.data().teamId;
            const isCaptain = userDoc.data().isTeamCaptain;

            const teamDoc = await this.db.collection('teams').doc(teamId).get();
            if (!teamDoc.exists) {
                // Team doesn't exist, just clear user's team reference
                await this.db.collection('users').doc(userId).update({
                    teamId: null,
                    isTeamCaptain: false
                });
                return { success: true };
            }

            const team = teamDoc.data();
            const newMembers = team.members.filter(id => id !== userId);

            if (newMembers.length === 0) {
                // Delete team if no members left
                await this.db.collection('teams').doc(teamId).delete();
            } else {
                // Update team
                const updates = { members: newMembers };

                // If captain is leaving, assign new captain
                if (isCaptain) {
                    updates.captainId = newMembers[0];
                    await this.db.collection('users').doc(newMembers[0]).update({
                        isTeamCaptain: true
                    });
                }

                await this.db.collection('teams').doc(teamId).update(updates);
            }

            // Clear user's team reference
            await this.db.collection('users').doc(userId).update({
                teamId: null,
                isTeamCaptain: false
            });

            return { success: true };
        } catch (error) {
            console.error('Error leaving team:', error);
            return null;
        }
    }

    /**
     * Delete a team (captain only)
     */
    async deleteTeam(userId) {
        if (!this.db) return null;

        try {
            console.log('🗑️ deleteTeam called for userId:', userId);
            
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data().teamId) {
                return { error: 'Not in a team' };
            }

            const teamId = userDoc.data().teamId;
            console.log('🗑️ User teamId:', teamId);

            const teamDoc = await this.db.collection('teams').doc(teamId).get();
            if (!teamDoc.exists) {
                // Team doesn't exist, just clear user's reference
                await this.db.collection('users').doc(userId).update({
                    teamId: null,
                    isTeamCaptain: false
                });
                return { success: true };
            }

            const team = teamDoc.data();
            console.log('🗑️ Team captainId:', team.captainId, 'Current userId:', userId);
            
            // Check if user is the captain based on TEAM document (source of truth)
            if (team.captainId !== userId) {
                return { error: 'Only the team captain can delete the team' };
            }

            // Clear team reference from all members
            console.log('🗑️ Clearing team from members:', team.members);
            const memberUpdates = team.members.map(memberId => 
                this.db.collection('users').doc(memberId).update({
                    teamId: null,
                    isTeamCaptain: false
                })
            );
            await Promise.all(memberUpdates);

            // Delete the team
            console.log('🗑️ Deleting team document:', teamId);
            await this.db.collection('teams').doc(teamId).delete();

            console.log('🗑️ Team deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('Error deleting team:', error);
            return { error: error.message || 'Failed to delete team' };
        }
    }

    /**
     * Get user's team info
     */
    async getUserTeam(userId) {
        if (!this.db) return null;

        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data().teamId) {
                return null;
            }

            const teamId = userDoc.data().teamId;
            const teamDoc = await this.db.collection('teams').doc(teamId).get();

            if (!teamDoc.exists) return null;

            const team = { id: teamId, ...teamDoc.data() };

            // Fetch member details
            const memberPromises = team.members.map(async (memberId) => {
                const memberDoc = await this.db.collection('users').doc(memberId).get();
                return memberDoc.exists ? { id: memberId, ...memberDoc.data() } : null;
            });

            team.memberDetails = (await Promise.all(memberPromises)).filter(Boolean);

            return team;
        } catch (error) {
            console.error('Error getting user team:', error);
            return null;
        }
    }

    /**
     * Get public teams for joining
     */
    async getPublicTeams(limit = 20) {
        if (!this.db) {
            console.log('👀 getPublicTeams: No database');
            return [];
        }

        try {
            console.log('👀 getPublicTeams: Querying Firestore...');
            // Simple query without orderBy to avoid index requirement
            const snapshot = await this.db.collection('teams')
                .where('isPublic', '==', true)
                .limit(50)
                .get();

            console.log('👀 getPublicTeams: Found', snapshot.docs.length, 'public teams');

            const teams = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                memberCount: doc.data().members?.length || 0
            }));

            // Sort client-side by totalPoints descending
            teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

            return teams.slice(0, limit);
        } catch (error) {
            console.error('Error getting public teams:', error);
            return [];
        }
    }

    /**
     * Get Putter Rating leaderboard
     * Sorts users by putterRating descending. Only includes users who have
     * a calculated rating (i.e. have logged at least one session).
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getPutterRatingLeaderboard(limit = 50) {
        if (!this.db) return [];
        try {
            const snapshot = await this.db.collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(200)
                .get();

            const users = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => !u.hideFromLeaderboard && u.putterRating != null && u.putterRating > 0);

            users.sort((a, b) => b.putterRating - a.putterRating);

            return users.slice(0, limit).map((user, index) => ({
                ...user,
                rank: index + 1
            }));
        } catch (error) {
            console.error('Error fetching putter rating leaderboard:', error);
            return [];
        }
    }

    /**
     * Get team leaderboard
     */
    async getTeamLeaderboard(limit = 50) {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('teams')
                .orderBy('totalPoints', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data(),
                memberCount: doc.data().members?.length || 0
            }));
        } catch (error) {
            console.error('Error getting team leaderboard:', error);
            return [];
        }
    }

    /**
     * Update team points (call when a member earns points)
     */
    async updateTeamPoints(userId, pointsEarned) {
        if (!this.db) return;

        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data().teamId) return;

            const teamId = userDoc.data().teamId;
            const teamRef = this.db.collection('teams').doc(teamId);
            const teamDoc = await teamRef.get();

            if (teamDoc.exists) {
                const currentPoints = teamDoc.data().totalPoints || 0;
                await teamRef.update({ totalPoints: currentPoints + pointsEarned });
            }
        } catch (error) {
            console.error('Error updating team points:', error);
        }
    }

    // ==================== TEAM INVITES ====================

    /**
     * Send team invite to a user (captain only)
     */
    async sendTeamInvite(captainId, targetUserId) {
        if (!this.db) {
            console.error('❌ sendTeamInvite: No database connection');
            return null;
        }

        try {
            console.log('📬 sendTeamInvite starting:', { captainId, targetUserId });
            
            // Verify captain
            const captainDoc = await this.db.collection('users').doc(captainId).get();
            console.log('📬 Captain doc exists:', captainDoc.exists);
            console.log('📬 Captain data:', captainDoc.data());
            
            if (!captainDoc.exists) {
                return { error: 'Captain user not found' };
            }
            
            const captainData = captainDoc.data();
            console.log('📬 isTeamCaptain:', captainData.isTeamCaptain);
            console.log('📬 teamId:', captainData.teamId);
            
            if (!captainData.isTeamCaptain) {
                return { error: 'Only team captains can send invites' };
            }

            const teamId = captainData.teamId;
            if (!teamId) {
                return { error: 'Captain has no team' };
            }
            
            const teamDoc = await this.db.collection('teams').doc(teamId).get();
            if (!teamDoc.exists) {
                return { error: 'Team not found' };
            }

            const team = teamDoc.data();
            console.log('📬 Team:', team.name);

            // Check if team is full
            if (team.members.length >= TEAM_CONFIG.maxMembers) {
                return { error: 'Team is full' };
            }

            // Check if target is already in a team
            const targetDoc = await this.db.collection('users').doc(targetUserId).get();
            if (!targetDoc.exists) {
                return { error: 'User not found' };
            }
            if (targetDoc.data().teamId) {
                return { error: 'User is already in a team' };
            }

            // Check for existing invite
            const existingInvite = await this.db.collection('team_invites')
                .where('teamId', '==', teamId)
                .where('toUserId', '==', targetUserId)
                .where('status', '==', 'pending')
                .get();

            if (!existingInvite.empty) {
                return { error: 'Invite already sent to this user' };
            }

            // Create invite
            const invite = {
                teamId,
                teamName: team.name,
                teamTag: team.tag,
                teamIcon: team.icon,
                teamColor: team.color,
                fromUserId: captainId,
                fromDisplayName: captainData.displayName,
                toUserId: targetUserId,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            console.log('📬 Creating invite:', invite);
            const inviteRef = await this.db.collection('team_invites').add(invite);
            console.log('📬 Invite created with ID:', inviteRef.id);

            // Also create a notification for the target user
            await this.db.collection('users').doc(targetUserId)
                .collection('notifications').add({
                    type: 'team_invite',
                    teamId,
                    teamName: team.name,
                    fromUserId: captainId,
                    fromDisplayName: captainData.displayName,
                    message: `${captainData.displayName} invited you to join ${team.name}`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            console.log('📬 Notification created');

            return { success: true };
        } catch (error) {
            console.error('Error sending team invite:', error);
            return null;
        }
    }

    /**
     * Get pending team invites for a user
     */
    async getTeamInvites(userId) {
        if (!this.db) return [];

        try {
            // Simple query without orderBy to avoid index requirement
            const snapshot = await this.db.collection('team_invites')
                .where('toUserId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            const invites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side by createdAt descending
            invites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`📬 Found ${invites.length} team invites for user ${userId}`);
            return invites;
        } catch (error) {
            console.error('Error getting team invites:', error);
            return [];
        }
    }

    /**
     * Accept a team invite
     */
    async acceptTeamInvite(userId, inviteId) {
        if (!this.db) return null;

        try {
            const inviteDoc = await this.db.collection('team_invites').doc(inviteId).get();
            if (!inviteDoc.exists) {
                return { error: 'Invite not found' };
            }

            const invite = inviteDoc.data();
            if (invite.toUserId !== userId) {
                return { error: 'This invite is not for you' };
            }
            if (invite.status !== 'pending') {
                return { error: 'Invite is no longer valid' };
            }

            // Check if user is already in a team
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().teamId) {
                return { error: 'You are already in a team' };
            }

            // Check if team still exists and has space
            const teamDoc = await this.db.collection('teams').doc(invite.teamId).get();
            if (!teamDoc.exists) {
                await this.db.collection('team_invites').doc(inviteId).update({ status: 'expired' });
                return { error: 'Team no longer exists' };
            }

            const team = teamDoc.data();
            if (team.members.length >= TEAM_CONFIG.maxMembers) {
                await this.db.collection('team_invites').doc(inviteId).update({ status: 'expired' });
                return { error: 'Team is now full' };
            }

            // Add user to team
            await this.db.collection('teams').doc(invite.teamId).update({
                members: [...team.members, userId]
            });

            // Update user
            await this.db.collection('users').doc(userId).update({
                teamId: invite.teamId,
                isTeamCaptain: false
            });

            // Mark invite as accepted
            await this.db.collection('team_invites').doc(inviteId).update({ status: 'accepted' });

            // Add team activity
            await this.addTeamActivity(invite.teamId, userId, 'joined', `joined the team`);

            return { success: true, teamId: invite.teamId };
        } catch (error) {
            console.error('Error accepting team invite:', error);
            return null;
        }
    }

    /**
     * Decline a team invite
     */
    async declineTeamInvite(userId, inviteId) {
        if (!this.db) return null;

        try {
            const inviteDoc = await this.db.collection('team_invites').doc(inviteId).get();
            if (!inviteDoc.exists) {
                return { error: 'Invite not found' };
            }

            const invite = inviteDoc.data();
            if (invite.toUserId !== userId) {
                return { error: 'This invite is not for you' };
            }

            await this.db.collection('team_invites').doc(inviteId).update({ status: 'declined' });

            return { success: true };
        } catch (error) {
            console.error('Error declining team invite:', error);
            return null;
        }
    }

    // ==================== TRANSFER CAPTAIN ====================

    /**
     * Transfer captain role to another team member
     */
    async transferCaptain(currentCaptainId, newCaptainId) {
        if (!this.db) return null;

        try {
            console.log('👑 transferCaptain:', { currentCaptainId, newCaptainId });
            
            // Verify current captain
            const captainDoc = await this.db.collection('users').doc(currentCaptainId).get();
            if (!captainDoc.exists || !captainDoc.data().isTeamCaptain) {
                return { error: 'You are not the team captain' };
            }

            const teamId = captainDoc.data().teamId;
            console.log('👑 Team ID:', teamId);

            // Verify new captain is on the team
            const newCaptainDoc = await this.db.collection('users').doc(newCaptainId).get();
            if (!newCaptainDoc.exists || newCaptainDoc.data().teamId !== teamId) {
                return { error: 'User is not on your team' };
            }

            // Update team
            console.log('👑 Updating team captainId to:', newCaptainId);
            await this.db.collection('teams').doc(teamId).update({
                captainId: newCaptainId
            });

            // Update users
            console.log('👑 Setting old captain isTeamCaptain: false');
            await this.db.collection('users').doc(currentCaptainId).update({
                isTeamCaptain: false
            });
            
            console.log('👑 Setting new captain isTeamCaptain: true');
            await this.db.collection('users').doc(newCaptainId).update({
                isTeamCaptain: true
            });

            // Add team activity
            await this.addTeamActivity(teamId, currentCaptainId, 'captain_transfer', 
                `transferred captain role to ${newCaptainDoc.data().displayName}`);

            console.log('👑 Captain transfer complete!');
            return { success: true };
        } catch (error) {
            console.error('Error transferring captain:', error);
            return null;
        }
    }

    // ==================== TEAM ACTIVITY ====================

    /**
     * Add activity to team feed
     */
    async addTeamActivity(teamId, userId, type, message, data = {}) {
        if (!this.db) return;

        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            await this.db.collection('teams').doc(teamId)
                .collection('activity').add({
                    userId,
                    displayName: userData.displayName || 'Unknown',
                    profilePictureURL: userData.profilePictureURL || null,
                    type,
                    message,
                    data,
                    createdAt: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error adding team activity:', error);
        }
    }

    /**
     * Get team activity feed
     */
    async getTeamActivity(teamId, limit = 20) {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('teams').doc(teamId)
                .collection('activity')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting team activity:', error);
            return [];
        }
    }

    /**
     * Log team member activity (practice, routine, game)
     */
    async logMemberActivity(userId, activityType, details) {
        if (!this.db) return;

        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data().teamId) return;

            const teamId = userDoc.data().teamId;
            let message = '';
            
            switch (activityType) {
                case 'session':
                    message = `logged a practice session (${details.makes}/${details.attempts} from ${details.distance}ft)`;
                    break;
                case 'routine':
                    message = `completed the "${details.routineName}" routine`;
                    break;
                case 'game':
                    message = `played "${details.gameName}" and scored ${details.score} points`;
                    break;
                case 'achievement':
                    message = `earned the "${details.achievementName}" achievement`;
                    break;
                default:
                    message = `did something awesome!`;
            }

            await this.addTeamActivity(teamId, userId, activityType, message, details);
        } catch (error) {
            console.error('Error logging member activity:', error);
        }
    }
}

export const teamsLeaguesManager = new TeamsLeaguesManager();
