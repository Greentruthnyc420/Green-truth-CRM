import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getSales, updateSaleStatus, updateSale } from '../../services/firestoreService';
import {
    Clock, CheckCircle, ArrowDownLeft, AlertCircle, ExternalLink, Loader
} from 'lucide-react';

export default function BrandInvoicesDispensary() {
    const { brandUser } = useBrandAuth();
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
                // In a real app, we'd filter server-side. Here we match brand name from catalog or user.
                const brandSales = allSales.filter(sale => {
                    // Check if sale has items from this brand
                    // Since our mock sales structure is flat-ish, we'll check 'activeBrands' or just assume match for demo if brandId matches
                    // For the demo prototype, we'll assume ALL sales are visible if we are in 'Admin' mode, 
                    // but for a specific Brand, we only want their sales.
                    // Let's filter by checking if any item in the sale belongs to this brand.

                    if (sale.items && Array.isArray(sale.items)) {
                        return sale.items.some(item => item.brandId === brandUser.brandId);
                    }
                    // Fallback for mock data that might lack items array
                    return true;
                });

                const paid = [];
                const unpaid = [];

                brandSales.forEach(sale => {
                    // Determine Payment Status: explicit 'paymentStatus' field OR fallback to 'status' if 'paid'
                    // We prefer paymentStatus to separate "Commission Paid" from "Invoice Paid"
                    const isPaid = sale.paymentStatus === 'paid';
                    // Note: We deliberately ignore sale.status === 'paid' here because that might mean Rep Commission Paid.
                    // However, for backward compatibility with existing mock data that might only have 'status',
                    // we might need a check. BUT, for this new feature, let's stick to 'paymentStatus'.

                    const invoice = {
                        id: sale.id, // Using Sale ID as Invoice ID for simplicity
                        dispensary: sale.dispensaryName,
                        amount: sale.amount,
                        status: sale.status, // Commission/Lifecycle status
                        paymentStatus: sale.paymentStatus || 'unpaid', // Invoice payment status
                        date: sale.date,
                        dueDate: new Date(new Date(sale.date).setDate(new Date(sale.date).getDate() + 14)).toLocaleDateString() // Net 14
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
            // Update using new generic function to set paymentStatus specifically
            // We verify updateSale exists (it should be imported or available)
            // If not available in import yet, ensure we added it to firestoreService.js
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
            alert("Failed to update invoice status.");
        } finally {
            setProcessingId(null);
        }
    };

    const totalReceivable = invoices.unpaid.reduce((sum, i) => sum + i.amount, 0);
    const totalCollected = invoices.paid.reduce((sum, i) => sum + i.amount, 0);

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
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowDownLeft className="text-amber-600" />
                        Dispensary Invoices
                    </h1>
                    <p className="text-slate-500">Track payments incoming from dispensaries (Accounts Receivable)</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">Total Receivable</p>
                        <p className="text-xl font-bold text-emerald-700">${totalReceivable.toLocaleString()}</p>
                    </div>
                    {/* New Total Collected Card */}
                    <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Total Collected</p>
                        <p className="text-xl font-bold text-blue-700">${totalCollected.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unpaid Invoices */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-amber-500" />
                            Pending Payments
                        </h3>
                        <span className="text-xs font-medium bg-amber-100 text-orange-600 px-2 py-1 rounded-full">{invoices.unpaid.length} pending</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {invoices.unpaid.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No pending invoices.</div>
                        ) : (
                            invoices.unpaid.map((inv) => (
                                <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-bold text-slate-800">{inv.dispensary}</p>
                                            <p className="text-xs text-slate-500">Order #{inv.id}</p>
                                        </div>
                                        <p className="font-bold text-slate-800">${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-500">
                                            Due: {inv.dueDate}
                                        </p>
                                        <button
                                            onClick={() => handleMarkPaid(inv.id)}
                                            disabled={processingId === inv.id}
                                            className="px-3 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm shadow-emerald-200"
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
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle size={18} className="text-amber-600" />
                            Received Payments
                        </h3>
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{invoices.paid.length} received</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {invoices.paid.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No received payments yet.</div>
                        ) : (
                            invoices.paid.map((inv) => (
                                <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-medium text-slate-800">{inv.dispensary}</p>
                                            <p className="text-xs text-slate-500">Order #{inv.id}</p>
                                        </div>
                                        <p className="font-bold text-amber-700">+${inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-400">Paid on {inv.date || 'Recent'}</p>
                                        <span className="text-xs font-medium text-amber-700 bg-emerald-50 px-2 py-0.5 rounded">Settled</span>
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
