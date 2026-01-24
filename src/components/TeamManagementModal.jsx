import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Crown, Trash2, Mail, Check, Clock, ShieldCheck, Eye, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBrandTeamMembers, addBrandTeamMember, removeBrandTeamMember, updateBrandTeamMemberRole } from '../services/firestoreService';

/**
 * Team Management Modal - Allows brand owners/admins to invite and manage team members
 */
export default function TeamManagementModal({ isOpen, onClose, brandUser }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load team members
    useEffect(() => {
        if (isOpen && brandUser?.brandId) {
            loadTeamMembers();
        }
    }, [isOpen, brandUser?.brandId]);

    const loadTeamMembers = async () => {
        try {
            setLoading(true);
            const members = await getBrandTeamMembers(brandUser.brandId);
            setTeamMembers(members);
        } catch (err) {
            console.error('Failed to load team members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await addBrandTeamMember(
                brandUser.brandId,
                inviteEmail.trim(),
                inviteRole,
                brandUser.id
            );
            setSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setInviteRole('viewer');
            await loadTeamMembers();
        } catch (err) {
            if (err.message?.includes('duplicate')) {
                setError('This email has already been invited');
            } else {
                setError('Failed to send invite. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (memberId) => {
        if (!window.confirm('Remove this team member?')) return;

        try {
            await removeBrandTeamMember(memberId);
            await loadTeamMembers();
        } catch (err) {
            console.error('Failed to remove member:', err);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateBrandTeamMemberRole(memberId, newRole);
            await loadTeamMembers();
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <ShieldCheck size={16} className="text-emerald-600" />;
            case 'manager': return <Edit2 size={16} className="text-blue-600" />;
            case 'viewer': return <Eye size={16} className="text-slate-500" />;
            default: return null;
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-emerald-100 text-emerald-700',
            manager: 'bg-blue-100 text-blue-700',
            viewer: 'bg-slate-100 text-slate-600'
        };
        return styles[role] || styles.viewer;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="team-management-modal-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Users size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 id="team-management-modal-title" className="text-lg font-bold text-white">Team Management</h2>
                                <p className="text-white/70 text-xs">Invite & manage team access</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                            aria-label="Close modal"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Owner Section */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Crown size={18} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{brandUser?.email}</p>
                                    <p className="text-xs text-amber-700 font-medium">Owner (You)</p>
                                </div>
                            </div>
                        </div>

                        {/* Invite Form */}
                        <form onSubmit={handleInvite} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <UserPlus size={18} /> Invite Team Member
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                                    required
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                                    >
                                        <option value="admin">Admin (Full access)</option>
                                        <option value="manager">Manager (View & edit)</option>
                                        <option value="viewer">Viewer (View only)</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !inviteEmail.trim()}
                                        className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {isSubmitting ? '...' : 'Invite'}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <p className="text-red-600 text-sm mt-2 font-medium">{error}</p>
                            )}
                            {success && (
                                <p className="text-emerald-600 text-sm mt-2 font-medium flex items-center gap-1">
                                    <Check size={14} /> {success}
                                </p>
                            )}
                        </form>

                        {/* Role Explanation */}
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="text-xs text-blue-800">
                                <strong>Admin:</strong> Full control, can invite others<br />
                                <strong>Manager:</strong> View & edit data, can't invite<br />
                                <strong>Viewer:</strong> Read-only dashboard access
                            </p>
                        </div>

                        {/* Team Members List */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Users size={18} /> Team Members ({teamMembers.length})
                            </h3>

                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Loading...</div>
                            ) : teamMembers.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Mail size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No team members yet</p>
                                    <p className="text-xs">Invite someone above to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                                                {member.email?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 truncate">{member.email}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getRoleBadge(member.role)}`}>
                                                        {member.role}
                                                    </span>
                                                    {member.invite_accepted ? (
                                                        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                                            <Check size={10} /> Joined
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                                            <Clock size={10} /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded border border-slate-200 bg-white"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
