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

// Import getMockCoordinates from geocoding service
// Real geocoding (geocodeAddress) can be used when batch processing leads with addresses
import { getMockCoordinates } from '../services/geocodingService';

// Custom Pin Factory
// Rep-specific colors for admin map view
const REP_COLORS = {
    'amber': '#f59e0b',      // Amber - Orange/Yellow
    'alyssa': '#ec4899',     // Alyssa - Pink
    'omar': '#10b981',       // Omar - Green (Owner)
    'dev tester': '#10b981', // Dev Tester - Green (same as owner for testing)
    'unassigned': '#64748b', // Unassigned - Grey
    // Add more reps as needed with distinct colors
};

// Generate a color from rep name (fallback for unknown reps)
const getRepColor = (repName) => {
    if (!repName) return REP_COLORS.unassigned;

    const normalizedName = repName.toLowerCase().trim();

    // Check for exact or partial matches
    for (const [key, color] of Object.entries(REP_COLORS)) {
        if (normalizedName.includes(key)) {
            return color;
        }
    }

    // Generate consistent color from name hash for unknown reps
    let hash = 0;
    for (let i = 0; i < normalizedName.length; i++) {
        hash = normalizedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
};

const createCustomIcon = (status, repName = null, useRepColor = false) => {
    let color = '#64748b'; // Default Grey (Prospect)

    // If using rep-based coloring (admin mode), use rep color
    if (useRepColor && repName) {
        color = getRepColor(repName);
    } else {
        // Status-based coloring
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

const Legend = ({ useRepColors = false }) => (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl max-w-[200px]">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {useRepColors ? 'Sales Reps' : 'Map Legend'}
        </h4>
        <div className="space-y-2.5">
            {useRepColors ? (
                // Rep-based legend
                <>
                    <div className="flex items-center gap-3 group">
                        <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-sm shadow-emerald-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">Omar (Owner)</span>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-sm shadow-amber-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">Amber</span>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-3 h-3 rounded-full bg-[#ec4899] shadow-sm shadow-pink-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">Alyssa</span>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm shadow-slate-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">Unassigned</span>
                    </div>
                </>
            ) : (
                // Status-based legend
                <>
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
                </>
            )}
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

            <Legend useRepColors={false} />
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

                    // Use status-based coloring
                    const icon = createCustomIcon(lead.mapStatus, null, false);

                    return (
                        <Marker key={idx} position={position} icon={icon}>
                            <Popup className="custom-popup">
                                <div className="min-w-[260px] p-2">
                                    <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                                        {lead.dispensaryName || lead.name}
                                    </h3>

                                    {/* Address */}
                                    {lead.address && (
                                        <p className="text-xs text-slate-500 mb-2 flex items-start gap-1">
                                            <Navigation size={10} className="mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{lead.address}</span>
                                        </p>
                                    )}

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
                                            Rep: {lead.repAssigned || 'Unassigned'}
                                        </span>
                                    </div>

                                    {/* Contact Info */}
                                    {(lead.contactName || lead.phone || lead.email) && (
                                        <div className="text-xs text-slate-600 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            {lead.contactName && (
                                                <div className="font-medium mb-1">{lead.contactName}</div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                {lead.phone && (
                                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                                                        <Phone size={12} /> {lead.phone}
                                                    </a>
                                                )}
                                                {lead.email && (
                                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 truncate max-w-[130px]">
                                                        <Mail size={12} /> <span className="truncate">{lead.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">LIFETIME REVENUE</div>
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                <DollarSign size={12} className="text-emerald-500" />
                                                {lead.totalRevenue ? lead.totalRevenue.toLocaleString() : '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">LAST ORDER</div>
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                <Calendar size={12} className="text-blue-500" />
                                                {lead.lastSaleDate || lead.lastActivation
                                                    ? new Date(lead.lastSaleDate || lead.lastActivation).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Brands */}
                                    {lead.activeBrands && lead.activeBrands.length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-[10px] text-slate-400 font-medium mb-1">BRANDS CARRIED</div>
                                            <div className="flex flex-wrap gap-1">
                                                {lead.activeBrands.slice(0, 4).map((brand, i) => (
                                                    <span key={i} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-100">
                                                        {brand}
                                                    </span>
                                                ))}
                                                {lead.activeBrands.length > 4 && (
                                                    <span className="text-[10px] text-slate-400">+{lead.activeBrands.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                                        {lead.mapStatus === LEAD_STATUS.SAMPLES_REQUESTED && (
                                            <button
                                                onClick={() => handleDeliverSamples(lead.id)}
                                                disabled={updating}
                                                className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 ${updating
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 hover:border-amber-300'
                                                    }`}
                                            >
                                                <Package size={14} />
                                                {updating ? 'Updating...' : 'Mark Samples Delivered'}
                                            </button>
                                        )}

                                        <Link
                                            to="/app/log-sale"
                                            state={{
                                                prefill: {
                                                    dispensary: lead.dispensaryName || lead.name,
                                                    dispensaryId: lead.id,
                                                    licenseNumber: lead.licenseNumber || lead.license_number
                                                }
                                            }}
                                            className="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <DollarSign size={14} />
                                            Log Sale
                                        </Link>

                                        {/* View Details Link */}
                                        {lead.id && (
                                            <Link
                                                to={`/admin/dispensary/${lead.id}`}
                                                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 flex items-center justify-center gap-1 border border-brand-200 transition-all"
                                            >
                                                View Full Details →
                                            </Link>
                                        )}
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
