import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPC, Pie, Cell, Legend
} from 'recharts';
import {
    DollarSign, Users, FileText, CheckCircle, ExternalLink, Loader,
    Download, AlertTriangle, RefreshCw, Award, BarChart, Calendar,
    Store, CircleDollarSign, Banknote, Shield, ShoppingCart, Package,
    Search, Clock, Truck, X, ChevronDown, ChevronUp, MapPin, Tag, Trophy, TrendingUp, PieChart
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
    getAllShifts, updateShiftStatus, getSales, getLeads,
    getUserProfile, updateSaleStatus, updateSale, markRepAsPaid, seedBrands,
    getActivations, wipeAllData
} from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { Rocket, Trash2, Database } from 'lucide-react';
import { calculateTotalLifetimeBonuses, calculateReimbursement } from '../../services/compensationService';
import { syncLeadToHubSpot } from '../../services/hubspotService';
import { convertToCSV, downloadCSV } from '../../utils/csvHelper';
import { importOfficialDispensaries } from '../../services/dataSyncService';
import { useBrandAuth, BRAND_LICENSES } from '../../contexts/BrandAuthContext';
import { useNavigate } from 'react-router-dom';

// We can reuse some components if they are exported or duplicate minimal parts
// For now, I'll inline the StatCards for simplicity in this new file or create new ones
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-600`}>
            <Icon size={64} />
        </div>
        <div>
            <p className="text-slate-500 font-medium mb-1 text-sm">{title}</p>
            <h3 className="text-3xl font-black text-slate-900">
                {typeof value === 'number' ? `$${value.toFixed(2)}` : value}
            </h3>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Icon size={14} />
            <span>{subtext}</span>
        </div>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap
      ${active
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
    >
        {icon}
        {label}
    </button>
);

const HOURLY_RATE = 20;

export default function Dashboard() {
    const { impersonateBrand } = useBrandAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('payroll');
    const [processing, setProcessing] = useState(false);

    // Data
    // Data
    const [shifts, setShifts] = useState([]);
    const [allShifts, setAllShifts] = useState([]);
    const [sales, setSales] = useState([]);
    const [leads, setLeads] = useState([]);
    const [activations, setActivations] = useState([]);

    const [financials, setFinancials] = useState({
        salesCommissionRevenue: 0,
        commissionsAndBonuses: 0,
        quarterlyNet: 0,
        activationRevenue: 0,
        wagesAndExpenses: 0,
        shiftNet: 0,
        salesHistory: [],
        productMix: []
    });
    const [usersMap, setUsersMap] = useState({});
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);
    const [userBonusMap, setUserBonusMap] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch All Data
                const [shiftsData, salesData, leadsData, activationsData] = await Promise.all([
                    getAllShifts(),
                    getSales(),
                    getLeads(),
                    getActivations()
                ]);

                // Pending Shifts
                const pending = shiftsData.filter(s => s.status === 'pending');
                setShifts(pending);
                setAllShifts(shiftsData);
                setSales(salesData);
                setLeads(leadsData);
                setActivations(activationsData);

                // --- 1. Calculate Store Counts for Bonuses ---
                const userStoreSets = {};
                const addStore = (uid, name) => {
                    if (!uid || !name) return;
                    if (!userStoreSets[uid]) userStoreSets[uid] = new Set();
                    userStoreSets[uid].add(name);
                };

                shiftsData.forEach(s => addStore(s.userId, s.dispensaryName));
                salesData.forEach(s => addStore(s.userId, s.dispensaryName));
                leadsData.forEach(l => addStore(l.userId, l.dispensaryName));

                let totalBonuses = 0;
                const bonusMap = {};
                Object.keys(userStoreSets).forEach(uid => {
                    const count = userStoreSets[uid].size;
                    const bonus = calculateTotalLifetimeBonuses(count);
                    if (bonus > 0) {
                        bonusMap[uid] = bonus;
                        totalBonuses += bonus;
                    }
                });
                setUserBonusMap(bonusMap);

                // --- 2. Financial Calculations (Detailed) ---
                const totalSales = salesData.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

                // Shift Revenue & Costs
                let totalShiftRevenue = 0;
                let totalShiftWages = 0;
                let totalShiftReimbursements = 0;

                shiftsData.forEach(s => {
                    // Logic from Legacy: calculateShiftClientRevenue
                    // Assuming default fixed rate if function not available or inline it here
                    // Legacy used a helper, let's replicate the basic logic:
                    // If we don't have the helper, use a standard fee (e.g., $400) or check shift type
                    let rev = 400; // Default
                    if (s.clientRevenue) rev = parseFloat(s.clientRevenue);
                    totalShiftRevenue += rev;

                    const wage = (parseFloat(s.hoursWorked) || 0) * HOURLY_RATE;
                    const reimbursement = calculateReimbursement(
                        parseFloat(s.milesTraveled),
                        parseFloat(s.tollAmount),
                        s.hasVehicle !== false
                    );
                    totalShiftWages += wage;
                    totalShiftReimbursements += reimbursement;
                });

                // Sales Revenue (5% Gross)
                const salesRevenue = totalSales * 0.05;

                // Rep Payouts
                const salesCommissions = totalSales * 0.02; // 2%
                const wagesAndExpenses = totalShiftWages + totalShiftReimbursements;
                const commissionsAndBonuses = salesCommissions + totalBonuses;

                // Net Profit
                const quarterlyNet = salesRevenue - salesCommissions; // Pure 3% margin
                const shiftNet = totalShiftRevenue - wagesAndExpenses; // Activation Net

                // --- 3. Bi-Weekly Tracker (Last 14 Days) ---
                // (Logic could be added here if we decide to show the dashboard box for it)

                // --- 3. Calculate Chart Data ---
                // Sales Trend (Last 6 Months)
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const salesHistoryMap = {};

                sales.forEach(sale => {
                    const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
                    if (isNaN(saleDate)) return;
                    const monthName = months[saleDate.getMonth()];
                    const rev = parseFloat(sale.amount) || 0;
                    salesHistoryMap[monthName] = (salesHistoryMap[monthName] || 0) + rev;
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
                const productSalesMap = {};
                sales.forEach(sale => {
                    const items = sale.items || [];
                    items.forEach(item => {
                        productSalesMap[item.name] = (productSalesMap[item.name] || 0) + (parseInt(item.quantity) || 0);
                    });
                });

                const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
                const productMix = Object.entries(productSalesMap)
                    .map(([name, qty]) => ({ name, value: qty }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5) // Top 5
                    .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));

                setFinancials({
                    salesCommissionRevenue: salesRevenue,
                    commissionsAndBonuses: commissionsAndBonuses,
                    quarterlyNet: quarterlyNet,
                    activationRevenue: totalShiftRevenue,
                    wagesAndExpenses: wagesAndExpenses,
                    shiftNet: shiftNet,
                    salesHistory: salesHistory,
                    productMix: productMix
                });

                // User Map
                const map = {};
                const userIds = new Set([...shiftsData.map(s => s.userId), ...salesData.map(s => s.userId || s.repId)]);
                for (const uid of userIds) {
                    if (uid) {
                        const profile = await getUserProfile(uid);
                        map[uid] = profile ? `${profile.firstName} ${profile.lastName}` : uid;
                    }
                }
                setUsersMap(map);

                // --- 4. Sub-Component Prep (Ambassadors) ---
                // Process Stats for Leaderboard
                // (Already handling data in allShifts and sales states)

            } catch (err) {
                console.error("Admin Dashboard Data Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Sub-Component Logic ---
    const toggleShiftSelection = (id) => {
        setSelectedShiftIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedShiftIds.length === shifts.length) {
            setSelectedShiftIds([]);
        } else {
            setSelectedShiftIds(shifts.map(s => s.id));
        }
    };

    const handleMarkAsPaid = async () => {
        if (selectedShiftIds.length === 0) return;
        setProcessing(true);
        try {
            await Promise.all(selectedShiftIds.map(id => updateShiftStatus(id, 'paid')));
            showNotification(`Successfully approved ${selectedShiftIds.length} shifts.`, 'success');

            // Refresh local state
            const updatedShifts = await getAllShifts();
            setAllShifts(updatedShifts);
            setShifts(updatedShifts.filter(s => s.status === 'pending'));
            setSelectedShiftIds([]);
        } catch (err) {
            console.error(err);
            showNotification("Failed to update some shifts.", 'error');
        } finally {
            setProcessing(false);
        }
    };

    const exportPayroll = () => {
        if (shifts.length === 0) return;

        const exportData = shifts.map(s => ({
            Ambassador: usersMap[s.userId] || s.userId,
            Date: new Date(s.date?.toDate ? s.date.toDate() : s.date).toLocaleDateString(),
            Hours: s.hoursWorked,
            Miles: s.milesTraveled,
            Tolls: s.tollAmount,
            Total_Pay: (parseFloat(s.hoursWorked) * HOURLY_RATE) + (parseFloat(s.tollAmount) || 0),
            Status: s.status
        }));

        const csv = convertToCSV(exportData);
        downloadCSV(csv, `payroll-export-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleSyncToHubSpot = async () => {
        const unsyncedLeads = leads.filter(l => !l.syncedToHubspot);
        if (unsyncedLeads.length === 0) {
            showNotification("All leads are already synced!", 'info');
            return;
        }
        if (!confirm(`Attempt to sync ${unsyncedLeads.length} leads to HubSpot?`)) return;

        setProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const lead of unsyncedLeads) {
            const res = await syncLeadToHubSpot(lead);
            if (res.success) successCount++;
            else failCount++;
        }
        showNotification(`Sync Complete: ${successCount} Success, ${failCount} Failed.`, failCount > 0 ? 'warning' : 'success');

        // Refresh leads
        const updatedLeads = await getLeads();
        setLeads(updatedLeads);
        setProcessing(false);
    };

    const handleImport = async () => {
        if (!confirm("Start MASSIVE IMPORT from NY State OCM? This takes time.")) return;
        setProcessing(true);
        const result = await importOfficialDispensaries((c, t, m) => console.log(m));
        if (result.success) {
            showNotification(`Import Successful! Added ${result.count} dispensaries.`, 'success');
            const updatedLeads = await getLeads();
            setLeads(updatedLeads);
        } else {
            showNotification(`Import Failed: ${result.error}`, 'error');
        }
        setProcessing(false);
    };

    const handleAccessBrand = (brandId) => {
        window.location.href = `/brand/login?brandId=${brandId}`;
    };

    // ... Handlers ...

    // ... Render ...

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
                <p className="text-slate-500">Welcome to your new command center.</p>
            </div>

            {/* ROW 1: QUARTERLY SALES PERFORMANCE (COMMISSIONS) */}
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <Award size={16} /> Quarterly Sales & Commissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Sales Gross (5%) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 font-medium mb-1 text-sm">Sales Revenue (5%)</p>
                        <h3 className="text-3xl font-black text-slate-900">${financials.salesCommissionRevenue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <DollarSign size={14} />
                        <span>Gross from Sales</span>
                    </div>
                </div>

                {/* 2. Rep Payouts (Commissions) */}
                <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 font-medium mb-1 text-sm">Rep Commissions</p>
                        <h3 className="text-3xl font-black text-slate-900">${financials.commissionsAndBonuses?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Users size={14} />
                        <span>2% Comm + Bonuses</span>
                    </div>
                </div>

                {/* 3. Quarterly Net Profit (PREMIUM GOLD CARD) */}
                <PremiumStatCard
                    title="Quarterly Net"
                    value={financials.quarterlyNet || 0}
                    icon={Banknote}
                    gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                    subtext="Company Sales Profit"
                    delay={0.2}
                    iconStyle="wiggle"
                />
            </div>

            {/* ROW 2: BI-WEEKLY ACTIVATION PERFORMANCE (WAGES) */}
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <Calendar size={16} /> Activation & Payroll Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Activation Gross */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 font-medium mb-1 text-sm">Activation Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900">${financials.activationRevenue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <DollarSign size={14} />
                        <span>Shift Fees Billed</span>
                    </div>
                </div>

                {/* 2. Rep Wages */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 font-medium mb-1 text-sm">Rep Wages & Expenses</p>
                        <h3 className="text-3xl font-black text-slate-900">${financials.wagesAndExpenses?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Users size={14} />
                        <span>Pay + Miles + Tolls</span>
                    </div>
                </div>

                {/* 3. Activation Net Profit (PREMIUM GREEN CARD) */}
                <PremiumStatCard
                    title="Payroll Net"
                    value={financials.shiftNet || 0}
                    icon={CircleDollarSign}
                    gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                    subtext="Net Profit"
                    delay={0.4}
                    iconStyle="pulse"
                />
            </div>

            {/* ROW 3: VISUAL INSIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Network Sales Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financials.salesHistory}>
                                <defs>
                                    <linearGradient id="colorRevenueAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenueAdmin)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Mix */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                        <PieChart size={18} className="text-indigo-500" />
                        Global Product Mix
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPC>
                                <Pie
                                    data={financials.productMix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {financials.productMix?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    layout="vertical"
                                    align="right"
                                    iconType="circle"
                                />
                            </RechartsPC>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-1 w-fit overflow-x-auto">
                <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<DollarSign size={18} />} label="Payroll Approval" />
                <TabButton active={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')} icon={<Users size={18} />} label="Sales Commissions" />
                <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<FileText size={18} />} label="Lead Export" />
                <TabButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} icon={<Calendar size={18} />} label="Scheduling" />
                <TabButton active={activeTab === 'ambassadors'} onClick={() => setActiveTab('ambassadors')} icon={<Trophy size={18} />} label="Ambassadors" />
                <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Store size={18} />} label="Brand Network" />
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">

                {/* Payroll Tab */}
                {activeTab === 'payroll' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Shift Approvals</h2>
                            <div className="flex gap-3">
                                <button onClick={exportPayroll} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                    <Download size={16} /> Export
                                </button>
                                <button onClick={handleMarkAsPaid} disabled={selectedShiftIds.length === 0 || processing} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50">
                                    {processing ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Approve & Pay ({selectedShiftIds.length})
                                </button>
                            </div>
                        </div>

                        {shifts.length === 0 ? <EmptyState message="No pending shifts found." /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={shifts.length > 0 && selectedShiftIds.length === shifts.length} /></th>
                                            <th className="py-3 px-4">Rep</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-center">Hours</th>
                                            <th className="py-3 px-4 text-center">Miles</th>
                                            <th className="py-3 px-4 text-right">Tolls</th>
                                            <th className="py-3 px-4 text-right">Pay</th>
                                            <th className="py-3 px-4 text-center">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        {shifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4"><input type="checkbox" checked={selectedShiftIds.includes(shift.id)} onChange={() => toggleShiftSelection(shift.id)} /></td>
                                                <td className="py-3 px-4 font-medium text-slate-900">{usersMap[shift.userId] || 'Unknown'}</td>
                                                <td className="py-3 px-4 text-slate-600">{new Date(shift.date?.toDate ? shift.date.toDate() : shift.date).toLocaleDateString()}</td>
                                                <td className="py-3 px-4 text-center">{shift.hoursWorked}</td>
                                                <td className="py-3 px-4 text-center">{shift.milesTraveled}</td>
                                                <td className="py-3 px-4 text-right">${parseFloat(shift.tollAmount || 0).toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-600">${((shift.hoursWorked * HOURLY_RATE) + parseFloat(shift.tollAmount || 0)).toFixed(2)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {shift.tollReceiptImageUrl ? (
                                                        <a href={shift.tollReceiptImageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center justify-center gap-1">View <ExternalLink size={10} /></a>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Commissions Tab */}
                {activeTab === 'commissions' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Rep Compensation Breakdown</h2>
                                <p className="text-sm text-slate-500">Payroll Master List</p>
                            </div>
                        </div>
                        <PayrollMasterList
                            sales={sales}
                            usersMap={usersMap}
                            onMarkRepPaid={async (repId) => {
                                if (!confirm("Mark ALL outstanding commissions for this rep as PAID?")) return;
                                const res = await markRepAsPaid(repId);
                                if (res.success) {
                                    setSales(await getSales());
                                    alert(`Successfully marked ${res.count} items as paid.`);
                                }
                            }}
                            onMarkPaid={async (saleId) => {
                                if (await updateSaleStatus(saleId, 'paid')) {
                                    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'paid' } : s));
                                }
                            }}
                        />
                    </div>
                )}

                {/* Leads Tab */}
                {activeTab === 'leads' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">New Leads</h2>
                                <p className="text-sm text-slate-500">Sync with HubSpot CRM</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleImport} disabled={processing} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                    {processing ? <Loader size={16} className="animate-spin" /> : <Download size={16} />} Import NY Data
                                </button>
                                <button onClick={handleSyncToHubSpot} disabled={processing} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm shadow-orange-200">
                                    {processing ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync HubSpot
                                </button>
                            </div>
                        </div>
                        {leads.length === 0 ? <EmptyState message="No new leads found." /> : (
                            <div className="overflow-x-auto border rounded-xl border-slate-200">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Dispensary</th>
                                            <th className="py-3 px-4">Contact</th>
                                            <th className="py-3 px-4">License</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        {leads.map(lead => (
                                            <tr key={lead.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-medium text-slate-900">{lead.dispensaryName}</td>
                                                <td className="py-3 px-4 text-slate-600">{lead.contactPerson || '-'}</td>
                                                <td className="py-3 px-4 font-mono text-xs text-slate-500">{lead.licenseNumber}</td>
                                                <td className="py-3 px-4">
                                                    {lead.syncedToHubspot ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Synced</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Scheduling Tab */}
                {activeTab === 'scheduling' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Activation Schedule</h2>
                            {/* Modal Trigger Logic Needed Here */}
                        </div>
                        {/* Basic Activation List can go here - placeholder for now to keep size manageable */}
                        <EmptyState message="Scheduling View Under Construction - Use Calendar Page for detailed view." />
                    </div>
                )}

                {/* Ambassadors Tab */}
                {activeTab === 'ambassadors' && (
                    <AmbassadorsTab usersMap={usersMap} allShifts={allShifts} allSales={sales} />
                )}

                {/* Network Tab (Placeholder for Phase 4) */}
                {activeTab === 'network' && (
                    <NetworkTab
                        sales={sales}
                        allShifts={allShifts}
                        leads={leads}
                        handleAccessBrand={handleAccessBrand}
                    />
                )}

            </div>

            {/* Delivery Date Modal */}

        </div>
    );
}

// --- Sub-Components ---

// EmptyState Component
const EmptyState = ({ message }) => (
    <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
            <CheckCircle className="text-slate-300" size={32} />
        </div>
        <p className="text-slate-500 font-medium">{message}</p>
    </div>
);

// Premium Animated Stat Card

const PremiumStatCard = ({ title, value, icon: Icon, gradient, subtext, delay = 0, iconStyle }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.05 }}
            className={`relative p-6 rounded-2xl shadow-lg border border-white/20 select-none overflow-hidden ${gradient} flex items-center justify-between`}
        >
            {/* Glass Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content (Left) */}
            <div className="relative z-10 text-white">
                <h4 className="text-white/80 font-bold uppercase text-xs tracking-wider mb-2">{title}</h4>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black">$</span>
                    <h3 className="text-4xl font-black">
                        {(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    {Icon && <Icon size={12} />}
                    <span>{subtext}</span>
                </div>
            </div>

            {/* Glass Icon Badge (Right) */}
            <motion.div
                className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/30"
                whileHover={
                    iconStyle === 'wiggle' ? { rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } } :
                        iconStyle === 'pulse' ? { scale: [1, 1.15, 1], boxShadow: "0 0 25px rgba(255,255,255,0.6)", transition: { duration: 0.8, repeat: Infinity } } :
                            {}
                }
            >
                {Icon && <Icon size={48} className="text-white" strokeWidth={1.5} />}
            </motion.div>
        </motion.div >
    );
};

// Network Tab Component
function NetworkTab({ sales, allShifts, leads, handleAccessBrand }) {
    const [expandedBrand, setExpandedBrand] = useState(null);
    const [brandMetrics, setBrandMetrics] = useState({});

    // Calculate Metrics on Mount
    useEffect(() => {
        const metrics = {};

        Object.values(BRAND_LICENSES).forEach(brand => {
            const bid = brand.brandId;
            // Filter Data for this Brand
            const brandSpecificSales = sales.filter(s => {
                if (s.brandId === bid) return true;
                return s.items?.some(i => i.brandId === bid || i.name.includes(brand.brandName));
            });

            const revenue = brandSpecificSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const commissionOwed = revenue * 0.05;
            const activationCosts = 0; // Placeholder

            const orderCount = brandSpecificSales.length;
            const aov = orderCount > 0 ? revenue / orderCount : 0;

            // Top Product
            const productCounts = {};
            brandSpecificSales.forEach(s => {
                s.items?.forEach(i => {
                    productCounts[i.name] = (productCounts[i.name] || 0) + (parseInt(i.quantity) || 0);
                });
            });
            const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

            metrics[bid] = {
                revenue,
                commissionOwed,
                activationCosts,
                orderCount,
                aov,
                topProduct: topProduct ? `${topProduct[0]} (${topProduct[1]})` : 'N/A',
                outstandingInvoices: 0
            };
        });
        setBrandMetrics(metrics);
    }, [sales, allShifts]);

    const formatCurrency = (val) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Brand Network</h2>
                    <p className="text-sm text-slate-500">Manage partners & oversight</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Object.values(BRAND_LICENSES).map(brand => {
                    const stats = brandMetrics[brand.brandId] || { revenue: 0, commissionOwed: 0, orderCount: 0 };
                    const isExpanded = expandedBrand === brand.brandId;

                    return (
                        <div key={brand.brandId} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                            {/* Card Header */}
                            <div className="p-6 cursor-pointer" onClick={() => setExpandedBrand(isExpanded ? null : brand.brandId)}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xl">
                                            {brand.brandName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{brand.brandName}</h3>
                                            <p className="text-sm text-slate-500 font-mono">ID: {brand.brandId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAccessBrand(brand.brandId);
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <Shield size={14} /> Access Dashboard
                                        </button>
                                        <div className="p-2">
                                            {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                                        <p className="text-lg font-bold text-slate-800">{formatCurrency(stats.revenue)}</p>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg">
                                        <p className="text-xs text-amber-700 mb-1">Commission (5%)</p>
                                        <p className="text-lg font-bold text-amber-800">{formatCurrency(stats.commissionOwed)}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-lg">
                                        <p className="text-xs text-emerald-700 mb-1">Orders</p>
                                        <p className="text-lg font-bold text-emerald-800">{stats.orderCount}</p>
                                    </div>
                                    <div className="bg-indigo-50 p-3 rounded-lg">
                                        <p className="text-xs text-indigo-700 mb-1">AOV</p>
                                        <p className="text-lg font-bold text-indigo-800">{formatCurrency(stats.aov)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-fadeIn">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={16} /> Performance Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <p className="text-sm text-slate-500 mb-1">Top Selling Product</p>
                                            <p className="text-lg font-bold text-slate-900">{stats.topProduct}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <p className="text-sm text-slate-500 mb-1">Net Balance (Est)</p>
                                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.revenue - stats.commissionOwed - stats.activationCosts)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Payroll Master List Component
const PayrollMasterList = ({ sales, usersMap, onMarkPaid, onMarkRepPaid }) => {
    const pendingSales = sales.filter(s => s.status !== 'paid');

    const grouped = {};
    pendingSales.forEach(s => {
        const name = usersMap[s.userId] || 'Unknown';
        if (!grouped[name]) {
            grouped[name] = { totalDue: 0, items: [], userId: s.userId };
        }
        const comm = parseFloat(s.commissionEarned) || 0;
        grouped[name].totalDue += comm;
        grouped[name].items.push(s);
    });

    const repNames = Object.keys(grouped);

    if (repNames.length === 0) return <EmptyState message="All caught up! No commissions due." />;

    return (
        <div className="space-y-4">
            {repNames.map(name => (
                <PayrollAccordionItem
                    key={name}
                    name={name}
                    data={grouped[name]}
                    onMarkPaid={onMarkPaid}
                    onMarkRepPaid={onMarkRepPaid}
                />
            ))}
        </div>
    );
};

const PayrollAccordionItem = ({ name, data, onMarkPaid, onMarkRepPaid }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${expanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{name}</h3>
                        <p className="text-slate-500 text-sm">{data.items.length} pending deals</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Due</p>
                    <p className="text-2xl font-bold text-slate-900">${data.totalDue.toFixed(2)}</p>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fadeIn">
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMarkRepPaid) onMarkRepPaid(data.userId);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <CheckCircle size={16} /> Mark Payout Complete
                        </button>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-slate-400 uppercase tracking-wider font-medium border-b border-slate-200">
                            <tr>
                                <th className="pb-2 pl-2">Date</th>
                                <th className="pb-2">Dispensary</th>
                                <th className="pb-2 text-right">Value</th>
                                <th className="pb-2 text-right">Comm.</th>
                                <th className="pb-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.items.map(item => (
                                <tr key={item.id} className="hover:bg-white transition-colors">
                                    <td className="py-3 pl-2 text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="py-3 font-medium text-slate-800">{item.dispensaryName}</td>
                                    <td className="py-3 text-right text-slate-600">${(parseFloat(item.amount) || 0).toFixed(2)}</td>
                                    <td className="py-3 text-right text-emerald-600 font-bold">${(parseFloat(item.commissionEarned) || 0).toFixed(2)}</td>
                                    <td className="py-3 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkPaid(item.id);
                                            }}
                                            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            Paid
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Ambassadors Tab Component
function AmbassadorsTab({ usersMap, allShifts, allSales }) {
    const stats = React.useMemo(() => {
        const map = {};
        Object.keys(usersMap).forEach(uid => {
            map[uid] = {
                id: uid,
                name: usersMap[uid],
                totalSales: 0,
                totalCommission: 0,
                activationCount: 0,
                totalHours: 0,
                lastActive: new Date(0)
            };
        });

        allSales.forEach(sale => {
            const uid = sale.userId || sale.repId;
            if (!uid) return;
            if (!map[uid]) map[uid] = { id: uid, name: usersMap[uid] || 'Unknown', totalSales: 0, totalCommission: 0, activationCount: 0, totalHours: 0, lastActive: new Date(0) };

            const amount = parseFloat(sale.amount) || 0;
            map[uid].totalSales += amount;
            map[uid].totalCommission += (amount * 0.02);

            const date = new Date(sale.date);
            if (!isNaN(date) && date > map[uid].lastActive) map[uid].lastActive = date;
        });

        allShifts.forEach(shift => {
            const uid = shift.userId;
            if (!uid) return;
            if (!map[uid]) map[uid] = { id: uid, name: usersMap[uid] || 'Unknown', totalSales: 0, totalCommission: 0, activationCount: 0, totalHours: 0, lastActive: new Date(0) };

            map[uid].activationCount += 1;
            map[uid].totalHours += parseFloat(shift.hoursWorked) || 0;

            const date = shift.date?.toDate ? shift.date.toDate() : new Date(shift.date || shift.startTime);
            if (!isNaN(date) && date > map[uid].lastActive) map[uid].lastActive = date;
        });

        return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
    }, [usersMap, allShifts, allSales]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Team Performance</h2>
                    <p className="text-sm text-slate-500">Sales Representatives Leaderboard</p>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200">
                <table className="w-full text-left bg-white">
                    <thead className="bg-slate-50">
                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">Ambassador</th>
                            <th className="py-3 px-4 text-center">Activations</th>
                            <th className="py-3 px-4 text-center">Hours</th>
                            <th className="py-3 px-4 text-right">Total Sales</th>
                            <th className="py-3 px-4 text-right">Commissions (2%)</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                        {stats.map((rep, idx) => (
                            <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                                            {idx < 3 ? <Trophy size={14} /> : idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">{rep.name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center text-slate-600">{rep.activationCount}</td>
                                <td className="py-3 px-4 text-center text-slate-600">{rep.totalHours.toFixed(1)}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-600">${rep.totalSales.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-slate-600 font-mono">${rep.totalCommission.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


