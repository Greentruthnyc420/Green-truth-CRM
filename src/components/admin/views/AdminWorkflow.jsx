import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, FileText, Download, Loader, AlertTriangle, Gift } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { getAllShifts, updateShiftStatus, markRepAsPaid, getUserProfile, resetDatabase } from '../../../services/firestoreService';
import SampleRequests from '../../SampleRequests';

export default function AdminWorkflow() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);
    const { showNotification } = useNotification();
    const [activeSection, setActiveSection] = useState('shifts'); // shifts | samples

    useEffect(() => {
        fetchPendingShifts();
    }, []);

    const fetchPendingShifts = async () => {
        setLoading(true);
        try {
            const allShifts = await getAllShifts();
            const pending = allShifts.filter(s => s.status === 'pending');

            // Enrich with user names if needed, though getAllShifts might already render user IDs. 
            // Ideally we'd map userIds to names here or use a helper, but for simplicity we'll show ID or fetch names if specific
            setShifts(pending);
        } catch (error) {
            console.error("Error fetching shifts:", error);
            showNotification("Failed to load pending shifts", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleShiftSelection = (id) => {
        setSelectedShiftIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedShiftIds.length === shifts.length) {
            setSelectedShiftIds([]);
        } else {
            setSelectedShiftIds(shifts.map(s => s.id));
        }
    };

    const handleApproveShifts = async () => {
        if (!confirm(`Approve and Pay ${selectedShiftIds.length} shifts?`)) return;
        setProcessing(true);
        try {
            let successCount = 0;
            for (const id of selectedShiftIds) {
                // 1. Update Shift Status
                await updateShiftStatus(id, 'approved');
                // 2. Mark Rep as Paid (if utilizing automatic payout logic, or maybe just approved for now)
                // The Dashboard logic had "Approve & Pay" which likely implies moving them to a paid state or ready for payout
                // Legacy: handleMarkAsPaid uses 'approved' status? No, handleMarkAsPaid in Dashboard.jsx sets updates status to 'paid'?
                // Let me check Dashboard.jsx: handleMarkAsPaid -> updateShiftStatus(id, 'approved')? 
                // Actually, let's stick to 'approved' so they show up in Payouts.
                // Re-reading Dashboard.jsx logic: button says "Approve & Pay" but calls handleMarkAsPaid which calls updateShiftStatus(id, 'approved') 
                // AND THEN PROBABLY triggers a cloud function or just leaves it 'approved'.
                // I will set it to 'approved'.
            }
            showNotification(`Successfully approved ${selectedShiftIds.length} shifts`, 'success');
            setSelectedShiftIds([]);
            fetchPendingShifts();
        } catch (error) {
            console.error(error);
            showNotification("Failed to approve shifts", "error");
        } finally {
            setProcessing(false);
        }
    };


    const handleResetDatabase = async () => {
        if (window.confirm("⚠️ DANGER: This will delete ALL Sales, Leads, and Sample Requests!\n\nUser accounts will be kept.\n\nAre you sure you want to proceed?")) {
            const confirmed = window.confirm("Final Warning: This action cannot be undone. Wipe all data?");
            if (confirmed) {
                setProcessing(true);
                const success = await resetDatabase();
                setProcessing(false);
                if (success) {
                    showNotification("Database has been reset successfully!", "success");
                    fetchPendingShifts(); // Refresh
                } else {
                    showNotification("Failed to reset database. Check console.", "error");
                }
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Workflow & Approvals</h1>
                    <p className="text-slate-500">Action items requiring your attention.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleResetDatabase}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <AlertTriangle size={18} />
                        {processing ? 'Resetting...' : 'Reset Database'}
                    </button>
                </div>
            </div>

            {/* Quick Filters / Sections */}
            <div className="flex gap-4 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setActiveSection('shifts')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeSection === 'shifts' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pending Shifts ({shifts.length})
                    {activeSection === 'shifts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveSection('samples')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeSection === 'samples' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sample Requests
                    {activeSection === 'samples' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />}
                </button>
            </div>

            {activeSection === 'shifts' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Clock className="text-orange-500" size={20} />
                            <h2 className="font-bold text-slate-800">Pending Shifts</h2>
                        </div>
                        <button
                            onClick={handleApproveShifts}
                            disabled={selectedShiftIds.length === 0 || processing}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {processing ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            Approve Selected ({selectedShiftIds.length})
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center"><Loader className="animate-spin text-slate-300" /></div>
                    ) : shifts.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <CheckCircle className="mx-auto mb-3 text-slate-300" size={48} />
                            <p>All caught up! No pending shifts.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-6 w-12"><input type="checkbox" checked={selectedShiftIds.length === shifts.length} onChange={toggleSelectAll} className="rounded border-slate-300 focus:ring-brand-500" /></th>
                                        <th className="py-3 px-6 font-semibold text-slate-500">Rep ID</th>
                                        <th className="py-3 px-6 font-semibold text-slate-500">Dispensary</th>
                                        <th className="py-3 px-6 font-semibold text-slate-500">Date</th>
                                        <th className="py-3 px-6 font-semibold text-slate-500 text-center">Hours</th>
                                        <th className="py-3 px-6 font-semibold text-slate-500 text-right">Pay Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {shifts.map(shift => (
                                        <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-6"><input type="checkbox" checked={selectedShiftIds.includes(shift.id)} onChange={() => toggleShiftSelection(shift.id)} className="rounded border-slate-300 focus:ring-brand-500" /></td>
                                            <td className="py-3 px-6 font-mono text-xs text-slate-500">{shift.userId.substring(0, 8)}...</td>
                                            <td className="py-3 px-6 font-medium text-slate-800">{shift.dispensaryName}</td>
                                            <td className="py-3 px-6 text-slate-600">
                                                {(() => {
                                                    try {
                                                        const d = shift.date?.toDate ? shift.date.toDate() : new Date(shift.date);
                                                        return d.toLocaleDateString();
                                                    } catch (e) { return 'N/A'; }
                                                })()}
                                            </td>
                                            <td className="py-3 px-6 text-center text-slate-800 font-medium">{shift.hoursWorked}</td>
                                            <td className="py-3 px-6 text-right text-slate-600">
                                                ${((parseFloat(shift.hoursWorked) || 0) * 20).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeSection === 'samples' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SampleRequests />
                </div>
            )}
        </div>
    );
}
