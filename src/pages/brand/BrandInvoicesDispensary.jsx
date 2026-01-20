import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getSales, updateSaleStatus, updateSale } from '../../services/firestoreService';
import {
    Clock, CheckCircle, ArrowDownLeft, AlertCircle, ExternalLink, Loader
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export default function BrandInvoicesDispensary() {
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();
    const [invoices, setInvoices] = useState({ paid: [], unpaid: [] });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

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
                        amount: sale.amount,
                        status: sale.status,
                        paymentStatus: sale.paymentStatus || 'unpaid',
                        date: sale.date,
                        dueDate: new Date(new Date(sale.date).setDate(new Date(sale.date).getDate() + 14)).toLocaleDateString()
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

    const handleMarkPaid = async (saleId) => {
        if (!confirm("Mark this invoice as PAID? This will update the status for the dispensary.")) return;
        setProcessingId(saleId);
        try {
            await updateSale(saleId, { paymentStatus: 'paid', paidDate: new Date().toISOString() });

            // Optimistic Update
            setInvoices(prev => {
                const moved = prev.unpaid.find(i => i.id === saleId);
                if (!moved) return prev;
                return {
                    paid: [...prev.paid, { ...moved, paymentStatus: 'paid', paidDate: 'Just now' }],
                    unpaid: prev.unpaid.filter(i => i.id !== saleId)
                };
            });
        } catch (error) {
            console.error("Failed to update status", error);
            showNotification("Failed to update invoice status.", 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const totalReceivable = invoices.unpaid.reduce((sum, i) => sum + i.amount, 0);
    const totalCollected = invoices.paid.reduce((sum, i) => sum + i.amount, 0);

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
                                <div key={inv.id} className="p-4 transition-colors"
                                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{inv.dispensary}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Order #{inv.id}</p>
                                        </div>
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Due: {inv.dueDate}
                                        </p>
                                        <button
                                            onClick={() => handleMarkPaid(inv.id)}
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
                                <div key={inv.id} className="p-4 transition-colors"
                                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inv.dispensary}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Order #{inv.id}</p>
                                        </div>
                                        <p className="font-bold" style={{ color: 'var(--success)' }}>+${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid on {inv.date || 'Recent'}</p>
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
        </div>
    );
}
