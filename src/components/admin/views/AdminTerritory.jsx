import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAllAccounts } from '../../../services/firestoreService';
import { Map, RefreshCw, Filter, Users, MapPin, TrendingUp, Building2 } from 'lucide-react';
import GoogleCRMMap from '../../GoogleCRMMap';

// NYC Borough territories
const TERRITORIES = [
    { id: 'all', name: 'All Territories', color: '#6366f1' },
    { id: 'manhattan', name: 'Manhattan', color: '#10b981' },
    { id: 'brooklyn', name: 'Brooklyn', color: '#3b82f6' },
    { id: 'queens', name: 'Queens', color: '#f59e0b' },
    { id: 'bronx', name: 'The Bronx', color: '#ef4444' },
    { id: 'staten_island', name: 'Staten Island', color: '#8b5cf6' },
    { id: 'long_island', name: 'Long Island', color: '#ec4899' },
    { id: 'outside_nyc', name: 'Outside NYC', color: '#64748b' }
];

export default function AdminTerritory() {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerritory, setSelectedTerritory] = useState('all');
    const [selectedRep, setSelectedRep] = useState('all');

    async function loadTerritoryData() {
        setLoading(true);
        try {
            // Fetch accounts
            const accountData = await getAllAccounts(currentUser?.uid, true);
            const accountsArray = Array.isArray(accountData) ? accountData : [];
            setAccounts(accountsArray);

            // Extract unique sales reps from accounts
            const uniqueReps = [...new Set(
                accountsArray
                    .map(a => a.repAssigned || a.assignedRep)
                    .filter(Boolean)
            )].map(name => ({ name }));
            setSalesReps(uniqueReps);
        } catch (error) {
            console.error("Failed to load territory data", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTerritoryData();
    }, [currentUser]);

    // Filter accounts based on territory and rep
    const filteredAccounts = useMemo(() => {
        let filtered = accounts;

        if (selectedTerritory !== 'all') {
            filtered = filtered.filter(account => {
                const address = (account.address || account.fullAddress || '').toLowerCase();
                const territory = selectedTerritory.toLowerCase();

                if (territory === 'manhattan') return address.includes('manhattan') || address.includes(', ny 10');
                if (territory === 'brooklyn') return address.includes('brooklyn') || address.includes(', ny 11');
                if (territory === 'queens') return address.includes('queens') || address.includes('flushing') || address.includes('astoria');
                if (territory === 'bronx') return address.includes('bronx') || address.includes(', ny 104');
                if (territory === 'staten_island') return address.includes('staten island');
                if (territory === 'long_island') return address.includes('long island') || address.includes('nassau') || address.includes('suffolk');
                if (territory === 'outside_nyc') {
                    // Everything not in NYC
                    const isNYC = address.includes('manhattan') || address.includes('brooklyn') ||
                        address.includes('queens') || address.includes('bronx') ||
                        address.includes('staten island');
                    return !isNYC;
                }
                return true;
            });
        }

        if (selectedRep !== 'all') {
            filtered = filtered.filter(account =>
                account.repAssigned === selectedRep ||
                account.assignedRep === selectedRep ||
                account.userId === selectedRep
            );
        }

        return filtered;
    }, [accounts, selectedTerritory, selectedRep]);

    // Calculate territory stats
    const territoryStats = useMemo(() => {
        const active = filteredAccounts.filter(a =>
            a.leadStatus === 'active' || a.leadStatus === 'client' || a.lastPurchase
        ).length;

        const samplesRequested = filteredAccounts.filter(a =>
            a.leadStatus === 'samples_requested' || a.samplesRequested?.length > 0
        ).length;

        const prospects = filteredAccounts.length - active - samplesRequested;

        return { active, samplesRequested, prospects, total: filteredAccounts.length };
    }, [filteredAccounts]);

    return (
        <div className="h-[calc(100vh-64px)] -m-4 lg:-m-8 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Map className="text-brand-600" size={24} />
                            Territory Management
                        </h1>
                        <p className="text-sm text-slate-500">
                            {loading ? 'Loading global data...' : `Viewing ${filteredAccounts.length} of ${accounts.length} Locations`}
                        </p>
                    </div>

                    <button
                        onClick={loadTerritoryData}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                        title="Refresh Map"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Filters and Stats Row */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Territory Filter */}
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        <select
                            value={selectedTerritory}
                            onChange={(e) => setSelectedTerritory(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {TERRITORIES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Rep Filter */}
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <select
                            value={selectedRep}
                            onChange={(e) => setSelectedRep(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="all">All Reps</option>
                            {salesReps.map(rep => (
                                <option key={rep.id || rep.uid} value={rep.name || rep.email}>
                                    {rep.name || rep.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-600">Active: <strong>{territoryStats.active}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <span className="text-slate-600">Samples: <strong>{territoryStats.samplesRequested}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                            <span className="text-slate-600">Prospects: <strong>{territoryStats.prospects}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative bg-slate-100">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                            <span className="text-sm font-medium text-brand-700">Loading Map...</span>
                        </div>
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No accounts in this territory</p>
                            <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        </div>
                    </div>
                ) : (
                    <GoogleCRMMap
                        leads={filteredAccounts}
                        viewMode="admin"
                        currentBrandId={null}
                        onRefresh={loadTerritoryData}
                    />
                )}
            </div>
        </div>
    );
}
