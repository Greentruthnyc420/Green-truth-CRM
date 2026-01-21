import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle, Loader, Tag, RefreshCw, Users, Building2 } from 'lucide-react';
import {
    getAllActivationRequests,
    getActivationRequestsForAdmin,
    assignRepToRequest,
    cancelActivationRequest,
    REQUEST_STATUS
} from '../../../services/activationRequestService';
import { getAllUsers } from '../../../services/firestoreService';
import { useNotification } from '../../../contexts/NotificationContext';

/**
 * Admin view for managing all activation requests
 * Shows all requests, with ability to assign reps
 */
export default function AdminActivationRequests() {
    const [requests, setRequests] = useState([]);
    const [reps, setReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | needs_action | pending | scheduled
    const [assigningId, setAssigningId] = useState(null);
    const [selectedRepId, setSelectedRepId] = useState('');
    const { showNotification } = useNotification();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allRequests, allUsers] = await Promise.all([
                getAllActivationRequests(),
                getAllUsers()
            ]);

            setRequests(allRequests);
            // Filter to only sales reps
            const salesReps = allUsers.filter(u => u.role === 'rep' || u.role === 'admin');
            setReps(salesReps);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Failed to load activation requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Format time for display
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
            accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepted' },
            declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined' },
            scheduled: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Scheduled' },
            expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
            cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled' }
        };
        return badges[status] || badges.pending;
    };

    // Filter requests
    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'needs_action') return !r.assignedRepId || r.status === 'declined' || r.status === 'expired';
        if (filter === 'pending') return r.status === 'pending';
        if (filter === 'scheduled') return r.status === 'scheduled' || r.status === 'accepted';
        return true;
    });

    // Handle assigning a rep
    const handleAssignRep = async (requestId) => {
        if (!selectedRepId) {
            showNotification('Please select a sales rep', 'error');
            return;
        }

        setAssigningId(requestId);
        try {
            await assignRepToRequest(requestId, selectedRepId);
            showNotification('Rep assigned successfully! They have 24 hours to respond.', 'success');
            setSelectedRepId('');
            loadData();
        } catch (error) {
            console.error('Error assigning rep:', error);
            showNotification('Failed to assign rep', 'error');
        } finally {
            setAssigningId(null);
        }
    };

    // Handle cancelling a request
    const handleCancel = async (requestId) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        try {
            await cancelActivationRequest(requestId);
            showNotification('Request cancelled', 'success');
            loadData();
        } catch (error) {
            console.error('Error cancelling request:', error);
            showNotification('Failed to cancel request', 'error');
        }
    };

    // Get rep name by ID
    const getRepName = (repId) => {
        const rep = reps.find(r => r.id === repId);
        return rep?.displayName || rep?.email?.split('@')[0] || 'Unknown';
    };

    // Count requests needing action
    const needsActionCount = requests.filter(r =>
        !r.assignedRepId || r.status === 'declined' || r.status === 'expired'
    ).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Activation Requests
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Manage and assign incoming activation requests from brands
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {[
                    { key: 'all', label: 'All Requests', count: requests.length },
                    { key: 'needs_action', label: 'Needs Action', count: needsActionCount, highlight: true },
                    { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
                    { key: 'scheduled', label: 'Scheduled', count: requests.filter(r => r.status === 'scheduled' || r.status === 'accepted').length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${filter === tab.key
                                ? 'bg-brand-600 text-white'
                                : 'hover:bg-slate-100'
                            }`}
                        style={filter !== tab.key ? { color: 'var(--text-secondary)' } : {}}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${filter === tab.key
                                    ? 'bg-white/20 text-white'
                                    : tab.highlight && tab.count > 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="themed-card rounded-xl p-12 flex justify-center">
                    <Loader className="animate-spin" style={{ color: 'var(--text-tertiary)' }} size={32} />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="themed-card rounded-xl p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="font-medium">No activation requests found</p>
                    <p className="text-sm opacity-70">Requests from brands will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map(request => {
                        const status = getStatusBadge(request.status);
                        const needsAssignment = !request.assignedRepId || request.status === 'declined' || request.status === 'expired';

                        return (
                            <div
                                key={request.id}
                                className={`themed-card rounded-xl overflow-hidden ${needsAssignment ? 'border-2 border-amber-300' : ''
                                    }`}
                            >
                                {/* Request Header */}
                                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)', background: needsAssignment ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-secondary)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl" style={{ background: 'var(--accent-primary)', opacity: 0.15 }}>
                                            <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    {request.brandName || 'Brand Request'}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {request.dispensaryName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Assignment */}
                                    {request.assignedRepId ? (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                            <User size={16} style={{ color: 'var(--text-secondary)' }} />
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {getRepName(request.assignedRepId)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium px-3 py-2 bg-amber-100 text-amber-800 rounded-lg">
                                            Needs Assignment
                                        </span>
                                    )}
                                </div>

                                {/* Request Details */}
                                <div className="p-5">
                                    {/* Date Options */}
                                    <div className="mb-4">
                                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Requested Dates
                                        </p>
                                        <div className="flex gap-3 flex-wrap">
                                            {request.dateOption1 && (
                                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${request.selectedDate === request.dateOption1
                                                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {formatDate(request.dateOption1)} {formatTime(request.timeOption1)}
                                                    {request.selectedDate === request.dateOption1 && ' ✓'}
                                                </div>
                                            )}
                                            {request.dateOption2 && (
                                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${request.selectedDate === request.dateOption2
                                                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {formatDate(request.dateOption2)} {formatTime(request.timeOption2)}
                                                    {request.selectedDate === request.dateOption2 && ' ✓'}
                                                </div>
                                            )}
                                            {request.dateOption3 && (
                                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${request.selectedDate === request.dateOption3
                                                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {formatDate(request.dateOption3)} {formatTime(request.timeOption3)}
                                                    {request.selectedDate === request.dateOption3 && ' ✓'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {request.notes && (
                                        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                <strong>Notes:</strong> {request.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Decline Reason */}
                                    {request.declineReason && (
                                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                            <p className="text-sm text-red-700">
                                                <strong>Decline Reason:</strong> {request.declineReason}
                                            </p>
                                        </div>
                                    )}

                                    {/* Assignment Section (if needs assignment) */}
                                    {needsAssignment && request.status !== 'cancelled' && (
                                        <div className="pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                            <select
                                                value={selectedRepId}
                                                onChange={(e) => setSelectedRepId(e.target.value)}
                                                className="flex-1 px-4 py-2 rounded-lg text-sm"
                                                style={{
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-primary)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            >
                                                <option value="">Select a Sales Rep...</option>
                                                {reps.map(rep => (
                                                    <option key={rep.id} value={rep.id}>
                                                        {rep.displayName || rep.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleAssignRep(request.id)}
                                                disabled={assigningId === request.id || !selectedRepId}
                                                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {assigningId === request.id ? (
                                                    <Loader size={16} className="animate-spin" />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                                Assign Rep
                                            </button>
                                            <button
                                                onClick={() => handleCancel(request.id)}
                                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
