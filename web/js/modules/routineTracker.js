/**
 * Routine Tracking Module
 * Tracks routine completions, progress, and statistics
 */

import { storageManager } from './storage.js';
import { userManager } from './user.js';

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
     * @returns {Promise<Object>} Completed routine record
     */
    async completeRoutine() {
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

        // Save to database
        const user = userManager.getCurrentUser();
        if (user) {
            await storageManager.saveRoutineCompletion(user.id, this.currentRoutine);
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
