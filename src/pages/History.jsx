import React, { useEffect, useState } from 'react';
import { getUserShifts } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, DollarSign, CheckCircle } from 'lucide-react';

export default function History() {
    const { currentUser } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            if (currentUser) {
                try {
                    const data = await getUserShifts(currentUser.uid);
                    setShifts(data.sort((a, b) => b.date - a.date)); // Sort newest first
                } catch (error) {
                    console.error("Failed to fetch shifts", error);
                }
            } else {
                // Mock data for demo
                setShifts([
                    { id: 1, date: new Date(), hoursWorked: 8.5, milesTraveled: 124, status: 'pending', tollAmount: 15.50 },
                    { id: 2, date: new Date(Date.now() - 86400000), hoursWorked: 6, milesTraveled: 45, status: 'paid', tollAmount: 0 },
                    { id: 3, date: new Date(Date.now() - 172800000), hoursWorked: 9, milesTraveled: 80, status: 'paid', tollAmount: 5.00 },
                ]);
            }
            setLoading(false);
        }

        fetchHistory();
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Shift History</h1>
                    <p className="text-slate-500">Track your past work and payments.</p>
                </div>
            </div>

            <div className="space-y-4">
                {shifts.map((shift) => (
                    <div key={shift.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

                        <div className="flex items-start gap-4">
                            <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                ${shift.status === 'paid' ? 'bg-brand-100 text-brand-600' : 'bg-amber-100 text-amber-600'}
              `}>
                                {shift.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-800">
                                        {shift.date instanceof Date ? shift.date.toLocaleDateString() : 'Unknown Date'}
                                    </h3>
                                    <span className={`
                    text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full
                    ${shift.status === 'paid' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}
                  `}>
                                        {shift.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {shift.hoursWorked} hrs
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {shift.milesTraveled} mi
                                    </span>
                                    {shift.tollAmount > 0 && (
                                        <span className="flex items-center gap-1">
                                            <DollarSign size={14} />
                                            ${shift.tollAmount} Tolls
                                        </span>
                                    )}
                                    {shift.tollReceiptImageUrl && (
                                        <a href={shift.tollReceiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">
                                            View Receipt
                                        </a>
                                    )}
                                    {shift.odometerImageUrl && (
                                        <a href={shift.odometerImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">
                                            View Odometer
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                            <span className="text-right">
                                <span className="block text-xs text-slate-400">Total Earned</span>
                                <span className="block font-bold text-slate-800 text-lg">
                                    {/* Mock calculation: $20/hr + $0.50/mi + tolls */}
                                    ${((shift.hoursWorked * 20) + (shift.milesTraveled * 0.50) + (shift.tollAmount || 0)).toFixed(2)}
                                </span>
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
