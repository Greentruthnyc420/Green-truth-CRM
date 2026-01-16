import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Phone, Mail, Navigation, Calendar, DollarSign, Package, X, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { deliverSamples, LEAD_STATUS } from '../services/firestoreService';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

// Custom Pin Factory
const createCustomIcon = (status) => {
    let color = '#64748b'; // Default Grey (Prospect)

    switch (status) {
        case LEAD_STATUS.ACTIVE:
        case 'active':
        case 'client':
            color = '#10b981'; // Green
            break;
        case LEAD_STATUS.SAMPLES_DELIVERED:
        case 'samples_delivered':
            color = '#3b82f6'; // Blue
            break;
        case LEAD_STATUS.SAMPLES_REQUESTED:
        case 'samples_requested':
        case 'sampled':
            color = '#f59e0b'; // Orange
            break;
        case LEAD_STATUS.PROSPECT:
        case 'prospect':
        default:
            color = '#64748b'; // Grey
            break;
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="relative group">
                <div style="background-color: ${color};" class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

// Mock Geocoding Helper
const getMockCoordinates = (str) => {
    if (!str) return [40.7128, -74.0060];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = (hash % 1000) / 7000;
    const lngOffset = ((hash >> 16) % 1000) / 7000;
    return [40.7128 + latOffset, -74.0060 + lngOffset];
};

const Legend = () => (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl max-w-[200px]">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Map Legend</h4>
        <div className="space-y-2.5">
            <div className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-sm shadow-emerald-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700">Active Accounts</span>
            </div>
            <div className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm shadow-blue-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700">Samples Delivered</span>
            </div>
            <div className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-sm shadow-amber-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700">Samples Requested</span>
            </div>
            <div className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm shadow-slate-200 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700">Prospects</span>
            </div>
        </div>
    </div>
);

export default function CRMMap({ leads = [], viewMode = 'admin', currentBrandId = null, onRefresh = null }) {
    const navigate = useNavigate();
    const [updating, setUpdating] = useState(false);

    const handleDeliverSamples = async (leadId) => {
        if (!leadId || updating) return;
        setUpdating(true);
        try {
            await deliverSamples(leadId);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error("Failed to mark samples as delivered:", error);
        } finally {
            setUpdating(false);
        }
    };

    const filteredLeads = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        if (viewMode === 'admin') {
            return leads.map(lead => ({
                ...lead,
                mapStatus: lead.leadStatus || (lead.lastPurchase ? 'active' : (lead.samplesRequested?.length > 0 ? 'samples_requested' : 'prospect'))
            }));
        } else {
            // Brand View
            if (!currentBrandId) return [];

            // Get official brand name for matching
            const licenseEntry = Object.values(BRAND_LICENSES).find(l => l.brandId === currentBrandId);
            const officialName = licenseEntry?.brandName || currentBrandId;
            const searchTerms = [
                officialName.toLowerCase(),
                currentBrandId.toLowerCase(),
                currentBrandId.toLowerCase().replace(/-/g, ' ')
            ];

            return leads.filter(lead => {
                // Brands see their active accounts OR leads that requested/delivered samples for them
                const hasDirectSamples = lead.samplesRequested?.some(s =>
                    searchTerms.some(term => s.toLowerCase().includes(term))
                );
                const isActiveForBrand = lead.activeBrands?.some(s =>
                    searchTerms.some(term => s.toLowerCase().includes(term))
                );

                return hasDirectSamples || isActiveForBrand;
            }).map(lead => {
                // Determine status relative to this brand
                const isActiveForThisBrand = lead.activeBrands?.some(s =>
                    searchTerms.some(term => s.toLowerCase().includes(term))
                );
                const isDeliveredForThisBrand = lead.leadStatus === LEAD_STATUS.SAMPLES_DELIVERED &&
                    lead.samplesRequested?.some(s => searchTerms.some(term => s.toLowerCase().includes(term)));

                return {
                    ...lead,
                    mapStatus: isActiveForThisBrand
                        ? LEAD_STATUS.ACTIVE
                        : (isDeliveredForThisBrand ? LEAD_STATUS.SAMPLES_DELIVERED : LEAD_STATUS.SAMPLES_REQUESTED)
                };
            });
        }
    }, [leads, viewMode, currentBrandId]);

    return (
        <div className="h-full w-full relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {/* Mobile Exit Button */}
            <div className="md:hidden absolute top-4 left-4 z-[1001] flex gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 text-slate-700 flex items-center gap-2 font-bold active:scale-95 transition-all"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm">Exit Map</span>
                </button>
            </div>

            <Legend />
            <MapContainer
                center={[40.7128, -74.0060]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredLeads.map((lead, idx) => {
                    const position = lead.location?.lat
                        ? [lead.location.lat, lead.location.lng]
                        : (lead.coords || getMockCoordinates(lead.dispensaryName || lead.name));

                    const icon = createCustomIcon(lead.mapStatus);

                    return (
                        <Marker key={idx} position={position} icon={icon}>
                            <Popup className="custom-popup">
                                <div className="min-w-[220px] p-2">
                                    <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                                        {lead.dispensaryName || lead.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${(lead.mapStatus === 'active' || lead.mapStatus === 'client' || lead.mapStatus === LEAD_STATUS.ACTIVE)
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : (lead.mapStatus === 'samples_delivered' || lead.mapStatus === LEAD_STATUS.SAMPLES_DELIVERED ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                (lead.mapStatus === 'samples_requested' || lead.mapStatus === LEAD_STATUS.SAMPLES_REQUESTED || lead.mapStatus === 'sampled' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-slate-50 text-slate-700 border-slate-100'))
                                            }`}>
                                            {(lead.mapStatus || 'prospect').replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {lead.repAssigned?.split(' ')[0] || 'Unassigned'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">LIFETIME</div>
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                <DollarSign size={12} className="text-emerald-500" />
                                                {lead.totalRevenue ? lead.totalRevenue.toLocaleString() : '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">LAST VISIT</div>
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                <Calendar size={12} className="text-blue-500" />
                                                {lead.lastActivation ? new Date(lead.lastActivation).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex gap-1">
                                            {lead.phone && (
                                                <a href={`tel:${lead.phone}`} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors" title="Call">
                                                    <Phone size={14} />
                                                </a>
                                            )}
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors" title="Email">
                                                    <Mail size={14} />
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {lead.mapStatus === LEAD_STATUS.SAMPLES_REQUESTED && (
                                                <button
                                                    onClick={() => handleDeliverSamples(lead.id)}
                                                    disabled={updating}
                                                    className={`w-full py-1.5 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 ${updating
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 hover:border-amber-300'
                                                        }`}
                                                >
                                                    <Package size={12} />
                                                    {updating ? 'Updating...' : 'Mark Delivered'}
                                                </button>
                                            )}

                                            <Link
                                                to="/log-sale"
                                                state={{ prefill: { dispensary: lead.dispensaryName || lead.name } }}
                                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 py-1"
                                            >
                                                Log Sale <Navigation size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
