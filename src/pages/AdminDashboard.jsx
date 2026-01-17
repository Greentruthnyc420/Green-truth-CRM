import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { useBrandAuth, BRAND_LICENSES, AVAILABLE_BRANDS } from '../contexts/BrandAuthContext';
import { useNotification } from '../contexts/NotificationContext';
// Imports
import {
    getAllShifts,
    updateShiftStatus,
    getSales,
    getLeads,
    getUserProfile,
    updateSaleStatus,
    markRepAsPaid,
    seedBrands,
    getActivations,

} from '../services/firestoreService';
import NewActivationModal from '../components/NewActivationModal';
// eslint-disable-next-line no-unused-vars
import { calculateTotalLifetimeBonuses, calculateReimbursement, calculateShiftClientRevenue } from '../services/compensationService';
import { syncLeadToHubSpot } from '../services/hubspotService';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';
import { importOfficialDispensaries } from '../services/dataSyncService';
import {
    DollarSign,
    Users,
    FileText,
    CheckCircle,
    ExternalLink,
    Loader,
    Download,
    AlertTriangle,
    RefreshCw,
    Award,
    ChevronDown,
    ChevronUp,
    BarChart,
    Calendar,
    HandCoins,
    Crown,
    Store,
    Shield,
    CircleDollarSign,
    Banknote,
    Plus,
    MapPin,
    Tag,
    Clock,
    BarChart3,
    TrendingUp,
    PieChart,

} from 'lucide-react';
import { Trophy } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'; // Animation Lib
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart as RechartsBarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';



const HOURLY_RATE = 20;

export default function AdminDashboard() {
    const { impersonateBrand, logoutBrand, brandUser } = useBrandAuth(); // New Hook Usage
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('payroll');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedBrandId, setSelectedBrandId] = useState('all');



    // Data States
    const [shifts, setShifts] = useState([]);
    const [allShiftsData, setAllShiftsData] = useState([]); // Store all shifts for history/stats
    const [sales, setSales] = useState([]);
    const [leads, setLeads] = useState([]);
    const [usersMap, setUsersMap] = useState({}); // userId -> name map
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);
    const [userBonusMap, setUserBonusMap] = useState({}); // New State for Bonus Map
    const [activations, setActivations] = useState([]);
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

    // Financial Metrics State
    const [financials, setFinancials] = useState({
        totalSalesVolume: 0,
        activationRevenue: 0, // Pop-ups
        salesCommissionRevenue: 0, // 5%
        wagesAndExpenses: 0,
        commissionsAndBonuses: 0,
        companyNet: 0,
        projectedPayroll: 0,
        biWeeklyGross: 0,
        biWeeklyNet: 0,
        quarterlyNet: 0, // Sales Net
        shiftNet: 0,      // Anctivation Net
        salesHistory: [],
        productMix: []
    });

    // Security Check
    useEffect(() => {
        if (!loading && (!currentUser || !ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()))) {
            navigate('/');
        }
    }, [currentUser, loading, navigate]);

    // Data Fetching
    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [allShifts, allSales, allLeads, allActivations] = await Promise.all([
                    getAllShifts(),
                    getSales(),
                    getLeads(),
                    getActivations()
                ]);

                // Seed Brands (Quick Setup)
                seedBrands();

                // Pending Shifts
                const pending = allShifts.filter(s => s.status === 'pending');
                setShifts(pending);
                setAllShiftsData(allShifts);

                // Sales
                setSales(allSales);

                // Leads
                setLeads(allLeads);

                // Activations
                setActivations(allActivations);

                // --- Calculate Store Counts for Bonuses ---
                const userStoreSets = {};
                const addStore = (uid, name) => {
                    if (!uid || !name) return;
                    if (!userStoreSets[uid]) userStoreSets[uid] = new Set();
                    userStoreSets[uid].add(name);
                };

                allShifts.forEach(s => addStore(s.userId, s.dispensaryName));
                allSales.forEach(s => addStore(s.userId, s.dispensaryName));
                allLeads.forEach(l => addStore(l.userId, l.dispensaryName));

                let totalBonuses = 0;
                const bonusMap = {}; // userId -> bonus amount

                Object.keys(userStoreSets).forEach(uid => {
                    const count = userStoreSets[uid].size;
                    const bonus = calculateTotalLifetimeBonuses(count);
                    if (bonus > 0) {
                        bonusMap[uid] = bonus;
                        totalBonuses += bonus;
                    }
                });
                setUserBonusMap(bonusMap);
                // ------------------------------------------

                // --- Calculate Financials ---
                const totalSales = allSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

                // 1. Shift Revenue & Costs
                let totalShiftRevenue = 0;
                let totalShiftWages = 0;
                let totalShiftReimbursements = 0;

                allShifts.forEach(s => {
                    const rev = calculateShiftClientRevenue(s);
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

                // 2. Sales Revenue (5% Gross)
                const salesRevenue = totalSales * 0.05;

                // 3. Company Gross = Shift Fees + Sales Commission (5%)
                const companyGross = totalShiftRevenue + salesRevenue;

                // 4. Rep Payouts Split
                const salesCommissions = totalSales * 0.02;
                const wagesAndExpenses = totalShiftWages + totalShiftReimbursements;
                const commissionsAndBonuses = salesCommissions + totalBonuses;
                const totalRepPayout = wagesAndExpenses + commissionsAndBonuses;

                // 5. Net Profit (Real Logic as requested)
                // quarterlyNet is purely the 3% margin from sales
                const quarterlyNet = salesRevenue - salesCommissions;

                // shiftNet is the profit from activations (Fees - Rep Cost)
                const shiftNet = totalShiftRevenue - wagesAndExpenses;

                // companyNet is the TOTAL profit including all revenue and minus ALL outflows (wages, comms, bonuses)
                const companyNet = (totalShiftRevenue + salesRevenue) - (wagesAndExpenses + commissionsAndBonuses);

                // Needed for Project Payroll Box (Pending Shifts Only)
                let payrollTotal = 0;
                pending.forEach(s => {
                    const wage = (parseFloat(s.hoursWorked) || 0) * HOURLY_RATE;
                    const reimbursement = calculateReimbursement(
                        parseFloat(s.milesTraveled),
                        parseFloat(s.tollAmount),
                        s.hasVehicle !== false
                    );
                    payrollTotal += (wage + reimbursement);
                });

                // 6. Bi-Weekly Tracker (Last 14 Days)
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                const recentSales = allSales.filter(s => new Date(s.date) >= twoWeeksAgo);
                const recentShifts = allShifts.filter(s => new Date(s.date || s.startTime) >= twoWeeksAgo);

                // Calculate gross revenue for last 2 weeks
                const biWeeklySalesRevenue = recentSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) * 0.05;
                const biWeeklyShiftRevenue = recentShifts.reduce((sum, s) => sum + calculateShiftClientRevenue(s), 0);
                const biWeeklyGross = biWeeklySalesRevenue + biWeeklyShiftRevenue;

                // Calculate payouts for last 2 weeks
                const biWeeklyRepComm = recentSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0) * 0.02;
                const biWeeklyWages = recentShifts.reduce((sum, s) => sum + ((parseFloat(s.hoursWorked) || 0) * HOURLY_RATE) + calculateReimbursement(parseFloat(s.milesTraveled), parseFloat(s.tollAmount), s.hasVehicle !== false), 0);
                const biWeeklyPayouts = biWeeklyRepComm + biWeeklyWages;

                const biWeeklyNet = biWeeklyGross - biWeeklyPayouts;


                setFinancials({
                    totalSalesVolume: totalSales,
                    activationRevenue: totalShiftRevenue,
                    salesCommissionRevenue: salesRevenue,
                    wagesAndExpenses,
                    commissionsAndBonuses,
                    companyNet,
                    projectedPayroll: payrollTotal,
                    biWeeklyGross,
                    biWeeklyNet,
                    quarterlyNet,
                    shiftNet,
                    salesHistory: [], // Will populate below
                    productMix: []    // Will populate below
                });

                // --- Calculate Chart Data (Filtered if needed) ---
                const filteredSales = selectedBrandId === 'all'
                    ? allSales
                    : allSales.filter(sale => sale.items?.some(i => i.brandId === selectedBrandId));

                // 1. Sales History
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const salesHistoryMap = {};

                filteredSales.forEach(sale => {
                    const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
                    const monthName = months[saleDate.getMonth()];

                    let revenue = 0;
                    if (selectedBrandId === 'all') {
                        revenue = parseFloat(sale.amount) || 0;
                    } else {
                        revenue = sale.items
                            ?.filter(i => i.brandId === selectedBrandId)
                            .reduce((sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity) || 0), 0) || 0;
                    }

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

                // 2. Product Mix
                const productSalesMap = {};
                filteredSales.forEach(sale => {
                    const items = selectedBrandId === 'all'
                        ? (sale.items || [])
                        : (sale.items || []).filter(i => i.brandId === selectedBrandId);

                    items.forEach(item => {
                        productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
                    });
                });

                const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
                const productMix = Object.entries(productSalesMap)
                    .map(([name, qty]) => ({ name, value: qty }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));

                // Update financials with chart data
                setFinancials(prev => ({ ...prev, salesHistory, productMix }));
                // -----------------------------

                // Build User Map
                const userIds = new Set([
                    ...allShifts.map(s => s.userId),
                    ...allSales.map(s => s.userId || s.repId)
                ]);

                const map = {};
                for (const uid of userIds) {
                    if (uid) {
                        const profile = await getUserProfile(uid);
                        map[uid] = profile
                            ? `${profile.firstName} ${profile.lastName}`
                            : (uid === 'test-user-123' ? 'Test User' : uid);
                    }
                }
                setUsersMap(map);

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Handlers
    const handleMarkAsPaid = async () => {
        if (selectedShiftIds.length === 0) return;
        if (!confirm(`Mark ${selectedShiftIds.length} shifts as PAID? This cannot be undone.`)) return;

        setProcessing(true);
        try {
            await Promise.all(selectedShiftIds.map(id => updateShiftStatus(id, 'paid')));

            // Remove from local state
            setShifts(prev => prev.filter(s => !selectedShiftIds.includes(s.id)));
            setSelectedShiftIds([]);
            showNotification(`${selectedShiftIds.length} shifts marked as paid`, 'success');
        } catch (error) {
            console.error("Error processing payments:", error);
            showNotification("Failed to update status for some shifts.", 'error');
        } finally {
            setProcessing(false);
        }
    };



    const handleSyncToHubSpot = async () => {
        const unsyncedLeads = leads.filter(l => !l.syncedToHubspot);
        if (unsyncedLeads.length === 0) {
            showNotification("All leads are already synced!", 'info');
            return;
        }

        if (!confirm(`Attempt to sync ${unsyncedLeads.length} leads to HubSpot?`)) return;

        setSyncing(true);
        let successCount = 0;
        let failCount = 0;

        for (const lead of unsyncedLeads) {
            const res = await syncLeadToHubSpot(lead);
            if (res.success) {
                successCount++;
            } else {
                failCount++;
                console.warn(`Failed to sync lead ${lead.dispensaryName}:`, res.error);
            }
        }

        showNotification(`Sync Complete: ${successCount} Success, ${failCount} Failed.`, failCount > 0 ? 'warning' : 'success');

        // Refresh leads
        const updatedLeads = await getLeads();
        setLeads(updatedLeads);
        setSyncing(false);
    };

    const toggleShiftSelection = (id) => {
        setSelectedShiftIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedShiftIds.length === shifts.length) {
            setSelectedShiftIds([]);
        } else {
            setSelectedShiftIds(shifts.map(s => s.id));
        }
    };

    const handleAccessBrand = (brandId) => {
        try {
            impersonateBrand(brandId, window.location.pathname); // Set Ghost User with return path
            navigate('/brand'); // Go to Portal
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Exports
    const exportPayroll = () => {
        const data = shifts.map(s => ({
            Name: usersMap[s.userId] || s.userId,
            Date: s.date?.toDate ? s.date.toDate().toLocaleDateString() : new Date(s.date || s.startTime).toLocaleDateString(),
            Hours: s.hoursWorked,
            Rate: `$${HOURLY_RATE}`,
            Miles: s.milesTraveled,
            Tolls: s.tollAmount,
            TotalPay: (s.hoursWorked * HOURLY_RATE + (parseFloat(s.tollAmount) || 0)).toFixed(2)
        }));
        downloadCSV(convertToCSV(data), `payroll_export_${new Date().toISOString().split('T')[0]}.csv`);
    };



    const exportLeadsHubSpot = () => {
        const data = leads.map(l => ({
            'First Name': l.contactPerson?.split(' ')[0] || '',
            'Last Name': l.contactPerson?.split(' ').slice(1).join(' ') || '',
            'Company Name': l.dispensaryName,
            'Email': l.email || '', // Assuming email field exists or will differ
            'License Number': l.licenseNumber,
            'Meeting Date': l.meetingDate,
            'Interested Products': Array.isArray(l.brands) ? l.brands.join(';') : l.brands
        }));
        downloadCSV(convertToCSV(data), `hubspot_leads_${new Date().toISOString().split('T')[0]}.csv`);
    };



    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });

    const handleImport = async () => {
        if (!confirm("Start MASSIVE IMPORT from NY State OCM? \n\n⚠️ NOTE: This will take several minutes as we geocode each location securely.")) return;

        setImporting(true);
        setImportProgress({ current: 0, total: 0, message: 'Starting...' });

        const result = await importOfficialDispensaries((current, total, message) => {
            setImportProgress({ current, total, message });
        });

        setImporting(false);
        setImportProgress({ current: 0, total: 0, message: '' });

        if (result.success) {
            showNotification(`Import Successful! Added/Updated ${result.count} dispensaries.`, 'success');
            // Refresh
            const updatedLeads = await getLeads();
            setLeads(updatedLeads);
        } else {
            showNotification(`Import Failed: ${result.error}`, 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader className="animate-spin text-brand-600 mx-auto mb-4" size={40} />
                    <p className="text-slate-500">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">Manage payroll, commissions, and team performance.</p>
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
                        <h3 className="text-3xl font-black text-slate-900">${financials.salesCommissionRevenue.toFixed(2)}</h3>
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
                        <h3 className="text-3xl font-black text-slate-900">${financials.commissionsAndBonuses.toFixed(2)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Users size={14} />
                        <span>2% Comm + Bonuses</span>
                    </div>
                </div>

                {/* 3. Quarterly Net Profit (PREMIUM GOLD CARD) */}
                <PremiumStatCard
                    title="Quarterly Net"
                    value={financials.quarterlyNet}
                    icon={Banknote} // Updated Icon
                    gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                    subtext="Company Sales Profit"
                    delay={0.2}
                    iconStyle="wiggle" // New Prop for Animation
                />
            </div>

            {/* ROW 2: BI-WEEKLY ACTIVATION PERFORMANCE (WAGES) */}
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <Calendar size={16} /> Bi-Weekly Activations & Payroll
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Activation Gross */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 font-medium mb-1 text-sm">Activation Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900">${financials.activationRevenue.toFixed(2)}</h3>
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
                        <h3 className="text-3xl font-black text-slate-900">${financials.wagesAndExpenses.toFixed(2)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Users size={14} />
                        <span>Pay + Miles + Tolls</span>
                    </div>
                </div>

                {/* 3. Activation Net Profit (PREMIUM GREEN CARD) */}
                <PremiumStatCard
                    title="Payroll Net"
                    value={financials.shiftNet}
                    icon={CircleDollarSign} // Updated Icon
                    gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                    subtext="Net Profit" // Updated Text
                    delay={0.4}
                    iconStyle="pulse" // New Animation
                />
            </div>

            {/* ROW 3: NETWORK ANALYTICS */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <BarChart3 size={16} /> {selectedBrandId === 'all' ? 'Network' : BRAND_LICENSES[Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === selectedBrandId)]?.brandName} Performance
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Filter Brand:</span>
                    <select
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-600"
                    >
                        <option value="all">All Brands (Network)</option>
                        {Object.values(BRAND_LICENSES).map(brand => (
                            <option key={brand.brandId} value={brand.brandId}>{brand.brandName}</option>
                        ))}
                    </select>
                </div>
            </div>
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
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-1 w-fit">
                <TabButton
                    active={activeTab === 'payroll'}
                    onClick={() => setActiveTab('payroll')}
                    icon={<DollarSign size={18} />}
                    label="Payroll Approval"
                />
                <TabButton
                    active={activeTab === 'commissions'}
                    onClick={() => setActiveTab('commissions')}
                    icon={<Users size={18} />}
                    label="Sales Commissions"
                />
                <TabButton
                    active={activeTab === 'partners'}
                    onClick={() => setActiveTab('partners')}
                    icon={<Store size={18} />}
                    label="Partner Brands"
                />
                <TabButton
                    active={activeTab === 'leads'}
                    onClick={() => setActiveTab('leads')}
                    icon={<FileText size={18} />}
                    label="Lead Export"
                />
                <TabButton
                    active={activeTab === 'scheduling'}
                    onClick={() => setActiveTab('scheduling')}
                    icon={<Calendar size={18} />}
                    label="Scheduling"
                />
                <TabButton
                    active={activeTab === 'ambassadors'}
                    onClick={() => setActiveTab('ambassadors')}
                    icon={<Trophy size={18} />}
                    label="Ambassadors"
                />

            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">

                {/* Payroll Tab */}
                {activeTab === 'payroll' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Pending Shifts</h2>
                                <p className="text-sm text-slate-500">{shifts.length} shifts waiting for approval</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={exportPayroll}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                                <button
                                    onClick={handleMarkAsPaid}
                                    disabled={selectedShiftIds.length === 0 || processing}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Mark Selected as Paid
                                </button>
                            </div>
                        </div>

                        {shifts.length === 0 ? (
                            <EmptyState message="No pending shifts found. All caught up!" />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4 w-10">
                                                <input type="checkbox" onChange={toggleSelectAll} checked={selectedShiftIds.length === shifts.length} />
                                            </th>
                                            <th className="py-3 px-4">Ambassador</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-center">Hours</th>
                                            <th className="py-3 px-4 text-center">Miles</th>
                                            <th className="py-3 px-4 text-right">Tolls</th>
                                            <th className="py-3 px-4 text-right">Total Pay</th>
                                            <th className="py-3 px-4 text-center">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {shifts.map(shift => {
                                            const shiftDate = shift.date?.toDate ? shift.date.toDate() : new Date(shift.date || shift.startTime);
                                            const totalPay = (shift.hoursWorked || 0) * HOURLY_RATE + (parseFloat(shift.tollAmount) || 0);

                                            return (
                                                <tr key={shift.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedShiftIds.includes(shift.id)}
                                                            onChange={() => toggleShiftSelection(shift.id)}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-slate-700">
                                                        {usersMap[shift.userId] || 'Unknown'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        {shiftDate.toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-600">
                                                        {shift.hoursWorked || 0}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-600">
                                                        {shift.milesTraveled || 0}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                                                        ${(parseFloat(shift.tollAmount) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-green-600 font-mono">
                                                        ${totalPay.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {shift.tollReceiptImageUrl ? (
                                                            <a
                                                                href={shift.tollReceiptImageUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-xs font-medium"
                                                            >
                                                                View <ExternalLink size={12} />
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Commissions / Payroll Master List Tab */}
                {activeTab === 'commissions' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Rep Compensation Breakdown</h2>
                                <p className="text-sm text-slate-500">Payroll Master List</p>
                            </div>
                        </div>
                        {/* Payroll Master Accordion */}
                        <PayrollMasterList
                            sales={sales}
                            usersMap={usersMap}
                            bonusMap={userBonusMap}
                            // Handler for paying everything for a specific rep
                            onMarkRepPaid={async (repId) => {
                                if (!repId) return;
                                if (!confirm("Mark ALL outstanding commissions for this rep as PAID?")) return;

                                const res = await markRepAsPaid(repId);
                                if (res.success) {
                                    // Refresh all sales to be safe
                                    const allSales = await getSales();
                                    setSales(allSales);
                                    alert(`Successfully marked ${res.count} items as paid.`);
                                } else {
                                    alert("Failed to update.");
                                }
                            }}
                            // Pass a reload function to refresh data after payment
                            onMarkPaid={async (saleId) => {
                                const success = await updateSaleStatus(saleId, 'paid');
                                if (success) {
                                    // Manually update local state to hide item
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
                                <button
                                    onClick={handleImport}
                                    disabled={loading || importing}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium relative overflow-hidden"
                                >
                                    {importing && (
                                        <div
                                            className="absolute inset-0 bg-emerald-100 opacity-50 transition-all duration-300"
                                            style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {importing ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                        {importing
                                            ? `Importing (${importProgress.current}/${importProgress.total})`
                                            : "Import Official NY Data"
                                        }
                                    </span>
                                </button>
                                <button
                                    onClick={exportLeadsHubSpot}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                                <button
                                    onClick={handleSyncToHubSpot}
                                    disabled={syncing}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm shadow-orange-200 disabled:opacity-50"
                                >
                                    {syncing ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    Sync to HubSpot
                                </button>
                            </div>
                        </div>

                        {leads.length === 0 ? (
                            <EmptyState message="No new leads found." />
                        ) : (
                            <div className="overflow-x-auto border rounded-xl border-slate-200">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Contact</th>
                                            <th className="py-3 px-4">Company</th>
                                            <th className="py-3 px-4">License #</th>
                                            <th className="py-3 px-4">Interest</th>
                                            <th className="py-3 px-4 text-center">HubSpot Synced</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        {leads.map(lead => (
                                            <tr key={lead.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 text-slate-900 font-medium">
                                                    {lead.contactPerson || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">{lead.dispensaryName}</td>
                                                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{lead.licenseNumber}</td>
                                                <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                                    {Array.isArray(lead.brands) ? lead.brands.join(', ') : lead.brands}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {lead.syncedToHubspot ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <CheckCircle size={12} /> Synced
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                            Pending
                                                        </span>
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

                {/* Ambassadors Tab (Rep Tracking) */}
                {activeTab === 'ambassadors' && (
                    <AmbassadorsTab
                        usersMap={usersMap}
                        allShifts={allShiftsData}
                        allSales={sales}
                    />
                )}

                {/* Partners Tab (Admin Backdoor) */}
                {activeTab === 'partners' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Partner Brands</h2>
                                <p className="text-sm text-slate-500">Manage brand access and settings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(AVAILABLE_BRANDS).map((brand) => (
                                <div key={brand.brandId} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-slate-400">
                                        {brand.brandName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1">{brand.brandName}</h3>
                                    <p className="text-xs text-slate-500 font-mono mb-4 bg-slate-50 px-2 py-1 rounded">
                                        {brand.brandId}
                                    </p>

                                    <button
                                        onClick={() => handleAccessBrand(brand.brandId)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold"
                                    >
                                        <Shield size={16} />
                                        Access Dashboard
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scheduling Tab */}
                {activeTab === 'scheduling' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Activation Schedule</h1>
                                <p className="text-sm text-slate-500">Scheduled events and rep assignments</p>
                            </div>
                            <button
                                onClick={() => setIsActivationModalOpen(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
                            >
                                <Plus size={18} />
                                Schedule Activation
                            </button>
                        </div>

                        {activations.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No scheduled activations</h3>
                                <p className="text-slate-500 mb-6">Start by scheduling an invitation for a rep.</p>
                                <button
                                    onClick={() => setIsActivationModalOpen(true)}
                                    className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors"
                                >
                                    Schedule First Event
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activations.map(act => (
                                    <div key={act.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                                                <Store size={20} />
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${act.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                {act.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{act.storeName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                            <MapPin size={14} />
                                            <span className="truncate">{act.address}</span>
                                        </div>

                                        <div className="space-y-3 pt-3 border-t border-slate-50">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 flex items-center gap-2"><Tag size={14} /> Brand</span>
                                                <span className="font-bold text-slate-800">{act.brandName}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 flex items-center gap-2"><Users size={14} /> Assigned Rep</span>
                                                <span className="font-bold text-brand-700">{act.repName}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 flex items-center gap-2"><Clock size={14} /> Time</span>
                                                <span className="font-medium text-slate-700">
                                                    {new Date(act.startISO).toLocaleDateString()} @ {new Date(act.startISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {act.googleEventId && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                                <Calendar size={12} />
                                                ID: {act.googleEventId}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}



            </div>

            <NewActivationModal
                isOpen={isActivationModalOpen}
                onClose={() => setIsActivationModalOpen(false)}
                onSave={() => {
                    // Simple refresh - ideally re-fetch only activations
                    window.location.reload();
                }}
                leads={leads}
            />
        </div>
    );
}

// Sub-components for cleaner code
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
    >
        {icon}
        {label}
    </button>
);

const EmptyState = ({ message }) => (
    <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
            <CheckCircle className="text-slate-300" size={32} />
        </div>
        <p className="text-slate-500 font-medium">{message}</p>
    </div>
);

const PayrollMasterList = ({ sales, usersMap, onMarkPaid, onMarkRepPaid }) => { // Removed bonusMap
    // Filter out already PAID items
    const pendingSales = sales.filter(s => s.status !== 'paid');

    // Group by User
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
            {/* Header / Summary */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${expanded ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
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

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fadeIn">
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMarkRepPaid) onMarkRepPaid(data.userId);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <CheckCircle size={16} /> Mark Payout Complete
                        </button>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-slate-400 uppercase tracking-wider font-medium border-b border-slate-200">
                            <tr>
                                <th className="pb-2 pl-2">Date</th>
                                <th className="pb-2">Customer / Dispensary</th>
                                <th className="pb-2 text-right">Deal Value</th>
                                <th className="pb-2 text-center">Inv.</th>
                                <th className="pb-2 text-right">Commission</th>
                                <th className="pb-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.items.map(item => (
                                <tr key={item.id} className="hover:bg-white transition-colors">
                                    <td className="py-3 pl-2 text-slate-600">
                                        {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 font-medium text-slate-800">
                                        {item.dispensaryName || 'Unknown'}
                                    </td>
                                    <td className="py-3 text-right text-slate-600 font-mono">
                                        ${(parseFloat(item.amount) || 0).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-right text-green-600 font-bold font-mono">
                                        ${(parseFloat(item.commissionEarned) || 0).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkPaid(item.id);
                                            }}
                                            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all font-medium"
                                        >
                                            Mark Paid
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

// Premium Animated Stat Card
// Premium Animated Stat Card
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
                    <motion.h3 className="text-4xl font-black">
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
                className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/30"
                whileHover={
                    iconStyle === 'wiggle' ? { rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } } :
                        iconStyle === 'pulse' ? { scale: [1, 1.15, 1], boxShadow: "0 0 25px rgba(255,255,255,0.6)", transition: { duration: 0.8, repeat: Infinity } } :
                            {}
                }
            >
                {Icon && <Icon size={48} className="text-white" strokeWidth={1.5} />}
            </motion.div>

            {/* Background Decoration (Optional, subtle) */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                {/* Removed the giant icon to focus on the Badge */}
            </div>
        </motion.div >
    );
};

function AmbassadorsTab({ usersMap, allShifts, allSales }) {
    // Aggregate Stats
    const stats = React.useMemo(() => {
        const map = {};

        // Initialize with known users
        Object.keys(usersMap).forEach(uid => {
            map[uid] = {
                id: uid,
                name: usersMap[uid],
                totalSales: 0,
                totalCommission: 0,
                activationCount: 0,
                totalHours: 0,
                lastActive: new Date(0) // Epoch
            };
        });

        // Process Sales
        allSales.forEach(sale => {
            const uid = sale.userId || sale.repId;
            if (!uid) return;
            if (!map[uid]) {
                map[uid] = { id: uid, name: usersMap[uid] || 'Unknown', totalSales: 0, totalCommission: 0, activationCount: 0, totalHours: 0, lastActive: new Date(0) };
            }

            const amount = parseFloat(sale.amount) || 0;
            map[uid].totalSales += amount;
            map[uid].totalCommission += (amount * 0.02); // 2%

            const date = new Date(sale.date); // Allow invalid date check?
            if (!isNaN(date) && date > map[uid].lastActive) map[uid].lastActive = date;
        });

        // Process Shifts
        allShifts.forEach(shift => {
            const uid = shift.userId;
            if (!uid) return;
            if (!map[uid]) {
                map[uid] = { id: uid, name: usersMap[uid] || 'Unknown', totalSales: 0, totalCommission: 0, activationCount: 0, totalHours: 0, lastActive: new Date(0) };
            }

            map[uid].activationCount += 1;
            map[uid].totalHours += parseFloat(shift.hoursWorked) || 0;

            const date = shift.date?.toDate ? shift.date.toDate() : new Date(shift.date || shift.startTime);
            if (!isNaN(date) && date > map[uid].lastActive) map[uid].lastActive = date;
        });

        // Sort by Total Sales Descending
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
                            <th className="py-3 px-4 text-right">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                        {stats.map((rep, idx) => (
                            <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500 shadow-sm' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                                            {idx < 3 ? <Trophy size={14} /> : idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">{rep.name}</p>
                                            <p className="text-xs text-slate-400 font-mono">{rep.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center text-slate-600 font-medium">{rep.activationCount}</td>
                                <td className="py-3 px-4 text-center text-slate-600">{rep.totalHours.toFixed(1)}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                    ${rep.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 font-mono">
                                    ${rep.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400 text-xs">
                                    {rep.lastActive && rep.lastActive.getTime() > 0 ? rep.lastActive.toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

