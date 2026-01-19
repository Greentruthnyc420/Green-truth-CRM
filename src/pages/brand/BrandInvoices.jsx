import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getInvoices } from '../../services/invoiceService';
import { getSales } from '../../services/firestoreService';
import { toast } from 'sonner';
import {
    FileText, DollarSign, Check, AlertTriangle,
    Clock, CheckCircle, Download, Eye, Loader2
} from 'lucide-react';

export default function BrandInvoices() {
    const { brandUser } = useBrandAuth();
    const [invoices, setInvoices] = useState({ paid: [], unpaid: [] });
    const [moneyOwed, setMoneyOwed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('unpaid');

    useEffect(() => {
        const fetchData = async () => {
            if (!brandUser?.brandId && !brandUser?.brandName) {
                setLoading(false);
                return;
            }

            try {
                // Fetch real sales data filtered by brand
                const allSales = await getSales();
                const brandSales = allSales.filter(sale =>
                    sale.brandId === brandUser.brandId ||
                    sale.brandName === brandUser.brandName ||
                    (sale.items && sale.items.some(item =>
                        item.brandId === brandUser.brandId ||
                        item.brandName === brandUser.brandName
                    ))
                );

                // Transform sales into invoice format
                const today = new Date();
                const paidInvoices = [];
                const unpaidInvoices = [];

                brandSales.forEach((sale, index) => {
                    // Calculate due date based on payment terms (default NET 30)
                    const saleDate = new Date(sale.date || sale.createdAt);
                    const paymentTerms = sale.paymentTerms || 'Net 30';
                    let daysToAdd = 30;
                    if (paymentTerms === 'COD') daysToAdd = 0;
                    else if (paymentTerms === 'Net 14') daysToAdd = 14;
                    else if (paymentTerms === 'Net 30') daysToAdd = 30;

                    const dueDate = new Date(saleDate);
                    dueDate.setDate(dueDate.getDate() + daysToAdd);

                    const invoice = {
                        id: `INV-${String(index + 1).padStart(3, '0')}`,
                        saleId: sale.id,
                        orderId: sale.id?.substring(0, 8) || `ORD-${index + 1}`,
                        dispensary: sale.dispensaryName || 'Unknown Dispensary',
                        amount: parseFloat(sale.amount) || 0,
                        dueDate: dueDate.toISOString().split('T')[0],
                        saleDate: saleDate.toISOString().split('T')[0],
                        overdue: dueDate < today && sale.status !== 'paid',
                        paymentTerms: paymentTerms
                    };

                    if (sale.status === 'paid') {
                        paidInvoices.push({
                            ...invoice,
                            paidDate: sale.paidDate || saleDate.toISOString().split('T')[0]
                        });
                    } else {
                        unpaidInvoices.push({
                            ...invoice,
                            paidDate: null
                        });
                    }
                });

                setInvoices({ paid: paidInvoices, unpaid: unpaidInvoices });

                // Get Real AP Data (Owed to GreenTruth) from invoices service
                try {
                    const gtInvoices = await getInvoices(brandUser.brandId);
                    const totalOutstanding = gtInvoices
                        .filter(inv => inv.status !== 'paid')
                        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

                    setMoneyOwed(totalOutstanding);
                } catch (error) {
                    console.error("Failed to fetch GT invoices", error);
                }
            } catch (error) {
                console.error("Failed to fetch brand sales:", error);
                toast.error("Failed to load invoices");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [brandUser]);

    const handleMarkPaid = async (invoiceId) => {
        // Find the invoice and its original sale ID
        const invoice = invoices.unpaid.find(i => i.id === invoiceId);
        if (!invoice) return;

        // Update local state immediately for responsive UI
        const paidDate = new Date().toISOString().split('T')[0];
        setInvoices(prev => ({
            ...prev,
            paid: [...prev.paid, { ...invoice, paidDate }],
            unpaid: prev.unpaid.filter(i => i.id !== invoiceId)
        }));

        // Persist to database
        if (invoice.saleId) {
            try {
                const { updateSaleStatus, updateSale } = await import('../../services/firestoreService');
                await updateSaleStatus(invoice.saleId, 'paid');
                await updateSale(invoice.saleId, { paidDate });
                toast.success(`Invoice ${invoiceId} marked as paid`);
            } catch (error) {
                console.error("Failed to persist payment status:", error);
                // Revert local state on error
                setInvoices(prev => ({
                    ...prev,
                    unpaid: [...prev.unpaid, invoice],
                    paid: prev.paid.filter(i => i.id !== invoiceId)
                }));
                toast.error("Failed to mark as paid. Please try again.");
            }
        } else {
            toast.success(`Invoice ${invoiceId} marked as paid`);
        }
    };

    const totalPaid = invoices.paid.reduce((sum, i) => sum + i.amount, 0);
    const totalUnpaid = invoices.unpaid.reduce((sum, i) => sum + i.amount, 0);
    const overdueCount = invoices.unpaid.filter(i => i.overdue).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                <p className="text-slate-500">Track payments and outstanding balances from dispensary orders</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle size={20} className="text-amber-700" />
                        </div>
                        <span className="text-sm text-slate-500">Paid (Receivable)</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">${totalPaid.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{invoices.paid.length} invoices</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <span className="text-sm text-slate-500">Unpaid (Receivable)</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">${totalUnpaid.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{invoices.unpaid.length} invoices</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <span className="text-sm text-slate-500">Overdue</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                    <p className="text-xs text-slate-400 mt-1">invoices past due</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign size={20} className="text-purple-600" />
                        </div>
                        <span className="text-sm text-slate-500">You Owe GreenTruth</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">${moneyOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-400 mt-1">platform fees</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('unpaid')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'unpaid'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Unpaid ({invoices.unpaid.length})
                </button>
                <button
                    onClick={() => setActiveTab('paid')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'paid'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Paid ({invoices.paid.length})
                </button>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {activeTab === 'unpaid' && invoices.unpaid.length === 0 && (
                    <div className="p-12 text-center">
                        <CheckCircle size={48} className="mx-auto text-emerald-300 mb-4" />
                        <p className="text-slate-500">All caught up! No unpaid invoices.</p>
                    </div>
                )}
                {activeTab === 'paid' && invoices.paid.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No paid invoices yet.</p>
                    </div>
                )}

                {((activeTab === 'unpaid' && invoices.unpaid.length > 0) || (activeTab === 'paid' && invoices.paid.length > 0)) && (
                    <table className="w-full">
                        <thead className="bg-slate-50 text-left text-sm text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Invoice</th>
                                <th className="px-6 py-3">Dispensary</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Terms</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3">{activeTab === 'paid' ? 'Paid Date' : 'Status'}</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(activeTab === 'unpaid' ? invoices.unpaid : invoices.paid).map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-800">{invoice.id}</span>
                                        <p className="text-xs text-slate-500">{invoice.orderId}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{invoice.dispensary}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">${invoice.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                            {invoice.paymentTerms || 'Net 30'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{invoice.dueDate}</td>
                                    <td className="px-6 py-4">
                                        {activeTab === 'paid' ? (
                                            <span className="text-amber-700">{invoice.paidDate}</span>
                                        ) : invoice.overdue ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-amber-100 text-orange-600 rounded-full text-xs font-medium">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {activeTab === 'unpaid' && (
                                                <button
                                                    onClick={() => handleMarkPaid(invoice.id)}
                                                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-1"
                                                >
                                                    <Check size={14} />
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Money Owed Section */}
            {moneyOwed > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-800 mb-1">Outstanding Balance</h3>
                            <p className="text-sm text-purple-600 mb-4">
                                You currently owe GreenTruth ${moneyOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in platform fees.
                                Please remit payment to avoid service interruption.
                            </p>
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                                View Payment Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
