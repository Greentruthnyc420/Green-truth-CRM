import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Tag, Loader, AlertCircle, Sparkles } from 'lucide-react';
import { getLeads, addActivationRequest } from '../services/firestoreService';

export default function RequestActivationModal({ isOpen, onClose, brandUser }) {
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        storeName: '',
        date: '',
        time: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            // Reset status when opened
            setStatus({ type: '', message: '' });
        }
    }, [isOpen]);

    const fetchLeads = async () => {
        try {
            const data = await getLeads();
            // Sort alphabetically by dispensary name
            const sorted = data.sort((a, b) =>
                (a.dispensaryName || '').localeCompare(b.dispensaryName || '')
            );
            setLeads(sorted);
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Submitting request...' });

        try {
            const requestData = {
                brandId: brandUser.brandId,
                brandName: brandUser.brandName,
                ...formData,
                requestedDate: formData.date,
                requestedTime: formData.time
            };

            await addActivationRequest(requestData);

            setStatus({ type: 'success', message: 'Activation request submitted successfully!' });

            // Clean up and close after delay
            setTimeout(() => {
                onClose();
                setFormData({
                    storeName: '',
                    date: '',
                    time: '',
                    notes: ''
                });
            }, 2000);

        } catch (error) {
            console.error("Failed to submit request:", error);
            setStatus({ type: 'error', message: error.message || 'Failed to submit request' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Request Activation
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Schedule a brand pop-up event</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`mx-8 mt-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in slide-in-from-top-2 duration-300 ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                        {status.type === 'error' ? <AlertCircle size={20} /> :
                            status.type === 'success' ? <Tag size={20} /> :
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
                                onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                            >
                                <option value="">Select a Dispensary</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.dispensaryName}>
                                        {lead.dispensaryName}
                                    </option>
                                ))}
                                <option value="Other / New Location">--- Other / New Location ---</option>
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Requested Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all duration-200 shadow-sm"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Preferred Time</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="time"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all duration-200 shadow-sm"
                                    value={formData.time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
                            placeholder="e.g. Specific product focus, parking info, or specific time range..."
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
