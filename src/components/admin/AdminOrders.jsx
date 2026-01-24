import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Package, Search, Truck, X,
    CheckCircle, Calendar, Filter, AlertCircle, Loader,
    MapPin, FileCheck, FileText, Download, Printer,
    DollarSign, User, Phone, Mail
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { BRAND_LICENSES } from '../../contexts/BrandAuthContext';
import { getSales, updateSale, updateSaleStatus } from '../../services/firestoreService';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminOrders() {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [processing, setProcessing] = useState(false);
    const [deliveryModal, setDeliveryModal] = useState({ open: false, orderId: null, date: '' });
    const [selectedOrder, setSelectedOrder] = useState(null); // For order detail/invoice modal

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
                    invoiceNumber: sale.invoiceNumber || null,
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
                                <div
                                    key={order.id}
                                    className="themed-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
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
                                                    {/* Only show compliance warning for pending orders missing license */}
                                                    {!order.licenseNumber && order.status === 'pending' && (
                                                        <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">⚠️ Verify license before fulfilling</p>
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

            {/* Order Detail / Invoice Modal */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="themed-card rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Invoice Header */}
                        <div className="p-6" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Invoice</span>
                                    </div>
                                    <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                                        {selectedOrder.invoiceNumber || `#${selectedOrder.id?.slice(0, 8) || 'N/A'}`}
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {selectedOrder.orderDate} • {selectedOrder.paymentTerms}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-full transition-colors hover:bg-black/10"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>Bill To</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                                    <Package size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedOrder.dispensary}</h4>
                                    {selectedOrder.dispensaryAddress && (
                                        <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            <MapPin size={14} /> {selectedOrder.dispensaryAddress}
                                        </p>
                                    )}
                                    {selectedOrder.licenseNumber && (
                                        <p className="text-sm flex items-center gap-1 mt-1 font-medium" style={{ color: 'var(--accent-primary)' }}>
                                            <FileCheck size={14} /> OCM: {selectedOrder.licenseNumber}
                                        </p>
                                    )}
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Contact: {selectedOrder.contact}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Products Table - Grouped by Brand */}
                        <div className="p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>Items</h3>
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                {/* Group products by brand */}
                                {(() => {
                                    const productsByBrand = {};
                                    (selectedOrder.products || []).forEach(product => {
                                        const brandId = product.brandId || 'unknown';
                                        if (!productsByBrand[brandId]) {
                                            productsByBrand[brandId] = [];
                                        }
                                        productsByBrand[brandId].push(product);
                                    });

                                    const brandIds = Object.keys(productsByBrand);
                                    const isMultiBrand = brandIds.length > 1;

                                    return brandIds.map((brandId, groupIdx) => {
                                        const products = productsByBrand[brandId];
                                        const brandInfo = BRAND_LICENSES[Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === brandId)];
                                        const brandName = brandInfo?.brandName || brandId;
                                        const brandSubtotal = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

                                        return (
                                            <div key={brandId} className={isMultiBrand ? "p-3 rounded-xl" : ""} style={isMultiBrand ? { background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' } : {}}>
                                                {/* Brand Header - only show for multi-brand orders */}
                                                {isMultiBrand && (
                                                    <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                                                                {groupIdx + 1}
                                                            </div>
                                                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{brandName}</span>
                                                        </div>
                                                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                                            ${brandSubtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Products for this brand */}
                                                <div className="space-y-2">
                                                    {products.map((product, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3 rounded-xl"
                                                            style={{ background: 'var(--bg-secondary)' }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                                    {product.quantity}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                        @ ${product.price?.toFixed(2)} each
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                                                ${(product.quantity * product.price).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Totals - Per Brand + Grand Total */}
                        <div className="p-6" style={{ background: 'var(--bg-secondary)' }}>
                            {/* Per-Brand Totals - for invoice purposes */}
                            {(() => {
                                const productsByBrand = {};
                                (selectedOrder.products || []).forEach(product => {
                                    const brandId = product.brandId || 'unknown';
                                    if (!productsByBrand[brandId]) {
                                        productsByBrand[brandId] = { items: [], total: 0 };
                                    }
                                    productsByBrand[brandId].items.push(product);
                                    productsByBrand[brandId].total += (product.quantity || 0) * (product.price || 0);
                                });

                                const brandIds = Object.keys(productsByBrand);
                                const isMultiBrand = brandIds.length > 1;

                                if (!isMultiBrand) {
                                    // Single brand - just show simple total
                                    return (
                                        <div className="flex items-center justify-between mb-2">
                                            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${selectedOrder.total?.toFixed(2)}</span>
                                        </div>
                                    );
                                }

                                // Multi-brand - show per-brand invoice totals
                                return (
                                    <div className="space-y-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Invoice Breakdown</p>
                                        {brandIds.map((brandId, idx) => {
                                            const brandInfo = BRAND_LICENSES[Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === brandId)];
                                            const brandName = brandInfo?.brandName || brandId;
                                            const brandTotal = productsByBrand[brandId].total;
                                            return (
                                                <div key={brandId} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brandName}</span>
                                                    </div>
                                                    <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>${brandTotal.toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Grand Total - for overall sale tracking */}
                            <div className="flex items-center justify-between pt-3" style={{ borderTop: Object.keys((selectedOrder.products || []).reduce((acc, p) => { acc[p.brandId || 'unknown'] = true; return acc; }, {})).length > 1 ? 'none' : '2px dashed var(--border-primary)' }}>
                                <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                                <span className="text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>${selectedOrder.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 flex gap-3" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}>
                            {selectedOrder.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleAcceptOrder(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2"
                                        style={{ background: 'var(--success)', color: 'white' }}
                                    >
                                        <CheckCircle size={18} /> Accept Order
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleRejectOrder(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2"
                                        style={{ background: 'var(--error)', color: 'white' }}
                                    >
                                        <X size={18} /> Reject
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === 'accepted' && (
                                <button
                                    onClick={() => {
                                        handleFulfillOrder(selectedOrder.id);
                                        setSelectedOrder(null);
                                    }}
                                    className="flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2"
                                    style={{ background: 'var(--info)', color: 'white' }}
                                >
                                    <Truck size={18} /> Mark as Fulfilled
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-3 font-bold rounded-xl"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
