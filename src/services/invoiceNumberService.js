import { supabase } from './supabaseClient';

/**
 * Generate a unique alphanumeric invoice number.
 * Format: [BRAND_INITIALS]-[REP_INITIALS]-[GLOBAL_SEQ]
 * Example: HK-OE-00142
 * 
 * @param {string} brandName - Brand name (e.g., "Honey King")
 * @param {string} repName - Sales rep full name (e.g., "Omar Elsayed")
 * @returns {Promise<string>} Invoice number
 */
export async function generateInvoiceNumber(brandName, repName) {
    try {
        // Get brand initials (first letter of each word, max 2)
        const brandInitials = getInitials(brandName, 2);

        // Get rep initials (first letter of first and last name)
        const repInitials = getInitials(repName, 2);

        // Get total company sales count for sequential number
        const totalSalesCount = await getTotalSalesCount();

        // Pad to 5 digits
        const sequentialNum = String(totalSalesCount + 1).padStart(5, '0');

        // Get current date in DDMMYY format
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const dateCode = `${day}${month}${year}`;

        // Format: BRAND-REP-SEQ-DDMMYY
        // Example: HK-OE-00142-230126
        return `${brandInitials}-${repInitials}-${sequentialNum}-${dateCode}`;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to timestamp-based number
        return `INV-${Date.now().toString(36).toUpperCase()}`;
    }
}

/**
 * Extract initials from a name
 * @param {string} name - Full name
 * @param {number} maxLetters - Maximum number of letters to extract
 * @returns {string} Uppercase initials
 */
function getInitials(name, maxLetters = 2) {
    if (!name) return 'XX';

    const words = name.trim().split(/\s+/);
    const initials = words
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, maxLetters)
        .join('');

    // Pad with X if not enough words
    return initials.padEnd(maxLetters, 'X');
}

/**
 * Get total sales count from database
 * @returns {Promise<number>} Total number of sales
 */
async function getTotalSalesCount() {
    const { count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error getting sales count:', error);
        return Math.floor(Date.now() / 1000) % 100000; // Fallback
    }

    return count || 0;
}

/**
 * Validate invoice number format
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {boolean} True if valid format
 */
export function isValidInvoiceNumber(invoiceNumber) {
    // Format: XX-YY-NNNNN
    const pattern = /^[A-Z]{1,3}-[A-Z]{1,3}-\d{5}$/;
    return pattern.test(invoiceNumber);
}
