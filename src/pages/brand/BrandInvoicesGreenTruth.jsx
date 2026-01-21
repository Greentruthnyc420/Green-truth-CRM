import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getInvoices } from '../../services/invoiceService';
import { supabase } from '../../services/supabaseClient';
import {
    FileText, ArrowUpRight, AlertTriangle, Calendar, Hash, Package, MapPin, Building2,
    CreditCard, Download, ExternalLink, Clock, X, Eye, Copy, Check, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';

export default function BrandInvoicesGreenTruth() {
    const { brandUser } = useBrandAuth();
    const [invoices, setInvoices] = useState({ outstanding: [], history: [] });
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

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
        fetchPaymentInfo();
    }, [brandUser]);

    const fetchPaymentInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('company_settings')
                .select('*')
                .eq('company_id', 'greentruth')
                .single();
            if (data) setPaymentInfo(data);
        } catch (err) {
            console.log('No GreenTruth payment info found');
        }
    };

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

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

            {/* Pay GreenTruth - Collapsible Section */}
            {paymentInfo && (
                <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                    <button
                        onClick={() => setShowPaymentInfo(!showPaymentInfo)}
                        className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                <DollarSign size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Pay GreenTruth</h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>View ACH & payment details to send payments</p>
                            </div>
                        </div>
                        {showPaymentInfo ? (
                            <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} />
                        ) : (
                            <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                    </button>

                    {showPaymentInfo && (
                        <div className="p-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* ACH Info */}
                                {paymentInfo.routing_number && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <CreditCard size={18} />
                                            ACH / Bank Transfer
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Pay to:</span>
                                                <span className="font-bold text-slate-800">{paymentInfo.business_name || 'The Green Truth LLC'}</span>
                                            </div>
                                            {paymentInfo.bank_name && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">Bank:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-mono font-medium">{paymentInfo.bank_name}</span>
                                                        <button onClick={() => copyToClipboard(paymentInfo.bank_name, 'bank')} className="p-1 hover:bg-slate-200 rounded">
                                                            {copiedField === 'bank' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Routing:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono font-medium">{paymentInfo.routing_number}</span>
                                                    <button onClick={() => copyToClipboard(paymentInfo.routing_number, 'routing')} className="p-1 hover:bg-slate-200 rounded">
                                                        {copiedField === 'routing' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Account:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono font-medium">{paymentInfo.account_number}</span>
                                                    <button onClick={() => copyToClipboard(paymentInfo.account_number, 'account')} className="p-1 hover:bg-slate-200 rounded">
                                                        {copiedField === 'account' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Type:</span>
                                                <span className="font-medium capitalize">{paymentInfo.account_type || 'Checking'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PayPal */}
                                {paymentInfo.paypal_email && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <h4 className="font-bold text-blue-700 mb-3">PayPal</h4>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-blue-600">Email:</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{paymentInfo.paypal_email}</span>
                                                <button onClick={() => copyToClipboard(paymentInfo.paypal_email, 'paypal')} className="p-1 hover:bg-blue-100 rounded">
                                                    {copiedField === 'paypal' ? <Check size={14} className="text-blue-600" /> : <Copy size={14} className="text-blue-400" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Instructions */}
                            {paymentInfo.payment_instructions && (
                                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <h4 className="font-bold text-amber-700 mb-2">Payment Instructions</h4>
                                    <p className="text-sm text-amber-800">{paymentInfo.payment_instructions}</p>
                                </div>
                            )}

                            {/* Contact */}
                            {(paymentInfo.contact_email || paymentInfo.contact_phone) && (
                                <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Questions? Contact: {paymentInfo.contact_email || paymentInfo.contact_phone}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Outstanding Invoices */}
            <div className="rounded-xl shadow-sm overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="p-4 bg-red-50/30" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Outstanding Invoices</h2>
                </div>
                {invoices.outstanding.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {invoices.outstanding.map((inv) => (
                            <div
                                key={inv.id}
                                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors"
                                onClick={() => setSelectedInvoice(inv)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div className="flex items-start gap-3">
                                    <Eye size={16} className="mt-1 opacity-50" style={{ color: 'var(--accent-primary)' }} />
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
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${(inv.totalAmount || 0).toFixed(2)}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowPaymentInfo(true); }}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                    >
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
                            <tr
                                key={inv.id}
                                className="transition-colors cursor-pointer"
                                style={{ borderBottom: '1px solid var(--border-primary)' }}
                                onClick={() => setSelectedInvoice(inv)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Eye size={14} className="opacity-50" style={{ color: 'var(--success)' }} />
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>#{inv.id.slice(0, 8)}...</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(inv.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{inv.paidDate || '-'}</td>
                                <td className="px-6 py-4 font-medium" style={{ color: 'var(--success)' }}>${(inv.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                        Paid
                                    </span>
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
                            {/* Status Badge */}
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-4 py-2 rounded-full text-sm font-bold"
                                    style={{
                                        background: selectedInvoice.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: selectedInvoice.status === 'paid' ? 'var(--success)' : 'var(--warning)'
                                    }}
                                >
                                    {selectedInvoice.status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                                </span>
                                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    ${(selectedInvoice.totalAmount || 0).toFixed(2)}
                                </span>
                            </div>

                            {/* Invoice Details */}
                            <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Invoice Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Hash size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Invoice ID</p>
                                            <p className="font-medium font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.id?.slice(0, 12)}...</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Created Date</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock size={18} style={{ color: 'var(--warning)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.dueDate || 'Upon Receipt'}</p>
                                        </div>
                                    </div>
                                    {selectedInvoice.paidDate && (
                                        <div className="flex items-start gap-3">
                                            <Check size={18} style={{ color: 'var(--success)' }} />
                                            <div>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid Date</p>
                                                <p className="font-medium" style={{ color: 'var(--success)' }}>{selectedInvoice.paidDate}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Billed To</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.brandName || 'Your Brand'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Invoice Type</p>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedInvoice.invoiceType || 'Commission'}</p>
                                        </div>
                                    </div>
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
