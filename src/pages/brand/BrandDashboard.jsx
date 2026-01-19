import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Sparkles, UserPlus, Gift, ArrowRight,
    Store, RefreshCw, Boxes, TrendingDown
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';
import { getSales as getAllSales, getAllShifts } from '../../services/firestoreService';
import { calculateAgencyShiftCost } from '../../utils/pricing';
import ActivationFormModal from '../../components/ActivationFormModal';

import { PRODUCT_CATALOG } from '../../data/productCatalog';
import FLXProcessorDashboard from './FLXProcessorDashboard';

export default function BrandDashboard() {
    const { brandUser } = useBrandAuth();

    // If user is FLX Extracts (processor), render the processor dashboard
    if (brandUser?.brandId === 'flx-extracts') {
        return <FLXProcessorDashboard />;
    }

    const [activeBrandId, setActiveBrandId] = useState(null);
    const [financials, setFinancials] = useState({
        revenue: 0,
        commissionOwed: 0,
        activationCosts: 0,
        orderCount: 0,
        pendingOrders: 0,
        pendingSampleRequests: 0,
        salesHistory: [],
        productMix: [],
        topProduct: 'N/A',
        aov: 0,
        outstandingInvoices: 0,
        // Performance metrics
        storeReach: 0,
        reorderRate: 0,
        unitsSold: 0,
        monthOverMonthGrowth: 0
    });
    const [brandLeads, setBrandLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Set active brand when user loads
    useEffect(() => {
        if (brandUser?.brandId && !activeBrandId) {
            setActiveBrandId(brandUser.brandId);
        }
    }, [brandUser, activeBrandId]);

    // Current brand name for display
    const currentBrandName = brandUser?.brandName || 'Brand';
    const brandData = PRODUCT_CATALOG.find(b => b.id === activeBrandId);

    // Brand logo state - fetched from Supabase
    const [brandLogo, setBrandLogo] = useState(null);

    // Fetch brand logo from admin_brands table
    useEffect(() => {
        async function fetchBrandLogo() {
            if (!activeBrandId) return;

            try {
                const { getAdminBrands } = await import('../../services/firestoreService');
                const adminBrands = await getAdminBrands();
                const adminBrand = adminBrands.find(b => b.id === activeBrandId);
                if (adminBrand?.logo) {
                    setBrandLogo(adminBrand.logo);
                    return;
                }
            } catch (e) {
                console.warn('Error fetching admin brands from Supabase:', e);
            }

            // Fallback to product catalog logo
            setBrandLogo(brandData?.logo || null);
        }
        fetchBrandLogo();
    }, [activeBrandId, brandData]);

    // Fetch dashboard data
    useEffect(() => {
        async function fetchData() {
            if (!activeBrandId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');
                const { getBrandLeads } = await import('../../services/firestoreService');

                const [metrics, leads] = await Promise.all([
                    calculateBrandMetrics(activeBrandId, currentBrandName),
                    getBrandLeads(activeBrandId)
                ]);

                // Fetch sample requests count manually for now (or integrate into metrics service later)
                // Assuming we have a collection 'sample_requests'
                const { collection, query, where, getCountFromServer } = await import('firebase/firestore');
                const { db } = await import('../../firebase');
                if (currentBrandName) {
                    const qSamples = query(
                        collection(db, 'sample_requests'),
                        where('requestedBrands', 'array-contains-any', [currentBrandName, `${currentBrandName}!`, currentBrandName.replace('!', '')]),
                        where('status', '==', 'Pending')
                    );
                    const snapshot = await getCountFromServer(qSamples);
                    const pendingSamples = snapshot.data().count;
                    metrics.pendingSampleRequests = pendingSamples; // Add to metrics
                } else {
                    metrics.pendingSampleRequests = 0;
                }

                setFinancials(prev => ({ ...prev, ...metrics }));
                setBrandLeads(leads);
            } catch (error) {
                console.error("Failed to load brand dashboard data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [activeBrandId, currentBrandName]);

    if (loading && !financials.revenue) { // Only show full loader on initial load
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const formatCurrency = (amount) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-4">
                        {/* Brand Logo */}
                        {brandLogo && (
                            <div className="w-16 h-16 rounded-2xl themed-card flex items-center justify-center p-2 shrink-0">
                                <img
                                    src={brandLogo}
                                    alt={currentBrandName}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        )}
                        <h1 className="text-3xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {currentBrandName} <span style={{ color: 'var(--accent-primary)' }}>Portal</span>
                        </h1>

                        {/* Brand Selector for Multi-Brand Users */}
                        {brandUser?.allowedBrands && brandUser.allowedBrands.length > 1 && (
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                    Switch Brand <ArrowRight size={12} />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-50" style={{ background: 'var(--bg-card)' }}>
                                    {brandUser.allowedBrands.map(b => (
                                        <button
                                            key={b.brandId}
                                            onClick={() => setActiveBrandId(b.brandId)}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${activeBrandId === b.brandId ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}
                                        >
                                            {b.brandName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1 font-medium italic">Welcome back! Here's your brand performance at a glance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/brand/new-lead"
                        className="themed-card flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all hover:border-[var(--accent-primary)]"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <UserPlus size={18} style={{ color: 'var(--accent-primary)' }} />
                        <span>Create Lead</span>
                    </Link>
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                        <Sparkles size={18} />
                        <span>Request Activation</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending Sample Requests - HIGH VISIBILITY */}
                {financials.pendingSampleRequests > 0 && (
                    <Link to="/brand/orders?tab=samples" className="col-span-1 md:col-span-2 lg:col-span-4 bg-purple-600 rounded-xl p-6 text-white shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Gift size={32} className="text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-purple-100 uppercase tracking-wider mb-1">Action Required</p>
                                <h3 className="text-3xl font-black text-white leading-none">
                                    {financials.pendingSampleRequests} New Request{financials.pendingSampleRequests !== 1 && 's'}
                                </h3>
                                <p className="text-purple-100 mt-1">Dispensaries are waiting for samples!</p>
                            </div>
                        </div>
                        <div className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            View Requests <ArrowRight size={20} />
                        </div>
                    </Link>
                )}
                {/* Revenue */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-success">
                            <DollarSign size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--success)' }}>
                            <ArrowUpRight size={16} />
                            Real-time
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.revenue)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Revenue</p>
                </div>

                {/* Orders */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-info">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--info)', color: 'var(--text-inverse)', opacity: 0.8 }}>
                            {financials.pendingOrders} pending
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.orderCount}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total orders</p>
                </div>

                {/* Average Order Value (AOV) */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-accent">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.aov)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average Order Value</p>
                </div>

                {/* Outstanding Invoices */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Unpaid
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.outstandingInvoices)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Outstanding Invoices</p>
                </div>

                {/* Top Selling Product */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <Package size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Best Seller
                        </span>
                    </div>
                    <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }} title={financials.topProduct}>{financials.topProduct}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Top Selling Product</p>
                </div>

                {/* GreenTruth Owed (5% Commission) */}
                <div className="themed-card p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={64} style={{ color: 'var(--error)' }} />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-error">
                            <PieChart size={24} />
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold px-2 py-1 rounded-full block mb-1" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
                                5% Commission
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--error)' }}>Paid Quarterly</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold relative z-10" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.commissionOwed)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <p className="text-sm relative z-10" style={{ color: 'var(--text-secondary)' }}>Owed to GreenTruth</p>
                        <div className="group/tip relative">
                            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                Paid within 2 weeks after each quarter ends.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activation Costs (Bi-Weekly Pay) */}
                <div className="themed-card p-6 rounded-xl shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 size={64} style={{ color: 'var(--info)' }} />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-info">
                            <BarChart3 size={24} />
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold px-2 py-1 rounded-full block mb-1" style={{ color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)' }}>
                                Outstanding
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--info)' }}>Paid Biweekly</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold relative z-10" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.activationCosts)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <p className="text-sm relative z-10" style={{ color: 'var(--text-secondary)' }}>Activation Costs & Fees</p>
                        <div className="group/tip relative">
                            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                Due every other Monday.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Store Reach */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-info">
                            <Store size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)' }}>
                            Coverage
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.storeReach}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Unique Stores Reached</p>
                </div>

                {/* Reorder Rate */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-accent-tertiary">
                            <RefreshCw size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--accent-tertiary)', background: 'rgba(52, 211, 153, 0.1)' }}>
                            Retention
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.reorderRate.toFixed(1)}%</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reorder Rate</p>
                </div>

                {/* Units Sold */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <Boxes size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Volume
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.unitsSold.toLocaleString()}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Units Sold</p>
                </div>

                {/* Month-over-Month Growth */}
                <div className="themed-card p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${financials.monthOverMonthGrowth >= 0 ? 'icon-bg-success' : 'icon-bg-error'}`}>
                            {financials.monthOverMonthGrowth >= 0
                                ? <TrendingUp size={24} />
                                : <TrendingDown size={24} />
                            }
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{
                            color: financials.monthOverMonthGrowth >= 0 ? 'var(--success)' : 'var(--error)',
                            background: financials.monthOverMonthGrowth >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}>
                            {financials.monthOverMonthGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            MoM
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {financials.monthOverMonthGrowth >= 0 ? '+' : ''}{financials.monthOverMonthGrowth.toFixed(1)}%
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Month-over-Month Growth</p>
                </div>
            </div>

            {/* Charts Section - Placeholder until historical data aggregation is ready */}
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="themed-card rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={18} style={{ color: 'var(--chart-primary)' }} />
                        Sales Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financials.salesHistory}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--card-shadow)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="var(--chart-primary)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Mix */}
                <div className="themed-card rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <PieChart size={18} style={{ color: 'var(--chart-secondary)' }} />
                        Product Mix
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
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--card-shadow)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    layout="vertical"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ color: 'var(--text-secondary)' }}
                                />
                            </RechartsPC>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lead Pipeline Summary */}
            <div className="themed-card rounded-xl overflow-hidden mb-6">
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                    <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <UserPlus size={18} style={{ color: 'var(--warning)' }} />
                        Lead Pipeline
                    </h3>
                    <Link to="/brand/new-lead" className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                        + Add New Lead
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <div className="p-4 text-center" style={{ borderRight: '1px solid var(--border-primary)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Prospects</p>
                        <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{brandLeads.filter(l => l.leadStatus === 'prospect').length}</p>
                    </div>
                    <div className="p-4 text-center" style={{ borderRight: '1px solid var(--border-primary)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Requested</p>
                        <p className="text-xl font-black" style={{ color: 'var(--warning)' }}>{brandLeads.filter(l => l.leadStatus === 'samples_requested').length}</p>
                    </div>
                    <div className="p-4 text-center" style={{ borderRight: '1px solid var(--border-primary)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Received</p>
                        <p className="text-xl font-black" style={{ color: 'var(--info)' }}>{brandLeads.filter(l => l.leadStatus === 'samples_delivered').length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Active</p>
                        <p className="text-xl font-black" style={{ color: 'var(--success)' }}>{brandLeads.filter(l => l.leadStatus === 'active').length}</p>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {brandLeads.length > 0 ? (
                        brandLeads.slice(0, 5).map((lead, i) => (
                            <div key={i} className="p-4 flex items-center justify-between transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{lead.dispensaryName}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{lead.contacts?.[0]?.name || 'No Contact'} • {new Date(lead.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${lead.leadStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    lead.leadStatus === 'samples_delivered' ? 'bg-blue-100 text-blue-700' :
                                        lead.leadStatus === 'samples_requested' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {lead.leadStatus?.replace('_', ' ') || 'New'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
                            No leads in your pipeline yet. Click "Add New Lead" to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ActivationFormModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={() => setIsRequestModalOpen(false)}
                initialData={{ userRole: 'brand' }}
            />
        </div>
    );
}
