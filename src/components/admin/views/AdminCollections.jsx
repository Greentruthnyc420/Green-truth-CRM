import React, { useState, useEffect } from 'react';
import {
    FileText, DollarSign, Clock, CheckCircle, AlertCircle,
    Search, Filter, ChevronDown, ChevronUp, Phone, Mail,
    User, Store, Calendar, Download, RefreshCw
} from 'lucide-react';
import { getSales, getAllUsers, updateSaleStatus, markSaleCollected, markSaleRepPaid } from '../../../services/firestoreService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { convertToCSV, downloadCSV } from '../../../utils/csvHelper';

export default function AdminCollections() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [invoices, setInvoices] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, overdue, paid
    const [repFilter, setRepFilter] = useState('all'); // all, or specific rep ID
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [sortBy, setSortBy] = useState('dueDate'); // dueDate, amount, date

    // Check if current user is admin
    const isAdmin = currentUser?.email?.includes('greentruth') ||
        currentUser?.email === 'omarelsayed80@gmail.com' ||
        currentUser?.role === 'admin';

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const [allSales, allUsers] = await Promise.all([
                getSales(),
                getAllUsers()
            ]);

            // Build users map
            const usersMap = {};
            allUsers.forEach(u => {
                usersMap[u.uid || u.id] = u;
            });
            setUsers(usersMap);

            // Transform sales to invoices with additional collection info
            const invoiceData = allSales.map(sale => {
                const invoiceDate = new Date(sale.date || sale.createdAt);
                const paymentTerms = sale.paymentTerms || 'Net 30';
                const dueDate = calculateDueDate(invoiceDate, paymentTerms);
                const now = new Date();
                const isOverdue = dueDate < now && sale.status !== 'paid';
                const daysOverdue = isOverdue ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

                return {
                    ...sale,
                    invoiceNumber: `INV-${sale.id?.slice(-8)?.toUpperCase() || Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    invoiceDate,
                    paymentTerms,
                    dueDate,
                    isOverdue,
                    daysOverdue,
                    // New status logic: pending -> collected -> paid
                    paymentStatus: sale.status === 'paid' ? 'paid' : sale.status === 'collected' ? 'collected' : 'pending',
                    repName: sale.userName || sale.representativeName || usersMap[sale.userId]?.displayName || 'Unknown Rep',
                    repEmail: usersMap[sale.userId]?.email || sale.userEmail || ''
                };
            });

            setInvoices(invoiceData);
        } catch (error) {
            console.error('Error loading collections:', error);
            showNotification('Failed to load collections data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calculate due date based on payment terms
    function calculateDueDate(date, paymentTerms = 'Net 30') {
        const d = new Date(date);
        switch (paymentTerms) {
            case 'COD':
                return d;
            case 'Net 14':
                d.setDate(d.getDate() + 14);
                return d;
            case 'Net 30':
            default:
                d.setDate(d.getDate() + 30);
                return d;
        }
    }

    // Mark invoice as collected (brand has paid GreenTruth)
    const handleMarkCollected = async (invoiceId) => {
        try {
            await markSaleCollected(invoiceId);
            showNotification('Invoice marked as collected from brand', 'success');
            loadCollections();
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update invoice status', 'error');
        }
    };

    // Pay rep commission (after brand has paid)
    const handlePayRepCommission = async (invoiceId) => {
        try {
            await markSaleRepPaid(invoiceId);
            showNotification('Rep commission marked as paid', 'success');
            loadCollections();
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update rep payment status', 'error');
        }
    };

    // Get unique reps for filter dropdown
    const uniqueReps = [...new Set(invoices.map(i => i.userId))].map(uid => ({
        id: uid,
        name: users[uid]?.displayName || invoices.find(i => i.userId === uid)?.repName || uid
    }));

    // Filter and sort invoices
    const filteredInvoices = invoices
        .filter(inv => {
            // Status filter
            if (filter === 'pending') return inv.paymentStatus === 'pending';
            if (filter === 'collected') return inv.paymentStatus === 'collected';
            if (filter === 'overdue') return inv.isOverdue;
            if (filter === 'paid') return inv.paymentStatus === 'paid';
            return true;
        })
        .filter(inv => {
            // Rep filter - for non-admins, only show their own
            if (!isAdmin) return inv.userId === currentUser?.uid;
            if (repFilter !== 'all') return inv.userId === repFilter;
            return true;
        })
        .filter(inv => {
            // Search filter
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                inv.dispensaryName?.toLowerCase().includes(q) ||
                inv.invoiceNumber?.toLowerCase().includes(q) ||
                inv.repName?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'amount':
                    return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
                case 'date':
                    return new Date(b.invoiceDate) - new Date(a.invoiceDate);
                case 'dueDate':
                default:
                    return new Date(a.dueDate) - new Date(b.dueDate);
            }
        });

    // Stats
    const stats = {
        total: filteredInvoices.length,
        pending: filteredInvoices.filter(i => i.paymentStatus === 'pending').length,
        collected: filteredInvoices.filter(i => i.paymentStatus === 'collected').length,
        overdue: filteredInvoices.filter(i => i.isOverdue).length,
        paid: filteredInvoices.filter(i => i.paymentStatus === 'paid').length,
        amountDue: filteredInvoices.filter(i => i.paymentStatus === 'pending').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
        amountCollected: filteredInvoices.filter(i => i.paymentStatus === 'collected').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
        amountOverdue: filteredInvoices.filter(i => i.isOverdue).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
        amountPaid: filteredInvoices.filter(i => i.paymentStatus === 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    };

    // Format helpers
    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => `$${(parseFloat(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Export to CSV
    const exportCSV = () => {
        const data = filteredInvoices.map(inv => ({
            'Invoice #': inv.invoiceNumber,
            'Dispensary': inv.dispensaryName,
            'Amount': inv.amount,
            'Status': inv.paymentStatus,
            'Terms': inv.paymentTerms,
            'Invoice Date': formatDate(inv.invoiceDate),
            'Due Date': formatDate(inv.dueDate),
            'Days Overdue': inv.daysOverdue || 0,
            'Sales Rep': inv.repName,
            'Rep Email': inv.repEmail
        }));
        downloadCSV(convertToCSV(data), `collections-export-${new Date().toISOString().split('T')[0]}.csv`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
                    <p className="text-slate-500">
                        {isAdmin ? 'Track and manage all outstanding invoices' : 'Track invoices for your accounts'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadCollections}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
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
                    <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.amountDue)}</p>
                    <p className="text-sm text-slate-500">Outstanding ({stats.pending})</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.amountOverdue)}</p>
                    <p className="text-sm text-slate-500">Overdue ({stats.overdue})</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.amountCollected)}</p>
                    <p className="text-sm text-slate-500">Collected - Owe Reps ({stats.collected})</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.amountPaid)}</p>
                    <p className="text-sm text-slate-500">Fully Paid ({stats.paid})</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search dispensary or invoice #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['all', 'pending', 'collected', 'overdue', 'paid'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Rep Filter - Admin Only */}
                {isAdmin && uniqueReps.length > 1 && (
                    <select
                        value={repFilter}
                        onChange={(e) => setRepFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white focus:border-brand-500 outline-none"
                    >
                        <option value="all">All Reps</option>
                        {uniqueReps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                    </select>
                )}

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white focus:border-brand-500 outline-none"
                >
                    <option value="dueDate">Sort by Due Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="date">Sort by Invoice Date</option>
                </select>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredInvoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No invoices found</p>
                        <p className="text-sm text-slate-400 mt-1">
                            {filter !== 'all' ? 'Try changing your filter' : 'Start logging sales to see invoices'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredInvoices.map(invoice => (
                            <div key={invoice.id} className={`hover:bg-slate-50 transition-colors ${invoice.isOverdue ? 'bg-red-50/30' : ''}`}>
                                {/* Invoice Row */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.paymentStatus === 'paid'
                                            ? 'bg-emerald-50'
                                            : invoice.isOverdue
                                                ? 'bg-red-50'
                                                : 'bg-amber-50'
                                            }`}>
                                            {invoice.paymentStatus === 'paid'
                                                ? <CheckCircle size={20} className="text-emerald-600" />
                                                : <Clock size={20} className={invoice.isOverdue ? 'text-red-600' : 'text-amber-600'} />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{invoice.dispensaryName}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span className="font-mono">{invoice.invoiceNumber}</span>
                                                <span className="text-slate-300">•</span>
                                                <span>{invoice.paymentTerms}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Rep Info */}
                                        <div className="hidden md:block text-right">
                                            <p className="text-sm text-slate-600">{invoice.repName}</p>
                                        </div>

                                        {/* Amount & Status */}
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{formatCurrency(invoice.amount)}</p>
                                            <p className={`text-xs font-bold uppercase ${invoice.paymentStatus === 'paid'
                                                ? 'text-emerald-600'
                                                : invoice.isOverdue
                                                    ? 'text-red-600'
                                                    : 'text-amber-600'
                                                }`}>
                                                {invoice.paymentStatus === 'paid'
                                                    ? '✓ Paid'
                                                    : invoice.isOverdue
                                                        ? `${invoice.daysOverdue}d Overdue`
                                                        : 'Pending'}
                                            </p>
                                        </div>

                                        {expandedInvoice === invoice.id
                                            ? <ChevronUp size={20} className="text-slate-400" />
                                            : <ChevronDown size={20} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedInvoice === invoice.id && (
                                    <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50">
                                        <div className="grid md:grid-cols-3 gap-6 py-4">
                                            {/* Dispensary Info */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dispensary</p>
                                                <p className="font-bold text-slate-800">{invoice.dispensaryName}</p>
                                                {invoice.licenseNumber && (
                                                    <p className="text-sm text-slate-600">License: {invoice.licenseNumber}</p>
                                                )}
                                            </div>

                                            {/* Invoice Details */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Invoice Details</p>
                                                <div className="space-y-1 text-sm">
                                                    <p><span className="text-slate-500">Invoice Date:</span> {formatDate(invoice.invoiceDate)}</p>
                                                    <p><span className="text-slate-500">Due Date:</span> <span className={invoice.isOverdue ? 'text-red-600 font-bold' : ''}>{formatDate(invoice.dueDate)}</span></p>
                                                    <p><span className="text-slate-500">Terms:</span> {invoice.paymentTerms}</p>
                                                </div>
                                            </div>

                                            {/* Rep Info */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sales Rep</p>
                                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                                    <User size={14} /> {invoice.repName}
                                                </p>
                                                {invoice.repEmail && (
                                                    <a href={`mailto:${invoice.repEmail}`} className="text-sm text-brand-600 hover:underline flex items-center gap-1 mt-1">
                                                        <Mail size={12} /> {invoice.repEmail}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Line Items */}
                                        {invoice.items?.length > 0 && (
                                            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                                                        <tr>
                                                            <th className="text-left px-4 py-3">Item</th>
                                                            <th className="text-center px-4 py-3">Qty</th>
                                                            <th className="text-right px-4 py-3">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoice.items.map((item, idx) => (
                                                            <tr key={idx} className="border-t border-slate-100">
                                                                <td className="px-4 py-3 text-slate-700">{item.name || 'Product'}</td>
                                                                <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                                                                <td className="px-4 py-3 text-right font-mono">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50 font-bold">
                                                        <tr className="border-t-2 border-slate-200">
                                                            <td className="px-4 py-3" colSpan="2">Total</td>
                                                            <td className="px-4 py-3 text-right text-lg">{formatCurrency(invoice.amount)}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {invoice.paymentStatus === 'pending' && (
                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={() => handleMarkCollected(invoice.id)}
                                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                                >
                                                    <DollarSign size={16} /> Mark Collected
                                                </button>
                                                {invoice.repEmail && (
                                                    <a
                                                        href={`mailto:${invoice.repEmail}?subject=Invoice ${invoice.invoiceNumber} - Collection Follow-up&body=Hi ${invoice.repName},%0D%0A%0D%0APlease follow up on invoice ${invoice.invoiceNumber} for ${invoice.dispensaryName} - ${formatCurrency(invoice.amount)} due ${formatDate(invoice.dueDate)}.%0D%0A%0D%0AThanks`}
                                                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                                    >
                                                        <Mail size={16} /> Email Rep
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {invoice.paymentStatus === 'collected' && (
                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={() => handlePayRepCommission(invoice.id)}
                                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Pay Rep Commission
                                                </button>
                                            </div>
                                        )}
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
