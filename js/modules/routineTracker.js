/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Routine Tracking Module
 * Tracks routine completions, progress, and statistics
 */

import { storageManager } from './storage.js';
import { userManager } from './user.js';
import { calculateRoutinePoints } from '../utils/calculations.js';

class RoutineTracker {
    constructor() {
        this.currentRoutine = null;
        this.routineHistory = [];
    }

    /**
     * Start a routine
     * @param {Object} routine - Routine object from SUGGESTED_ROUTINES
     * @returns {Object} Started routine session
     */
    startRoutine(routine) {
        this.currentRoutine = {
            routineId: routine.id,
            routineName: routine.name,
            startTime: new Date().toISOString(),
            drills: routine.drills.map((drill, idx) => ({
                drillNumber: idx + 1,
                distance: drill.distance,
                targetAttempts: drill.attempts,
                description: drill.description,
                completed: false,
                makes: null,
                attempts: null,
                percentage: null
            })),
            currentDrillIndex: 0,
            completed: false
        };

        console.log('🏋️ Routine started:', routine.name);
        return this.currentRoutine;
    }

    /**
     * Complete a drill within a routine
     * @param {number} drillIndex - Index of the drill
     * @param {number} makes - Number of makes
     * @param {number} attempts - Number of attempts
     */
    completeDrill(drillIndex, makes, attempts) {
        if (!this.currentRoutine) {
            throw new Error('No active routine');
        }

        const drill = this.currentRoutine.drills[drillIndex];
        if (!drill) {
            throw new Error('Invalid drill index');
        }

        drill.completed = true;
        drill.makes = makes;
        drill.attempts = attempts;
        drill.percentage = (makes / attempts) * 100;
        drill.completedAt = new Date().toISOString();

        console.log(`✅ Drill ${drillIndex + 1} completed:`, drill);

        // Move to next drill if available
        if (drillIndex < this.currentRoutine.drills.length - 1) {
            this.currentRoutine.currentDrillIndex = drillIndex + 1;
        }
    }

    /**
     * Complete the entire routine
     * @param {string} targetUserId - Optional user ID to award points to (defaults to current user)
     * @returns {Promise<Object>} Completed routine record
     */
    async completeRoutine(targetUserId = null) {
        if (!this.currentRoutine) {
            throw new Error('No active routine');
        }

        const allDrillsCompleted = this.currentRoutine.drills.every(d => d.completed);
        if (!allDrillsCompleted) {
            throw new Error('Not all drills completed');
        }

        this.currentRoutine.completed = true;
        this.currentRoutine.endTime = new Date().toISOString();
        this.currentRoutine.duration = this.calculateDuration();
        this.currentRoutine.totalStats = this.calculateRoutineStats();

        // Calculate points earned from routine drills
        const routinePoints = calculateRoutinePoints(this.currentRoutine.drills);
        this.currentRoutine.points = routinePoints;

        console.log('💰 Routine points calculated:', routinePoints);

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

                console.log('🌤️ Routine weather check:', {
                    userId: recipientUserId,
                    weatherEnabled: recipientUser?.weatherEnabled,
                    zipCode: recipientUser?.location?.zipCode
                });

                if (recipientUser?.weatherEnabled && recipientUser?.location?.zipCode) {
                    console.log('🌤️ Fetching weather for routine, ZIP:', recipientUser.location.zipCode);
                    const { weatherService } = await import('./weather.js');
                    weatherData = await weatherService.getWeatherByZipCode(
                        recipientUser.location.zipCode,
                        recipientUser.location.country || 'us'
                    );
                    console.log('🌤️ Weather data received for routine:', weatherData);
                } else {
                    console.log('⚠️ Weather not enabled for routine or ZIP missing');
                }
            } catch (error) {
                // Silently fail - weather is optional
            }
        }

        // Add weather data to routine
        this.currentRoutine.weather = weatherData;
        console.log('💾 Routine saved with weather:', {
            routineId: this.currentRoutine.id,
            hasWeather: !!this.currentRoutine.weather
        });

        if (recipientUserId) {
            // If awarding to someone else, fetch their user data
            let recipientUser;
            if (targetUserId && targetUserId !== currentUser?.id) {
                recipientUser = await storageManager.getUser(targetUserId);
                console.log('🎯 Awarding routine points to other player:', recipientUser?.displayName || targetUserId);
            } else {
                recipientUser = currentUser;
            }

            if (recipientUser) {
                // Store who scored the routine (for records)
                this.currentRoutine.scoredBy = currentUser?.id || 'unknown';
                this.currentRoutine.scoredFor = recipientUserId;

                // Save routine completion to recipient's records
                await storageManager.saveRoutineCompletion(recipientUserId, this.currentRoutine);

                // Award points to user and increment routine counter
                recipientUser.totalRoutines = (recipientUser.totalRoutines || 0) + 1;
                recipientUser.totalPoints = (recipientUser.totalPoints || 0) + routinePoints;

                // Roll routine makes/attempts into the user's lifetime totals.
                // Sessions (user.js) and games (gameTracker.js) already do this;
                // routines did not, so stored totalMakes was a sessions+games-only
                // figure while getStatistics() summed all three. That undercount
                // made cumulative-volume achievements (e.g. Total Makes 1K)
                // re-validate against a number well below the user's real total.
                const rStats = this.currentRoutine.totalStats || {};
                recipientUser.totalMakes = (recipientUser.totalMakes || 0) + (rStats.totalMakes || 0);
                recipientUser.totalPutts = (recipientUser.totalPutts || 0) + (rStats.totalAttempts || 0);

                await storageManager.saveUser(recipientUser);

                console.log('✅ Routine points awarded to:', {
                    userId: recipientUserId,
                    displayName: recipientUser.displayName,
                    routinePoints,
                    newTotal: recipientUser.totalPoints
                });

                // If this is a community routine, increment completion count and award creator
                if (this.currentRoutine.isCustom && this.currentRoutine.createdBy) {
                    await storageManager.incrementRoutineCompletion(this.currentRoutine.routineId);
                }
            }
        }

        // Add to history
        this.routineHistory.push({ ...this.currentRoutine });

        console.log('🎉 Routine completed!', this.currentRoutine);

        const completedRoutine = { ...this.currentRoutine };
        this.currentRoutine = null;

        return completedRoutine;
    }

    /**
     * Calculate duration of routine
     * @returns {number} Duration in minutes
     */
    calculateDuration() {
        if (!this.currentRoutine.startTime || !this.currentRoutine.endTime) {
            return 0;
        }

        const start = new Date(this.currentRoutine.startTime);
        const end = new Date(this.currentRoutine.endTime);
        return Math.round((end - start) / 60000); // Convert to minutes
    }

    /**
     * Calculate overall stats for the routine
     * @returns {Object} Statistics
     */
    calculateRoutineStats() {
        if (!this.currentRoutine) return null;

        const totalMakes = this.currentRoutine.drills.reduce((sum, d) => sum + (d.makes || 0), 0);
        const totalAttempts = this.currentRoutine.drills.reduce((sum, d) => sum + (d.attempts || 0), 0);
        const overallPercentage = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

        return {
            totalDrills: this.currentRoutine.drills.length,
            completedDrills: this.currentRoutine.drills.filter(d => d.completed).length,
            totalMakes,
            totalAttempts,
            overallPercentage: Math.round(overallPercentage * 10) / 10
        };
    }

    /**
     * Load routine history for current user
     * @returns {Promise<Array>} Array of completed routines
     */
    async loadRoutineHistory() {
        const user = userManager.getCurrentUser();
        if (!user) return [];

        this.routineHistory = await storageManager.getRoutineCompletions(user.id);
        return this.routineHistory;
    }

    /**
     * Get statistics for a specific routine
     * @param {string} routineId - Routine ID
     * @returns {Object} Statistics
     */
    getRoutineStats(routineId) {
        const completions = this.routineHistory.filter(r => r.routineId === routineId);

        if (completions.length === 0) {
            return {
                timesCompleted: 0,
                averageAccuracy: 0,
                averageDuration: 0,
                bestAccuracy: 0,
                totalPutts: 0
            };
        }

        const totalAccuracy = completions.reduce((sum, r) => sum + (r.totalStats?.overallPercentage || 0), 0);
        const totalDuration = completions.reduce((sum, r) => sum + (r.duration || 0), 0);
        const accuracies = completions.map(r => r.totalStats?.overallPercentage || 0);
        const totalPutts = completions.reduce((sum, r) => sum + (r.totalStats?.totalAttempts || 0), 0);

        return {
            timesCompleted: completions.length,
            averageAccuracy: Math.round((totalAccuracy / completions.length) * 10) / 10,
            averageDuration: Math.round(totalDuration / completions.length),
            bestAccuracy: Math.max(...accuracies),
            totalPutts,
            lastCompleted: completions[completions.length - 1].endTime
        };
    }

    /**
     * Get overall routine statistics
     * @returns {Object} Overall statistics
     */
    getOverallStats() {
        return {
            totalRoutinesCompleted: this.routineHistory.length,
            uniqueRoutines: new Set(this.routineHistory.map(r => r.routineId)).size,
            totalPutts: this.routineHistory.reduce((sum, r) => sum + (r.totalStats?.totalAttempts || 0), 0),
            averageAccuracy: this.calculateAverageAccuracy()
        };
    }

    /**
     * Calculate average accuracy across all routines
     * @returns {number} Average accuracy percentage
     */
    calculateAverageAccuracy() {
        if (this.routineHistory.length === 0) return 0;

        const total = this.routineHistory.reduce((sum, r) => sum + (r.totalStats?.overallPercentage || 0), 0);
        return Math.round((total / this.routineHistory.length) * 10) / 10;
    }

    /**
     * Get current routine in progress
     * @returns {Object|null} Current routine or null
     */
    getCurrentRoutine() {
        return this.currentRoutine;
    }

    /**
     * Cancel current routine
     */
    cancelRoutine() {
        if (this.currentRoutine) {
            console.log('❌ Routine canceled:', this.currentRoutine.routineName);
            this.currentRoutine = null;
        }
    }
}

// Export singleton instance
export const routineTracker = new RoutineTracker();
