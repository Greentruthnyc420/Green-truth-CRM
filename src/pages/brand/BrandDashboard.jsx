import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Link } from 'react-router-dom';
import {
    Package, ShoppingCart, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Sparkles, UserPlus, Gift, ArrowRight,
    Store, RefreshCw, Boxes, TrendingDown, X, Trophy, HelpCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart as RechartsPC, Pie
} from 'recharts';
import { getSales as getAllSales, getAllActivations, getActivations, checkFirstTourCompleted, markFirstTourCompleted } from '../../services/firestoreService';
import { calculateAgencyShiftCost } from '../../utils/pricing';
import ActivationFormModal from '../../components/ActivationFormModal';
import BrandChatbot from '../../components/BrandChatbot';

import { PRODUCT_CATALOG } from '../../data/productCatalog';
import FLXProcessorDashboard from './FLXProcessorDashboard';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import { getTourSteps } from '../../data/tourSteps';
import IntegrationsPreview from '../../components/IntegrationsPreview';
import { generateBrandDemoData } from '../../data/brandDemoDataGenerator';

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
        top10Products: [],
        aov: 0,
        outstandingInvoices: 0,
        // Performance metrics
        storeReach: 0,
        reorderRate: 0,
        unitsSold: 0,
        monthOverMonthGrowth: 0
    });
    const [brandLeads, setBrandLeads] = useState([]);
    const [upcomingActivations, setUpcomingActivations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isTop10ModalOpen, setIsTop10ModalOpen] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [isFirstTimeTour, setIsFirstTimeTour] = useState(false); // Mandatory first tour
    const [usingDemoData, setUsingDemoData] = useState(false); // Track if showing demo data

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
                // Check if this is the first time tour
                const tourCompleted = await checkFirstTourCompleted(activeBrandId);

                if (!tourCompleted) {
                    // First time! Load demo data and start mandatory tour
                    console.log('First time tour - loading demo data for', activeBrandId);
                    const demoData = generateBrandDemoData(activeBrandId);

                    setFinancials(prev => ({ ...prev, ...demoData.financials }));
                    setBrandLeads(demoData.brandLeads);
                    setUpcomingActivations(demoData.upcomingActivations);
                    setUsingDemoData(true);
                    setIsFirstTimeTour(true);
                    setShowTour(true);
                    setLoading(false);
                    return;
                }

                // Tour completed - load real data
                setUsingDemoData(false);
                setIsFirstTimeTour(false);

                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');
                const { getBrandLeads, getActivations: fetchActivations } = await import('../../services/firestoreService');

                const [metrics, leads, activations] = await Promise.all([
                    calculateBrandMetrics(activeBrandId, currentBrandName),
                    getBrandLeads(activeBrandId),
                    fetchActivations()
                ]);

                // Filter upcoming activations for this brand
                const now = new Date();
                const upcoming = activations
                    .filter(a => {
                        const aDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        return aDate >= now && (a.brandId === activeBrandId || a.brandName === currentBrandName);
                    })
                    .sort((a, b) => {
                        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                        return dateA - dateB;
                    })
                    .slice(0, 10);
                setUpcomingActivations(upcoming);

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

    // Handle tour completion - mark as complete and reload real data
    const handleTourComplete = async () => {
        setShowTour(false);

        if (isFirstTimeTour && activeBrandId) {
            // Mark tour as completed in Supabase
            await markFirstTourCompleted(activeBrandId);

            // Reload with real data
            setIsFirstTimeTour(false);
            setUsingDemoData(false);
            setLoading(true);

            // Trigger data reload by updating a dependency
            // We'll call fetchData logic again
            try {
                const { calculateBrandMetrics } = await import('../../services/brandMetricsService');
                const { getBrandLeads, getActivations: fetchActivations } = await import('../../services/firestoreService');

                const [metrics, leads, activations] = await Promise.all([
                    calculateBrandMetrics(activeBrandId, currentBrandName),
                    getBrandLeads(activeBrandId),
                    fetchActivations()
                ]);

                const now = new Date();
                const upcoming = activations
                    .filter(a => {
                        const aDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        return aDate >= now && (a.brandId === activeBrandId || a.brandName === currentBrandName);
                    })
                    .sort((a, b) => {
                        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                        return dateA - dateB;
                    })
                    .slice(0, 10);
                setUpcomingActivations(upcoming);
                setFinancials(prev => ({ ...prev, ...metrics }));
                setBrandLeads(leads);
            } catch (error) {
                console.error("Failed to reload after tour", error);
            } finally {
                setLoading(false);
            }
        }
    };

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
                                <button className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                    Switch Brand <ArrowRight size={12} />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                                    {brandUser.allowedBrands.map(b => (
                                        <button
                                            key={b.brandId}
                                            onClick={() => setActiveBrandId(b.brandId)}
                                            className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
                                            style={{
                                                background: activeBrandId === b.brandId ? 'var(--accent-primary-soft)' : 'transparent',
                                                color: activeBrandId === b.brandId ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {b.brandName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="mt-1 font-medium italic" style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's your brand performance at a glance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTour(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                        <HelpCircle size={16} />
                        <span className="hidden md:inline">Replay Tour</span>
                    </button>
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
                <Link to="/brand/invoices/greentruth" className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-success">
                            <DollarSign size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium group-hover:underline" style={{ color: 'var(--success)' }}>
                            <ArrowUpRight size={16} />
                            View Details
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.revenue)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Revenue</p>
                </Link>

                {/* Orders */}
                <Link to="/brand/orders" className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-info">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--info)', color: 'var(--text-inverse)', opacity: 0.8 }}>
                            {financials.pendingOrders} pending
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.orderCount}</p>
                    <p className="text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>Total orders • Click to view</p>
                </Link>

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
                <Link to="/brand/invoices/dispensary" className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Unpaid
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(financials.outstandingInvoices)}</p>
                    <p className="text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>Outstanding Invoices • Click to view</p>
                </Link>

                {/* Top Selling Product */}
                <Link
                    to="/brand/products"
                    className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <Package size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Best Seller
                        </span>
                    </div>
                    <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }} title={financials.topProduct}>{financials.topProduct}</p>
                    <p className="text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>Top Selling Product • <span style={{ color: 'var(--accent-primary)' }}>View All Analytics</span></p>
                </Link>

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
                <Link to="/brand/map" className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-info">
                            <Store size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)' }}>
                            Coverage
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.storeReach}</p>
                    <p className="text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>Unique Stores • View Map</p>
                </Link>

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
                <Link to="/brand/products" className="themed-card p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-bg-warning">
                            <Boxes size={24} />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                            Volume
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{financials.unitsSold.toLocaleString()}</p>
                    <p className="text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>Total Units Sold • View Products</p>
                </Link>

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
                                            ''
                                    }`}
                                    style={lead.leadStatus !== 'active' && lead.leadStatus !== 'samples_delivered' && lead.leadStatus !== 'samples_requested' ? { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' } : {}}
                                >
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

            {/* Top 10 Products Modal */}
            {isTop10ModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsTop10ModalOpen(false)}>
                    <div
                        className="themed-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-bg-warning">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Top 10 Products</h2>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ranked by units sold</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTop10ModalOpen(false)}
                                className="p-2 rounded-full hover:opacity-80 transition-opacity"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
                            {financials.top10Products.length > 0 ? (
                                financials.top10Products.map((product, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        {/* Product Image or Rank Badge */}
                                        {product.menuProduct?.imageUrl ? (
                                            <div className="relative">
                                                <img
                                                    src={product.menuProduct.imageUrl}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                    style={{ background: product.color, color: 'white' }}
                                                >
                                                    {product.rank}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
                                                style={{ background: product.color, color: 'white' }}
                                            >
                                                #{product.rank}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{product.value.toLocaleString()} units sold</p>
                                                {product.menuProduct?.price && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--success)' }}>
                                                        ${product.menuProduct.price}
                                                    </span>
                                                )}
                                            </div>
                                            {product.menuProduct?.category && (
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{product.menuProduct.category}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-primary)' }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(product.value / financials.top10Products[0].value) * 100}%`,
                                                        background: product.color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                                    <Package size={48} className="mx-auto mb-3 opacity-30" />
                                    <p>No product data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Integrations Coming Soon Section */}
            <IntegrationsPreview showPOS={true} showERP={true} portalType="brand" />

            {/* Brand Analytics Chatbot */}
            <BrandChatbot
                brandContext={{
                    brandName: currentBrandName,
                    totalRevenue: financials.revenue,
                    totalOrders: financials.orderCount,
                    unitsSold: financials.unitsSold,
                    storeReach: financials.storeReach,
                    outstandingInvoices: financials.outstandingInvoices,
                    monthOverMonthGrowth: financials.monthOverMonthGrowth ? `${financials.monthOverMonthGrowth > 0 ? '+' : ''}${financials.monthOverMonthGrowth.toFixed(1)}%` : null,
                    topProducts: financials.top10Products?.slice(0, 5) || [],
                    upcomingActivations: upcomingActivations.map(a => ({
                        date: (a.date?.toDate ? a.date.toDate() : new Date(a.date)).toLocaleDateString(),
                        dispensaryName: a.dispensaryName,
                        repName: a.repName || 'TBD'
                    })),
                    recentTrends: financials.monthOverMonthGrowth > 0
                        ? `Sales are up ${financials.monthOverMonthGrowth.toFixed(1)}% month over month`
                        : financials.monthOverMonthGrowth < 0
                            ? `Sales are down ${Math.abs(financials.monthOverMonthGrowth).toFixed(1)}% - consider scheduling more activations`
                            : 'Sales are steady this month'
                }}
            />

            {/* Tour Overlay */}
            {showTour && (
                <OnboardingTour
                    steps={getTourSteps('brand')}
                    isFirstTime={isFirstTimeTour}
                    onComplete={handleTourComplete}
                    tourKey={isFirstTimeTour ? 'brand_first_time' : 'brand_replay'}
                />
            )}
        </div>
    );
}
