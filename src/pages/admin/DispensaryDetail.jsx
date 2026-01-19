import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, MapPin, FileText, DollarSign, ShoppingBag, Calendar, TrendingUp, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import { getLead, getSales } from '../../services/firestoreService';

export default function DispensaryDetail() {
    const { id } = useParams();
    const [dispensary, setDispensary] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load dispensary info
                const leadData = await getLead(id);
                setDispensary(leadData);

                // Load all sales and filter by this dispensary
                const allSales = await getSales();
                const dispensarySales = allSales.filter(s =>
                    s.dispensaryId === id ||
                    s.dispensaryName === leadData?.dispensaryName
                );
                setSales(dispensarySales);
            } catch (err) {
                console.error('Failed to load dispensary details:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    const toggleRow = (saleId) => {
        setExpandedRows(prev => ({
            ...prev,
            [saleId]: !prev[saleId]
        }));
    };

    // Calculate analytics
    const analytics = React.useMemo(() => {
        const totalSpent = sales.reduce((sum, s) => sum + (parseFloat(s.totalAmount || s.amount) || 0), 0);
        const avgOrder = sales.length > 0 ? totalSpent / sales.length : 0;
        const lastOrderDate = sales.length > 0
            ? new Date(Math.max(...sales.map(s => new Date(s.date || s.saleDate || s.createdAt))))
            : null;

        // Category breakdown
        const categoryMap = {};
        const brandMap = {};
        const monthlyMap = {};

        sales.forEach(sale => {
            const items = sale.items || sale.products || [];
            items.forEach(item => {
                // Category
                const category = item.category || 'Other';
                categoryMap[category] = (categoryMap[category] || 0) + (item.quantity || 1);

                // Brand
                const brand = item.brandName || 'Unknown';
                brandMap[brand] = (brandMap[brand] || 0) + ((item.price || 0) * (item.quantity || 1));
            });

            // Monthly trend
            const saleDate = new Date(sale.date || sale.saleDate || sale.createdAt);
            const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + (parseFloat(sale.totalAmount || sale.amount) || 0);
        });

        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

        const categoryData = Object.entries(categoryMap)
            .map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] }))
            .sort((a, b) => b.value - a.value);

        const brandData = Object.entries(brandMap)
            .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const monthlyData = Object.entries(monthlyMap)
            .map(([month, value]) => ({ month, value }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        return { totalSpent, avgOrder, lastOrderDate, categoryData, brandData, monthlyData };
    }, [sales]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!dispensary) {
        return (
            <div className="text-center py-12">
                <Store size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Dispensary Not Found</h2>
                <Link to="/admin/pipeline" className="text-brand-600 hover:underline mt-2 inline-block">
                    ← Back to Pipeline
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link to="/admin/pipeline" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Pipeline
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                            <Store size={24} />
                        </div>
                        {dispensary.dispensaryName}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        {dispensary.address && (
                            <span className="flex items-center gap-1">
                                <MapPin size={14} /> {dispensary.address}
                            </span>
                        )}
                        {dispensary.licenseNumber && (
                            <span className="flex items-center gap-1">
                                <FileText size={14} /> {dispensary.licenseNumber}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${dispensary.leadStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    dispensary.leadStatus === 'prospect' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {dispensary.leadStatus || 'Unknown'}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                    <p className="text-2xl font-black text-slate-800">{sales.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Spent</p>
                    <p className="text-2xl font-black text-emerald-600">
                        ${analytics.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Avg Order</p>
                    <p className="text-2xl font-black text-slate-800">
                        ${analytics.avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Last Order</p>
                    <p className="text-2xl font-black text-slate-800">
                        {analytics.lastOrderDate ? analytics.lastOrderDate.toLocaleDateString() : 'Never'}
                    </p>
                </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Package size={18} className="text-brand-500" />
                        Category Breakdown
                    </h3>
                    {analytics.categoryData.length > 0 ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.categoryData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {analytics.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400">
                            No category data available
                        </div>
                    )}
                </div>

                {/* Brand Performance */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Top Brands by Revenue
                    </h3>
                    {analytics.brandData.length > 0 ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.brandData} layout="vertical">
                                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400">
                            No brand data available
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trend */}
            {analytics.monthlyData.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        Purchase Trend
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.monthlyData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Purchase History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-orange-500" />
                        Purchase History
                    </h3>
                </div>

                {sales.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No purchases recorded for this dispensary yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sales.map(sale => {
                            const items = sale.items || sale.products || [];
                            const isExpanded = expandedRows[sale.id];

                            return (
                                <div key={sale.id}>
                                    <div
                                        className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => toggleRow(sale.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">
                                                    ${(parseFloat(sale.totalAmount || sale.amount) || 0).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(sale.date || sale.saleDate || sale.createdAt).toLocaleDateString()}
                                                    {items.length > 0 && ` • ${items.length} item${items.length > 1 ? 's' : ''}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {sale.brandName && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                                    {sale.brandName}
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                sale.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {sale.status || 'pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Item Details */}
                                    {isExpanded && items.length > 0 && (
                                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Items Purchased</p>
                                            <div className="space-y-2">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-slate-100">
                                                        <div>
                                                            <span className="font-medium text-slate-700">{item.name || item.productId || 'Unknown Product'}</span>
                                                            {item.brandName && (
                                                                <span className="text-slate-400 ml-2">({item.brandName})</span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-slate-500">{item.quantity || 1}x @ ${(item.price || 0).toFixed(2)}</span>
                                                            <span className="font-bold text-slate-800 ml-3">
                                                                ${((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isExpanded && items.length === 0 && (
                                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-sm text-slate-400">
                                            No item details available for this sale.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Contacts */}
            {dispensary.contacts && dispensary.contacts.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Contacts</h3>
                    <div className="space-y-2">
                        {dispensary.contacts.map((contact, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    {(contact.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700">{contact.name || 'Unknown'}</p>
                                    <p className="text-slate-400">{contact.phone || contact.email || 'No contact info'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
