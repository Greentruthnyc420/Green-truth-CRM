import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
    BarChart3, PieChart, Sparkles, Building2, Users, Calendar, Award, Target,
    TrendingDown, Percent, Clock, Star, Zap, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie, LineChart, Line,
    RadialBarChart, RadialBar, ComposedChart
} from 'recharts';

const FLX_SUB_BRANDS = [
    { id: 'pines', name: 'Pines', color: '#10b981' },
    { id: 'smoothie-bar', name: 'Smoothie Bar', color: '#3b82f6' },
    { id: 'waferz', name: 'Waferz NY', color: '#f59e0b' }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function FLXProcessorDashboard() {
    const { brandUser } = useBrandAuth();
    const [activeView, setActiveView] = useState('all');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        combined: null,
        byBrand: {}
    });

    useEffect(() => {
        async function fetchAllBrandData() {
            setLoading(true);
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');

                const results = await Promise.all(
                    FLX_SUB_BRANDS.map(async (brand) => {
                        const data = await calculateBrandMetrics(brand.id, brand.name);
                        return { ...brand, metrics: data };
                    })
                );

                // Store by brand
                const byBrand = {};
                results.forEach(r => {
                    byBrand[r.id] = r;
                });

                // Calculate combined
                const totalRevenue = results.reduce((s, r) => s + (r.metrics?.revenue || 0), 0);
                const totalOrders = results.reduce((s, r) => s + (r.metrics?.orderCount || 0), 0);
                const totalCommission = results.reduce((s, r) => s + (r.metrics?.commissionOwed || 0), 0);
                const totalActivationCost = results.reduce((s, r) => s + (r.metrics?.activationCosts || 0), 0);
                const pendingOrders = results.reduce((s, r) => s + (r.metrics?.pendingOrders || 0), 0);

                // Revenue by brand
                const revenueByBrand = results.map(r => ({
                    name: r.name,
                    value: r.metrics?.revenue || 0,
                    color: r.color
                }));

                // Orders by brand
                const ordersByBrand = results.map(r => ({
                    name: r.name,
                    orders: r.metrics?.orderCount || 0,
                    revenue: r.metrics?.revenue || 0,
                    color: r.color
                }));

                // Combined sales history
                const salesHistoryMap = {};
                results.forEach(r => {
                    (r.metrics?.salesHistory || []).forEach(h => {
                        if (!salesHistoryMap[h.month]) {
                            salesHistoryMap[h.month] = { month: h.month, total: 0 };
                        }
                        salesHistoryMap[h.month][r.id] = h.revenue;
                        salesHistoryMap[h.month].total += h.revenue;
                    });
                });

                // Top products across all brands
                const allProducts = results.flatMap(r =>
                    (r.metrics?.productMix || []).map(p => ({ ...p, brand: r.name, brandColor: r.color }))
                );
                const topProducts = allProducts.sort((a, b) => b.value - a.value).slice(0, 10);

                // Best performing brand
                const bestBrand = results.reduce((best, r) =>
                    (r.metrics?.revenue || 0) > (best?.metrics?.revenue || 0) ? r : best, results[0]);

                // Category breakdown (if products have categories)
                const categoryMap = {};
                allProducts.forEach(p => {
                    const cat = p.category || 'Other';
                    categoryMap[cat] = (categoryMap[cat] || 0) + p.value;
                });
                const categoryBreakdown = Object.entries(categoryMap)
                    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
                    .sort((a, b) => b.value - a.value);

                // Performance metrics
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalActivationCost) / totalRevenue * 100) : 0;

                setMetrics({
                    combined: {
                        totalRevenue,
                        totalOrders,
                        totalCommission,
                        totalActivationCost,
                        pendingOrders,
                        avgOrderValue,
                        profitMargin,
                        revenueByBrand,
                        ordersByBrand,
                        salesHistory: Object.values(salesHistoryMap),
                        topProducts,
                        bestBrand,
                        categoryBreakdown
                    },
                    byBrand
                });
            } catch (error) {
                console.error("Failed to fetch FLX processor data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllBrandData();
    }, []);

    const formatCurrency = (amount) => `$${(Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatNumber = (num) => (Number(num) || 0).toLocaleString();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mx-auto"></div>
                    <p className="mt-4 text-slate-500 font-medium">Loading FLX Analytics...</p>
                </div>
            </div>
        );
    }

    const { combined, byBrand } = metrics;
    const displayBrand = activeView === 'all' ? null : byBrand[activeView];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        FLX <span className="text-amber-500">Analytics Dashboard</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Complete view of Pines • Smoothie Bar • Waferz NY</p>
                </div>

                {/* View Tabs */}
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-xl">
                    <TabButton active={activeView === 'all'} onClick={() => setActiveView('all')} color="#f59e0b">
                        📊 All Brands
                    </TabButton>
                    {FLX_SUB_BRANDS.map(brand => (
                        <TabButton
                            key={brand.id}
                            active={activeView === brand.id}
                            onClick={() => setActiveView(brand.id)}
                            color={brand.color}
                        >
                            {brand.name}
                        </TabButton>
                    ))}
                </div>
            </div>

            {activeView === 'all' ? (
                <AllBrandsView combined={combined} formatCurrency={formatCurrency} formatNumber={formatNumber} />
            ) : (
                <SingleBrandView brand={displayBrand} formatCurrency={formatCurrency} formatNumber={formatNumber} />
            )}
        </div>
    );
}

// Tab Button Component
function TabButton({ children, active, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${active
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
            style={active ? { borderBottom: `3px solid ${color}` } : {}}
        >
            {children}
        </button>
    );
}

// ALL BRANDS VIEW - Comprehensive Analytics
function AllBrandsView({ combined, formatCurrency, formatNumber }) {
    if (!combined) return null;

    return (
        <>
            {/* KPI Row 1 - Main Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(combined.totalRevenue)}
                    icon={<DollarSign className="text-emerald-500" />}
                    subtitle="Across all brands"
                    trend="+15.2%"
                    trendUp={true}
                />
                <KPICard
                    title="Total Orders"
                    value={formatNumber(combined.totalOrders)}
                    icon={<ShoppingCart className="text-blue-500" />}
                    subtitle="Units sold"
                    trend="+8"
                    trendUp={true}
                />
                <KPICard
                    title="Commission Owed"
                    value={formatCurrency(combined.totalCommission)}
                    icon={<Percent className="text-amber-500" />}
                    subtitle="5% of revenue"
                />
                <KPICard
                    title="Activation Costs"
                    value={formatCurrency(combined.totalActivationCost)}
                    icon={<Calendar className="text-purple-500" />}
                    subtitle="Pop-up expenses"
                />
            </div>

            {/* KPI Row 2 - Performance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Avg Order Value"
                    value={formatCurrency(combined.avgOrderValue)}
                    icon={<Target className="text-cyan-500" />}
                    subtitle="Per transaction"
                />
                <KPICard
                    title="Pending Orders"
                    value={formatNumber(combined.pendingOrders)}
                    icon={<Clock className="text-orange-500" />}
                    subtitle="Awaiting fulfillment"
                />
                <KPICard
                    title="Best Brand"
                    value={combined.bestBrand?.name || 'N/A'}
                    icon={<Award className="text-yellow-500" />}
                    subtitle={formatCurrency(combined.bestBrand?.metrics?.revenue)}
                />
                <KPICard
                    title="Profit Margin"
                    value={`${combined.profitMargin.toFixed(1)}%`}
                    icon={<TrendingUp className="text-emerald-500" />}
                    subtitle="After activation costs"
                    trend={combined.profitMargin > 50 ? "Healthy" : "Monitor"}
                    trendUp={combined.profitMargin > 50}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Brand Pie Chart */}
                <ChartCard title="Revenue Distribution" icon={<PieChart className="text-emerald-500" />}>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPC>
                                <Pie
                                    data={combined.revenueByBrand}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {combined.revenueByBrand.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </RechartsPC>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Orders by Brand Bar Chart */}
                <ChartCard title="Orders by Brand" icon={<BarChart3 className="text-blue-500" />}>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={combined.ordersByBrand}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip />
                                <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                                    {combined.ordersByBrand.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Sales Trend - Stacked Area */}
            <ChartCard title="Sales Trend by Brand (6 Months)" icon={<Activity className="text-purple-500" />}>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={combined.salesHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Area type="monotone" dataKey="pines" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.7} name="Pines" />
                            <Area type="monotone" dataKey="smoothie-bar" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.7} name="Smoothie Bar" />
                            <Area type="monotone" dataKey="waferz" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.7} name="Waferz" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Bottom Row - Products & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Products */}
                <ChartCard title="Top 10 Best Selling Products" icon={<Star className="text-yellow-500" />}>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {combined.topProducts.map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                        style={{ backgroundColor: idx < 3 ? '#f59e0b' : '#94a3b8' }}
                                    >
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-800">{product.name}</p>
                                        <p className="text-xs text-slate-500" style={{ color: product.brandColor }}>{product.brand}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-700">{product.value} sold</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Category Breakdown Pie */}
                {combined.categoryBreakdown.length > 0 && (
                    <ChartCard title="Sales by Category" icon={<Zap className="text-cyan-500" />}>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPC>
                                    <Pie
                                        data={combined.categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {combined.categoryBreakdown.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </RechartsPC>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                )}
            </div>

            {/* Brand Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FLX_SUB_BRANDS.map(brand => {
                    const data = combined.ordersByBrand.find(b => b.name === brand.name);
                    const pct = combined.totalRevenue > 0 ? ((data?.revenue || 0) / combined.totalRevenue * 100) : 0;
                    return (
                        <div
                            key={brand.id}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                            style={{ borderLeft: `4px solid ${brand.color}` }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-slate-800">{brand.name}</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${brand.color}20`, color: brand.color }}>
                                    {pct.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(data?.revenue || 0)}</p>
                            <p className="text-sm text-slate-500">{data?.orders || 0} orders</p>
                            <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: brand.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// SINGLE BRAND VIEW
function SingleBrandView({ brand, formatCurrency, formatNumber }) {
    if (!brand) return <p className="text-slate-500">No data available</p>;

    const m = brand.metrics || {};

    return (
        <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Revenue" value={formatCurrency(m.revenue)} icon={<DollarSign className="text-emerald-500" />} />
                <KPICard title="Orders" value={formatNumber(m.orderCount)} icon={<ShoppingCart className="text-blue-500" />} />
                <KPICard title="Commission" value={formatCurrency(m.commissionOwed)} icon={<Percent className="text-amber-500" />} />
                <KPICard title="Top Product" value={m.topProduct || 'N/A'} icon={<Star className="text-yellow-500" />} />
            </div>

            {/* Sales Chart */}
            <ChartCard title={`${brand.name} Sales Trend`} icon={<Activity style={{ color: brand.color }} />}>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={m.salesHistory || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="revenue" stroke={brand.color} fill={brand.color} fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Product Mix */}
            {m.productMix?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Product Mix" icon={<PieChart style={{ color: brand.color }} />}>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPC>
                                    <Pie data={m.productMix} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                                        {m.productMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </RechartsPC>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard title="Top Products" icon={<Star style={{ color: brand.color }} />}>
                        <div className="space-y-2">
                            {m.productMix.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: brand.color }}>
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-slate-800">{p.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-600">{p.value} sold</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            )}
        </>
    );
}

// KPI Card Component
function KPICard({ title, value, icon, subtitle, trend, trendUp }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <span className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-slate-900 truncate">{value}</p>
            <p className="text-sm text-slate-500">{subtitle || title}</p>
        </div>
    );
}

// Chart Card Component
function ChartCard({ title, icon, children }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}
