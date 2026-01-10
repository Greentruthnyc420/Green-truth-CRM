import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    FileText, DollarSign, Check, AlertTriangle,
    Clock, CheckCircle, Download, Eye
} from 'lucide-react';

// Mock invoices data
const getMockInvoices = () => ({
    paid: [
        { id: 'INV-001', orderId: 'ORD-002', dispensary: 'Canna Corner', amount: 576, paidDate: '2026-01-03', dueDate: '2026-01-15' },
        { id: 'INV-002', orderId: 'ORD-003', dispensary: 'High Times BK', amount: 300, paidDate: '2026-01-01', dueDate: '2026-01-10' }
    ],
    unpaid: [
        { id: 'INV-003', orderId: 'ORD-001', dispensary: 'Green Leaf NYC', amount: 740, paidDate: null, dueDate: '2026-01-10', overdue: false },
        { id: 'INV-004', orderId: 'ORD-005', dispensary: 'Cloud Nine', amount: 360, paidDate: null, dueDate: '2026-01-15', overdue: false }
    ],
    moneyOwed: 1200 // Money brand owes to GreenTruth (e.g., platform fees)
});

export default function BrandInvoices() {
    const { brandUser } = useBrandAuth();
    const [invoices, setInvoices] = useState({ paid: [], unpaid: [], moneyOwed: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('unpaid');

    useEffect(() => {
        setTimeout(() => {
            setInvoices(getMockInvoices());
            setLoading(false);
        }, 300);
    }, [brandUser]);

    const handleMarkPaid = (invoiceId) => {
        setInvoices(prev => {
            const invoice = prev.unpaid.find(i => i.id === invoiceId);
            if (!invoice) return prev;
            return {
                ...prev,
                paid: [...prev.paid, { ...invoice, paidDate: new Date().toISOString().split('T')[0] }],
                unpaid: prev.unpaid.filter(i => i.id !== invoiceId)
            };
        });
    };

    const totalPaid = invoices.paid.reduce((sum, i) => sum + i.amount, 0);
    const totalUnpaid = invoices.unpaid.reduce((sum, i) => sum + i.amount, 0);

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
                <p className="text-slate-500">Track payments and outstanding balances</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle size={20} className="text-amber-700" />
                        </div>
                        <span className="text-sm text-slate-500">Paid</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">${totalPaid.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <span className="text-sm text-slate-500">Unpaid</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">${totalUnpaid.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <span className="text-sm text-slate-500">You Owe GreenTruth</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">${invoices.moneyOwed.toLocaleString()}</p>
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

                <div className="overflow-x-auto">
                    <table className="w-full hidden md:table">
                        <thead className="bg-slate-50 text-left text-sm text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Invoice</th>
                                <th className="px-6 py-3">Dispensary</th>
                                <th className="px-6 py-3">Amount</th>
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
                                                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 min-h-[44px]"
                                                >
                                                    <Check size={14} />
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {(activeTab === 'unpaid' ? invoices.unpaid : invoices.paid).map((invoice) => (
                        <div key={invoice.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-800">{invoice.dispensary}</p>
                                    <p className="text-sm text-slate-500">{invoice.id} - {invoice.orderId}</p>
                                </div>
                                <span className="text-lg font-bold text-slate-800">${invoice.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4 text-sm">
                                <div>
                                    <p className="text-slate-600">Due: {invoice.dueDate}</p>
                                    {activeTab === 'paid' && <p className="text-amber-700">Paid: {invoice.paidDate}</p>}
                                </div>
                                {activeTab === 'unpaid' && (
                                    invoice.overdue ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-amber-100 text-orange-600 rounded-full text-xs font-medium">Pending</span>
                                    )
                                )}
                            </div>
                            <div className="flex gap-2">
                                {activeTab === 'unpaid' && (
                                    <button
                                        onClick={() => handleMarkPaid(invoice.id)}
                                        className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-1 min-h-[44px]"
                                    >
                                        <Check size={14} />
                                        Mark Paid
                                    </button>
                                )}
                                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]">
                                    <Eye size={18} />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]">
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Money Owed Section */}
            {invoices.moneyOwed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} className="text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-800 mb-1">Outstanding Balance</h3>
                            <p className="text-sm text-red-600 mb-4">
                                You currently owe GreenTruth ${invoices.moneyOwed.toLocaleString()} in platform fees.
                                Please remit payment to avoid service interruption.
                            </p>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[44px]">
                                View Payment Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
