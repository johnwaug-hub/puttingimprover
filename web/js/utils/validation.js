/**
 * Validation Utilities
 * Input validation and sanitization functions
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Validate session input data
 * @param {number} makes - Number of successful putts
 * @param {number} attempts - Total number of attempts
 * @param {number} distance - Distance in feet
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateSessionInput(makes, attempts, distance) {
    const errors = [];

    // Check if values are numbers
    if (isNaN(makes) || isNaN(attempts) || isNaN(distance)) {
        errors.push('All fields must be valid numbers');
        return { isValid: false, errors };
    }

    // Validate makes
    if (makes < CONSTANTS.VALIDATION.MIN_MAKES) {
        errors.push(`Makes must be at least ${CONSTANTS.VALIDATION.MIN_MAKES}`);
    }

    // Validate attempts
    if (attempts < CONSTANTS.VALIDATION.MIN_ATTEMPTS) {
        errors.push(`Attempts must be at least ${CONSTANTS.VALIDATION.MIN_ATTEMPTS}`);
    }

    // Validate distance
    if (distance < CONSTANTS.VALIDATION.MIN_DISTANCE) {
        errors.push(`Distance must be at least ${CONSTANTS.VALIDATION.MIN_DISTANCE} feet`);
    }

    if (distance > CONSTANTS.VALIDATION.MAX_DISTANCE) {
        errors.push(`Distance must be at most ${CONSTANTS.VALIDATION.MAX_DISTANCE} feet`);
    }

    // Makes cannot exceed attempts
    if (makes > attempts) {
        errors.push('Makes cannot exceed attempts');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate routine drill data
 * @param {Object} drill - Drill object with distance and attempts
 * @returns {Object} Validation result
 */
export function validateDrill(drill) {
    const errors = [];

    if (!drill.distance || drill.distance < CONSTANTS.VALIDATION.MIN_DISTANCE) {
        errors.push('Drill distance must be at least 1 foot');
    }

    if (!drill.attempts || drill.attempts < 1) {
        errors.push('Drill must have at least 1 attempt');
    }

    if (!drill.description || drill.description.trim() === '') {
        errors.push('Drill must have a description');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize string input
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Parse and validate date
 * @param {string} dateStr - Date string to validate
 * @returns {Object} Validation result with parsed date
 */
export function validateDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    if (date > now) {
        return { isValid: false, error: 'Date cannot be in the future' };
    }

    return { isValid: true, date };
}
