import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_EMAILS } from '../../../contexts/AuthContext';
import { getUserRoles, addUserRole, updateUserRole, removeUserRole } from '../../../services/firestoreService';
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
            const data = await getUserRoles();
            setRoles(data);
        } catch (error) {
            console.error("Failed to load roles:", error);
            showNotification('Failed to load role data', 'error');
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
            const success = await updateUserRole(email, { role: newRoleValue }, currentUser.email);

            if (success) {
                showNotification(`Role updated to ${formatRoleName(newRoleValue)}`, 'success');
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

    const formatRoleName = (role) => {
        const names = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            social_manager: 'Social Media Manager'
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
