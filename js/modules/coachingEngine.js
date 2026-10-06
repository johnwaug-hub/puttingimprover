/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Coaching Engine Module
 * Advanced AI-powered practice analysis and recommendations
 * 
 * Features:
 * - Granular distance tracking (specific distances)
 * - Trend analysis (week-over-week, overall)
 * - Consistency scoring
 * - Session fatigue detection
 * - Neglect alerts
 * - Time/day optimization
 * - Skill benchmarks & tiers
 * - Predictive goals
 * - Smart drill prescriptions
 * - Weather-based insights
 */

import { userManager } from './user.js';
import { storageManager } from './storage.js';

// ============================================================================
// LOCAL DATE HELPERS (to avoid UTC timezone issues)
// ============================================================================

/**
 * Get local date string in YYYY-MM-DD format
 * @param {Date|string|number} dateInput - Date object, ISO string, or timestamp
 * @returns {string} Local date string like "2025-01-27"
 */
function getLocalDateString(dateInput = new Date()) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in local YYYY-MM-DD format
 * @returns {string} Yesterday's local date string
 */
function getYesterdayLocalDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Skill tier benchmarks by distance
 * Based on competitive disc golf putting standards
 */
export const SKILL_BENCHMARKS = {
    // Distance in feet: { tier: accuracy% }
    10: { beginner: 70, intermediate: 85, advanced: 92, pro: 97 },
    15: { beginner: 60, intermediate: 75, advanced: 85, pro: 93 },
    20: { beginner: 50, intermediate: 65, advanced: 78, pro: 88 },
    25: { beginner: 40, intermediate: 55, advanced: 70, pro: 82 },
    30: { beginner: 30, intermediate: 45, advanced: 60, pro: 75 },
    33: { beginner: 25, intermediate: 40, advanced: 55, pro: 70 },  // Circle 1 edge
    40: { beginner: 18, intermediate: 30, advanced: 45, pro: 60 },
    50: { beginner: 10, intermediate: 20, advanced: 35, pro: 50 },
};

/**
 * Tracked distances for granular analysis
 */
export const TRACKED_DISTANCES = [10, 15, 20, 25, 30, 33, 40, 50];

/**
 * Distance groupings for broader analysis
 */
export const DISTANCE_GROUPS = {
    layup: { min: 0, max: 10, label: 'Layup (0-10ft)', icon: '🎯' },
    short: { min: 11, max: 15, label: 'Short (11-15ft)', icon: '📍' },
    medium: { min: 16, max: 22, label: 'Medium (16-22ft)', icon: '🎪' },
    circle1: { min: 23, max: 33, label: 'Circle 1 (23-33ft)', icon: '⭕' },
    circle2: { min: 34, max: 66, label: 'Circle 2 (34-66ft)', icon: '🔵' },
};

/**
 * Tier icons and colors
 */
export const TIER_CONFIG = {
    beginner: { icon: '🌱', label: 'Beginner', color: '#78909C' },
    intermediate: { icon: '🌿', label: 'Intermediate', color: '#4CAF50' },
    advanced: { icon: '🌳', label: 'Advanced', color: '#2196F3' },
    pro: { icon: '👑', label: 'Pro', color: '#FFD700' },
};

/**
 * Time slot configuration
 */
const TIME_SLOTS = {
    earlyMorning: { start: 5, end: 8, label: 'Early Morning (5-8am)', icon: '🌅' },
    morning: { start: 8, end: 12, label: 'Morning (8am-12pm)', icon: '☀️' },
    afternoon: { start: 12, end: 17, label: 'Afternoon (12-5pm)', icon: '🌤️' },
    evening: { start: 17, end: 20, label: 'Evening (5-8pm)', icon: '🌆' },
    night: { start: 20, end: 24, label: 'Night (8pm+)', icon: '🌙' },
};

/**
 * Day of week labels
 */
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Neglect threshold in days
 */
const NEGLECT_THRESHOLD_DAYS = 7;

/**
 * Minimum sessions for reliable analysis
 */
const MIN_SESSIONS_FOR_ANALYSIS = 3;
const MIN_SESSIONS_FOR_TRENDS = 5;
const MIN_SESSIONS_FOR_FATIGUE = 3;

/**
 * Smart drill prescriptions based on issues
 */
const DRILL_PRESCRIPTIONS = {
    lowAccuracy: {
        name: 'Foundation Builder',
        desc: 'Focus on form with high-percentage putts',
        steps: [
            'Start at 10ft, make 5 in a row before advancing',
            'Move back 2ft after each success',
            'Reset to 10ft on any miss',
            'Goal: Reach 20ft with solid form'
        ],
        duration: '15-20 mins',
        icon: '🏗️'
    },
    highVariance: {
        name: 'Consistency Drill',
        desc: 'Reduce variance with pressure repetition',
        steps: [
            'Choose your target distance',
            'Make 3 in a row to "bank" a point',
            'Any miss resets your current streak',
            'Goal: Bank 5 points (15 total makes in sets of 3)'
        ],
        duration: '20-25 mins',
        icon: '📊'
    },
    neglectedDistance: {
        name: 'Distance Refresher',
        desc: 'Rebuild confidence at neglected range',
        steps: [
            'Warm up with 10 putts from comfortable distance',
            'Move to neglected distance, make 20 putts',
            'Note your accuracy and how it feels',
            'Add 5-10 putts from this distance to every session'
        ],
        duration: '15-20 mins',
        icon: '🔄'
    },
    fatigue: {
        name: 'Burst Training',
        desc: 'Shorter, more focused sessions',
        steps: [
            'Set a timer for 10 minutes',
            'High intensity: 1 putt every 10 seconds',
            'Take a 2-minute break',
            'Repeat 2-3 times for a full session'
        ],
        duration: '10-15 min bursts',
        icon: '⚡'
    },
    plateaued: {
        name: 'Challenge Ladder',
        desc: 'Break through plateaus with progressive difficulty',
        steps: [
            'Start 5ft behind your comfort zone',
            'Make 2 to advance, miss 2 to retreat',
            'Track your furthest distance each session',
            'Goal: Push your comfortable range back 5ft'
        ],
        duration: '20-30 mins',
        icon: '📈'
    },
    closingOut: {
        name: 'Pressure Closer',
        desc: 'Practice finishing strong',
        steps: [
            'Choose your target distance',
            'Imagine the score: must make this to win',
            'Take 10 "must-make" putts with full pre-shot routine',
            'Track your conversion rate under pressure'
        ],
        duration: '10-15 mins',
        icon: '🎯'
    }
};

// ============================================================================
// COACHING ENGINE CLASS
// ============================================================================

class CoachingEngine {
    constructor() {
        this.userProfile = null;
        this.lastAnalysis = null;
        this.lastAnalysisTime = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minute cache
    }

    // ========================================================================
    // MAIN ANALYSIS METHODS
    // ========================================================================

    /**
     * Generate comprehensive user coaching profile
     * This is the main entry point for getting all coaching data
     */
    async generateCoachingProfile(forceRefresh = false) {
        const user = userManager.getCurrentUser();
        if (!user) return null;

        // Check cache
        if (!forceRefresh && this.lastAnalysis && 
            Date.now() - this.lastAnalysisTime < this.cacheTimeout) {
            return this.lastAnalysis;
        }

        const sessions = userManager.sessions || [];
        const routines = await this.getRoutineCompletions(user.id);
        const games = await this.getGameCompletions(user.id);

        // Combine all activities for analysis
        const allActivities = this.normalizeActivities(sessions, routines, games);

        if (allActivities.length < MIN_SESSIONS_FOR_ANALYSIS) {
            return {
                hasEnoughData: false,
                message: `Log ${MIN_SESSIONS_FOR_ANALYSIS - allActivities.length} more activities to unlock your coaching profile`,
                activitiesLogged: allActivities.length,
                activitiesNeeded: MIN_SESSIONS_FOR_ANALYSIS
            };
        }

        // Generate all analyses
        const distanceProfile = this.analyzeDistanceProfile(allActivities);
        const trends = this.analyzeTrends(allActivities);
        const consistencyScore = this.calculateConsistencyScore(allActivities);
        const fatigueAnalysis = this.analyzeFatigue(allActivities);
        const neglectAlerts = this.generateNeglectAlerts(distanceProfile);
        const timeOptimization = this.analyzeTimeOptimization(allActivities);
        const skillTiers = this.calculateSkillTiers(distanceProfile);
        const predictions = this.generatePredictions(distanceProfile, trends);
        
        // Get community comparison data
        const communityComparison = await this.generateCommunityComparison(distanceProfile);
        
        const recommendations = this.generateSmartRecommendations({
            distanceProfile,
            trends,
            consistencyScore,
            fatigueAnalysis,
            neglectAlerts,
            skillTiers,
            predictions,
            communityComparison
        });
        const focusAreas = this.determineFocusAreas(recommendations);
        const drillPrescription = this.prescribeDrill(recommendations, distanceProfile);
        const overallTier = this.calculateOverallTier(skillTiers);
        const weeklyProgress = this.calculateWeeklyProgress(allActivities);
        const streakInfo = this.getStreakInfo(allActivities);

        // Get weather insights if available
        const weatherInsights = await this.analyzeWeatherImpact(allActivities, user);

        const profile = {
            hasEnoughData: true,
            generatedAt: new Date().toISOString(),
            user: {
                id: user.id,
                name: user.displayName,
                totalSessions: sessions.length,
                totalRoutines: routines.length,
                totalGames: games.length,
                totalActivities: allActivities.length
            },
            distanceProfile,
            trends,
            consistencyScore,
            fatigueAnalysis,
            neglectAlerts,
            timeOptimization,
            skillTiers,
            overallTier,
            predictions,
            recommendations,
            focusAreas,
            drillPrescription,
            weeklyProgress,
            streakInfo,
            weatherInsights,
            communityComparison
        };

        // Cache the result
        this.lastAnalysis = profile;
        this.lastAnalysisTime = Date.now();

        return profile;
    }

    /**
     * Quick summary for dashboard card
     */
    async getQuickInsights() {
        const profile = await this.generateCoachingProfile();
        if (!profile || !profile.hasEnoughData) {
            return profile;
        }

        return {
            hasEnoughData: true,
            primaryFocus: profile.focusAreas[0] || null,
            overallTier: profile.overallTier,
            weeklyTrend: profile.trends.weeklyTrend,
            topRecommendation: profile.recommendations[0] || null,
            neglectAlert: profile.neglectAlerts[0] || null,
            consistencyScore: profile.consistencyScore,
            quickDrill: profile.drillPrescription
        };
    }

    // ========================================================================
    // DISTANCE PROFILE ANALYSIS
    // ========================================================================

    /**
     * Analyze accuracy and performance by specific distances
     */
    analyzeDistanceProfile(activities) {
        const profile = {};

        // Initialize all tracked distances
        TRACKED_DISTANCES.forEach(dist => {
            profile[dist] = {
                distance: dist,
                sessions: [],
                totalMakes: 0,
                totalAttempts: 0,
                accuracy: null,
                sessionCount: 0,
                lastPracticed: null,
                daysSinceLastPractice: null,
                recentAccuracy: null, // Last 7 days
                historicalAccuracy: null, // Older than 7 days
                trend: 0, // Positive = improving, negative = declining
                variance: null, // Consistency measure
                accuracyHistory: [], // For sparkline
                tier: null
            };
        });

        // Also track by distance groups
        const groupStats = {};
        Object.keys(DISTANCE_GROUPS).forEach(key => {
            groupStats[key] = {
                ...DISTANCE_GROUPS[key],
                totalMakes: 0,
                totalAttempts: 0,
                accuracy: null,
                sessionCount: 0
            };
        });

        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Process each activity
        activities.forEach(activity => {
            const dist = activity.distance;
            const activityDate = new Date(activity.timestamp || activity.date);
            const isRecent = activityDate >= sevenDaysAgo;

            // Find closest tracked distance
            const trackedDist = this.findClosestTrackedDistance(dist);
            
            if (trackedDist && profile[trackedDist]) {
                const p = profile[trackedDist];
                p.sessions.push(activity);
                p.totalMakes += activity.makes || 0;
                p.totalAttempts += activity.attempts || 0;
                p.sessionCount++;

                // Track last practiced
                if (!p.lastPracticed || activityDate > new Date(p.lastPracticed)) {
                    p.lastPracticed = activityDate.toISOString();
                }

                // Track accuracy history for trend/sparkline
                if (activity.percentage !== undefined) {
                    p.accuracyHistory.push({
                        date: activityDate.toISOString(),
                        accuracy: activity.percentage,
                        isRecent
                    });
                }
            }

            // Track by distance group
            const groupKey = this.getDistanceGroup(dist);
            if (groupKey && groupStats[groupKey]) {
                groupStats[groupKey].totalMakes += activity.makes || 0;
                groupStats[groupKey].totalAttempts += activity.attempts || 0;
                groupStats[groupKey].sessionCount++;
            }
        });

        // Calculate derived stats for each tracked distance
        Object.keys(profile).forEach(dist => {
            const p = profile[dist];

            // Overall accuracy
            if (p.totalAttempts > 0) {
                p.accuracy = parseFloat(((p.totalMakes / p.totalAttempts) * 100).toFixed(1));
            }

            // Days since last practice
            if (p.lastPracticed) {
                const daysDiff = Math.floor((now - new Date(p.lastPracticed)) / (1000 * 60 * 60 * 24));
                p.daysSinceLastPractice = daysDiff;
            }

            // Recent vs historical accuracy
            const recentSessions = p.accuracyHistory.filter(h => h.isRecent);
            const historicalSessions = p.accuracyHistory.filter(h => !h.isRecent);

            if (recentSessions.length > 0) {
                const recentAvg = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
                p.recentAccuracy = parseFloat(recentAvg.toFixed(1));
            }

            if (historicalSessions.length > 0) {
                const histAvg = historicalSessions.reduce((sum, s) => sum + s.accuracy, 0) / historicalSessions.length;
                p.historicalAccuracy = parseFloat(histAvg.toFixed(1));
            }

            // Calculate trend
            if (p.recentAccuracy !== null && p.historicalAccuracy !== null) {
                p.trend = parseFloat((p.recentAccuracy - p.historicalAccuracy).toFixed(1));
            }

            // Calculate variance (standard deviation of accuracy)
            if (p.accuracyHistory.length >= 3) {
                const accuracies = p.accuracyHistory.map(h => h.accuracy);
                const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
                const squareDiffs = accuracies.map(a => Math.pow(a - mean, 2));
                const variance = squareDiffs.reduce((a, b) => a + b, 0) / accuracies.length;
                p.variance = parseFloat(Math.sqrt(variance).toFixed(1));
            }

            // Determine skill tier for this distance
            if (p.accuracy !== null) {
                p.tier = this.getTierForDistance(parseInt(dist), p.accuracy);
            }

            // Sort accuracy history by date for sparkline
            p.accuracyHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        // Calculate group stats
        Object.keys(groupStats).forEach(key => {
            const g = groupStats[key];
            if (g.totalAttempts > 0) {
                g.accuracy = parseFloat(((g.totalMakes / g.totalAttempts) * 100).toFixed(1));
            }
        });

        return {
            byDistance: profile,
            byGroup: groupStats,
            trackedDistances: TRACKED_DISTANCES,
            distanceGroups: DISTANCE_GROUPS
        };
    }

    /**
     * Find the closest tracked distance to a given distance
     */
    findClosestTrackedDistance(distance) {
        if (!distance || distance <= 0) return null;

        let closest = TRACKED_DISTANCES[0];
        let minDiff = Math.abs(distance - closest);

        TRACKED_DISTANCES.forEach(d => {
            const diff = Math.abs(distance - d);
            if (diff < minDiff) {
                minDiff = diff;
                closest = d;
            }
        });

        // Only map if within 3 feet
        return minDiff <= 3 ? closest : null;
    }

    /**
     * Get distance group for a given distance
     */
    getDistanceGroup(distance) {
        for (const [key, group] of Object.entries(DISTANCE_GROUPS)) {
            if (distance >= group.min && distance <= group.max) {
                return key;
            }
        }
        return null;
    }

    // ========================================================================
    // TREND ANALYSIS
    // ========================================================================

    /**
     * Analyze trends over time
     */
    analyzeTrends(activities) {
        if (activities.length < MIN_SESSIONS_FOR_TRENDS) {
            return {
                hasEnoughData: false,
                message: `Need ${MIN_SESSIONS_FOR_TRENDS - activities.length} more activities for trend analysis`
            };
        }

        const now = new Date();
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        // Split activities by time period
        const thisWeek = activities.filter(a => new Date(a.timestamp || a.date) >= oneWeekAgo);
        const lastWeek = activities.filter(a => {
            const d = new Date(a.timestamp || a.date);
            return d >= twoWeeksAgo && d < oneWeekAgo;
        });
        const thisMonth = activities.filter(a => new Date(a.timestamp || a.date) >= oneMonthAgo);

        // Calculate averages
        const calcAverage = (arr) => {
            if (arr.length === 0) return null;
            const totalMakes = arr.reduce((sum, a) => sum + (a.makes || 0), 0);
            const totalAttempts = arr.reduce((sum, a) => sum + (a.attempts || 0), 0);
            return totalAttempts > 0 ? parseFloat(((totalMakes / totalAttempts) * 100).toFixed(1)) : null;
        };

        const thisWeekAvg = calcAverage(thisWeek);
        const lastWeekAvg = calcAverage(lastWeek);
        const thisMonthAvg = calcAverage(thisMonth);
        const overallAvg = calcAverage(activities);

        // Weekly trend
        let weeklyTrend = null;
        let weeklyTrendLabel = 'stable';
        if (thisWeekAvg !== null && lastWeekAvg !== null) {
            weeklyTrend = parseFloat((thisWeekAvg - lastWeekAvg).toFixed(1));
            if (weeklyTrend >= 3) weeklyTrendLabel = 'improving';
            else if (weeklyTrend <= -3) weeklyTrendLabel = 'declining';
        }

        // Activity frequency trends
        const thisWeekCount = thisWeek.length;
        const lastWeekCount = lastWeek.length;
        const frequencyTrend = thisWeekCount - lastWeekCount;

        // Volume trends
        const thisWeekVolume = thisWeek.reduce((sum, a) => sum + (a.attempts || 0), 0);
        const lastWeekVolume = lastWeek.reduce((sum, a) => sum + (a.attempts || 0), 0);
        const volumeTrend = lastWeekVolume > 0 
            ? parseFloat((((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100).toFixed(1))
            : null;

        // Identify best and worst performing weeks/days
        const dailyPerformance = this.analyzeDailyPerformance(activities);

        return {
            hasEnoughData: true,
            thisWeek: {
                accuracy: thisWeekAvg,
                sessions: thisWeekCount,
                volume: thisWeekVolume
            },
            lastWeek: {
                accuracy: lastWeekAvg,
                sessions: lastWeekCount,
                volume: lastWeekVolume
            },
            thisMonth: {
                accuracy: thisMonthAvg,
                sessions: thisMonth.length,
                volume: thisMonth.reduce((sum, a) => sum + (a.attempts || 0), 0)
            },
            overall: {
                accuracy: overallAvg,
                sessions: activities.length
            },
            weeklyTrend,
            weeklyTrendLabel,
            frequencyTrend,
            volumeTrend,
            dailyPerformance
        };
    }

    /**
     * Analyze performance by day of week
     */
    analyzeDailyPerformance(activities) {
        const byDay = {};
        DAYS_OF_WEEK.forEach((day, index) => {
            byDay[index] = { day, sessions: [], totalMakes: 0, totalAttempts: 0 };
        });

        activities.forEach(a => {
            const dayIndex = new Date(a.timestamp || a.date).getDay();
            byDay[dayIndex].sessions.push(a);
            byDay[dayIndex].totalMakes += a.makes || 0;
            byDay[dayIndex].totalAttempts += a.attempts || 0;
        });

        // Calculate accuracy and find best/worst
        let bestDay = null;
        let bestAccuracy = 0;
        let worstDay = null;
        let worstAccuracy = 100;

        Object.keys(byDay).forEach(key => {
            const d = byDay[key];
            if (d.totalAttempts >= 10) { // Minimum threshold
                d.accuracy = parseFloat(((d.totalMakes / d.totalAttempts) * 100).toFixed(1));
                if (d.accuracy > bestAccuracy) {
                    bestAccuracy = d.accuracy;
                    bestDay = d.day;
                }
                if (d.accuracy < worstAccuracy) {
                    worstAccuracy = d.accuracy;
                    worstDay = d.day;
                }
            }
        });

        return {
            byDay,
            bestDay: bestDay ? { day: bestDay, accuracy: bestAccuracy } : null,
            worstDay: worstDay ? { day: worstDay, accuracy: worstAccuracy } : null
        };
    }

    // ========================================================================
    // CONSISTENCY ANALYSIS
    // ========================================================================

    /**
     * Calculate overall consistency score (0-100)
     * Higher = more consistent performance
     */
    calculateConsistencyScore(activities) {
        if (activities.length < MIN_SESSIONS_FOR_ANALYSIS) {
            return { score: null, label: 'Need more data' };
        }

        // Get accuracy values
        const accuracies = activities
            .filter(a => a.percentage !== undefined && a.attempts >= 5)
            .map(a => a.percentage);

        if (accuracies.length < 3) {
            return { score: null, label: 'Need more data' };
        }

        // Calculate variance
        const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
        const squareDiffs = accuracies.map(a => Math.pow(a - mean, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / accuracies.length;
        const stdDev = Math.sqrt(variance);

        // Convert to 0-100 score (lower variance = higher score)
        // Typical std dev ranges from 5 (very consistent) to 25 (inconsistent)
        const normalizedScore = Math.max(0, Math.min(100, 100 - (stdDev * 4)));
        const score = Math.round(normalizedScore);

        // Determine label
        let label, icon, description;
        if (score >= 85) {
            label = 'Excellent';
            icon = '🎯';
            description = 'Your putting is highly consistent';
        } else if (score >= 70) {
            label = 'Good';
            icon = '✅';
            description = 'Pretty consistent with minor fluctuations';
        } else if (score >= 50) {
            label = 'Fair';
            icon = '📊';
            description = 'Some variability in your performance';
        } else {
            label = 'Needs Work';
            icon = '📈';
            description = 'Your accuracy varies significantly session to session';
        }

        return {
            score,
            label,
            icon,
            description,
            stdDev: parseFloat(stdDev.toFixed(1)),
            meanAccuracy: parseFloat(mean.toFixed(1)),
            range: {
                min: Math.min(...accuracies).toFixed(1),
                max: Math.max(...accuracies).toFixed(1)
            }
        };
    }

    // ========================================================================
    // FATIGUE ANALYSIS
    // ========================================================================

    /**
     * Detect fatigue patterns in sessions
     * Compares performance in first half vs second half of sessions
     */
    analyzeFatigue(activities) {
        // Need sessions with enough attempts to split
        const qualifiedSessions = activities.filter(a => 
            a.attempts >= 20 && a.firstHalfAccuracy !== undefined && a.secondHalfAccuracy !== undefined
        );

        // If we don't have split data, try to estimate from session length
        if (qualifiedSessions.length < MIN_SESSIONS_FOR_FATIGUE) {
            // Analyze by position in session (if we had granular data)
            // For now, analyze by session duration proxy (more attempts = potential fatigue)
            const longSessions = activities.filter(a => a.attempts >= 40);
            const shortSessions = activities.filter(a => a.attempts >= 10 && a.attempts < 30);

            if (longSessions.length >= 2 && shortSessions.length >= 2) {
                const longAvg = longSessions.reduce((sum, a) => sum + (a.percentage || 0), 0) / longSessions.length;
                const shortAvg = shortSessions.reduce((sum, a) => sum + (a.percentage || 0), 0) / shortSessions.length;
                const dropoff = shortAvg - longAvg;

                if (dropoff > 5) {
                    return {
                        detected: true,
                        type: 'session_length',
                        dropoff: parseFloat(dropoff.toFixed(1)),
                        recommendation: `Your accuracy is ${dropoff.toFixed(0)}% lower in longer sessions. Consider shorter, more focused practice.`,
                        optimalPutts: 30,
                        icon: '⚡'
                    };
                }
            }

            return {
                detected: false,
                message: 'No fatigue pattern detected',
                recommendation: 'Keep monitoring your performance throughout sessions'
            };
        }

        // Analyze first half vs second half
        let totalDropoff = 0;
        qualifiedSessions.forEach(s => {
            totalDropoff += (s.firstHalfAccuracy - s.secondHalfAccuracy);
        });
        const avgDropoff = totalDropoff / qualifiedSessions.length;

        if (avgDropoff > 5) {
            // Find optimal stopping point
            const attempts = qualifiedSessions.map(s => s.attempts);
            const avgAttempts = attempts.reduce((a, b) => a + b, 0) / attempts.length;
            const optimalPutts = Math.round(avgAttempts * 0.6); // 60% of typical session

            return {
                detected: true,
                type: 'mid_session',
                dropoff: parseFloat(avgDropoff.toFixed(1)),
                recommendation: `Your accuracy drops ${avgDropoff.toFixed(0)}% in the second half of sessions.`,
                optimalPutts,
                icon: '⚡'
            };
        }

        return {
            detected: false,
            message: 'No significant fatigue pattern',
            recommendation: 'Your stamina looks good!'
        };
    }

    // ========================================================================
    // NEGLECT ALERTS
    // ========================================================================

    /**
     * Generate alerts for neglected distances
     */
    generateNeglectAlerts(distanceProfile) {
        const alerts = [];
        const now = new Date();

        Object.entries(distanceProfile.byDistance).forEach(([distance, stats]) => {
            const daysSince = stats.daysSinceLastPractice;

            // Never practiced
            if (daysSince === null && parseInt(distance) <= 33) { // Only alert for Circle 1 distances
                alerts.push({
                    distance: parseInt(distance),
                    type: 'never_practiced',
                    severity: 'medium',
                    message: `You've never logged practice from ${distance}ft`,
                    recommendation: `Add some ${distance}ft putts to your next session`,
                    icon: '❓'
                });
            }
            // Neglected (hasn't practiced in threshold days)
            else if (daysSince !== null && daysSince >= NEGLECT_THRESHOLD_DAYS) {
                const severity = daysSince >= 14 ? 'high' : 'medium';
                alerts.push({
                    distance: parseInt(distance),
                    type: 'neglected',
                    severity,
                    daysSince,
                    lastAccuracy: stats.accuracy,
                    message: `${distance}ft: ${daysSince} days since last practice`,
                    recommendation: `Your ${distance}ft data is getting stale. Add 10-15 putts from here.`,
                    icon: daysSince >= 14 ? '🚨' : '⚠️'
                });
            }
            // Low session count
            else if (stats.sessionCount > 0 && stats.sessionCount < 3 && parseInt(distance) <= 33) {
                alerts.push({
                    distance: parseInt(distance),
                    type: 'low_data',
                    severity: 'low',
                    sessionCount: stats.sessionCount,
                    message: `Only ${stats.sessionCount} sessions logged from ${distance}ft`,
                    recommendation: `More data needed for reliable insights at this distance`,
                    icon: '📊'
                });
            }
        });

        // Sort by severity
        const severityOrder = { high: 0, medium: 1, low: 2 };
        alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return alerts;
    }

    // ========================================================================
    // TIME OPTIMIZATION
    // ========================================================================

    /**
     * Analyze performance by time of day and day of week
     */
    analyzeTimeOptimization(activities) {
        // By time of day
        const byTime = {};
        Object.keys(TIME_SLOTS).forEach(key => {
            byTime[key] = {
                ...TIME_SLOTS[key],
                sessions: [],
                totalMakes: 0,
                totalAttempts: 0,
                accuracy: null
            };
        });

        activities.forEach(a => {
            const hour = new Date(a.timestamp || a.date).getHours();
            const timeSlot = this.getTimeSlot(hour);
            if (timeSlot && byTime[timeSlot]) {
                byTime[timeSlot].sessions.push(a);
                byTime[timeSlot].totalMakes += a.makes || 0;
                byTime[timeSlot].totalAttempts += a.attempts || 0;
            }
        });

        // Calculate accuracies and find best
        let bestTime = null;
        let bestTimeAccuracy = 0;
        let worstTime = null;
        let worstTimeAccuracy = 100;

        Object.keys(byTime).forEach(key => {
            const t = byTime[key];
            if (t.totalAttempts >= 20) {
                t.accuracy = parseFloat(((t.totalMakes / t.totalAttempts) * 100).toFixed(1));
                if (t.accuracy > bestTimeAccuracy) {
                    bestTimeAccuracy = t.accuracy;
                    bestTime = key;
                }
                if (t.accuracy < worstTimeAccuracy) {
                    worstTimeAccuracy = t.accuracy;
                    worstTime = key;
                }
            }
        });

        return {
            byTime,
            bestTime: bestTime ? {
                slot: bestTime,
                ...byTime[bestTime],
                recommendation: `Schedule important practice during ${byTime[bestTime].label}`
            } : null,
            worstTime: worstTime && worstTime !== bestTime ? {
                slot: worstTime,
                ...byTime[worstTime]
            } : null,
            timeDifference: bestTime && worstTime ? 
                parseFloat((bestTimeAccuracy - worstTimeAccuracy).toFixed(1)) : null
        };
    }

    /**
     * Get time slot for a given hour
     */
    getTimeSlot(hour) {
        for (const [key, slot] of Object.entries(TIME_SLOTS)) {
            if (hour >= slot.start && hour < slot.end) {
                return key;
            }
        }
        return 'night';
    }

    // ========================================================================
    // SKILL TIERS
    // ========================================================================

    /**
     * Calculate skill tier for each distance
     */
    calculateSkillTiers(distanceProfile) {
        const tiers = {};

        Object.entries(distanceProfile.byDistance).forEach(([distance, stats]) => {
            if (stats.accuracy !== null && stats.sessionCount >= 2) {
                const tier = this.getTierForDistance(parseInt(distance), stats.accuracy);
                tiers[distance] = {
                    distance: parseInt(distance),
                    accuracy: stats.accuracy,
                    tier,
                    ...TIER_CONFIG[tier],
                    nextTier: this.getNextTierTarget(parseInt(distance), stats.accuracy)
                };
            }
        });

        return tiers;
    }

    /**
     * Get tier for a specific distance and accuracy
     */
    getTierForDistance(distance, accuracy) {
        const benchmarks = SKILL_BENCHMARKS[distance];
        if (!benchmarks) {
            // Find closest benchmark
            const closest = TRACKED_DISTANCES.reduce((prev, curr) => 
                Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
            );
            return this.getTierForDistance(closest, accuracy);
        }

        if (accuracy >= benchmarks.pro) return 'pro';
        if (accuracy >= benchmarks.advanced) return 'advanced';
        if (accuracy >= benchmarks.intermediate) return 'intermediate';
        return 'beginner';
    }

    /**
     * Get target accuracy for next tier
     */
    getNextTierTarget(distance, currentAccuracy) {
        const benchmarks = SKILL_BENCHMARKS[distance];
        if (!benchmarks) return null;

        if (currentAccuracy < benchmarks.intermediate) {
            return { tier: 'intermediate', target: benchmarks.intermediate, gap: benchmarks.intermediate - currentAccuracy };
        }
        if (currentAccuracy < benchmarks.advanced) {
            return { tier: 'advanced', target: benchmarks.advanced, gap: benchmarks.advanced - currentAccuracy };
        }
        if (currentAccuracy < benchmarks.pro) {
            return { tier: 'pro', target: benchmarks.pro, gap: benchmarks.pro - currentAccuracy };
        }
        return { tier: 'pro', target: benchmarks.pro, gap: 0, maxed: true };
    }

    /**
     * Calculate overall tier based on weighted average across distances
     */
    calculateOverallTier(skillTiers) {
        const tierValues = { beginner: 1, intermediate: 2, advanced: 3, pro: 4 };
        const weights = { 10: 0.5, 15: 1, 20: 1.5, 25: 2, 30: 2, 33: 1.5, 40: 1, 50: 0.5 };

        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(skillTiers).forEach(([distance, data]) => {
            const weight = weights[distance] || 1;
            weightedSum += tierValues[data.tier] * weight;
            totalWeight += weight;
        });

        if (totalWeight === 0) return { tier: 'beginner', ...TIER_CONFIG.beginner };

        const avgValue = weightedSum / totalWeight;

        let tier;
        if (avgValue >= 3.5) tier = 'pro';
        else if (avgValue >= 2.5) tier = 'advanced';
        else if (avgValue >= 1.5) tier = 'intermediate';
        else tier = 'beginner';

        return { tier, ...TIER_CONFIG[tier], score: parseFloat(avgValue.toFixed(2)) };
    }

    // ========================================================================
    // PREDICTIONS
    // ========================================================================

    /**
     * Generate predictions based on current trends
     */
    generatePredictions(distanceProfile, trends) {
        const predictions = [];

        if (!trends.hasEnoughData) return predictions;

        // For each distance with a positive trend, predict when they'll reach next tier
        Object.entries(distanceProfile.byDistance).forEach(([distance, stats]) => {
            if (stats.trend > 0 && stats.accuracy !== null && stats.sessionCount >= 3) {
                const nextTier = this.getNextTierTarget(parseInt(distance), stats.accuracy);
                if (nextTier && !nextTier.maxed && nextTier.gap > 0) {
                    // Estimate sessions needed based on improvement rate
                    const weeklyImprovement = stats.trend; // % per week
                    if (weeklyImprovement > 0) {
                        const weeksNeeded = Math.ceil(nextTier.gap / weeklyImprovement);
                        predictions.push({
                            type: 'tier_prediction',
                            distance: parseInt(distance),
                            currentAccuracy: stats.accuracy,
                            currentTier: stats.tier,
                            targetTier: nextTier.tier,
                            targetAccuracy: nextTier.target,
                            gap: parseFloat(nextTier.gap.toFixed(1)),
                            weeksNeeded,
                            sessionsNeeded: weeksNeeded * 3, // Assuming 3 sessions per week
                            message: `At your current pace, you'll reach ${TIER_CONFIG[nextTier.tier].label} at ${distance}ft in ~${weeksNeeded} weeks`,
                            icon: '📈'
                        });
                    }
                }
            }
        });

        // Add consistency prediction
        if (trends.weeklyTrendLabel === 'improving') {
            predictions.push({
                type: 'improvement',
                message: `You're trending up ${trends.weeklyTrend}% this week. Keep it up!`,
                icon: '🚀'
            });
        } else if (trends.weeklyTrendLabel === 'declining') {
            predictions.push({
                type: 'decline',
                message: `Your accuracy dipped ${Math.abs(trends.weeklyTrend)}% this week. Time to refocus.`,
                icon: '⚠️'
            });
        }

        return predictions;
    }

    // ========================================================================
    // SMART RECOMMENDATIONS
    // ========================================================================

    /**
     * Generate prioritized recommendations
     */
    generateSmartRecommendations(data) {
        const recommendations = [];
        const { distanceProfile, trends, consistencyScore, fatigueAnalysis, neglectAlerts, skillTiers, predictions } = data;

        // Priority 1: Critical neglect alerts
        neglectAlerts.filter(a => a.severity === 'high').forEach(alert => {
            recommendations.push({
                priority: 1,
                type: 'neglect',
                icon: alert.icon,
                title: `Practice ${alert.distance}ft`,
                desc: alert.recommendation,
                distance: alert.distance,
                actionable: true,
                action: 'Add to next session'
            });
        });

        // Priority 2: Declining trends
        if (trends.hasEnoughData && trends.weeklyTrendLabel === 'declining') {
            recommendations.push({
                priority: 2,
                type: 'trend',
                icon: '📉',
                title: 'Accuracy Declining',
                desc: `Your accuracy dropped ${Math.abs(trends.weeklyTrend)}% this week. Focus on fundamentals.`,
                actionable: true,
                action: 'Start Foundation Builder drill'
            });
        }

        // Priority 3: Consistency issues
        if (consistencyScore.score !== null && consistencyScore.score < 50) {
            recommendations.push({
                priority: 3,
                type: 'consistency',
                icon: '📊',
                title: 'Improve Consistency',
                desc: `Your accuracy varies by ${consistencyScore.range.max - consistencyScore.range.min}% between sessions.`,
                actionable: true,
                action: 'Try the Consistency Drill'
            });
        }

        // Priority 4: Fatigue management
        if (fatigueAnalysis.detected) {
            recommendations.push({
                priority: 4,
                type: 'fatigue',
                icon: fatigueAnalysis.icon,
                title: 'Manage Fatigue',
                desc: fatigueAnalysis.recommendation,
                actionable: true,
                action: `Try ${fatigueAnalysis.optimalPutts}-putt sessions`
            });
        }

        // Priority 5: Weakest distance (below tier)
        const weakest = this.findWeakestDistance(distanceProfile, skillTiers);
        if (weakest) {
            recommendations.push({
                priority: 5,
                type: 'weakness',
                icon: '🎯',
                title: `Focus on ${weakest.distance}ft`,
                desc: `Your ${weakest.distance}ft accuracy (${weakest.accuracy}%) is holding you back.`,
                distance: weakest.distance,
                currentTier: weakest.tier,
                actionable: true,
                action: 'Start targeted practice'
            });
        }

        // Priority 6: Medium neglect alerts
        neglectAlerts.filter(a => a.severity === 'medium').slice(0, 2).forEach(alert => {
            recommendations.push({
                priority: 6,
                type: 'neglect',
                icon: alert.icon,
                title: `${alert.distance}ft Getting Stale`,
                desc: alert.recommendation,
                distance: alert.distance,
                actionable: true,
                action: 'Add 10 putts'
            });
        });

        // Priority 7: Time optimization
        const timeOpt = data.timeOptimization;
        if (timeOpt && timeOpt.bestTime && timeOpt.timeDifference && timeOpt.timeDifference >= 5) {
            recommendations.push({
                priority: 7,
                type: 'time',
                icon: timeOpt.bestTime.icon,
                title: `Best Time: ${timeOpt.byTime[timeOpt.bestTime.slot].label}`,
                desc: `You putt ${timeOpt.timeDifference}% better during this time.`,
                actionable: false
            });
        }

        // Priority 8: Positive reinforcement
        if (trends.hasEnoughData && trends.weeklyTrendLabel === 'improving') {
            recommendations.push({
                priority: 8,
                type: 'positive',
                icon: '🌟',
                title: 'Great Progress!',
                desc: `You've improved ${trends.weeklyTrend}% this week. Keep the momentum!`,
                actionable: false
            });
        }

        // Sort by priority and limit
        recommendations.sort((a, b) => a.priority - b.priority);
        return recommendations.slice(0, 5);
    }

    /**
     * Find the weakest distance that's holding the player back
     */
    findWeakestDistance(distanceProfile, skillTiers) {
        let weakest = null;
        let lowestTierValue = 5;
        const tierValues = { beginner: 1, intermediate: 2, advanced: 3, pro: 4 };

        // Focus on Circle 1 distances (most important)
        [15, 20, 25, 30, 33].forEach(dist => {
            const stats = distanceProfile.byDistance[dist];
            const tierData = skillTiers[dist];

            if (stats && tierData && stats.sessionCount >= 2) {
                const tierValue = tierValues[tierData.tier];
                if (tierValue < lowestTierValue) {
                    lowestTierValue = tierValue;
                    weakest = {
                        distance: dist,
                        accuracy: stats.accuracy,
                        tier: tierData.tier,
                        tierLabel: tierData.label
                    };
                }
            }
        });

        return weakest;
    }

    /**
     * Determine top focus areas
     */
    determineFocusAreas(recommendations) {
        return recommendations
            .filter(r => r.actionable && r.distance)
            .slice(0, 3)
            .map(r => ({
                distance: r.distance,
                reason: r.title,
                type: r.type
            }));
    }

    /**
     * Prescribe the most appropriate drill
     */
    prescribeDrill(recommendations, distanceProfile) {
        // Determine the primary issue
        const topRec = recommendations[0];
        if (!topRec) return DRILL_PRESCRIPTIONS.lowAccuracy;

        switch (topRec.type) {
            case 'consistency':
                return { ...DRILL_PRESCRIPTIONS.highVariance, reason: topRec.desc };
            case 'neglect':
                return { 
                    ...DRILL_PRESCRIPTIONS.neglectedDistance, 
                    reason: topRec.desc,
                    targetDistance: topRec.distance 
                };
            case 'fatigue':
                return { ...DRILL_PRESCRIPTIONS.fatigue, reason: topRec.desc };
            case 'trend':
                return { ...DRILL_PRESCRIPTIONS.lowAccuracy, reason: topRec.desc };
            case 'weakness':
                return { 
                    ...DRILL_PRESCRIPTIONS.plateaued, 
                    reason: topRec.desc,
                    targetDistance: topRec.distance 
                };
            default:
                return { ...DRILL_PRESCRIPTIONS.closingOut, reason: 'Sharpen your finishing' };
        }
    }

    // ========================================================================
    // WEATHER IMPACT ANALYSIS
    // ========================================================================

    /**
     * Analyze how weather affects performance
     */
    async analyzeWeatherImpact(activities, user) {
        // Check if user has weather tracking enabled
        if (!user.weatherEnabled) {
            return { available: false, message: 'Enable weather tracking for insights' };
        }

        // Filter activities with weather data
        const withWeather = activities.filter(a => a.weather);
        if (withWeather.length < 5) {
            return { available: false, message: 'Need more sessions with weather data' };
        }

        // Group by conditions
        const byCondition = {
            wind: { calm: [], light: [], moderate: [], strong: [] },
            temp: { cold: [], cool: [], warm: [], hot: [] }
        };

        withWeather.forEach(a => {
            const w = a.weather;

            // Wind categories
            if (w.windSpeed !== undefined) {
                if (w.windSpeed < 5) byCondition.wind.calm.push(a);
                else if (w.windSpeed < 10) byCondition.wind.light.push(a);
                else if (w.windSpeed < 15) byCondition.wind.moderate.push(a);
                else byCondition.wind.strong.push(a);
            }

            // Temperature categories (Fahrenheit)
            if (w.temp !== undefined) {
                if (w.temp < 50) byCondition.temp.cold.push(a);
                else if (w.temp < 70) byCondition.temp.cool.push(a);
                else if (w.temp < 85) byCondition.temp.warm.push(a);
                else byCondition.temp.hot.push(a);
            }
        });

        // Calculate accuracies
        const calcGroupAccuracy = (arr) => {
            if (arr.length < 2) return null;
            const makes = arr.reduce((sum, a) => sum + (a.makes || 0), 0);
            const attempts = arr.reduce((sum, a) => sum + (a.attempts || 0), 0);
            return attempts > 0 ? parseFloat(((makes / attempts) * 100).toFixed(1)) : null;
        };

        const windImpact = {
            calm: calcGroupAccuracy(byCondition.wind.calm),
            light: calcGroupAccuracy(byCondition.wind.light),
            moderate: calcGroupAccuracy(byCondition.wind.moderate),
            strong: calcGroupAccuracy(byCondition.wind.strong)
        };

        const tempImpact = {
            cold: calcGroupAccuracy(byCondition.temp.cold),
            cool: calcGroupAccuracy(byCondition.temp.cool),
            warm: calcGroupAccuracy(byCondition.temp.warm),
            hot: calcGroupAccuracy(byCondition.temp.hot)
        };

        // Find optimal conditions
        let bestWind = null, bestWindAcc = 0;
        Object.entries(windImpact).forEach(([cond, acc]) => {
            if (acc !== null && acc > bestWindAcc) {
                bestWindAcc = acc;
                bestWind = cond;
            }
        });

        let bestTemp = null, bestTempAcc = 0;
        Object.entries(tempImpact).forEach(([cond, acc]) => {
            if (acc !== null && acc > bestTempAcc) {
                bestTempAcc = acc;
                bestTemp = cond;
            }
        });

        return {
            available: true,
            windImpact,
            tempImpact,
            bestConditions: {
                wind: bestWind ? { condition: bestWind, accuracy: bestWindAcc } : null,
                temp: bestTemp ? { condition: bestTemp, accuracy: bestTempAcc } : null
            },
            insights: this.generateWeatherInsights(windImpact, tempImpact)
        };
    }

    /**
     * Generate weather-based insights
     */
    generateWeatherInsights(windImpact, tempImpact) {
        const insights = [];

        // Wind insights
        if (windImpact.calm !== null && windImpact.moderate !== null) {
            const diff = windImpact.calm - windImpact.moderate;
            if (diff > 5) {
                insights.push({
                    icon: '💨',
                    message: `Wind affects you: ${diff.toFixed(0)}% worse in moderate wind vs calm`
                });
            }
        }

        // Temperature insights
        const temps = Object.entries(tempImpact).filter(([_, v]) => v !== null);
        if (temps.length >= 2) {
            temps.sort((a, b) => b[1] - a[1]);
            const best = temps[0];
            insights.push({
                icon: '🌡️',
                message: `You putt best in ${best[0]} weather (${best[1]}% accuracy)`
            });
        }

        return insights;
    }

    // ========================================================================
    // WEEKLY PROGRESS
    // ========================================================================

    /**
     * Calculate weekly progress metrics
     */
    calculateWeeklyProgress(activities) {
        const now = new Date();
        const weekStart = new Date(now);
        // Start of current week (Monday at midnight)
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const thisWeek = activities.filter(a => new Date(a.timestamp || a.date) >= weekStart);

        // Calculate metrics
        const totalPutts = thisWeek.reduce((sum, a) => sum + (a.attempts || 0), 0);
        const totalMakes = thisWeek.reduce((sum, a) => sum + (a.makes || 0), 0);
        const avgAccuracy = totalPutts > 0 ? parseFloat(((totalMakes / totalPutts) * 100).toFixed(1)) : null;

        // Days practiced this week
        const daysSet = new Set(thisWeek.map(a => {
            const d = new Date(a.timestamp || a.date);
            return d.toDateString();
        }));

        // Days remaining until next Monday
        const daysRemaining = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

        return {
            sessions: thisWeek.length,
            daysPracticed: daysSet.size,
            totalPutts,
            totalMakes,
            accuracy: avgAccuracy,
            daysRemaining
        };
    }

    /**
     * Get streak information (uses LOCAL dates to avoid UTC timezone issues)
     */
    getStreakInfo(activities) {
        if (activities.length === 0) return { current: 0, longest: 0 };

        // Get unique dates using LOCAL time
        const dates = [...new Set(activities.map(a => {
            return getLocalDateString(a.timestamp || a.date);
        }))].sort();

        // Calculate current streak using LOCAL dates
        const today = getLocalDateString();
        const yesterday = getYesterdayLocalDateString();

        let currentStreak = 0;
        let checkDate = dates.includes(today) ? today : yesterday;

        if (dates.includes(checkDate)) {
            currentStreak = 1;
            let d = new Date(checkDate + 'T12:00:00'); // Use noon to avoid DST issues
            while (true) {
                d.setDate(d.getDate() - 1);
                const dStr = getLocalDateString(d);
                if (dates.includes(dStr)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        let longestStreak = 0;
        let streak = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1] + 'T12:00:00');
            const curr = new Date(dates[i] + 'T12:00:00');
            const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

            if (diff === 1) {
                streak++;
            } else {
                longestStreak = Math.max(longestStreak, streak);
                streak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, streak);

        return { current: currentStreak, longest: longestStreak };
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Normalize activities from different sources
     */
    normalizeActivities(sessions, routines, games) {
        const normalized = [];

        // Sessions
        sessions.forEach(s => {
            if (!s.excludeFromStats && !s.pending) {
                normalized.push({
                    type: 'session',
                    id: s.id,
                    date: s.date,
                    timestamp: s.timestamp || s.date,
                    distance: s.distance || 0,
                    makes: s.makes || 0,
                    attempts: s.attempts || 0,
                    percentage: s.percentage || (s.attempts > 0 ? (s.makes / s.attempts) * 100 : 0),
                    points: s.points || 0,
                    weather: s.weather || null
                });
            }
        });

        // Routines
        routines.forEach(r => {
            if (!r.excludeFromStats && !r.pending) {
                const makes = r.totalStats?.totalMakes || 
                    r.drillScores?.reduce((sum, d) => sum + (d.makes || 0), 0) || 0;
                const attempts = r.totalStats?.totalAttempts || 
                    r.drillScores?.reduce((sum, d) => sum + (d.attempts || 0), 0) || 0;

                // Get average distance from drills
                const distances = r.drillScores?.map(d => d.distance).filter(Boolean) || [];
                const avgDistance = distances.length > 0 
                    ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
                    : 0;

                normalized.push({
                    type: 'routine',
                    id: r.id,
                    date: r.date,
                    timestamp: r.endTime || r.date,
                    distance: avgDistance,
                    makes,
                    attempts,
                    percentage: attempts > 0 ? (makes / attempts) * 100 : 0,
                    points: r.points || 0,
                    weather: r.weather || null,
                    drillScores: r.drillScores
                });
            }
        });

        // Games
        games.forEach(g => {
            if (!g.excludeFromStats && !g.pending) {
                normalized.push({
                    type: 'game',
                    id: g.id,
                    date: g.date,
                    timestamp: g.endTime || g.date,
                    distance: g.distance || 0,
                    makes: g.totalMakes || 0,
                    attempts: g.totalAttempts || 0,
                    percentage: g.percentage || 0,
                    points: g.points || 0,
                    weather: g.weather || null
                });
            }
        });

        // Sort by date (newest first for most analyses, but we'll reverse when needed)
        normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return normalized;
    }

    /**
     * Get routine completions from Firestore
     */
    async getRoutineCompletions(userId) {
        try {
            if (!window.firebase?.firestore) return [];
            const db = firebase.firestore();
            const snapshot = await db.collection('users').doc(userId)
                .collection('routineCompletions')
                .orderBy('endTime', 'desc')
                .limit(100)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching routines:', error);
            return [];
        }
    }

    /**
     * Get game completions from Firestore
     */
    async getGameCompletions(userId) {
        try {
            if (!window.firebase?.firestore) return [];
            const db = firebase.firestore();
            const snapshot = await db.collection('users').doc(userId)
                .collection('gameCompletions')
                .orderBy('endTime', 'desc')
                .limit(100)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching games:', error);
            return [];
        }
    }

    /**
     * Generate community comparison data
     * Compares user's performance against all other users
     */
    async generateCommunityComparison(distanceProfile) {
        try {
            // Fetch community stats
            const communityStats = await storageManager.getCommunityStats(50);
            
            if (!communityStats || !communityStats.hasData) {
                return {
                    available: false,
                    message: 'Not enough community data available'
                };
            }

            const comparison = {
                available: true,
                totalUsersCompared: communityStats.totalUsers,
                totalSessionsAnalyzed: communityStats.totalSessions,
                generatedAt: communityStats.generatedAt,
                byDistance: {},
                summary: {
                    aboveAverage: 0,
                    belowAverage: 0,
                    topPercentiles: []
                }
            };

            // Compare user's stats to community for each distance
            Object.entries(distanceProfile.byDistance).forEach(([distance, userStats]) => {
                const communityDistStats = communityStats.byDistance[distance];
                
                if (!communityDistStats || !userStats.accuracy) {
                    comparison.byDistance[distance] = {
                        available: false,
                        userAccuracy: userStats.accuracy,
                        communityAvg: null
                    };
                    return;
                }

                const userAccuracy = userStats.accuracy;
                const communityAvg = communityDistStats.avgAccuracy;
                const diff = userAccuracy - communityAvg;
                
                // Calculate percentile rank
                const percentileRank = storageManager.calculatePercentileRank(
                    communityDistStats.sortedAccuracies,
                    userAccuracy
                );

                comparison.byDistance[distance] = {
                    available: true,
                    userAccuracy,
                    communityAvg,
                    diff: Math.round(diff),
                    isAboveAverage: diff > 0,
                    percentileRank,
                    communityPercentiles: communityDistStats.percentiles,
                    usersCompared: communityDistStats.userCount,
                    // Descriptive rank
                    rankLabel: this.getPercentileLabel(percentileRank)
                };

                // Track summary
                if (diff > 0) {
                    comparison.summary.aboveAverage++;
                } else if (diff < 0) {
                    comparison.summary.belowAverage++;
                }

                // Track top performances
                if (percentileRank >= 75) {
                    comparison.summary.topPercentiles.push({
                        distance: parseInt(distance),
                        percentile: percentileRank,
                        accuracy: userAccuracy
                    });
                }
            });

            // Sort top percentiles by rank
            comparison.summary.topPercentiles.sort((a, b) => b.percentile - a.percentile);

            // Generate insights
            comparison.insights = this.generateCommunityInsights(comparison);

            return comparison;
        } catch (error) {
            console.error('Error generating community comparison:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Get descriptive label for percentile rank
     */
    getPercentileLabel(percentile) {
        if (percentile === null) return 'Not ranked';
        if (percentile >= 95) return 'Elite (Top 5%)';
        if (percentile >= 90) return 'Excellent (Top 10%)';
        if (percentile >= 75) return 'Above Average (Top 25%)';
        if (percentile >= 50) return 'Average';
        if (percentile >= 25) return 'Below Average';
        return 'Needs Work';
    }

    /**
     * Generate insights from community comparison
     */
    generateCommunityInsights(comparison) {
        const insights = [];
        const { byDistance, summary } = comparison;

        // Find best relative performance
        let bestPerformance = null;
        let worstPerformance = null;

        Object.entries(byDistance).forEach(([distance, stats]) => {
            if (!stats.available || stats.percentileRank === null) return;
            
            if (!bestPerformance || stats.percentileRank > bestPerformance.percentile) {
                bestPerformance = { distance: parseInt(distance), percentile: stats.percentileRank, diff: stats.diff };
            }
            if (!worstPerformance || stats.percentileRank < worstPerformance.percentile) {
                worstPerformance = { distance: parseInt(distance), percentile: stats.percentileRank, diff: stats.diff };
            }
        });

        // Add insights
        if (bestPerformance && bestPerformance.percentile >= 75) {
            insights.push({
                type: 'strength',
                icon: '🏆',
                message: `You're in the top ${100 - bestPerformance.percentile}% at ${bestPerformance.distance}ft! ${bestPerformance.diff > 0 ? `+${bestPerformance.diff}%` : ''} vs community average.`
            });
        }

        if (worstPerformance && worstPerformance.percentile < 50 && worstPerformance.diff < -5) {
            insights.push({
                type: 'opportunity',
                icon: '📈',
                message: `Focus on ${worstPerformance.distance}ft – you're ${Math.abs(worstPerformance.diff)}% below community average. Room for improvement!`
            });
        }

        if (summary.topPercentiles.length >= 3) {
            insights.push({
                type: 'achievement',
                icon: '⭐',
                message: `Outstanding! You're above average at ${summary.topPercentiles.length} distances.`
            });
        }

        // Overall comparison
        const totalDistances = summary.aboveAverage + summary.belowAverage;
        if (totalDistances > 0) {
            const abovePercent = Math.round((summary.aboveAverage / totalDistances) * 100);
            if (abovePercent >= 70) {
                insights.push({
                    type: 'overall',
                    icon: '🎯',
                    message: `Strong overall performance – above community average at ${abovePercent}% of distances.`
                });
            } else if (abovePercent <= 30) {
                insights.push({
                    type: 'overall',
                    icon: '💪',
                    message: `Keep practicing! You're currently below average at most distances, but consistent practice will improve your rankings.`
                });
            }
        }

        return insights;
    }

    /**
     * Clear the analysis cache
     */
    clearCache() {
        this.lastAnalysis = null;
        this.lastAnalysisTime = null;
    }
}

// Export singleton
export const coachingEngine = new CoachingEngine();

// Export configurations for use in UI
export { DRILL_PRESCRIPTIONS, TIME_SLOTS, DAYS_OF_WEEK };
