import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSales } from '../services/firestoreService';
import { calculateRepCommission } from '../services/compensationService';
import { Loader, ArrowLeft, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CommissionPayouts() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState([]);
    const [totalDue, setTotalDue] = useState(0);

    useEffect(() => {
        async function load() {
            if (!currentUser) return;
            try {
                const allSales = await getSales();
                // Filter: Current User AND Unpaid
                const pendingSales = allSales.filter(s => s.userId === currentUser.uid && s.status !== 'paid');

                let sum = 0;
                const breakdown = pendingSales.map(sale => {
                    const revenue = parseFloat(sale.amount) || 0;
                    const comm = calculateRepCommission(revenue);
                    // Add bonus logic here if we track per-sale bonuses (like Spiffs)
                    // For now, bonus is 0 per lead unless specified
                    const bonus = 0;
                    const total = comm + bonus;
                    sum += total;

                    return {
                        id: sale.id,
                        date: sale.date ? (sale.date.toDate ? sale.date.toDate().toLocaleDateString() : new Date(sale.date).toLocaleDateString()) : 'N/A',
                        storeName: sale.dispensaryName,
                        type: sale.saleType || 'Standard', // 'New Customer', 'Re-order'
                        revenue,
                        rate: '2%',
                        baseComm: comm,
                        bonus,
                        totalEarned: total
                    };
                });

                setCommissions(breakdown);
                setTotalDue(sum);
            } catch (e) {
                console.error("Failed to load commissions", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentUser]);

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Commission Breakdown</h1>
                        <p className="text-slate-500">Current Unpaid Cycle</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto text-brand-500" />
                </div>
            ) : commissions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No unpaid commissions found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Store</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Revenue</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Rate</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {commissions.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{item.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.storeName}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-mono">${item.revenue.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{item.rate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono">+${item.totalEarned.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-right font-bold text-slate-700">Total Commissions Due</td>
                                <td className="px-6 py-4 text-right font-bold text-indigo-600 text-lg font-mono">${totalDue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
