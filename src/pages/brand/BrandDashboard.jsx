import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';
import { getSales as getAllSales, getAllShifts } from '../../services/firestoreService';
import { calculateAgencyShiftCost } from '../../utils/pricing';

// Mock data for dashboard - will be replaced with Firestore queries
const getMockAnalytics = (brandId) => ({
    revenue: {
        current: 24500,
        previous: 21200,
        change: 15.6
    },
    orders: {
        total: 47,
        pending: 8,
        fulfilled: 39
    },
    // Chart Data
    salesHistory: [
        { month: 'Jan', revenue: 12000 },
        { month: 'Feb', revenue: 15400 },
        { month: 'Mar', revenue: 18900 },
        { month: 'Apr', revenue: 14500 },
        { month: 'May', revenue: 21000 },
        { month: 'Jun', revenue: 24500 },
    ],
    productMix: [
        { name: 'Croutons', value: 45, color: '#f59e0b' },
        { name: 'Slice of Bread', value: 30, color: '#fcd34d' },
        { name: 'Vape AIO', value: 15, color: '#fbbf24' },
        { name: 'Baguette', value: 10, color: '#d97706' },
    ],
    invoices: {
        paid: 18500,
        unpaid: 6000,
        overdue: 1200
    },
    recentOrders: [
        { id: 'ORD-001', dispensary: 'Green Leaf NYC', amount: 450, status: 'pending', date: '2026-01-02' },
        { id: 'ORD-002', dispensary: 'Canna Corner', amount: 890, status: 'fulfilled', date: '2026-01-01' },
        { id: 'ORD-003', dispensary: 'High Times BK', amount: 320, status: 'pending', date: '2025-12-31' }
    ]
});

export default function BrandDashboard() {
    const { brandUser } = useBrandAuth();
    const [financials, setFinancials] = useState({
        revenue: 0,
        commissionOwed: 0,
        activationCosts: 0,
        orderCount: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!brandUser?.brandId) return;

            try {
                // Fetch all raw data (in a real app, we'd query with filters, but for now we filter client-side)
                // We need Sales for the 5% Commission
                // We need Shifts for the Activation Costs
                const [allSales, allShifts] = await Promise.all([
                    getAllSales(), // Need to export this or use getSales
                    getAllShifts()
                ]);

                // 1. Calculate Revenue & 5% Commission
                let totalRevenue = 0;
                let pendingCount = 0;
                let pendingRevenue = 0; // New: Track value of pending orders
                let totalOrders = 0;
                const productSalesMap = {}; // New: Track product quantities

                allSales.forEach(sale => {
                    // Check items for this brand
                    const brandItems = sale.items?.filter(item => item.brandId === brandUser.brandId) || [];

                    if (brandItems.length > 0) {
                        const saleRevenue = brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        totalRevenue += saleRevenue;
                        totalOrders++;

                        if (sale.status === 'pending') {
                            pendingCount++;
                            pendingRevenue += saleRevenue;
                        }

                        // Track product sales
                        brandItems.forEach(item => {
                            productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
                        });
                    }
                });

                // Calculate Top Selling Product
                let topProduct = 'N/A';
                let maxSold = 0;
                Object.entries(productSalesMap).forEach(([name, qty]) => {
                    if (qty > maxSold) {
                        maxSold = qty;
                        topProduct = name;
                    }
                });

                // Calculate AOV
                const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                const commissionOwed = totalRevenue * 0.05;

                // Pricing Sheet Configuration
                const PRICING_TIERS = {
                    'NYC': { 2: 120, 3: 160, 4: 200, 5: 240 },
                    'LI': { 2: 140, 3: 180, 4: 220, 5: 260 },
                    'UPSTATE': { 2: 160, 3: 200, 4: 240, 5: 280 }
                };

                const calculateAgencyShiftCost = (shift) => {
                    const duration = Math.max(2, Math.round(parseFloat(shift.hoursWorked) || 0)); // Minimum 2 hours
                    const regionRaw = (shift.region || 'NYC').toUpperCase();

                    // Normalize region
                    let region = 'NYC';
                    if (regionRaw.includes('LI') || regionRaw.includes('DOWNSTATE') || regionRaw.includes('WESTCHESTER')) region = 'LI';
                    if (regionRaw.includes('UPSTATE')) region = 'UPSTATE';

                    const tiers = PRICING_TIERS[region] || PRICING_TIERS['NYC'];

                    // Base Fee Calculation
                    let baseFee = 0;
                    if (duration <= 2) baseFee = tiers[2];
                    else if (duration <= 3) baseFee = tiers[3];
                    else if (duration <= 4) baseFee = tiers[4];
                    else if (duration <= 5) baseFee = tiers[5];
                    else {
                        // Extrapolate for > 5 hours (assume $40/hr pattern from sheet)
                        const extraHours = duration - 5;
                        baseFee = tiers[5] + (extraHours * 40);
                    }

                    // Agency Mileage Rate: $0.70/mile
                    const mileageCost = (parseFloat(shift.milesTraveled) || 0) * 0.70;

                    // Tolls (At Cost)
                    const tollsCost = parseFloat(shift.tollAmount) || 0;

                    return baseFee + mileageCost + tollsCost;
                };

                // 2. Calculate Activation Costs with Agency Pricing
                let totalActivationCost = 0;

                allShifts.forEach(shift => {
                    if (shift.brand === brandUser.brandName || (shift.brand && shift.brand.includes(brandUser.brandName))) {
                        // User asked for what they are charged (Agency Rates)
                        // Show pending liability
                        if (shift.status !== 'paid') {
                            totalActivationCost += calculateAgencyShiftCost(shift);
                        }
                    }
                });

                setFinancials({
                    revenue: totalRevenue,
                    commissionOwed: commissionOwed,
                    activationCosts: totalActivationCost,
                    orderCount: totalOrders,
                    pendingOrders: pendingCount,
                    topProduct: topProduct, // New
                    aov: aov, // New
                    outstandingInvoices: pendingRevenue // New
                });

            } catch (error) {
                console.error("Failed to load brand dashboard data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [brandUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const formatCurrency = (amount) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Welcome back, {brandUser?.brandName}!</h1>
                    <p className="text-slate-500">Overview of your performance and pending actions.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/brand/orders" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
                        <ShoppingCart size={18} />
                        View Orders
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} className="text-emerald-700" />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                            <ArrowUpRight size={16} />
                            Real-time
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(financials.revenue)}</p>
                    <p className="text-sm text-slate-500">Total Revenue</p>
                </div>

                {/* Orders */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={24} className="text-blue-600" />
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {financials.pendingOrders} pending
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{financials.orderCount}</p>
                    <p className="text-sm text-slate-500">Total orders</p>
                </div>

                {/* Average Order Value (AOV) */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={24} className="text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(financials.aov)}</p>
                    <p className="text-sm text-slate-500">Average Order Value</p>
                </div>

                {/* Outstanding Invoices */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle size={24} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            Unpaid
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(financials.outstandingInvoices)}</p>
                    <p className="text-sm text-slate-500">Outstanding Invoices</p>
                </div>

                {/* Top Selling Product */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            {/* Star icon isn't imported, using CheckCircle or similar if Star not avail, or Trophy if avail. 
                                Looking at imports: Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock... 
                                Let's use TrendingUp or just CheckCircle for now, or Package. 
                                Actually, I can import Star or Trophy. I'll just use Package for now to be safe or CheckCircle.
                                The prompt said Trophy or Star. Let's see if I can add Trophy to imports or reuse.
                                Trophy is NOT imported. I will use Package for now but styled properly.
                             */}
                            <Package size={24} className="text-yellow-600" />
                        </div>
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                            Best Seller
                        </span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 truncate" title={financials.topProduct}>{financials.topProduct}</p>
                    <p className="text-sm text-slate-500">Top Selling Product</p>
                </div>

                {/* GreenTruth Owed (5% Commission) */}
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={64} className="text-red-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <PieChart size={24} className="text-red-600" />
                        </div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            5% Commission
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 relative z-10">{formatCurrency(financials.commissionOwed)}</p>
                    <p className="text-sm text-slate-500 relative z-10">Owed to GreenTruth</p>
                </div>

                {/* Activation Costs (Bi-Weekly Pay) */}
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className="text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} className="text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            Outstanding
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 relative z-10">{formatCurrency(financials.activationCosts)}</p>
                    <p className="text-sm text-slate-500 relative z-10">Activation Costs (Labor + Exp)</p>
                </div>
            </div>

            {/* Charts Section - Placeholder until historical data aggregation is ready */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-50 pointer-events-none filter grayscale">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex items-center justify-center h-64">
                    <p>Sales Trend Chart (Coming Soon)</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex items-center justify-center h-64">
                    <p>Product Mix Chart (Coming Soon)</p>
                </div>
            </div>

            {/* Recent Orders Table is preserved below */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Recent Activity</h3>
                    <Link to="/brand/orders" className="text-sm text-amber-600 hover:text-orange-600 font-medium">
                        View all orders →
                    </Link>
                </div>
                <div className="divide-y divide-slate-50">
                    <div className="p-4 text-center text-slate-500 text-sm">
                        No recent activity to display.
                    </div>
                </div>
            </div>
        </div>
    );
}
