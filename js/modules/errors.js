/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Better Error Messages
 * Provides specific, helpful error messages with contextual guidance
 */

/**
 * Error message templates with helpful guidance
 */
export const ERROR_MESSAGES = {
    // Session Errors
    SESSION_NOT_FOUND: {
        title: 'Session Not Found',
        message: 'This practice session could not be found. It may have been deleted.',
        suggestion: 'Please refresh the page and try again.'
    },
    SESSION_DELETE_FAILED: {
        title: 'Delete Failed',
        message: 'Could not delete the practice session.',
        suggestion: 'Please check your internet connection and try again.'
    },
    SESSION_SAVE_FAILED: {
        title: 'Save Failed',
        message: 'Could not save your practice session.',
        suggestion: 'Check your internet connection. Your data has not been lost - try again.'
    },
    SESSION_INVALID_INPUT: {
        title: 'Invalid Input',
        message: 'Please check your entries:',
        suggestion: 'Makes must be between 0 and attempts. Distance must be positive.'
    },
    SESSION_ACCEPT_FAILED: {
        title: 'Accept Failed',
        message: 'Could not accept this session.',
        suggestion: 'The session may have been deleted. Please refresh the page.'
    },
    SESSION_REJECT_FAILED: {
        title: 'Reject Failed',
        message: 'Could not reject this session.',
        suggestion: 'Please try again or refresh the page.'
    },

    // Routine Errors
    ROUTINE_NOT_FOUND: {
        title: 'Routine Not Found',
        message: 'This routine could not be found.',
        suggestion: 'It may have been deleted. Please refresh the page.'
    },
    ROUTINE_DELETE_FAILED: {
        title: 'Delete Failed',
        message: 'Could not delete the routine.',
        suggestion: 'Check your connection and try again.'
    },
    ROUTINE_ACCEPT_FAILED: {
        title: 'Accept Failed',
        message: 'Could not accept this routine.',
        suggestion: 'The routine may no longer exist. Try refreshing the page.'
    },
    ROUTINE_REJECT_FAILED: {
        title: 'Reject Failed',
        message: 'Could not reject this routine.',
        suggestion: 'Please try again in a moment.'
    },

    // Game Errors
    GAME_NOT_FOUND: {
        title: 'Game Not Found',
        message: 'This game could not be found.',
        suggestion: 'It may have been deleted. Please refresh the page.'
    },
    GAME_DELETE_FAILED: {
        title: 'Delete Failed',
        message: 'Could not delete the game.',
        suggestion: 'Check your connection and try again.'
    },
    GAME_SAVE_FAILED: {
        title: 'Save Failed',
        message: 'Could not save the game results.',
        suggestion: 'Check your internet connection and try submitting again.'
    },
    GAME_ACCEPT_FAILED: {
        title: 'Accept Failed',
        message: 'Could not accept this game.',
        suggestion: 'The game may no longer exist. Try refreshing.'
    },
    GAME_REJECT_FAILED: {
        title: 'Reject Failed',
        message: 'Could not reject this game.',
        suggestion: 'Please try again.'
    },

    // Multiplayer Errors
    MULTIPLAYER_NO_PLAYERS: {
        title: 'No Players Selected',
        message: 'Please select at least one player to log for.',
        suggestion: 'Check the boxes next to the players you want to log for.'
    },
    MULTIPLAYER_INVALID_STATS: {
        title: 'Invalid Stats',
        message: 'Some player stats are invalid.',
        suggestion: 'Makes cannot exceed attempts. Please check all entries.'
    },
    MULTIPLAYER_SAVE_FAILED: {
        title: 'Save Failed',
        message: 'Could not save multiplayer session.',
        suggestion: 'Check your connection. Try logging for fewer players at once.'
    },

    // Network Errors
    NETWORK_ERROR: {
        title: 'Connection Error',
        message: 'Could not connect to the server.',
        suggestion: 'Check your internet connection and try again.'
    },
    PERMISSION_DENIED: {
        title: 'Permission Denied',
        message: 'You don\'t have permission to perform this action.',
        suggestion: 'Make sure you\'re logged in. Try refreshing the page.'
    },

    // Auth Errors
    AUTH_REQUIRED: {
        title: 'Login Required',
        message: 'You must be logged in to do that.',
        suggestion: 'Please log in and try again.'
    },
    AUTH_FAILED: {
        title: 'Login Failed',
        message: 'Could not log you in.',
        suggestion: 'Check your email and password, then try again.'
    },

    // Validation Errors
    VALIDATION_REQUIRED_FIELD: {
        title: 'Required Field',
        message: 'Please fill in all required fields.',
        suggestion: 'Fields marked with * are required.'
    },
    VALIDATION_INVALID_NUMBER: {
        title: 'Invalid Number',
        message: 'Please enter a valid number.',
        suggestion: 'Numbers must be positive and whole (no decimals).'
    },
    VALIDATION_OUT_OF_RANGE: {
        title: 'Out of Range',
        message: 'The number you entered is out of the valid range.',
        suggestion: null // Will be filled in with specific range
    }
};

/**
 * Show an error with better messaging
 * @param {Object} app - App instance
 * @param {string} errorKey - Key from ERROR_MESSAGES
 * @param {Object} options - Optional override/additional info
 */
export function showBetterError(app, errorKey, options = {}) {
    const template = ERROR_MESSAGES[errorKey] || {
        title: 'Error',
        message: 'Something went wrong.',
        suggestion: 'Please try again.'
    };

    const title = options.title || template.title;
    const message = options.message || template.message;
    const suggestion = options.suggestion !== undefined ? options.suggestion : template.suggestion;

    // Combine message and suggestion
    let fullMessage = message;
    if (suggestion) {
        fullMessage += `

💡 ${suggestion}`;
    }

    // Add technical details if provided (for debugging)
    if (options.technical && process.env.NODE_ENV !== 'production') {
        fullMessage += `

🔧 Technical: ${options.technical}`;
    }

    app.showToast({
        type: 'error',
        title: title,
        message: fullMessage,
        duration: 6000 // Longer for errors so user can read
    });
}

/**
 * Show a validation error with specific field info
 * @param {Object} app - App instance
 * @param {string} fieldName - Name of the invalid field
 * @param {string} issue - What's wrong with it
 * @param {string} suggestion - How to fix it
 */
export function showValidationError(app, fieldName, issue, suggestion) {
    app.showToast({
        type: 'error',
        title: `Invalid ${fieldName}`,
        message: `${issue}

💡 ${suggestion}`,
        duration: 5000
    });
}

/**
 * Show a network error with retry suggestion
 * @param {Object} app - App instance
 * @param {string} action - What action failed
 * @param {Error} error - The error object
 */
export function showNetworkError(app, action, error) {
    const isOffline = !navigator.onLine;

    app.showToast({
        type: 'error',
        title: 'Connection Error',
        message: `Could not ${action}.

💡 ${isOffline ? 'You appear to be offline. Check your internet connection.' : 'Server connection failed. Please try again.'}`,
        duration: 6000
    });

    console.error(`Network error during ${action}:`, error);
}

/**
 * Parse Firebase error and show user-friendly message
 * @param {Object} app - App instance
 * @param {Error} error - Firebase error
 * @param {string} context - What was being attempted
 */
export function showFirebaseError(app, error, context) {
    let title = 'Error';
    let message = `Could not ${context}.`;
    let suggestion = 'Please try again.';

    // Parse common Firebase errors
    if (error.code) {
        switch (error.code) {
            case 'permission-denied':
                title = 'Permission Denied';
                message = 'You don\'t have permission to do that.';
                suggestion = 'Make sure you\'re logged in, then refresh the page.';
                break;
            case 'not-found':
                title = 'Not Found';
                message = 'The item you\'re looking for doesn\'t exist.';
                suggestion = 'It may have been deleted. Try refreshing the page.';
                break;
            case 'unavailable':
                title = 'Service Unavailable';
                message = 'The server is temporarily unavailable.';
                suggestion = 'Please wait a moment and try again.';
                break;
            case 'unauthenticated':
                title = 'Not Logged In';
                message = 'You must be logged in to do that.';
                suggestion = 'Please log in and try again.';
                break;
            default:
                // Use error message if available
                message = error.message || message;
        }
    }

    app.showToast({
        type: 'error',
        title: title,
        message: `${message}

💡 ${suggestion}`,
        duration: 6000
    });

    console.error(`Firebase error during ${context}:`, error);
}
