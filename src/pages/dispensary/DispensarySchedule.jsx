import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, Building2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getActivations, getAllBrandProfiles } from '../../services/firestoreService';
import ActivationFormModal from '../../components/ActivationFormModal';
import { useNotification } from '../../contexts/NotificationContext';

export default function DispensarySchedule() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [activations, setActivations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

            // Map brand names
            const myActivations = allActivations
                .filter(a => a.dispensaryId === currentUser.uid)
                .map(a => {
                    const brand = brandProfiles.find(b => b.id === a.brandId);
                    return {
                        ...a,
                        brandName: brand ? brand.name : (a.brandName || 'Unknown Brand')
                    };
                });

            setActivations(myActivations);
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
            ) : activations.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Activations Scheduled</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        You haven't scheduled any brand activations yet. Request a demo or pop-up to engage your customers!
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-emerald-600 font-bold hover:underline"
                    >
                        Schedule your first event
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activations.map(activation => (
                        <div key={activation.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl">
                                        📅
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{activation.brandName}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${activation.status === 'Scheduled' ? 'bg-green-100 text-green-700' :
                                            activation.status === 'Requested' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {activation.status || 'Scheduled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600">
                                {activation.status === 'Requested' && activation.datePreferences ? (
                                    <div className="bg-amber-50 p-2 rounded border border-amber-100 mb-2">
                                        <span className="text-xs font-bold text-amber-800 uppercase block mb-1">Requested Dates:</span>
                                        <ul className="list-disc list-inside text-xs text-amber-900">
                                            {activation.datePreferences.map((d, i) => (
                                                <li key={i}>{new Date(d).toLocaleDateString()}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span>{new Date(activation.date).toLocaleDateString()}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-400" />
                                    <span>{activation.startTime || '12:00'} - {activation.endTime || '16:00'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    <span>{activation.activationType || 'General'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
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
