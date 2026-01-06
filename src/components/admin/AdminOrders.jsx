import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Package, Search, Truck, X,
    CheckCircle, Calendar, Filter, AlertCircle
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { BRAND_LICENSES } from '../../contexts/BrandAuthContext';
import { getSales, updateSale, updateSaleStatus } from '../../services/firestoreService';

export default function AdminOrders() {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [processing, setProcessing] = useState(false);
    const [deliveryModal, setDeliveryModal] = useState({ open: false, orderId: null, date: '' });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const salesData = await getSales();

            // Transform to Order format
            const globalOrders = salesData.map(sale => {
                const total = (sale.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return {
                    id: sale.id || 'N/A',
                    dispensary: sale.dispensaryName || 'Unknown',
                    contact: sale.contactPerson || sale.userName || 'N/A',
                    products: (sale.items || []).map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        brandId: item.brandId
                    })),
                    total: total,
                    status: sale.status || 'pending',
                    orderDate: sale.date?.toDate ? sale.date.toDate().toISOString().split('T')[0] : new Date(sale.date).toISOString().split('T')[0],
                    deliveryDate: sale.deliveryDate || null,
                    brandIds: [...new Set((sale.items || []).map(i => i.brandId))]
                };
            });

            setOrders(globalOrders);
        } catch (error) {
            console.error("Error fetching admin orders:", error);
            showNotification("Failed to load orders", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleAcceptOrder = (orderId) => {
        setDeliveryModal({ open: true, orderId, date: '' });
    };

    const confirmAcceptOrder = async () => {
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
                showNotification("Order accepted successfully", "success");
            }
        } catch (error) {
            console.error(error);
            showNotification("Failed to accept order", "error");
        } finally {
            setProcessing(false);
            setDeliveryModal({ open: false, orderId: null, date: '' });
        }
    };

    const handleRejectOrder = async (orderId) => {
        if (!confirm('Are you sure you want to reject this order?')) return;
        setProcessing(true);
        try {
            const success = await updateSaleStatus(orderId, 'rejected');
            if (success) {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'rejected' } : o
                ));
                showNotification("Order rejected", "success");
            }
        } catch (error) {
            console.error(error);
            showNotification("Failed to reject order", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleFulfillOrder = async (orderId) => {
        setProcessing(true);
        try {
            const success = await updateSaleStatus(orderId, 'fulfilled');
            if (success) {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'fulfilled' } : o
                ));
                showNotification("Order marked as fulfilled", "success");
            }
        } catch (error) {
            console.error(error);
            showNotification("Failed to fulfill order", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or Dispensary..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                >
                    <option value="all">All Brands</option>
                    {Object.values(BRAND_LICENSES).map(brand => (
                        <option key={brand.brandId} value={brand.brandId}>{brand.brandName}</option>
                    ))}
                </select>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {['all', 'pending', 'accepted', 'fulfilled', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setOrderFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${orderFilter === f
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {orders
                    .filter(o => orderFilter === 'all' || o.status === orderFilter)
                    .filter(o => brandFilter === 'all' || o.brandIds.includes(brandFilter))
                    .filter(o => o.dispensary.toLowerCase().includes(orderSearch.toLowerCase()) || o.id.toLowerCase().includes(orderSearch.toLowerCase()))
                    .length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No matches found</p>
                    </div>
                ) : (
                    orders
                        .filter(o => orderFilter === 'all' || o.status === orderFilter)
                        .filter(o => brandFilter === 'all' || o.brandIds.includes(brandFilter))
                        .filter(o => o.dispensary.toLowerCase().includes(orderSearch.toLowerCase()) || o.id.toLowerCase().includes(orderSearch.toLowerCase()))
                        .map((order) => {
                            const statusColors = {
                                pending: 'bg-amber-100 text-orange-600',
                                accepted: 'bg-blue-100 text-blue-700',
                                fulfilled: 'bg-emerald-100 text-emerald-700',
                                rejected: 'bg-red-100 text-red-700'
                            };
                            return (
                                <div key={order.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                                                <Package size={24} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{order.id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusColors[order.status]}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">{order.dispensary}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">${order.total.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">{order.orderDate}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptOrder(order.id)}
                                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                            title="Accept"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOrder(order.id)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button
                                                        onClick={() => handleFulfillOrder(order.id)}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Truck size={14} /> FULFILL
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50/50 flex flex-wrap gap-2">
                                        {order.products.map((p, i) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-slate-100 rounded-md text-[11px] font-medium text-slate-600 flex items-center gap-2">
                                                <span className="w-4 h-4 bg-slate-100 rounded text-[10px] flex items-center justify-center font-bold">{p.quantity}</span>
                                                {p.name}
                                                <span className="text-slate-300 ml-1">
                                                    {BRAND_LICENSES[Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === p.brandId)]?.brandName || 'Unknown Brand'}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                    {order.deliveryDate && (
                                        <div className="px-4 py-2 bg-indigo-50/50 border-t border-indigo-50 text-[11px] text-indigo-700 font-bold flex items-center gap-2">
                                            <Calendar size={12} /> DELIVERY SCHEDULED: {order.deliveryDate}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )
                }
            </div>

            {/* Delivery Date Modal */}
            {deliveryModal.open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Schedule Delivery</h3>
                            <p className="text-slate-500 mb-6">Specify the anticipated delivery arrival date for this order.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">
                                        Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700"
                                        value={deliveryModal.date}
                                        onChange={(e) => setDeliveryModal(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setDeliveryModal({ open: false, orderId: null, date: '' })}
                                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmAcceptOrder}
                                disabled={!deliveryModal.date || processing}
                                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />}
                                CONFIRM & ACCEPT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
