import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Users, Award, TrendingUp, Store, Globe, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { getSales } from '../../services/firestoreService';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { db } from '../../firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSalesCount: 0,
        activeSellers: 0,
        revenueData: [],
        productMix: []
    });
    const [integrationStats, setIntegrationStats] = useState({
        connectedBrands: 0,
        totalSyncs: 0,
        failedSyncs: 0,
        syncsLast24h: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const sales = await getSales();

                // 1. Total Revenue
                const totalRevenue = sales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

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

                setStats({
                    totalRevenue,
                    totalSalesCount: sales.length,
                    activeSellers,
                    revenueData,
                    productMix
                });

            } catch (err) {
                console.error("Failed to load analytics", err);
            }
        }

        async function fetchIntegrationStats() {
            try {
                const integrationsSnapshot = await getDocs(collection(db, 'brand_integrations'));
                const connectedBrands = integrationsSnapshot.docs.filter(doc => doc.data().mondayApiToken).length;

                const logsCollection = collection(db, 'brand_sync_logs');
                const syncLogsSnapshot = await getDocs(logsCollection);
                const totalSyncs = syncLogsSnapshot.size;

                const failedQuery = query(logsCollection, where('success', '==', false));
                const failedSnapshot = await getDocs(failedQuery);
                const failedSyncs = failedSnapshot.size;

                const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
                const recentQuery = query(logsCollection, where('timestamp', '>', oneDayAgo));
                const recentSnapshot = await getDocs(recentQuery);
                const syncsLast24h = recentSnapshot.size;

                setIntegrationStats({
                    connectedBrands,
                    totalSyncs,
                    failedSyncs,
                    syncsLast24h,
                });

            } catch (err) {
                console.error("Failed to load integration stats", err);
            }
        }

        fetchAnalytics();
        fetchIntegrationStats();
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

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Total Revenue</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Sales Count</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{stats.totalSalesCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Active Sellers</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{stats.activeSellers}</p>
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

            {/* Integration Health Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Monday.com Integration Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Connected Brands</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{integrationStats.connectedBrands}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <CheckCircle size={20} />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Total Syncs</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{integrationStats.totalSyncs.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Failed Syncs</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{integrationStats.failedSyncs.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                <Zap size={20} />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Activity (24h)</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{integrationStats.syncsLast24h.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
