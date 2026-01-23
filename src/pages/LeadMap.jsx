import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeads, getMyDispensaries } from '../services/firestoreService';
import { Navigation } from 'lucide-react';
import CRMMap from '../components/CRMMap';

export default function LeadMap() {
    const { currentUser, isAdmin } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadLeads() {
        setLoading(true);
        try {
            // Admin sees ALL leads, reps see only their assigned dispensaries
            const data = isAdmin
                ? await getLeads()
                : await getMyDispensaries(currentUser?.uid || 'test-user-123');
            console.log('[LeadMap] Loaded leads:', data.length, 'isAdmin:', isAdmin);
            setLeads(data);
        } catch (error) {
            console.error("Failed to load map data", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLeads();
    }, [currentUser, isAdmin]);

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col">

            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Navigation className="text-brand-600" size={24} />
                        Territory Map {isAdmin && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Admin View</span>}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {loading ? 'Loading locations...' : `${leads.length} Locations${isAdmin ? ' (All)' : ' (Assigned to you)'}`}
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* Optional: Add Filter Buttons here later */}
                </div>
            </div>

            <div className="flex-1 relative bg-slate-50">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                            <span className="text-sm font-medium text-brand-700">Loading Map Data...</span>
                        </div>
                    </div>
                ) : (
                    <CRMMap
                        leads={leads}
                        viewMode="admin"
                        currentBrandId={null}
                        onRefresh={loadLeads}
                    />
                )}
            </div>
        </div>
    );
}
