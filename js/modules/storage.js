/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Storage Module
 * Handles data persistence using Firebase Firestore
 */

import { CONSTANTS } from '../config/constants.js';
import { getFirestore } from '../config/firebase.js';

class StorageManager {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize Firestore
     */
    init() {
        this.db = getFirestore();
        console.log('✅ Storage initialized with Firestore');
    }

    /**
     * Get a document from Firestore
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<any>} Document data or null
     */
    async get(collection, docId) {
        try {
            if (!this.db) this.init();
            const docRef = this.db.collection(collection).doc(docId);
            const doc = await docRef.get();

            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error(`Error getting ${collection}/${docId}:`, error);
            return null;
        }
    }

    /**
     * Set a document in Firestore
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Data to store
     * @returns {Promise<void>}
     */
    async set(collection, docId, data) {
        try {
            if (!this.db) this.init();
            await this.db.collection(collection).doc(docId).set(data, { merge: true });
        } catch (error) {
            console.error(`Error setting ${collection}/${docId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a document from Firestore
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     */
    async delete(collection, docId) {
        try {
            if (!this.db) this.init();
            await this.db.collection(collection).doc(docId).delete();
        } catch (error) {
            console.error(`Error deleting ${collection}/${docId}:`, error);
            throw error;
        }
    }

    /**
     * Get all documents from a collection
     * @param {string} collection - Collection name
     * @returns {Promise<Array>} Array of documents
     */
    async getCollection(collection) {
        try {
            if (!this.db) this.init();
            const snapshot = await this.db.collection(collection).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error getting collection ${collection}:`, error);
            return [];
        }
    }

    /**
     * Query documents with a where clause
     * @param {string} collection - Collection name
     * @param {string} field - Field to query
     * @param {string} operator - Query operator (==, >, <, etc.)
     * @param {any} value - Value to compare
     * @returns {Promise<Array>} Array of matching documents
     */
    async query(collection, field, operator, value) {
        try {
            if (!this.db) this.init();
            const snapshot = await this.db.collection(collection)
                .where(field, operator, value)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error querying ${collection}:`, error);
            return [];
        }
    }

    // User-specific methods

    /**
     * Save user profile
     * @param {Object} user - User object
     * @returns {Promise<void>}
     */
    async saveUser(user) {
        console.log(`💾 Saving user ${user.id} to Firestore:`, {
            totalPoints: user.totalPoints,
            totalSessions: user.totalSessions,
            totalRoutines: user.totalRoutines,
            totalGames: user.totalGames
        });
        await this.set('users', user.id, user);
    }

    /**
     * Get user profile
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User object or null
     */
    async getUser(userId) {
        return await this.get('users', userId);
    }

    /**
     * Update specific fields on a user document (partial update)
     * @param {string} userId - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateUser(userId, updates) {
        try {
            await this.db.collection('users')
                .doc(userId)
                .update(updates);
            console.log(`✏️ Updated user ${userId}:`, Object.keys(updates));
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Session-specific methods

    /**
     * Save a practice session
     * @param {string} userId - User ID
     * @param {Object} session - Session object
     * @returns {Promise<void>}
     */
    async saveSession(userId, session) {
        await this.set(`users/${userId}/sessions`, session.id, session);
    }

    /**
     * Add a session (wrapper for bulk logging)
     * @param {Object} session - Session data with userId, distance, makes, attempts, date, timestamp
     * @returns {Promise<void>}
     */
    async addSession(session) {
        try {
            if (!session.userId) {
                throw new Error('userId is required');
            }

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const sessionData = {
                id: sessionId,
                distance: session.distance,
                makes: session.makes,
                attempts: session.attempts,
                percentage: session.percentage, // Include percentage
                points: session.points, // Include points
                date: session.date,
                timestamp: session.timestamp || new Date().toISOString(),
                weather: session.weather || null // Include weather data
            };

            await this.set(`users/${session.userId}/sessions`, sessionId, sessionData);

            // Update user's total points and stats
            const userRef = await this.get('users', session.userId);
            if (userRef && session.points) {
                const currentPoints = userRef.totalPoints || 0;
                const currentSessions = userRef.totalSessions || 0;
                const currentPutts = userRef.totalPutts || 0;
                const currentMakes = userRef.totalMakes || 0;

                await this.set('users', session.userId, {
                    ...userRef,
                    totalPoints: currentPoints + session.points,
                    totalSessions: currentSessions + 1,
                    totalPutts: currentPutts + session.attempts,
                    totalMakes: currentMakes + session.makes
                });

                const weatherInfo = session.weather ? ` [${session.weather.condition}, ${session.weather.temperature}°F]` : '';
                console.log(`✅ Session saved: ${session.makes}/${session.attempts} at ${session.distance}ft for user ${session.userId} (+${session.points} pts)${weatherInfo}`);
            } else {
                console.log(`✅ Session saved: ${session.makes}/${session.attempts} at ${session.distance}ft for user ${session.userId}`);
            }
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        }
    }

    /**
     * Get all sessions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of session objects
     */
    async getUserSessions(userId) {
        try {
            if (!this.db) this.init();

            // Add timeout wrapper
            const fetchWithTimeout = async () => {
                return Promise.race([
                    (async () => {
                        // Try with orderBy first, fall back to unordered query
                        let snapshot;
                        try {
                            snapshot = await this.db
                                .collection('users')
                                .doc(userId)
                                .collection('sessions')
                                .orderBy('timestamp', 'desc')
                                .limit(100)
                                .get();
                        } catch (orderError) {
                            console.warn('Could not order sessions, fetching without order:', orderError.message);
                            snapshot = await this.db
                                .collection('users')
                                .doc(userId)
                                .collection('sessions')
                                .limit(100)
                                .get();
                        }
                        return snapshot;
                    })(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Sessions fetch timeout')), 5000)
                    )
                ]);
            };

            const snapshot = await fetchWithTimeout();
            const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort in JavaScript if we couldn't sort in Firestore
            // Prioritize timestamp over date for accurate time sorting
            return sessions.sort((a, b) => {
                const dateA = new Date(a.timestamp || a.date || 0).getTime();
                const dateB = new Date(b.timestamp || b.date || 0).getTime();
                return dateB - dateA; // desc order
            });
        } catch (error) {
            console.error(`Error getting sessions for ${userId}:`, error.message);
            return [];
        }
    }

    /**
     * Delete a session
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<void>}
     */
    async deleteSession(userId, sessionId) {
        await this.delete(`users/${userId}/sessions`, sessionId);
    }

    // Challenge-specific methods

    /**
     * Save weekly challenge
     * @param {Object} challenge - Challenge object
     * @returns {Promise<void>}
     */
    async saveWeeklyChallenge(challenge) {
        await this.set('challenges', 'weekly', challenge);
    }

    /**
     * Get weekly challenge
     * @returns {Promise<Object|null>} Challenge object or null
     */
    async getWeeklyChallenge() {
        return await this.get('challenges', 'weekly');
    }

    // Friend-specific methods

    /**
     * Save friend relationship
     * @param {string} userId - User ID
     * @param {Object} friend - Friend object
     * @returns {Promise<void>}
     */
    async saveFriend(userId, friend) {
        await this.set(`users/${userId}/friends`, friend.id, friend);
    }

    /**
     * Get all friends for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of friend objects
     */
    async getUserFriends(userId) {
        try {
            if (!this.db) this.init();
            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('friends')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error getting friends for ${userId}:`, error);
            return [];
        }
    }

    /**
     * Delete a friend relationship
     * @param {string} userId - User ID
     * @param {string} friendId - Friend ID
     * @returns {Promise<void>}
     */
    async deleteFriend(userId, friendId) {
        await this.delete(`users/${userId}/friends`, friendId);
    }

    // Routine-specific methods

    /**
     * Save a community routine
     * @param {Object} routine - Routine object
     * @returns {Promise<void>}
     */
    async saveCommunityRoutine(routine) {
        await this.set('routines', routine.id, routine);
    }

    /**
     * Get all community routines
     * @returns {Promise<Array>} Array of routine objects
     */
    async getCommunityRoutines() {
        return await this.getCollection('routines');
    }

    /**
     * Save a routine completion
     * @param {string} userId - User ID
     * @param {Object} completion - Routine completion object
     * @returns {Promise<void>}
     */
    async saveRoutineCompletion(userId, completion) {
        const completionId = `routine_${Date.now()}`;
        // Ensure timestamp and endTime are always set
        const normalizedCompletion = {
            ...completion,
            timestamp: completion.timestamp || completion.endTime || new Date().toISOString(),
            endTime: completion.endTime || completion.timestamp || new Date().toISOString()
        };
        await this.set(`users/${userId}/routineCompletions`, completionId, normalizedCompletion);
    }

    /**
     * Add a routine completion (wrapper for bulk logging)
     * @param {Object} completion - Routine completion data with userId, routineId, routineName, date, duration, drillScores
     * @returns {Promise<void>}
     */
    async addRoutineCompletion(completion) {
        try {
            if (!completion.userId) {
                throw new Error('userId is required');
            }

            // Calculate total stats from drill scores
            let totalMakes = 0;
            let totalAttempts = 0;
            const drillsWithDistance = [];

            if (completion.drillScores && Array.isArray(completion.drillScores)) {
                completion.drillScores.forEach((drill, index) => {
                    if (drill && typeof drill.makes === 'number' && typeof drill.attempts === 'number') {
                        totalMakes += drill.makes;
                        totalAttempts += drill.attempts;

                        // Store drill with distance for points calculation
                        drillsWithDistance.push({
                            makes: drill.makes,
                            attempts: drill.attempts,
                            distance: drill.distance || 20 // Default to 20ft if not specified
                        });
                    }
                });
            }

            const overallPercentage = totalAttempts > 0 ? (totalMakes / totalAttempts * 100) : 0;

            // Calculate points using calculateRoutinePoints
            const { calculateRoutinePoints } = await import('../utils/calculations.js');
            const points = calculateRoutinePoints(drillsWithDistance);

            const completionId = `${completion.routineId}_${Date.now()}`;
            const routineData = {
                routineId: completion.routineId,
                routineName: completion.routineName,
                date: completion.date,
                timestamp: completion.timestamp || new Date().toISOString(),
                endTime: completion.timestamp || new Date().toISOString(),
                duration: completion.duration || 0,
                drillScores: completion.drillScores || [],
                drillResults: drillsWithDistance, // Also save as drillResults for activity card display
                points: points, // Add points!
                weather: completion.weather || null, // Add weather data
                totalStats: {
                    totalMakes: totalMakes,
                    totalAttempts: totalAttempts,
                    overallPercentage: overallPercentage
                }
            };

            await this.set(`users/${completion.userId}/routineCompletions`, completionId, routineData);

            // Increment the routine's timesCompleted counter (for custom/community routines)
            if (completion.routineId) {
                await this.incrementRoutineCompletion(completion.routineId);
            }

            // Update user's total points
            const userRef = await this.get('users', completion.userId);
            if (userRef) {
                const currentPoints = userRef.totalPoints || 0;
                const currentRoutines = userRef.totalRoutines || 0;
                const currentTotalMakes = userRef.totalMakes || 0;
                const currentTotalPutts = userRef.totalPutts || 0;
                await this.set('users', completion.userId, {
                    ...userRef,
                    totalPoints: currentPoints + points,
                    totalRoutines: currentRoutines + 1,
                    totalMakes: currentTotalMakes + totalMakes,
                    totalPutts: currentTotalPutts + totalAttempts
                });

                const weatherInfo = completion.weather ? ` [${completion.weather.condition}, ${completion.weather.temperature}°F]` : '';
                console.log(`💰 Updated user points: +${points} → ${currentPoints + points} total${weatherInfo}`);
            }

            console.log(`✅ Routine completion saved: ${completion.routineName} for user ${completion.userId} (${totalMakes}/${totalAttempts}) +${points} pts`);
            
            // Return the completion ID so it can be used for challenge tracking
            return completionId;
        } catch (error) {
            console.error('Error saving routine completion:', error);
            throw error;
        }
    }

    /**
     * Get all routine completions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of routine completion objects
     */
    async getRoutineCompletions(userId) {
        try {
            if (!this.db) this.init();

            // Add timeout wrapper
            const fetchWithTimeout = async () => {
                return Promise.race([
                    (async () => {
                        // IMPORTANT: Do NOT use orderBy('endTime') here!
                        // Firestore silently excludes documents that don't have the orderBy field.
                        // Custom routines or older completions may lack 'endTime', causing them
                        // to vanish from results. Fetch all and sort in JavaScript instead.
                        const snapshot = await this.db
                            .collection('users')
                            .doc(userId)
                            .collection('routineCompletions')
                            .limit(100)
                            .get();
                        return snapshot;
                    })(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Routine fetch timeout')), 5000)
                    )
                ]);
            };

            const snapshot = await fetchWithTimeout();
            const completions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort in JavaScript if we couldn't sort in Firestore
            return completions.sort((a, b) => {
                const timeA = new Date(a.endTime || a.timestamp || a.date || 0).getTime();
                const timeB = new Date(b.endTime || b.timestamp || b.date || 0).getTime();
                return timeB - timeA; // desc order
            });
        } catch (error) {
            console.error(`Error getting routine completions for ${userId}:`, error.message);
            return [];
        }
    }

    /**
     * Delete a routine completion
     * @param {string} userId - User ID
     * @param {string} routineId - Routine completion ID
     * @returns {Promise<void>}
     */
    async deleteRoutineCompletion(userId, routineId) {
        try {
            if (!this.db) this.init();
            await this.db
                .collection('users')
                .doc(userId)
                .collection('routineCompletions')
                .doc(routineId)
                .delete();
            console.log(`Routine completion ${routineId} deleted for user ${userId}`);
        } catch (error) {
            console.error(`Error deleting routine completion:`, error);
            throw error;
        }
    }

    /**
     * Update a routine completion
     * @param {string} userId - User ID
     * @param {string} routineId - Routine completion ID
     * @param {Object} updatedData - Updated routine data
     * @returns {Promise<void>}
     */
    async updateRoutineCompletion(userId, routineId, updatedData) {
        try {
            if (!this.db) this.init();
            await this.db
                .collection('users')
                .doc(userId)
                .collection('routineCompletions')
                .doc(routineId)
                .update(updatedData);
            console.log(`Routine completion ${routineId} updated for user ${userId}`);
        } catch (error) {
            console.error(`Error updating routine completion:`, error);
            throw error;
        }
    }

    /**
     * Save a game completion
     * @param {string} userId - User ID
     * @param {Object} completion - Game completion object
     * @returns {Promise<void>}
     */
    async saveGameCompletion(userId, completion) {
        const completionId = `game_${Date.now()}`;
        // Ensure timestamp and endTime are always set
        const normalizedCompletion = {
            ...completion,
            timestamp: completion.timestamp || completion.endTime || new Date().toISOString(),
            endTime: completion.endTime || completion.timestamp || new Date().toISOString()
        };
        await this.set(`users/${userId}/gameCompletions`, completionId, normalizedCompletion);
        return completionId;
    }

    /**
     * Add a game score (wrapper for interactive games)
     * @param {Object} gameCompletion - Game completion data with userId, gameId, gameName, date, score, metadata
     * @returns {Promise<void>}
     */
    async addGameScore(gameCompletion) {
        try {
            if (!gameCompletion.userId) {
                throw new Error('userId is required');
            }

            // Fetch weather if not already provided
            let weatherData = gameCompletion.weather || null;
            if (!weatherData) {
                try {
                    const { weatherService } = await import('./weather.js');
                    weatherData = await fetchWeatherForPlayer(gameCompletion.userId, weatherService);
                } catch (e) {
                    // Silently fail — weather is optional
                }
            }

            const completionId = `${gameCompletion.gameId}_${Date.now()}`;
            const completion = {
                gameId: gameCompletion.gameId,
                gameName: gameCompletion.gameName,
                scoringType: gameCompletion.scoringType,
                score: gameCompletion.score || 0,
                points: gameCompletion.points || 0,
                date: gameCompletion.date,
                timestamp: gameCompletion.timestamp || new Date().toISOString(),
                endTime: gameCompletion.timestamp || new Date().toISOString(),
                playerCount: gameCompletion.playerCount || 1,
                metadata: gameCompletion.metadata || {},
                weather: weatherData
            };

            // Copy over any additional fields (for percentage games, etc.)
            if (gameCompletion.totalMakes !== undefined) completion.totalMakes = gameCompletion.totalMakes;
            if (gameCompletion.totalAttempts !== undefined) completion.totalAttempts = gameCompletion.totalAttempts;
            if (gameCompletion.percentage !== undefined) completion.percentage = gameCompletion.percentage;
            if (gameCompletion.distance !== undefined) completion.distance = gameCompletion.distance;
            if (gameCompletion.timeInMinutes !== undefined) completion.timeInMinutes = gameCompletion.timeInMinutes;

            console.log('💾 Saving game completion to Firestore:', {
                userId: gameCompletion.userId,
                path: `users/${gameCompletion.userId}/gameCompletions/${completionId}`,
                completion,
                hasWeather: !!completion.weather
            });

            await this.set(`users/${gameCompletion.userId}/gameCompletions`, completionId, completion);

            // Atomic stat increments — avoid race conditions
            if (gameCompletion.points && gameCompletion.points > 0) {
                const updates = {
                    totalPoints: firebase.firestore.FieldValue.increment(gameCompletion.points),
                    totalGames: firebase.firestore.FieldValue.increment(1),
                };
                const gameMakes = gameCompletion.totalMakes || 0;
                const gameAttempts = gameCompletion.totalAttempts || 0;
                if (gameMakes > 0) updates.totalMakes = firebase.firestore.FieldValue.increment(gameMakes);
                if (gameAttempts > 0) updates.totalPutts = firebase.firestore.FieldValue.increment(gameAttempts);

                await this.updateUser(gameCompletion.userId, updates);

                const weatherInfo = completion.weather ? ` [${completion.weather.condition}, ${completion.weather.temperature}°F]` : '';
                console.log(`💰 Updated user points (atomic): +${gameCompletion.points}${weatherInfo}`);
            }

            console.log(`✅ Game score saved: ${gameCompletion.gameName} for user ${gameCompletion.userId}${gameCompletion.points ? ` (+${gameCompletion.points} pts)` : ''}`);
            
            // Return the completion ID so it can be used for challenge tracking
            return completionId;
        } catch (error) {
            console.error('Error saving game score:', error);
            throw error;
        }
    }

    /**
     * Get all game completions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of game completion objects
     */
    /**
     * Get all game completions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of game completion objects
     */
    async getGameCompletions(userId) {
        try {
            if (!this.db) this.init();

            console.log('🔍 Fetching game completions for user:', userId);

            // Add timeout wrapper
            const fetchWithTimeout = async () => {
                return Promise.race([
                    (async () => {
                        // IMPORTANT: Do NOT use orderBy('endTime') here!
                        // Firestore silently excludes documents that don't have the orderBy field.
                        // Games saved through certain paths may lack 'endTime', causing them
                        // to vanish from results. Fetch all and sort in JavaScript instead.
                        const snapshot = await this.db
                            .collection('users')
                            .doc(userId)
                            .collection('gameCompletions')
                            .limit(100)
                            .get();
                        console.log('✅ Query succeeded, docs:', snapshot.docs.length);
                        return snapshot;
                    })(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Game fetch timeout')), 5000)
                    )
                ]);
            };

            const snapshot = await fetchWithTimeout();
            const completions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log('🎮 Game completions fetched:', completions.length);
            completions.forEach((game, idx) => {
                console.log(`  ${idx + 1}. ${game.gameName} - ${game.endTime || game.timestamp} - ${game.points || 0} pts`);
            });

            // Sort in JavaScript if we couldn't sort in Firestore
            return completions.sort((a, b) => {
                const timeA = new Date(a.endTime || a.timestamp || a.date || 0).getTime();
                const timeB = new Date(b.endTime || b.timestamp || b.date || 0).getTime();
                return timeB - timeA; // desc order
            });
        } catch (error) {
            console.error(`Error getting game completions for ${userId}:`, error.message);
            return [];
        }
    }

    /**
     * Delete a game completion
     * @param {string} userId - User ID
     * @param {string} gameId - Game completion ID
     * @returns {Promise<void>}
     */
    async deleteGameCompletion(userId, gameId) {
        try {
            if (!this.db) this.init();
            await this.db
                .collection('users')
                .doc(userId)
                .collection('gameCompletions')
                .doc(gameId)
                .delete();
            console.log(`Game completion ${gameId} deleted for user ${userId}`);
        } catch (error) {
            console.error(`Error deleting game completion:`, error);
            throw error;
        }
    }

    /**
     * Update a game completion
     * @param {string} userId - User ID
     * @param {string} gameId - Game completion ID
     * @param {Object} updatedData - Updated game data
     * @returns {Promise<void>}
     */
    async updateGameCompletion(userId, gameId, updatedData) {
        try {
            if (!this.db) this.init();
            await this.db
                .collection('users')
                .doc(userId)
                .collection('gameCompletions')
                .doc(gameId)
                .update(updatedData);
            console.log(`Game completion ${gameId} updated for user ${userId}`);
        } catch (error) {
            console.error(`Error updating game completion:`, error);
            throw error;
        }
    }

    // Leaderboard methods

    /**
     * Get all users for leaderboard
     * @returns {Promise<Array>} Sorted array of users by points
     */
    async getLeaderboard() {
        try {
            if (!this.db) this.init();

            // Add timeout wrapper
            const fetchWithTimeout = async () => {
                return Promise.race([
                    (async () => {
                        let snapshot;
                        try {
                            snapshot = await this.db
                                .collection('users')
                                .orderBy('totalPoints', 'desc')
                                .limit(100)
                                .get();
                        } catch (orderError) {
                            console.warn('Could not order leaderboard, fetching without order:', orderError.message);
                            snapshot = await this.db
                                .collection('users')
                                .limit(100)
                                .get();
                        }
                        return snapshot;
                    })(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Leaderboard fetch timeout')), 5000)
                    )
                ]);
            };

            const snapshot = await fetchWithTimeout();
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort in JavaScript if we couldn't sort in Firestore
            return users.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        } catch (error) {
            console.error('Error getting leaderboard:', error.message);
            return [];
        }
    }

    /**
     * Get community statistics for coaching comparisons
     * Fetches sessions from active users to calculate averages by distance
     * @param {number} sampleSize - Number of users to sample (default 50)
     * @returns {Promise<Object>} Community stats by distance
     */
    async getCommunityStats(sampleSize = 50) {
        try {
            if (!this.db) this.init();

            // Get active users from leaderboard
            const usersSnapshot = await this.db
                .collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(sampleSize)
                .get();

            if (usersSnapshot.empty) {
                return { hasData: false };
            }

            const userIds = usersSnapshot.docs.map(doc => doc.id);
            
            // Aggregate stats by distance
            const distanceStats = {};
            const userAccuracies = {}; // For percentile calculation
            let totalUsers = 0;
            let totalSessions = 0;

            // Fetch sessions for each user (in parallel batches)
            const batchSize = 10;
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const batchPromises = batch.map(async (userId) => {
                    try {
                        const sessionsSnapshot = await this.db
                            .collection('users')
                            .doc(userId)
                            .collection('sessions')
                            .orderBy('date', 'desc')
                            .limit(50) // Last 50 sessions per user
                            .get();
                        
                        return sessionsSnapshot.docs.map(doc => ({
                            ...doc.data(),
                            odId: userId
                        }));
                    } catch (e) {
                        return [];
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                
                // Process batch results
                batchResults.forEach((sessions, idx) => {
                    const userId = batch[idx];
                    if (sessions.length === 0) return;
                    
                    totalUsers++;
                    totalSessions += sessions.length;
                    
                    // User's overall accuracy by distance for percentile calc
                    const userDistanceStats = {};
                    
                    sessions.forEach(session => {
                        const distance = parseInt(session.distance);
                        const makes = parseInt(session.makes) || 0;
                        const attempts = parseInt(session.attempts) || parseInt(session.putts) || 0;
                        
                        if (isNaN(distance) || distance <= 0 || attempts <= 0) return;
                        
                        // Round to nearest tracked distance
                        const trackedDistance = this.findClosestTrackedDistance(distance);
                        
                        if (!distanceStats[trackedDistance]) {
                            distanceStats[trackedDistance] = {
                                totalMakes: 0,
                                totalAttempts: 0,
                                sessionCount: 0,
                                userAccuracies: []
                            };
                        }
                        
                        distanceStats[trackedDistance].totalMakes += makes;
                        distanceStats[trackedDistance].totalAttempts += attempts;
                        distanceStats[trackedDistance].sessionCount++;
                        
                        // Track per-user stats for this distance
                        if (!userDistanceStats[trackedDistance]) {
                            userDistanceStats[trackedDistance] = { makes: 0, attempts: 0 };
                        }
                        userDistanceStats[trackedDistance].makes += makes;
                        userDistanceStats[trackedDistance].attempts += attempts;
                    });
                    
                    // Add user's accuracy to each distance for percentile calc
                    Object.entries(userDistanceStats).forEach(([dist, stats]) => {
                        if (stats.attempts >= 10) { // Min attempts threshold
                            const accuracy = Math.round((stats.makes / stats.attempts) * 100);
                            distanceStats[dist].userAccuracies.push(accuracy);
                        }
                    });
                });
            }

            // Calculate final stats
            const communityStats = {
                hasData: true,
                totalUsers,
                totalSessions,
                generatedAt: new Date().toISOString(),
                byDistance: {}
            };

            Object.entries(distanceStats).forEach(([distance, stats]) => {
                const avgAccuracy = stats.totalAttempts > 0 
                    ? Math.round((stats.totalMakes / stats.totalAttempts) * 100) 
                    : 0;
                
                // Sort accuracies for percentile calculation
                const sortedAccuracies = stats.userAccuracies.sort((a, b) => a - b);
                
                communityStats.byDistance[distance] = {
                    avgAccuracy,
                    totalMakes: stats.totalMakes,
                    totalAttempts: stats.totalAttempts,
                    sessionCount: stats.sessionCount,
                    userCount: sortedAccuracies.length,
                    sortedAccuracies, // For percentile lookup
                    percentiles: {
                        p25: this.getPercentileValue(sortedAccuracies, 25),
                        p50: this.getPercentileValue(sortedAccuracies, 50),
                        p75: this.getPercentileValue(sortedAccuracies, 75),
                        p90: this.getPercentileValue(sortedAccuracies, 90)
                    }
                };
            });

            return communityStats;
        } catch (error) {
            console.error('Error getting community stats:', error);
            return { hasData: false, error: error.message };
        }
    }

    /**
     * Find closest tracked distance
     */
    findClosestTrackedDistance(distance) {
        const tracked = [10, 15, 20, 25, 30, 33, 40, 50];
        let closest = tracked[0];
        let minDiff = Math.abs(distance - closest);
        
        for (const d of tracked) {
            const diff = Math.abs(distance - d);
            if (diff < minDiff) {
                minDiff = diff;
                closest = d;
            }
        }
        return closest;
    }

    /**
     * Get percentile value from sorted array
     */
    getPercentileValue(sortedArray, percentile) {
        if (!sortedArray || sortedArray.length === 0) return null;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }

    /**
     * Calculate user's percentile rank for a given accuracy at a distance
     */
    calculatePercentileRank(sortedAccuracies, userAccuracy) {
        if (!sortedAccuracies || sortedAccuracies.length === 0) return null;
        
        let count = 0;
        for (const acc of sortedAccuracies) {
            if (acc < userAccuracy) count++;
            else break;
        }
        
        return Math.round((count / sortedAccuracies.length) * 100);
    }

    /**
     * Add a friend
     * @param {string} userId - Current user's ID
     * @param {string} friendId - Friend's user ID
     * @returns {Promise<void>}
     */
    async addFriend(userId, friendId) {
        try {
            if (!this.db) this.init();

            const friendRef = this.db
                .collection('users')
                .doc(userId)
                .collection('friends')
                .doc(friendId);

            await friendRef.set({
                status: 'accepted',
                addedAt: new Date().toISOString()
            });

            console.log(`✅ Friend added: ${friendId}`);
        } catch (error) {
            console.error('Error adding friend:', error);
            throw error;
        }
    }

    /**
     * Remove a friend
     * @param {string} userId - Current user's ID
     * @param {string} friendId - Friend's user ID
     * @returns {Promise<void>}
     */
    async removeFriend(userId, friendId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('users')
                .doc(userId)
                .collection('friends')
                .doc(friendId)
                .delete();

            console.log(`✅ Friend removed: ${friendId}`);
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    }

    /**
     * Get user's friends
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of friend user objects
     */
    async getFriends(userId) {
        try {
            if (!this.db) this.init();

            // Get friend IDs from user's friends subcollection
            const friendsSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('friends')
                .where('status', '==', 'accepted')
                .get();

            if (friendsSnapshot.empty) {
                return [];
            }

            // Get full user data for each friend
            const friendIds = friendsSnapshot.docs.map(doc => doc.id);
            const friends = [];

            for (const friendId of friendIds) {
                const friendData = await this.getUser(friendId);
                if (friendData) {
                    friends.push({ id: friendId, ...friendData });
                }
            }

            return friends;
        } catch (error) {
            console.error('Error getting friends:', error);
            return [];
        }
    }

    /**
     * Send a friend request
     * @param {string} fromUserId - Sender's user ID
     * @param {string} toUserId - Recipient's user ID
     * @returns {Promise<void>}
     */
    async sendFriendRequest(fromUserId, toUserId) {
        try {
            if (!this.db) this.init();

            const fromUser = await this.getUser(fromUserId);

            // Use top-level friend_requests collection (easier security rules)
            const requestId = `${fromUserId}_${toUserId}`;
            await this.db
                .collection('friend_requests')
                .doc(requestId)
                .set({
                    id: requestId,
                    fromUserId: fromUserId,
                    toUserId: toUserId,
                    fromDisplayName: fromUser?.displayName || 'Unknown',
                    fromProfilePicture: fromUser?.profilePictureURL || null,
                    fromTotalPoints: fromUser?.totalPoints || 0,
                    status: 'pending',
                    sentAt: new Date().toISOString()
                });

            console.log(`✅ Friend request sent from ${fromUserId} to ${toUserId}`);
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    /**
     * Get pending friend requests for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of friend request objects
     */
    async getFriendRequests(userId) {
        try {
            if (!this.db) this.init();

            // Query top-level friend_requests collection
            const snapshot = await this.db
                .collection('friend_requests')
                .where('toUserId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            const requests = snapshot.docs.map(doc => ({
                id: doc.data().fromUserId,
                ...doc.data()
            }));

            // Sort client-side
            requests.sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));

            return requests;
        } catch (error) {
            console.error('Error getting friend requests:', error);
            return [];
        }
    }

    /**
     * Accept a friend request
     * @param {string} userId - Current user's ID
     * @param {string} fromUserId - Requester's user ID
     * @returns {Promise<void>}
     */
    async acceptFriendRequest(userId, fromUserId) {
        try {
            if (!this.db) this.init();

            // Update request status in top-level collection
            const requestId = `${fromUserId}_${userId}`;
            await this.db
                .collection('friend_requests')
                .doc(requestId)
                .update({ status: 'accepted', acceptedAt: new Date().toISOString() });

            // Add friendship to top-level friends collection (BOTH directions for Firestore rules)
            const friendshipId1 = `${userId}_${fromUserId}`;
            const friendshipId2 = `${fromUserId}_${userId}`;

            // Create both friendship documents so rules work in either direction
            await Promise.all([
                this.db.collection('friendships').doc(friendshipId1).set({
                    id: friendshipId1,
                    user1: userId,
                    user2: fromUserId,
                    createdAt: new Date().toISOString()
                }),
                this.db.collection('friendships').doc(friendshipId2).set({
                    id: friendshipId2,
                    user1: fromUserId,
                    user2: userId,
                    createdAt: new Date().toISOString()
                })
            ]);

            console.log(`✅ Friend request accepted: ${fromUserId} (both friendship docs created)`);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    /**
     * Get friend requests sent BY a user (outgoing / pending)
     * @param {string} userId - Sender's user ID
     * @returns {Promise<Array>}
     */
    async getSentFriendRequests(userId) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('friend_requests')
                .where('fromUserId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting sent friend requests:', error);
            return [];
        }
    }

    /**
     * Decline a friend request
     * @param {string} userId - Current user's ID
     * @param {string} fromUserId - Requester's user ID
     * @returns {Promise<void>}
     */
    async declineFriendRequest(userId, fromUserId) {
        try {
            if (!this.db) this.init();

            const requestId = `${fromUserId}_${userId}`;
            await this.db
                .collection('friend_requests')
                .doc(requestId)
                .update({ status: 'declined', declinedAt: new Date().toISOString() });

            console.log(`✅ Friend request declined: ${fromUserId}`);
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    }

    /**
     * Check if two users are accepted friends
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {Promise<boolean>} True if they are accepted friends
     */
    async areFriends(userId1, userId2) {
        try {
            if (!this.db) this.init();

            // Same user is always allowed
            if (userId1 === userId2) return true;

            // Check friendships collection (either direction)
            const friendshipId1 = `${userId1}_${userId2}`;
            const friendshipId2 = `${userId2}_${userId1}`;

            // Try both possible friendship document IDs
            const [doc1, doc2] = await Promise.all([
                this.db.collection('friendships').doc(friendshipId1).get(),
                this.db.collection('friendships').doc(friendshipId2).get()
            ]);

            if (doc1.exists || doc2.exists) {
                return true;
            }

            // Also check the user's friends subcollection as backup
            const friendDoc = await this.db
                .collection('users')
                .doc(userId1)
                .collection('friends')
                .doc(userId2)
                .get();

            if (friendDoc.exists && friendDoc.data()?.status === 'accepted') {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking friendship:', error);
            return false;
        }
    }

    /**
     * Get list of accepted friend IDs for a user
     * @param {string} userId - User ID
     * @returns {Promise<string[]>} Array of friend user IDs
     */
    async getAcceptedFriendIds(userId) {
        try {
            if (!this.db) this.init();

            const friendIds = new Set();

            // Get from friendships collection (both directions)
            const [asUser1, asUser2] = await Promise.all([
                this.db.collection('friendships')
                    .where('user1', '==', userId)
                    .get(),
                this.db.collection('friendships')
                    .where('user2', '==', userId)
                    .get()
            ]);

            asUser1.docs.forEach(doc => {
                const data = doc.data();
                if (data.user2) friendIds.add(data.user2);
            });

            asUser2.docs.forEach(doc => {
                const data = doc.data();
                if (data.user1) friendIds.add(data.user1);
            });

            // Also check user's friends subcollection as backup
            const friendsSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('friends')
                .where('status', '==', 'accepted')
                .get();

            friendsSnapshot.docs.forEach(doc => {
                friendIds.add(doc.id);
            });

            return Array.from(friendIds);
        } catch (error) {
            console.error('Error getting accepted friend IDs:', error);
            return [];
        }
    }

    /**
     * Create a notification for a user
     * @param {string} userId - User ID
     * @param {Object} notification - Notification data
     * @returns {Promise<string>} Notification ID
     */
    async createNotification(userId, notification) {
        try {
            if (!this.db) this.init();

            const notificationRef = this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .doc();

            await notificationRef.set({
                ...notification,
                id: notificationRef.id,
                createdAt: new Date().toISOString(),
                read: false
            });

            return notificationRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {number} limit - Max notifications to return
     * @returns {Promise<Array>} Array of notifications
     */
    async getNotifications(userId, limit = 20) {
        try {
            if (!this.db) this.init();

            // Simple query without orderBy to avoid index requirement
            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .limit(limit)
                .get();

            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: this.getTimeAgo(doc.data().createdAt)
            }));

            // Sort client-side
            notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            return notifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     * @returns {Promise<void>}
     */
    async markNotificationRead(userId, notificationId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .doc(notificationId)
                .update({ read: true, readAt: new Date().toISOString() });
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    }

    /**
     * Mark all notifications as read
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async markAllNotificationsRead(userId) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .where('read', '==', false)
                .get();

            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true, readAt: new Date().toISOString() });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications read:', error);
        }
    }

    /**
     * Get friend activity feed
     * @param {string} userId - User ID
     * @param {number} limit - Max items to return
     * @returns {Promise<Array>} Array of activity items
     */
    async getFriendActivity(userId, limit = 10) {
        try {
            if (!this.db) this.init();

            // Get friend IDs
            const friends = await this.getFriends(userId);
            if (friends.length === 0) return [];

            const friendIds = friends.map(f => f.id);

            // Get recent activity from friends - simple query without orderBy
            const snapshot = await this.db
                .collection('activity_feed')
                .where('userId', 'in', friendIds.slice(0, 10)) // Firestore limits 'in' to 10
                .limit(limit * 2) // Get more to allow for sorting
                .get();

            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timeAgo: this.getTimeAgo(doc.data().timestamp)
            }));

            // Sort client-side and limit
            activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            return activities.slice(0, limit);
        } catch (error) {
            console.error('Error getting friend activity:', error);
            return [];
        }
    }

    /**
     * Post activity to feed
     * @param {string} userId - User ID
     * @param {Object} activity - Activity data
     * @returns {Promise<void>}
     */
    async postActivity(userId, activity) {
        try {
            if (!this.db) this.init();

            const user = await this.getUser(userId);

            await this.db.collection('activity_feed').add({
                userId: userId,
                userDisplayName: user?.displayName || 'Unknown',
                userProfilePicture: user?.profilePictureURL || null,
                ...activity,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error posting activity:', error);
        }
    }

    /**
     * Create a challenge
     * @param {string} fromUserId - Challenger's user ID
     * @param {string} toUserId - Challenged user's ID
     * @param {Object} challenge - Challenge details
     * @returns {Promise<string>} Challenge ID
     */
    async createChallenge(challengeOrFromUserId, toUserId = null, challengeData = null) {
        try {
            if (!this.db) this.init();

            let challenge;

            // Support both old format (3 params) and new format (1 object)
            if (toUserId === null && challengeData === null) {
                // New format: single challenge object
                challenge = challengeOrFromUserId;
            } else {
                // Old format: fromUserId, toUserId, challengeData
                const fromUser = await this.getUser(challengeOrFromUserId);
                const toUser = await this.getUser(toUserId);

                challenge = {
                    fromUserId: challengeOrFromUserId,
                    fromDisplayName: fromUser?.displayName || 'Unknown',
                    toUserId: toUserId,
                    toDisplayName: toUser?.displayName || 'Unknown',
                    ...challengeData
                };
            }

            const challengeRef = this.db.collection('challenges').doc();

            const fullChallenge = {
                id: challengeRef.id,
                fromUserId: challenge.fromUserId,
                fromDisplayName: challenge.fromDisplayName || 'Unknown',
                fromProfilePicture: challenge.fromProfilePicture || null,
                toUserId: challenge.toUserId,
                toDisplayName: challenge.toDisplayName || 'Unknown',
                toProfilePicture: challenge.toProfilePicture || null,
                type: challenge.type,
                description: challenge.description,
                wagerPoints: challenge.wagerPoints || 0,
                duration: challenge.duration,
                status: 'pending',
                createdAt: challenge.createdAt || new Date().toISOString(),
                expiresAt: challenge.expiresAt || new Date(Date.now() + (challenge.duration * 24 * 60 * 60 * 1000)).toISOString(),
                fromScore: null,
                toScore: null,
                winner: null
            };

            await challengeRef.set(fullChallenge);

            console.log(`✅ Challenge created: ${challengeRef.id}`);
            return challengeRef.id;
        } catch (error) {
            console.error('Error creating challenge:', error);
            throw error;
        }
    }

    /**
     * Get challenges for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of challenges
     */
    async getChallenges(userId) {
        try {
            if (!this.db) this.init();

            // Get challenges where user is either sender or receiver
            // Simple queries without orderBy to avoid index requirement
            const sentSnapshot = await this.db
                .collection('challenges')
                .where('fromUserId', '==', userId)
                .limit(20)
                .get();

            const receivedSnapshot = await this.db
                .collection('challenges')
                .where('toUserId', '==', userId)
                .limit(20)
                .get();

            const challenges = [
                ...sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), direction: 'sent' })),
                ...receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), direction: 'received' }))
            ];

            // Sort client-side by date and return
            return challenges.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (error) {
            console.error('Error getting challenges:', error);
            return [];
        }
    }

    /**
     * Accept a challenge
     * @param {string} challengeId - Challenge ID
     * @returns {Promise<void>}
     */
    async acceptChallenge(challengeId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('challenges')
                .doc(challengeId)
                .update({
                    status: 'active',
                    acceptedAt: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error accepting challenge:', error);
            throw error;
        }
    }

    /**
     * Decline a challenge
     * @param {string} challengeId - Challenge ID
     * @returns {Promise<void>}
     */
    async declineChallenge(challengeId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('challenges')
                .doc(challengeId)
                .update({
                    status: 'declined',
                    declinedAt: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error declining challenge:', error);
            throw error;
        }
    }

    /**
     * Delete a challenge completely (used when either user quits)
     * @param {string} challengeId - Challenge ID
     * @returns {Promise<void>}
     */
    async deleteChallenge(challengeId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('challenges')
                .doc(challengeId)
                .delete();

            console.log(`✅ Challenge deleted: ${challengeId}`);
        } catch (error) {
            console.error('Error deleting challenge:', error);
            throw error;
        }
    }

    /**
     * Update challenge score when user logs a session
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User ID
     * @param {Object} sessionData - Session data with points, makes, attempts
     * @returns {Promise<void>}
     */
    async updateChallengeScore(challengeId, userId, sessionData) {
        try {
            if (!this.db) this.init();

            console.log('🔍 updateChallengeScore called:', {
                challengeId,
                userId,
                sessionData
            });

            const challengeRef = this.db.collection('challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) {
                console.error('❌ Challenge not found:', challengeId);
                return null;
            }

            const challenge = doc.data();
            const isFromUser = challenge.fromUserId === userId;

            console.log('🔍 Challenge user comparison:', {
                fromUserId: challenge.fromUserId,
                toUserId: challenge.toUserId,
                currentUserId: userId,
                isFromUser,
                field: isFromUser ? 'from' : 'to'
            });

            const field = isFromUser ? 'from' : 'to';
            const sessions = challenge[`${field}Sessions`] || [];
            sessions.push({
                id: sessionData.id,
                date: sessionData.date,
                points: sessionData.points || 0,
                makes: sessionData.makes || 0,
                attempts: sessionData.attempts || 0,
                distance: sessionData.distance || 0
            });

            // Calculate new score based on challenge type
            let newScore = 0;
            switch (challenge.type) {
                case 'points':
                    newScore = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
                    break;
                case 'accuracy':
                    const totalMakes = sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                    const totalAttempts = sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                    newScore = totalAttempts > 0 ? Math.round((totalMakes / totalAttempts) * 100) : 0;
                    break;
                case 'sessions':
                    newScore = sessions.length;
                    break;
                default:
                    newScore = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
            }

            await challengeRef.update({
                [`${field}Sessions`]: sessions,
                [`${field}Score`]: newScore
            });

            console.log(`✅ Challenge score updated: ${challengeId}, ${field}Score = ${newScore}, sessions count: ${sessions.length}`);

            // Check if challenge should auto-complete
            const updatedDoc = await challengeRef.get();
            const updatedChallenge = updatedDoc.data();
            
            const now = new Date();
            const endTime = new Date(updatedChallenge.expiresAt || updatedChallenge.endTime);
            const hasTarget = updatedChallenge.target && updatedChallenge.target > 0;
            const fromReachedTarget = hasTarget && (updatedChallenge.fromScore || 0) >= updatedChallenge.target;
            const toReachedTarget = hasTarget && (updatedChallenge.toScore || 0) >= updatedChallenge.target;
            
            if ((!isNaN(endTime.getTime()) && now >= endTime) || fromReachedTarget || toReachedTarget) {
                return await this.completeFriendChallenge(challengeId);
            }
            
            return null;
        } catch (error) {
            console.error('Error updating challenge score:', error);
            return null;
        }
    }

    /**
     * Remove a session from a challenge (when session is deleted)
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID to remove
     * @returns {Promise<boolean>} - True if session was removed
     */
    async removeSessionFromChallenge(challengeId, userId, sessionId) {
        try {
            if (!this.db) this.init();

            console.log('🗑️ removeSessionFromChallenge called:', {
                challengeId,
                userId,
                sessionId
            });

            const challengeRef = this.db.collection('challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) {
                console.error('❌ Challenge not found:', challengeId);
                return false;
            }

            const challenge = doc.data();
            const isFromUser = challenge.fromUserId === userId;
            const field = isFromUser ? 'from' : 'to';
            
            const sessions = challenge[`${field}Sessions`] || [];
            const originalLength = sessions.length;
            
            // Filter out the session to remove
            const filteredSessions = sessions.filter(s => s.id !== sessionId);
            
            if (filteredSessions.length === originalLength) {
                console.log('⚠️ Session not found in challenge:', sessionId);
                return false;
            }

            // Recalculate score based on challenge type
            let newScore = 0;
            switch (challenge.type) {
                case 'points':
                    newScore = filteredSessions.reduce((sum, s) => sum + (s.points || 0), 0);
                    break;
                case 'accuracy':
                    const totalMakes = filteredSessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                    const totalAttempts = filteredSessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                    newScore = totalAttempts > 0 ? Math.round((totalMakes / totalAttempts) * 100) : 0;
                    break;
                case 'sessions':
                    newScore = filteredSessions.length;
                    break;
                default:
                    newScore = filteredSessions.reduce((sum, s) => sum + (s.points || 0), 0);
            }

            await challengeRef.update({
                [`${field}Sessions`]: filteredSessions,
                [`${field}Score`]: newScore
            });

            console.log(`✅ Session removed from challenge: ${challengeId}, ${field}Score = ${newScore}, sessions count: ${filteredSessions.length}`);
            return true;
        } catch (error) {
            console.error('Error removing session from challenge:', error);
            return false;
        }
    }

    /**
     * Complete a friend challenge and determine winner
     * @param {string} challengeId - Challenge ID
     * @returns {Promise<Object>} - Result with winner info and ELO changes
     */
    async completeFriendChallenge(challengeId) {
        try {
            if (!this.db) this.init();

            const challengeRef = this.db.collection('challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) return null;

            const challenge = doc.data();
            
            // Don't re-complete already completed challenges
            if (challenge.status === 'completed') {
                return { alreadyCompleted: true };
            }

            const fromScore = challenge.fromScore || 0;
            const toScore = challenge.toScore || 0;

            let winnerId = null;
            let loserId = null;
            let isDraw = false;

            if (fromScore > toScore) {
                winnerId = challenge.fromUserId;
                loserId = challenge.toUserId;
            } else if (toScore > fromScore) {
                winnerId = challenge.toUserId;
                loserId = challenge.fromUserId;
            } else {
                isDraw = true;
            }

            // Update challenge status
            await challengeRef.update({
                status: 'completed',
                completedAt: new Date().toISOString(),
                winnerId: winnerId,
                isDraw: isDraw
            });

            let eloChanges = null;
            let rewardAwarded = 0;

            // Update ELO and award reward points if there's a winner (not a draw)
            if (winnerId && loserId) {
                const { teamsLeaguesManager } = await import('./teamsLeagues.js');
                if (teamsLeaguesManager.db) {
                    eloChanges = await teamsLeaguesManager.updateEloAfterMatch(winnerId, loserId);
                }

                // Award reward points to winner if reward exists
                if (challenge.reward && challenge.reward > 0) {
                    rewardAwarded = challenge.reward;
                    const winner = await this.getUser(winnerId);
                    if (winner) {
                        winner.totalPoints = (winner.totalPoints || 0) + rewardAwarded;
                        winner.friendChallengesWon = (winner.friendChallengesWon || 0) + 1;
                        winner.friendChallengeRewardsWon = (winner.friendChallengeRewardsWon || 0) + rewardAwarded;
                        await this.saveUser(winner);
                        console.log(`💰 Friend challenge reward awarded: ${rewardAwarded} pts to ${winner.displayName}`);
                    }
                }
            }

            // Notify both players
            const winnerName = winnerId === challenge.fromUserId ? challenge.fromDisplayName : challenge.toDisplayName;
            const loserName = loserId === challenge.fromUserId ? challenge.fromDisplayName : challenge.toDisplayName;

            if (isDraw) {
                await this.createNotification(challenge.fromUserId, {
                    type: 'challenge_completed',
                    icon: '🤝',
                    text: `Your challenge with ${challenge.toDisplayName} ended in a draw!`,
                    challengeId
                });
                await this.createNotification(challenge.toUserId, {
                    type: 'challenge_completed',
                    icon: '🤝',
                    text: `Your challenge with ${challenge.fromDisplayName} ended in a draw!`,
                    challengeId
                });
            } else {
                // Notify winner
                const rewardText = rewardAwarded > 0 ? ` Won ${rewardAwarded} pts!` : '';
                await this.createNotification(winnerId, {
                    type: 'challenge_won',
                    icon: '🏆',
                    text: `You won the challenge against ${loserName}!${eloChanges ? ` (+${eloChanges.winner.change} ELO)` : ''}${rewardText}`,
                    challengeId
                });
                // Notify loser
                await this.createNotification(loserId, {
                    type: 'challenge_lost',
                    icon: '😔',
                    text: `${winnerName} won the challenge.${eloChanges ? ` (${eloChanges.loser.change} ELO)` : ''}`,
                    challengeId
                });
            }

            console.log(`✅ Friend Challenge completed: ${challengeId}, winner: ${winnerId || 'draw'}${rewardAwarded ? `, reward: ${rewardAwarded} pts` : ''}`);

            return {
                winnerId,
                loserId,
                isDraw,
                eloChanges,
                rewardAwarded,
                fromScore,
                toScore
            };
        } catch (error) {
            console.error('Error completing friend challenge:', error);
            return null;
        }
    }

    /**
     * Helper: Get time ago string
     * @param {string} dateString - ISO date string
     * @returns {string} Time ago string
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    }

    /**
     * Save custom routine
     * @param {string} userId - User ID
     * @param {Object} routine - Routine data
     * @returns {Promise<Object>} Saved routine
     */
    async saveCustomRoutine(userId, routine) {
        try {
            if (!this.db) this.init();

            const routineId = routine.id || `user_routine_${Date.now()}_${userId.slice(0, 8)}`;

            // Get user data for creator name
            const userData = await this.getUser(userId);

            const routineData = {
                ...routine,
                id: routineId,
                createdBy: userId,
                creatorName: userData?.displayName || userData?.email || 'Anonymous',
                createdAt: routine.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to custom_routines collection
            await this.set('custom_routines', routineId, routineData);

            // If public, also save to community_routines
            if (routine.isPublic) {
                await this.publishRoutineToCommunity(routineId, routineData);
            } else {
                // If it was public and now private, remove from community
                await this.unpublishRoutineFromCommunity(routineId);
            }

            console.log('✅ Custom routine saved:', routineId);
            return routineData;
        } catch (error) {
            console.error('Error saving custom routine:', error);
            throw error;
        }
    }

    /**
     * Get user's custom routines
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of custom routines
     */
    async getUserCustomRoutines(userId) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('custom_routines')
                .where('createdBy', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading custom routines:', error);
            return [];
        }
    }

    /**
     * Get public community routines
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of community routines
     */
    async getCommunityRoutines(filters = {}) {
        try {
            if (!this.db) this.init();

            let query = this.db
                .collection('community_routines')
                .where('isPublic', '==', true);

            // Apply level filter if provided
            if (filters.level) {
                query = query.where('level', '==', filters.level);
            }

            // Apply sorting
            const sortBy = filters.sortBy || 'averageRating';
            const sortOrder = filters.sortOrder || 'desc';
            query = query.orderBy(sortBy, sortOrder).limit(50);

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading community routines:', error);
            // Fallback to simple query if orderBy fails
            try {
                const snapshot = await this.db
                    .collection('community_routines')
                    .where('isPublic', '==', true)
                    .limit(50)
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                return [];
            }
        }
    }

    /**
     * Publish routine to community
     * @param {string} routineId - Routine ID
     * @param {Object} routineData - Routine data
     * @returns {Promise<void>}
     */
    async publishRoutineToCommunity(routineId, routineData) {
        try {
            if (!this.db) this.init();

            const communityData = {
                ...routineData,
                timesCompleted: routineData.timesCompleted || 0,
                averageRating: routineData.averageRating || 0,
                totalRatings: routineData.totalRatings || 0,
                favorites: routineData.favorites || 0,
                publishedAt: routineData.publishedAt || new Date().toISOString()
            };

            await this.set('community_routines', routineId, communityData);
            console.log('✅ Routine published to community:', routineId);
        } catch (error) {
            console.error('Error publishing routine:', error);
            throw error;
        }
    }

    /**
     * Unpublish routine from community
     * @param {string} routineId - Routine ID
     * @returns {Promise<void>}
     */
    async unpublishRoutineFromCommunity(routineId) {
        try {
            if (!this.db) this.init();

            const doc = await this.get('community_routines', routineId);
            if (doc) {
                await this.delete('community_routines', routineId);
                console.log('✅ Routine unpublished from community:', routineId);
            }
        } catch (error) {
            console.error('Error unpublishing routine:', error);
            // Non-critical error, don't throw
        }
    }

    /**
     * Delete custom routine
     * @param {string} userId - User ID
     * @param {string} routineId - Routine ID
     * @returns {Promise<void>}
     */
    async deleteCustomRoutine(userId, routineId) {
        try {
            if (!this.db) this.init();

            // Verify ownership
            const routine = await this.get('custom_routines', routineId);
            if (!routine || routine.createdBy !== userId) {
                throw new Error('Unauthorized: You can only delete your own routines');
            }

            // Delete from custom_routines
            await this.delete('custom_routines', routineId);

            // Delete from community if published
            if (routine.isPublic) {
                await this.delete('community_routines', routineId);
            }

            console.log('✅ Custom routine deleted:', routineId);
        } catch (error) {
            console.error('Error deleting routine:', error);
            throw error;
        }
    }

    /**
     * Rate a community routine
     * @param {string} userId - User ID
     * @param {string} routineId - Routine ID
     * @param {number} rating - Rating (1-5)
     * @returns {Promise<void>}
     */
    async rateRoutine(userId, routineId, rating) {
        try {
            if (!this.db) this.init();

            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const ratingKey = `rating_${userId}_${routineId}`;

            // Save user's rating
            await this.set('routine_ratings', ratingKey, {
                userId,
                routineId,
                rating,
                timestamp: new Date().toISOString()
            });

            // Update routine's average rating
            await this.updateRoutineRating(routineId);

            console.log('✅ Routine rated:', { routineId, rating });
        } catch (error) {
            console.error('Error rating routine:', error);
            throw error;
        }
    }

    /**
     * Update routine's average rating
     * @param {string} routineId - Routine ID
     * @returns {Promise<void>}
     */
    async updateRoutineRating(routineId) {
        try {
            if (!this.db) this.init();

            // Get all ratings for this routine
            const snapshot = await this.db
                .collection('routine_ratings')
                .where('routineId', '==', routineId)
                .get();

            if (snapshot.empty) return;

            const ratings = snapshot.docs.map(doc => doc.data().rating);
            const totalRatings = ratings.length;
            const averageRating = ratings.reduce((sum, r) => sum + r, 0) / totalRatings;

            // Update community routine
            const routine = await this.get('community_routines', routineId);
            if (routine) {
                await this.set('community_routines', routineId, {
                    ...routine,
                    averageRating: Math.round(averageRating * 10) / 10,
                    totalRatings
                });
            }
        } catch (error) {
            console.error('Error updating routine rating:', error);
        }
    }

    /**
     * Toggle favorite for a routine
     * @param {string} userId - User ID
     * @param {string} routineId - Routine ID
     * @param {boolean} favorite - True to favorite, false to unfavorite
     * @returns {Promise<void>}
     */
    async toggleFavoriteRoutine(userId, routineId, favorite) {
        try {
            if (!this.db) this.init();

            const favoriteKey = `favorite_${userId}_${routineId}`;

            if (favorite) {
                // Add favorite
                await this.set('routine_favorites', favoriteKey, {
                    userId,
                    routineId,
                    timestamp: new Date().toISOString()
                });

                // Increment favorites count
                const routine = await this.get('community_routines', routineId);
                if (routine) {
                    await this.set('community_routines', routineId, {
                        ...routine,
                        favorites: (routine.favorites || 0) + 1
                    });
                }
            } else {
                // Remove favorite
                await this.delete('routine_favorites', favoriteKey);

                // Decrement favorites count
                const routine = await this.get('community_routines', routineId);
                if (routine) {
                    await this.set('community_routines', routineId, {
                        ...routine,
                        favorites: Math.max(0, (routine.favorites || 0) - 1)
                    });
                }
            }

            console.log('✅ Favorite toggled:', { routineId, favorite });
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    /**
     * Get user's favorite routines
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of favorite routine IDs
     */
    async getUserFavoriteRoutines(userId) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('routine_favorites')
                .where('userId', '==', userId)
                .get();

            return snapshot.docs.map(doc => doc.data().routineId);
        } catch (error) {
            console.error('Error getting favorite routines:', error);
            return [];
        }
    }

    /**
     * Increment routine completion count (for community routines)
     * @param {string} routineId - Routine ID
     * @returns {Promise<void>}
     */
    async incrementRoutineCompletion(routineId) {
        try {
            if (!this.db) this.init();

            // Try custom_routines first
            let routine = await this.get('custom_routines', routineId);
            let collection = 'custom_routines';
            
            // If not found, try community_routines
            if (!routine) {
                routine = await this.get('community_routines', routineId);
                collection = 'community_routines';
            }

            if (routine) {
                await this.set(collection, routineId, {
                    ...routine,
                    timesCompleted: (routine.timesCompleted || 0) + 1
                });
                console.log(`✅ Incremented timesCompleted for routine ${routineId} in ${collection}`);

                // Award bonus points to creator (only for community routines completed by others)
                if (collection === 'community_routines' && routine.createdBy) {
                    const creator = await this.getUser(routine.createdBy);
                    if (creator) {
                        creator.totalPoints = (creator.totalPoints || 0) + 10;
                        await this.saveUser(creator);
                        console.log('✅ Creator awarded 10 bonus points for routine completion');
                    }
                }
            } else {
                console.warn(`⚠️ Routine ${routineId} not found in custom_routines or community_routines`);
            }
        } catch (error) {
            console.error('Error incrementing routine completion:', error);
        }
    }

    /**
     * Get a specific custom routine
     * @param {string} routineId - Routine ID
     * @returns {Promise<Object|null>} Routine data or null
     */
    async getCustomRoutine(routineId) {
        try {
            if (!this.db) this.init();

            // Try custom_routines first
            let routine = await this.get('custom_routines', routineId);

            // If not found, try community_routines
            if (!routine) {
                routine = await this.get('community_routines', routineId);
            }

            return routine;
        } catch (error) {
            console.error('Error getting custom routine:', error);
            return null;
        }
    }

    /**
     * Save custom game
     * @param {string} userId - User ID
     * @param {Object} game - Game data
     * @returns {Promise<Object>} Saved game data
     */
    async saveCustomGame(userId, game) {
        try {
            if (!this.db) this.init();

            const gameId = game.id || `user_game_${Date.now()}_${userId.slice(0, 8)}`;

            const gameData = {
                ...game,
                id: gameId,
                createdBy: userId,
                createdAt: game.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to custom_games collection
            await this.set('custom_games', gameId, gameData);

            // If public, also save to community_games
            if (game.isPublic) {
                await this.set('community_games', gameId, gameData);
            }

            console.log('✅ Custom game saved:', gameId);
            return gameData;
        } catch (error) {
            console.error('Error saving custom game:', error);
            throw error;
        }
    }

    /**
     * Get user's custom games
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of custom games
     */
    async getUserCustomGames(userId) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('custom_games')
                .where('createdBy', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading custom games:', error);
            return [];
        }
    }

    /**
     * Update custom game
     * @param {string} userId - User ID
     * @param {string} gameId - Game ID
     * @param {Object} updates - Update data
     */
    async updateCustomGame(userId, gameId, updates) {
        try {
            if (!this.db) this.init();

            const gameData = {
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await this.set('custom_games', gameId, gameData);

            // Update in community if public
            if (updates.isPublic) {
                await this.set('community_games', gameId, gameData);
            } else {
                // Remove from community if made private
                await this.delete('community_games', gameId);
            }

            console.log('✅ Custom game updated:', gameId);
        } catch (error) {
            console.error('Error updating custom game:', error);
            throw error;
        }
    }

    /**
     * Delete custom game
     * @param {string} userId - User ID
     * @param {string} gameId - Game ID
     */
    async deleteCustomGame(userId, gameId) {
        try {
            if (!this.db) this.init();

            await this.delete('custom_games', gameId);
            await this.delete('community_games', gameId);

            console.log('✅ Custom game deleted:', gameId);
        } catch (error) {
            console.error('Error deleting custom game:', error);
            throw error;
        }
    }

    /**
     * Get custom game by ID
     * @param {string} userId - User ID
     * @param {string} gameId - Game ID
     * @returns {Promise<Object>} Game data
     */
    async getCustomGame(userId, gameId) {
        try {
            if (!this.db) this.init();

            // Try custom_games first
            let game = await this.get('custom_games', gameId);

            // If not found, try community_games
            if (!game) {
                game = await this.get('community_games', gameId);
            }

            return game;
        } catch (error) {
            console.error('Error getting custom game:', error);
            return null;
        }
    }

    /**
     * Get community games
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of community games
     */
    /**
     * Get community games (from both community_games and custom_games collections)
     * @param {Object} filters - Filter options
     * @param {string} userId - Current user ID (optional, for filtering user's own games)
     * @returns {Promise<Array>} Array of games
     */
    async getCommunityGames(filters = {}, userId = null) {
        try {
            if (!this.db) this.init();

            // Get games from both community_games AND custom_games collections
            const [communitySnapshot, customSnapshot] = await Promise.all([
                this.db.collection('community_games').limit(100).get(),
                this.db.collection('custom_games').limit(100).get()
            ]);

            let games = [
                ...communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                ...customSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            ];

            console.log(`📥 Fetched ${games.length} total games from both collections`);

            // Remove duplicates (game might be in both collections)
            const gameMap = new Map();
            games.forEach(game => {
                if (!gameMap.has(game.id)) {
                    gameMap.set(game.id, game);
                }
            });
            games = Array.from(gameMap.values());

            console.log(`🔄 After deduplication: ${games.length} games`);

            // Filter for public games OR games created by current user
            games = games.filter(game => {
                const isPublic = game.isPublic === true;
                const isOwnGame = userId && game.createdBy === userId;
                const isLegacy = !game.hasOwnProperty('isPublic');

                return isPublic || isOwnGame || isLegacy;
            });

            console.log(`✅ After visibility filter: ${games.length} games (userId: ${userId || 'none'})`);

            // Apply difficulty filter if provided
            if (filters.difficulty) {
                games = games.filter(game => game.difficulty === filters.difficulty);
                console.log(`🎯 After difficulty filter: ${games.length} games`);
            }

            // Sort in memory
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder || 'desc';
            games.sort((a, b) => {
                const aVal = a[sortBy] || 0;
                const bVal = b[sortBy] || 0;
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
                }
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });

            const result = games.slice(0, 50); // Return max 50 games
            console.log(`📤 Returning ${result.length} games`);

            return result;
        } catch (error) {
            console.error('Error loading community games:', error);
            return [];
        }
    }

    /**
     * Add a reaction to an activity
     * @param {string} activityId - Activity ID
     * @param {string} userId - User ID adding reaction
     * @param {string} reaction - Reaction emoji
     * @returns {Promise<void>}
     */
    async addReaction(activityId, userId, reaction) {
        try {
            if (!this.db) this.init();

            const user = await this.getUser(userId);
            const activityRef = this.db.collection('activity_feed').doc(activityId);

            // Get current reactions
            const doc = await activityRef.get();
            if (!doc.exists) return;

            const data = doc.data();
            const reactions = data.reactions || {};

            // Initialize reaction array if needed
            if (!reactions[reaction]) {
                reactions[reaction] = [];
            }

            // Toggle reaction (add if not present, remove if present)
            const userIndex = reactions[reaction].findIndex(r => r.userId === userId);
            if (userIndex >= 0) {
                reactions[reaction].splice(userIndex, 1);
                if (reactions[reaction].length === 0) {
                    delete reactions[reaction];
                }
            } else {
                reactions[reaction].push({
                    userId,
                    displayName: user?.displayName || 'Unknown',
                    timestamp: new Date().toISOString()
                });
            }

            await activityRef.update({ reactions });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    /**
     * Add a comment to an activity
     * @param {string} activityId - Activity ID
     * @param {string} userId - User ID adding comment
     * @param {string} text - Comment text
     * @returns {Promise<void>}
     */
    async addComment(activityId, userId, text) {
        try {
            if (!this.db) this.init();

            const user = await this.getUser(userId);
            const activityRef = this.db.collection('activity_feed').doc(activityId);

            // Get current comments
            const doc = await activityRef.get();
            if (!doc.exists) return;

            const data = doc.data();
            const comments = data.comments || [];

            comments.push({
                id: `comment_${Date.now()}`,
                userId,
                displayName: user?.displayName || 'Unknown',
                profilePicture: user?.profilePictureURL || null,
                text,
                timestamp: new Date().toISOString()
            });

            await activityRef.update({ comments });

            // Notify the activity owner if different from commenter
            if (data.userId !== userId) {
                await this.createNotification(data.userId, {
                    type: 'comment',
                    icon: '💬',
                    text: `${user?.displayName || 'Someone'} commented on your activity`,
                    activityId,
                    fromUserId: userId
                });
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }

    /**
     * Create a notification for a user
     * @param {string} userId - User to notify
     * @param {Object} notification - Notification data
     * @returns {Promise<void>}
     */
    async createNotification(userId, notification) {
        try {
            if (!this.db) this.init();

            await this.db.collection('users').doc(userId).collection('notifications').add({
                ...notification,
                read: false,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {number} limit - Max notifications to return
     * @returns {Promise<Array>}
     */
    async getNotifications(userId, limit = 20) {
        try {
            if (!this.db) this.init();

            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timeAgo: this.getTimeAgo(doc.data().timestamp)
            }));
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     * @returns {Promise<void>}
     */
    async markNotificationRead(userId, notificationId) {
        try {
            if (!this.db) this.init();

            await this.db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .doc(notificationId)
                .update({ read: true });
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    }

    /**
     * Create head-to-head challenge
     * @param {Object} challenge - Challenge details
     * @returns {Promise<string>} Challenge ID
     */
    async createHeadToHeadChallenge(challenge) {
        try {
            if (!this.db) this.init();

            const fromUser = await this.getUser(challenge.fromUserId);
            const toUser = await this.getUser(challenge.toUserId);

            const docRef = await this.db.collection('h2h_challenges').add({
                ...challenge,
                fromDisplayName: fromUser?.displayName || 'Unknown',
                fromProfilePicture: fromUser?.profilePictureURL || null,
                toDisplayName: toUser?.displayName || 'Unknown',
                toProfilePicture: toUser?.profilePictureURL || null,
                status: 'pending',
                fromScore: 0,
                toScore: 0,
                fromSessions: [],
                toSessions: [],
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (challenge.duration || 7) * 24 * 60 * 60 * 1000).toISOString()
            });

            // Notify the challenged user
            await this.createNotification(challenge.toUserId, {
                type: 'h2h_challenge',
                icon: '⚔️',
                text: `${fromUser?.displayName || 'Someone'} challenged you to a head-to-head!`,
                challengeId: docRef.id,
                fromUserId: challenge.fromUserId
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating H2H challenge:', error);
            throw error;
        }
    }

    /**
     * Get head-to-head challenges for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getHeadToHeadChallenges(userId) {
        try {
            if (!this.db) this.init();

            // Get challenges where user is sender or receiver
            const [fromSnapshot, toSnapshot] = await Promise.all([
                this.db.collection('h2h_challenges')
                    .where('fromUserId', '==', userId)
                    .get(),
                this.db.collection('h2h_challenges')
                    .where('toUserId', '==', userId)
                    .get()
            ]);

            const challenges = [];

            fromSnapshot.docs.forEach(doc => {
                challenges.push({ id: doc.id, ...doc.data() });
            });

            toSnapshot.docs.forEach(doc => {
                // Avoid duplicates
                if (!challenges.find(c => c.id === doc.id)) {
                    challenges.push({ id: doc.id, ...doc.data() });
                }
            });

            // Sort by created date
            challenges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return challenges;
        } catch (error) {
            console.error('Error getting H2H challenges:', error);
            return [];
        }
    }

    /**
     * Update head-to-head challenge score
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User whose score to update
     * @param {Object} sessionData - Session data
     * @returns {Promise<void>}
     */
    async updateH2HChallengeScore(challengeId, userId, sessionData) {
        try {
            if (!this.db) this.init();

            const challengeRef = this.db.collection('h2h_challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) return;

            const challenge = doc.data();
            const isFromUser = challenge.fromUserId === userId;

            const field = isFromUser ? 'from' : 'to';
            const sessions = challenge[`${field}Sessions`] || [];
            sessions.push(sessionData);

            // Calculate new score based on challenge type
            let newScore = 0;
            switch (challenge.type) {
                case 'points':
                    newScore = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
                    break;
                case 'accuracy':
                    const totalMakes = sessions.reduce((sum, s) => sum + (s.makes || 0), 0);
                    const totalAttempts = sessions.reduce((sum, s) => sum + (s.attempts || 0), 0);
                    newScore = totalAttempts > 0 ? (totalMakes / totalAttempts * 100) : 0;
                    break;
                case 'sessions':
                    newScore = sessions.length;
                    break;
                default:
                    newScore = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
            }

            await challengeRef.update({
                [`${field}Sessions`]: sessions,
                [`${field}Score`]: newScore
            });
            
            console.log(`✅ H2H Challenge score updated: ${challengeId}, ${field}Score = ${newScore}`);

            // Check if challenge should auto-complete (both players have submitted)
            const updatedDoc = await challengeRef.get();
            const updatedChallenge = updatedDoc.data();
            
            // Auto-complete if challenge has ended (past expiresAt) or if there's a target and someone reached it
            const now = new Date();
            const endTime = new Date(updatedChallenge.expiresAt || updatedChallenge.endTime);
            const hasTarget = updatedChallenge.target && updatedChallenge.target > 0;
            const fromReachedTarget = hasTarget && (updatedChallenge.fromScore || 0) >= updatedChallenge.target;
            const toReachedTarget = hasTarget && (updatedChallenge.toScore || 0) >= updatedChallenge.target;
            
            if ((!isNaN(endTime.getTime()) && now >= endTime) || fromReachedTarget || toReachedTarget) {
                // Time to determine winner
                return await this.completeH2HChallenge(challengeId);
            }
            
            return null;
        } catch (error) {
            console.error('Error updating H2H score:', error);
            return null;
        }
    }

    /**
     * Complete an H2H challenge and determine winner
     * @param {string} challengeId - Challenge ID
     * @returns {Promise<Object>} - Result with winner info and ELO changes
     */
    async completeH2HChallenge(challengeId) {
        try {
            if (!this.db) this.init();

            const challengeRef = this.db.collection('h2h_challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) return null;

            const challenge = doc.data();
            
            // Don't re-complete already completed challenges
            if (challenge.status === 'completed') {
                return { alreadyCompleted: true };
            }

            const fromScore = challenge.fromScore || 0;
            const toScore = challenge.toScore || 0;

            let winnerId = null;
            let loserId = null;
            let isDraw = false;

            if (fromScore > toScore) {
                winnerId = challenge.fromUserId;
                loserId = challenge.toUserId;
            } else if (toScore > fromScore) {
                winnerId = challenge.toUserId;
                loserId = challenge.fromUserId;
            } else {
                isDraw = true;
            }

            // Update challenge status
            await challengeRef.update({
                status: 'completed',
                completedAt: new Date().toISOString(),
                winnerId: winnerId,
                isDraw: isDraw
            });

            let eloChanges = null;
            let wagerAwarded = 0;

            // Update ELO and award wager points if there's a winner (not a draw)
            if (winnerId && loserId) {
                // Import teamsLeaguesManager dynamically to avoid circular deps
                const { teamsLeaguesManager } = await import('./teamsLeagues.js');
                if (teamsLeaguesManager.db) {
                    eloChanges = await teamsLeaguesManager.updateEloAfterMatch(winnerId, loserId);
                }

                // Award wager points to winner if wager exists
                if (challenge.wagerPoints && challenge.wagerPoints > 0) {
                    wagerAwarded = challenge.wagerPoints;
                    const winner = await this.getUser(winnerId);
                    if (winner) {
                        winner.totalPoints = (winner.totalPoints || 0) + wagerAwarded;
                        winner.h2hWagersWon = (winner.h2hWagersWon || 0) + 1;
                        winner.h2hWagerPointsWon = (winner.h2hWagerPointsWon || 0) + wagerAwarded;
                        await this.saveUser(winner);
                        console.log(`💰 H2H wager awarded: ${wagerAwarded} pts to ${winner.displayName}`);
                    }
                }
            }

            // Notify both players
            const winnerName = winnerId === challenge.fromUserId ? challenge.fromDisplayName : challenge.toDisplayName;
            const loserName = loserId === challenge.fromUserId ? challenge.fromDisplayName : challenge.toDisplayName;

            if (isDraw) {
                await this.createNotification(challenge.fromUserId, {
                    type: 'h2h_completed',
                    icon: '🤝',
                    text: `Your challenge with ${challenge.toDisplayName} ended in a draw!`,
                    challengeId
                });
                await this.createNotification(challenge.toUserId, {
                    type: 'h2h_completed',
                    icon: '🤝',
                    text: `Your challenge with ${challenge.fromDisplayName} ended in a draw!`,
                    challengeId
                });
            } else {
                // Notify winner
                const wagerText = wagerAwarded > 0 ? ` Won ${wagerAwarded} pts!` : '';
                await this.createNotification(winnerId, {
                    type: 'h2h_won',
                    icon: '🏆',
                    text: `You won the challenge against ${loserName}!${eloChanges ? ` (+${eloChanges.winner.change} ELO)` : ''}${wagerText}`,
                    challengeId
                });
                // Notify loser
                await this.createNotification(loserId, {
                    type: 'h2h_lost',
                    icon: '😔',
                    text: `${winnerName} won the challenge.${eloChanges ? ` (${eloChanges.loser.change} ELO)` : ''}`,
                    challengeId
                });
            }

            console.log(`✅ H2H Challenge completed: ${challengeId}, winner: ${winnerId || 'draw'}${wagerAwarded ? `, wager: ${wagerAwarded} pts` : ''}`);

            return {
                winnerId,
                loserId,
                isDraw,
                eloChanges,
                wagerAwarded,
                fromScore,
                toScore
            };
        } catch (error) {
            console.error('Error completing H2H challenge:', error);
            return null;
        }
    }

    /**
     * Accept or decline head-to-head challenge
     * @param {string} challengeId - Challenge ID
     * @param {boolean} accept - Whether to accept
     * @returns {Promise<void>}
     */
    async respondToH2HChallenge(challengeId, accept) {
        try {
            if (!this.db) this.init();

            const challengeRef = this.db.collection('h2h_challenges').doc(challengeId);
            const doc = await challengeRef.get();

            if (!doc.exists) return;

            const challenge = doc.data();

            if (accept) {
                await challengeRef.update({
                    status: 'active',
                    acceptedAt: new Date().toISOString()
                });

                // Notify challenger
                await this.createNotification(challenge.fromUserId, {
                    type: 'h2h_accepted',
                    icon: '⚔️',
                    text: `${challenge.toDisplayName} accepted your challenge!`,
                    challengeId
                });
            } else {
                await challengeRef.update({
                    status: 'declined',
                    declinedAt: new Date().toISOString()
                });

                // Notify challenger
                await this.createNotification(challenge.fromUserId, {
                    type: 'h2h_declined',
                    icon: '❌',
                    text: `${challenge.toDisplayName} declined your challenge`,
                    challengeId
                });
            }
        } catch (error) {
            console.error('Error responding to H2H challenge:', error);
        }
    }
}

// Export singleton instance
export const storageManager = new StorageManager();
