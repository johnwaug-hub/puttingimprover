/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Game Tracking Module
 * Tracks game sessions, scores, and achievements
 */

import { storageManager } from './storage.js';
import { userManager } from './user.js';
import { calculateGamePoints } from '../utils/calculations.js';

class GameTracker {
    constructor() {
        this.currentGame = null;
        this.gameHistory = [];
    }

    /**
     * Start a game session
     * @param {Object} game - Game object from PUTTING_GAMES
     * @returns {Object} Started game session
     */
    startGame(game) {
        this.currentGame = {
            gameId: game.id,
            gameName: game.name,
            startTime: new Date().toISOString(),
            difficulty: game.difficulty,
            scoringType: game.scoring.type,
            completed: false,
            score: null,
            goal: game.scoring.goal,
            notes: []
        };

        console.log('🎮 Game started:', game.name);
        return this.currentGame;
    }

    /**
     * Update game score/progress
     * @param {Object} scoreData - Score data
     */
    updateScore(scoreData) {
        if (!this.currentGame) {
            throw new Error('No active game');
        }

        this.currentGame.score = scoreData.score;
        this.currentGame.details = scoreData.details || {};

        console.log('📊 Score updated:', scoreData);
    }

    /**
     * Add a note to the current game
     * @param {string} note - Note text
     */
    addNote(note) {
        if (!this.currentGame) {
            throw new Error('No active game');
        }

        this.currentGame.notes.push({
            timestamp: new Date().toISOString(),
            text: note
        });
    }

    /**
     * Complete the current game
     * @param {Object} finalScore - Final score data
     * @param {string} targetUserId - Optional user ID to award points to (defaults to current user)
     * @returns {Promise<Object>} Completed game record
     */
    async completeGame(finalScore, targetUserId = null) {
        if (!this.currentGame) {
            throw new Error('No active game');
        }

        this.currentGame.completed = true;
        this.currentGame.endTime = new Date().toISOString();
        this.currentGame.duration = this.calculateDuration();
        this.currentGame.score = finalScore.score;
        this.currentGame.goalAchieved = this.checkGoalAchieved(finalScore);

        // Store player count
        this.currentGame.playerCount = finalScore.playerCount || 1;

        // For percentage games, copy all the relevant data
        if (this.currentGame.scoringType === 'percentage') {
            this.currentGame.totalMakes = finalScore.totalMakes;
            this.currentGame.totalAttempts = finalScore.totalAttempts;
            this.currentGame.percentage = finalScore.percentage;
            this.currentGame.distance = finalScore.distance;
        }

        // Calculate points earned for this game
        const gameDefinition = { scoring: { type: this.currentGame.scoringType } };
        const gamePoints = calculateGamePoints(gameDefinition, { ...finalScore, ...this.currentGame });
        this.currentGame.points = gamePoints;

        console.log('💰 Game points calculated:', {
            scoringType: this.currentGame.scoringType,
            playerCount: this.currentGame.playerCount,
            basePoints: 50 * this.currentGame.playerCount,
            percentage: this.currentGame.percentage,
            totalPoints: gamePoints
        });

        // Determine which user should receive the points
        const currentUser = userManager.getCurrentUser();
        const recipientUserId = targetUserId || (currentUser ? currentUser.id : null);

        // Fetch weather data if enabled for recipient
        let weatherData = null;
        if (recipientUserId) {
            try {
                // Use current user if it's for them, otherwise fetch recipient
                let recipientUser;
                if (recipientUserId === currentUser?.id) {
                    recipientUser = currentUser;
                } else {
                    recipientUser = await storageManager.getUser(recipientUserId);
                }

                console.log('🌤️ Game weather check:', {
                    userId: recipientUserId,
                    weatherEnabled: recipientUser?.weatherEnabled,
                    zipCode: recipientUser?.location?.zipCode
                });

                if (recipientUser?.weatherEnabled && recipientUser?.location?.zipCode) {
                    console.log('🌤️ Fetching weather for game, ZIP:', recipientUser.location.zipCode);
                    const { weatherService } = await import('./weather.js');
                    weatherData = await weatherService.getWeatherByZipCode(
                        recipientUser.location.zipCode,
                        recipientUser.location.country || 'us'
                    );
                    console.log('🌤️ Weather data received for game:', weatherData);
                } else {
                    console.log('⚠️ Weather not enabled for game or ZIP missing');
                }
            } catch (error) {
                // Silently fail - weather is optional
            }
        }

        // Add weather data to game
        this.currentGame.weather = weatherData;
        console.log('💾 Game saved with weather:', {
            gameId: this.currentGame.id,
            hasWeather: !!this.currentGame.weather
        });

        if (recipientUserId) {
            // If awarding to someone else, fetch their user data
            let recipientUser;
            if (targetUserId && targetUserId !== currentUser?.id) {
                recipientUser = await storageManager.getUser(targetUserId);
                console.log('🎯 Awarding points to other player:', recipientUser?.displayName || targetUserId);
            } else {
                recipientUser = currentUser;
            }

            if (recipientUser) {
                // Store who scored the game (for records)
                this.currentGame.scoredBy = currentUser?.id || 'unknown';
                this.currentGame.scoredFor = recipientUserId;

                // Save game completion to recipient's records
                await storageManager.saveGameCompletion(recipientUserId, this.currentGame);

                // Increment totalGames counter and add points to recipient
                recipientUser.totalGames = (recipientUser.totalGames || 0) + 1;
                recipientUser.totalPoints = (recipientUser.totalPoints || 0) + gamePoints;
                
                // Add makes/putts if game tracks them
                if (this.currentGame.totalMakes !== undefined) {
                    recipientUser.totalMakes = (recipientUser.totalMakes || 0) + (this.currentGame.totalMakes || 0);
                    recipientUser.totalPutts = (recipientUser.totalPutts || 0) + (this.currentGame.totalAttempts || 0);
                }

                // Track game-specific stats
                await this.trackGameStats(recipientUser, this.currentGame, finalScore);

                // Track competitive stats (wins, weekly tracking, etc.)
                await this.trackCompetitiveStats(recipientUser, finalScore);

                await storageManager.saveUser(recipientUser);

                console.log('✅ Points awarded to:', {
                    userId: recipientUserId,
                    displayName: recipientUser.displayName,
                    pointsAwarded: gamePoints,
                    newTotal: recipientUser.totalPoints
                });
            }
        }

        // Add to history
        this.gameHistory.push({ ...this.currentGame });

        console.log('🎉 Game completed!', this.currentGame);

        const completedGame = { ...this.currentGame };
        this.currentGame = null;

        return completedGame;
    }

    /**
     * Check if goal was achieved
     * @param {Object} finalScore - Final score data
     * @returns {boolean} Whether goal was achieved
     */
    checkGoalAchieved(finalScore) {
        if (!this.currentGame) return false;

        // Different logic based on scoring type
        switch (this.currentGame.scoringType) {
            case 'time':
                // For time-based, lower is better
                return finalScore.timeInMinutes <= finalScore.targetTime;

            case 'strokes':
                // For strokes, lower or equal is better
                return finalScore.score <= finalScore.par;

            case 'points':
                // For points, higher is better
                return finalScore.score >= finalScore.targetScore;

            case 'distance':
                // For distance, reaching target is success
                return finalScore.maxDistance >= finalScore.targetDistance;

            case 'streak':
                // For streak, achieving target is success
                return finalScore.streak >= finalScore.targetStreak;

            case 'elimination':
                // For elimination games, not spelling word is success
                return finalScore.won === true;

            default:
                return false;
        }
    }

    /**
     * Calculate duration of game
     * @returns {number} Duration in minutes
     */
    calculateDuration() {
        if (!this.currentGame.startTime || !this.currentGame.endTime) {
            return 0;
        }

        const start = new Date(this.currentGame.startTime);
        const end = new Date(this.currentGame.endTime);
        return Math.round((end - start) / 60000);
    }

    /**
     * Load game history for current user
     * @returns {Promise<Array>} Array of completed games
     */
    async loadGameHistory() {
        const user = userManager.getCurrentUser();
        if (!user) return [];

        this.gameHistory = await storageManager.getGameCompletions(user.id);
        return this.gameHistory;
    }

    /**
     * Get statistics for a specific game
     * @param {string} gameId - Game ID
     * @returns {Object} Statistics
     */
    getGameStats(gameId) {
        const completions = this.gameHistory.filter(g => g.gameId === gameId);

        if (completions.length === 0) {
            return {
                timesPlayed: 0,
                goalsAchieved: 0,
                successRate: 0,
                bestScore: null,
                averageScore: 0,
                totalDuration: 0
            };
        }

        const goalsAchieved = completions.filter(g => g.goalAchieved).length;
        const scores = completions.map(g => g.score).filter(s => s !== null);
        const totalDuration = completions.reduce((sum, g) => sum + (g.duration || 0), 0);

        return {
            timesPlayed: completions.length,
            goalsAchieved,
            successRate: Math.round((goalsAchieved / completions.length) * 100),
            bestScore: scores.length > 0 ? Math.max(...scores) : null,
            averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            totalDuration,
            lastPlayed: completions[completions.length - 1].endTime
        };
    }

    /**
     * Get overall game statistics
     * @returns {Object} Overall statistics
     */
    getOverallStats() {
        const gamesPlayed = this.gameHistory.length;
        const uniqueGames = new Set(this.gameHistory.map(g => g.gameId)).size;
        const goalsAchieved = this.gameHistory.filter(g => g.goalAchieved).length;
        const totalDuration = this.gameHistory.reduce((sum, g) => sum + (g.duration || 0), 0);

        return {
            totalGamesPlayed: gamesPlayed,
            uniqueGamesPlayed: uniqueGames,
            totalGoalsAchieved: goalsAchieved,
            overallSuccessRate: gamesPlayed > 0 ? Math.round((goalsAchieved / gamesPlayed) * 100) : 0,
            totalTimeSpent: totalDuration,
            averageGameDuration: gamesPlayed > 0 ? Math.round(totalDuration / gamesPlayed) : 0
        };
    }

    /**
     * Get current game in progress
     * @returns {Object|null} Current game or null
     */
    getCurrentGame() {
        return this.currentGame;
    }

    /**
     * Cancel current game
     */
    cancelGame() {
        if (this.currentGame) {
            console.log('❌ Game canceled:', this.currentGame.gameName);
            this.currentGame = null;
        }
    }

    /**
     * Get leaderboard for a specific game
     * @param {string} gameId - Game ID
     * @returns {Array} Sorted array of top scores
     */
    getGameLeaderboard(gameId) {
        const gameCompletions = this.gameHistory.filter(g => g.gameId === gameId);

        // Sort by score (highest first for points, lowest for time/strokes)
        const sorted = gameCompletions.sort((a, b) => {
            if (a.scoringType === 'time' || a.scoringType === 'strokes') {
                return (a.score || Infinity) - (b.score || Infinity);
            } else {
                return (b.score || 0) - (a.score || 0);
            }
        });

        return sorted.slice(0, 10); // Top 10
    }

    /**
     * Track game-specific statistics
     * @param {Object} user - User object
     * @param {Object} game - Completed game object
     * @param {Object} finalScore - Final score data
     */
    async trackGameStats(user, game, finalScore) {
        // Initialize gameStats if not exists
        if (!user.gameStats) user.gameStats = {};

        // Normalize game name to key (lowercase, underscores)
        const gameKey = game.gameName.toLowerCase().replace(/\s+/g, '_');

        // Initialize this game's stats if not exists
        if (!user.gameStats[gameKey]) {
            user.gameStats[gameKey] = {
                totalGames: 0,
                highScore: 0,
                wins: 0,
                completions: 0
            };
        }

        const stats = user.gameStats[gameKey];
        stats.totalGames += 1;

        // Track game-specific metrics
        switch(gameKey) {
            case 'horse':
                // Track wins/losses
                if (finalScore.won) {
                    stats.wins = (stats.wins || 0) + 1;
                    stats.winStreak = (stats.winStreak || 0) + 1;
                    if (stats.winStreak > (stats.bestWinStreak || 0)) {
                        stats.bestWinStreak = stats.winStreak;
                    }
                } else if (finalScore.lost) {
                    stats.losses = (stats.losses || 0) + 1;
                    stats.winStreak = 0;
                }
                break;

            case 'around_the_world':
                // Track completion time in minutes
                if (finalScore.completionTime) {
                    const timeInMinutes = finalScore.completionTime;

                    if (!stats.bestTime || timeInMinutes < stats.bestTime) {
                        stats.bestTime = timeInMinutes;
                    }

                    // Track times under thresholds
                    if (timeInMinutes <= 15) {
                        stats.under15Min = (stats.under15Min || 0) + 1;
                    }
                    if (timeInMinutes <= 10) {
                        stats.under10Min = (stats.under10Min || 0) + 1;
                    }
                }

                if (finalScore.completed) {
                    stats.completions = (stats.completions || 0) + 1;
                }
                break;

            case 'putt_100':
                const score = finalScore.score || 0;

                if (score > stats.highScore) {
                    stats.highScore = score;
                }

                // Track score thresholds
                if (score >= 100) stats.perfectGames = (stats.perfectGames || 0) + 1;
                if (score >= 90) stats.over90 = (stats.over90 || 0) + 1;
                if (score >= 80) stats.over80 = (stats.over80 || 0) + 1;
                break;

            case 'distance_ladder':
                if (finalScore.maxDistance) {
                    if (finalScore.maxDistance > (stats.maxDistance || 0)) {
                        stats.maxDistance = finalScore.maxDistance;
                    }

                    if (finalScore.maxDistance >= 40) {
                        stats.completions = (stats.completions || 0) + 1;
                    }
                }
                break;

            case 'perfect_ten':
                if (finalScore.completed) {
                    stats.completions = (stats.completions || 0) + 1;
                }

                if (finalScore.perfectStreak === 10 || finalScore.allMade) {
                    stats.perfectRuns = (stats.perfectRuns || 0) + 1;
                }

                if (finalScore.streak > (stats.bestStreak || 0)) {
                    stats.bestStreak = finalScore.streak;
                }
                break;

            case 'points_poker':
                const pokerScore = finalScore.score || 0;

                if (pokerScore > stats.highScore) {
                    stats.highScore = pokerScore;
                }

                if (pokerScore >= 200) stats.over200 = (stats.over200 || 0) + 1;
                if (pokerScore >= 150) stats.over150 = (stats.over150 || 0) + 1;
                break;

            case 'putting_par':
                const parScore = finalScore.score || 0;

                if (!stats.bestScore || parScore < stats.bestScore) {
                    stats.bestScore = parScore;
                }

                if (parScore <= 0) {
                    stats.parOrBetter = (stats.parOrBetter || 0) + 1;
                    if (parScore < 0) {
                        stats.underPar = (stats.underPar || 0) + 1;
                    }
                }
                break;
        }

        user.gameStats[gameKey] = stats;

        console.log('📊 Game stats tracked:', {
            game: gameKey,
            stats: stats
        });
    }

    /**
     * Track competitive statistics
     * @param {Object} user - User object
     * @param {Object} finalScore - Final score data
     */
    async trackCompetitiveStats(user, finalScore) {
        // Initialize competitiveStats if not exists
        if (!user.competitiveStats) {
            user.competitiveStats = {
                totalWins: 0,
                totalLosses: 0,
                currentWinStreak: 0,
                bestWinStreak: 0,
                weeklyWins: 0,
                weekNumber: 0
            };
        }

        const stats = user.competitiveStats;

        // Check if we're in a new week (reset weekly counter)
        const now = new Date();
        const currentWeekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));

        if (stats.weekNumber !== currentWeekNumber) {
            // New week started - reset weekly wins
            stats.weeklyWins = 0;
            stats.weekNumber = currentWeekNumber;
            console.log('🗓️ New week detected, resetting weekly wins');
        }

        // Track wins/losses
        if (finalScore.won) {
            stats.totalWins += 1;
            stats.currentWinStreak += 1;
            stats.weeklyWins += 1;

            // Update best win streak
            if (stats.currentWinStreak > stats.bestWinStreak) {
                stats.bestWinStreak = stats.currentWinStreak;
            }

            console.log('🏆 Win tracked:', {
                totalWins: stats.totalWins,
                winStreak: stats.currentWinStreak,
                weeklyWins: stats.weeklyWins
            });
        } else if (finalScore.lost) {
            stats.totalLosses += 1;
            stats.currentWinStreak = 0; // Reset streak on loss

            console.log('💔 Loss tracked:', {
                totalLosses: stats.totalLosses,
                streakReset: true
            });
        }

        user.competitiveStats = stats;
    }
}

// Export singleton instance
export const gameTracker = new GameTracker();
