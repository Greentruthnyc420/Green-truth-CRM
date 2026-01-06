import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';
import { calculateBrandMetrics } from '../services/brandMetricsService';
import {
    Building2, DollarSign, ShoppingCart, TrendingUp,
    Package, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import AdminOrders from '../components/admin/AdminOrders';

const ADMIN_EMAILS = ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com'];

export default function BrandOversight() {
    const { currentUser } = useAuth();
    const [brandMetrics, setBrandMetrics] = useState({});
    const [expandedBrand, setExpandedBrand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance');

    // Security check
    useEffect(() => {
        if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
            window.location.href = '/';
        }
    }, [currentUser]);

    // Fetch metrics for all brands
    useEffect(() => {
        async function fetchAllBrandMetrics() {
            setLoading(true);
            const metrics = {};

            try {
                for (const [licenseKey, brand] of Object.entries(BRAND_LICENSES)) {
                    const brandMetric = await calculateBrandMetrics(brand.brandId, brand.brandName);
                    metrics[brand.brandId] = {
                        ...brand,
                        ...brandMetric
                    };
                }
                setBrandMetrics(metrics);
            } catch (error) {
                console.error('Failed to load brand metrics', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllBrandMetrics();
    }, []);

    const formatCurrency = (amount) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const toggleExpanded = (brandId) => {
        setExpandedBrand(expandedBrand === brandId ? null : brandId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={28} className="text-emerald-600" />
                        Brand Oversight
                    </h1>
                    <p className="text-slate-500">Monitor all brand partners and their performance metrics</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'performance'
                        ? 'text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Performance Metrics
                    {activeTab === 'performance' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'orders'
                        ? 'text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Order Management
                    {activeTab === 'orders' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'performance' ? (
                <div className="grid grid-cols-1 gap-4">
                    {Object.values(brandMetrics).map((brand) => (
                        <div
                            key={brand.brandId}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Summary Card */}
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => toggleExpanded(brand.brandId)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <Building2 size={24} className="text-emerald-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{brand.brandName}</h3>
                                            <p className="text-sm text-slate-500">ID: {brand.brandId}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        {expandedBrand === brand.brandId ? (
                                            <ChevronUp size={20} className="text-slate-600" />
                                        ) : (
                                            <ChevronDown size={20} className="text-slate-600" />
                                        )}
                                    </button>
                                </div>

                                {/* Summary Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1">Revenue</p>
                                        <p className="text-lg font-bold text-slate-800">{formatCurrency(brand.revenue)}</p>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg">
                                        <p className="text-xs text-amber-700 mb-1">Commission Owed</p>
                                        <p className="text-lg font-bold text-amber-800">{formatCurrency(brand.commissionOwed)}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs text-blue-600 mb-1">Activation Costs</p>
                                        <p className="text-lg font-bold text-blue-700">{formatCurrency(brand.activationCosts)}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-lg">
                                        <p className="text-xs text-emerald-600 mb-1">Orders</p>
                                        <p className="text-lg font-bold text-emerald-700">
                                            {brand.orderCount}
                                            {brand.pendingOrders > 0 && (
                                                <span className="text-sm font-normal text-slate-500"> ({brand.pendingOrders} pending)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedBrand === brand.brandId && (
                                <div className="border-t border-slate-200 bg-slate-50 p-6">
                                    <h4 className="font-bold text-slate-800 mb-4">Detailed Metrics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* AOV */}
                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <TrendingUp size={20} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Average Order Value</p>
                                                    <p className="text-xl font-bold text-slate-800">{formatCurrency(brand.aov)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Product */}
                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                    <Package size={20} className="text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Top Selling Product</p>
                                                    <p className="text-lg font-bold text-slate-800 truncate" title={brand.topProduct}>
                                                        {brand.topProduct}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Outstanding Invoices */}
                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <AlertCircle size={20} className="text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Outstanding Invoices</p>
                                                    <p className="text-xl font-bold text-slate-800">{formatCurrency(brand.outstandingInvoices)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                        <h5 className="font-semibold text-slate-700 mb-3">Financial Summary</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Gross Revenue:</span>
                                                <span className="font-semibold text-slate-800">{formatCurrency(brand.revenue)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">GreenTruth Commission (5%):</span>
                                                <span className="font-semibold text-amber-700">-{formatCurrency(brand.commissionOwed)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Activation Costs:</span>
                                                <span className="font-semibold text-blue-700">-{formatCurrency(brand.activationCosts)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                                <span className="font-semibold text-slate-700">Brand Net (Est.):</span>
                                                <span className="font-bold text-emerald-700">
                                                    {formatCurrency(brand.revenue - brand.commissionOwed - brand.activationCosts)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <AdminOrders />
            )}
        </div>
    );
}
