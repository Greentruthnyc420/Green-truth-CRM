import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_EMAILS } from '../../../contexts/AuthContext';
import { getUserRoles, addUserRole, updateUserRole, removeUserRole, getAllUsers, deleteUser, updateUserProfile, blockUser, unblockUser, fireUserWithTransfer } from '../../../services/firestoreService';
import { supabase } from '../../../services/supabaseClient';
import { useNotification } from '../../../contexts/NotificationContext';
import {
    Shield,
    ShieldCheck,
    UserPlus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Crown,
    Instagram,
    Mail,
    Search,
    AlertTriangle,
    Loader2,
    Calendar
} from 'lucide-react';

export default function AdminRoleManagement() {
    const { currentUser, isSuperAdminUser } = useAuth();
    const { showNotification } = useNotification();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New role form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('admin');

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            // [FIX] Load ALL users, not just admins, so we can manage Reps too
            const [users, specialRoles] = await Promise.all([
                getAllUsers(),
                getUserRoles()
            ]);

            // Map special roles for easy lookup
            const roleMap = new Map(specialRoles.map(r => [r.email.toLowerCase(), r]));

            // Merge: Users are the base
            const merged = users.map(u => {
                const special = roleMap.get(u.email.toLowerCase());
                return {
                    id: u.id,
                    email: u.email,
                    // Prefer special role (from roles table), otherwise fallback to user role (rep/driver), otherwise user
                    role: special ? special.role : (u.role || 'user'),
                    grantedBy: special?.grantedBy,
                    grantedAt: special?.grantedAt || u.createdAt,
                    isActive: special ? special.isActive : !u.isBlocked,
                    isUserEntry: true, // It's a real signed-up user
                    isBlocked: u.isBlocked
                };
            });

            // Also add any pre-authorized emails (in roles table but not yet signed up)
            specialRoles.forEach(r => {
                if (!users.find(u => u.email.toLowerCase() === r.email.toLowerCase())) {
                    merged.push({
                        ...r,
                        isUserEntry: false, // Pending sign-up
                        id: 'pending-' + r.email
                    });
                }
            });

            // Sort: Super Admin -> Admin -> Rep -> User
            const roleOrder = { super_admin: 0, admin: 1, social_manager: 2, cannabis_consultant_social: 2, rep: 3, cannabis_consultant: 3, driver: 4, user: 5 };
            merged.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

            // [FIX] Filter out brand and dispensary accounts - they belong to their own portals
            // Role Management should ONLY show staff: admins, social managers, cannabis consultants, drivers
            const staffRoles = ['super_admin', 'admin', 'social_manager', 'cannabis_consultant_social', 'rep', 'cannabis_consultant', 'driver', 'user'];
            const filteredMerged = merged.filter(u => staffRoles.includes(u.role));

            setRoles(filteredMerged);
        } catch (error) {
            console.error("Failed to load users/roles:", error);
            showNotification('Failed to load user data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();

        if (!newEmail.trim()) {
            showNotification('Please enter an email address', 'error');
            return;
        }

        if (!newEmail.includes('@')) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        setSaving(true);
        try {
            const success = await addUserRole(newEmail.trim(), newRole, currentUser.email);

            if (success) {
                showNotification(`Added ${newEmail} as ${formatRoleName(newRole)}`, 'success');
                setNewEmail('');
                setShowAddForm(false);
                await loadRoles();
            } else {
                showNotification('Failed to add role', 'error');
            }
        } catch (error) {
            console.error("Error adding role:", error);
            showNotification('Error adding role: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (email, currentlyActive) => {
        // Prevent deactivating super admins
        if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
            showNotification('Cannot deactivate the super admin', 'error');
            return;
        }

        setSaving(true);
        try {
            const success = await updateUserRole(email, { isActive: !currentlyActive }, currentUser.email);

            if (success) {
                showNotification(`Role ${currentlyActive ? 'deactivated' : 'activated'}`, 'success');
                await loadRoles();
            } else {
                showNotification('Failed to update role', 'error');
            }
        } catch (error) {
            showNotification('Error updating role', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeRole = async (email, newRoleValue) => {
        // Prevent changing super admin roles
        if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
            showNotification('Cannot change the super admin role', 'error');
            return;
        }

        setSaving(true);
        try {
            const adminRoles = ['super_admin', 'admin', 'social_manager'];
            const isNewRoleAdmin = adminRoles.includes(newRoleValue);

            // Find user id from local state
            const targetUser = roles.find(r => r.email === email);
            const userId = targetUser?.id;

            if (isNewRoleAdmin) {
                // 1. Upgrade/Change to Admin Role
                // This adds to user_roles table (defining access)
                const addSuccess = await addUserRole(email, newRoleValue, currentUser.email);
                if (!addSuccess) {
                    throw new Error('Failed to add admin role in user_roles table');
                }

                // Also update profile for consistency
                if (userId && targetUser.isUserEntry) {
                    await updateUserProfile(userId, { role: newRoleValue });
                }

                showNotification(`Role updated to ${formatRoleName(newRoleValue)}`, 'success');
            } else {
                // 2. Downgrade to Regular Role (Rep/Driver/User)
                // Remove from user_roles (revoke admin access)
                await removeUserRole(email);

                // Update profile to new role (e.g. 'rep' or 'cannabis_consultant')
                if (userId && targetUser.isUserEntry) {
                    await updateUserProfile(userId, { role: newRoleValue });
                }

                showNotification(`Role updated to ${formatRoleName(newRoleValue)}`, 'success');
            }

            await loadRoles();
        } catch (error) {
            console.error('Role update error:', error);
            showNotification('Error updating role: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveRole = async (email) => {
        // Prevent removing super admins
        if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
            showNotification('Cannot remove the super admin', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to remove ${email} from all admin roles? This cannot be undone.`)) {
            return;
        }

        setSaving(true);
        try {
            const success = await removeUserRole(email);

            if (success) {
                showNotification(`Removed ${email} from roles`, 'success');
                await loadRoles();
            } else {
                showNotification('Failed to remove role', 'error');
            }
        } catch (error) {
            showNotification('Error removing role', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            showNotification('Cannot delete the super admin', 'error');
            return;
        }

        // Check if user has data that needs to be transferred
        let leadCount = 0;
        let activationCount = 0;
        try {
            const { count: lc } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_ambassador_id', user.id);
            leadCount = lc || 0;

            const { count: ac } = await supabase
                .from('activation_requests')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_rep_id', user.id);
            activationCount = ac || 0;
        } catch (e) {
            console.warn('Could not fetch counts:', e);
        }

        const confirmMsg = `⚠️ FIRE ${user.email}?\n\n` +
            `This will:\n` +
            `• Transfer ${leadCount} lead(s) to you (Admin)\n` +
            `• Transfer ${activationCount} activation request(s) to you\n` +
            `• Keep their sales/activation history with a transfer note\n` +
            `• Permanently delete their account\n\n` +
            `This action cannot be undone.`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        const confirmText = prompt(`To confirm, type: FIRE`);
        if (confirmText?.toUpperCase() !== 'FIRE') {
            showNotification('Deletion cancelled', 'info');
            return;
        }

        setSaving(true);
        try {
            // Use the new fireUserWithTransfer function
            if (user.isUserEntry && user.id && !user.id.startsWith('pending-')) {
                const result = await fireUserWithTransfer(
                    user.id,
                    currentUser.uid,
                    currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin'
                );

                showNotification(
                    `${user.email} has been fired. ` +
                    `${result.stats.leads} leads and ${result.stats.activationRequests} requests transferred to you.`,
                    'success'
                );
            } else {
                // Just remove from roles if no real profile
                await removeUserRole(user.email);
                showNotification(`Role removed for ${user.email}`, 'success');
            }

            await loadRoles();
        } catch (error) {
            console.error("Delete error:", error);
            showNotification('Error: ' + (error.message || 'Could not delete user'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const formatRoleName = (role) => {
        const names = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            social_manager: 'Social Manager',
            cannabis_consultant_social: 'Cannabis Consultant (Social)',
            cannabis_consultant: 'Cannabis Consultant',
            rep: 'Cannabis Consultant',
            driver: 'Driver',
            user: 'User'
        };
        return names[role] || role;
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin':
                return <Crown size={18} className="text-amber-500" />;
            case 'admin':
                return <ShieldCheck size={18} className="text-indigo-500" />;
            case 'social_manager':
                return <Instagram size={18} className="text-pink-500" />;
            case 'cannabis_consultant_social':
                return <Instagram size={18} className="text-emerald-500" />;
            case 'cannabis_consultant':
            case 'rep':
                return <UserPlus size={18} className="text-emerald-500" />;
            case 'driver':
                return <UserPlus size={18} className="text-blue-500" />;
            default:
                return <Shield size={18} className="text-slate-400" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'admin':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'social_manager':
                return 'bg-pink-100 text-pink-800 border-pink-200';
            case 'cannabis_consultant_social':
            case 'cannabis_consultant':
            case 'rep':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'driver':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const filteredRoles = roles.filter(r =>
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check if current user is super admin
    if (!isSuperAdminUser()) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertTriangle size={48} className="text-amber-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                <p className="text-slate-500 mt-2">Only super admins can manage roles.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Shield className="text-indigo-600" size={28} />
                        Role Management
                    </h1>
                    <p className="text-slate-500">
                        Manage admin and social media manager access
                    </p>
                </div>

                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <UserPlus size={18} />
                    Add New Role
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by email or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                />
            </div>

            {/* Role Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <Crown size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">Super Admin</span>
                    <span className="text-xs text-slate-500">- Full control, cannot be removed</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Admin</span>
                    <span className="text-xs text-slate-500">- Full dashboard access</span>
                </div>
                <div className="flex items-center gap-2">
                    <Instagram size={16} className="text-pink-500" />
                    <span className="text-sm font-medium text-slate-700">Social Manager</span>
                    <span className="text-xs text-slate-500">- Calendar read-only + rep contacts</span>
                </div>
                <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Cannabis Consultant</span>
                    <span className="text-xs text-slate-500">- Sales Portal access</span>
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserPlus className="text-indigo-600" size={20} />
                            Add New Role
                        </h3>

                        <form onSubmit={handleAddRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none bg-white"
                                >
                                    <option value="admin">Admin - Full Dashboard Access</option>
                                    <option value="social_manager">Social Manager - Calendar Only</option>
                                    <option value="rep">Cannabis Consultant - Sales Portal</option>
                                    <option value="user">User - Basic Access</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                    {saving ? 'Adding...' : 'Add Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Roles Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Granted By</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No roles found
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role) => {
                                    const isSuperAdmin = role.role === 'super_admin' || SUPER_ADMIN_EMAILS.includes(role.email.toLowerCase());

                                    return (
                                        <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        {getRoleIcon(role.role)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{role.email}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Added {new Date(role.grantedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isSuperAdmin ? (
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.role)}`}>
                                                        {getRoleIcon(role.role)}
                                                        {formatRoleName(role.role)}
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={role.role}
                                                        onChange={(e) => handleChangeRole(role.email, e.target.value)}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="social_manager">Social Manager</option>
                                                        <option value="rep">Cannabis Consultant</option>
                                                        <option value="driver">Driver</option>
                                                        <option value="user">User</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {role.grantedBy || 'System'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {role.isActive ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isSuperAdmin ? (
                                                    <span className="text-xs text-slate-400 italic">Protected</span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleToggleActive(role.email, role.isActive)}
                                                            className={`p-2 rounded-lg transition-colors ${role.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                                            title={role.isActive ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {role.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveRole(role.email)}
                                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                            title="Remove Role"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        {role.isUserEntry && (
                                                            <button
                                                                onClick={() => handleDeleteUser(role)}
                                                                className="p-2 rounded-lg hover:bg-red-50 text-red-700 transition-colors border border-transparent hover:border-red-200"
                                                                title="Fire/Delete User (Permanent)"
                                                            >
                                                                <span className="font-bold text-xs">FIRE</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
