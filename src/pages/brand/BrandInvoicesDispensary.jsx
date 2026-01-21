import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getSales, updateSaleStatus, updateSale } from '../../services/firestoreService';
import {
    Clock, CheckCircle, ArrowDownLeft, AlertCircle, ExternalLink, Loader, X, Eye,
    Calendar, MapPin, FileText, Package, DollarSign, Building2, CreditCard, Hash
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export default function BrandInvoicesDispensary() {
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();
    const [invoices, setInvoices] = useState({ paid: [], unpaid: [] });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Fetch Real Sales Data
    useEffect(() => {
        async function fetchInvoices() {
            if (!brandUser) return;
            setLoading(true);
            try {
                const allSales = await getSales();

                // Filter sales relevant to this brand
                const brandSales = allSales.filter(sale => {
                    if (sale.items && Array.isArray(sale.items)) {
                        return sale.items.some(item => item.brandId === brandUser.brandId);
                    }
                    return true;
                });

                const paid = [];
                const unpaid = [];

                brandSales.forEach(sale => {
                    const isPaid = sale.paymentStatus === 'paid';

                    const invoice = {
                        id: sale.id,
                        dispensary: sale.dispensaryName,
                        dispensaryAddress: sale.dispensaryAddress || 'Address not available',
                        ocLicense: sale.ocLicense || sale.dispensaryLicense || 'N/A',
                        amount: sale.amount,
                        status: sale.status,
                        paymentStatus: sale.paymentStatus || 'unpaid',
                        date: sale.date,
                        createdAt: sale.createdAt || sale.date,
                        paidDate: sale.paidDate,
                        dueDate: new Date(new Date(sale.date).setDate(new Date(sale.date).getDate() + 14)).toLocaleDateString(),
                        items: sale.items || [],
                        notes: sale.notes || '',
                        paymentMethod: sale.paymentMethod || 'COD',
                        repName: sale.repName || 'N/A',
                        repId: sale.userId || sale.repId
                    };

                    if (isPaid) {
                        paid.push(invoice);
                    } else {
                        unpaid.push(invoice);
                    }
                });

                setInvoices({ paid, unpaid });
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInvoices();
    }, [brandUser]);

    const handleMarkPaid = async (saleId, e) => {
        e?.stopPropagation();
        if (!confirm("Mark this invoice as PAID? This will update the status for the dispensary.")) return;
        setProcessingId(saleId);
        try {
            await updateSale(saleId, { paymentStatus: 'paid', paidDate: new Date().toISOString() });

            // Optimistic Update
            setInvoices(prev => {
                const moved = prev.unpaid.find(i => i.id === saleId);
                if (!moved) return prev;
                return {
                    paid: [...prev.paid, { ...moved, paymentStatus: 'paid', paidDate: new Date().toISOString() }],
                    unpaid: prev.unpaid.filter(i => i.id !== saleId)
                };
            });

            // Close modal if this invoice was selected
            if (selectedInvoice?.id === saleId) {
                setSelectedInvoice(prev => ({ ...prev, paymentStatus: 'paid', paidDate: new Date().toISOString() }));
            }

            showNotification("Invoice marked as paid!", 'success');
        } catch (error) {
            console.error("Failed to update status", error);
            showNotification("Failed to update invoice status.", 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const totalReceivable = invoices.unpaid.reduce((sum, i) => sum + i.amount, 0);
    const totalCollected = invoices.paid.reduce((sum, i) => sum + i.amount, 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <ArrowDownLeft style={{ color: 'var(--success)' }} />
                        Invoices to Dispensaries
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track payments owed by dispensaries for product orders (Accounts Receivable)</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Total Receivable</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>${totalReceivable.toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--info)' }}>Total Collected</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--info)' }}>${totalCollected.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unpaid Invoices */}
                <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 flex items-center justify-between" style={{
                        borderBottom: '1px solid var(--border-primary)',
                        background: 'rgba(245, 158, 11, 0.1)'
                    }}>
                        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Clock size={18} style={{ color: 'var(--warning)' }} />
                            Pending Payments
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                            {invoices.unpaid.length} pending
                        </span>
                    </div>
                    <div>
                        {invoices.unpaid.length === 0 ? (
                            <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No pending invoices.</div>
                        ) : (
                            invoices.unpaid.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="p-4 transition-colors cursor-pointer"
                                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                                    onClick={() => setSelectedInvoice(inv)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-start gap-2">
                                            <Eye size={16} className="mt-1 opacity-50" style={{ color: 'var(--accent-primary)' }} />
                                            <div>
                                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{inv.dispensary}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Order #{inv.id?.slice(-8)?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Due: {inv.dueDate}
                                        </p>
                                        <button
                                            onClick={(e) => handleMarkPaid(inv.id, e)}
                                            disabled={processingId === inv.id}
                                            className="px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                            style={{ background: 'var(--warning)' }}
                                        >
                                            {processingId === inv.id ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                            Mark as Paid
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Paid Invoices */}
                <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 flex items-center justify-between" style={{
                        borderBottom: '1px solid var(--border-primary)',
                        background: 'rgba(16, 185, 129, 0.1)'
                    }}>
                        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                            Received Payments
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                            {invoices.paid.length} received
                        </span>
                    </div>
                    <div>
                        {invoices.paid.length === 0 ? (
                            <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No received payments yet.</div>
                        ) : (
                            invoices.paid.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="p-4 transition-colors cursor-pointer"
                                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                                    onClick={() => setSelectedInvoice(inv)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-start gap-2">
                                            <Eye size={16} className="mt-1 opacity-50" style={{ color: 'var(--success)' }} />
                                            <div>
                                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inv.dispensary}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Order #{inv.id?.slice(-8)?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold" style={{ color: 'var(--success)' }}>+${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid on {formatDate(inv.paidDate) || inv.date || 'Recent'}</p>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                            Settled
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedInvoice(null)}>
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                        style={{ background: 'var(--bg-card)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invoice Details</h2>
                                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Order #{selectedInvoice.id?.slice(-8)?.toUpperCase()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-4 py-2 rounded-full text-sm font-bold"
                                    style={{
                                        background: selectedInvoice.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: selectedInvoice.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)'
                                    }}
                                >
                                    {selectedInvoice.paymentStatus === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                                </span>
                                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    ${selectedInvoice.amount?.toLocaleString()}
                                </span>
                            </div>

                            {/* Dispensary Info */}
                            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dispensary Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dispensary Name</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.dispensary}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Hash size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>OC License #</p>
                                            <p className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.ocLicense}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Address</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.dispensaryAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Order Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Order Date</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedInvoice.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock size={18} style={{ color: 'var(--warning)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.dueDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Payment Method</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.paymentMethod}</p>
                                        </div>
                                    </div>
                                    {selectedInvoice.paidDate && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                            <div>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid Date</p>
                                                <p className="font-medium" style={{ color: 'var(--success)' }}>{formatDate(selectedInvoice.paidDate)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line Items */}
                            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                                <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                                    <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Line Items</h3>
                                    <div className="space-y-2">
                                        {selectedInvoice.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                                                <div className="flex items-center gap-3">
                                                    <Package size={16} style={{ color: 'var(--accent-primary)' }} />
                                                    <div>
                                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.productName || item.name || 'Product'}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            {item.quantity} × ${(item.price || item.unitPrice || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    ${((item.quantity || 1) * (item.price || item.unitPrice || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-3 mt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</p>
                                            <p className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>${selectedInvoice.amount?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedInvoice.notes && (
                                <div className="p-4 rounded-xl space-y-2" style={{ background: 'var(--bg-secondary)' }}>
                                    <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Notes</h3>
                                    <p style={{ color: 'var(--text-primary)' }}>{selectedInvoice.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedInvoice.paymentStatus !== 'paid' && (
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setSelectedInvoice(null)}
                                        className="px-4 py-2 rounded-xl font-medium transition-colors"
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={(e) => handleMarkPaid(selectedInvoice.id, e)}
                                        disabled={processingId === selectedInvoice.id}
                                        className="px-6 py-2 rounded-xl font-bold text-white flex items-center gap-2 transition-colors"
                                        style={{ background: 'var(--success)' }}
                                    >
                                        {processingId === selectedInvoice.id ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Mark as Paid
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
