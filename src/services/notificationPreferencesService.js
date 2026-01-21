// Notification Preferences Service
// Manages email notification settings for all user types

import { supabase } from './supabaseClient';

/**
 * Default notification preferences by user type
 */
export const DEFAULT_PREFERENCES = {
    rep: {
        notify_lead_assigned: true,
        notify_activation_approved: true,
        notify_activation_reminder: true,
        notify_payment_processed: true
    },
    brand: {
        notify_new_order: true,
        notify_activation_request: true,
        notify_activation_completed: true,
        notify_invoice_ready: true,
        notify_low_inventory: false
    },
    admin: {
        notify_new_lead: true,
        notify_new_sale: true,
        notify_new_user: true,
        notify_partnership_inquiry: true,
        notify_daily_summary: false
    },
    dispensary: {
        notify_order_confirmed: true,
        notify_order_shipped: true,
        notify_invoice_ready: true
    }
};

/**
 * Notification types with labels and descriptions
 */
export const NOTIFICATION_TYPES = {
    rep: [
        { key: 'notify_lead_assigned', label: 'New Lead Assigned', description: 'When admin assigns you a new dispensary lead' },
        { key: 'notify_activation_approved', label: 'Activation Approved', description: 'When your scheduled activation is approved' },
        { key: 'notify_activation_reminder', label: 'Activation Reminder', description: '24 hours before your scheduled activation' },
        { key: 'notify_payment_processed', label: 'Payment Processed', description: 'When your commission or wages are paid' }
    ],
    brand: [
        { key: 'notify_new_order', label: 'New Order', description: 'When a dispensary places an order' },
        { key: 'notify_activation_request', label: 'Activation Request', description: 'When a rep requests an activation' },
        { key: 'notify_activation_completed', label: 'Activation Completed', description: 'When an activation is logged' },
        { key: 'notify_invoice_ready', label: 'Invoice Ready', description: 'When a new invoice is generated' },
        { key: 'notify_low_inventory', label: 'Low Inventory Alert', description: 'When product stock runs low' }
    ],
    admin: [
        { key: 'notify_new_lead', label: 'New Lead', description: 'When any new lead is logged' },
        { key: 'notify_new_sale', label: 'New Sale', description: 'When any sale is logged' },
        { key: 'notify_new_user', label: 'New User Registration', description: 'When someone creates an account' },
        { key: 'notify_partnership_inquiry', label: 'Partnership Inquiry', description: 'When someone submits the landing page form' },
        { key: 'notify_daily_summary', label: 'Daily Summary', description: 'End of day activity digest' }
    ],
    dispensary: [
        { key: 'notify_order_confirmed', label: 'Order Confirmed', description: 'When your order is confirmed' },
        { key: 'notify_order_shipped', label: 'Order Shipped', description: 'When your order is shipped' },
        { key: 'notify_invoice_ready', label: 'Invoice Ready', description: 'When you receive a new invoice' }
    ]
};

/**
 * Get notification preferences for a user
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} - User's notification preferences
 */
export async function getNotificationPreferences(userId) {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
            console.error('Error fetching notification preferences:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error in getNotificationPreferences:', err);
        return null;
    }
}

/**
 * Create or update notification preferences for a user
 * @param {string} userId - User's ID
 * @param {string} email - User's email
 * @param {string} userType - 'rep', 'brand', 'admin', or 'dispensary'
 * @param {Object} preferences - Preference updates
 * @returns {Promise<boolean>} - Success status
 */
export async function saveNotificationPreferences(userId, email, userType, preferences) {
    try {
        const { error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: userId,
                email: email,
                user_type: userType,
                ...preferences,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error saving notification preferences:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in saveNotificationPreferences:', err);
        return false;
    }
}

/**
 * Check if a user has a specific notification enabled
 * @param {string} userId - User's ID
 * @param {string} notificationType - The notification key (e.g., 'notify_new_lead')
 * @returns {Promise<boolean>} - true if notification is enabled
 */
export async function isNotificationEnabled(userId, notificationType) {
    try {
        const prefs = await getNotificationPreferences(userId);

        // If no preferences saved, use defaults based on notification type
        if (!prefs) {
            // Check which user type this notification belongs to
            for (const [userType, defaults] of Object.entries(DEFAULT_PREFERENCES)) {
                if (notificationType in defaults) {
                    return defaults[notificationType];
                }
            }
            return true; // Default to enabled if not specified
        }

        // Return the saved preference, defaulting to true if not set
        return prefs[notificationType] !== false;
    } catch (err) {
        console.error('Error checking notification preference:', err);
        return true; // Default to enabled on error
    }
}

/**
 * Check if a user (by email) should receive a specific notification
 * @param {string} email - User's email
 * @param {string} notificationType - The notification key
 * @returns {Promise<boolean>} - true if notification should be sent
 */
export async function shouldNotifyByEmail(email, notificationType) {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select(notificationType)
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking notification by email:', error);
            return true; // Default to enabled on error
        }

        // If no preferences found, default to enabled
        if (!data) return true;

        return data[notificationType] !== false;
    } catch (err) {
        console.error('Error in shouldNotifyByEmail:', err);
        return true;
    }
}

/**
 * Get all users who have a specific notification enabled
 * @param {string} notificationType - The notification key
 * @returns {Promise<string[]>} - Array of email addresses
 */
export async function getUsersWithNotificationEnabled(notificationType) {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('email')
            .eq(notificationType, true);

        if (error) {
            console.error('Error fetching users with notification:', error);
            return [];
        }

        return data?.map(row => row.email) || [];
    } catch (err) {
        console.error('Error in getUsersWithNotificationEnabled:', err);
        return [];
    }
}

/**
 * Initialize default preferences for a new user
 * @param {string} userId - User's ID
 * @param {string} email - User's email
 * @param {string} userType - 'rep', 'brand', 'admin', or 'dispensary'
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeUserPreferences(userId, email, userType = 'rep') {
    const defaults = DEFAULT_PREFERENCES[userType] || DEFAULT_PREFERENCES.rep;
    return saveNotificationPreferences(userId, email, userType, defaults);
}
