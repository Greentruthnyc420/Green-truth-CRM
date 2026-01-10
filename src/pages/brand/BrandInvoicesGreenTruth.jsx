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
                        GreenTruth Invoices
                    </h1>
                    <p className="text-slate-500">Platform fees and commissions owed to GreenTruth</p>
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
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100 bg-red-50/30">
                    <h2 className="font-bold text-slate-800">Outstanding Invoices</h2>
                </div>
                {invoices.outstanding.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {invoices.outstanding.map((inv) => (
                            <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-800">Invoice #{inv.id.slice(0, 8)}...</h3>
                                        {inv.status === 'overdue' && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                <AlertTriangle size={12} /> Overdue
                                            </span>
                                        )}
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">Due {inv.dueDate || 'Upon Receipt'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold text-slate-800">${(inv.totalAmount || 0).toFixed(2)}</span>
                                    <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors"
                                    >
                                        <Eye size={16} /> Details
                                    </button>
                                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                                        <CreditCard size={16} />
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No outstanding invoices. You're all paid up!
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Payment History</h2>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Invoice</th>
                            <th className="px-6 py-3">Date Paid</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoices.history.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-800">#{inv.id.slice(0, 8)}...</p>
                                    <p className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{inv.paidDate || '-'}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">${(inv.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="text-slate-400 hover:text-amber-600 transition-colors"
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
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Invoice Details</h3>
                                <p className="text-slate-500 text-sm">#{selectedInvoice.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Status</p>
                                    <p className={`font-bold capitalize ${selectedInvoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedInvoice.status}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                                    <p className="font-bold text-slate-900 text-lg">${(selectedInvoice.totalAmount || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3">Line Items</h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-slate-500">Description</th>
                                                <th className="px-4 py-2 text-right text-slate-500">Qty</th>
                                                <th className="px-4 py-2 text-right text-slate-500">Amount</th>
                                                <th className="px-4 py-2 text-center text-slate-500">Docs</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(selectedInvoice.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-slate-700">{item.description}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-800">
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
                                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                            <tr>
                                                <td colSpan="2" className="px-4 py-3 text-right text-slate-600">Total:</td>
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
