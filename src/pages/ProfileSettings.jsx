import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import { useNotification } from '../contexts/NotificationContext';
import { User, Instagram, Phone, MapPin, Save, Loader, ArrowLeft, Settings, Palette, HelpCircle, LogOut, ChevronRight, Bell, Mail, ShieldCheck } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import { getTourSteps } from '../data/tourSteps';
import { getNotificationPreferences, saveNotificationPreferences, NOTIFICATION_TYPES } from '../services/notificationPreferencesService';

export default function ProfileSettings() {
    const { currentUser, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showTheme, setShowTheme] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationPrefs, setNotificationPrefs] = useState({});
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        instagramHandle: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        loadProfile();
    }, [currentUser]);

    const loadProfile = async () => {
        if (!currentUser?.uid) return;

        setLoading(true);
        try {
            const data = await getUserProfile(currentUser.uid);
            if (data) {
                setProfile({
                    name: data.name || currentUser.displayName || '',
                    instagramHandle: data.instagramHandle || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });
            }

            // Load notification preferences
            const notifPrefs = await getNotificationPreferences(currentUser.uid);
            if (notifPrefs) {
                setNotificationPrefs(notifPrefs);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            showNotification('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = async (key, value) => {
        const newPrefs = { ...notificationPrefs, [key]: value };
        setNotificationPrefs(newPrefs);

        setSavingNotifications(true);
        try {
            await saveNotificationPreferences(
                currentUser.uid,
                currentUser.email,
                'rep', // Default to rep, can be updated based on role
                { [key]: value }
            );
        } catch (error) {
            console.error('Failed to save notification preference:', error);
            // Revert on error
            setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
        } finally {
            setSavingNotifications(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!profile.instagramHandle?.trim()) {
            showNotification('Instagram handle is required', 'error');
            return;
        }

        setSaving(true);
        try {
            const success = await updateUserProfile(currentUser.uid, {
                name: profile.name,
                instagramHandle: profile.instagramHandle.replace(/^@/, ''),
                phone: profile.phone,
                address: profile.address
            });

            if (success) {
                showNotification('Profile updated successfully!', 'success');
            } else {
                showNotification('Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            showNotification('Error saving profile: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
            showNotification('Failed to log out', 'error');
        }
    };

    const formatInstagram = (value) => {
        return value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '');
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <NavLink to="/app" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </NavLink>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Settings className="text-brand-600" size={24} />
                        Settings
                    </h1>
                    <p className="text-slate-500 text-sm">Update your profile and preferences</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="themed-card rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-sm px-2 pb-2" style={{ color: 'var(--text-secondary)' }}>Quick Actions</h3>

                {/* Admin Portal - Only for admins */}
                {currentUser?.email && Array.isArray(ADMIN_EMAILS) && ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) && (
                    <NavLink
                        to="/admin"
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <ShieldCheck size={20} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Portal</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Manage team & operations</p>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                    </NavLink>
                )}

                {/* Theme */}
                <button
                    onClick={() => setShowTheme(!showTheme)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all group text-left"
                    style={{ background: showTheme ? 'var(--bg-secondary)' : 'transparent' }}
                >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Palette size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Theme</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Customize appearance</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors"
                        style={{ transform: showTheme ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Theme Switcher Inline */}
                {showTheme && (
                    <div className="px-4 py-2">
                        <ThemeSwitcher isOpen={true} onClose={() => setShowTheme(false)} inline={true} />
                    </div>
                )}

                {/* Help Tour */}
                <button
                    onClick={() => setShowTour(true)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all group text-left"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <HelpCircle size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard Tour</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Learn how to use the app</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

                {/* Email Notifications */}
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all group text-left"
                    style={{ background: showNotifications ? 'var(--bg-secondary)' : 'transparent' }}
                >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Bell size={20} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Email Notifications</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Manage what emails you receive</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors"
                        style={{ transform: showNotifications ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Notification Preferences Expanded */}
                {showNotifications && (
                    <div className="px-4 py-3 space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <Mail size={14} />
                            <span>Notifications sent to: <strong>{currentUser?.email}</strong></span>
                        </div>

                        {/* Push Notifications Toggle */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 pb-4 mb-2">
                            <div>
                                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {typeof Notification !== 'undefined' && Notification.permission === 'granted' 
                                        ? '✅ Enabled - you will receive browser notifications'
                                        : Notification.permission === 'denied'
                                        ? '❌ Blocked - enable in browser settings'
                                        : 'Enable push notifications for real-time alerts'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (typeof Notification === 'undefined') {
                                        showNotification('Push notifications not supported in this browser', 'error');
                                        return;
                                    }
                                    if (Notification.permission === 'granted') {
                                        showNotification('Push notifications already enabled!', 'success');
                                        return;
                                    }
                                    if (Notification.permission === 'denied') {
                                        showNotification('Please enable notifications in your browser settings', 'error');
                                        return;
                                    }
                                    try {
                                        const { requestNotificationPermission } = await import('../services/pushNotificationService');
                                        const token = await requestNotificationPermission(currentUser?.uid);
                                        if (token) {
                                            showNotification('Push notifications enabled!', 'success');
                                        } else {
                                            showNotification('Notification permission denied', 'error');
                                        }
                                    } catch (err) {
                                        console.error('Push notification error:', err);
                                        showNotification('Failed to enable notifications', 'error');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                    typeof Notification !== 'undefined' && Notification.permission === 'granted'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : Notification.permission === 'denied'
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-brand-600 text-white hover:bg-brand-700'
                                }`}
                            >
                                {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
                            </button>
                        </div>

                        {/* Email notification toggles */}
                        {NOTIFICATION_TYPES.rep.map(notif => (
                            <div key={notif.key} className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{notif.label}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{notif.description}</p>
                                </div>
                                <button
                                    onClick={() => handleNotificationToggle(notif.key, !notificationPrefs[notif.key])}
                                    disabled={savingNotifications}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs[notif.key] !== false ? 'bg-brand-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs[notif.key] !== false ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}

                        {savingNotifications && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader size={12} className="animate-spin" />
                                <span>Saving...</span>
                            </div>
                        )}
                    </div>
                )}


                {/* Sign Out */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all group text-left"
                >
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <LogOut size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-red-700">Sign Out</p>
                        <p className="text-xs text-red-500">Log out of your account</p>
                    </div>
                </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="themed-card rounded-2xl p-6 space-y-6">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Information</h3>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Display Name
                    </label>
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                            placeholder="Your name"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                    </div>
                </div>

                {/* Instagram - Required */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Instagram Handle <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                        <input
                            type="text"
                            required
                            className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                            placeholder="your_instagram"
                            value={profile.instagramHandle}
                            onChange={(e) => setProfile({ ...profile, instagramHandle: formatInstagram(e.target.value) })}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Used for activation flyers & social media tagging</p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Phone Number
                    </label>
                    <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="tel"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                            placeholder="(555) 123-4567"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Address
                    </label>
                    <div className="relative">
                        <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                        <textarea
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all resize-none"
                            placeholder="123 Main St, New York, NY 10001"
                            rows={2}
                            value={profile.address}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Account Info (Read-only) */}
            <div className="themed-card rounded-2xl p-6">
                <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Information</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentUser?.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">User ID</span>
                        <span className="font-mono text-xs text-slate-400">{currentUser?.uid?.slice(0, 12)}...</span>
                    </div>
                </div>
            </div>

            {/* Tour Overlay */}
            {showTour && (
                <OnboardingTour
                    steps={getTourSteps('sales_rep')}
                    isFirstTime={false}
                    onComplete={() => setShowTour(false)}
                    tourKey="sales_rep_settings_tour"
                />
            )}
        </div>
    );
}

