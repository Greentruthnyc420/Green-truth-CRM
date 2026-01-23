// Push Notification Service
// Handles FCM token management and notification display

import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabaseClient';

// VAPID key for web push (generate from Firebase Console > Project Settings > Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

/**
 * Request permission and get FCM token
 * @param {string} userId - User ID to associate token with
 * @returns {Promise<string|null>} FCM token or null if denied
 */
export async function requestNotificationPermission(userId) {
    try {
        // Check if messaging is supported
        if (!messaging) {
            console.warn('[Notifications] Push messaging not supported in this browser');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('[Notifications] Permission denied');
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
            console.log('[Notifications] FCM Token obtained');

            // Save token to database for later use
            await saveTokenToDatabase(userId, token);

            return token;
        }

        return null;
    } catch (error) {
        console.error('[Notifications] Error getting token:', error);
        return null;
    }
}

/**
 * Save FCM token to Supabase for server-side push
 */
async function saveTokenToDatabase(userId, token) {
    try {
        const { error } = await supabase
            .from('user_fcm_tokens')
            .upsert({
                user_id: userId,
                fcm_token: token,
                platform: 'web',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
        console.log('[Notifications] Token saved to database');
    } catch (err) {
        console.warn('[Notifications] Failed to save token:', err);
    }
}

/**
 * Set up foreground message handler
 * @param {function} onNotification - Callback when notification received
 */
export function setupForegroundNotifications(onNotification) {
    if (!messaging) return () => { };

    const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[Notifications] Foreground message:', payload);

        const { title, body, icon } = payload.notification || {};
        const data = payload.data || {};

        // Show in-app notification
        if (onNotification) {
            onNotification({
                title: title || 'GreenTruth',
                body: body || 'You have a new notification',
                data
            });
        }

        // Also show browser notification if page is visible
        if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
            new Notification(title || 'GreenTruth', {
                body: body || 'You have a new notification',
                icon: icon || '/icons/icon-192x192.png',
                data
            });
        }
    });

    return unsubscribe;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled() {
    return Notification.permission === 'granted' && messaging !== null;
}

/**
 * Get current notification permission status
 */
export function getNotificationStatus() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission; // 'granted', 'denied', or 'default'
}

/**
 * Show a local notification (for in-app use)
 */
export function showLocalNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') return;

    new Notification(title, {
        body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: options.tag || 'greentruth-notification',
        requireInteraction: options.requireInteraction || false,
        data: options.data || {}
    });
}
