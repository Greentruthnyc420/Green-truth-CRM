import React, { useState, useEffect } from 'react';
import { getSales, markRepAsPaid, updateSaleStatus, getAllShifts } from '../../../services/firestoreService';
import { DollarSign, Users, Award, Download, Filter, Search, CheckCircle } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { convertToCSV, downloadCSV } from '../../../utils/csvHelper';

export default function AdminFinancials() {
    const [sales, setSales] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [stats, setStats] = useState({ totalRevenue: 0, pendingCommissions: 0, paidCommissions: 0 });

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        setLoading(true);
        try {
            const allSales = await getSales();
            setSales(allSales);

            // Calc Stats
            const totalRev = allSales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const pending = allSales.filter(s => s.status !== 'paid').reduce((acc, curr) => acc + (parseFloat(curr.commissionEarned) || ((parseFloat(curr.amount) || 0) * 0.02)), 0);
            const paid = allSales.filter(s => s.status === 'paid').reduce((acc, curr) => acc + (parseFloat(curr.commissionEarned) || ((parseFloat(curr.amount) || 0) * 0.02)), 0);

            setStats({
                totalRevenue: totalRev,
                pendingCommissions: pending,
                paidCommissions: paid
            });

        } catch (error) {
            console.error(error);
            showNotification("Failed to load financials", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    const handleMarkPaid = async (saleId) => {
        if (await updateSaleStatus(saleId, 'paid')) {
            showNotification("Commission marked as paid", "success");
            loadFinancials(); // reload
        } else {
            showNotification("Failed to update status", "error");
        }
    };

    const exportCSV = () => {
        const data = sales.map(s => ({
            Date: new Date(s.date).toLocaleDateString(),
            Dispensary: s.dispensaryName,
            Rep_ID: s.userId,
            Amount: s.amount,
            Commission: (parseFloat(s.amount) || 0) * 0.02,
            Status: s.status
        }));
        downloadCSV(convertToCSV(data), `commissions-export-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const safeDate = (date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date?.toDate ? date.toDate() : date).toLocaleDateString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financials</h1>
                    <p className="text-slate-500">Sales commissions and payout history.</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Sales Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><DollarSign size={64} className="text-orange-600" /></div>
                    <p className="text-orange-600 text-sm font-medium mb-1">Pending Commissions</p>
                    <h3 className="text-3xl font-bold text-orange-700">${stats.pendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><CheckCircle size={64} className="text-emerald-600" /></div>
                    <p className="text-emerald-600 text-sm font-medium mb-1">Paid Out</p>
                    <h3 className="text-3xl font-bold text-emerald-700">${stats.paidCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-bold text-slate-700">Commissions Ledger</h2>
                    <div className="flex gap-2">
                        {['all', 'pending', 'paid'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Dispensary</th>
                                <th className="px-6 py-3 text-right">Sale Amt</th>
                                <th className="px-6 py-3 text-right">Commission (2%)</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSales.map(sale => {
                                const commission = (parseFloat(sale.amount) || 0) * 0.02;
                                return (
                                    <tr key={sale.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 text-slate-600">{safeDate(sale.date)}</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">{sale.dispensaryName}</td>
                                        <td className="px-6 py-3 text-right font-mono">${parseFloat(sale.amount).toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-600 font-mono">${commission.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {sale.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {sale.status !== 'paid' && (
                                                <button
                                                    onClick={() => handleMarkPaid(sale.id)}
                                                    className="text-xs text-brand-600 hover:text-brand-800 font-medium underline"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
