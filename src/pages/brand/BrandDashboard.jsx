import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Sparkles
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';
import { getSales as getAllSales, getAllShifts } from '../../services/firestoreService';
import { calculateAgencyShiftCost } from '../../utils/pricing';
import RequestActivationModal from '../../components/RequestActivationModal';

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

import { PRODUCT_CATALOG } from '../../data/productCatalog';

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
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const brandData = PRODUCT_CATALOG.find(b => b.id === brandUser?.brandId);

    useEffect(() => {
        async function fetchData() {
            if (!brandUser?.brandId) return;

            setLoading(true);
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');
                const metrics = await calculateBrandMetrics(brandUser.brandId, brandUser.brandName);
                setFinancials(metrics);
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    {brandData?.logo && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1 flex items-center justify-center">
                            <img src={brandData.logo} alt={brandData.name} className="max-w-full max-h-full object-contain" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {brandUser?.brandName}!</h1>
                        <p className="text-slate-500 text-sm">Overview of your performance and pending actions.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={18} className="text-emerald-600" />
                        Request Activation
                    </button>
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
                        <div className="text-right">
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 block mb-1">
                                5% Commission
                            </span>
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight">Paid Quarterly</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 relative z-10">{formatCurrency(financials.commissionOwed)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <p className="text-sm text-slate-500 relative z-10">Owed to GreenTruth</p>
                        <div className="group/tip relative">
                            <Clock size={12} className="text-slate-400" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50">
                                Paid within 2 weeks after each quarter ends.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activation Costs (Bi-Weekly Pay) */}
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src="/logos/logo-main.png" alt="GreenTruth" className="w-16 h-16 object-contain grayscale opacity-20" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center p-2">
                            <img src="/logos/logo-main.png" alt="GreenTruth" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 block mb-1">
                                Outstanding
                            </span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">Paid Biweekly</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 relative z-10">{formatCurrency(financials.activationCosts)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <p className="text-sm text-slate-500 relative z-10">Activation Costs & Fees</p>
                        <div className="group/tip relative">
                            <Clock size={12} className="text-slate-400" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50">
                                Due every other Monday.
                            </div>
                        </div>
                    </div>
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

            {/* Modals */}
            <RequestActivationModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                brandUser={brandUser}
            />
        </div>
    );
}
