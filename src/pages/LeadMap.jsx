import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyDispensaries } from '../services/firestoreService';
import { Navigation } from 'lucide-react';
import CRMMap from '../components/CRMMap';

export default function LeadMap() {
    const { currentUser } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeads() {
            setLoading(true);
            try {
                // Fetch dispensaries (which aggregates leads + sales + shifts)
                const data = await getMyDispensaries(currentUser?.uid || 'test-user-123');
                setLeads(data);
            } catch (error) {
                console.error("Failed to load map data", error);
            } finally {
                setLoading(false);
            }
        }
        loadLeads();
    }, [currentUser]);

    useEffect(() => {
        async function loadLeads() {
            setLoading(true);
            try {
                // Fetch dispensaries (which aggregates leads + sales + shifts)
                const data = await getMyDispensaries(currentUser?.uid || 'test-user-123');
                setLeads(data);
            } catch (error) {
                console.error("Failed to load map data", error);
            } finally {
                setLoading(false);
            }
        }
        loadLeads();
    }, [currentUser]);

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col">

            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Navigation className="text-brand-600" size={24} />
                        Territory Map
                    </h1>
                    <p className="text-sm text-slate-500">
                        {loading ? 'Loading locations...' : `${leads.length} Locations Active`}
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
                        viewMode="admin" // For Sales App, we treat Reps similar to Admins but filtered. 
                        // Note: If you want Brand Portal view, that would happen in BrandDashboard, not here.
                        // Here we are in the Sales App, so "admin" mode is appropriate (shows all statuses)
                        currentBrandId={null}
                    />
                )}
            </div>
        </div>
    );
}
