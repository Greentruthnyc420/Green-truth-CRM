import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Building2, User, Clock, Check } from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { useBrandAuth } from '../contexts/BrandAuthContext';
import { getLeads, addActivation, getAllBrandProfiles } from '../services/firestoreService';
import { useNotification } from '../contexts/NotificationContext';
import { calculateAgencyShiftCost } from '../utils/pricing';

const CostEstimator = ({ start, end, region, type, milesTraveled = 0, tollAmount = 0 }) => {
    if (!start || !end || type === 'Sample Drop') return null;

    // Calculate duration
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diffHours = (endDate - startDate) / 1000 / 60 / 60;

    if (diffHours <= 0) return null;

    const cost = calculateAgencyShiftCost({
        region,
        hoursWorked: diffHours,
        milesTraveled: parseFloat(milesTraveled) || 0,
        tollAmount: parseFloat(tollAmount) || 0
    });

    return (
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">Estimated Cost ({diffHours}h):</span>
            <span className="text-lg font-bold text-emerald-700">${cost.toFixed(2)}</span>
        </div>
    );
};

export default function ActivationFormModal({ isOpen, onClose, onSuccess, initialData = {} }) {
    const { currentUser } = useAuth(); // Admin or Rep
    const { brandUser } = useBrandAuth(); // Brand
    const { showNotification } = useNotification();

    // Determine User Role
    const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

    const isBrandOrProcessor = !!brandUser;
    const isProcessor = brandUser?.isProcessor || false;

    // Determine if explicit role passed (e.g. 'dispensary') or infer
    const isDispensary = initialData.userRole === 'dispensary';

    // Rep is anyone logged in who isn't an admin, brand, or dispensary
    const isRep = !isAdmin && !isBrandOrProcessor && !isDispensary && currentUser;
    // Helper for "Just a Brand" (not a processor, so restricted view)
    const isBrand = (isBrandOrProcessor && !isProcessor) || initialData.userRole === 'brand'; // fallback

    const [loading, setLoading] = useState(false);
    const [dispensaries, setDispensaries] = useState([]);
    const [brands, setBrands] = useState([]);

    const [formData, setFormData] = useState({
        brandId: initialData.brandId || (isBrand ? brandUser?.brandId : ''),
        dispensaryId: initialData.dispensaryId || '', // Dispensary might pass this in initialData

        // Single Date (for Admins/Reps scheduling directly)
        dateOfActivation: initialData.dateOfActivation || '',
        dateEndOfActivation: initialData.dateEndOfActivation || '', // End date, defaults to same as start

        // Multiple Options (for Requests)
        dateOption1: '',
        dateOption2: '',
        dateOption3: '',

        timeStart: initialData.timeStart || '12:00',
        timeEnd: initialData.timeEnd || '16:00',
        activationType: initialData.activationType || 'Activation',
        repId: initialData.repId || (currentUser?.uid || ''),
        notes: initialData.notes || '',

        // Pricing fields
        region: initialData.region || 'NYC',
        milesTraveled: initialData.milesTraveled || '',
        tollAmount: initialData.tollAmount || ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            // 1. Fetch Dispensaries
            const leads = await getLeads();
            let availableDispensaries = leads.filter(l => l.dispensaryName || l.companyName);

            if (isRep) {
                availableDispensaries = availableDispensaries.filter(d => d.repId === currentUser.uid || d.assignedTo === currentUser.uid);
            } else if (isDispensary) {
                // If dispensary, mostly irrelevant regarding *selection* (it's them), but good to have list or just set ID.
                // Usually dispensaryId is passed in initialData.
            }
            setDispensaries(availableDispensaries);

            // 2. Fetch Brands
            const brandProfiles = await getAllBrandProfiles();

            let availableBrands = [];
            if (isAdmin) {
                availableBrands = brandProfiles;
            } else if (isProcessor) {
                const managedBrands = brandUser.allowedBrands || [];
                const allowedIds = managedBrands.map(b => b.brandId);
                if (brandUser.brandId && !allowedIds.includes(brandUser.brandId)) {
                    allowedIds.push(brandUser.brandId);
                }
                availableBrands = brandProfiles.filter(b => allowedIds.includes(b.brandId || b.id));
            } else if (isBrandOrProcessor && !isProcessor) {
                availableBrands = brandProfiles.filter(b => b.brandId === brandUser.brandId || b.id === brandUser.brandId);
            } else if (isRep || isDispensary) {
                // Reps AND Dispensaries can request for any brand (Dispensaries select who they want)
                availableBrands = brandProfiles;
            }

            setBrands(availableBrands);

            // Auto-select brand if only one available
            if (availableBrands.length === 1 && !formData.brandId) {
                setFormData(prev => ({ ...prev, brandId: availableBrands[0].brandId || availableBrands[0].id }));
            }
        } catch (err) {
            console.error("Failed to load form data", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.brandId) {
            showNotification('Please select a brand', 'error');
            return;
        }

        // If Admin/Rep/Direct: Need Date. If Request: Need at least Option 1.
        const isRequest = isBrand || isDispensary;

        if (!isRequest && !formData.dateOfActivation) {
            showNotification('Please select a date', 'error');
            return;
        }

        if (isRequest && !formData.dateOption1) {
            showNotification('Please provide at least a 1st preference date', 'error');
            return;
        }

        if (!formData.dispensaryId && !isDispensary) { // Dispensary ID might be inferred if isDispensary
            showNotification('Please select a dispensary', 'error');
            return;
        }

        setLoading(true);
        try {
            const submissionData = {
                ...formData,
                notes: `${formData.notes}\nTime: ${formData.timeStart} - ${formData.timeEnd}`,
                repId: formData.repId || (isRep ? currentUser?.uid : null),
                status: isRequest ? 'Requested' : 'Scheduled', // Auto-request if Brand/Dispensary
                createdAt: new Date().toISOString(),
                // Include preferences in payload
                datePreferences: isRequest ? [
                    formData.dateOption1,
                    formData.dateOption2,
                    formData.dateOption3
                ].filter(Boolean) : null,
                // If it's a request, primary 'date' might be tentatively the 1st option or null
                date: isRequest ? formData.dateOption1 : formData.dateOfActivation,
                // Pricing data for proper cost calculation
                region: formData.region || 'NYC',
                milesTraveled: parseFloat(formData.milesTraveled) || 0,
                tollAmount: parseFloat(formData.tollAmount) || 0,
                // Calculate duration from time inputs
                duration: (() => {
                    const [startH, startM] = formData.timeStart.split(':').map(Number);
                    const [endH, endM] = formData.timeEnd.split(':').map(Number);
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;
                    return Math.max(2, Math.round((endMinutes - startMinutes) / 60));
                })(),
                // Add requester info if helpful
                requestedBy: isDispensary ? 'Dispensary' : (isBrand ? 'Brand' : 'Admin/Rep')
            };

            await addActivation(submissionData);
            showNotification(isRequest ? 'Activation Requested Successfully!' : 'Activation Scheduled Successfully!', 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Scheduling failed", error);
            showNotification('Failed to schedule activation', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [adminRequestMode, setAdminRequestMode] = useState(false);

    if (!isOpen) return null;

    // Check if we are in "Request Mode" (Brand or Processor or Dispensary OR Admin Context)
    const isRequestMode = isBrand || isProcessor || isDispensary || adminRequestMode;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-emerald-600" />
                            {isRequestMode ? 'Request Activation' : 'Schedule Activation'}
                        </h2>
                        {isAdmin && (
                            <label className="flex items-center gap-2 mt-2 text-xs text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={adminRequestMode}
                                    onChange={(e) => setAdminRequestMode(e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Log as Request (3 Dates)
                            </label>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Brand Selection: Visible for Admin/Rep/Dispensary/Processor */}
                    {(isAdmin || !isBrand || isProcessor) && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Brand</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none bg-white"
                                    value={formData.brandId}
                                    onChange={e => setFormData({ ...formData, brandId: e.target.value })}
                                    disabled={brands.length === 1 && !isAdmin && !isProcessor && !isRep && !isDispensary}
                                >
                                    <option value="">Select Brand</option>
                                    {brands.map(b => (
                                        <option key={b.brandId || b.id} value={b.brandId || b.id}>{b.brandName || b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Dispensary Selection: Hidden if Dispensary User (already them) */}
                    {!isDispensary && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Dispensary</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none bg-white"
                                    value={formData.dispensaryId}
                                    onChange={e => setFormData({ ...formData, dispensaryId: e.target.value })}
                                >
                                    <option value="">Select Dispensary</option>
                                    {dispensaries.map(d => (
                                        <option key={d.id} value={d.id}>{d.dispensaryName || d.companyName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Logic for Dates: Single for Admin/Rep, 3 Options for Request Mode */}
                    {isRequestMode ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-sm font-bold text-slate-700">Preferred Dates</label>
                            <p className="text-xs text-slate-500 mb-2">Please provide up to 3 options.</p>

                            <div className="grid grid-cols-1 gap-2">
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="1st Choice"
                                    value={formData.dateOption1}
                                    onChange={e => setFormData({ ...formData, dateOption1: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="2nd Choice"
                                    value={formData.dateOption2}
                                    onChange={e => setFormData({ ...formData, dateOption2: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="3rd Choice"
                                    value={formData.dateOption3}
                                    onChange={e => setFormData({ ...formData, dateOption3: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                                    value={formData.dateOfActivation}
                                    onChange={e => {
                                        const newDate = e.target.value;
                                        setFormData({
                                            ...formData,
                                            dateOfActivation: newDate,
                                            // Auto-fill end date to same as start date
                                            dateEndOfActivation: formData.dateEndOfActivation || newDate
                                        });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                                    value={formData.dateEndOfActivation}
                                    onChange={e => setFormData({ ...formData, dateEndOfActivation: e.target.value })}
                                    min={formData.dateOfActivation}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none bg-white"
                                    value={formData.activationType}
                                    onChange={e => setFormData({ ...formData, activationType: e.target.value })}
                                >
                                    <option value="Activation">Activation</option>
                                    <option value="Sample Drop">Sample Drop</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Cost Estimation */}
                    {!isRep && formData.timeStart && formData.timeEnd && (
                        <CostEstimator
                            start={formData.timeStart}
                            end={formData.timeEnd}
                            region={formData.region || 'NYC'}
                            type={formData.activationType}
                            milesTraveled={formData.milesTraveled}
                            tollAmount={formData.tollAmount}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    className="w-full pl-9 p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                                    value={formData.timeStart}
                                    onChange={e => setFormData({ ...formData, timeStart: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    className="w-full pl-9 p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                                    value={formData.timeEnd}
                                    onChange={e => setFormData({ ...formData, timeEnd: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Region, Mileage, Tolls */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Region</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none bg-white text-sm"
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                            >
                                <option value="NYC">NYC</option>
                                <option value="LI">Long Island / Downstate</option>
                                <option value="UPSTATE">Upstate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Mileage</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-sm"
                                placeholder="Miles"
                                min="0"
                                value={formData.milesTraveled}
                                onChange={e => setFormData({ ...formData, milesTraveled: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tolls ($)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-sm"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={formData.tollAmount}
                                onChange={e => setFormData({ ...formData, tollAmount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none resize-none h-24"
                            placeholder="Details about the activation..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Scheduling...' : (
                                <>
                                    <Check size={18} />
                                    {isRequestMode ? 'Submit Request' : 'Schedule'}
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
