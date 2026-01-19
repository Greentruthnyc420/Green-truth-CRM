import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getBrandLeads, updateLead, deleteLead, LEAD_STATUS } from '../../services/firestoreService';
import { TrendingUp, Store, Trash2, ChevronDown, UserPlus, Phone, Mail, MapPin, Calendar as CalendarIcon } from 'lucide-react';

export default function BrandPipeline() {
    const { brandUser } = useBrandAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const brandId = brandUser?.brandId;

    useEffect(() => {
        async function loadLeads() {
            if (!brandId) return;
            setLoading(true);
            try {
                const brandLeads = await getBrandLeads(brandId);
                setLeads(Array.isArray(brandLeads) ? brandLeads : []);
            } catch (error) {
                console.error("Failed to load brand leads", error);
            } finally {
                setLoading(false);
            }
        }
        loadLeads();
    }, [brandId]);

    async function handleStatusChange(leadId, newStatus) {
        setActionLoading(leadId);
        try {
            await updateLead(leadId, { leadStatus: newStatus });
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: newStatus } : l));
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDelete(leadId) {
        if (!window.confirm("Are you sure you want to remove this lead from your pipeline? This cannot be undone.")) return;
        setActionLoading(leadId);
        try {
            await deleteLead(leadId);
            setLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (error) {
            console.error("Failed to delete lead", error);
        } finally {
            setActionLoading(null);
        }
    }

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        if (filter === 'all') return true;
        if (filter === 'prospect') return !lead.leadStatus || lead.leadStatus === LEAD_STATUS.PROSPECT || lead.leadStatus === 'prospect';
        if (filter === 'requested') return lead.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED || lead.leadStatus === 'samples_requested';
        if (filter === 'delivered') return lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED || lead.leadStatus === 'samples_delivered';
        if (filter === 'active') return lead.leadStatus === LEAD_STATUS.ACTIVE || lead.leadStatus === 'active' || lead.status === 'Sold';
        return true;
    });

    // Pipeline Stats
    const totalLeads = leads.length;
    const prospectCount = leads.filter(l => !l.leadStatus || l.leadStatus === 'prospect' || l.leadStatus === LEAD_STATUS.PROSPECT).length;
    const requestedCount = leads.filter(l => l.leadStatus === 'samples_requested' || l.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED).length;
    const deliveredCount = leads.filter(l => l.leadStatus === 'samples_delivered' || l.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED).length;
    const activeCount = leads.filter(l => l.leadStatus === 'active' || l.leadStatus === LEAD_STATUS.ACTIVE || l.status === 'Sold').length;
    const conversionRate = totalLeads > 0 ? ((activeCount / totalLeads) * 100).toFixed(1) : '0.0';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp style={{ color: 'var(--accent-primary)' }} />
                        Sales Pipeline
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track and manage your dispensary leads through the sales funnel.</p>
                </div>
                <Link
                    to="/brand/new-lead"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors"
                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                >
                    <UserPlus size={18} />
                    Add Lead
                </Link>
            </header>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="themed-card p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Pipeline</p>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{totalLeads}</p>
                </div>
                <div className="themed-card p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Prospects</p>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>{prospectCount}</p>
                </div>
                <div className="themed-card p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Samples Out</p>
                    <p className="text-2xl font-black" style={{ color: 'var(--warning)' }}>{requestedCount + deliveredCount}</p>
                </div>
                <div className="themed-card p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Active</p>
                    <p className="text-2xl font-black" style={{ color: 'var(--success)' }}>{activeCount}</p>
                </div>
                <div className="themed-card p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Conversion</p>
                    <p className="text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>{conversionRate}%</p>
                    <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>Leads → Active</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="themed-card rounded-xl p-1 inline-flex gap-1">
                {['all', 'prospect', 'requested', 'active'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors"
                        style={{
                            background: filter === f ? 'var(--accent-primary)' : 'transparent',
                            color: filter === f ? 'var(--text-inverse)' : 'var(--text-secondary)'
                        }}
                    >
                        {f === 'all' ? 'All Leads' : f}
                    </button>
                ))}
            </div>

            {/* Leads Table */}
            <div className="themed-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                    <Store size={18} style={{ color: 'var(--text-tertiary)' }} />
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {filter === 'all' ? 'All Leads' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Leads`}
                    </h2>
                    <span className="ml-auto text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                    </span>
                </div>

                {filteredLeads.length === 0 ? (
                    <div className="p-12 text-center">
                        <Store size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
                        <p className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>No leads in this category</p>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {filter === 'all' ? 'Add your first lead to get started.' : 'No leads match this filter.'}
                        </p>
                        {filter === 'all' && (
                            <Link
                                to="/brand/new-lead"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg font-bold transition-colors"
                                style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                            >
                                <UserPlus size={16} />
                                Add Your First Lead
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dispensary</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-tertiary)' }}>Contact</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-tertiary)' }}>Added</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{lead.dispensaryName}</p>
                                            {lead.location && (
                                                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                    <MapPin size={10} />
                                                    {lead.location}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="relative inline-block">
                                                <select
                                                    value={lead.leadStatus || 'prospect'}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    disabled={actionLoading === lead.id}
                                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                                                    style={{
                                                        background: lead.leadStatus === 'active' || lead.leadStatus === LEAD_STATUS.ACTIVE ? 'rgba(16, 185, 129, 0.1)' :
                                                            lead.leadStatus === 'samples_delivered' || lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED ? 'rgba(59, 130, 246, 0.1)' :
                                                                lead.leadStatus === 'samples_requested' || lead.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED ? 'rgba(245, 158, 11, 0.1)' :
                                                                    'var(--bg-secondary)',
                                                        color: lead.leadStatus === 'active' || lead.leadStatus === LEAD_STATUS.ACTIVE ? 'rgb(16, 185, 129)' :
                                                            lead.leadStatus === 'samples_delivered' || lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED ? 'rgb(59, 130, 246)' :
                                                                lead.leadStatus === 'samples_requested' || lead.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED ? 'rgb(245, 158, 11)' :
                                                                    'var(--text-secondary)',
                                                        borderColor: 'transparent'
                                                    }}
                                                >
                                                    <option value="prospect">Prospect</option>
                                                    <option value="samples_requested">Samples Out</option>
                                                    <option value="samples_delivered">Received</option>
                                                    <option value="active">Active</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell">
                                            {lead.contacts?.[0] ? (
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lead.contacts[0].name}</p>
                                                    {lead.contacts[0].phone && (
                                                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                                            <Phone size={10} />
                                                            {lead.contacts[0].phone}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No contact</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 hidden lg:table-cell">
                                            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                                <CalendarIcon size={10} />
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown'}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                disabled={actionLoading === lead.id}
                                                className="p-2 rounded-lg transition-colors hover:bg-red-50"
                                                style={{ color: 'var(--text-tertiary)' }}
                                                title="Remove from Pipeline"
                                            >
                                                {actionLoading === lead.id ? (
                                                    <div className="w-4 h-4 rounded-full border-2 border-t-red-600 animate-spin" style={{ borderColor: 'var(--text-tertiary)', borderTopColor: 'rgb(220, 38, 38)' }} />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
