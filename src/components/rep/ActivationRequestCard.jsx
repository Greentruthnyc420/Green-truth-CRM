import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle, Loader, Tag } from 'lucide-react';
import { acceptActivationRequest, declineActivationRequest, markRequestAsScheduled } from '../../services/activationRequestService';
import { addActivation } from '../../services/firestoreService';

/**
 * Card component for reps to respond to incoming activation requests
 * Shows 3 date options + "I'm Unavailable" button
 */
export default function ActivationRequestCard({ request, userId, onResponded }) {
    const [loading, setLoading] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Format time for display
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    // Build date options array
    const dateOptions = [
        { date: request.dateOption1, time: request.timeOption1, label: 'Option 1', color: 'emerald' },
        { date: request.dateOption2, time: request.timeOption2, label: 'Option 2', color: 'blue' },
        { date: request.dateOption3, time: request.timeOption3, label: 'Option 3', color: 'purple' }
    ].filter(opt => opt.date);

    // Calculate time remaining before expiry
    const getTimeRemaining = () => {
        if (!request.expiresAt) return null;
        const now = new Date();
        const expiry = new Date(request.expiresAt);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    };

    // Handle accepting a date option
    const handleAccept = async (option) => {
        setLoading(true);
        setSelectedOption(option);

        try {
            // 1. Accept the request
            await acceptActivationRequest(request.id, option.date, option.time);

            // 2. Create the actual activation
            const activationData = {
                brandId: request.brandId,
                dispensaryId: request.dispensaryId,
                dateOfActivation: option.date,
                repId: userId,
                activationType: 'pop-up',
                status: 'Scheduled',
                startTime: option.time,
                notes: request.notes || '',
                requestedBy: request.requestedBy
            };

            const activation = await addActivation(activationData);

            // 3. Mark request as scheduled
            await markRequestAsScheduled(request.id, activation.id);

            // Notify parent to refresh
            if (onResponded) onResponded('accepted');

        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Failed to accept request. Please try again.');
        } finally {
            setLoading(false);
            setSelectedOption(null);
        }
    };

    // Handle declining the request
    const handleDecline = async () => {
        if (!declineReason.trim()) {
            alert('Please provide a reason for declining');
            return;
        }

        setLoading(true);

        try {
            await declineActivationRequest(request.id, declineReason);
            setShowDeclineModal(false);
            if (onResponded) onResponded('declined');
        } catch (error) {
            console.error('Error declining request:', error);
            alert('Failed to decline request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const timeRemaining = getTimeRemaining();

    return (
        <>
            <div className="themed-card rounded-2xl overflow-hidden border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                {/* Header */}
                <div className="px-5 py-4 bg-amber-100/50 border-b border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-200 rounded-xl">
                            <Calendar size={18} className="text-amber-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Activation Request</h3>
                            <p className="text-xs text-amber-700">from {request.brandName || 'Brand Partner'}</p>
                        </div>
                    </div>
                    {timeRemaining && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${timeRemaining === 'Expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-200 text-amber-800'
                            }`}>
                            {timeRemaining}
                        </span>
                    )}
                </div>

                {/* Store Info */}
                <div className="px-5 py-4 border-b border-amber-100">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-amber-600" />
                        <span className="font-semibold text-slate-800">{request.dispensaryName}</span>
                    </div>
                    {request.notes && (
                        <p className="mt-2 text-sm text-slate-600 bg-white/50 p-3 rounded-xl">
                            "{request.notes}"
                        </p>
                    )}
                </div>

                {/* Date Options */}
                <div className="p-5 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Select a Date & Time
                    </p>

                    {dateOptions.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAccept(option)}
                            disabled={loading}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                ${loading && selectedOption === option
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : `border-${option.color}-200 hover:border-${option.color}-400 hover:bg-${option.color}-50`
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            style={{
                                borderColor: loading && selectedOption === option ? '#10b981' : undefined
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${option.color}-100 group-hover:bg-${option.color}-200 transition-colors`}
                                    style={{ backgroundColor: option.color === 'emerald' ? '#d1fae5' : option.color === 'blue' ? '#dbeafe' : '#f3e8ff' }}>
                                    <Calendar size={16} style={{ color: option.color === 'emerald' ? '#059669' : option.color === 'blue' ? '#2563eb' : '#9333ea' }} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">{formatDate(option.date)}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatTime(option.time) || 'Time TBD'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {loading && selectedOption === option ? (
                                    <Loader size={20} className="animate-spin text-emerald-600" />
                                ) : (
                                    <Check size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Unavailable Button */}
                <div className="px-5 pb-5">
                    <button
                        onClick={() => setShowDeclineModal(true)}
                        disabled={loading}
                        className="w-full p-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <X size={18} />
                        I'm Unavailable
                    </button>
                </div>
            </div>

            {/* Decline Reason Modal */}
            {showDeclineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Reason for Unavailability</h3>
                                <p className="text-sm text-slate-500">This will be sent to admin</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <textarea
                                rows={3}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm resize-none"
                                placeholder="e.g. Already scheduled at another location, personal conflict..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                            />

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => setShowDeclineModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDecline}
                                    disabled={loading || !declineReason.trim()}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader size={18} className="animate-spin" />
                                    ) : (
                                        <X size={18} />
                                    )}
                                    Decline Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
