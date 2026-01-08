import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock, Mail, MapPin, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { deleteSampleRequest } from '../services/firestoreService';
// import { getLeads } from '../services/firestoreService'; // Can use this or direct supabase call

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

                // 2. Get Leads (for names/addresses) - simplified fetching all for mapping
                // Optimization: In a huge app, we'd use a Join or fetch by IDs.
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
                        createdAt: r.created_at, // Normalize for UI
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

        // Optional: Realtime Subscription could be added here
        // const subscription = supabase.channel('...')...
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
        : requests.filter(r => r.status?.toLowerCase() === filter.toLowerCase()); // Safe lowercasing

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Sample Requests</h2>
                    <p className="text-slate-500 mt-1">
                        {userRole === 'brand' ? 'Requests for your products' : 'All dispensary sample requests'}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'declined'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No sample requests found</p>
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
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'Approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Declined': 'bg-red-100 text-red-700 border-red-200'
    };

    const statusIcons = {
        'Pending': <Clock size={16} />,
        'Approved': <CheckCircle size={16} />,
        'Declined': <XCircle size={16} />
    };

    // Normalize Status case for matching
    const displayStatus = request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase();

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{request.dispensaryName}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[displayStatus] || statusColors['Pending']}`}>
                            {statusIcons[displayStatus] || statusIcons['Pending']}
                            {displayStatus}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-slate-500">
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
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Requested Brands</p>
                    <div className="flex flex-wrap gap-2">
                        {request.requestedBrands?.map((brand, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100"
                            >
                                {brand}
                            </span>
                        ))}
                    </div>
                </div>

                {request.notes && (
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{request.notes}</p>
                    </div>
                )}
            </div>

            {userRole !== 'dispensary' && displayStatus === 'Pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => onStatusUpdate(request.id, 'Approved')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                        <CheckCircle size={18} />
                        Approve
                    </button>
                    <button
                        onClick={() => onStatusUpdate(request.id, 'Declined')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                    >
                        <XCircle size={18} />
                        Decline
                    </button>
                    <button
                        onClick={() => onDelete(request.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                        title="Delete Request"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}

            {/* Separate Always-Visible Delete Button */}
            {userRole !== 'dispensary' && (
                <div className={displayStatus === 'Pending' ? "mt-3" : "mt-4 pt-4 border-t border-slate-100"}>
                    <button
                        onClick={() => onDelete(request.id)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-600 hover:text-white border-2 border-red-300 hover:border-red-600 transition-all shadow-sm"
                    >
                        <Trash2 size={20} />
                        Delete Request
                    </button>
                </div>
            )}
        </div>
    );
};
