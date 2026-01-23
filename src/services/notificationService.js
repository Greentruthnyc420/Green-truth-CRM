import { supabase } from './supabaseClient';

/**
 * Notification Service
 * Handles creating, fetching, and managing notifications
 */

// Notification types
export const NOTIFICATION_TYPES = {
    LEAD_ADDED: 'lead_added',
    SALE_LOGGED: 'sale_logged',
    ACTIVATION_LOGGED: 'activation_logged',
    NEW_DEAL: 'new_deal',
    MENU_UPDATED: 'menu_updated',
    ORDER_STATUS: 'order_status',
    SYSTEM: 'system'
};

/**
 * Request browser notification permission
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} options - Additional options (icon, tag, etc.)
 */
export function showBrowserNotification(title, body, options = {}) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/gt-logo.png',
            badge: '/gt-logo.png',
            tag: options.tag || 'greentruth-notification',
            ...options
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Handle click
        notification.onclick = () => {
            window.focus();
            if (options.onClick) options.onClick();
            notification.close();
        };

        return notification;
    }
    return null;
}

/**
 * Create a notification for a specific user
 * @param {string} userId - Target user's ID
 * @param {string} type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data (link, entity IDs, etc.)
 * @returns {Promise<Object|null>} - Created notification or null on error
 */
export async function createNotification(userId, type, title, message, data = {}) {
    try {
        const { data: notification, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                message,
                data
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Send notification to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 */
export async function sendNotificationToMany(userIds, type, title, message, data = {}) {
    const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message,
        data
    }));

    try {
        const { error } = await supabase
            .from('notifications')
            .insert(notifications);

        if (error) {
            console.error('Error sending notifications:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending notifications:', error);
        return false;
    }
}

/**
 * Get all admin user IDs
 * @returns {Promise<string[]>} - Array of admin user IDs
 */
export async function getAdminUserIds() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin');

        if (error) {
            console.error('Error fetching admin users:', error);
            return [];
        }

        return data.map(u => u.id);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return [];
    }
}

/**
 * Get all sales rep user IDs
 * @returns {Promise<string[]>} - Array of sales rep user IDs
 */
export async function getSalesRepUserIds() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'sales');

        if (error) {
            console.error('Error fetching sales reps:', error);
            return [];
        }

        return data.map(u => u.id);
    } catch (error) {
        console.error('Error fetching sales reps:', error);
        return [];
    }
}

/**
 * Fetch notifications for the current user
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} - Array of notifications
 */
export async function getNotifications({ limit = 20, unreadOnly = false } = {}) {
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get unread notification count for the current user
 * @returns {Promise<number>} - Unread count
 */
export async function getUnreadCount() {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 */
export async function markAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead() {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error marking all as read:', error);
        return false;
    }
}

/**
 * Subscribe to real-time notifications for the current user
 * @param {Function} callback - Called when a new notification arrives
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToNotifications(userId, callback) {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

// ============================================
// HIGH-LEVEL NOTIFICATION HELPERS
// These are the functions to call from actions
// ============================================

/**
 * Notify admins when a new lead is added
 */
export async function notifyAdminsLeadAdded(leadName, repName) {
    const adminIds = await getAdminUserIds();
    await sendNotificationToMany(
        adminIds,
        NOTIFICATION_TYPES.LEAD_ADDED,
        '🆕 New Lead Added',
        `${repName} added a new lead: ${leadName}`,
        { type: 'lead' }
    );
}

/**
 * Notify admins when a sale is logged
 */
export async function notifyAdminsSaleLogged(dispensaryName, amount, repName) {
    const adminIds = await getAdminUserIds();
    await sendNotificationToMany(
        adminIds,
        NOTIFICATION_TYPES.SALE_LOGGED,
        '💰 Sale Logged',
        `${repName} logged a $${amount.toLocaleString()} sale at ${dispensaryName}`,
        { type: 'sale' }
    );
}

/**
 * Notify admins when an activation is logged
 */
export async function notifyAdminsActivationLogged(dispensaryName, brandName, repName) {
    const adminIds = await getAdminUserIds();
    await sendNotificationToMany(
        adminIds,
        NOTIFICATION_TYPES.ACTIVATION_LOGGED,
        '🎉 Activation Completed',
        `${repName} completed an activation at ${dispensaryName} for ${brandName}`,
        { type: 'activation' }
    );
}

/**
 * Notify sales reps when a brand adds a new deal
 */
export async function notifySalesRepsNewDeal(brandName, dealName) {
    const salesRepIds = await getSalesRepUserIds();
    await sendNotificationToMany(
        salesRepIds,
        NOTIFICATION_TYPES.NEW_DEAL,
        '🏷️ New Deal Available',
        `${brandName} just added a new deal: ${dealName}`,
        { type: 'deal' }
    );
}

/**
 * Notify sales reps when a brand updates their menu
 */
export async function notifySalesRepsMenuUpdated(brandName, itemCount) {
    const salesRepIds = await getSalesRepUserIds();
    await sendNotificationToMany(
        salesRepIds,
        NOTIFICATION_TYPES.MENU_UPDATED,
        '📋 Menu Updated',
        `${brandName} updated their menu (${itemCount} products)`,
        { type: 'menu' }
    );
}
