import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivations, getAllBrandProfiles } from '../services/firestoreService';
import CalendarView from '../components/CalendarView';
import { Calendar as CalendarIcon, MapPin, Clock, User, Tag, X } from 'lucide-react';

const Schedule = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filterBrand, setFilterBrand] = useState('all');
    const [brands, setBrands] = useState([]);

    const isAdmin = currentUser && ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com'].includes(currentUser.email?.toLowerCase());

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [activationsData, brandsData] = await Promise.all([
                getActivations(),
                getAllBrandProfiles() // Fetch brands for filtering if needed
            ]);

            setBrands(brandsData);

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
                    const start = new Date(`${a.date}T${a.startTime}:00`);
                    const end = new Date(`${a.date}T${a.endTime}:00`);

                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        console.warn(`Invalid date/time for activation ${a.id}:`, a.date, a.startTime);
                        return null;
                    }

                    return {
                        id: a.id,
                        title: `${a.brandName} @ ${a.storeName}`,
                        start,
                        end,
                        resource: {
                            ...a,
                            status: a.status // 'scheduled', 'completed', etc.
                        }
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
                                        {selectedEvent.resource.repName}
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

                            {selectedEvent.resource.notes && (
                                <div className="bg-slate-50 p-4 rounded-lg mt-4 text-sm text-slate-600 italic">
                                    "{selectedEvent.resource.notes}"
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
