import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    Package, ArrowLeft, TrendingUp, TrendingDown, Star, ShoppingCart,
    DollarSign, BarChart3, PieChart, Search, Filter, Download,
    ArrowUpRight, ArrowDownRight, Store, Calendar, Boxes, Award
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function BrandProducts() {
    const { brandUser } = useBrandAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('units'); // units, revenue, growth
    const [metrics, setMetrics] = useState({
        topProducts: [],
        productMix: [],
        categorySales: [],
        productTrends: [],
        totalProducts: 0,
        totalRevenue: 0,
        totalUnitsSold: 0,
        avgProductPrice: 0
    });

    const brandId = brandUser?.brandId;
    const brandName = brandUser?.brandName || 'Brand';

    useEffect(() => {
        if (!brandId) return;

        async function loadProductData() {
            setLoading(true);
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');
                const data = await calculateBrandMetrics(brandId, brandName);

                // Build comprehensive product metrics
                const products = data.productMix || [];
                const totalUnits = products.reduce((sum, p) => sum + p.value, 0);
                const totalRev = data.revenue || 0;

                // Calculate product trends (mock for now, would come from historical data)
                const productTrends = products.slice(0, 5).map((p, i) => ({
                    name: p.name,
                    data: Array(6).fill(0).map((_, idx) => ({
                        month: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][idx],
                        units: Math.max(0, p.value * (0.7 + Math.random() * 0.6) / 6)
                    }))
                }));

                // Category breakdown
                const categoryMap = {};
                products.forEach(p => {
                    const cat = p.category || 'Other';
                    if (!categoryMap[cat]) categoryMap[cat] = { units: 0, revenue: 0 };
                    categoryMap[cat].units += p.value;
                    categoryMap[cat].revenue += (p.revenue || p.value * (p.price || 25));
                });

                const categorySales = Object.entries(categoryMap).map(([name, data], i) => ({
                    name,
                    units: data.units,
                    revenue: data.revenue,
                    color: CHART_COLORS[i % CHART_COLORS.length]
                })).sort((a, b) => b.units - a.units);

                setMetrics({
                    topProducts: (data.top10Products || products.slice(0, 10)).map((p, i) => ({
                        ...p,
                        rank: i + 1,
                        growth: Math.round((Math.random() - 0.3) * 50), // Mock growth %
                        revenue: p.revenue || p.value * (p.price || 25),
                        stores: Math.floor(Math.random() * 30) + 5
                    })),
                    productMix: products,
                    categorySales,
                    productTrends,
                    totalProducts: products.length,
                    totalRevenue: totalRev,
                    totalUnitsSold: totalUnits,
                    avgProductPrice: totalUnits > 0 ? totalRev / totalUnits : 0
                });
            } catch (error) {
                console.error('Failed to load product data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadProductData();
    }, [brandId, brandName]);

    const filteredProducts = metrics.topProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'units') return b.value - a.value;
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'growth') return b.growth - a.growth;
        return 0;
    });

    const formatCurrency = (amount) => `$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/brand')}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                            Product <span style={{ color: 'var(--accent-primary)' }}>Analytics</span>
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Deep dive into your product performance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="themed-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold hover:shadow-md transition-shadow">
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="themed-card p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl icon-bg-success flex items-center justify-center">
                            <Package size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{metrics.totalProducts}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Products</p>
                </div>

                <div className="themed-card p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl icon-bg-info flex items-center justify-center">
                            <Boxes size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{metrics.totalUnitsSold.toLocaleString()}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Units Sold</p>
                </div>

                <div className="themed-card p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl icon-bg-accent flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product Revenue</p>
                </div>

                <div className="themed-card p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl icon-bg-warning flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.avgProductPrice)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Price per Unit</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="themed-card rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <PieChart size={18} style={{ color: 'var(--chart-secondary)' }} />
                        Sales by Category
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPC>
                                <Pie
                                    data={metrics.categorySales}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="units"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {metrics.categorySales.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => value.toLocaleString()} />
                            </RechartsPC>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products Bar Chart */}
                <div className="themed-card rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <BarChart3 size={18} style={{ color: 'var(--chart-primary)' }} />
                        Top 5 Products by Units
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topProducts.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip formatter={(value) => value.toLocaleString()} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {metrics.topProducts.slice(0, 5).map((_, index) => (
                                        <Cell key={index} fill={CHART_COLORS[index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <div className="themed-card rounded-xl overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Award size={18} style={{ color: 'var(--warning)' }} />
                        All Products Performance
                    </h3>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg text-sm border-none outline-none"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm font-medium border-none outline-none"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="units">Sort by Units</option>
                            <option value="revenue">Sort by Revenue</option>
                            <option value="growth">Sort by Growth</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--bg-tertiary)' }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Rank</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Product</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Units Sold</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Revenue</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Growth</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Stores</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map((product, idx) => (
                                <tr
                                    key={idx}
                                    className="transition-colors hover:bg-slate-50"
                                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                                >
                                    <td className="px-4 py-4">
                                        <span
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                            style={{ backgroundColor: idx < 3 ? CHART_COLORS[idx] : 'var(--text-tertiary)' }}
                                        >
                                            {product.rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.menuProduct?.imageUrl ? (
                                                <img src={product.menuProduct.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                                                    <Package size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                                                {product.menuProduct?.category && (
                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{product.menuProduct.category}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {product.value.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right font-medium" style={{ color: 'var(--success)' }}>
                                        {formatCurrency(product.revenue)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${product.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {product.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {product.growth >= 0 ? '+' : ''}{product.growth}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            <Store size={14} />
                                            {product.stores}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedProducts.length === 0 && (
                    <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No products found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
