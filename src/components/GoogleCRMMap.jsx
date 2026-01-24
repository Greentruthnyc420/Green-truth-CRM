import React, { useMemo, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Phone, Mail, Navigation, Calendar, DollarSign, Package, ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { deliverSamples, LEAD_STATUS } from '../services/firestoreService';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';
import { getMockCoordinates } from '../services/geocodingService';

// Google Maps styling - clean, professional look matching the app theme
const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

// NYC center default
const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060
};

// Clean map style - subtle colors to make markers pop
const mapStyles = [
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'simplified' }]
    }
];

// Status color mapping
const getStatusColor = (status) => {
    switch (status) {
        case LEAD_STATUS.ACTIVE:
        case 'active':
        case 'client':
            return '#10b981'; // Green
        case LEAD_STATUS.SAMPLES_DELIVERED:
        case 'samples_delivered':
            return '#3b82f6'; // Blue
        case LEAD_STATUS.SAMPLES_REQUESTED:
        case 'samples_requested':
        case 'sampled':
            return '#f59e0b'; // Orange
        case LEAD_STATUS.PROSPECT:
        case 'prospect':
        default:
            return '#64748b'; // Grey
    }
};

// Custom SVG marker generator for Google Maps
const createMarkerIcon = (color) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path fill="${color}" filter="url(#shadow)" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z"/>
            <circle fill="white" cx="16" cy="14" r="6"/>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// Legend component matching existing design
const Legend = () => (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl max-w-[200px]">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Map Legend
        </h4>
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

export default function GoogleCRMMap({ leads = [], viewMode = 'admin', currentBrandId = null, onRefresh = null }) {
    const navigate = useNavigate();
    const [updating, setUpdating] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [map, setMap] = useState(null);

    // Load Google Maps API
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        // Prevent multiple loads
        id: 'greentruth-maps'
    });

    const handleDeliverSamples = async (leadId) => {
        if (!leadId || updating) return;
        setUpdating(true);
        try {
            await deliverSamples(leadId);
            if (onRefresh) await onRefresh();
            setSelectedLead(null);
        } catch (error) {
            console.error("Failed to mark samples as delivered:", error);
        } finally {
            setUpdating(false);
        }
    };

    // Open Google Maps for directions
    const handleGetDirections = (lead) => {
        const lat = lead.location?.lat;
        const lng = lead.location?.lng;

        if (lat && lng) {
            // Use coordinates for most accurate navigation
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
                '_blank'
            );
        } else if (lead.address) {
            // Fallback to address-based navigation
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lead.address)}`,
                '_blank'
            );
        }
    };

    // View location on Google Maps (opens in new tab)
    const handleViewOnGoogleMaps = (lead) => {
        const lat = lead.location?.lat;
        const lng = lead.location?.lng;

        if (lat && lng) {
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        } else if (lead.address) {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(lead.address)}`, '_blank');
        }
    };

    // Filter leads based on view mode
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

            const licenseEntry = Object.values(BRAND_LICENSES).find(l => l.brandId === currentBrandId);
            const officialName = licenseEntry?.brandName || currentBrandId;
            const searchTerms = [
                officialName.toLowerCase(),
                currentBrandId.toLowerCase(),
                currentBrandId.toLowerCase().replace(/-/g, ' ')
            ];

            return leads.filter(lead => {
                const hasDirectSamples = lead.samplesRequested?.some(s =>
                    searchTerms.some(term => s.toLowerCase().includes(term))
                );
                const isActiveForBrand = lead.activeBrands?.some(s =>
                    searchTerms.some(term => s.toLowerCase().includes(term))
                );

                return hasDirectSamples || isActiveForBrand;
            }).map(lead => {
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

    // Map callbacks
    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);

        // Fit bounds to show all markers
        if (filteredLeads.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            filteredLeads.forEach(lead => {
                const pos = lead.location?.lat
                    ? { lat: lead.location.lat, lng: lead.location.lng }
                    : getMockCoordinates(lead.dispensaryName || lead.name);
                if (pos.lat && pos.lng) {
                    bounds.extend(new window.google.maps.LatLng(pos.lat || pos[0], pos.lng || pos[1]));
                }
            });
            mapInstance.fitBounds(bounds, { padding: 50 });
        }
    }, [filteredLeads]);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Loading state
    if (loadError) {
        console.error('Google Maps load error:', loadError);
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-100">
                <div className="text-center p-6">
                    <MapPin size={48} className="mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 font-medium">Failed to load Google Maps</p>
                    <p className="text-sm text-slate-400 mt-1">Check your API key configuration</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                    <span className="text-sm font-medium text-brand-700">Loading Google Maps...</span>
                </div>
            </div>
        );
    }

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

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={11}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: mapStyles,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy'
                }}
            >
                {filteredLeads.map((lead, idx) => {
                    // Get position - prefer stored location, fallback to mock
                    let position;
                    if (lead.location?.lat && lead.location?.lng) {
                        position = { lat: lead.location.lat, lng: lead.location.lng };
                    } else {
                        const mockPos = getMockCoordinates(lead.dispensaryName || lead.name);
                        position = { lat: mockPos[0], lng: mockPos[1] };
                    }

                    const color = getStatusColor(lead.mapStatus);

                    return (
                        <Marker
                            key={lead.id || idx}
                            position={position}
                            icon={{
                                url: createMarkerIcon(color),
                                scaledSize: new window.google.maps.Size(32, 40),
                                anchor: new window.google.maps.Point(16, 40)
                            }}
                            onClick={() => setSelectedLead({ ...lead, position })}
                        />
                    );
                })}

                {/* InfoWindow for selected marker */}
                {selectedLead && (
                    <InfoWindow
                        position={selectedLead.position}
                        onCloseClick={() => setSelectedLead(null)}
                        options={{
                            pixelOffset: new window.google.maps.Size(0, -40),
                            maxWidth: 320
                        }}
                    >
                        <div className="min-w-[280px] p-1">
                            {/* Header */}
                            <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                                {selectedLead.dispensaryName || selectedLead.name}
                            </h3>

                            {/* Address with View on Maps link */}
                            {selectedLead.address && (
                                <div className="text-xs text-slate-500 mb-2 flex items-start gap-1">
                                    <Navigation size={10} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{selectedLead.address}</span>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${(selectedLead.mapStatus === 'active' || selectedLead.mapStatus === 'client' || selectedLead.mapStatus === LEAD_STATUS.ACTIVE)
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : (selectedLead.mapStatus === 'samples_delivered' || selectedLead.mapStatus === LEAD_STATUS.SAMPLES_DELIVERED
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : (selectedLead.mapStatus === 'samples_requested' || selectedLead.mapStatus === LEAD_STATUS.SAMPLES_REQUESTED || selectedLead.mapStatus === 'sampled'
                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-slate-50 text-slate-700 border-slate-100'))
                                    }`}>
                                    {(selectedLead.mapStatus || 'prospect').replace('_', ' ')}
                                </span>
                                <span className="text-xs text-slate-400">
                                    Rep: {selectedLead.repAssigned || 'Unassigned'}
                                </span>
                            </div>

                            {/* Contact Info */}
                            {(selectedLead.contactName || selectedLead.phone || selectedLead.email) && (
                                <div className="text-xs text-slate-600 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                    {selectedLead.contactName && (
                                        <div className="font-medium mb-1">{selectedLead.contactName}</div>
                                    )}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {selectedLead.phone && (
                                            <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                                                <Phone size={12} /> {selectedLead.phone}
                                            </a>
                                        )}
                                        {selectedLead.email && (
                                            <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 truncate max-w-[150px]">
                                                <Mail size={12} /> <span className="truncate">{selectedLead.email}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Revenue & Last Order */}
                            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium">LIFETIME REVENUE</div>
                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        <DollarSign size={12} className="text-emerald-500" />
                                        {selectedLead.totalRevenue ? selectedLead.totalRevenue.toLocaleString() : '0'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-medium">LAST ORDER</div>
                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        <Calendar size={12} className="text-blue-500" />
                                        {selectedLead.lastSaleDate || selectedLead.lastActivation
                                            ? new Date(selectedLead.lastSaleDate || selectedLead.lastActivation).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                            : '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Active Brands */}
                            {selectedLead.activeBrands && selectedLead.activeBrands.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-[10px] text-slate-400 font-medium mb-1">BRANDS CARRIED</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedLead.activeBrands.slice(0, 4).map((brand, i) => (
                                            <span key={i} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-100">
                                                {brand}
                                            </span>
                                        ))}
                                        {selectedLead.activeBrands.length > 4 && (
                                            <span className="text-[10px] text-slate-400">+{selectedLead.activeBrands.length - 4} more</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                                {/* 🧭 GET DIRECTIONS BUTTON - NEW! */}
                                <button
                                    onClick={() => handleGetDirections(selectedLead)}
                                    className="w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    <Navigation size={14} />
                                    Get Directions
                                </button>

                                {/* View on Google Maps */}
                                <button
                                    onClick={() => handleViewOnGoogleMaps(selectedLead)}
                                    className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-1.5 border border-slate-200 transition-all"
                                >
                                    <ExternalLink size={12} />
                                    View on Google Maps
                                </button>

                                {/* Mark Samples Delivered */}
                                {selectedLead.mapStatus === LEAD_STATUS.SAMPLES_REQUESTED && (
                                    <button
                                        onClick={() => handleDeliverSamples(selectedLead.id)}
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

                                {/* Log Sale */}
                                <Link
                                    to="/app/log-sale"
                                    state={{
                                        prefill: {
                                            dispensary: selectedLead.dispensaryName || selectedLead.name,
                                            dispensaryId: selectedLead.id,
                                            licenseNumber: selectedLead.licenseNumber || selectedLead.license_number
                                        }
                                    }}
                                    className="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                >
                                    <DollarSign size={14} />
                                    Log Sale
                                </Link>

                                {/* View Details Link */}
                                {selectedLead.id && (
                                    <Link
                                        to={`/admin/dispensary/${selectedLead.id}`}
                                        className="w-full py-2 px-3 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 flex items-center justify-center gap-1 border border-brand-200 transition-all"
                                    >
                                        View Full Details →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}
