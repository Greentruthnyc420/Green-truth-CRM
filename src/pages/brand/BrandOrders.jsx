import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    ShoppingCart, Check, X, Calendar, Truck,
    Clock, CheckCircle, XCircle, Package,
    ChevronDown, Search, Filter
} from 'lucide-react';

import { getSales, updateSaleStatus, updateSale } from '../../services/firestoreService';

export default function BrandOrders() {
    const { brandUser } = useBrandAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [deliveryModal, setDeliveryModal] = useState({ open: false, orderId: null, date: '' });

    useEffect(() => {
        async function fetchOrders() {
            if (!brandUser?.brandId) return;

            setLoading(true);
            try {
                const allSales = await getSales();

                // Transform sales into orders format for the brand
                const brandOrders = allSales.filter(sale =>
                    sale.items?.some(item => item.brandId === brandUser.brandId)
                ).map(sale => {
                    const brandItems = sale.items.filter(item => item.brandId === brandUser.brandId);
                    const total = brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                    return {
                        id: sale.id || 'N/A',
                        dispensary: sale.dispensaryName || 'Unknown',
                        contact: sale.contactPerson || sale.userName || 'N/A',
                        products: brandItems.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price
                        })),
                        total: total,
                        status: sale.status || 'pending',
                        orderDate: sale.date?.toDate ? sale.date.toDate().toISOString().split('T')[0] : new Date(sale.date).toISOString().split('T')[0],
                        deliveryDate: sale.deliveryDate || null
                    };
                });

                setOrders(brandOrders);
            } catch (error) {
                console.error("Failed to fetch brand orders", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [brandUser]);

    const handleAccept = (orderId) => {
        setDeliveryModal({ open: true, orderId, date: '' });
    };

    const confirmAccept = async () => {
        setProcessing(true);
        try {
            const success = await updateSale(deliveryModal.orderId, {
                status: 'accepted',
                deliveryDate: deliveryModal.date
            });
            if (success) {
                setOrders(prev => prev.map(o =>
                    o.id === deliveryModal.orderId
                        ? { ...o, status: 'accepted', deliveryDate: deliveryModal.date }
                        : o
                ));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
            setDeliveryModal({ open: false, orderId: null, date: '' });
        }
    };

    const handleReject = async (orderId) => {
        if (!confirm('Are you sure you want to reject this order?')) return;
        setProcessing(true);
        try {
            const success = await updateSaleStatus(orderId, 'rejected');
            if (success) {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'rejected' } : o
                ));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleFulfill = async (orderId) => {
        setProcessing(true);
        try {
            const success = await updateSaleStatus(orderId, 'fulfilled');
            if (success) {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'fulfilled' } : o
                ));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const filteredOrders = orders
        .filter(o => filter === 'all' || o.status === filter)
        .filter(o => o.dispensary.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()));

    const statusColors = {
        pending: 'bg-amber-100 text-orange-600',
        accepted: 'bg-blue-100 text-blue-700',
        fulfilled: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700'
    };

    const statusIcons = {
        pending: <Clock size={14} />,
        accepted: <Truck size={14} />,
        fulfilled: <CheckCircle size={14} />,
        rejected: <XCircle size={14} />
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
                <p className="text-slate-500">Manage incoming orders from dispensaries</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'accepted', 'fulfilled', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                        <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No orders found</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                        <Package size={24} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800">{order.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[order.status]}`}>
                                                {statusIcons[order.status]}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">{order.dispensary} • {order.contact}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800">${order.total.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">Ordered {order.orderDate}</p>
                                    </div>
                                    {order.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(order.id)}
                                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
                                            >
                                                <Check size={16} />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleReject(order.id)}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                                            >
                                                <X size={16} />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {order.status === 'accepted' && (
                                        <button
                                            onClick={() => handleFulfill(order.id)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                                        >
                                            <Truck size={16} />
                                            Mark Fulfilled
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Products */}
                            <div className="p-4 bg-slate-50">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Products</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.products.map((p, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700">
                                            {p.quantity}x {p.name} @ ${p.price}
                                        </span>
                                    ))}
                                </div>
                                {order.deliveryDate && (
                                    <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                                        <Calendar size={14} />
                                        Delivery: {order.deliveryDate}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delivery Date Modal */}
            {deliveryModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Set Delivery Date</h3>
                            <p className="text-sm text-slate-500 mb-4">When will this order be delivered?</p>
                            <input
                                type="date"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                value={deliveryModal.date}
                                onChange={(e) => setDeliveryModal(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setDeliveryModal({ open: false, orderId: null, date: '' })}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAccept}
                                disabled={!deliveryModal.date}
                                className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm & Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
