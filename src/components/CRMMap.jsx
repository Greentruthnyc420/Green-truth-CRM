import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Phone, Mail, Navigation, Calendar, DollarSign, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

// Custom Pin Factory
const createCustomIcon = (status) => {
    let colorClass = 'bg-slate-400'; // Default/Dead
    let statusLabel = 'Lead';

    if (status === 'client') {
        colorClass = 'bg-emerald-500';
        statusLabel = 'Client';
    } else if (status === 'sampled') {
        colorClass = 'bg-yellow-400';
        statusLabel = 'Sampled';
    } else if (status === 'prospect') {
        colorClass = 'bg-red-500';
        statusLabel = 'Prospect';
    }

    const html = `
        <div class="${colorClass} w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

/* 
 * Mock Geocoding Helper (Fallback for old data)
 * Uses simple hashing to deterministic scatter points around NYC
 */
const getMockCoordinates = (str) => {
    if (!str) return [40.7128, -74.0060];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = (hash % 1000) / 7000; // tighter spread
    const lngOffset = ((hash >> 16) % 1000) / 7000;
    return [40.7128 + latOffset, -74.0060 + lngOffset];
};

export default function CRMMap({ leads = [], viewMode = 'admin', currentBrandId = null }) {

    // 1. Role-Based Visibility Filter
    const filteredLeads = useMemo(() => {
        if (!leads || leads.length === 0) return [];

        if (viewMode === 'admin') {
            return leads.map(lead => ({
                ...lead,
                mapStatus: lead.lastPurchase ? 'client' : (lead.samplesRequested?.length > 0 ? 'sampled' : 'prospect')
            }));
        } else {
            // Brand View
            if (!currentBrandId) return [];

            // Normalize brand ID for matching
            const brandIdLower = currentBrandId.toLowerCase().replace(/-/g, ' ');

            return leads.filter(lead => {
                // Check if this lead interacts with THIS brand
                // 1. Has Sales (Not implemented in Lead object directly in this prototype, but could be inferred)
                // 2. Has Samples Requested matching this brand

                const hasSamples = lead.samplesRequested?.some(s => s.toLowerCase().includes(brandIdLower));
                // Allow if sold (assuming 'status' or 'sales' field would eventually track this per brand)
                // For now, we show if they sampled OR if they are a general 'client' (assuming access)

                return hasSamples || lead.status === 'Sold';
            }).map(lead => ({
                ...lead,
                mapStatus: lead.lastPurchase ? 'client' : 'sampled' // Brands mostly care about Active vs Sampled
            }));
        }
    }, [leads, viewMode, currentBrandId]);

    return (
        <div className="h-full w-full relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {/* Map Legend Overlay */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-100 max-w-[200px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legend</h4>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Active Client</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                        <span>Sampled / Lead</span>
                    </div>
                    {viewMode === 'admin' && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span>Prospect (New)</span>
                        </div>
                    )}
                </div>
            </div>

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
                    // Use real coords if available, else standard mockup
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
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${lead.mapStatus === 'client'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : (lead.mapStatus === 'sampled' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100')
                                            }`}>
                                            {lead.mapStatus}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {lead.repAssigned?.split(' ')[0] || 'Unassigned'}
                                        </span>
                                    </div>

                                    {/* Tooltip Metrics */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-medium">LIFETIME</div>
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                                <DollarSign size={12} className="text-emerald-500" />
                                                {/* Mock Revenue or Real if available */}
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

                                    {/* Action Footer */}
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

                                        <Link
                                            to="/log-sale"
                                            state={{ prefill: { dispensary: lead.dispensaryName || lead.name } }}
                                            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                                        >
                                            Log Sale <Navigation size={12} />
                                        </Link>
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
