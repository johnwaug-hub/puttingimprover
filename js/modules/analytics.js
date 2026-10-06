/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Analytics Module
 * Tracks user behavior and app usage with Firebase Analytics
 */

class AnalyticsManager {
    constructor() {
        this.analytics = null;
        this.enabled = true;
    }

    /**
     * Initialize Firebase Analytics
     */
    initialize() {
        try {
            if (typeof firebase !== 'undefined' && firebase.analytics) {
                this.analytics = firebase.analytics();
                console.log('📊 Analytics initialized');

                // Set initial user properties
                this.setUserProperties();
            } else {
                console.warn('Firebase Analytics not available');
                this.enabled = false;
            }
        } catch (error) {
            console.error('Error initializing analytics:', error);
            this.enabled = false;
        }
    }

    /**
     * Track page view
     * @param {string} pageName - Name of the page/view
     */
    trackPageView(pageName) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('page_view', {
                page_title: pageName,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    }

    /**
     * Track session added
     * @param {object} data - Session data
     */
    trackSessionAdded(data) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('session_added', {
                distance: data.distance,
                makes: data.makes,
                attempts: data.attempts,
                accuracy: Math.round((data.makes / data.attempts) * 100),
                points: data.points
            });
        } catch (error) {
            console.error('Error tracking session:', error);
        }
    }

    /**
     * Track routine completion
     * @param {object} data - Routine data
     */
    trackRoutineCompleted(data) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('routine_completed', {
                routine_name: data.routineName,
                duration: data.duration,
                points: data.points,
                drill_count: data.drillCount || 0
            });
        } catch (error) {
            console.error('Error tracking routine:', error);
        }
    }

    /**
     * Track game completion
     * @param {object} data - Game data
     */
    trackGameCompleted(data) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('game_completed', {
                game_name: data.gameName,
                score: data.score,
                points: data.points,
                won: data.won
            });
        } catch (error) {
            console.error('Error tracking game:', error);
        }
    }

    /**
     * Track achievement unlocked
     * @param {object} achievement - Achievement data
     */
    trackAchievementUnlocked(achievement) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('achievement_unlocked', {
                achievement_id: achievement.id,
                achievement_name: achievement.name,
                achievement_category: achievement.category
            });
        } catch (error) {
            console.error('Error tracking achievement:', error);
        }
    }

    /**
     * Track multiplayer activity
     * @param {string} type - Type of activity (session, routine, game)
     * @param {number} playerCount - Number of players
     */
    trackMultiplayerActivity(type, playerCount) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('multiplayer_activity', {
                activity_type: type,
                player_count: playerCount
            });
        } catch (error) {
            console.error('Error tracking multiplayer:', error);
        }
    }

    /**
     * Track friend added
     */
    trackFriendAdded() {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('friend_added');
        } catch (error) {
            console.error('Error tracking friend add:', error);
        }
    }

    /**
     * Track pending item action
     * @param {string} action - accept or reject
     * @param {string} type - session, routine, or game
     */
    trackPendingAction(action, type) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('pending_action', {
                action: action,
                item_type: type
            });
        } catch (error) {
            console.error('Error tracking pending action:', error);
        }
    }

    /**
     * Track data export
     */
    trackDataExport() {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('data_exported');
        } catch (error) {
            console.error('Error tracking export:', error);
        }
    }

    /**
     * Track user engagement time
     * @param {number} seconds - Time spent in app
     */
    trackEngagementTime(seconds) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent('user_engagement', {
                engagement_time_msec: seconds * 1000
            });
        } catch (error) {
            console.error('Error tracking engagement:', error);
        }
    }

    /**
     * Set user properties for segmentation
     */
    setUserProperties() {
        if (!this.enabled || !this.analytics) return;

        try {
            // These will be set when user data is loaded
            this.analytics.setUserProperties({
                app_version: '3.10.0'
            });
        } catch (error) {
            console.error('Error setting user properties:', error);
        }
    }

    /**
     * Update user properties with current stats
     * @param {object} user - User object with stats
     */
    updateUserProperties(user) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.setUserProperties({
                total_points: user.totalPoints || 0,
                total_sessions: user.totalSessions || 0,
                total_routines: user.totalRoutines || 0,
                total_games: user.totalGames || 0,
                has_friends: (user.friends?.length || 0) > 0 ? 'yes' : 'no',
                achievement_count: (user.achievements?.length || 0)
            });
        } catch (error) {
            console.error('Error updating user properties:', error);
        }
    }

    /**
     * Track custom event
     * @param {string} eventName - Name of custom event
     * @param {object} params - Event parameters
     */
    trackCustomEvent(eventName, params = {}) {
        if (!this.enabled || !this.analytics) return;

        try {
            this.analytics.logEvent(eventName, params);
        } catch (error) {
            console.error('Error tracking custom event:', error);
        }
    }
}

// Export singleton instance
export const analyticsManager = new AnalyticsManager();
