import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    ShoppingCart, Check, X, Calendar, Truck,
    Clock, CheckCircle, XCircle, Package,
    ChevronDown, Search, Filter, FileText, Upload, Download,
    MapPin, FileCheck
} from 'lucide-react';

import { getSales, updateSaleStatus, updateSale } from '../../services/firestoreService';
import { getMondayIntegrationStatus, syncOrderToMonday } from '../../services/mondayService';
import { generateManifestPDF } from '../../utils/manifestGenerator';
import SampleRequests from '../../components/SampleRequests';
import { useNotification } from '../../contexts/NotificationContext';
import BrandOrderUploadModal from './BrandOrderUploadModal';

export default function BrandOrders() {
    const { brandUser } = useBrandAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [deliveryModal, setDeliveryModal] = useState({ open: false, orderId: null, date: '', syncToMonday: true });
    const [mondayIntegration, setMondayIntegration] = useState({ connected: false, ordersBoardId: null });
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        async function fetchMondayStatus() {
            if (brandUser?.brandId) {
                const status = await getMondayIntegrationStatus(brandUser.brandId);
                setMondayIntegration(status);
            }
        }
        fetchMondayStatus();
    }, [brandUser]);

    const fetchOrders = async () => {
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
                    dispensaryAddress: sale.dispensaryAddress || sale.address || '',
                    licenseNumber: sale.licenseNumber || sale.ocmNumber || '',
                    contact: sale.contactPerson || sale.userName || 'N/A',
                    products: brandItems.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total: total,
                    status: sale.status || 'pending',
                    orderDate: sale.date?.toDate ? sale.date.toDate().toISOString().split('T')[0] : new Date(sale.date).toISOString().split('T')[0],
                    deliveryDate: sale.deliveryDate || null,
                    paymentTerms: sale.paymentTerms || 'COD',
                    representative: sale.representativeName || sale.userName || 'Unassigned'
                };
            });

            setOrders(brandOrders);
        } catch (error) {
            console.error("Failed to fetch brand orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
                const updatedOrder = { ...orders.find(o => o.id === deliveryModal.orderId), status: 'accepted', deliveryDate: deliveryModal.date };
                setOrders(prev => prev.map(o => o.id === deliveryModal.orderId ? updatedOrder : o));

                // Sync to Monday.com if enabled
                if (deliveryModal.syncToMonday && mondayIntegration.connected && mondayIntegration.ordersBoardId) {
                    const syncResult = await syncOrderToMonday(brandUser.brandId, updatedOrder, mondayIntegration.ordersBoardId);
                    if (syncResult.success) {
                        showNotification('Order synced to Monday.com successfully!', 'success');
                        // Optionally update order with mondayItemId
                        setOrders(prev => prev.map(o => o.id === deliveryModal.orderId ? { ...o, mondayItemId: syncResult.mondayItemId } : o));
                    } else {
                        showNotification(`Failed to sync order to Monday.com: ${syncResult.error}`, 'error');
                    }
                }
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

    // CSV Export Function
    const exportOrdersToCSV = (ordersToExport) => {
        if (ordersToExport.length === 0) {
            showNotification('No orders to export', 'warning');
            return;
        }

        const headers = ['Order ID', 'Dispensary', 'Address', 'OCM License', 'Contact', 'Products', 'Total', 'Payment Terms', 'Status', 'Order Date', 'Delivery Date', 'Representative'];
        const rows = ordersToExport.map(order => [
            order.id,
            order.dispensary,
            order.dispensaryAddress,
            order.licenseNumber,
            order.contact,
            order.products.map(p => `${p.quantity}x ${p.name}`).join('; '),
            order.total,
            order.paymentTerms,
            order.status,
            order.orderDate,
            order.deliveryDate || '',
            order.representative
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Orders exported successfully', 'success');
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage incoming orders from dispensaries</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                    >
                        <Upload size={16} />
                        Import CSV
                    </button>
                    <button
                        onClick={() => exportOrdersToCSV(filteredOrders)}
                        className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg outline-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'accepted', 'fulfilled', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filter === f
                                ? 'bg-amber-500 text-white'
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
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }} className="text-center py-12 rounded-xl border">
                        <ShoppingCart size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>No orders found</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }} className="rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <Package size={24} style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{order.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[order.status]}`}>
                                                {statusIcons[order.status]}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            {order.paymentTerms && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                    {order.paymentTerms}
                                                </span>
                                            )}
                                            {order.mondayItemId && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                                    <CheckCircle size={12} /> Synced
                                                </span>
                                            )}
                                        </div>
                                        {/* Dispensary Info - CRITICAL for order processing */}
                                        <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{order.dispensary}</p>
                                            {order.dispensaryAddress && (
                                                <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    <MapPin size={14} className="shrink-0" />
                                                    {order.dispensaryAddress}
                                                </p>
                                            )}
                                            {order.licenseNumber && (
                                                <p className="text-sm flex items-center gap-1 mt-1 font-medium" style={{ color: 'var(--accent-primary)' }}>
                                                    <FileCheck size={14} className="shrink-0" />
                                                    OCM License: {order.licenseNumber}
                                                </p>
                                            )}
                                            {!order.dispensaryAddress && !order.licenseNumber && (
                                                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">⚠️ Missing compliance info - verify before fulfilling</p>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--text-tertiary)' }}>Contact: {order.contact} • Rep: {order.representative}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${order.total.toLocaleString()}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ordered {order.orderDate}</p>
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
                                    {!order.mondayItemId && mondayIntegration.connected && mondayIntegration.salesBoardId && (
                                        <button
                                            onClick={async () => {
                                                const syncResult = await syncOrderToMonday(brandUser.brandId, order, mondayIntegration.salesBoardId);
                                                if (syncResult.success) {
                                                    showNotification('Order synced to Monday.com successfully!', 'success');
                                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, mondayItemId: syncResult.mondayItemId } : o));
                                                } else {
                                                    showNotification(`Failed to sync order to Monday.com: ${syncResult.error}`, 'error');
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                                        >
                                            <img src="https://dapulse-res.cloudinary.com/image/upload/v1575480544/mondaycom/logos/monday_logo_color.png" alt="Monday.com Logo" className="h-6 w-auto object-contain" />
                                            Sync
                                        </button>
                                    )}
                                    {(order.status === 'accepted' || order.status === 'fulfilled') && (
                                        <button
                                            onClick={() => generateManifestPDF(order, {
                                                shipper: { name: brandUser.brandName, address: 'See Facility Address', license: 'P-123' },
                                                driver: { name: 'Assigned Driver', vehiclePlate: 'ABC-123' },
                                                route: 'Standard Route'
                                            })}
                                            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            title="Generate PDF Manifest"
                                        >
                                            <FileText size={16} />
                                            Manifest
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Products */}
                            <div className="p-4" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: 'var(--text-tertiary)' }}>Products</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.products.map((p, i) => (
                                        <span key={i} className="px-3 py-1 border rounded-full text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                            {p.quantity}x {p.name} @ ${p.price}
                                        </span>
                                    ))}
                                </div>
                                {order.deliveryDate && (
                                    <p className="mt-2 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Calendar size={14} className="text-emerald-500" />
                                        <span className="font-bold">Delivery:</span> {order.deliveryDate}
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
                    <div style={{ background: 'var(--bg-card)' }} className="rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Set Delivery Date</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>When will this order be delivered?</p>
                            <input
                                type="date"
                                className="w-full p-3 rounded-lg outline-none"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                value={deliveryModal.date}
                                onChange={(e) => setDeliveryModal(prev => ({ ...prev, date: e.target.value }))}
                            />
                            {mondayIntegration.connected && mondayIntegration.ordersBoardId && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-3">
                                        <img src="https://dapulse-res.cloudinary.com/image/upload/v1575480544/mondaycom/logos/monday_logo_color.png" alt="Monday.com Logo" className="h-6 w-auto object-contain" />
                                        <label htmlFor="syncToMonday" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sync to Monday.com</label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryModal(prev => ({ ...prev, syncToMonday: !prev.syncToMonday }))}
                                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${deliveryModal.syncToMonday ? 'bg-amber-600' : 'bg-gray-200'
                                            }`}
                                        aria-pressed="false"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${deliveryModal.syncToMonday ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        ></span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                            <button
                                onClick={() => setDeliveryModal({ open: false, orderId: null, date: '' })}
                                className="px-4 py-2 font-medium rounded-lg"
                                style={{ color: 'var(--text-secondary)' }}
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

            {/* CSV Import Modal */}
            <BrandOrderUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                brandId={brandUser?.brandId}
                onOrderCreated={fetchOrders}
            />
        </div>
    )
}
