import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Loader, AlertCircle, Sparkles, CheckCircle, User } from 'lucide-react';
import { getLeads } from '../services/firestoreService';
import { createActivationRequest } from '../services/activationRequestService';

export default function RequestActivationModal({ isOpen, onClose, brandUser }) {
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [assignedRep, setAssignedRep] = useState(null);
    const [formData, setFormData] = useState({
        storeName: '',
        date1: '',
        time1: '',
        date2: '',
        time2: '',
        date3: '',
        time3: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            setStatus({ type: '', message: '' });
            setAssignedRep(null);
        }
    }, [isOpen]);

    const fetchLeads = async () => {
        try {
            const data = await getLeads();
            const sorted = data.sort((a, b) =>
                (a.dispensaryName || '').localeCompare(b.dispensaryName || '')
            );
            setLeads(sorted);
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    // When store is selected, check if it has an assigned rep
    const handleStoreChange = (storeName) => {
        setFormData(prev => ({ ...prev, storeName }));

        const selectedStore = leads.find(l => l.dispensaryName === storeName);
        if (selectedStore?.assignedAmbassadorId) {
            setAssignedRep(selectedStore.repAssigned || 'Assigned Rep');
        } else {
            setAssignedRep(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate at least one date is provided
        if (!formData.date1 && !formData.date2 && !formData.date3) {
            setStatus({ type: 'error', message: 'Please provide at least one date option' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Submitting request...' });

        try {
            const requestData = {
                brandId: brandUser?.brandId,
                brandName: brandUser?.brandName,
                storeName: formData.storeName,
                date1: formData.date1 || null,
                time1: formData.time1 || null,
                date2: formData.date2 || null,
                time2: formData.time2 || null,
                date3: formData.date3 || null,
                time3: formData.time3 || null,
                notes: formData.notes,
                requestedBy: 'brand',
                requesterId: brandUser?.id
            };

            const result = await createActivationRequest(requestData);

            const successMessage = result.routedTo === 'rep'
                ? `Request sent to assigned sales rep! They have 24 hours to respond.`
                : `Request submitted to admin for assignment.`;

            setStatus({ type: 'success', message: successMessage });

            setTimeout(() => {
                onClose();
                setFormData({
                    storeName: '',
                    date1: '',
                    time1: '',
                    date2: '',
                    time2: '',
                    date3: '',
                    time3: '',
                    notes: ''
                });
                setAssignedRep(null);
            }, 2500);

        } catch (error) {
            console.error("Failed to submit request:", error);
            setStatus({ type: 'error', message: error.message || 'Failed to submit request' });
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-activation-modal-title"
        >
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 id="request-activation-modal-title" className="text-xl font-bold text-slate-800">
                                Request Activation
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Schedule a brand pop-up event</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200 shadow-sm"
                        aria-label="Close modal"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`mx-8 mt-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in slide-in-from-top-2 duration-300 ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                        {status.type === 'error' ? <AlertCircle size={20} /> :
                            status.type === 'success' ? <CheckCircle size={20} /> :
                                <Loader size={20} className="animate-spin" />}
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {/* Store Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Target Store</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all duration-200 shadow-sm"
                                value={formData.storeName}
                                onChange={(e) => handleStoreChange(e.target.value)}
                            >
                                <option value="">Select a Dispensary</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.dispensaryName}>
                                        {lead.dispensaryName}
                                        {lead.assignedAmbassadorId ? ' ✓' : ''}
                                    </option>
                                ))}
                                <option value="Other / New Location">--- Other / New Location ---</option>
                            </select>
                        </div>

                        {/* Show assigned rep indicator */}
                        {assignedRep && (
                            <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-sm">
                                <User size={16} className="text-emerald-600" />
                                <span className="text-emerald-700">
                                    <strong>{assignedRep}</strong> will receive this request
                                </span>
                            </div>
                        )}
                        {formData.storeName && !assignedRep && formData.storeName !== "Other / New Location" && (
                            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-amber-600" />
                                <span className="text-amber-700">
                                    No rep assigned - Admin will assign someone
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date Options Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                            Preferred Dates & Times
                            <span className="text-slate-300 ml-2 normal-case">(Provide up to 3 options)</span>
                        </label>

                        {/* Date Option 1 */}
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="col-span-2">
                                <span className="text-xs font-bold text-emerald-600">Option 1</span>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    min={getMinDate()}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    value={formData.date1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date1: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    value={formData.time1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time1: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Date Option 2 */}
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="col-span-2">
                                <span className="text-xs font-bold text-blue-600">Option 2</span>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    min={getMinDate()}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.date2}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date2: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.time2}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time2: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Date Option 3 */}
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="col-span-2">
                                <span className="text-xs font-bold text-purple-600">Option 3</span>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    min={getMinDate()}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    value={formData.date3}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date3: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    value={formData.time3}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time3: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Additional Notes</label>
                        <textarea
                            rows={3}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all duration-200 shadow-sm resize-none"
                            placeholder="e.g. Specific product focus, parking info, expected duration..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    {/* Submit Section */}
                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                        >
                            {loading ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
