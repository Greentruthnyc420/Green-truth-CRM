import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import { useNotification } from '../contexts/NotificationContext';
import { User, Instagram, Phone, MapPin, Save, Loader, ArrowLeft, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function ProfileSettings() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        } catch (error) {
            console.error('Failed to load profile:', error);
            showNotification('Failed to load profile', 'error');
        } finally {
            setLoading(false);
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
                        Profile Settings
                    </h1>
                    <p className="text-slate-500 text-sm">Update your personal information</p>
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="themed-card rounded-2xl p-6 space-y-6">
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
                <h3 className="font-bold text-slate-800 mb-4">Account Information</h3>
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
        </div>
    );
}
