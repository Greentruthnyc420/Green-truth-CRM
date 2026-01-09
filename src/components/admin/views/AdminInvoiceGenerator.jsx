import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Mail, Building2, Calendar, DollarSign,
    CheckCircle, Clock, Send, Printer, Eye, RefreshCw
} from 'lucide-react';
import { AVAILABLE_BRANDS } from '../../../contexts/BrandAuthContext';

// Company Info
const COMPANY_INFO = {
    name: 'The Green Truth NYC',
    address: 'New York, NY',
    email: 'billing@thegreentruthnyc.com',
    phone: '(646) 555-0123',
    logo: '/logos/greentruth-logo.png'
};

export default function AdminInvoiceGenerator() {
    const [selectedBrand, setSelectedBrand] = useState('');
    const [invoiceType, setInvoiceType] = useState('commission'); // 'commission' | 'activation'
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First of month
        end: new Date().toISOString().split('T')[0] // Today
    });
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Get brand list (exclude processors for now)
    const brandList = Object.entries(AVAILABLE_BRANDS)
        .filter(([_, b]) => !b.isProcessor)
        .map(([id, b]) => ({ id, ...b }));

    // Generate invoice data
    const generateInvoice = async () => {
        if (!selectedBrand) return;

        setLoading(true);
        try {
            const { calculateBrandMetrics } = await import('../../../services/brandMetricsService');
            const brand = AVAILABLE_BRANDS[selectedBrand];
            const metrics = await calculateBrandMetrics(selectedBrand, brand.brandName);

            const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // Net 30

            let lineItems = [];
            let total = 0;

            if (invoiceType === 'commission') {
                // 5% commission on sales
                lineItems = [{
                    description: `Sales Commission (5% of $${metrics.revenue.toLocaleString()})`,
                    quantity: 1,
                    rate: metrics.commissionOwed,
                    amount: metrics.commissionOwed
                }];
                total = metrics.commissionOwed;
            } else {
                // Activation costs (pop-ups)
                lineItems = [{
                    description: `In-Store Activations & Pop-ups`,
                    quantity: 1,
                    rate: metrics.activationCosts,
                    amount: metrics.activationCosts
                }];
                total = metrics.activationCosts;
            }

            setInvoiceData({
                invoiceNumber,
                brand: brand.brandName,
                brandId: selectedBrand,
                brandEmail: `billing@${selectedBrand.replace('-', '')}.com`, // Placeholder
                type: invoiceType,
                dateRange,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                lineItems,
                subtotal: total,
                tax: 0, // No tax on services
                total,
                notes: invoiceType === 'commission'
                    ? 'Commission based on verified sales during the billing period.'
                    : 'Charges for in-store activations and promotional pop-up events.',
                status: 'pending'
            });

            setShowPreview(true);
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            alert('Failed to generate invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Download as PDF (using browser print)
    const downloadPDF = () => {
        const printContent = document.getElementById('invoice-preview');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice ${invoiceData?.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1e293b; }
                        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .company-name { font-size: 24px; font-weight: 800; color: #10b981; }
                        .invoice-title { font-size: 32px; font-weight: 800; color: #1e293b; }
                        .invoice-meta { text-align: right; }
                        .invoice-meta p { margin: 4px 0; color: #64748b; }
                        .bill-to { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
                        .bill-to h3 { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
                        td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
                        .amount { text-align: right; font-weight: 600; }
                        .totals { text-align: right; }
                        .totals .total-row { font-size: 20px; font-weight: 800; color: #10b981; }
                        .notes { background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; }
                        .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>${COMPANY_INFO.name} • ${COMPANY_INFO.email}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Send email (placeholder)
    const sendEmail = () => {
        alert('📧 Email feature coming soon!\n\nThis will automatically send the invoice to the brand\'s billing email when email integration is connected.');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Invoice Generator</h1>
                    <p className="text-slate-500">Generate and send invoices to brands</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        Admin Only
                    </span>
                </div>
            </div>

            {/* Invoice Builder */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="text-emerald-500" size={20} />
                    Create New Invoice
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Brand Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Select Brand</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                            <option value="">Choose a brand...</option>
                            {brandList.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.brandName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Invoice Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Invoice Type</label>
                        <select
                            value={invoiceType}
                            onChange={(e) => setInvoiceType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                            <option value="commission">Commission (5% of Sales)</option>
                            <option value="activation">Activation Costs (Pop-ups)</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Period Start</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Period End</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateInvoice}
                    disabled={!selectedBrand || loading}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="animate-spin" size={18} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileText size={18} />
                            Generate Invoice
                        </>
                    )}
                </button>
            </div>

            {/* Invoice Preview */}
            {showPreview && invoiceData && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Action Bar */}
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <Eye className="text-slate-400" size={20} />
                            <span className="font-bold text-slate-700">Invoice Preview</span>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                                {invoiceData.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={downloadPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                            >
                                <Download size={16} />
                                Download PDF
                            </button>
                            <button
                                onClick={sendEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                                <Mail size={16} />
                                Send Email
                            </button>
                        </div>
                    </div>

                    {/* Invoice Content */}
                    <div id="invoice-preview" className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-emerald-600">{COMPANY_INFO.name}</h2>
                                <p className="text-slate-500">{COMPANY_INFO.address}</p>
                                <p className="text-slate-500">{COMPANY_INFO.email}</p>
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-black text-slate-900">INVOICE</h1>
                                <p className="text-slate-500 mt-2">#{invoiceData.invoiceNumber}</p>
                            </div>
                        </div>

                        {/* Bill To & Invoice Details */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="bg-slate-50 rounded-xl p-5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Bill To</h3>
                                <p className="text-lg font-bold text-slate-900">{invoiceData.brand}</p>
                                <p className="text-slate-500">{invoiceData.brandEmail}</p>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="flex justify-end gap-4">
                                    <span className="text-slate-500">Invoice Type:</span>
                                    <span className="font-bold text-slate-900 capitalize">{invoiceData.type}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="text-slate-500">Issue Date:</span>
                                    <span className="font-bold text-slate-900">{invoiceData.issueDate}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="text-slate-500">Due Date:</span>
                                    <span className="font-bold text-amber-600">{invoiceData.dueDate}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="text-slate-500">Period:</span>
                                    <span className="font-bold text-slate-900">{invoiceData.dateRange.start} to {invoiceData.dateRange.end}</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase rounded-l-lg">Description</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase">Qty</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase">Rate</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase rounded-r-lg">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.lineItems.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-4 px-4 text-slate-900">{item.description}</td>
                                        <td className="py-4 px-4 text-right text-slate-600">{item.quantity}</td>
                                        <td className="py-4 px-4 text-right text-slate-600">${item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-72 space-y-2">
                                <div className="flex justify-between py-2">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-bold text-slate-900">${invoiceData.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-500">Tax</span>
                                    <span className="font-bold text-slate-900">${invoiceData.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between py-3 text-xl">
                                    <span className="font-bold text-slate-900">Total Due</span>
                                    <span className="font-black text-emerald-600">${invoiceData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
                            <h3 className="font-bold text-amber-800 mb-1">Notes</h3>
                            <p className="text-amber-700 text-sm">{invoiceData.notes}</p>
                        </div>

                        {/* Payment Terms */}
                        <div className="mt-8 text-center text-slate-400 text-sm">
                            <p>Payment due within 30 days of invoice date.</p>
                            <p className="mt-1">Thank you for partnering with The Green Truth NYC!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Invoices This Month"
                    value="0"
                    icon={<FileText className="text-blue-500" />}
                    subtitle="Generate more above"
                />
                <StatCard
                    title="Total Outstanding"
                    value="$0.00"
                    icon={<Clock className="text-amber-500" />}
                    subtitle="Pending payments"
                />
                <StatCard
                    title="Collected This Month"
                    value="$0.00"
                    icon={<CheckCircle className="text-emerald-500" />}
                    subtitle="Paid invoices"
                />
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-500">{title}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
    );
}
