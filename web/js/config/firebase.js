/**
 * Firebase Configuration
 * Handles Firebase initialization and configuration
 */

// Your Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCgmfArNbUbrVF4Myd5Vjb33Iu4y91NJl0",
  authDomain: "putting-improver-waugs.firebaseapp.com",
  projectId: "putting-improver-waugs",
  storageBucket: "putting-improver-waugs.firebasestorage.app",
  messagingSenderId: "775646376758",
  appId: "1:775646376758:web:015aff788bb2b4cd9fb997",
  measurementId: "G-X91923BWL1"
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
