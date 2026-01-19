import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Users, Award, TrendingUp, Store, Wallet, PiggyBank, Banknote, Percent, Target, Calendar, FileText, UserCheck, CircleDollarSign } from 'lucide-react';
import { getSales, getAllShifts, getLeads, LEAD_STATUS } from '../../services/firestoreService';
import { calculateTotalLifetimeBonuses, calculateReimbursement } from '../../services/compensationService';
import { calculateAgencyShiftCost } from '../../utils/pricing';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const HOURLY_RATE = 20;

// Premium Stat Card with animations (from Growth section)
const PremiumStatCard = ({ title, value, icon: Icon, gradient, subtext, delay = 0, iconStyle }) => {
    const count = useMotionValue(0);
    const displayValue = useTransform(count, (latest) => latest.toFixed(2));

    useEffect(() => {
        const animation = animate(count, value, { duration: 1.5, ease: "circOut" });
        return animation.stop;
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02 }}
            className={`relative p-6 rounded-2xl shadow-lg border border-white/20 select-none overflow-hidden ${gradient} flex items-center justify-between`}
        >
            {/* Glass Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content (Left) */}
            <div className="relative z-10 text-white">
                <h4 className="text-white/80 font-bold uppercase text-xs tracking-wider mb-2">{title}</h4>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black">$</span>
                    <motion.h3 className="text-3xl font-black">
                        {displayValue}
                    </motion.h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    {Icon && <Icon size={12} />}
                    <span>{subtext}</span>
                </div>
            </div>

            {/* Glass Icon Badge (Right) */}
            <motion.div
                className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/30"
                whileHover={
                    iconStyle === 'wiggle' ? { rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } } :
                        iconStyle === 'pulse' ? { scale: [1, 1.15, 1], boxShadow: "0 0 25px rgba(255,255,255,0.6)", transition: { duration: 0.8, repeat: Infinity } } :
                            {}
                }
            >
                {Icon && <Icon size={36} className="text-white" strokeWidth={1.5} />}
            </motion.div>
        </motion.div>
    );
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        // From Growth Section - Financial Metrics
        salesCommissionRevenue: 0,  // 5% of sales
        commissionsAndBonuses: 0,   // 2% rep comm + bonuses
        quarterlyNet: 0,            // Sales profit
        activationRevenue: 0,       // Shift fees
        wagesAndExpenses: 0,        // Wages + reimbursements
        shiftNet: 0,                // Activation profit

        // Main Overview Stats (reordered: Gross → Expenses → Net)
        grossRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,

        // Secondary Stats
        totalRevenue: 0,            // Sales volume
        totalSalesCount: 0,
        activeSellers: 0,

        // Pipeline Stats
        totalLeads: 0,
        activeAccounts: 0,
        prospects: 0,
        conversionRate: 0,

        // Chart Data
        revenueData: [],
        productMix: [],
        salesHistory: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const [sales, allShifts, allLeads] = await Promise.all([
                    getSales(),
                    getAllShifts(),
                    getLeads()
                ]);

                // === TRUE PROFIT CALCULATION ===
                // Total sales volume (not our revenue - this is what customers paid)
                const totalSalesVolume = sales.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount || curr.amount) || 0), 0);

                // 1. INCOME: Activation Fees (what brands pay us for shifts)
                let activationRevenue = 0;
                let totalWages = 0;
                let totalReimbursements = 0;

                allShifts.forEach(s => {
                    // Use calculateAgencyShiftCost from pricing.js (same as Financials)
                    activationRevenue += calculateAgencyShiftCost(s);
                    totalWages += (parseFloat(s.hoursWorked) || 0) * HOURLY_RATE;
                    totalReimbursements += calculateReimbursement(
                        parseFloat(s.milesTraveled),
                        parseFloat(s.tollAmount),
                        s.hasVehicle !== false
                    );
                });

                // 2. INCOME: Sales Commission (5% of sales go to company)
                const salesCommissionRevenue = totalSalesVolume * 0.05;

                // 3. EXPENSES: Rep Commission (2% of sales go to reps)
                const repCommissionPayout = totalSalesVolume * 0.02;

                // 4. EXPENSES: Milestone Bonuses
                const userStoreSets = {};
                const addStore = (uid, name) => {
                    if (!uid || !name) return;
                    if (!userStoreSets[uid]) userStoreSets[uid] = new Set();
                    userStoreSets[uid].add(name);
                };
                allShifts.forEach(s => addStore(s.userId, s.dispensaryName));
                sales.forEach(s => addStore(s.userId, s.dispensaryName));
                allLeads.forEach(l => addStore(l.userId, l.dispensaryName));

                let totalBonuses = 0;
                Object.keys(userStoreSets).forEach(uid => {
                    const count = userStoreSets[uid].size;
                    totalBonuses += calculateTotalLifetimeBonuses(count);
                });

                // === FINAL CALCULATIONS ===
                const grossRevenue = activationRevenue + salesCommissionRevenue;
                const wagesAndExpenses = totalWages + totalReimbursements;
                const commissionsAndBonuses = repCommissionPayout + totalBonuses;
                const totalExpenses = wagesAndExpenses + commissionsAndBonuses;
                const netProfit = grossRevenue - totalExpenses;

                // Growth Section Metrics
                // quarterlyNet = Sales Revenue (5%) - Rep Commissions (2% + bonuses)
                const quarterlyNet = salesCommissionRevenue - commissionsAndBonuses;
                const shiftNet = activationRevenue - wagesAndExpenses;

                // For display - keep totalRevenue as sales volume for backward compatibility
                const totalRevenue = totalSalesVolume;

                // Revenue Trend (Daily - Last 14 days)
                const salesByDate = {};
                sales.forEach(s => {
                    let d;
                    try {
                        d = (s.date?.toDate ? s.date.toDate() : new Date(s.date)).toLocaleDateString();
                    } catch {
                        d = 'Invalid';
                    }
                    if (d !== 'Invalid') {
                        salesByDate[d] = (salesByDate[d] || 0) + (parseFloat(s.totalAmount || s.amount) || 0);
                    }
                });
                const revenueData = Object.entries(salesByDate)
                    .map(([date, amount]) => ({ date, amount }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(-14);

                // Sales History (Monthly for Network Analytics)
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const salesHistoryMap = {};
                sales.forEach(sale => {
                    const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
                    const monthName = months[saleDate.getMonth()];
                    const revenue = parseFloat(sale.totalAmount || sale.amount) || 0;
                    salesHistoryMap[monthName] = (salesHistoryMap[monthName] || 0) + revenue;
                });

                const salesHistory = [];
                const today = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const mName = months[d.getMonth()];
                    salesHistory.push({
                        month: mName,
                        revenue: salesHistoryMap[mName] || 0
                    });
                }

                // Product Mix
                const productCounts = {};
                sales.forEach(s => {
                    const items = s.items || s.products || [];
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            // Look for product name in multiple possible fields
                            const name = item.productName || item.name || item.product || item.productId || 'Unknown';
                            const qty = item.quantity || 1;
                            productCounts[name] = (productCounts[name] || 0) + qty;
                        });
                    }
                });

                const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                const productMix = Object.entries(productCounts)
                    .map(([name, value], index) => ({
                        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                        value,
                        color: COLORS[index % COLORS.length]
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                const activeSellers = new Set(sales.map(s => s.userId)).size;

                // Pipeline/Growth Stats
                const totalLeads = allLeads.length;
                const activeAccounts = allLeads.filter(l => l.leadStatus === LEAD_STATUS?.ACTIVE || l.status === 'Sold').length;
                const prospects = allLeads.filter(l => !l.leadStatus || l.leadStatus === LEAD_STATUS?.PROSPECT).length;
                const conversionRate = totalLeads > 0 ? ((activeAccounts / totalLeads) * 100) : 0;

                setStats({
                    // Growth Financial Metrics
                    salesCommissionRevenue,
                    commissionsAndBonuses,
                    quarterlyNet,
                    activationRevenue,
                    wagesAndExpenses,
                    shiftNet,

                    // Main Stats (reordered)
                    grossRevenue,
                    totalExpenses,
                    netProfit,

                    // Secondary
                    totalRevenue,
                    totalSalesCount: sales.length,
                    activeSellers,

                    // Pipeline
                    totalLeads,
                    activeAccounts,
                    prospects,
                    conversionRate,

                    // Charts
                    revenueData,
                    productMix,
                    salesHistory
                });

            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="themed-card p-4 rounded-lg shadow-lg">
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                        ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Company performance overview.</p>
                </div>
            </div>

            {/* ===== GROWTH SECTION: QUARTERLY SALES PERFORMANCE ===== */}
            <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Award size={16} /> Quarterly Sales & Commissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sales Revenue (5%) */}
                    <div className="themed-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-medium mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Sales Revenue (5%)</p>
                        <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.salesCommissionRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <DollarSign size={14} />
                            <span>Gross from Sales</span>
                        </div>
                    </div>

                    {/* Rep Commissions */}
                    <div className="themed-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-medium mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Rep Commissions</p>
                        <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.commissionsAndBonuses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <Users size={14} />
                            <span>2% Comm + Bonuses</span>
                        </div>
                    </div>

                    {/* Quarterly Net (Premium Gold Card) */}
                    <PremiumStatCard
                        title="Quarterly Net"
                        value={stats.quarterlyNet}
                        icon={Banknote}
                        gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                        subtext="Company Sales Profit"
                        delay={0.1}
                        iconStyle="wiggle"
                    />
                </div>
            </div>

            {/* ===== GROWTH SECTION: BI-WEEKLY ACTIVATIONS ===== */}
            <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={16} /> Bi-Weekly Activations & Payroll
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Activation Revenue */}
                    <div className="themed-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-medium mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Activation Revenue</p>
                        <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.activationRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <DollarSign size={14} />
                            <span>Shift Fees Billed</span>
                        </div>
                    </div>

                    {/* Rep Wages */}
                    <div className="themed-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-medium mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Rep Wages & Expenses</p>
                        <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.wagesAndExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <Users size={14} />
                            <span>Pay + Miles + Tolls</span>
                        </div>
                    </div>

                    {/* Payroll Net (Premium Green Card) */}
                    <PremiumStatCard
                        title="Payroll Net"
                        value={stats.shiftNet}
                        icon={CircleDollarSign}
                        gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                        subtext="Net Profit"
                        delay={0.2}
                        iconStyle="pulse"
                    />
                </div>
            </div>

            {/* ===== PIPELINE STATS ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="themed-card p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Pipeline</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalLeads}</p>
                </div>
                <div className="themed-card p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Conversion Rate</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{stats.conversionRate.toFixed(1)}%</p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>Leads to Active</p>
                </div>
                <div className="themed-card p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Active Accounts</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.activeAccounts}</p>
                </div>
                <div className="themed-card p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Prospects</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>{stats.prospects}</p>
                </div>
            </div>

            {/* ===== MAIN FINANCIAL STATS (Reordered: Gross → Expenses → Net) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Gross Revenue (LEFT) */}
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg icon-bg-accent">
                            <Wallet size={20} />
                        </div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Revenue</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Activation fees + 5% sales commission</p>
                </div>

                {/* 2. Total Expenses (CENTER) */}
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Banknote size={20} />
                        </div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Total Expenses</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--error)' }}>-${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Wages, miles, tolls, 2% comm, bonuses</p>
                </div>

                {/* 3. Net Profit - THE BOTTOM LINE (RIGHT) */}
                <div className="p-6 rounded-2xl shadow-lg" style={{ background: 'var(--accent-gradient)', border: '1px solid var(--accent-primary)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 text-white rounded-lg">
                            <PiggyBank size={20} />
                        </div>
                        <h3 className="text-emerald-100 font-medium text-sm">Net Profit (Bottom Line)</h3>
                    </div>
                    <p className="text-3xl font-black text-white">${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-emerald-200 text-xs mt-1">After all expenses</p>
                </div>
            </div>

            {/* ===== NETWORK ANALYTICS (from Growth) ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Chart */}
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                        Network Sales Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.salesHistory}>
                                <defs>
                                    <linearGradient id="colorRevenueAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="var(--chart-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueAdmin)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Mix */}
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Top Products</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.productMix}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.productMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" layout="vertical" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg icon-bg-accent-secondary">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Total Sales Volume</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Partner product sales</p>
                </div>
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg icon-bg-accent">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Sales Count</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalSalesCount}</p>
                </div>
                <div className="themed-card p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg icon-bg-accent-tertiary">
                            <Users size={20} />
                        </div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Active Sellers</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.activeSellers}</p>
                </div>
            </div>

            {/* Quick Navigation */}
            <div className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>Quick Navigation</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Link to="/admin/financials" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-success">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Financials</span>
                    </Link>
                    <Link to="/admin/workflow" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-accent-tertiary">
                            <Users size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Workflow</span>
                    </Link>
                    <Link to="/admin/pipeline" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-accent">
                            <Award size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Pipeline</span>
                    </Link>
                    <Link to="/admin/territory" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-info">
                            <Store size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Territory</span>
                    </Link>
                    <Link to="/admin/invoices" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-warning">
                            <Calendar size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Invoices</span>
                    </Link>
                    <Link to="/admin/team" className="themed-card-interactive p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 text-center">
                        <div className="p-3 rounded-lg icon-bg-accent-secondary">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Team</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
