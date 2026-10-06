/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Real-Time Updates Manager
 * Uses Firebase onSnapshot to provide live updates for:
 * - Pending sessions/routines/games (bulk log accept/reject)
 * - Leaderboard changes
 * - Challenge alerts (H2H + friend challenges)
 * - Live scoring sessions (shared real-time scoreboard)
 */

class RealTimeManager {
    constructor() {
        this.listeners = {};
        this.isEnabled = false;
        this.knownChallengeIds = new Set();
        this.knownH2HIds = new Set();
        this.knownFriendRequestIds = new Set();
        this.activeLiveSession = null;
        this.isFirstSnapshot = {};
    }

    /**
     * Initialize real-time listeners for a user
     */
    initialize(userId, callbacks) {
        if (!userId) {
            console.warn('Cannot initialize real-time updates without userId');
            return;
        }

        this.userId = userId;
        this.callbacks = callbacks;
        this.isEnabled = true;
        this.isFirstSnapshot = {};

        console.log('🔴 Starting real-time listeners');

        // Existing listeners
        this.listenToPendingSessions();
        this.listenToPendingRoutines();
        this.listenToPendingGames();
        this.listenToLeaderboard();

        // Challenge alert listeners
        this.listenToH2HChallenges();
        this.listenToFriendChallenges();
        this.listenToFriendRequests();

        // Live session listener
        this.listenToLiveSessions();

        // Clean up any stale sessions from this user
        RealTimeManager.cleanupStaleSessions(userId);
    }

    // ========================================
    // EXISTING LISTENERS
    // ========================================

    listenToPendingSessions() {
        if (!this.userId) return;

        const unsubscribe = firebase.firestore()
            .collection('users')
            .doc(this.userId)
            .collection('sessions')
            .where('pending', '==', true)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    if (this.callbacks?.onPendingSessionsUpdate) {
                        this.callbacks.onPendingSessionsUpdate([]);
                    }
                    return;
                }

                const pendingSessions = [];
                snapshot.forEach(doc => {
                    pendingSessions.push({ id: doc.id, ...doc.data() });
                });

                if (this.callbacks?.onPendingSessionsUpdate) {
                    this.callbacks.onPendingSessionsUpdate(pendingSessions);
                }
            }, (error) => {
                console.error('Error listening to pending sessions:', error);
            });

        this.listeners.pendingSessions = unsubscribe;
    }

    listenToPendingRoutines() {
        if (!this.userId) return;

        const unsubscribe = firebase.firestore()
            .collection('users')
            .doc(this.userId)
            .collection('routineCompletions')
            .where('pending', '==', true)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    if (this.callbacks?.onPendingRoutinesUpdate) {
                        this.callbacks.onPendingRoutinesUpdate([]);
                    }
                    return;
                }

                const pendingRoutines = [];
                snapshot.forEach(doc => {
                    pendingRoutines.push({ id: doc.id, ...doc.data() });
                });

                if (this.callbacks?.onPendingRoutinesUpdate) {
                    this.callbacks.onPendingRoutinesUpdate(pendingRoutines);
                }
            }, (error) => {
                console.error('Error listening to pending routines:', error);
            });

        this.listeners.pendingRoutines = unsubscribe;
    }

    listenToPendingGames() {
        if (!this.userId) return;

        const unsubscribe = firebase.firestore()
            .collection('users')
            .doc(this.userId)
            .collection('gameCompletions')
            .where('pending', '==', true)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    if (this.callbacks?.onPendingGamesUpdate) {
                        this.callbacks.onPendingGamesUpdate([]);
                    }
                    return;
                }

                const pendingGames = [];
                snapshot.forEach(doc => {
                    pendingGames.push({ id: doc.id, ...doc.data() });
                });

                if (this.callbacks?.onPendingGamesUpdate) {
                    this.callbacks.onPendingGamesUpdate(pendingGames);
                }
            }, (error) => {
                console.error('Error listening to pending games:', error);
            });

        this.listeners.pendingGames = unsubscribe;
    }

    listenToLeaderboard() {
        let lastUpdate = 0;
        const THROTTLE_MS = 30000;

        const unsubscribe = firebase.firestore()
            .collection('users')
            .orderBy('totalPoints', 'desc')
            .limit(100)
            .onSnapshot((snapshot) => {
                const now = Date.now();
                if (now - lastUpdate < THROTTLE_MS) return;
                lastUpdate = now;

                const leaderboard = [];
                snapshot.forEach(doc => {
                    leaderboard.push({ id: doc.id, ...doc.data() });
                });

                if (this.callbacks?.onLeaderboardUpdate) {
                    this.callbacks.onLeaderboardUpdate(leaderboard);
                }
            }, (error) => {
                console.error('Error listening to leaderboard:', error);
            });

        this.listeners.leaderboard = unsubscribe;
    }

    // ========================================
    // FEATURE 1: CHALLENGE ALERTS
    // ========================================

    /**
     * Listen for incoming H2H challenges in real-time
     */
    listenToH2HChallenges() {
        if (!this.userId) return;
        this.isFirstSnapshot.h2h = true;

        const unsubscribe = firebase.firestore()
            .collection('h2h_challenges')
            .where('toUserId', '==', this.userId)
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                const challenges = [];
                snapshot.forEach(doc => {
                    challenges.push({ id: doc.id, ...doc.data() });
                });

                // First snapshot: seed known IDs, no toasts
                if (this.isFirstSnapshot.h2h) {
                    this.isFirstSnapshot.h2h = false;
                    challenges.forEach(c => this.knownH2HIds.add(c.id));
                    if (this.callbacks?.onH2HChallengesUpdate) {
                        this.callbacks.onH2HChallengesUpdate(challenges, []);
                    }
                    return;
                }

                // Find new challenges since last snapshot
                const newChallenges = challenges.filter(c => !this.knownH2HIds.has(c.id));
                challenges.forEach(c => this.knownH2HIds.add(c.id));

                // Prune removed IDs
                const currentIds = new Set(challenges.map(c => c.id));
                for (const id of this.knownH2HIds) {
                    if (!currentIds.has(id)) this.knownH2HIds.delete(id);
                }

                if (this.callbacks?.onH2HChallengesUpdate) {
                    this.callbacks.onH2HChallengesUpdate(challenges, newChallenges);
                }
            }, (error) => {
                console.error('Error listening to H2H challenges:', error);
            });

        this.listeners.h2hChallenges = unsubscribe;
    }

    /**
     * Listen for incoming friend challenges in real-time
     */
    listenToFriendChallenges() {
        if (!this.userId) return;
        this.isFirstSnapshot.friendChallenges = true;

        const unsubscribe = firebase.firestore()
            .collection('challenges')
            .where('toUserId', '==', this.userId)
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                const challenges = [];
                snapshot.forEach(doc => {
                    challenges.push({ id: doc.id, ...doc.data() });
                });

                if (this.isFirstSnapshot.friendChallenges) {
                    this.isFirstSnapshot.friendChallenges = false;
                    challenges.forEach(c => this.knownChallengeIds.add(c.id));
                    if (this.callbacks?.onFriendChallengesUpdate) {
                        this.callbacks.onFriendChallengesUpdate(challenges, []);
                    }
                    return;
                }

                const newChallenges = challenges.filter(c => !this.knownChallengeIds.has(c.id));
                challenges.forEach(c => this.knownChallengeIds.add(c.id));

                const currentIds = new Set(challenges.map(c => c.id));
                for (const id of this.knownChallengeIds) {
                    if (!currentIds.has(id)) this.knownChallengeIds.delete(id);
                }

                if (this.callbacks?.onFriendChallengesUpdate) {
                    this.callbacks.onFriendChallengesUpdate(challenges, newChallenges);
                }
            }, (error) => {
                console.error('Error listening to friend challenges:', error);
            });

        this.listeners.friendChallenges = unsubscribe;
    }

    /**
     * Listen for incoming friend requests in real-time
     */
    listenToFriendRequests() {
        if (!this.userId) return;
        this.isFirstSnapshot.friendRequests = true;

        const unsubscribe = firebase.firestore()
            .collection('friend_requests')
            .where('toUserId', '==', this.userId)
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                const requests = [];
                snapshot.forEach(doc => {
                    requests.push({ id: doc.id, ...doc.data() });
                });

                if (this.isFirstSnapshot.friendRequests) {
                    this.isFirstSnapshot.friendRequests = false;
                    requests.forEach(r => this.knownFriendRequestIds.add(r.id));
                    return;
                }

                const newRequests = requests.filter(r => !this.knownFriendRequestIds.has(r.id));
                requests.forEach(r => this.knownFriendRequestIds.add(r.id));

                const currentIds = new Set(requests.map(r => r.id));
                for (const id of this.knownFriendRequestIds) {
                    if (!currentIds.has(id)) this.knownFriendRequestIds.delete(id);
                }

                if (newRequests.length > 0 && this.callbacks?.onFriendRequestsUpdate) {
                    this.callbacks.onFriendRequestsUpdate(requests, newRequests);
                }
            }, (error) => {
                console.error('Error listening to friend requests:', error);
            });

        this.listeners.friendRequests = unsubscribe;
    }

    // ========================================
    // FEATURE 2 & 3: LIVE SESSIONS
    // ========================================

    /**
     * Listen for live sessions where this user is a participant
     */
    listenToLiveSessions() {
        if (!this.userId) return;

        const unsubscribe = firebase.firestore()
            .collection('live_sessions')
            .where('playerIds', 'array-contains', this.userId)
            .where('status', '==', 'active')
            .onSnapshot((snapshot) => {
                const sessions = [];
                snapshot.forEach(doc => {
                    sessions.push({ id: doc.id, ...doc.data() });
                });

                // Find the most recent active session
                const activeSession = sessions.length > 0
                    ? sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0]
                    : null;

                const wasActive = this.activeLiveSession !== null;
                const isNowActive = activeSession !== null;

                this.activeLiveSession = activeSession;

                if (this.callbacks?.onLiveSessionUpdate) {
                    this.callbacks.onLiveSessionUpdate(activeSession, !wasActive && isNowActive);
                }
            }, (error) => {
                console.error('Error listening to live sessions:', error);
            });

        this.listeners.liveSessions = unsubscribe;
    }

    /**
     * Listen to a specific live session for real-time score updates
     */
    listenToLiveSessionScores(sessionId, callback) {
        if (this.listeners.liveSessionScores) {
            this.listeners.liveSessionScores();
        }

        const unsubscribe = firebase.firestore()
            .collection('live_sessions')
            .doc(sessionId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error('Error listening to live session scores:', error);
            });

        this.listeners.liveSessionScores = unsubscribe;
    }

    /**
     * One-off fetch of a live session doc (not a subscription). Used as a
     * manual "refresh" fallback if a client's onSnapshot listener ever
     * appears stuck.
     */
    static async getLiveSession(sessionId) {
        const doc = await firebase.firestore().collection('live_sessions').doc(sessionId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    /**
     * Stop listening to specific live session scores
     */
    stopListeningToLiveSessionScores() {
        if (this.listeners.liveSessionScores) {
            this.listeners.liveSessionScores();
            delete this.listeners.liveSessionScores;
        }
    }

    // ========================================
    // STATIC METHODS FOR LIVE SESSIONS
    // ========================================

    /**
     * Create a new live session
     */
    static async createLiveSession({ hostId, hostName, players, activityType, activityId, activityName, tournamentState, tournamentPlay }) {
        const playerIds = players.map(p => p.id);
        const playerMap = {};
        players.forEach(p => {
            playerMap[p.id] = {
                name: p.displayName || p.name || 'Unknown',
                status: p.id === hostId ? 'scoring' : 'watching',
                scores: null
            };
        });

        const doc = await firebase.firestore().collection('live_sessions').add({
            hostId,
            hostName,
            playerIds,
            players: playerMap,
            activityType,
            activityId: activityId || null,
            activityName: activityName || activityType,
            status: 'active',
            scores: {},
            // Written in the same create call (rather than a follow-up update)
            // so a guest who opens the session right away never sees a
            // momentary "no bracket yet" gap while the second write lands.
            // Serialized to JSON: Firestore rejects nested arrays, and the
            // bracket's winners/losers rounds are arrays of arrays of match ids.
            tournamentState: tournamentState ? JSON.stringify(tournamentState) : null,
            tournamentPlay: tournamentPlay ? JSON.stringify(tournamentPlay) : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('🔴 Live session created:', doc.id);
        return doc.id;
    }

    /**
     * Update scores in a live session
     */
    static async updateLiveSessionScores(sessionId, playerId, scoreData) {
        await firebase.firestore().collection('live_sessions').doc(sessionId).update({
            [`scores.${playerId}`]: scoreData,
            [`players.${playerId}.status`]: 'scored',
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Push the full Putting Tournament bracket (+ in-progress match) to a live
     * session so every participant's device stays in sync in real time. Unlike
     * updateLiveSessionScores (one flat result per player, written once), this
     * overwrites the whole bracket on every single putt.
     */
    static async updateLiveTournamentState(sessionId, tournamentState, tournamentPlay) {
        // Same JSON-string workaround as createLiveSession — Firestore can't
        // store the bracket's nested arrays (wb/lb: arrays of arrays) directly.
        await firebase.firestore().collection('live_sessions').doc(sessionId).update({
            tournamentState: tournamentState ? JSON.stringify(tournamentState) : null,
            tournamentPlay: tournamentPlay ? JSON.stringify(tournamentPlay) : null,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * End a live session
     */
    static async endLiveSession(sessionId) {
        await firebase.firestore().collection('live_sessions').doc(sessionId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('🔴 Live session ended:', sessionId);
    }

    /**
     * Find an active session this user is currently hosting, if any. Used to
     * enforce "one live game at a time per host" before starting a new one.
     */
    static async getActiveHostedSession(hostId) {
        const snap = await firebase.firestore()
            .collection('live_sessions')
            .where('hostId', '==', hostId)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (snap.empty) return null;
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    /**
     * Clean up stale live sessions (older than 2 hours)
     */
    static async cleanupStaleSessions(userId) {
        try {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const stale = await firebase.firestore()
                .collection('live_sessions')
                .where('hostId', '==', userId)
                .where('status', '==', 'active')
                .get();

            for (const doc of stale.docs) {
                const data = doc.data();
                const created = data.createdAt?.toDate?.() || new Date(0);
                if (created < twoHoursAgo) {
                    await doc.ref.update({ status: 'abandoned' });
                    console.log('🧹 Cleaned up stale live session:', doc.id);
                }
            }
        } catch (err) {
            console.error('Error cleaning up stale sessions:', err);
        }
    }

    // ========================================
    // CLEANUP
    // ========================================

    cleanup() {
        console.log('🔴 Stopping real-time listeners');

        Object.values(this.listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });

        this.listeners = {};
        this.isEnabled = false;
        this.userId = null;
        this.callbacks = null;
        this.knownChallengeIds.clear();
        this.knownH2HIds.clear();
        this.knownFriendRequestIds.clear();
        this.activeLiveSession = null;
        this.isFirstSnapshot = {};
    }

    isActive() {
        return this.isEnabled;
    }
}

export { RealTimeManager };
export const realTimeManager = new RealTimeManager();
