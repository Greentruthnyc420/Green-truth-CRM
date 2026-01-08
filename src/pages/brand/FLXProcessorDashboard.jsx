import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
    BarChart3, PieChart, Sparkles, Building2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';

const FLX_SUB_BRANDS = [
    { id: 'pines', name: 'Pines', color: '#10b981' },
    { id: 'smoothie-bar', name: 'Smoothie Bar', color: '#3b82f6' },
    { id: 'waferz', name: 'Waferz NY', color: '#f59e0b' }
];

export default function FLXProcessorDashboard() {
    const { brandUser } = useBrandAuth();
    const [activeView, setActiveView] = useState('all'); // 'all' | 'pines' | 'smoothie-bar' | 'waferz'
    const [loading, setLoading] = useState(true);
    const [combinedMetrics, setCombinedMetrics] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCommission: 0,
        pendingOrders: 0,
        brandBreakdown: [],
        salesHistory: [],
        productMix: []
    });
    const [brandMetrics, setBrandMetrics] = useState({});

    useEffect(() => {
        async function fetchAllBrandData() {
            setLoading(true);
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');

                // Fetch metrics for each sub-brand
                const results = await Promise.all(
                    FLX_SUB_BRANDS.map(async (brand) => {
                        const metrics = await calculateBrandMetrics(brand.id, brand.name);
                        return { brandId: brand.id, brandName: brand.name, color: brand.color, metrics };
                    })
                );

                // Store individual brand metrics
                const brandMetricsMap = {};
                results.forEach(r => {
                    brandMetricsMap[r.brandId] = r;
                });
                setBrandMetrics(brandMetricsMap);

                // Calculate combined totals
                const totalRevenue = results.reduce((sum, r) => sum + (r.metrics?.revenue || 0), 0);
                const totalOrders = results.reduce((sum, r) => sum + (r.metrics?.orderCount || 0), 0);
                const totalCommission = results.reduce((sum, r) => sum + (r.metrics?.commissionOwed || 0), 0);
                const pendingOrders = results.reduce((sum, r) => sum + (r.metrics?.pendingOrders || 0), 0);

                // Brand breakdown for pie chart
                const brandBreakdown = results.map(r => ({
                    name: r.brandName,
                    value: r.metrics?.revenue || 0,
                    color: r.color
                }));

                // Combine sales history (aggregate by month)
                const salesHistoryMap = {};
                results.forEach(r => {
                    (r.metrics?.salesHistory || []).forEach(h => {
                        if (!salesHistoryMap[h.month]) {
                            salesHistoryMap[h.month] = { month: h.month };
                        }
                        salesHistoryMap[h.month][r.brandId] = h.revenue;
                        salesHistoryMap[h.month].total = (salesHistoryMap[h.month].total || 0) + h.revenue;
                    });
                });
                const salesHistory = Object.values(salesHistoryMap);

                // Combine product mix (top 5 overall)
                const allProducts = results.flatMap(r =>
                    (r.metrics?.productMix || []).map(p => ({ ...p, brand: r.brandName }))
                );
                const productMix = allProducts.sort((a, b) => b.value - a.value).slice(0, 5);

                setCombinedMetrics({
                    totalRevenue,
                    totalOrders,
                    totalCommission,
                    pendingOrders,
                    brandBreakdown,
                    salesHistory,
                    productMix
                });
            } catch (error) {
                console.error("Failed to fetch FLX processor data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllBrandData();
    }, []);

    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Get current display data based on active view
    const getDisplayData = () => {
        if (activeView === 'all') {
            return {
                title: 'All Brands',
                revenue: combinedMetrics.totalRevenue,
                orders: combinedMetrics.totalOrders,
                commission: combinedMetrics.totalCommission,
                pending: combinedMetrics.pendingOrders,
                salesHistory: combinedMetrics.salesHistory,
                productMix: combinedMetrics.productMix
            };
        }
        const brand = brandMetrics[activeView];
        return {
            title: brand?.brandName || activeView,
            revenue: brand?.metrics?.revenue || 0,
            orders: brand?.metrics?.orderCount || 0,
            commission: brand?.metrics?.commissionOwed || 0,
            pending: brand?.metrics?.pendingOrders || 0,
            salesHistory: brand?.metrics?.salesHistory || [],
            productMix: brand?.metrics?.productMix || []
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const displayData = getDisplayData();

    return (
        <div className="space-y-6">
            {/* Header with View Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        FLX <span className="text-amber-500">Processor Dashboard</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Managing: Pines • Smoothie Bar • Waferz NY</p>
                </div>

                {/* View Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveView('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'all'
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'text-slate-600 hover:bg-white'
                            }`}
                    >
                        All Brands
                    </button>
                    {FLX_SUB_BRANDS.map(brand => (
                        <button
                            key={brand.id}
                            onClick={() => setActiveView(brand.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === brand.id
                                    ? 'bg-white text-slate-900 shadow-lg'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                        >
                            {brand.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(displayData.revenue)}
                    icon={<DollarSign className="text-emerald-500" />}
                    trend="+12%"
                    trendUp={true}
                />
                <KPICard
                    title="Total Orders"
                    value={displayData.orders}
                    icon={<ShoppingCart className="text-blue-500" />}
                    trend="+5"
                    trendUp={true}
                />
                <KPICard
                    title="Commission Owed"
                    value={formatCurrency(displayData.commission)}
                    icon={<TrendingUp className="text-amber-500" />}
                />
                <KPICard
                    title="Pending Orders"
                    value={displayData.pending}
                    icon={<Package className="text-purple-500" />}
                />
            </div>

            {/* Brand Breakdown (only show in "All Brands" view) */}
            {activeView === 'all' && combinedMetrics.brandBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-amber-500" />
                        Revenue by Brand
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {combinedMetrics.brandBreakdown.map((brand, idx) => (
                            <div
                                key={idx}
                                className="bg-slate-50 rounded-xl p-4 border-l-4"
                                style={{ borderLeftColor: brand.color }}
                            >
                                <p className="text-sm font-medium text-slate-500">{brand.name}</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(brand.value)}</p>
                                <p className="text-xs text-slate-400">
                                    {combinedMetrics.totalRevenue > 0
                                        ? `${((brand.value / combinedMetrics.totalRevenue) * 100).toFixed(1)}% of total`
                                        : '0% of total'
                                    }
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sales Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" />
                    Sales Trend - {displayData.title}
                </h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData.salesHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            {activeView === 'all' ? (
                                <>
                                    <Area type="monotone" dataKey="pines" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Pines" />
                                    <Area type="monotone" dataKey="smoothie-bar" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Smoothie Bar" />
                                    <Area type="monotone" dataKey="waferz" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Waferz" />
                                </>
                            ) : (
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                            )}
                            <Legend />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Products */}
            {displayData.productMix.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-500" />
                        Top Selling Products
                    </h2>
                    <div className="space-y-3">
                        {displayData.productMix.map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-slate-800">{product.name}</p>
                                        {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}
                                    </div>
                                </div>
                                <span className="font-bold text-slate-600">{product.value} sold</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, icon, trend, trendUp }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <span className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{title}</p>
        </div>
    );
}
