import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getInvoices } from '../../services/invoiceService';
import {
    FileText, ArrowUpRight, AlertTriangle,
    CreditCard, Download, ExternalLink, Clock, X, Eye
} from 'lucide-react';

export default function BrandInvoicesGreenTruth() {
    const { brandUser } = useBrandAuth();
    const [invoices, setInvoices] = useState({ outstanding: [], history: [] });
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!brandUser?.brandId) return;
            try {
                const allInvoices = await getInvoices(brandUser.brandId);

                const outstanding = allInvoices.filter(inv => inv.status !== 'paid');
                const history = allInvoices.filter(inv => inv.status === 'paid');

                setInvoices({ outstanding, history });
            } catch (error) {
                console.error("Failed to fetch invoices:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, [brandUser]);

    const totalPayable = invoices.outstanding.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const totalPaid = invoices.history.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowUpRight className="text-red-500" />
                        Invoices from GreenTruth
                    </h1>
                    <p className="text-slate-500">Platform fees and commissions billed by GreenTruth (Accounts Payable)</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                        <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Total Payable</p>
                        <p className="text-xl font-bold text-red-700">${totalPayable.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Total Paid</p>
                        <p className="text-xl font-bold text-slate-700">${totalPaid.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Payment Schedule Info Banner */}
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={80} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <Clock className="text-red-400" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Quarterly Commission</p>
                            <p className="text-sm font-medium">Due within 14 days of quarter end</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <Clock className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Biweekly Fees</p>
                            <p className="text-sm font-medium">Activations & Service fees due Mondays</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outstanding Invoices */}
            <div className="rounded-xl shadow-sm overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="p-4 bg-red-50/30" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Outstanding Invoices</h2>
                </div>
                {invoices.outstanding.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {invoices.outstanding.map((inv) => (
                            <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Invoice #{inv.id.slice(0, 8)}...</h3>
                                        {inv.status === 'overdue' && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                <AlertTriangle size={12} /> Overdue
                                            </span>
                                        )}
                                        <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Due {inv.dueDate || 'Upon Receipt'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${(inv.totalAmount || 0).toFixed(2)}</span>
                                    <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="flex items-center gap-1 text-sm font-medium transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        <Eye size={16} /> Details
                                    </button>
                                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
                                        <CreditCard size={16} />
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                        No outstanding invoices. You're all paid up!
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Payment History</h2>
                </div>
                <table className="w-full text-sm">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr className="text-left text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            <th className="px-6 py-3">Invoice</th>
                            <th className="px-6 py-3">Date Paid</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoices.history.map((inv) => (
                            <tr key={inv.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                <td className="px-6 py-4">
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>#{inv.id.slice(0, 8)}...</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(inv.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{inv.paidDate || '-'}</td>
                                <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>${(inv.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="transition-colors"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invoice Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" style={{ background: 'var(--bg-card)' }}>
                        <div className="p-6 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)' }}>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invoice Details</h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>#{selectedInvoice.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <div>
                                    <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Status</p>
                                    <p className={`font-bold capitalize ${selectedInvoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedInvoice.status}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Total Amount</p>
                                    <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>${(selectedInvoice.totalAmount || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Line Items</h4>
                                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>
                                    <table className="w-full text-sm">
                                        <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <tr>
                                                <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Description</th>
                                                <th className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>Qty</th>
                                                <th className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                                                <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Docs</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(selectedInvoice.items || []).map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{item.description}</td>
                                                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        ${(item.amount || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.attachmentUrl && (
                                                            <a
                                                                href={item.attachmentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded text-xs"
                                                            >
                                                                <FileText size={12} /> View
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="font-bold" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                                            <tr>
                                                <td colSpan="2" className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>Total:</td>
                                                <td className="px-4 py-3 text-right text-emerald-600">
                                                    ${(selectedInvoice.totalAmount || 0).toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedInvoice.notes && (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800">
                                    <p className="font-bold mb-1">Notes:</p>
                                    <p>{selectedInvoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
