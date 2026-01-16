import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { getActivations, getAllBrandProfiles, updateActivation, getLeads } from '../services/firestoreService';
import CalendarView from '../components/CalendarView';
import { Calendar as CalendarIcon, MapPin, Clock, User, Tag, X, Plus, Trash2 } from 'lucide-react';
import ActivationFormModal from '../components/ActivationFormModal';

const Schedule = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filterBrand, setFilterBrand] = useState('all');
    const [brands, setBrands] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [activationsData, brandsData, leadsData] = await Promise.all([
                getActivations(),
                getAllBrandProfiles(),
                getLeads()
            ]);

            setBrands(brandsData);
            const dispensaryMap = Object.fromEntries(leadsData.map(l => [l.id, l.dispensaryName || l.companyName]));
            const brandMap = Object.fromEntries(brandsData.map(b => [b.brandId || b.id, b.brandName || b.name]));

            // Filter activations
            let filteredActivations = activationsData;
            if (!isAdmin) {
                // Reps only see their own activations
                // Assuming activation.repId === currentUser.uid OR activation.repEmail === currentUser.email
                // Let's check matching logic. `addActivation` saves `repId`.
                filteredActivations = activationsData.filter(a => a.repId === currentUser.uid);
            }

            // Transform for Calendar
            const calendarEvents = filteredActivations.map(a => {
                try {
                    // Construct Date objects. Support both 'date + startTime' str and ISO strings if mixed.
                    // activationData in addActivation uses: date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM).
                    // For Requested events, date might be null or first preference
                    const dateStr = a.date || (a.datePreferences?.[0]) || new Date().toISOString().split('T')[0];
                    const start = new Date(`${dateStr}T${a.startTime || '12:00'}:00`);
                    const end = new Date(`${dateStr}T${a.endTime || '16:00'}:00`);

                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        console.warn(`Invalid date/time for activation ${a.id}:`, a.date, a.startTime);
                        return null;
                    }

                    const brandName = brandMap[a.brandId] || 'Unknown Brand';
                    const storeName = dispensaryMap[a.dispensaryId] || 'Unknown Store';

                    return {
                        id: a.id,
                        title: `${a.status === 'Requested' ? '❓' : ''} ${brandName} @ ${storeName}`,
                        start,
                        end,
                        resource: {
                            ...a,
                            status: a.status || 'Scheduled'
                        },
                        // Custom style for Requested events
                        style: a.status === 'Requested' ? { backgroundColor: '#fef3c7', borderColor: '#d97706', color: '#92400e' } : {}
                    };
                } catch (e) {
                    console.error("Error parsing activation date:", e);
                    return null;
                }
            }).filter(Boolean);

            setEvents(calendarEvents);

        } catch (error) {
            console.error("Failed to load schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDate = async (activationId, confirmedDate) => {
        if (!confirm(`Confirm activation for ${confirmedDate}?`)) return;

        try {
            await updateActivation(activationId, {
                dateOfActivation: confirmedDate,
                status: 'Scheduled'
            });
            alert("Activation confirmed!");
            setSelectedEvent(null);
            loadData();
        } catch (error) {
            console.error("Failed to confirm activation:", error);
            alert("Error confirming activation");
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const filteredEvents = filterBrand === 'all'
        ? events
        : events.filter(e => e.resource.brandId === filterBrand);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="text-brand-600" />
                        {isAdmin ? 'Master Schedule' : 'My Schedule'}
                    </h1>
                    <p className="text-slate-500">
                        {isAdmin
                            ? 'View and manage all brand activations across the territory.'
                            : 'View your upcoming store visits and brand activations.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Schedule Activation
                    </button>

                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Filter by Brand:</span>
                            <select
                                value={filterBrand}
                                onChange={(e) => setFilterBrand(e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="all">All Brands</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name || b.id}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <CalendarView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    height="75vh"
                />
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-brand-50 p-6 border-b border-brand-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Activation Details</h3>
                                <p className="text-brand-700 text-sm font-medium mt-1 uppercase tracking-wide">
                                    {selectedEvent.resource.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Status Banner */}
                            {(selectedEvent.resource.status === 'Requested' || selectedEvent.resource.status === 'Pending') && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-amber-900">Activation Requested</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Requested by: <span className="font-semibold">{selectedEvent.resource.requestedBy || 'Dispensary/Brand'}</span>
                                            </p>

                                            {selectedEvent.resource.datePreferences && selectedEvent.resource.datePreferences.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-bold text-amber-800 uppercase mb-2">Preferred Dates:</p>
                                                    <div className="space-y-2">
                                                        {selectedEvent.resource.datePreferences.map((date, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100">
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                                                </span>
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => handleConfirmDate(selectedEvent.id, date)}
                                                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded transition-colors"
                                                                    >
                                                                        Confirm This Date
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Brand</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Tag size={16} className="text-brand-500" />
                                        {selectedEvent.resource.brandName}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Representative</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User size={16} className="text-brand-500" />
                                        {selectedEvent.resource.repName || 'Unassigned'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                                <div className="flex items-center gap-2 text-slate-800 font-medium">
                                    <MapPin size={16} className="text-brand-500" />
                                    {selectedEvent.resource.storeName}
                                </div>
                                {selectedEvent.resource.address && (
                                    <p className="text-sm text-slate-500 pl-6">{selectedEvent.resource.address}</p>
                                )}
                            </div>

                            {selectedEvent.resource.status !== 'Requested' && (
                                <div className="space-y-1 pt-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Time</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Clock size={16} className="text-brand-500" />
                                        {formatTime(selectedEvent.resource.startTime)} - {formatTime(selectedEvent.resource.endTime)}
                                    </div>
                                    <p className="text-sm text-slate-500 pl-6">
                                        {new Date(selectedEvent.resource.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            )}

                            {selectedEvent.resource.notes && (
                                <div className="bg-slate-50 p-4 rounded-lg mt-4 text-sm text-slate-600 italic">
                                    "{selectedEvent.resource.notes}"
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
                            {isAdmin && (
                                <button
                                    onClick={async () => {
                                        const activationId = selectedEvent?.resource?.id;
                                        if (!activationId) {
                                            alert('Error: Could not find activation ID.');
                                            return;
                                        }

                                        if (!window.confirm("Are you sure you want to delete this activation? This cannot be undone.")) {
                                            return;
                                        }

                                        try {
                                            const { deleteActivation } = await import('../services/firestoreService');
                                            await deleteActivation(activationId);
                                            alert("Activation deleted successfully!");
                                            setSelectedEvent(null);
                                            loadData();
                                        } catch (error) {
                                            console.error('Delete failed:', error);
                                            alert(`Delete failed: ${error.message}`);
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors ml-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Activation Modal */}
            <ActivationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

// Helper for 24h to 12h time
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10); // Assume minutes might be 00
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes.padStart(2, '0')} ${ampm}`;
};

export default Schedule;
