import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, LEAD_STATUS, getAllBrandProfiles, getSales, updateLead, deleteLead, getAllUsers } from '../../../services/firestoreService';
import { TrendingUp, Filter, ShoppingBag, Store, Trash2, Edit2, CheckCircle, ChevronDown } from 'lucide-react';

export default function AdminGrowth() {
    const [leads, setLeads] = useState([]);
    const [brands, setBrands] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    async function handleStatusChange(leadId, newStatus) {
        setActionLoading(leadId);
        try {
            await updateLead(leadId, { leadStatus: newStatus });
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: newStatus } : l));
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDelete(leadId) {
        if (!window.confirm("Are you sure you want to delete this lead? This cannot be undone.")) return;
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

    useEffect(() => {
        async function loadGrowthData() {
            setLoading(true);
            try {
                const [allLeads, allBrands, allSales, allUsers] = await Promise.all([
                    getLeads(),
                    getAllBrandProfiles(),
                    getSales(),
                    getAllUsers()
                ]);
                setLeads(Array.isArray(allLeads) ? allLeads : []);
                setBrands(Array.isArray(allBrands) ? allBrands : []);

                // Create User Lookup Map
                const userMap = {};
                allUsers.forEach(u => userMap[u.id] = u);
                setUsers(userMap);

            } catch (error) {
                console.error("Failed to load growth data", error);
            } finally {
                setLoading(false);
            }
        }
        loadGrowthData();
    }, []);

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        if (filter === 'all') return true;
        if (filter === 'prospect') return !lead.leadStatus || lead.leadStatus === LEAD_STATUS.PROSPECT;
        if (filter === 'sampled') return lead.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED || lead.leadStatus === 'sampled';
        if (filter === 'delivered') return lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED;
        if (filter === 'active') return lead.leadStatus === LEAD_STATUS.ACTIVE || lead.status === 'Sold';
        return true;
    });

    // Pipeline Stats & Conversion
    const totalLeads = leads.length;
    const activeCount = leads.filter(l => l.leadStatus === LEAD_STATUS.ACTIVE || l.status === 'Sold').length;
    const prospectCount = leads.filter(l => !l.leadStatus || l.leadStatus === LEAD_STATUS.PROSPECT).length;
    const conversionRate = totalLeads > 0 ? ((activeCount / totalLeads) * 100).toFixed(1) : '0.0';

    const statsArray = [
        { label: 'Total Pipeline', value: totalLeads, colorVar: 'var(--text-primary)' },
        { label: 'Conversion Rate', value: `${conversionRate}%`, color: 'text-emerald-500', subtext: 'Leads to Active' },
        { label: 'Active Accounts', value: activeCount, color: 'text-indigo-500' },
        { label: 'Prospects', value: prospectCount, colorVar: 'var(--text-tertiary)' }
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp className="text-brand-600" />
                        Growth & Pipeline
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)' }}>Track lead conversion across the entire organization.</p>
                </div>

                <div className="flex gap-2">
                    <div className="themed-card rounded-lg p-1 flex" style={{ borderColor: 'var(--border-primary)' }}>
                        {['all', 'prospect', 'sampled', 'active'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${filter === f ? 'bg-brand-600/20 text-brand-400' : ''}`}
                                style={{ color: filter === f ? undefined : 'var(--text-tertiary)' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Pipeline Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsArray.map((stat, idx) => (
                    <div key={idx} className="themed-card p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color || ''}`} style={stat.colorVar ? { color: stat.colorVar } : undefined}>{stat.value}</p>
                        {stat.subtext && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>{stat.subtext}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leads List */}
                <div className="lg:col-span-2 themed-card rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                        <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Store size={18} style={{ color: 'var(--text-tertiary)' }} />
                            Global Leads
                        </h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 shadow-sm z-10" style={{ background: 'var(--bg-card)' }}>
                                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dispensary</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Pipeline Status</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Owner</th>
                                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderColor: 'var(--border-primary)' }}>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <td className="py-3 px-6 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            <Link
                                                to={`/admin/dispensary/${lead.id}`}
                                                className="hover:text-brand-600 hover:underline transition-colors"
                                            >
                                                {lead.dispensaryName}
                                            </Link>
                                            {lead.licenseNumber && <span className="block text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{lead.licenseNumber}</span>}
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="relative inline-block">
                                                <select
                                                    value={lead.leadStatus || LEAD_STATUS.PROSPECT}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    disabled={actionLoading === lead.id}
                                                    className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 ${(lead.leadStatus === LEAD_STATUS.ACTIVE || lead.status === 'Sold')
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : (lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : (lead.leadStatus === LEAD_STATUS.SAMPLES_REQUESTED ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                : 'bg-slate-100 text-slate-500 border-slate-200'))
                                                        }`}
                                                >
                                                    <option value={LEAD_STATUS.PROSPECT}>Prospect</option>
                                                    <option value={LEAD_STATUS.SAMPLES_REQUESTED}>Requested</option>
                                                    <option value={LEAD_STATUS.SAMPLES_DELIVERED}>Received</option>
                                                    <option value={LEAD_STATUS.ACTIVE}>Active</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            {(() => {
                                                const u = users[lead.userId] || users[lead.assignedAmbassadorId];
                                                // Priority: 1) User profile name, 2) lead.repAssigned, 3) Generate from email/ID
                                                if (u) {
                                                    if (u.profileInfo?.firstName) {
                                                        return `${u.profileInfo.firstName} ${u.profileInfo.lastName || ''}`.trim();
                                                    }
                                                    if (u.name && !/^[a-f0-9-]{20,}$/i.test(u.name)) {
                                                        return u.name;
                                                    }
                                                    if (u.email) {
                                                        return u.email.split('@')[0].replace(/[._]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                    }
                                                }
                                                // Fallback to repAssigned stored on the lead
                                                if (lead.repAssigned && lead.repAssigned !== 'Unknown') {
                                                    return lead.repAssigned;
                                                }
                                                // Last resort - try to extract name from ID if it looks like an email
                                                const idToCheck = lead.userId || lead.assignedAmbassadorId;
                                                if (idToCheck && idToCheck.includes('@')) {
                                                    return idToCheck.split('@')[0].replace(/[._]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                }
                                                return 'Unassigned';
                                            })()}
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                disabled={actionLoading === lead.id}
                                                className="p-1.5 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                style={{ color: 'var(--text-tertiary)' }}
                                                title="Delete Lead"
                                            >
                                                {actionLoading === lead.id ? <div className="w-4 h-4 rounded-full border-2 border-t-red-600 animate-spin" style={{ borderColor: 'var(--border-primary)' }} /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeads.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            No leads found in this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Brand Network Summary */}
                <div className="themed-card rounded-xl shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                        <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <ShoppingBag size={18} style={{ color: 'var(--text-tertiary)' }} />
                            Brand Network
                        </h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {brands.map((brand, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg transition-colors" style={{ border: '1px solid var(--border-primary)' }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{brand.name}</p>
                                    <p className="text-xs text-brand-500 font-medium">Active Partner</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            </div>
                        ))}
                        {brands.length === 0 && (
                            <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No brands connected.</p>
                        )}
                        <Link to="/admin/brands" className="w-full py-2 text-sm text-center text-brand-600 font-medium bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors block">
                            Manage Brands
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
