/**
 * Authentication Module
 * Handles user authentication with Google Sign-In only
 */

import { getAuth } from '../config/firebase.js';

class AuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.onAuthChangeCallback = null;
    }

    /**
     * Initialize authentication
     * @param {Function} onAuthChange - Callback for auth state changes
     */
    init(onAuthChange) {
        this.auth = getAuth();
        this.onAuthChangeCallback = onAuthChange;

        // Listen for auth state changes
        this.auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
            
            if (this.onAuthChangeCallback) {
                await this.onAuthChangeCallback(firebaseUser);
            }
        });
    }

    /**
     * Sign in with Google
     * @returns {Promise<Object>} User credential
     */
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Add required scopes
            provider.addScope('profile');
            provider.addScope('email');
            
            // Set custom parameters for better UX
            provider.setCustomParameters({
                prompt: 'select_account' // Always show account selection
            });
            
            const result = await this.auth.signInWithPopup(provider);
            console.log('✅ Google sign-in successful:', result.user.email);
            
            return result;
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Handle specific Firebase Auth error codes
            switch (error.code) {
                case 'auth/popup-blocked':
                    throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
                
                case 'auth/popup-closed-by-user':
                    throw new Error('Sign-in was cancelled. Please try again.');
                
                case 'auth/cancelled-popup-request':
                    throw new Error('Another sign-in is already in progress. Please wait and try again.');
                
                case 'auth/network-request-failed':
                    throw new Error('Network error. Please check your internet connection and try again.');
                
                case 'auth/unauthorized-domain':
                    throw new Error('This domain is not authorized for Google Sign-In. Please contact support.');
                
                case 'auth/operation-not-allowed':
                    throw new Error('Google Sign-In is not enabled. Please contact support.');
                
                case 'auth/invalid-credential':
                    throw new Error('Invalid credentials. Please try again.');
                
                case 'auth/account-exists-with-different-credential':
                    throw new Error('An account already exists with this email using a different sign-in method.');
                
                case 'auth/user-disabled':
                    throw new Error('This account has been disabled. Please contact support.');
                
                default:
                    throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
            }
        }
    }

    /**
     * Sign out current user
     * @returns {Promise<void>}
     */
    async signOut() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log('✅ User signed out successfully');
        } catch (error) {
            console.error('❌ Sign-out error:', error);
            throw new Error('Failed to sign out. Please try again.');
        }
    }

    /**
     * Get current user
     * @returns {Object|null} Current Firebase user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is signed in
     */
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }

    /**
     * Get user ID token
     * @returns {Promise<string>} ID token
     */
    async getIdToken() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('No user is currently signed in');
        }
        return await user.getIdToken();
    }

    /**
     * Get user display info
     * @returns {Object} User display information
     */
    getUserDisplayInfo() {
        const user = this.getCurrentUser();
        if (!user) return null;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        };
    }
}

// Export singleton instance
export const authManager = new AuthManager();
