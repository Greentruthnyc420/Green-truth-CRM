/**
 * User-friendly Firebase Auth error messages
 * Maps Firebase error codes to clean, professional error messages
 * that don't expose technical details to end users
 */

const ERROR_MESSAGES = {
    // Email/Password Errors
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/invalid-login-credentials': 'Invalid email or password. Please try again.',

    // Password Strength
    'auth/weak-password': 'Password must be at least 6 characters long.',

    // Rate Limiting
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',

    // OAuth Errors
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',

    // Network Errors
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/timeout': 'The request timed out. Please try again.',

    // Configuration Errors
    'auth/api-key-not-valid': 'System configuration error. Please contact support.',
    'auth/app-deleted': 'System error. Please refresh the page.',
    'auth/invalid-api-key': 'System configuration error. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',

    // Session Errors
    'auth/requires-recent-login': 'Please sign out and sign back in to continue.',
    'auth/session-expired': 'Your session has expired. Please sign in again.',

    // Email Verification
    'auth/expired-action-code': 'This link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This link is invalid or has already been used.',

    // Default
    'default': 'Something went wrong. Please try again.'
};

/**
 * Converts a Firebase Auth error to a user-friendly message
 * @param {Error} error - The Firebase error object or error message
 * @returns {string} User-friendly error message
 */
export function getAuthErrorMessage(error) {
    if (!error) return ERROR_MESSAGES.default;

    // Handle error objects
    let errorCode = null;
    let errorMessage = '';

    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.code) {
        errorCode = error.code;
        errorMessage = error.message || '';
    } else if (error.message) {
        errorMessage = error.message;
    }

    // First check if we have a direct error code match
    if (errorCode && ERROR_MESSAGES[errorCode]) {
        return ERROR_MESSAGES[errorCode];
    }

    // Check if the error message contains a known error code
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
        if (code !== 'default' && errorMessage.includes(code)) {
            return message;
        }
    }

    // Clean up Firebase error messages that start with "Firebase: "
    if (errorMessage.includes('Firebase: ')) {
        errorMessage = errorMessage.replace('Firebase: ', '');
        // Remove the error code in parentheses at the end
        errorMessage = errorMessage.replace(/\s*\([^)]*\)\s*\.?$/, '');
    }

    // If it's a relatively clean message (no error codes), use it
    if (errorMessage && !errorMessage.includes('auth/') && errorMessage.length < 200) {
        return errorMessage;
    }

    // Return default message
    return ERROR_MESSAGES.default;
}

/**
 * Checks if an error is a "user already exists" error
 * @param {Error} error - The Firebase error object
 * @returns {boolean}
 */
export function isEmailInUseError(error) {
    if (!error) return false;
    const code = error.code || error.message || '';
    return code.includes('email-already-in-use');
}

/**
 * Checks if an error is network-related
 * @param {Error} error - The Firebase error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
    if (!error) return false;
    const code = error.code || error.message || '';
    return code.includes('network-request-failed') || code.includes('timeout');
}

export default getAuthErrorMessage;
