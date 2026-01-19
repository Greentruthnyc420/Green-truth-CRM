import React, { useState, useEffect } from 'react';
import { getSales, markRepAsPaid, updateSaleStatus, getAllActivations, updateActivationStatus, markSaleCollected, markSaleRepPaid, markActivationBrandPaid, markActivationRepPaid } from '../../../services/firestoreService';
import { DollarSign, Users, Award, Download, Filter, Search, CheckCircle, Calendar, ChevronDown, ChevronUp, Banknote, CreditCard } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { convertToCSV, downloadCSV } from '../../../utils/csvHelper';
import { calculateAgencyShiftCost } from '../../../utils/pricing';

export default function AdminFinancials() {
    const [sales, setSales] = useState([]);
    const [activations, setActivations] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, collected, paid
    const [activationFilter, setActivationFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        netProfit: 0,
        uncollected: 0,      // pending - brand hasn't paid us
        collectedUnpaid: 0,  // collected - brand paid, rep hasn't been paid
        paidToReps: 0        // paid - rep received commission
    });
    const [activationStats, setActivationStats] = useState({ total: 0, totalFees: 0, pendingFees: 0, paidFees: 0, repWagesUnpaid: 0, repWagesPaid: 0 });

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

            // Calc Commission Stats with 3-tier status
            const totalSalesAmount = allSales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const totalCommission = totalSalesAmount * 0.05; // 5% total commission
            const netProfit = totalSalesAmount * 0.03;       // 3% kept by company

            // Status breakdown for 2% rep commission
            const uncollected = allSales
                .filter(s => !s.status || s.status === 'pending' || s.status === 'completed')
                .reduce((acc, curr) => acc + ((parseFloat(curr.amount) || 0) * 0.02), 0);

            const collectedUnpaid = allSales
                .filter(s => s.status === 'collected')
                .reduce((acc, curr) => acc + ((parseFloat(curr.amount) || 0) * 0.02), 0);

            const paidToReps = allSales
                .filter(s => s.status === 'paid')
                .reduce((acc, curr) => acc + ((parseFloat(curr.amount) || 0) * 0.02), 0);

            setStats({
                totalRevenue: totalCommission,
                netProfit,
                uncollected,
                collectedUnpaid,
                paidToReps
            });

            // Calc Activation Stats
            const getActivationFee = (a) => {
                const storedFee = parseFloat(a.activationFee) || parseFloat(a.activation_fee) || 0;
                if (storedFee > 0) return storedFee;
                return calculateAgencyShiftCost({
                    hoursWorked: a.hoursWorked || a.total_hours || 0,
                    region: a.region || 'NYC',
                    milesTraveled: a.milesTraveled || a.miles_traveled || 0,
                    tollAmount: a.tollAmount || a.toll_amount || 0,
                    hasVehicle: a.hasVehicle !== undefined ? a.hasVehicle : a.has_vehicle
                });
            };
            const totalActivations = allActivations.length;
            const totalFees = allActivations.reduce((acc, a) => acc + getActivationFee(a), 0);
            // Brand paid = status is 'paid' or 'rep_paid'
            const pendingFees = allActivations.filter(a => a.status !== 'paid' && a.status !== 'rep_paid').reduce((acc, a) => acc + getActivationFee(a), 0);
            const paidFees = allActivations.filter(a => a.status === 'paid' || a.status === 'rep_paid').reduce((acc, a) => acc + getActivationFee(a), 0);

            // Calculate rep wages tracking
            // Rep wages unpaid = brand paid ('paid') but rep not paid yet (not 'rep_paid')
            // Rep wages paid = status is 'rep_paid'
            const getRepWages = (a) => {
                const hours = parseFloat(a.hoursWorked || a.total_hours) || 0;
                const rate = 20; // Base rate
                const wages = hours * rate;
                const reimbursement = (parseFloat(a.milesTraveled || a.miles_traveled) || 0) * 0.725 + (parseFloat(a.tollAmount || a.toll_amount) || 0);
                return wages + reimbursement;
            };
            const repWagesUnpaid = allActivations.filter(a => a.status !== 'rep_paid').reduce((acc, a) => acc + getRepWages(a), 0);
            const repWagesPaid = allActivations.filter(a => a.status === 'rep_paid').reduce((acc, a) => acc + getRepWages(a), 0);

            setActivationStats({
                total: totalActivations,
                totalFees,
                pendingFees,
                paidFees,
                repWagesUnpaid,
                repWagesPaid
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
        if (filter === 'pending') return !s.status || s.status === 'pending' || s.status === 'completed';
        return s.status === filter;
    });

    // Mark as Collected (brand paid us)
    const handleMarkCollected = async (saleId) => {
        if (await markSaleCollected(saleId)) {
            showNotification("Sale marked as collected from brand", "success");
            setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'collected' } : s));
            loadFinancials();
        } else {
            showNotification("Failed to update status", "error");
        }
    };

    // Mark as Paid (rep received commission)
    const handleMarkRepPaid = async (saleId) => {
        if (await markSaleRepPaid(saleId)) {
            showNotification("Commission paid to rep", "success");
            setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'paid' } : s));
            loadFinancials();
        } else {
            showNotification("Failed to update status", "error");
        }
    };

    const handleMarkActivationPaid = async (activationId) => {
        if (await updateActivationStatus(activationId, 'paid')) {
            showNotification("Activation marked as paid by brand", "success");
            loadFinancials();
        } else {
            showNotification("Failed to update status", "error");
        }
    };

    const handleMarkActivationRepPaid = async (activationId) => {
        if (await markActivationRepPaid(activationId)) {
            showNotification("Rep wages paid for activation", "success");
            setActivations(prev => prev.map(a => a.id === activationId ? { ...a, rep_paid: true } : a));
            loadFinancials();
        } else {
            showNotification("Failed to update rep payment status", "error");
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

    const getStatusBadge = (status) => {
        const s = status || 'pending';
        if (s === 'paid') return 'bg-emerald-100 text-emerald-700';
        if (s === 'collected') return 'bg-yellow-100 text-yellow-700';
        return 'bg-orange-100 text-orange-700';
    };

    const getStatusLabel = (status) => {
        if (status === 'paid') return 'Paid to Rep';
        if (status === 'collected') return 'Collected';
        return 'Pending';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Financials</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Collections, commissions, and payout tracking.</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 font-medium px-4 py-2 rounded-lg shadow-sm" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <h2 className="text-lg font-bold flex items-center gap-2 mt-4" style={{ color: 'var(--text-primary)' }}>
                <DollarSign size={20} className="text-indigo-600" /> Sales Commissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="themed-card p-5 rounded-xl">
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Gross Commission (5%)</p>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-indigo-500">
                    <p className="text-indigo-500 text-sm font-medium mb-1">Net Profit (3%)</p>
                    <h3 className="text-2xl font-bold text-indigo-700">${(stats.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-orange-500">
                    <p className="text-orange-600 text-sm font-medium mb-1">Uncollected (2%)</p>
                    <h3 className="text-2xl font-bold text-orange-700">${(stats.uncollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Awaiting brand payment</p>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-yellow-500">
                    <p className="text-yellow-600 text-sm font-medium mb-1">Ready to Pay Rep</p>
                    <h3 className="text-2xl font-bold text-yellow-700">${(stats.collectedUnpaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Collected, rep unpaid</p>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-emerald-500">
                    <p className="text-emerald-600 text-sm font-medium mb-1">Paid to Reps</p>
                    <h3 className="text-2xl font-bold text-emerald-700">${(stats.paidToReps || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Complete</p>
                </div>
            </div>

            {/* Commissions Ledger */}
            <div className="themed-card rounded-xl overflow-hidden">
                <button
                    onClick={() => setCommissionsOpen(!commissionsOpen)}
                    className="w-full p-4 flex justify-between items-center transition-colors" style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.05)' }}
                >
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Commissions Ledger</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {['all', 'pending', 'collected', 'paid'].map(f => (
                                <button
                                    key={f}
                                    onClick={(e) => { e.stopPropagation(); setFilter(f); }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-brand-600 text-white' : ''}`}
                                    style={filter !== f ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' } : {}}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {commissionsOpen ? <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                </button>

                {commissionsOpen && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead style={{ background: 'rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th className="px-6 py-3 text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                    <th className="px-6 py-3 text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Dispensary</th>
                                    <th className="px-6 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Sale Amt</th>
                                    <th className="px-6 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Rep Comm (2%)</th>
                                    <th className="px-6 py-3 text-center text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="px-6 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {filteredSales.map(sale => {
                                    const commission = (parseFloat(sale.amount) || 0) * 0.02;
                                    const status = sale.status || 'pending';
                                    return (
                                        <tr key={sale.id} className="transition-colors" style={{ ':hover': { background: 'var(--bg-secondary)' } }}>
                                            <td className="px-6 py-3" style={{ color: 'var(--text-secondary)' }}>{safeDate(sale.date)}</td>
                                            <td className="px-6 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{sale.dispensaryName}</td>
                                            <td className="px-6 py-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>${parseFloat(sale.amount).toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right font-bold text-emerald-600 font-mono">${commission.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(status)}`}>
                                                    {getStatusLabel(status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {(!status || status === 'pending' || status === 'completed') && (
                                                        <button
                                                            onClick={() => handleMarkCollected(sale.id)}
                                                            className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100 font-medium flex items-center gap-1"
                                                        >
                                                            <CreditCard size={12} /> Collected
                                                        </button>
                                                    )}
                                                    {status === 'collected' && (
                                                        <button
                                                            onClick={() => handleMarkRepPaid(sale.id)}
                                                            className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 font-medium flex items-center gap-1"
                                                        >
                                                            <Banknote size={12} /> Pay Rep
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredSales.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <h2 className="text-lg font-bold flex items-center gap-2 mt-8" style={{ color: 'var(--text-primary)' }}>
                <Calendar size={20} className="text-purple-600" /> Activations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="themed-card p-5 rounded-xl">
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total</p>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activationStats.total}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-purple-500">
                    <p className="text-purple-600 text-xs font-medium mb-1">Total Fees</p>
                    <h3 className="text-2xl font-bold text-purple-700">${(activationStats.totalFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-amber-500">
                    <p className="text-amber-600 text-xs font-medium mb-1">Pending (Brand)</p>
                    <h3 className="text-2xl font-bold text-amber-700">${(activationStats.pendingFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-teal-500">
                    <p className="text-teal-600 text-xs font-medium mb-1">Paid (Brand)</p>
                    <h3 className="text-2xl font-bold text-teal-700">${(activationStats.paidFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-orange-500">
                    <p className="text-orange-600 text-xs font-medium mb-1">Rep Wages Unpaid</p>
                    <h3 className="text-2xl font-bold text-orange-700">${(activationStats.repWagesUnpaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="themed-card p-5 rounded-xl border-l-4 border-emerald-500">
                    <p className="text-emerald-600 text-xs font-medium mb-1">Rep Wages Paid</p>
                    <h3 className="text-2xl font-bold text-emerald-700">${(activationStats.repWagesPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Activations Ledger */}
            <div className="themed-card rounded-xl overflow-hidden">
                <button
                    onClick={() => setActivationsOpen(!activationsOpen)}
                    className="w-full p-4 flex justify-between items-center transition-colors" style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.05)' }}
                >
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Activations Ledger</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {['all', 'pending', 'paid'].map(f => (
                                <button
                                    key={f}
                                    onClick={(e) => { e.stopPropagation(); setActivationFilter(f); }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${activationFilter === f ? 'bg-brand-600 text-white' : ''}`}
                                    style={activationFilter !== f ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' } : {}}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {activationsOpen ? <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                </button>

                {activationsOpen && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead style={{ background: 'rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                    <th className="px-4 py-3 text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Dispensary</th>
                                    <th className="px-4 py-3 text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Brand</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Fee</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Rep Wages</th>
                                    <th className="px-4 py-3 text-center text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Brand Paid</th>
                                    <th className="px-4 py-3 text-center text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Rep Paid</th>
                                    <th className="px-4 py-3 text-right text-xs uppercase font-medium" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {activations
                                    .filter(a => {
                                        if (activationFilter === 'all') return true;
                                        if (activationFilter === 'paid') return a.status === 'paid';
                                        return a.status !== 'paid';
                                    })
                                    .map(activation => {
                                        const hours = parseFloat(activation.hoursWorked || activation.total_hours) || 0;
                                        const repWages = (hours * 20) + ((parseFloat(activation.milesTraveled || activation.miles_traveled) || 0) * 0.725) + (parseFloat(activation.tollAmount || activation.toll_amount) || 0);
                                        return (
                                            <tr key={activation.id} className="transition-colors">
                                                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{safeDate(activation.date || activation.activation_date)}</td>
                                                <td className="px-4 py-3 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{activation.dispensaryName || activation.dispensary_name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{activation.brandName || activation.brand_name || activation.brand || 'N/A'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-purple-600 font-mono text-sm">
                                                    ${(() => {
                                                        const storedFee = parseFloat(activation.activationFee) || parseFloat(activation.activation_fee) || 0;
                                                        if (storedFee > 0) return storedFee.toFixed(2);
                                                        return calculateAgencyShiftCost({
                                                            hoursWorked: activation.hoursWorked || activation.total_hours || 0,
                                                            region: activation.region || 'NYC',
                                                            milesTraveled: activation.milesTraveled || activation.miles_traveled || 0,
                                                            tollAmount: activation.tollAmount || activation.toll_amount || 0,
                                                            hasVehicle: activation.hasVehicle !== undefined ? activation.hasVehicle : activation.has_vehicle
                                                        }).toFixed(2);
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    ${repWages.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${(activation.status === 'paid' || activation.status === 'rep_paid')
                                                        ? 'bg-teal-100 text-teal-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {(activation.status === 'paid' || activation.status === 'rep_paid') ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${activation.status === 'rep_paid'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {activation.status === 'rep_paid' ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        {activation.status !== 'paid' && activation.status !== 'rep_paid' && (
                                                            <button
                                                                onClick={() => handleMarkActivationPaid(activation.id)}
                                                                className="text-xs bg-teal-50 text-teal-600 px-2 py-1 rounded hover:bg-teal-100 font-medium"
                                                            >
                                                                Brand Paid
                                                            </button>
                                                        )}
                                                        {activation.status === 'paid' && (
                                                            <button
                                                                onClick={() => handleMarkActivationRepPaid(activation.id)}
                                                                className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 font-medium flex items-center gap-1"
                                                            >
                                                                <Banknote size={12} /> Pay Rep
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                {activations.filter(a => {
                                    if (activationFilter === 'all') return true;
                                    if (activationFilter === 'paid') return a.status === 'paid';
                                    return a.status !== 'paid';
                                }).length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No activations found.</td>
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
