import React, { useEffect, useState } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getLeads } from '../../services/firestoreService';
import { Navigation } from 'lucide-react';
import GoogleCRMMap from '../../components/GoogleCRMMap';

export default function BrandMap() {
    const { brandUser } = useBrandAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeads() {
            setLoading(true);
            try {
                // Fetch ALL leads - CRMMap will handle filtering for the brand
                // In a real production app, we should only fetch leads relevant to the brand
                // to avoid leaking data, but for this prototype/MVP, client-side filtering 
                // in CRMMap is acceptable as per instructions.
                const data = await getLeads();
                setLeads(data);
            } catch (error) {
                console.error("Failed to load map data", error);
            } finally {
                setLoading(false);
            }
        }
        loadLeads();
    }, [brandUser]);

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col">

            <div className="themed-card px-6 py-4 flex justify-between items-center shadow-sm z-10" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Navigation style={{ color: 'var(--accent-primary)' }} size={24} />
                        Store Locations
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        active locations carrying {brandUser?.brandName} products
                    </p>
                </div>
            </div>

            <div className="flex-1 relative" style={{ background: 'var(--bg-secondary)' }}>
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                            <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Loading Locations...</span>
                        </div>
                    </div>
                ) : (
                    <GoogleCRMMap
                        leads={leads}
                        viewMode="brand"
                        currentBrandId={brandUser?.brandId}
                        onRefresh={null}
                    />
                )}
            </div>
        </div>
    );
}
