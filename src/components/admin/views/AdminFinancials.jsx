import React, { useState, useEffect, useMemo } from 'react';
import { getSales, markRepAsPaid, updateSaleStatus, getAllActivations, updateActivationStatus, markSaleCollected, markSaleRepPaid, markActivationBrandPaid, markActivationRepPaid } from '../../../services/firestoreService';
import { DollarSign, Users, Award, Download, Filter, Search, CheckCircle, Calendar, ChevronDown, ChevronUp, Banknote, CreditCard, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { convertToCSV, downloadCSV } from '../../../utils/csvHelper';
import { calculateAgencyShiftCost } from '../../../utils/pricing';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

    // Chart colors
    const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

    // Monthly revenue chart data
    const monthlyRevenueData = useMemo(() => {
        const monthlyData = {};
        sales.forEach(sale => {
            const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
            if (isNaN(date)) return;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthName, revenue: 0, commission: 0 };
            }
            const amount = parseFloat(sale.amount) || 0;
            monthlyData[monthKey].revenue += amount;
            monthlyData[monthKey].commission += amount * 0.05;
        });
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    }, [sales]);

    // Weekly revenue chart data
    const weeklyRevenueData = useMemo(() => {
        const weeklyData = {};
        const getWeekKey = (date) => {
            const d = new Date(date);
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil((((d - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
            return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        };
        sales.forEach(sale => {
            const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
            if (isNaN(date)) return;
            const weekKey = getWeekKey(date);
            const weekLabel = `Week ${weekKey.split('-W')[1]}`;
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { week: weekLabel, revenue: 0, orders: 0 };
            }
            weeklyData[weekKey].revenue += parseFloat(sale.amount) || 0;
            weeklyData[weekKey].orders += 1;
        });
        return Object.values(weeklyData).slice(-8);
    }, [sales]);

    // Top Dispensaries by revenue
    const topDispensariesData = useMemo(() => {
        const dispensaryData = {};
        sales.forEach(sale => {
            const name = sale.dispensaryName || 'Unknown';
            if (!dispensaryData[name]) {
                dispensaryData[name] = { name, revenue: 0, orders: 0 };
            }
            dispensaryData[name].revenue += parseFloat(sale.amount) || 0;
            dispensaryData[name].orders += 1;
        });
        return Object.values(dispensaryData).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    }, [sales]);

    // Rep Performance comparison
    const repPerformanceData = useMemo(() => {
        const repData = {};
        sales.forEach(sale => {
            const repName = sale.representativeName || sale.userName || 'Unknown Rep';
            if (!repData[repName]) {
                repData[repName] = { rep: repName, sales: 0, revenue: 0, commission: 0 };
            }
            repData[repName].sales += 1;
            repData[repName].revenue += parseFloat(sale.amount) || 0;
            repData[repName].commission += (parseFloat(sale.amount) || 0) * 0.02;
        });
        return Object.values(repData).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    }, [sales]);

    // Cumulative Revenue Area Chart
    const cumulativeRevenueData = useMemo(() => {
        const sorted = [...sales].sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateA - dateB;
        });
        let cumulative = 0;
        const dailyData = {};
        sorted.forEach(sale => {
            const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
            if (isNaN(date)) return;
            const dayKey = date.toISOString().split('T')[0];
            const amount = parseFloat(sale.amount) || 0;
            cumulative += amount;
            dailyData[dayKey] = { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cumulative, daily: amount };
        });
        return Object.values(dailyData).slice(-30);
    }, [sales]);

    // Pie chart data for commission status breakdown
    const commissionPieData = useMemo(() => [
        { name: 'Uncollected', value: stats.uncollected, color: '#f59e0b' },
        { name: 'Ready to Pay', value: stats.collectedUnpaid, color: '#eab308' },
        { name: 'Paid to Reps', value: stats.paidToReps, color: '#10b981' }
    ].filter(d => d.value > 0), [stats]);

    // Bar chart data for brand performance
    const brandPerformanceData = useMemo(() => {
        const brandData = {};
        activations.forEach(a => {
            const brand = a.brandName || a.brand_name || a.brand || 'Unknown';
            if (!brandData[brand]) {
                brandData[brand] = { brand, activations: 0, revenue: 0 };
            }
            brandData[brand].activations += 1;
            const fee = parseFloat(a.activationFee) || parseFloat(a.activation_fee) ||
                calculateAgencyShiftCost({
                    hoursWorked: a.hoursWorked || a.total_hours || 0,
                    region: a.region || 'NYC',
                    milesTraveled: a.milesTraveled || a.miles_traveled || 0,
                    tollAmount: a.tollAmount || a.toll_amount || 0,
                    hasVehicle: a.hasVehicle !== undefined ? a.hasVehicle : a.has_vehicle
                });
            brandData[brand].revenue += fee;
        });
        return Object.values(brandData).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    }, [activations]);


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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart - Monthly Revenue Trend */}
                <div className="themed-card p-5 rounded-xl lg:col-span-2">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={18} className="text-indigo-600" /> Monthly Revenue Trend
                    </h3>
                    {monthlyRevenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                    formatter={(value) => [`$${value.toFixed(2)}`, '']}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                                <Line type="monotone" dataKey="commission" name="Commission" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                            No sales data available
                        </div>
                    )}
                </div>

                {/* Pie Chart - Commission Status */}
                <div className="themed-card p-5 rounded-xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <PieChartIcon size={18} className="text-purple-600" /> Commission Status
                    </h3>
                    {commissionPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={commissionPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {commissionPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                            No commission data
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart - Brand Performance */}
            {brandPerformanceData.length > 0 && (
                <div className="themed-card p-5 rounded-xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Award size={18} className="text-amber-600" /> Brand Performance (Activations)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={brandPerformanceData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                            <YAxis type="category" dataKey="brand" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={100} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                formatter={(value, name) => [name === 'revenue' ? `$${value.toFixed(2)}` : value, name === 'revenue' ? 'Revenue' : 'Activations']}
                            />
                            <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Additional Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Revenue Chart */}
                {weeklyRevenueData.length > 0 && (
                    <div className="themed-card p-5 rounded-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Calendar size={18} className="text-blue-600" /> Weekly Revenue Breakdown
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={weeklyRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                    formatter={(value, name) => [name === 'revenue' ? `$${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="orders" name="Orders" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Dispensaries Chart */}
                {topDispensariesData.length > 0 && (
                    <div className="themed-card p-5 rounded-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Users size={18} className="text-teal-600" /> Top Dispensaries by Revenue
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topDispensariesData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={90} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                    formatter={(value, name) => [name === 'revenue' ? `$${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Rep Performance & Cumulative Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rep Performance Chart */}
                {repPerformanceData.length > 0 && (
                    <div className="themed-card p-5 rounded-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Award size={18} className="text-orange-600" /> Rep Performance Comparison
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={repPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis dataKey="rep" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                    formatter={(value, name) => [name === 'commission' ? `$${value.toFixed(2)}` : name === 'revenue' ? `$${value.toLocaleString()}` : value, name.charAt(0).toUpperCase() + name.slice(1)]}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="commission" name="Commission" fill="#fdba74" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Cumulative Revenue Area Chart */}
                {cumulativeRevenueData.length > 0 && (
                    <div className="themed-card p-5 rounded-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp size={18} className="text-emerald-600" /> Cumulative Revenue (30 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={cumulativeRevenueData}>
                                <defs>
                                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                                    formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'cumulative' ? 'Total' : 'Daily']}
                                />
                                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2} fill="url(#colorCumulative)" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
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
