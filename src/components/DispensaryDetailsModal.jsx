import React from 'react';
import {
    X, MapPin, Phone, Mail, User, Building2, Calendar,
    FileText, CheckCircle, AlertTriangle, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DispensaryDetailsModal({ isOpen, onClose, dispensary, onEdit, isAdmin }) {
    if (!isOpen || !dispensary) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Sold': return 'bg-emerald-100 text-emerald-700';
            case 'Lost': return 'bg-red-50 text-red-700';
            default: return 'bg-blue-50 text-blue-700';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {dispensary.dispensaryName || 'Dispensary Details'}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(dispensary.status)}`}>
                                    {dispensary.status === 'Sold' && <CheckCircle size={12} />}
                                    {dispensary.status || 'New Lead'}
                                </span>
                            </div>
                            <p className="text-slate-500 flex items-center gap-2 text-sm">
                                <User size={14} />
                                Representative: <span className="font-semibold text-slate-700">{dispensary.repAssigned || 'Unassigned'}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto space-y-8">

                        {/* Location & Contact Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} /> Location
                                </h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="font-medium text-slate-800">{dispensary.address || 'No address provided'}</p>
                                    <p className="text-slate-500">
                                        {[dispensary.city, dispensary.state, dispensary.zip].filter(Boolean).join(', ')}
                                    </p>
                                    {dispensary.address && (
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(dispensary.address + ' ' + (dispensary.city || ''))}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block mt-3 text-sm text-brand-600 font-bold hover:underline"
                                        >
                                            View on Maps →
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Phone size={14} /> Contact Info
                                </h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User size={16} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Primary Contact</p>
                                            <p className="text-slate-700 font-medium">{dispensary.contactPerson || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone size={16} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Phone</p>
                                            <p className="text-slate-700 font-medium">{dispensary.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail size={16} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Email</p>
                                            <p className="text-slate-700 font-medium text-sm break-all">{dispensary.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} /> License & Business Details
                            </h3>
                            <div className="p-4 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">License Type</p>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-bold">
                                        {dispensary.licenseType || 'Adult Use Retail'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">License Number</p>
                                    <p className="font-mono text-sm text-slate-600">{dispensary.licenseNumber || 'PENDING'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">Created Date</p>
                                    <p className="text-sm text-slate-600">
                                        {dispensary.createdAt?.toDate ? dispensary.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} /> Notes
                            </h3>
                            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-slate-700 text-sm whitespace-pre-wrap min-h-[80px]">
                                {dispensary.notes || "No notes available for this account."}
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    {(isAdmin && onEdit) && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(dispensary);
                                }}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Edit2 size={16} /> Edit Details
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
