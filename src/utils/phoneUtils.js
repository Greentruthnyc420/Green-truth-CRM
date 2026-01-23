// Phone Number Formatting Utilities
// Formats phone numbers as (XXX) XXX-XXXX for professional display
// Stores raw digits in database for consistency

/**
 * Format a phone number string to (XXX) XXX-XXXX format
 * @param {string} value - The input phone number (can be partially typed)
 * @returns {string} - The formatted phone number
 */
export function formatPhoneNumber(value) {
    if (!value) return '';

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 10 digits (US phone numbers)
    const trimmed = digits.slice(0, 10);

    // Format based on how many digits we have
    if (trimmed.length === 0) {
        return '';
    } else if (trimmed.length <= 3) {
        return `(${trimmed}`;
    } else if (trimmed.length <= 6) {
        return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
    } else {
        return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
    }
}

/**
 * Remove formatting from phone number, returning only digits
 * @param {string} value - The formatted phone number
 * @returns {string} - Just the digits
 */
export function unformatPhoneNumber(value) {
    if (!value) return '';
    return value.replace(/\D/g, '');
}

/**
 * Validate if a phone number has the correct format (10 digits)
 * @param {string} value - The phone number (formatted or unformatted)
 * @returns {boolean} - True if valid US phone number
 */
export function isValidPhoneNumber(value) {
    if (!value) return false;
    const digits = value.replace(/\D/g, '');
    return digits.length === 10;
}

/**
 * Handle phone input change - formats as user types
 * Use this as the onChange handler for phone inputs
 * @param {string} value - The new input value
 * @param {function} setter - State setter function
 */
export function handlePhoneChange(value, setter) {
    const formatted = formatPhoneNumber(value);
    setter(formatted);
}

/**
 * Format phone for database storage (just digits, or formatted - your choice)
 * The database can store either format since we normalize on read
 * @param {string} value - The formatted phone number
 * @returns {string} - The phone number for storage (formatted for readability)
 */
export function formatPhoneForStorage(value) {
    // Store formatted for readability in DB, we can always strip on read if needed
    return formatPhoneNumber(value);
}

/**
 * Format phone from database for display
 * Handles both formatted and unformatted values from DB
 * @param {string} value - Phone number from database
 * @returns {string} - Formatted phone number for display
 */
export function formatPhoneFromDB(value) {
    if (!value) return '';
    // If it's already formatted, return as-is
    if (value.includes('(') && value.includes(')')) {
        return value;
    }
    // Otherwise format the digits
    return formatPhoneNumber(value);
}
