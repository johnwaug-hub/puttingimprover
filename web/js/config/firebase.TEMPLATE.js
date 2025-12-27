/**
 * Firebase Configuration - PASTE YOUR CONFIG HERE
 * 
 * HOW TO GET YOUR CONFIG:
 * 1. Go to: https://console.firebase.google.com/
 * 2. Select project: putting-improver-5fac4 (or create new project)
 * 3. Click gear icon ⚙️ → Project settings
 * 4. Scroll to "Your apps" → Web app (</> icon)
 * 5. Copy the firebaseConfig values
 * 6. Paste them below (replace the placeholder values)
 * 7. Save this file
 * 8. Clear browser cache and test
 * 
 * IMPORTANT: Keep the "export const" - don't remove it!
 */

// PASTE YOUR FIREBASE CONFIG HERE (replace everything between the { } )
export const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY_HERE",
    authDomain: "putting-improver-5fac4.firebaseapp.com",
    projectId: "putting-improver-5fac4",
    storageBucket: "putting-improver-5fac4.firebasestorage.app",
    messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
    appId: "PASTE_YOUR_APP_ID_HERE",
    measurementId: "PASTE_YOUR_MEASUREMENT_ID_HERE"
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
