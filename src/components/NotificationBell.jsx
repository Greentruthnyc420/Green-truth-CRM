import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Loader2 } from 'lucide-react';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    showBrowserNotification,
    requestNotificationPermission
} from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationBell - A notification bell component with dropdown
 * Shows unread count badge and list of recent notifications
 */
export default function NotificationBell() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications on mount and subscribe to real-time updates
    useEffect(() => {
        if (!user?.uid) return;

        // Request notification permission on mount
        requestNotificationPermission();

        // Initial fetch
        fetchNotifications();
        fetchUnreadCount();

        // Subscribe to real-time notifications
        const unsubscribe = subscribeToNotifications(user.uid, (newNotification) => {
            // Add new notification to the list
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification
            showBrowserNotification(
                newNotification.title,
                newNotification.message,
                {
                    tag: `notification-${newNotification.id}`,
                    onClick: () => {
                        setIsOpen(true);
                        handleMarkAsRead(newNotification.id);
                    }
                }
            );
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.uid]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications({ limit: 20 });
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        await markAsRead(notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'lead_added': return '🆕';
            case 'sale_logged': return '💰';
            case 'activation_logged': return '🎉';
            case 'new_deal': return '🏷️';
            case 'menu_updated': return '📋';
            case 'order_status': return '📦';
            default: return '🔔';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            padding: '0 4px'
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl shadow-2xl z-50"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)'
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-3 border-b"
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--accent-primary)' }}
                            >
                                <CheckCheck className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-72">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                <Bell className="w-10 h-10 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                    className="flex items-start gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-white/5"
                                    style={{
                                        borderColor: 'var(--border-primary)',
                                        background: notification.is_read ? 'transparent' : 'var(--accent-primary-10, rgba(16, 185, 129, 0.1))'
                                    }}
                                >
                                    <span className="text-xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-medium truncate"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            {notification.title}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5 line-clamp-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {notification.message}
                                        </p>
                                        <p
                                            className="text-xs mt-1"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                            style={{ background: 'var(--accent-primary)' }}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div
                            className="p-2 border-t text-center"
                            style={{ borderColor: 'var(--border-primary)' }}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
