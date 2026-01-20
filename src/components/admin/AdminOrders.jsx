import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Package, Search, Truck, X,
    CheckCircle, Calendar, Filter, AlertCircle, Loader,
    MapPin, FileCheck
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
                    dispensaryAddress: sale.dispensaryAddress || sale.address || '',
                    licenseNumber: sale.licenseNumber || sale.ocmNumber || '',
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
                    paymentTerms: sale.paymentTerms || 'COD',
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search by ID or Dispensary..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg outline-none transition-colors"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)'
                    }}
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                >
                    <option value="all">All Brands</option>
                    {Object.values(BRAND_LICENSES).map(brand => (
                        <option key={brand.brandId} value={brand.brandId}>{brand.brandName}</option>
                    ))}
                </select>
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    {['all', 'pending', 'accepted', 'fulfilled', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setOrderFilter(f)}
                            className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                            style={{
                                background: orderFilter === f ? 'var(--accent-primary)' : 'transparent',
                                color: orderFilter === f ? 'white' : 'var(--text-secondary)'
                            }}
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
                    <div className="text-center py-12 rounded-xl border-2 border-dashed"
                        style={{ color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
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
                                <div key={order.id} className="themed-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                                                <Package size={24} style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{order.id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusColors[order.status]}`}>
                                                        {order.status}
                                                    </span>
                                                    {order.paymentTerms && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                                                            {order.paymentTerms}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Dispensary Info - CRITICAL for order processing */}
                                                <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{order.dispensary}</p>
                                                    {order.dispensaryAddress && (
                                                        <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                            <MapPin size={12} className="shrink-0" />
                                                            {order.dispensaryAddress}
                                                        </p>
                                                    )}
                                                    {order.licenseNumber && (
                                                        <p className="text-xs flex items-center gap-1 mt-1 font-bold" style={{ color: 'var(--accent-primary)' }}>
                                                            <FileCheck size={12} className="shrink-0" />
                                                            OCM: {order.licenseNumber}
                                                        </p>
                                                    )}
                                                    {!order.dispensaryAddress && !order.licenseNumber && (
                                                        <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">⚠️ Missing compliance info</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-black" style={{ color: 'var(--text-primary)' }}>${order.total.toLocaleString()}</p>
                                                <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-tertiary)' }}>{order.orderDate}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptOrder(order.id)}
                                                            className="p-2 rounded-lg transition-colors"
                                                            style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--info)' }}
                                                            title="Accept"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOrder(order.id)}
                                                            className="p-2 rounded-lg transition-colors"
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}
                                                            title="Reject"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button
                                                        onClick={() => handleFulfillOrder(order.id)}
                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                                        style={{ background: 'var(--success)', color: 'white' }}
                                                    >
                                                        <Truck size={14} /> FULFILL
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 flex flex-wrap gap-2" style={{ background: 'var(--bg-secondary)' }}>
                                        {order.products.map((p, i) => (
                                            <span key={i} className="px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-2"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                                                <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold" style={{ background: 'var(--bg-tertiary)' }}>{p.quantity}</span>
                                                {p.name}
                                                <span style={{ color: 'var(--text-tertiary)' }} className="ml-1">
                                                    {BRAND_LICENSES[Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === p.brandId)]?.brandName || 'Unknown Brand'}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                    {order.deliveryDate && (
                                        <div className="px-4 py-2 text-[11px] font-bold flex items-center gap-2"
                                            style={{ background: 'rgba(99, 102, 241, 0.1)', borderTop: '1px solid var(--border-primary)', color: 'var(--info)' }}>
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
                    <div className="themed-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-8">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--info)' }}>
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Schedule Delivery</h3>
                            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Specify the anticipated delivery arrival date for this order.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase mb-1 ml-1 tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                                        Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full p-4 rounded-2xl outline-none transition-all font-bold"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }}
                                        value={deliveryModal.date}
                                        onChange={(e) => setDeliveryModal(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex gap-3" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                            <button
                                onClick={() => setDeliveryModal({ open: false, orderId: null, date: '' })}
                                className="flex-1 py-4 font-bold rounded-2xl transition-all"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmAcceptOrder}
                                disabled={!deliveryModal.date || processing}
                                className="flex-[2] py-4 font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-2"
                                style={{ background: 'var(--info)', color: 'white' }}
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
