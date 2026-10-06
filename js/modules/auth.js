/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Authentication Module
 *
 * Android/iOS (Capacitor): Uses @capacitor-firebase/authentication plugin
 *   for native Google/Apple sign-in — returns directly to the app, no browser redirect.
 * Web: Uses Firebase signInWithPopup as normal.
 */

import { getAuth } from '../config/firebase.js';

class AuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.onAuthChangeCallback = null;
        this.isSigningUp = false;
        this.isSigningIn = false;
    }

    init(onAuthChange) {
        this.auth = getAuth();
        this.onAuthChangeCallback = onAuthChange;

        this.auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
            if (this.onAuthChangeCallback) {
                await this.onAuthChangeCallback(firebaseUser);
            }
        });
    }

    /**
     * No-op — redirect flow no longer used.
     * Kept so existing app.js call doesn't break.
     */
    async checkRedirectResult() {
        return null;
    }

    /**
     * Sign in with Google
     * - Capacitor: uses @capacitor-firebase/authentication plugin (native picker, returns to app)
     * - Web: uses signInWithPopup
     */
    async signInWithGoogle() {
        try {
            const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isCapacitor) {
                console.log('📱 Capacitor — using FirebaseAuthentication plugin for Google sign-in');
                const { FirebaseAuthentication } = window.Capacitor.Plugins;

                if (!FirebaseAuthentication) {
                    throw new Error(
                        'FirebaseAuthentication plugin not available. ' +
                        'Run: npm install @capacitor-firebase/authentication --legacy-peer-deps --save && npx cap sync'
                    );
                }

                const result = await FirebaseAuthentication.signInWithGoogle();

                // No credential = user cancelled the native picker (not an error)
                if (!result?.credential?.idToken) {
                    console.log('ℹ️ Google sign-in cancelled by user');
                    return null;
                }

                // Hand the native idToken to the Firebase web SDK
                const credential = firebase.auth.GoogleAuthProvider.credential(result.credential.idToken);
                const firebaseResult = await this.auth.signInWithCredential(credential);
                console.log('✅ Native Google sign-in:', firebaseResult.user.email);
                return firebaseResult;

            } else {
                // Web: popup
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                provider.setCustomParameters({ prompt: 'select_account' });
                const result = await this.auth.signInWithPopup(provider);
                console.log('✅ Google sign-in successful:', result.user.email);
                return result;
            }
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            // Silently ignore user cancels — not an error
            if (error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request' ||
                error.message?.includes('cancel') ||
                error.message?.includes('Cancel') ||
                error.message?.includes('dismissed') ||
                error.code === 10) {
                console.log('ℹ️ Google sign-in cancelled by user');
                return null;
            }
            switch (error.code) {
                case 'auth/popup-blocked':
                    throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
                case 'auth/popup-closed-by-user':
                    return null;
                case 'auth/cancelled-popup-request':
                    return null;
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
     * Sign in with Apple
     * - Capacitor: uses @capacitor-firebase/authentication plugin (native)
     * - Web: uses signInWithPopup
     */
    async signInWithApple() {
        try {
            const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isCapacitor) {
                console.log('📱 Capacitor detected — using FirebaseAuthentication plugin for Apple...');
                const { FirebaseAuthentication } = window.Capacitor.Plugins;

                if (!FirebaseAuthentication) {
                    throw new Error('FirebaseAuthentication plugin not available.');
                }

                const result = await FirebaseAuthentication.signInWithApple();
                console.log('✅ Native Apple sign-in result:', result);

                const provider = new firebase.auth.OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: result.credential.idToken,
                    rawNonce: result.credential.nonce
                });
                const firebaseResult = await this.auth.signInWithCredential(credential);
                console.log('✅ Apple Firebase sign-in successful:', firebaseResult.user.email);
                return firebaseResult;

            } else {
                const provider = new firebase.auth.OAuthProvider('apple.com');
                provider.addScope('email');
                provider.addScope('name');
                const result = await this.auth.signInWithPopup(provider);
                console.log('✅ Apple sign-in successful:', result.user.email);
                return result;
            }
        } catch (error) {
            console.error('❌ Apple sign-in error:', error);
            // Silently ignore user cancels — not an error
            if (error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request' ||
                error.message?.includes('cancel') ||
                error.message?.includes('Cancel') ||
                error.message?.includes('dismissed') ||
                error.message?.includes('1001')) {
                console.log('ℹ️ Apple sign-in cancelled by user');
                return null;
            }
            switch (error.code) {
                case 'auth/popup-blocked':
                    throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
                case 'auth/popup-closed-by-user':
                    return null; // already handled above but kept for safety
                case 'auth/cancelled-popup-request':
                    return null;
                case 'auth/network-request-failed':
                    throw new Error('Network error. Please check your internet connection and try again.');
                case 'auth/unauthorized-domain':
                    throw new Error('This domain is not authorized for Apple Sign-In. Please contact support.');
                case 'auth/operation-not-allowed':
                    throw new Error('Apple Sign-In is not enabled. Please contact support.');
                case 'auth/account-exists-with-different-credential':
                    throw new Error('An account already exists with this email using a different sign-in method.');
                case 'auth/user-disabled':
                    throw new Error('This account has been disabled. Please contact support.');
                default:
                    throw new Error(error.message || 'Failed to sign in with Apple. Please try again.');
            }
        }
    }

    async signInWithEmail(email, password) {
        if (this.isSigningIn) {
            throw new Error('Sign-in already in progress, please wait...');
        }
        this.isSigningIn = true;
        console.log('🔐 Starting sign-in for:', email);
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Email sign-in successful:', result.user.email);
            return result;
        } catch (error) {
            console.error('❌ Email sign-in error:', error);
            switch (error.code) {
                case 'auth/user-not-found': throw new Error('No account found with this email.');
                case 'auth/wrong-password': throw new Error('Incorrect password.');
                case 'auth/invalid-email': throw new Error('Invalid email address.');
                case 'auth/user-disabled': throw new Error('This account has been disabled.');
                default: throw new Error(error.message || 'Failed to sign in.');
            }
        } finally {
            this.isSigningIn = false;
        }
    }

    async signUpWithEmail(email, password, displayName) {
        if (this.isSigningUp) {
            throw new Error('Sign-up already in progress, please wait...');
        }
        this.isSigningUp = true;
        console.log('🔐 Starting sign-up for:', email);
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName });
            console.log('✅ Email sign-up successful:', result.user.email);
            return result;
        } catch (error) {
            console.error('❌ Email sign-up error:', error);
            switch (error.code) {
                case 'auth/email-already-in-use': throw new Error('An account with this email already exists.');
                case 'auth/invalid-email': throw new Error('Invalid email address.');
                case 'auth/weak-password': throw new Error('Password should be at least 6 characters.');
                default: throw new Error(error.message || 'Failed to create account.');
            }
        } finally {
            this.isSigningUp = false;
        }
    }

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

    getCurrentUser() { return this.auth.currentUser; }
    isAuthenticated() { return this.auth.currentUser !== null; }

    async getIdToken() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No user is currently signed in');
        return await user.getIdToken();
    }

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

// ─── Account Linking ────────────────────────────────────────────────────

    /**
     * Get which providers are linked to the current account
     * @returns {string[]} Array of provider IDs e.g. ['password', 'google.com']
     */
    getLinkedProviders() {
        const user = this.getCurrentUser();
        if (!user) return [];
        return user.providerData.map(p => p.providerId);
    }

    /**
     * Link Google account to current email/password account
     * - Capacitor: uses FirebaseAuthentication plugin
     * - Web: uses linkWithPopup
     * @returns {Promise<Object>} Updated user credential
     */
    async linkWithGoogle() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No user signed in');

        try {
            const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isCapacitor) {
                const { FirebaseAuthentication } = window.Capacitor.Plugins;
                if (!FirebaseAuthentication) throw new Error('FirebaseAuthentication plugin not available.');

                const result = await FirebaseAuthentication.signInWithGoogle();
                if (!result?.credential?.idToken) return null; // cancelled
                const credential = firebase.auth.GoogleAuthProvider.credential(result.credential.idToken);
                const linked = await user.linkWithCredential(credential);
                console.log('✅ Google account linked:', linked.user.email);
                return linked;
            } else {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                const linked = await user.linkWithPopup(provider);
                console.log('✅ Google account linked:', linked.user.email);
                return linked;
            }
        } catch (error) {
            console.error('❌ Link Google error:', error);
            if (error.code === 'auth/credential-already-in-use') {
                throw new Error('This Google account is already linked to another user.');
            }
            if (error.code === 'auth/provider-already-linked') {
                throw new Error('Google is already linked to your account.');
            }
            throw new Error(error.message || 'Failed to link Google account.');
        }
    }

    /**
     * Link Apple account to current email/password account
     * - Capacitor: uses FirebaseAuthentication plugin
     * - Web: uses linkWithPopup
     * @returns {Promise<Object>} Updated user credential
     */
    async linkWithApple() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No user signed in');

        try {
            const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isCapacitor) {
                const { FirebaseAuthentication } = window.Capacitor.Plugins;
                if (!FirebaseAuthentication) throw new Error('FirebaseAuthentication plugin not available.');

                const result = await FirebaseAuthentication.signInWithApple();
                if (!result.credential?.idToken) {
                    throw new Error('No ID token returned from Apple sign-in.');
                }
                const provider = new firebase.auth.OAuthProvider('apple.com');
                const credential = provider.credential({
                    idToken: result.credential.idToken,
                    rawNonce: result.credential.nonce
                });
                const linked = await user.linkWithCredential(credential);
                console.log('✅ Apple account linked:', linked.user.email);
                return linked;
            } else {
                const provider = new firebase.auth.OAuthProvider('apple.com');
                provider.addScope('email');
                provider.addScope('name');
                const linked = await user.linkWithPopup(provider);
                console.log('✅ Apple account linked:', linked.user.email);
                return linked;
            }
        } catch (error) {
            console.error('❌ Link Apple error:', error);
            if (error.code === 'auth/credential-already-in-use') {
                throw new Error('This Apple account is already linked to another user.');
            }
            if (error.code === 'auth/provider-already-linked') {
                throw new Error('Apple is already linked to your account.');
            }
            throw new Error(error.message || 'Failed to link Apple account.');
        }
    }

    /**
     * Unlink a provider from the current account
     * @param {string} providerId - e.g. 'google.com' or 'apple.com'
     */
    async unlinkProvider(providerId) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No user signed in');

        // Must have at least 2 providers or a password to unlink safely
        const providers = this.getLinkedProviders();
        if (providers.length <= 1) {
            throw new Error('Cannot unlink — you need at least one sign-in method remaining.');
        }

        try {
            await user.unlink(providerId);
            console.log('✅ Provider unlinked:', providerId);
        } catch (error) {
            console.error('❌ Unlink error:', error);
            throw new Error(error.message || 'Failed to unlink account.');
        }
    }
}

export const authManager = new AuthManager();
