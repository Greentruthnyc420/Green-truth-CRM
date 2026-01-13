import React, { useState, useEffect } from 'react';
import CalendarView from '../../components/CalendarView';
import { Calendar, Plus, Clock, MapPin, Building2, User, X, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getActivations, getAllBrandProfiles } from '../../services/firestoreService';
import ActivationFormModal from '../../components/ActivationFormModal';
import { useNotification } from '../../contexts/NotificationContext';

export default function DispensarySchedule() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [events, setEvents] = useState([]); // Calendar Events
    const [activations, setActivations] = useState([]); // Raw data (optional, but keeping for now)
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // For Details Modal

    useEffect(() => {
        loadActivations();
    }, [currentUser]);

    const loadActivations = async () => {
        if (!currentUser?.uid) return;
        setLoading(true);
        try {
            const [allActivations, brandProfiles] = await Promise.all([
                getActivations(),
                getAllBrandProfiles()
            ]);

            // Filter for this dispensary
            const myActivations = allActivations
                .filter(a => a.dispensaryId === currentUser.uid);

            // Transform for Calendar
            const calendarEvents = myActivations.map(a => {
                const brand = brandProfiles.find(b => b.id === a.brandId);
                const brandName = brand ? brand.name : (a.brandName || 'Unknown Brand');

                // Handle Dates
                const dateStr = a.date || (a.datePreferences?.[0]) || new Date().toISOString().split('T')[0];
                const start = new Date(`${dateStr}T${a.startTime || '12:00'}:00`);
                const end = new Date(`${dateStr}T${a.endTime || '16:00'}:00`);

                return {
                    id: a.id,
                    title: `${a.status === 'Requested' ? '❓' : ''} ${brandName}`,
                    start,
                    end,
                    resource: {
                        ...a,
                        brandName,
                        status: a.status || 'Scheduled'
                    },
                    style: a.status === 'Requested' ? { backgroundColor: '#fef3c7', borderColor: '#d97706', color: '#92400e' } : {}
                };
            }).filter(Boolean);

            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to load activations", error);
            showNotification("Failed to load schedule", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-emerald-600" />
                        Activations & Events
                    </h1>
                    <p className="text-slate-500">Manage your upcoming brand activations and demos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                    <Plus size={18} />
                    Request Activation
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <CalendarView
                        events={events}
                        onEventClick={setSelectedEvent}
                        height="70vh"
                    />
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Activation Details</h3>
                                <p className="text-emerald-700 text-sm font-medium mt-1 uppercase tracking-wide">
                                    {selectedEvent.resource.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-emerald-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Status Banner for Requested */}
                            {(selectedEvent.resource.status === 'Requested' || selectedEvent.resource.status === 'Pending') && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                            <Calendar size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-amber-900">Activation Requested</h4>
                                            <p className="text-sm text-amber-700 mt-1 mb-2">
                                                Awaiting confirmation from Admin/Brand.
                                            </p>
                                            {selectedEvent.resource.datePreferences && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-amber-800 uppercase">Your Preferred Dates:</p>
                                                    {selectedEvent.resource.datePreferences.map((d, i) => (
                                                        <div key={i} className="text-sm text-amber-900 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                                            {new Date(d).toLocaleDateString()}
                                                        </div>
                                                    ))}
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
                                        <Tag size={16} className="text-emerald-500" />
                                        {selectedEvent.resource.brandName}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User size={16} className="text-emerald-500" />
                                        {selectedEvent.resource.activationType || 'Activation'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Time</label>
                                <div className="flex items-center gap-2 text-slate-800 font-medium">
                                    <Clock size={16} className="text-emerald-500" />
                                    {selectedEvent.resource.startTime || '12:00'} - {selectedEvent.resource.endTime || '16:00'}
                                </div>
                                <p className="text-sm text-slate-500 pl-6">
                                    {new Date(selectedEvent.resource.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

            <ActivationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadActivations}
                initialData={{
                    userRole: 'dispensary',
                    dispensaryId: currentUser?.uid // Pass self as dispensary
                }}
            />
        </div>
    );
}
