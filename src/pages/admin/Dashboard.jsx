import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Users, Award, TrendingUp, Store, Wallet, PiggyBank, Banknote, Percent, Target, Calendar, FileText, UserCheck } from 'lucide-react';
import { getSales, getAllShifts, getLeads, LEAD_STATUS } from '../../services/firestoreService';
import { calculateTotalLifetimeBonuses, calculateReimbursement, calculateShiftClientRevenue } from '../../services/compensationService';
import { PRODUCT_CATALOG } from '../../data/productCatalog';

const HOURLY_RATE = 20;

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        netProfit: 0,
        grossRevenue: 0,
        totalExpenses: 0,
        totalSalesCount: 0,
        activeSellers: 0,
        revenueData: [],
        productMix: [],
        // Pipeline/Growth stats
        totalLeads: 0,
        activeAccounts: 0,
        prospects: 0,
        conversionRate: 0
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
                const totalSalesVolume = sales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

                // 1. INCOME: Activation Fees (what brands pay us for shifts)
                let activationRevenue = 0;
                let totalWages = 0;
                let totalReimbursements = 0;

                allShifts.forEach(s => {
                    activationRevenue += calculateShiftClientRevenue(s);
                    totalWages += (parseFloat(s.hoursWorked) || 0) * HOURLY_RATE;
                    totalReimbursements += calculateReimbursement(
                        parseFloat(s.milesTraveled),
                        parseFloat(s.tollAmount),
                        s.hasVehicle !== false
                    );
                });

                // 2. INCOME: Sales Commission (5% of sales go to company)
                const salesCommissionIncome = totalSalesVolume * 0.05;

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
                const grossRevenue = activationRevenue + salesCommissionIncome;
                const totalExpenses = totalWages + totalReimbursements + repCommissionPayout + totalBonuses;
                const netProfit = grossRevenue - totalExpenses;

                // For display - keep totalRevenue as sales volume for backward compatibility
                const totalRevenue = totalSalesVolume;

                // 2. Revenue Trend (Daily)
                const salesByDate = {};
                sales.forEach(s => {
                    let d;
                    try {
                        d = (s.date?.toDate ? s.date.toDate() : new Date(s.date)).toLocaleDateString();
                    } catch {
                        d = 'Invalid';
                    }
                    if (d !== 'Invalid') {
                        salesByDate[d] = (salesByDate[d] || 0) + (parseFloat(s.amount) || 0);
                    }
                });
                // Sort by date and take last 7 days or so
                const revenueData = Object.entries(salesByDate)
                    .map(([date, amount]) => ({ date, amount }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(-14); // Last 14 days

                // 3. Product Mix
                const productCounts = {};
                sales.forEach(s => {
                    if (s.items) {
                        s.items.forEach(item => {
                            productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
                        });
                    }
                });

                const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
                const productMix = Object.entries(productCounts)
                    .map(([id, value], index) => {
                        const product = PRODUCT_CATALOG.products.find(p => p.id === id);
                        return {
                            name: product?.name || id,
                            value,
                            color: COLORS[index % COLORS.length]
                        };
                    })
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                const activeSellers = new Set(sales.map(s => s.userId)).size;

                // Pipeline/Growth Stats
                const totalLeads = allLeads.length;
                const activeAccounts = allLeads.filter(l => l.leadStatus === LEAD_STATUS?.ACTIVE || l.status === 'Sold').length;
                const prospects = allLeads.filter(l => !l.leadStatus || l.leadStatus === LEAD_STATUS?.PROSPECT).length;
                const conversionRate = totalLeads > 0 ? ((activeAccounts / totalLeads) * 100) : 0;

                setStats({
                    totalRevenue,
                    netProfit,
                    grossRevenue,
                    totalExpenses,
                    totalSalesCount: sales.length,
                    activeSellers,
                    revenueData,
                    productMix,
                    totalLeads,
                    activeAccounts,
                    prospects,
                    conversionRate
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
                <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-100">
                    <p className="font-bold text-slate-700 mb-1">{label}</p>
                    <p className="text-brand-600 font-medium">
                        ${payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                    <p className="text-slate-500">Company performance overview.</p>
                </div>
            </div>

            {/* Pipeline/Growth Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Pipeline</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalLeads}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Conversion Rate</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Leads to Active</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Active Accounts</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.activeAccounts}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Prospects</p>
                    <p className="text-2xl font-bold text-slate-500">{stats.prospects}</p>
                </div>
            </div>

            {/* High Level Stats - PROFIT FOCUSED */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* NET PROFIT - THE BOTTOM LINE */}
                <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-lg border border-emerald-400">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 text-white rounded-lg">
                            <PiggyBank size={24} />
                        </div>
                        <h3 className="text-emerald-100 font-medium text-sm">Net Profit (Bottom Line)</h3>
                    </div>
                    <p className="text-4xl font-black text-white">${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-emerald-200 text-xs mt-2">After paying reps, commissions, bonuses, wages & expenses</p>
                </div>

                {/* Gross Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Gross Revenue</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">${stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 text-xs mt-1">Activation fees + 5% sales commission</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Banknote size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Total Expenses</h3>
                    </div>
                    <p className="text-2xl font-black text-red-600">-${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 text-xs mt-1">Wages, miles, tolls, 2% comm, bonuses</p>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Total Sales Volume</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-1">Partner product sales</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Sales Count</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{stats.totalSalesCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Active Sellers</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{stats.activeSellers}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6">Revenue Trend (Last 14 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Mix */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6">Top Products</h3>
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
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Navigation */}
            <div className="mt-8">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Navigation</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Payroll</span>
                    </Link>
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Commissions</span>
                    </Link>
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Partner Brands</span>
                    </Link>
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Store size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Leads</span>
                    </Link>
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Scheduling</span>
                    </Link>
                    <Link to="/admin-dashboard" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
                        <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Ambassadors</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
