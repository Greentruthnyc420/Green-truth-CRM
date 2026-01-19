import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSales, getUserProfile } from '../../services/firestoreService';
import {
    ShoppingCart, Clock, CheckCircle, XCircle, Truck,
    Package, Calendar, Filter, RefreshCw
} from 'lucide-react';

export default function DispensaryOrders() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [profile, setProfile] = useState(null);

    const fetchOrders = async () => {
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Get user profile to find their dispensary name
            let userProfile = profile;
            if (!userProfile) {
                userProfile = await getUserProfile(currentUser.uid);
                setProfile(userProfile);
            }

            const allSales = await getSales();

            // Filter orders for this dispensary - match by dispensaryName (most reliable)
            // or by dispensaryId if set, or by createdBy/repId as fallback
            const dispensaryName = userProfile?.dispensaryName?.toLowerCase() || '';

            const myOrders = allSales.filter(sale => {
                // Primary: match by dispensary name
                if (dispensaryName && sale.dispensaryName?.toLowerCase() === dispensaryName) {
                    return true;
                }
                // Fallback: match by userId/repId
                if (sale.repId === currentUser.uid || sale.userId === currentUser.uid) {
                    return true;
                }
                return false;
            }).map(sale => ({
                id: sale.id || 'N/A',
                products: sale.products?.length > 0
                    ? sale.products.map(p => ({
                        name: p.name || 'Product',
                        quantity: p.quantity || 1,
                        price: p.price || 0
                    }))
                    : [{ name: 'Order Items', quantity: 1, price: sale.totalAmount || 0 }],
                total: sale.amount || sale.totalAmount || 0,
                status: (sale.status || 'pending').toLowerCase(),
                orderDate: sale.date || sale.createdAt || sale.saleDate,
                deliveryDate: sale.deliveryDate || sale.delivery_date || null,
                brandName: sale.brandName || 'Multiple Brands'
            }));

            setOrders(myOrders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentUser]);

    const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

    const statusConfig = {
        pending: {
            icon: <Clock size={14} />,
            label: 'Pending Review',
            bgClass: 'bg-amber-100',
            textClass: 'text-amber-700',
            description: 'Waiting for brand to review'
        },
        accepted: {
            icon: <Truck size={14} />,
            label: 'Accepted',
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-700',
            description: 'Order confirmed, awaiting delivery'
        },
        fulfilled: {
            icon: <CheckCircle size={14} />,
            label: 'Delivered',
            bgClass: 'bg-emerald-100',
            textClass: 'text-emerald-700',
            description: 'Order completed'
        },
        rejected: {
            icon: <XCircle size={14} />,
            label: 'Rejected',
            bgClass: 'bg-red-100',
            textClass: 'text-red-700',
            description: 'Order was declined'
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Orders</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your order status and deliveries</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'accepted', 'fulfilled', 'rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filter === f
                            ? 'bg-emerald-600 text-white'
                            : ''
                            }`}
                        style={filter !== f ? {
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)'
                        } : {}}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div
                        className="text-center py-12 rounded-xl border"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        <ShoppingCart size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {filter === 'all' ? 'No orders yet. Place your first order!' : `No ${filter} orders found.`}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.pending;
                        return (
                            <div
                                key={order.id}
                                className="rounded-xl border shadow-sm overflow-hidden"
                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                            >
                                {/* Order Header */}
                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--bg-secondary)' }}
                                        >
                                            <Package size={24} style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Order #{order.id}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${status.bgClass} ${status.textClass}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{status.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>${order.total.toLocaleString()}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Ordered {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Recently'}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="p-4" style={{ background: 'var(--bg-secondary)' }}>
                                    <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: 'var(--text-tertiary)' }}>Products</p>
                                    <div className="flex flex-wrap gap-2">
                                        {order.products.map((p, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 border rounded-full text-sm"
                                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                            >
                                                {p.quantity}x {p.name} @ ${p.price}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Delivery Date - only show if accepted or fulfilled */}
                                    {order.deliveryDate && (order.status === 'accepted' || order.status === 'fulfilled') && (
                                        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                            <Calendar size={14} className="text-emerald-600" />
                                            <span className="font-bold">
                                                {order.status === 'fulfilled' ? 'Delivered' : 'Expected Delivery'}:
                                            </span>
                                            <span>{new Date(order.deliveryDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
