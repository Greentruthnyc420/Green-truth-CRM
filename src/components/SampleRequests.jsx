import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock, Mail, MapPin, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { deleteSampleRequest } from '../services/firestoreService';

export default function SampleRequests({ userRole, brandId = null }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, declined
    const { showNotification } = useNotification();

    useEffect(() => {
        async function fetchRequests() {
            setLoading(true);
            try {
                // 1. Get Requests
                const { data: reqs, error } = await supabase
                    .from('sample_requests')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // 2. Get Leads (for names/addresses)
                const { data: leads } = await supabase.from('leads').select('id, dispensary_name, license_number, address');
                const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

                // 3. Merge Data
                const merged = reqs.map(r => {
                    const lead = leadMap.get(r.dispensary_id);
                    return {
                        ...r,
                        dispensaryName: lead?.dispensary_name || r.dispensary_name || 'Unknown Dispensary',
                        licenseNumber: lead?.license_number || r.license_number,
                        address: lead?.address || r.address,
                        createdAt: r.created_at,
                        requestedBrands: r.requested_brands || [],
                        notes: r.notes
                    };
                });

                // 4. Filter for Brand
                let filtered = merged;
                if (brandId && userRole === 'brand') {
                    filtered = merged.filter(req =>
                        req.requestedBrands?.some(b =>
                            b.toLowerCase().includes(brandId.toLowerCase())
                        )
                    );
                }

                setRequests(filtered);
            } catch (err) {
                console.error("Failed to load sample requests:", err);
                showNotification("Failed to load requests", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchRequests();
    }, [brandId, userRole]);

    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            const { error } = await supabase
                .from('sample_requests')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            setRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, status: newStatus } : r
            ));
            showNotification(`Request ${newStatus.toLowerCase()}`, 'success');
        } catch (error) {
            console.error('Error updating request:', error);
            showNotification('Failed to update status', 'error');
        }
    };

    async function handleDelete(requestId) {
        if (!confirm('Are you sure you want to delete this sample request?')) return;

        try {
            const success = await deleteSampleRequest(requestId);
            if (success) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
                showNotification('Sample request deleted', 'success');
            } else {
                showNotification('Failed to delete request', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showNotification('Error deleting request', 'error');
        }
    }

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status?.toLowerCase() === filter.toLowerCase());

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sample Requests</h2>
                    <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {userRole === 'brand' ? 'Requests for your products' : 'All dispensary sample requests'}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'declined'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-4 py-2 rounded-xl font-medium text-sm transition-all"
                            style={{
                                background: filter === f ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: filter === f ? 'white' : 'var(--text-secondary)'
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="themed-card rounded-2xl p-12 text-center">
                    <Gift size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No sample requests found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRequests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            onStatusUpdate={handleStatusUpdate}
                            onDelete={handleDelete}
                            userRole={userRole}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const RequestCard = ({ request, onStatusUpdate, onDelete, userRole }) => {
    const statusColors = {
        'Pending': { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: 'rgba(245, 158, 11, 0.3)' },
        'Approved': { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: 'rgba(16, 185, 129, 0.3)' },
        'Declined': { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'rgba(239, 68, 68, 0.3)' }
    };

    const statusIcons = {
        'Pending': <Clock size={16} />,
        'Approved': <CheckCircle size={16} />,
        'Declined': <XCircle size={16} />
    };

    // Normalize Status case for matching
    const displayStatus = request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase();
    const statusStyle = statusColors[displayStatus] || statusColors['Pending'];

    return (
        <div className="themed-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{request.dispensaryName}</h3>
                        <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`
                            }}
                        >
                            {statusIcons[displayStatus] || statusIcons['Pending']}
                            {displayStatus}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {request.licenseNumber && (
                            <div className="flex items-center gap-2">
                                <FileText size={14} />
                                <span className="font-mono">{request.licenseNumber}</span>
                            </div>
                        )}
                        {request.address && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} />
                                <span>{request.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>
                                {(() => {
                                    try {
                                        const d = new Date(request.createdAt);
                                        return d.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    } catch (e) { return 'N/A'; }
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Requested Brands</p>
                    <div className="flex flex-wrap gap-2">
                        {request.requestedBrands?.map((brand, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 rounded-lg text-sm font-medium"
                                style={{
                                    background: 'rgba(168, 85, 247, 0.1)',
                                    color: 'rgb(168, 85, 247)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)'
                                }}
                            >
                                {brand}
                            </span>
                        ))}
                    </div>
                </div>

                {request.notes && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Notes</p>
                        <p className="text-sm p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{request.notes}</p>
                    </div>
                )}
            </div>

            {userRole !== 'dispensary' && displayStatus === 'Pending' && (
                <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <button
                        onClick={() => onStatusUpdate(request.id, 'Approved')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 font-bold rounded-xl transition-colors"
                        style={{ background: 'var(--success)', color: 'white' }}
                    >
                        <CheckCircle size={18} />
                        Approve
                    </button>
                    <button
                        onClick={() => onStatusUpdate(request.id, 'Declined')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 font-bold rounded-xl transition-colors"
                        style={{ background: 'var(--error)', color: 'white' }}
                    >
                        <XCircle size={18} />
                        Decline
                    </button>
                    <button
                        onClick={() => onDelete(request.id)}
                        className="px-4 py-2 font-bold rounded-xl transition-colors flex items-center gap-2"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}
                        title="Delete Request"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}

            {/* Separate Always-Visible Delete Button */}
            {userRole !== 'dispensary' && (
                <div className={displayStatus === 'Pending' ? "mt-3" : "mt-4 pt-4"} style={displayStatus !== 'Pending' ? { borderTop: '1px solid var(--border-primary)' } : {}}>
                    <button
                        onClick={() => onDelete(request.id)}
                        className="w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-sm"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            border: '2px solid rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <Trash2 size={20} />
                        Delete Request
                    </button>
                </div>
            )}
        </div>
    );
};
