import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    FileText, ArrowUpRight, AlertTriangle,
    CreditCard, Download, ExternalLink, Clock
} from 'lucide-react';

// Mock invoice data for MONEY GOING OUT (To GreenTruth) - Set to $0
const getMockGreenTruthInvoices = () => ({
    outstanding: [],
    history: []
});

export default function BrandInvoicesGreenTruth() {
    const { brandUser } = useBrandAuth();
    const [invoices, setInvoices] = useState({ outstanding: [], history: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setInvoices(getMockGreenTruthInvoices());
            setLoading(false);
        }, 500);
    }, [brandUser]);

    const totalPayable = invoices.outstanding.reduce((sum, i) => sum + i.amount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowUpRight className="text-red-500" />
                        GreenTruth Invoices
                    </h1>
                    <p className="text-slate-500">Platform fees and commissions owed to GreenTruth</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 flex-1">
                        <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Total Payable</p>
                        <p className="text-xl font-bold text-red-700">${totalPayable.toLocaleString()}</p>
                    </div>
                    {/* Total Paid (New) */}
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex-1">
                        <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Total Paid</p>
                        <p className="text-xl font-bold text-slate-700">$0.00</p>
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
                                        <h3 className="font-bold text-slate-800">{inv.description}</h3>
                                        {inv.status === 'overdue' && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                <AlertTriangle size={12} /> Overdue
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">Invoice #{inv.id} • Due {inv.dueDate}</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mt-4 md:mt-0">
                                    <span className="text-xl font-bold text-slate-800 text-left md:text-right">${inv.amount.toLocaleString()}</span>
                                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
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
                <div className="overflow-x-auto">
                    <table className="w-full hidden md:table">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Date Paid</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.history.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800">{inv.description}</p>
                                        <p className="text-xs text-slate-400">{inv.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{inv.paidDate}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">${inv.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-400 hover:text-amber-600 transition-colors min-h-[44px]">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {invoices.history.map((inv) => (
                        <div key={inv.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-800">{inv.description}</p>
                                    <p className="text-sm text-slate-500">{inv.id}</p>
                                </div>
                                <span className="text-lg font-bold text-slate-800">${inv.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-600">Paid: {inv.paidDate}</p>
                                <button className="p-2 text-slate-500 hover:text-amber-600 rounded-lg transition-colors min-h-[44px]">
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
