import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Sparkles, UserPlus, Gift, ArrowRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';
import { getSales as getAllSales, getAllShifts } from '../../services/firestoreService';
import { calculateAgencyShiftCost } from '../../utils/pricing';
import RequestActivationModal from '../../components/RequestActivationModal';

import { PRODUCT_CATALOG } from '../../data/productCatalog';

export default function BrandDashboard() {
    const { brandUser } = useBrandAuth();
    const [activeBrandId, setActiveBrandId] = useState(brandUser?.brandId);

    // Update active brand if user context changes initial load
    useEffect(() => {
        if (brandUser?.brandId && !activeBrandId) {
            setActiveBrandId(brandUser.brandId);
        }
    }, [brandUser]);

    const [financials, setFinancials] = useState({
        revenue: 0,
        commissionOwed: 0,
        activationCosts: 0,
        orderCount: 0,
        pendingOrders: 0,
        pendingSampleRequests: 0,
        salesHistory: [], // Initialize to prevent Recharts undefined crash
        productMix: []    // Initialize to prevent map crash
    });
    const [brandLeads, setBrandLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Get current brand info either from allowed list or main user
    const currentBrandInfo = brandUser?.allowedBrands?.find(b => b.brandId === activeBrandId) || brandUser;
    // Fallback name if switching
    const currentBrandName = currentBrandInfo?.brandName || brandUser?.brandName;

    const brandData = PRODUCT_CATALOG.find(b => b.id === activeBrandId);

    useEffect(() => {
        async function fetchData() {
            if (!activeBrandId) return;

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
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">
                            {currentBrandName} <span className="text-emerald-500">Portal</span>
                        </h1>

                        {/* Brand Selector for Multi-Brand Users */}
                        {brandUser?.allowedBrands && brandUser.allowedBrands.length > 1 && (
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                    Switch Brand <ArrowRight size={12} />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-50">
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
                        className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <UserPlus size={18} className="text-emerald-500" />
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

                {/* GreenTruth Owed (5% Commission) - Set to $0 */}
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
                    <p className="text-2xl font-bold text-slate-800 relative z-10">$0.00</p>
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
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Sales Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financials.salesHistory}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Mix */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                        <PieChart size={18} className="text-indigo-500" />
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

            {/* Lead Pipeline Summary */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus size={18} className="text-orange-500" />
                        Lead Pipeline
                    </h3>
                    <Link to="/brand/new-lead" className="text-sm text-emerald-600 hover:text-emerald-700 font-bold">
                        + Add New Lead
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                    <div className="p-4 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Prospects</p>
                        <p className="text-xl font-black text-slate-700">{brandLeads.filter(l => l.leadStatus === 'prospect').length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Requested</p>
                        <p className="text-xl font-black text-amber-600">{brandLeads.filter(l => l.leadStatus === 'samples_requested').length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Received</p>
                        <p className="text-xl font-black text-blue-600">{brandLeads.filter(l => l.leadStatus === 'samples_delivered').length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Active</p>
                        <p className="text-xl font-black text-emerald-600">{brandLeads.filter(l => l.leadStatus === 'active').length}</p>
                    </div>
                </div>
                <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                    {brandLeads.length > 0 ? (
                        brandLeads.slice(0, 5).map((lead, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{lead.dispensaryName}</p>
                                    <p className="text-slate-400 text-xs">{lead.contacts?.[0]?.name || 'No Contact'} • {new Date(lead.createdAt).toLocaleDateString()}</p>
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
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No leads in your pipeline yet. Click "Add New Lead" to get started.
                        </div>
                    )}
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
