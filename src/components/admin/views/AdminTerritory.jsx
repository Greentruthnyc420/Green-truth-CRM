import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAllAccounts } from '../../../services/firestoreService';
import { Map, RefreshCw } from 'lucide-react';
import CRMMap from '../../CRMMap';

export default function AdminTerritory() {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadTerritoryData() {
        setLoading(true);
        try {
            // isAdmin = true to fetch EVERYTHING
            const data = await getAllAccounts(currentUser?.uid, true);
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load territory data", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTerritoryData();
    }, [currentUser]);

    return (
        <div className="h-[calc(100vh-64px)] -m-4 lg:-m-8 flex flex-col">
            {/* Context: Negative margins to compensate for Layout padding and make map full height/width relative to container */}

            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Map className="text-brand-600" size={24} />
                        Territory Map
                    </h1>
                    <p className="text-sm text-slate-500">
                        {loading ? 'Loading global data...' : `Monitoring ${accounts.length} Total Locations`}
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

            <div className="flex-1 relative bg-slate-100">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                            <span className="text-sm font-medium text-brand-700">Loading Map...</span>
                        </div>
                    </div>
                ) : (
                    <CRMMap
                        leads={accounts}
                        viewMode="admin"
                        currentBrandId={null}
                        onRefresh={loadTerritoryData}
                    />
                )}
            </div>
        </div>
    );
}
