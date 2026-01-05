import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Tag, Clock, Loader, AlertCircle } from 'lucide-react';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';
import { getAllUsers, addActivation, updateActivation, getAllShifts, getSales, getUserProfile } from '../services/firestoreService';
import { createManagerEvent } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';

export default function NewActivationModal({ isOpen, onClose, onSave, leads }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reps, setReps] = useState([]);
    const [formData, setFormData] = useState({
        brandId: '',
        storeName: '',
        address: '',
        date: '',
        startTime: '',
        endTime: '',
        repId: '',
        notes: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        if (isOpen) {
            fetchReps();
        }
    }, [isOpen]);

    const fetchReps = async () => {
        try {
            // 1. Fetch from Users collection
            const users = await getAllUsers();

            // 2. Fetch all unique IDs from Shifts and Sales to find active reps
            const [allShifts, allSales] = await Promise.all([
                getAllShifts(),
                getSales()
            ]);

            const activeIds = new Set([
                ...allShifts.map(s => s.userId),
                ...allSales.map(s => s.userId || s.repId)
            ]);

            // 3. Combine and filter
            const repsMap = new Map();

            // Add users from collection
            users.forEach(u => {
                const id = u.id || u.uid;
                repsMap.set(id, {
                    id: id,
                    name: (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` :
                        (u.profileInfo?.firstName && u.profileInfo?.lastName) ? `${u.profileInfo.firstName} ${u.profileInfo.lastName}` :
                            u.name || u.displayName || id,
                    email: u.email || u.profileInfo?.email || 'No Email'
                });
            });

            // Add missing active IDs
            for (const uid of activeIds) {
                if (uid && !repsMap.has(uid)) {
                    const profile = await getUserProfile(uid);
                    if (profile) {
                        repsMap.set(uid, {
                            id: uid,
                            name: (profile.firstName && profile.lastName) ? `${profile.firstName} ${profile.lastName}` :
                                (profile.profileInfo?.firstName && profile.profileInfo?.lastName) ? `${profile.profileInfo.firstName} ${profile.profileInfo.lastName}` :
                                    profile.name || profile.displayName || uid,
                            email: profile.email || profile.profileInfo?.email || 'No Email'
                        });
                    }
                }
            }

            // 4. Ensure current user (Admin) is in the list as they also do activations
            if (currentUser) {
                const id = currentUser.uid;
                if (!repsMap.has(id)) {
                    repsMap.set(id, {
                        id: id,
                        name: currentUser.displayName || 'Omar (Admin)',
                        email: currentUser.email
                    });
                }
            }

            setReps(Array.from(repsMap.values()));
        } catch (error) {
            console.error("Error fetching reps:", error);
        }
    };

    const handleLeadChange = (e) => {
        const lead = leads.find(l => l.dispensaryName === e.target.value);
        if (lead) {
            setFormData(prev => ({
                ...prev,
                storeName: lead.dispensaryName,
                address: lead.location?.address || lead.dispensaryName // Fallback to name if no address
            }));
        } else {
            setFormData(prev => ({ ...prev, storeName: e.target.value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Scheduling activation...' });

        try {
            // 1. Prepare data
            const selectedRep = reps.find(r => r.id === formData.repId);
            const repEmail = selectedRep?.email || selectedRep?.profileInfo?.email;

            if (!repEmail) {
                throw new Error("Selected representative does not have a valid email.");
            }

            const startISO = `${formData.date}T${formData.startTime}:00Z`;
            const endISO = `${formData.date}T${formData.endTime}:00Z`;

            const activationData = {
                ...formData,
                status: 'scheduled',
                brandName: BRAND_LICENSES[formData.brandId]?.brandName || formData.brandId,
                repName: selectedRep?.name || 'Unknown',
                scheduledBy: currentUser.uid,
                startISO,
                endISO
            };

            // 2. Save to Firebase
            const activationId = await addActivation(activationData);

            // 3. Create Google Calendar Event
            setStatus({ type: 'info', message: 'Sending Google Calendar invite...' });

            if (!currentUser.accessToken) {
                throw new Error("Google Calendar Access Token missing. Please Sign Out and Sign In again with Google.");
            }

            // Note: adminAccessToken is attached to currentuser in AuthContext.jsx
            const googleEventId = await createManagerEvent(
                {
                    storeName: formData.storeName,
                    address: formData.address,
                    notes: formData.notes
                },
                startISO,
                endISO,
                repEmail,
                currentUser.accessToken
            );

            // 4. Update Firebase with googleEventId
            await updateActivation(activationId, { googleEventId });

            setStatus({ type: 'success', message: `Activation Scheduled & Invite Sent to ${repEmail}` });

            setTimeout(() => {
                onSave();
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Failed to schedule activation:", error);
            setStatus({ type: 'error', message: error.message || 'Failed to schedule activation' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-brand-600" size={24} />
                        Schedule New Activation
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                        {status.type === 'error' ? <AlertCircle size={18} /> :
                            status.type === 'success' ? <Tag size={18} /> :
                                <Loader size={18} className="animate-spin" />}
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Brand & Store */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Brand</label>
                            <select
                                required
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                value={formData.brandId}
                                onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                            >
                                <option value="">Select Brand</option>
                                {Object.values(BRAND_LICENSES).map(brand => (
                                    <option key={brand.brandId} value={brand.brandId}>{brand.brandName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Store / Lead</label>
                            <select
                                required
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                value={formData.storeName}
                                onChange={handleLeadChange}
                            >
                                <option value="">Select Store</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.dispensaryName}>{lead.dispensaryName}</option>
                                ))}
                                <option value="other">--- Custom ---</option>
                            </select>
                        </div>
                    </div>

                    {/* Address (Auto-filled or manual) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                required
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                placeholder="123 High St, New York, NY"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Representative */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Sales Rep</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                value={formData.repId}
                                onChange={(e) => setFormData(prev => ({ ...prev, repId: e.target.value }))}
                            >
                                <option value="">Select Representative</option>
                                {reps.map(rep => (
                                    <option key={rep.id} value={rep.id}>
                                        {rep.name} ({rep.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input
                                required
                                type="date"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    required
                                    type="time"
                                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    required
                                    type="time"
                                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes for Rep</label>
                        <textarea
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
                            placeholder="Parking info, specific goals, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    {/* Footer / Submit */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-shadow shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader size={18} className="animate-spin" /> : <Calendar size={18} />}
                            Schedule & Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
