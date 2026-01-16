import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserShifts, getMyDispensaries } from '../services/firestoreService';
import { calculateReimbursement, calculateHourlyRate } from '../services/compensationService';
import { Loader, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WagesPayouts() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState([]);
    const [totalDue, setTotalDue] = useState(0);

    useEffect(() => {
        async function load() {
            if (!currentUser) return;
            try {
                // Fetch Shifts & Store Count for Rate
                const [allShifts, dispensaries] = await Promise.all([
                    getUserShifts(currentUser.uid),
                    getMyDispensaries(currentUser.uid)
                ]);

                // Calculate Rate dynamically based on ACTIVE store count
                const currentRate = calculateHourlyRate(dispensaries.length);

                // Filter: Pending Shifts
                const pendingShifts = allShifts.filter(s => s.status === 'pending');

                let sum = 0;
                const breakdown = pendingShifts.map(shift => {
                    const hours = parseFloat(shift.hoursWorked) || 0;
                    const wage = hours * currentRate;

                    const miles = parseFloat(shift.milesTraveled) || 0;
                    const tolls = parseFloat(shift.tollAmount) || 0;
                    const reimbursements = calculateReimbursement(miles, tolls, shift.hasVehicle);

                    const dailyTotal = wage + reimbursements;
                    sum += dailyTotal;

                    return {
                        id: shift.id,
                        date: shift.date ? (shift.date.toDate ? shift.date.toDate().toLocaleDateString() : new Date(shift.date).toLocaleDateString()) : 'N/A',
                        location: shift.dispensaryName || 'General Activation',
                        hours,
                        rate: currentRate,
                        wage,
                        reimbursements,
                        dailyTotal
                    };
                });

                setShifts(breakdown);
                setTotalDue(sum);
            } catch (e) {
                console.error("Failed to load wages", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentUser]);

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link to="/app" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Hourly & Reimbursements Log</h1>
                        <p className="text-slate-500">Current Unpaid Cycle</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto text-brand-500" />
                </div>
            ) : shifts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No unpaid shifts found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Location / Task</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Hours</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Rate</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Wage Earned</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Expenses</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Daily Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {shifts.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{item.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.location}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">{item.hours} hrs</td>
                                    <td className="px-6 py-4 text-right text-slate-500">${item.rate}/hr</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-700">${item.wage.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">${item.reimbursements.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-teal-600 font-mono">${item.dailyTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-right font-bold text-slate-700">Total Wages & Expenses Due</td>
                                <td className="px-6 py-4 text-right font-bold text-teal-600 text-lg font-mono">${totalDue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
