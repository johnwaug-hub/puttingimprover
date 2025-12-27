/**
 * Firebase Configuration
 * Handles Firebase initialization and configuration
 */

// Your Firebase configuration (from Firebase Console)
export const firebaseConfig = {
    apiKey: "AIzaSyC0YK7lt09RondeOsY7koRd-aWXNAWd100",
    authDomain: "putting-improver-5fac4.firebaseapp.com",
    projectId: "putting-improver-5fac4",
    storageBucket: "putting-improver-5fac4.firebasestorage.app",
    messagingSenderId: "32692594502",
    appId: "1:32692594502:web:714d58cab2a442a5afe747",
    measurementId: "G-XLNYQ3RQYV"
};

/**
 * Wait for Firebase to be loaded
 * @returns {Promise<void>}
 */
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkFirebase = () => {
            attempts++;
            
            if (typeof firebase !== 'undefined') {
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Firebase SDK failed to load. Please check your internet connection and try again.'));
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        
        checkFirebase();
    });
}

/**
 * Initialize Firebase
 * @returns {Promise<Object>} Firebase app instance
 */
export async function initializeFirebase() {
    // Wait for Firebase SDK to load
    await waitForFirebase();

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
        console.log('📱 Project:', firebaseConfig.projectId);
    } else {
        console.log('ℹ️ Firebase already initialized');
    }

    return firebase.app();
}

/**
 * Get Firebase Auth instance
 * @returns {Object} Firebase Auth instance
 */
export function getAuth() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return firebase.auth();
}

/**
 * Get Firebase Firestore instance
 * @returns {Object} Firebase Firestore instance
 */
export function getFirestore() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return firebase.firestore();
}
