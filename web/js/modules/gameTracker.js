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
     * @returns {Promise<Object>} Completed game record
     */
    async completeGame(finalScore) {
        if (!this.currentGame) {
            throw new Error('No active game');
        }

        this.currentGame.completed = true;
        this.currentGame.endTime = new Date().toISOString();
        this.currentGame.duration = this.calculateDuration();
        this.currentGame.score = finalScore.score;
        this.currentGame.goalAchieved = this.checkGoalAchieved(finalScore);
        
        // Calculate points earned for this game
        const gameDefinition = { scoring: { type: this.currentGame.scoringType } };
        const gamePoints = calculateGamePoints(gameDefinition, { ...finalScore, ...this.currentGame });
        this.currentGame.points = gamePoints;

        // Save to database
        const user = userManager.getCurrentUser();
        if (user) {
            await storageManager.saveGameCompletion(user.id, this.currentGame);
            
            // Increment totalGames counter and add points
            user.totalGames = (user.totalGames || 0) + 1;
            user.totalPoints = (user.totalPoints || 0) + gamePoints;
            await storageManager.saveUser(user);
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
}

// Export singleton instance
export const gameTracker = new GameTracker();
