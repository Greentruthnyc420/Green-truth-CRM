import React, { useState, useEffect } from 'react';
import { getSales, markRepAsPaid, updateSaleStatus, getAllShifts, getAllActivations } from '../../../services/firestoreService';
import { DollarSign, Users, Award, Download, Filter, Search, CheckCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { convertToCSV, downloadCSV } from '../../../utils/csvHelper';
import { calculateAgencyShiftCost } from '../../../utils/pricing';

export default function AdminFinancials() {
    const [sales, setSales] = useState([]);
    const [activations, setActivations] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [activationFilter, setActivationFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [stats, setStats] = useState({ totalRevenue: 0, companyCommission: 0, pendingRepCommissions: 0, paidRepCommissions: 0 });
    const [activationStats, setActivationStats] = useState({ total: 0, totalFees: 0, pendingFees: 0, completedFees: 0 });

    // Ledger collapse state
    const [commissionsOpen, setCommissionsOpen] = useState(true);
    const [activationsOpen, setActivationsOpen] = useState(true);

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        setLoading(true);
        try {
            const [allSales, allActivations] = await Promise.all([
                getSales(),
                getAllActivations()
            ]);
            setSales(allSales);
            setActivations(allActivations);

            // Calc Commission Stats
            // Total commission earned from sales is 5% of sales revenue
            const totalSalesAmount = allSales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const totalCommission = totalSalesAmount * 0.05; // 5% total commission
            const repCommission = totalSalesAmount * 0.02;   // 2% to reps
            const netProfit = totalSalesAmount * 0.03;       // 3% kept by company (5% - 2%)
            const pendingRep = allSales.filter(s => s.status !== 'paid').reduce((acc, curr) => acc + (parseFloat(curr.commissionEarned) || ((parseFloat(curr.amount) || 0) * 0.02)), 0);
            const paidRep = allSales.filter(s => s.status === 'paid').reduce((acc, curr) => acc + (parseFloat(curr.commissionEarned) || ((parseFloat(curr.amount) || 0) * 0.02)), 0);

            setStats({
                totalRevenue: totalCommission, // This is our 5% commission from sales
                netProfit: netProfit,          // 3% after paying reps
                pendingRepCommissions: pendingRep,
                paidRepCommissions: paidRep
            });

            // Calc Activation Stats - use real pricing from pricing.js
            const getActivationFee = (a) => {
                const storedFee = parseFloat(a.activationFee) || parseFloat(a.activation_fee) || 0;
                if (storedFee > 0) return storedFee;
                // Use the real pricing calculation
                return calculateAgencyShiftCost({
                    hoursWorked: a.hoursWorked || a.total_hours || 0,
                    region: a.region || 'NYC',
                    milesTraveled: a.milesTraveled || a.miles_traveled || 0,
                    tollAmount: a.tollAmount || a.toll_amount || 0
                });
            };
            const totalActivations = allActivations.length;
            const totalFees = allActivations.reduce((acc, a) => acc + getActivationFee(a), 0);
            const pendingFees = allActivations.filter(a => a.status !== 'paid' && a.status !== 'completed').reduce((acc, a) => acc + getActivationFee(a), 0);
            const completedFees = allActivations.filter(a => a.status === 'paid' || a.status === 'completed').reduce((acc, a) => acc + getActivationFee(a), 0);

            setActivationStats({
                total: totalActivations,
                totalFees,
                pendingFees,
                completedFees
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

            {/* Commission Stats Cards */}
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mt-4">
                <DollarSign size={20} className="text-indigo-600" /> Sales Commissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Gross Commission (5%)</p>
                    <h3 className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><DollarSign size={64} className="text-indigo-600" /></div>
                    <p className="text-indigo-600 text-sm font-medium mb-1">Net Profit (3%)</p>
                    <h3 className="text-3xl font-bold text-indigo-700">${(stats.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><DollarSign size={64} className="text-orange-600" /></div>
                    <p className="text-orange-600 text-sm font-medium mb-1">Pending Rep Payout (2%)</p>
                    <h3 className="text-3xl font-bold text-orange-700">${stats.pendingRepCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><CheckCircle size={64} className="text-emerald-600" /></div>
                    <p className="text-emerald-600 text-sm font-medium mb-1">Paid to Reps (2%)</p>
                    <h3 className="text-3xl font-bold text-emerald-700">${stats.paidRepCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Commissions Ledger - Collapsible */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button
                    onClick={() => setCommissionsOpen(!commissionsOpen)}
                    className="w-full p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 hover:bg-slate-100 transition-colors"
                >
                    <h2 className="font-bold text-slate-700">Commissions Ledger</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {['all', 'pending', 'paid'].map(f => (
                                <button
                                    key={f}
                                    onClick={(e) => { e.stopPropagation(); setFilter(f); }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {commissionsOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </button>

                {commissionsOpen && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Dispensary</th>
                                    <th className="px-6 py-3 text-right">Sale Amt</th>
                                    <th className="px-6 py-3 text-right">Rep Commission (2%)</th>
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
                )}
            </div>

            {/* Activation Stats Cards */}
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mt-8">
                <Calendar size={20} className="text-purple-600" /> Activations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Activations</p>
                    <h3 className="text-3xl font-bold text-slate-900">{activationStats.total}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><Calendar size={64} className="text-purple-600" /></div>
                    <p className="text-purple-600 text-sm font-medium mb-1">Total Fees Owed</p>
                    <h3 className="text-3xl font-bold text-purple-700">${activationStats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><Calendar size={64} className="text-amber-600" /></div>
                    <p className="text-amber-600 text-sm font-medium mb-1">Pending Activation Fees</p>
                    <h3 className="text-3xl font-bold text-amber-700">${activationStats.pendingFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><CheckCircle size={64} className="text-teal-600" /></div>
                    <p className="text-teal-600 text-sm font-medium mb-1">Completed/Paid</p>
                    <h3 className="text-3xl font-bold text-teal-700">${activationStats.completedFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Activations Ledger - Collapsible */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button
                    onClick={() => setActivationsOpen(!activationsOpen)}
                    className="w-full p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 hover:bg-slate-100 transition-colors"
                >
                    <h2 className="font-bold text-slate-700">Activations Ledger</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {['all', 'pending', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={(e) => { e.stopPropagation(); setActivationFilter(f); }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${activationFilter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {activationsOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </button>

                {activationsOpen && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Dispensary</th>
                                    <th className="px-6 py-3">Brand</th>
                                    <th className="px-6 py-3 text-right">Activation Fee</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activations
                                    .filter(a => {
                                        if (activationFilter === 'all') return true;
                                        if (activationFilter === 'completed') return a.status === 'completed' || a.status === 'paid';
                                        return a.status === activationFilter;
                                    })
                                    .map(activation => (
                                        <tr key={activation.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-600">{safeDate(activation.date || activation.activation_date)}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{activation.dispensaryName || activation.dispensary_name || 'N/A'}</td>
                                            <td className="px-6 py-3 text-slate-600">{activation.brandName || activation.brand_name || activation.brand || 'N/A'}</td>
                                            <td className="px-6 py-3 text-right font-bold text-purple-600 font-mono">
                                                ${(() => {
                                                    const storedFee = parseFloat(activation.activationFee) || parseFloat(activation.activation_fee) || 0;
                                                    if (storedFee > 0) return storedFee.toFixed(2);
                                                    return calculateAgencyShiftCost({
                                                        hoursWorked: activation.hoursWorked || activation.total_hours || 0,
                                                        region: activation.region || 'NYC',
                                                        milesTraveled: activation.milesTraveled || activation.miles_traveled || 0,
                                                        tollAmount: activation.tollAmount || activation.toll_amount || 0
                                                    }).toFixed(2);
                                                })()}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${activation.status === 'completed' || activation.status === 'paid'
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {activation.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                {activations.filter(a => {
                                    if (activationFilter === 'all') return true;
                                    if (activationFilter === 'completed') return a.status === 'completed' || a.status === 'paid';
                                    return a.status === activationFilter;
                                }).length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400">No activations found.</td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
