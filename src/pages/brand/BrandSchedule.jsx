import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getActivations } from '../../services/firestoreService';
import CalendarView from '../../components/CalendarView';
import { Calendar as CalendarIcon, MapPin, Clock, User, Tag, X } from 'lucide-react';

const BrandSchedule = () => {
    const { brandUser } = useBrandAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        loadData();
    }, [brandUser]);

    const loadData = async () => {
        if (!brandUser?.brandId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const activationsData = await getActivations();

            // Filter: Only show activations for this brand
            const brandActivations = activationsData.filter(a => a.brandId === brandUser.brandId);

            // Transform for Calendar
            const calendarEvents = brandActivations.map(a => {
                try {
                    const start = new Date(`${a.date}T${a.startTime}:00`);
                    const end = new Date(`${a.date}T${a.endTime}:00`);

                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        console.warn(`Invalid date/time for activation ${a.id}:`, a.date, a.startTime);
                        return null;
                    }

                    return {
                        id: a.id,
                        title: `@ ${a.storeName}`,
                        start,
                        end,
                        resource: {
                            ...a,
                            status: a.status
                        }
                    };
                } catch (e) {
                    console.error("Error parsing activation date:", e);
                    return null;
                }
            }).filter(Boolean);

            setEvents(calendarEvents);

        } catch (error) {
            console.error("Failed to load brand schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    // Helper for 24h to 12h time
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes.padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="text-brand-600" />
                        Activation Schedule
                    </h1>
                    <p className="text-slate-500">
                        View upcoming activations scheduled for your brand.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <CalendarView
                    events={events}
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
                                    <label className="text-xs font-bold text-slate-400 uppercase">Representative</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User size={16} className="text-brand-500" />
                                        {selectedEvent.resource.repName}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Store</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Tag size={16} className="text-brand-500" />
                                        {selectedEvent.resource.storeName}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Location Details</label>
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

export default BrandSchedule;
