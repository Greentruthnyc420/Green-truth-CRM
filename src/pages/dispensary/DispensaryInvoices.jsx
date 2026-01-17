import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Download, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSales, getUserProfile } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';

export default function DispensaryInvoices() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        async function loadInvoices() {
            if (!currentUser) return;

            try {
                const p = await getUserProfile(currentUser.uid);
                setProfile(p);

                // Fetch sales for this dispensary (these become invoices)
                const allSales = await getSales();
                const myInvoices = allSales.filter(sale => {
                    const nameMatches = sale.dispensaryName === p.dispensaryName || sale.dispensaryName === currentUser.displayName;
                    const idMatches = sale.dispensaryId === currentUser.uid;
                    return nameMatches || idMatches;
                }).map(sale => ({
                    ...sale,
                    invoiceNumber: `INV-${sale.id?.slice(-8)?.toUpperCase() || Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    invoiceDate: sale.date || sale.createdAt,
                    dueDate: calculateDueDate(sale.date || sale.createdAt),
                    paymentStatus: sale.status === 'paid' ? 'paid' : 'pending'
                })).sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));

                setInvoices(myInvoices);
            } catch (error) {
                console.error('Error loading invoices:', error);
                showNotification('Failed to load invoices', 'error');
            } finally {
                setLoading(false);
            }
        }
        loadInvoices();
    }, [currentUser]);

    // Calculate due date (NET 30 from invoice date)
    function calculateDueDate(date) {
        if (!date) return null;
        const d = new Date(date);
        d.setDate(d.getDate() + 30);
        return d.toISOString();
    }

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'all') return true;
        return inv.paymentStatus === filter;
    });

    // Stats
    const stats = {
        total: invoices.length,
        pending: invoices.filter(i => i.paymentStatus !== 'paid').length,
        paid: invoices.filter(i => i.paymentStatus === 'paid').length,
        amountDue: invoices.filter(i => i.paymentStatus !== 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
        amountPaid: invoices.filter(i => i.paymentStatus === 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Invalid Date';
        }
    };

    // Check if overdue
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
                    <p className="text-slate-500">View and track your payment history</p>
                </div>

                {/* Dispensary Info */}
                {profile && (
                    <div className="text-right text-sm text-slate-500">
                        <p className="font-bold text-slate-700">{profile.dispensaryName}</p>
                        {profile.licenseNumber && <p>License: {profile.licenseNumber}</p>}
                        {profile.address && <p className="truncate max-w-xs">{profile.address}</p>}
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <FileText size={20} className="text-slate-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-sm text-slate-500">Total Invoices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                    <p className="text-sm text-slate-500">Pending</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-700">${stats.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-slate-500">Amount Due</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">${stats.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-slate-500">Paid</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'pending', 'paid'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {f} {f === 'all' ? `(${stats.total})` : f === 'pending' ? `(${stats.pending})` : `(${stats.paid})`}
                    </button>
                ))}
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredInvoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No invoices found</p>
                        <p className="text-sm text-slate-400 mt-1">Invoices will appear here when orders are placed</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                {/* Invoice Row */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.paymentStatus === 'paid'
                                                ? 'bg-emerald-50'
                                                : isOverdue(invoice.dueDate)
                                                    ? 'bg-red-50'
                                                    : 'bg-amber-50'
                                            }`}>
                                            {invoice.paymentStatus === 'paid'
                                                ? <CheckCircle size={20} className="text-emerald-600" />
                                                : <Clock size={20} className={isOverdue(invoice.dueDate) ? 'text-red-600' : 'text-amber-600'} />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{invoice.invoiceNumber}</p>
                                            <p className="text-sm text-slate-500">{formatDate(invoice.invoiceDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">${(parseFloat(invoice.amount) || 0).toFixed(2)}</p>
                                            <p className={`text-xs font-bold uppercase ${invoice.paymentStatus === 'paid'
                                                    ? 'text-emerald-600'
                                                    : isOverdue(invoice.dueDate)
                                                        ? 'text-red-600'
                                                        : 'text-amber-600'
                                                }`}>
                                                {invoice.paymentStatus === 'paid'
                                                    ? '✓ Paid'
                                                    : isOverdue(invoice.dueDate)
                                                        ? 'Overdue'
                                                        : 'Pending'}
                                            </p>
                                        </div>
                                        {expandedInvoice === invoice.id
                                            ? <ChevronUp size={20} className="text-slate-400" />
                                            : <ChevronDown size={20} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded Invoice Details */}
                                {expandedInvoice === invoice.id && (
                                    <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50">
                                        <div className="grid md:grid-cols-2 gap-6 py-4">
                                            {/* Bill To */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Bill To</p>
                                                <p className="font-bold text-slate-800">{profile?.dispensaryName || invoice.dispensaryName}</p>
                                                {profile?.licenseNumber && (
                                                    <p className="text-sm text-slate-600">License: {profile.licenseNumber}</p>
                                                )}
                                                {profile?.address && (
                                                    <p className="text-sm text-slate-600">{profile.address}</p>
                                                )}
                                            </div>

                                            {/* Invoice Info */}
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Invoice Details</p>
                                                <div className="space-y-1 text-sm">
                                                    <p><span className="text-slate-500">Invoice #:</span> <span className="font-mono font-bold">{invoice.invoiceNumber}</span></p>
                                                    <p><span className="text-slate-500">Date:</span> {formatDate(invoice.invoiceDate)}</p>
                                                    <p><span className="text-slate-500">Due Date:</span> <span className={isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid' ? 'text-red-600 font-bold' : ''}>{formatDate(invoice.dueDate)}</span></p>
                                                    <p><span className="text-slate-500">Terms:</span> NET 30</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line Items */}
                                        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                                                    <tr>
                                                        <th className="text-left px-4 py-3">Description</th>
                                                        <th className="text-right px-4 py-3">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoice.items?.length > 0 ? (
                                                        invoice.items.map((item, idx) => (
                                                            <tr key={idx} className="border-t border-slate-100">
                                                                <td className="px-4 py-3 text-slate-700">{item.name || 'Product'} x {item.quantity || 1}</td>
                                                                <td className="px-4 py-3 text-right font-mono">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr className="border-t border-slate-100">
                                                            <td className="px-4 py-3 text-slate-700">
                                                                {invoice.brandName || 'Product Sale'}
                                                                {invoice.itemCount && ` (${invoice.itemCount} items)`}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono">${(parseFloat(invoice.amount) || 0).toFixed(2)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-slate-50 font-bold">
                                                    <tr className="border-t-2 border-slate-200">
                                                        <td className="px-4 py-3">Total Due</td>
                                                        <td className="px-4 py-3 text-right text-lg">${(parseFloat(invoice.amount) || 0).toFixed(2)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Payment Info */}
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="font-bold text-amber-800 mb-1">Payment Information</p>
                                            <p className="text-sm text-amber-700">Please make checks payable to The Green Truth NYC or contact us for bank wire details.</p>
                                            <p className="text-sm text-amber-700 mt-1">Questions? Email billing@thegreentruthnyc.com</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
