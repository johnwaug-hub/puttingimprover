/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Advanced Analytics Module
 * Handles weather correlation, distance heatmaps, trend analysis, and personal bests
 */

import { userManager } from './user.js';

class AdvancedAnalyticsManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Analyze weather correlation with performance
     */
    analyzeWeatherCorrelation(sessions) {
        if (!sessions || sessions.length < 5) {
            return { hasEnoughData: false, message: 'Need at least 5 sessions with weather data' };
        }

        // Filter sessions with weather data
        const weatherSessions = sessions.filter(s => s.weather && s.weather.temperature);
        
        if (weatherSessions.length < 5) {
            return { hasEnoughData: false, message: 'Need at least 5 sessions with weather data' };
        }

        // Group by weather conditions
        const byCondition = {};
        const byTemperatureRange = {
            cold: { min: 0, max: 50, sessions: [], label: 'Cold (< 50°F)' },
            mild: { min: 50, max: 70, sessions: [], label: 'Mild (50-70°F)' },
            warm: { min: 70, max: 85, sessions: [], label: 'Warm (70-85°F)' },
            hot: { min: 85, max: 120, sessions: [], label: 'Hot (> 85°F)' }
        };

        const byWindSpeed = {
            calm: { min: 0, max: 5, sessions: [], label: 'Calm (0-5 mph)' },
            light: { min: 5, max: 15, sessions: [], label: 'Light (5-15 mph)' },
            moderate: { min: 15, max: 25, sessions: [], label: 'Moderate (15-25 mph)' },
            windy: { min: 25, max: 100, sessions: [], label: 'Windy (> 25 mph)' }
        };

        weatherSessions.forEach(s => {
            const temp = s.weather.temperature;
            const wind = s.weather.windSpeed || 0;
            const condition = s.weather.main || 'Unknown';

            // By condition
            if (!byCondition[condition]) {
                byCondition[condition] = [];
            }
            byCondition[condition].push(s);

            // By temperature
            Object.values(byTemperatureRange).forEach(range => {
                if (temp >= range.min && temp < range.max) {
                    range.sessions.push(s);
                }
            });

            // By wind
            Object.values(byWindSpeed).forEach(range => {
                if (wind >= range.min && wind < range.max) {
                    range.sessions.push(s);
                }
            });
        });

        // Calculate stats for each group
        const calculateGroupStats = (sessions) => {
            if (sessions.length === 0) return null;
            const totalMakes = sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
            const totalAttempts = sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
            const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;
            return {
                count: sessions.length,
                accuracy: accuracy.toFixed(1),
                totalMakes,
                totalAttempts
            };
        };

        const temperatureStats = {};
        let bestTempRange = null;
        let bestTempAccuracy = 0;

        Object.entries(byTemperatureRange).forEach(([key, range]) => {
            const stats = calculateGroupStats(range.sessions);
            if (stats) {
                temperatureStats[key] = { ...range, stats };
                if (parseFloat(stats.accuracy) > bestTempAccuracy && stats.count >= 2) {
                    bestTempAccuracy = parseFloat(stats.accuracy);
                    bestTempRange = key;
                }
            }
        });

        const windStats = {};
        let bestWindRange = null;
        let bestWindAccuracy = 0;

        Object.entries(byWindSpeed).forEach(([key, range]) => {
            const stats = calculateGroupStats(range.sessions);
            if (stats) {
                windStats[key] = { ...range, stats };
                if (parseFloat(stats.accuracy) > bestWindAccuracy && stats.count >= 2) {
                    bestWindAccuracy = parseFloat(stats.accuracy);
                    bestWindRange = key;
                }
            }
        });

        const conditionStats = {};
        let bestCondition = null;
        let bestConditionAccuracy = 0;

        Object.entries(byCondition).forEach(([condition, sessions]) => {
            const stats = calculateGroupStats(sessions);
            if (stats) {
                conditionStats[condition] = stats;
                if (parseFloat(stats.accuracy) > bestConditionAccuracy && stats.count >= 2) {
                    bestConditionAccuracy = parseFloat(stats.accuracy);
                    bestCondition = condition;
                }
            }
        });

        return {
            hasEnoughData: true,
            totalWeatherSessions: weatherSessions.length,
            temperatureStats,
            windStats,
            conditionStats,
            bestTempRange: bestTempRange ? { key: bestTempRange, ...temperatureStats[bestTempRange] } : null,
            bestWindRange: bestWindRange ? { key: bestWindRange, ...windStats[bestWindRange] } : null,
            bestCondition: bestCondition ? { condition: bestCondition, ...conditionStats[bestCondition] } : null,
            insights: this.generateWeatherInsights(temperatureStats, windStats, bestTempRange, bestWindRange)
        };
    }

    /**
     * Generate weather insights
     */
    generateWeatherInsights(tempStats, windStats, bestTemp, bestWind) {
        const insights = [];

        if (bestTemp && tempStats[bestTemp]) {
            insights.push({
                icon: '🌡️',
                text: `You perform best in ${tempStats[bestTemp].label} conditions (${tempStats[bestTemp].stats.accuracy}% accuracy)`
            });
        }

        if (bestWind && windStats[bestWind]) {
            insights.push({
                icon: '💨',
                text: `${windStats[bestWind].label} wind is your sweet spot (${windStats[bestWind].stats.accuracy}% accuracy)`
            });
        }

        // Check for wind sensitivity
        if (windStats.calm?.stats && windStats.windy?.stats) {
            const calmAcc = parseFloat(windStats.calm.stats.accuracy);
            const windyAcc = parseFloat(windStats.windy.stats.accuracy);
            const diff = calmAcc - windyAcc;

            if (diff > 10) {
                insights.push({
                    icon: '🎯',
                    text: `Wind affects you significantly (-${diff.toFixed(0)}% in windy conditions)`
                });
            } else if (diff < -5) {
                insights.push({
                    icon: '💪',
                    text: `Impressive! You actually putt better in wind (+${Math.abs(diff).toFixed(0)}%)`
                });
            }
        }

        return insights;
    }

    /**
     * Generate distance heatmap data
     */
    generateDistanceHeatmap(sessions) {
        if (!sessions || sessions.length < 3) {
            return { hasEnoughData: false, message: 'Need at least 3 sessions for heatmap' };
        }

        // Create distance buckets (5ft increments)
        const buckets = {};
        for (let d = 5; d <= 50; d += 5) {
            buckets[d] = { distance: d, sessions: [], makes: 0, attempts: 0 };
        }

        sessions.forEach(s => {
            const dist = s.distance || 0;
            // Round to nearest 5
            const bucket = Math.round(dist / 5) * 5;
            const key = Math.min(Math.max(bucket, 5), 50);

            if (buckets[key]) {
                buckets[key].sessions.push(s);
                buckets[key].makes += s.makes || 0;
                buckets[key].attempts += s.attempts || 0;
            }
        });

        // Calculate accuracy for each bucket
        const heatmapData = Object.values(buckets).map(bucket => {
            const accuracy = bucket.attempts > 0 ? (bucket.makes / bucket.attempts) * 100 : null;
            return {
                distance: bucket.distance,
                accuracy: accuracy !== null ? parseFloat(accuracy.toFixed(1)) : null,
                sessionCount: bucket.sessions.length,
                makes: bucket.makes,
                attempts: bucket.attempts,
                intensity: this.getHeatmapIntensity(accuracy)
            };
        });

        // Find hot and cold zones
        const validBuckets = heatmapData.filter(b => b.accuracy !== null && b.sessionCount >= 2);
        const hotZone = validBuckets.reduce((best, b) => 
            (!best || b.accuracy > best.accuracy) ? b : best, null);
        const coldZone = validBuckets.reduce((worst, b) => 
            (!worst || b.accuracy < worst.accuracy) ? b : worst, null);

        return {
            hasEnoughData: true,
            heatmapData,
            hotZone,
            coldZone,
            totalSessions: sessions.length
        };
    }

    /**
     * Get heatmap intensity (0-4) based on accuracy
     */
    getHeatmapIntensity(accuracy) {
        if (accuracy === null) return -1;
        if (accuracy >= 80) return 4; // Hot
        if (accuracy >= 65) return 3; // Warm
        if (accuracy >= 50) return 2; // Neutral
        if (accuracy >= 35) return 1; // Cool
        return 0; // Cold
    }

    /**
     * Analyze trends over time
     */
    analyzeTrends(sessions, games = [], routines = []) {
        // Combine all activities
        const allActivities = [
            ...sessions.map(s => ({ ...s, type: 'session', date: s.timestamp || s.date })),
            ...games.map(g => ({ ...g, type: 'game', date: g.endTime || g.timestamp })),
            ...routines.map(r => ({ ...r, type: 'routine', date: r.endTime || r.timestamp }))
        ].filter(a => a.date);

        if (allActivities.length < 5) {
            return { hasEnoughData: false, message: 'Need at least 5 activities for trend analysis' };
        }

        // Sort by date
        allActivities.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Split into periods (first half vs second half)
        const midpoint = Math.floor(allActivities.length / 2);
        const firstHalf = allActivities.slice(0, midpoint);
        const secondHalf = allActivities.slice(midpoint);

        const calculatePeriodStats = (activities) => {
            let totalMakes = 0, totalAttempts = 0, totalPoints = 0;
            
            activities.forEach(a => {
                if (a.type === 'session') {
                    totalMakes += a.makes || 0;
                    totalAttempts += a.attempts || 0;
                    totalPoints += a.points || 0;
                } else if (a.type === 'game') {
                    totalMakes += a.totalMakes || 0;
                    totalAttempts += a.totalAttempts || 0;
                    totalPoints += a.points || 0;
                } else if (a.type === 'routine') {
                    totalMakes += a.totalMakes || 0;
                    totalAttempts += a.totalAttempts || 0;
                    totalPoints += a.points || 0;
                }
            });

            return {
                accuracy: totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0,
                avgPoints: activities.length > 0 ? totalPoints / activities.length : 0,
                totalPoints,
                count: activities.length
            };
        };

        const firstStats = calculatePeriodStats(firstHalf);
        const secondStats = calculatePeriodStats(secondHalf);

        // Calculate trends
        const accuracyTrend = secondStats.accuracy - firstStats.accuracy;
        const pointsTrend = secondStats.avgPoints - firstStats.avgPoints;

        // Weekly activity trend
        const now = new Date();
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

        const thisWeek = allActivities.filter(a => new Date(a.date) >= oneWeekAgo);
        const lastWeek = allActivities.filter(a => {
            const d = new Date(a.date);
            return d >= twoWeeksAgo && d < oneWeekAgo;
        });

        const activityTrend = thisWeek.length - lastWeek.length;

        // Calculate rolling average for chart
        const rollingData = this.calculateRollingAverage(allActivities, 5);

        return {
            hasEnoughData: true,
            accuracyTrend: {
                value: accuracyTrend,
                direction: accuracyTrend > 2 ? 'up' : accuracyTrend < -2 ? 'down' : 'stable',
                label: accuracyTrend > 0 ? `+${accuracyTrend.toFixed(1)}%` : `${accuracyTrend.toFixed(1)}%`
            },
            pointsTrend: {
                value: pointsTrend,
                direction: pointsTrend > 5 ? 'up' : pointsTrend < -5 ? 'down' : 'stable',
                label: pointsTrend > 0 ? `+${pointsTrend.toFixed(0)}` : `${pointsTrend.toFixed(0)}`
            },
            activityTrend: {
                value: activityTrend,
                direction: activityTrend > 0 ? 'up' : activityTrend < 0 ? 'down' : 'stable',
                thisWeek: thisWeek.length,
                lastWeek: lastWeek.length
            },
            firstPeriod: firstStats,
            secondPeriod: secondStats,
            rollingData
        };
    }

    /**
     * Calculate rolling average for trend chart
     */
    calculateRollingAverage(activities, windowSize = 5) {
        const data = [];
        
        for (let i = windowSize - 1; i < activities.length; i++) {
            const window = activities.slice(i - windowSize + 1, i + 1);
            let totalMakes = 0, totalAttempts = 0;
            
            window.forEach(a => {
                totalMakes += a.makes || a.totalMakes || 0;
                totalAttempts += a.attempts || a.totalAttempts || 0;
            });

            const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;
            
            data.push({
                index: i,
                date: activities[i].date,
                accuracy: parseFloat(accuracy.toFixed(1)),
                label: new Date(activities[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }

        return data;
    }

    /**
     * Get personal bests timeline
     */
    getPersonalBests(sessions, games = [], routines = []) {
        const bests = {
            highestAccuracy: null,
            mostMakesSession: null,
            longestDistance: null,
            highestPoints: null,
            bestStreak: null,
            timeline: []
        };

        // Analyze sessions
        sessions.forEach(s => {
            const date = new Date(s.timestamp || s.date);
            
            // Highest accuracy (min 10 attempts)
            if (s.attempts >= 10) {
                if (!bests.highestAccuracy || s.percentage > bests.highestAccuracy.value) {
                    bests.highestAccuracy = {
                        value: s.percentage,
                        date,
                        details: `${s.makes}/${s.attempts} from ${s.distance}ft`,
                        type: 'session'
                    };
                }
            }

            // Most makes in a session
            if (!bests.mostMakesSession || s.makes > bests.mostMakesSession.value) {
                bests.mostMakesSession = {
                    value: s.makes,
                    date,
                    details: `${s.percentage?.toFixed(0)}% from ${s.distance}ft`,
                    type: 'session'
                };
            }

            // Longest distance with 50%+ accuracy
            if (s.percentage >= 50 && s.attempts >= 5) {
                if (!bests.longestDistance || s.distance > bests.longestDistance.value) {
                    bests.longestDistance = {
                        value: s.distance,
                        date,
                        details: `${s.percentage?.toFixed(0)}% accuracy`,
                        type: 'session'
                    };
                }
            }

            // Highest points
            if (!bests.highestPoints || (s.points || 0) > bests.highestPoints.value) {
                bests.highestPoints = {
                    value: s.points || 0,
                    date,
                    details: `${s.makes}/${s.attempts} from ${s.distance}ft`,
                    type: 'session'
                };
            }
        });

        // Check games for high points
        games.forEach(g => {
            const date = new Date(g.endTime || g.timestamp);
            if (!bests.highestPoints || (g.points || 0) > bests.highestPoints.value) {
                bests.highestPoints = {
                    value: g.points || 0,
                    date,
                    details: g.gameName,
                    type: 'game'
                };
            }
        });

        // Build timeline of personal bests
        const allBests = Object.entries(bests)
            .filter(([key, val]) => val && key !== 'timeline' && val.date)
            .map(([key, val]) => ({
                type: key,
                ...val,
                label: this.getBestLabel(key)
            }));

        // Sort by date
        allBests.sort((a, b) => new Date(b.date) - new Date(a.date));
        bests.timeline = allBests;

        return bests;
    }

    /**
     * Get label for personal best type
     */
    getBestLabel(type) {
        const labels = {
            highestAccuracy: '🎯 Best Accuracy',
            mostMakesSession: '✅ Most Makes',
            longestDistance: '📏 Longest Distance',
            highestPoints: '💰 Highest Points',
            bestStreak: '🔥 Longest Streak'
        };
        return labels[type] || type;
    }

    /**
     * Get time-of-day analysis
     */
    analyzeTimeOfDay(sessions) {
        if (!sessions || sessions.length < 5) {
            return { hasEnoughData: false, message: 'Need at least 5 sessions' };
        }

        const timeSlots = {
            earlyMorning: { start: 5, end: 9, sessions: [], label: 'Early Morning (5-9am)', icon: '🌅' },
            morning: { start: 9, end: 12, sessions: [], label: 'Morning (9am-12pm)', icon: '☀️' },
            afternoon: { start: 12, end: 17, sessions: [], label: 'Afternoon (12-5pm)', icon: '🌤️' },
            evening: { start: 17, end: 21, sessions: [], label: 'Evening (5-9pm)', icon: '🌆' },
            night: { start: 21, end: 24, sessions: [], label: 'Night (9pm+)', icon: '🌙' }
        };

        sessions.forEach(s => {
            const hour = new Date(s.timestamp || s.date).getHours();
            
            Object.values(timeSlots).forEach(slot => {
                if (hour >= slot.start && hour < slot.end) {
                    slot.sessions.push(s);
                }
            });
        });

        const slotStats = {};
        let bestSlot = null;
        let bestAccuracy = 0;

        Object.entries(timeSlots).forEach(([key, slot]) => {
            if (slot.sessions.length >= 2) {
                const totalMakes = slot.sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                const totalAttempts = slot.sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                const accuracy = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

                slotStats[key] = {
                    ...slot,
                    accuracy: accuracy.toFixed(1),
                    sessionCount: slot.sessions.length,
                    totalMakes,
                    totalAttempts
                };

                if (accuracy > bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestSlot = key;
                }
            }
        });

        return {
            hasEnoughData: Object.keys(slotStats).length >= 2,
            slotStats,
            bestSlot: bestSlot ? { key: bestSlot, ...slotStats[bestSlot] } : null,
            insight: bestSlot ? 
                `You perform best during ${slotStats[bestSlot].label} with ${slotStats[bestSlot].accuracy}% accuracy` : 
                'Log more sessions at different times to see patterns'
        };
    }
}

// Export singleton
export const advancedAnalyticsManager = new AdvancedAnalyticsManager();
