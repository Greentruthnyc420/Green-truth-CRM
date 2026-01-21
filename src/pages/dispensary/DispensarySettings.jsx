import React, { useState, useEffect } from 'react';
import { Settings, Bell, Users, Plus, Mail, Trash2, Save, Loader, Shield, ShoppingCart, Package, Eye, X, Check, Palette, HelpCircle, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { getNotificationPreferences, saveNotificationPreferences } from '../../services/notificationPreferencesService';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import { getTourSteps } from '../../data/tourSteps';

const TEAM_ROLES = [
    { id: 'admin', label: 'Admin', description: 'Full access to all features', icon: Shield, color: 'purple' },
    { id: 'buyer', label: 'Buying Manager', description: 'Can place orders and manage invoices', icon: ShoppingCart, color: 'emerald' },
    { id: 'inventory', label: 'Inventory Manager', description: 'Receives inventory and shipping updates', icon: Package, color: 'blue' },
    { id: 'viewer', label: 'Viewer', description: 'Read-only access to orders and reports', icon: Eye, color: 'slate' }
];

export default function DispensarySettings() {
    const { currentUser, logout } = useAuth();
    const { showNotification } = useNotification();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [showTour, setShowTour] = useState(false);

    // Notification preferences
    const [notificationPrefs, setNotificationPrefs] = useState({});
    const [savingNotifications, setSavingNotifications] = useState(false);

    // Team members
    const [teamMembers, setTeamMembers] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'viewer' });
    const [inviting, setInviting] = useState(false);

    // Notification email
    const [notificationEmail, setNotificationEmail] = useState('');

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        // Handle dev mode where currentUser may be null
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Load profile
            const p = await getUserProfile(currentUser.uid);
            setProfile(p);
            setNotificationEmail(p?.notificationEmail || currentUser.email);

            // Load notification preferences
            try {
                const prefs = await getNotificationPreferences(currentUser.uid);
                if (prefs) setNotificationPrefs(prefs);
            } catch (err) {
                console.warn('Could not load notification preferences:', err);
            }

            // Load team members (handle if table doesn't exist)
            try {
                const { data: members, error } = await supabase
                    .from('dispensary_team_members')
                    .select('*')
                    .eq('dispensary_id', currentUser.uid)
                    .order('created_at', { ascending: true });

                if (!error && members) setTeamMembers(members);
            } catch (err) {
                console.warn('Could not load team members:', err);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = async (key, value) => {
        setNotificationPrefs(prev => ({ ...prev, [key]: value }));
        setSavingNotifications(true);
        try {
            await saveNotificationPreferences(currentUser.uid, currentUser.email, 'dispensary', { [key]: value });
        } catch (error) {
            setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
        } finally {
            setSavingNotifications(false);
        }
    };

    const handleSaveNotificationEmail = async () => {
        setSaving(true);
        try {
            await updateUserProfile(currentUser.uid, { notificationEmail });
            showNotification('Notification email updated!', 'success');
        } catch (error) {
            showNotification('Failed to update email', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleInviteTeamMember = async (e) => {
        e.preventDefault();
        if (!inviteForm.email) return;

        setInviting(true);
        try {
            const { error } = await supabase.from('dispensary_team_members').insert([{
                dispensary_id: currentUser.uid,
                email: inviteForm.email.toLowerCase(),
                name: inviteForm.name || inviteForm.email.split('@')[0],
                role: inviteForm.role,
                status: 'pending',
                invited_by: currentUser.email
            }]);

            if (error) {
                if (error.code === '23505') {
                    showNotification('This email is already invited', 'error');
                } else {
                    throw error;
                }
            } else {
                showNotification(`Invited ${inviteForm.email} as ${inviteForm.role}`, 'success');
                setInviteForm({ email: '', name: '', role: 'viewer' });
                setShowInviteModal(false);
                loadData();
            }
        } catch (error) {
            console.error('Error inviting:', error);
            showNotification('Failed to send invitation', 'error');
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveTeamMember = async (memberId) => {
        try {
            await supabase.from('dispensary_team_members').delete().eq('id', memberId);
            setTeamMembers(prev => prev.filter(m => m.id !== memberId));
            showNotification('Team member removed', 'success');
        } catch (error) {
            showNotification('Failed to remove member', 'error');
        }
    };

    const getRoleInfo = (roleId) => TEAM_ROLES.find(r => r.id === roleId) || TEAM_ROLES[3];

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Settings className="text-emerald-600" size={24} />
                    Settings
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage notifications and team members</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-secondary)' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'general' ? 'shadow-sm' : ''}`}
                    style={{
                        background: activeTab === 'general' ? 'var(--bg-card)' : 'transparent',
                        color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}
                >
                    <Settings size={18} /> General
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'shadow-sm' : ''}`}
                    style={{
                        background: activeTab === 'notifications' ? 'var(--bg-card)' : 'transparent',
                        color: activeTab === 'notifications' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}
                >
                    <Bell size={18} /> Notifications
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'team' ? 'shadow-sm' : ''}`}
                    style={{
                        background: activeTab === 'team' ? 'var(--bg-card)' : 'transparent',
                        color: activeTab === 'team' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}
                >
                    <Users size={18} /> Team
                </button>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Theme Selection */}
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                            <Palette size={18} className="text-purple-600" />
                            Theme
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${theme === t.id ? 'ring-2 ring-emerald-500' : ''}`}
                                    style={{ background: 'var(--bg-secondary)' }}
                                >
                                    <t.icon size={24} className={theme === t.id ? 'text-emerald-600' : ''} style={{ color: theme !== t.id ? 'var(--text-secondary)' : undefined }} />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Help Tour */}
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                            <HelpCircle size={18} className="text-blue-600" />
                            Help & Tour
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Take a guided tour of the dispensary portal to learn about all available features.
                        </p>
                        <button
                            onClick={() => setShowTour(true)}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <HelpCircle size={18} /> Start Tour
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                            <LogOut size={18} className="text-red-600" />
                            Account
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Sign out of your dispensary account.
                        </p>
                        <button
                            onClick={async () => { await logout(); navigate('/dispensary/login'); }}
                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    {/* Notification Email */}
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Mail size={18} className="text-emerald-600" />
                            Notification Email
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            All notifications will be sent to this email address.
                        </p>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl outline-none transition-all"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="notifications@yourdispensary.com"
                            />
                            <button
                                onClick={handleSaveNotificationEmail}
                                disabled={saving}
                                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Email Preferences</h3>

                        <div className="space-y-3">
                            {[
                                { key: 'notify_activation_scheduled', label: 'Activation Scheduled', description: 'When a brand schedules an activation at your store' },
                                { key: 'notify_activation_confirmed', label: 'Activation Confirmed', description: 'When your activation request is approved' },
                                { key: 'notify_order_approved', label: 'Order Approved', description: 'When your order is approved by the brand' },
                                { key: 'notify_order_shipped', label: 'Order Shipped', description: 'When your order has been shipped' },
                                { key: 'notify_invoice_ready', label: 'Invoice Ready', description: 'When a new invoice is generated' }
                            ].map(notif => (
                                <div key={notif.key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <div>
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{notif.label}</p>
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{notif.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle(notif.key, !notificationPrefs[notif.key])}
                                        disabled={savingNotifications}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationPrefs[notif.key] !== false ? 'bg-emerald-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs[notif.key] !== false ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    {/* Add Team Member */}
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Team Members</h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Invite team members to help manage orders</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                            >
                                <Plus size={18} /> Invite
                            </button>
                        </div>

                        {/* Team List */}
                        <div className="space-y-3">
                            {/* Owner (current user) */}
                            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Shield size={20} className="text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentUser?.email}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Owner • Full access</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-600">OWNER</span>
                            </div>

                            {/* Invited Members */}
                            {teamMembers.map(member => {
                                const role = getRoleInfo(member.role);
                                const RoleIcon = role.icon;
                                return (
                                    <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className={`w-10 h-10 rounded-full bg-${role.color}-100 flex items-center justify-center`}>
                                            <RoleIcon size={20} className={`text-${role.color}-600`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{member.name || member.email}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.email} • {role.label}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${member.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {member.status.toUpperCase()}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveTeamMember(member.id)}
                                            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}

                            {teamMembers.length === 0 && (
                                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                                    <Users size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No team members yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role Descriptions */}
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Available Roles</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {TEAM_ROLES.map(role => {
                                const Icon = role.icon;
                                return (
                                    <div key={role.id} className="p-3 rounded-xl flex items-start gap-3" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className={`w-8 h-8 rounded-lg bg-${role.color}-100 flex items-center justify-center shrink-0`}>
                                            <Icon size={16} className={`text-${role.color}-600`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{role.label}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{role.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInviteTeamMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                    placeholder="colleague@dispensary.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name (optional)</label>
                                <input
                                    type="text"
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl outline-none"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Role</label>
                                <div className="space-y-2">
                                    {TEAM_ROLES.map(role => {
                                        const Icon = role.icon;
                                        return (
                                            <label
                                                key={role.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${inviteForm.role === role.id ? 'ring-2 ring-emerald-500' : ''}`}
                                                style={{ background: 'var(--bg-secondary)' }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.id}
                                                    checked={inviteForm.role === role.id}
                                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                                    className="sr-only"
                                                />
                                                <Icon size={18} className={`text-${role.color}-600`} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{role.label}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{role.description}</p>
                                                </div>
                                                {inviteForm.role === role.id && <Check size={18} className="text-emerald-600" />}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 font-bold rounded-xl transition-colors"
                                    style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {inviting ? <Loader size={18} className="animate-spin" /> : <><Mail size={18} /> Send Invite</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tour Overlay */}
            {showTour && (
                <OnboardingTour
                    steps={getTourSteps('dispensary')}
                    isFirstTime={false}
                    onComplete={() => setShowTour(false)}
                    tourKey="dispensary_settings_tour"
                />
            )}
        </div>
    );
}
