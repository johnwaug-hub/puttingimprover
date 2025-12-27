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
     * Get all sessions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of session objects
     */
    async getUserSessions(userId) {
        try {
            if (!this.db) this.init();
            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('sessions')
                .orderBy('date', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error getting sessions for ${userId}:`, error);
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

    // Leaderboard methods

    /**
     * Get all users for leaderboard
     * @returns {Promise<Array>} Sorted array of users by points
     */
    async getLeaderboard() {
        try {
            if (!this.db) this.init();
            const snapshot = await this.db
                .collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(100)
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }
}

// Export singleton instance
export const storageManager = new StorageManager();

