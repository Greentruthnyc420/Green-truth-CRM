import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText, Download, Import, Upload, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { useBrandAuth, AVAILABLE_BRANDS } from '../../../contexts/BrandAuthContext';
import { createInvoice, getUnbilledActivations } from '../../../services/invoiceService';
import { getBrandUsers } from '../../../services/firestoreService';
import { uploadInvoiceAttachment } from '../../../services/storageService';

// Company Info
const COMPANY_INFO = {
    name: 'The Green Truth NYC',
    address: 'New York, NY',
    email: 'billing@thegreentruthnyc.com',
    phone: '(646) 555-0123',
    logo: '/logos/greentruth-logo.png'
};

const AdminInvoiceGenerator = () => {
    const { brandUser } = useBrandAuth();
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [brandUsers, setBrandUsers] = useState([]);

    const [invoiceData, setInvoiceData] = useState(null); // Will be set before preview/save

    // UI State
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [uploading, setUploading] = useState(null); // track which item is uploading
    const [showPreview, setShowPreview] = useState(false);
    const [lineItems, setLineItems] = useState([]); // Local state for builder
    const [notes, setNotes] = useState('');

    // Auto-generate Due Date (Net 30)
    useEffect(() => {
        const today = new Date();
        const d = new Date(today);
        d.setDate(d.getDate() + 30);
        // Set initial dueDate for the builder
        setInvoiceData(prev => ({
            ...prev,
            date: today.toISOString().split('T')[0],
            dueDate: d.toISOString().split('T')[0]
        }));
    }, []);

    // Get brand list (exclude processors for now)
    const brandList = Object.entries(AVAILABLE_BRANDS)
        .filter(([_, b]) => !b.isProcessor)
        .map(([id, b]) => ({ id, ...b }));

    // Fetch Brand Users
    useEffect(() => {
        const fetchBrandUsers = async () => {
            if (!selectedBrand) {
                setBrandUsers([]);
                setSelectedRecipient('');
                setLineItems([]); // Clear line items if brand changes
                return;
            }
            try {
                const users = await getBrandUsers(selectedBrand);
                setBrandUsers(users);
                if (users.length > 0) setSelectedRecipient(users[0].email);
                else setSelectedRecipient('');
            } catch (error) {
                console.error('Error fetching brand users:', error);
                setBrandUsers([]);
                setSelectedRecipient('');
            }
        };
        fetchBrandUsers();
    }, [selectedBrand]);

    // Handle Import
    const handleImportUnbilled = async () => {
        if (!selectedBrand) {
            alert("Please select a brand first");
            return;
        }
        setImportLoading(true);
        try {
            const activations = await getUnbilledActivations(selectedBrand);
            const userMap = brandUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.name || u.email }), {});

            const newItems = activations.map(act => ({
                id: `act-${act.id}`,
                description: `Activation: ${act.storeName || 'Store Visit'} - ${new Date(act.createdAt).toLocaleDateString()}`,
                quantity: act.duration || 4, // Default 4 hours if missing
                rate: 25, // Default rate
                amount: (act.duration || 4) * 25,
                sourceType: 'activation',
                sourceId: act.id,
                attachmentUrl: null, // No receipt by default for activations unless we pull from activation proof
                meta: {
                    repName: act.repName || userMap[act.repId] || 'Rep',
                    date: act.createdAt
                }
            }));

            if (newItems.length === 0) {
                alert("No unbilled work found.");
            } else {
                setLineItems(prev => [...prev, ...newItems]);
                alert(`Imported ${activations.length} items. Please verify rates.`);
            }
        } catch (error) {
            console.error("Import failed", error);
            alert("Failed to import activations.");
        } finally {
            setImportLoading(false);
        }
    };

    // Handle File Upload for Item
    const handleFileUpload = async (index, file) => {
        if (!file) return;

        setUploading(index);
        try {
            const url = await uploadInvoiceAttachment(file);
            updateLineItem(index, 'attachmentUrl', url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload attachment");
        } finally {
            setUploading(null);
        }
    };

    const addManualItem = () => {
        setLineItems(prev => [...prev, {
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            isManual: true
        }]);
    };

    const updateLineItem = (index, field, value) => {
        setLineItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], [field]: value };

            // Auto calc amount
            if (field === 'quantity' || field === 'rate') {
                item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
            }

            newItems[index] = item;
            return newItems;
        });
    };

    const removeLineItem = (index) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotal = () => lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handlePreview = () => {
        if (!selectedBrand || lineItems.length === 0) return;

        const brand = AVAILABLE_BRANDS[selectedBrand];
        const total = calculateTotal();

        setInvoiceData({
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            brandId: selectedBrand,
            brandName: brand.brandName,
            brandEmail: selectedRecipient,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate,
            items: lineItems,
            subtotal: total,
            tax: 0,
            total: total,
            notes: notes,
            status: 'pending'
        });
        setShowPreview(true);
    };

    const handleSaveInvoice = async () => {
        if (!invoiceData) return;
        setLoading(true);
        try {
            await createInvoice(invoiceData);
            alert("Invoice created successfully!");
            // Reset
            setLineItems([]);
            setInvoiceData(null);
            setShowPreview(false);
        } catch (error) {
            console.error(error);
            alert("Failed to create invoice.");
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const printContent = document.getElementById('invoice-preview');
        if (!printContent) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice ${invoiceData?.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .total-row { font-size: 1.2em; background-color: #f8fafc; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Invoice Generator</h1>
                    <p className="text-slate-500">Create itemized invoices for brands</p>
                </div>
            </div>

            {/* Builder Mode */}
            {!showPreview && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Top Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Brand</label>
                            <select
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                            >
                                <option value="">Select Brand</option>
                                {brandList.map(b => <option key={b.id} value={b.id}>{b.brandName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Recipient</label>
                            <input
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                                value={selectedRecipient}
                                onChange={(e) => setSelectedRecipient(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-700">Line Items</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={addManualItem}
                                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                                <button
                                    onClick={handleImportActivations}
                                    disabled={!selectedBrand || importLoading}
                                    className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                    {importLoading ? <RefreshCw className="animate-spin" size={16} /> : <Import size={16} />}
                                    Import Unbilled Work
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-500">Description</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-500 w-24">Qty</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-500 w-24">Rate</th>
                                        <th className="px-4 py-3 text-right font-bold text-slate-500 w-32">Amount</th>
                                        <th className="px-4 py-3 text-center font-bold text-slate-500 w-16">Evid.</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lineItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                                                No items added. Import work or add manually.
                                            </td>
                                        </tr>
                                    ) : (
                                        lineItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 group">
                                                <td className="px-4 py-2">
                                                    <input
                                                        className="w-full bg-transparent outline-none"
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                                                        placeholder="Item description"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent outline-none text-right"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent outline-none text-right"
                                                        value={item.rate}
                                                        onChange={(e) => updateLineItem(idx, 'rate', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">
                                                    ${parseFloat(item.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <label className="cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(idx, e.target.files[0])}
                                                        />
                                                        {item.attachmentUrl ? (
                                                            <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">
                                                                <FileText size={16} />
                                                            </div>
                                                        ) : (
                                                            <div className="hover:bg-slate-100 p-1.5 rounded-lg">
                                                                <Import size={16} className="rotate-90" />
                                                            </div>
                                                        )}
                                                    </label>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => removeLineItem(idx)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {lineItems.length > 0 && (
                                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-right text-slate-600">Total:</td>
                                            <td className="px-4 py-3 text-right text-emerald-600">
                                                ${calculateTotal().toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-1">Notes</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm h-24 resize-none"
                            placeholder="Payment instructions, thank you note, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handlePreview}
                            disabled={!selectedBrand || lineItems.length === 0}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Eye size={18} /> Preview Invoice
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Mode */}
            {showPreview && invoiceData && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700">Preview Mode</span>
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">Unsaved</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Edit
                            </button>
                            <button
                                onClick={downloadPDF}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-white font-medium flex items-center gap-2"
                            >
                                <Download size={16} /> PDF
                            </button>
                            <button
                                onClick={handleSaveInvoice}
                                disabled={loading}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold flex items-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                Save & Send
                            </button>
                        </div>
                    </div>

                    <div id="invoice-preview" className="p-10 max-w-4xl mx-auto bg-white">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-2xl font-black text-emerald-600">{COMPANY_INFO.name}</h2>
                                <p className="text-slate-500 mt-1">{COMPANY_INFO.address}</p>
                                <p className="text-slate-500">{COMPANY_INFO.email}</p>
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                                <p className="text-slate-500 mt-2 font-medium">#{invoiceData.invoiceNumber}</p>
                                <p className="text-sm text-slate-400 mt-1">Issued: {new Date(invoiceData.issueDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Bill To Grid */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg text-slate-900">{invoiceData.brandName}</p>
                                    <p className="text-slate-600">{invoiceData.brandEmail}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amount Due</h3>
                                <p className="text-4xl font-black text-slate-900">${invoiceData.total.toFixed(2)}</p>
                                <p className="text-amber-600 font-medium mt-2">Due by {new Date(invoiceData.dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="text-left py-4 font-bold text-slate-700">Description</th>
                                    <th className="text-right py-4 font-bold text-slate-700">Qty</th>
                                    <th className="text-right py-4 font-bold text-slate-700">Rate</th>
                                    <th className="text-right py-4 font-bold text-slate-700">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoiceData.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-4 text-slate-600">{item.description}</td>
                                        <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-slate-600">${item.rate}</td>
                                        <td className="py-4 text-right font-bold text-slate-900">${parseFloat(item.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Total Section */}
                        <div className="border-t-2 border-slate-100 pt-6 flex justify-end">
                            <div className="w-1/3 space-y-3">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>${invoiceData.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-100">
                                    <span>Total</span>
                                    <span>${invoiceData.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Footer */}
                        {invoiceData.notes && (
                            <div className="mt-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-2">Notes</h4>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{invoiceData.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
