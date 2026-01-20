import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, Import, Upload, CheckCircle, Eye, RefreshCw, Mail, ChevronDown, ChevronRight } from 'lucide-react';
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
    // State
    const [invoiceType, setInvoiceType] = useState('brand'); // 'brand' | 'dispensary'
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedDispensary, setSelectedDispensary] = useState('');
    const [dispensaries, setDispensaries] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(''); // Email

    useEffect(() => {
        // Fetch dispensaries if type is dispensary
        if (invoiceType === 'dispensary' && dispensaries.length === 0) {
            import('../../../services/firestoreService').then(({ getLeads }) => {
                getLeads().then(data => setDispensaries(data));
            });
        }
    }, [invoiceType, dispensaries.length]); // Added dispensaries.length to dependency array

    // Handle Brand/Dispensary Selection
    const handleEntitySelect = (id) => {
        if (invoiceType === 'brand') {
            setSelectedBrand(id);
            // Mock email for brand
            setSelectedRecipient(`${id}@brand.com`);
        } else {
            setSelectedDispensary(id);
            const disp = dispensaries.find(d => d.id === id);
            setSelectedRecipient(disp?.email || '');
        }
        setLineItems([]); // Clear items on switch
    };
    const [brandUsers, setBrandUsers] = useState([]);

    const [invoiceData, setInvoiceData] = useState(null); // Will be set before preview/save

    // UI State
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [uploading, setUploading] = useState(null); // track which item is uploading
    const [showPreview, setShowPreview] = useState(false);
    const [lineItems, setLineItems] = useState([]); // Local state for builder
    const [expandedRows, setExpandedRows] = useState({}); // Track which rows are expanded
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState('');

    const toggleRowExpand = (idx) => {
        setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Auto-generate Due Date (Net 30)
    useEffect(() => {
        const today = new Date();
        const d = new Date(today);
        d.setDate(d.getDate() + 30);
        setDueDate(d.toISOString().split('T')[0]);
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

            // Dynamic import of pricing logic to avoid circular dependency issues if any
            const { calculateAgencyShiftCost } = await import('../../../utils/pricing');

            const newItems = activations.map(act => {
                const duration = act.duration || 4; // Default to 4 hours if missing

                // Calculate real cost based on region and duration
                // Assuming act.region exists, otherwise default to NYC
                const shiftData = {
                    region: act.region || 'NYC',
                    hoursWorked: duration,
                    milesTraveled: act.milesTraveled || 0,
                    tollAmount: act.tollAmount || 0
                };

                const cost = calculateAgencyShiftCost(shiftData);

                return {
                    id: `act-${act.id}`,
                    description: `Activation: ${act.storeName || 'Store Visit'} - ${new Date(act.createdAt).toLocaleDateString()} (${duration}h, ${act.region || 'NYC'})`,
                    quantity: 1, // Quantity is 1 event
                    rate: cost, // Total cost for the event
                    amount: cost,
                    sourceType: 'activation',
                    sourceId: act.id,
                    // AUTO-ATTACH RECEIPTS: toll receipt takes priority, but store both
                    attachmentUrl: act.toll_receipt_url || act.trip_log_image_url || null,
                    meta: {
                        repName: act.repName || userMap[act.repId] || 'Rep',
                        date: act.createdAt,
                        // Store both receipt URLs for reference
                        tollReceiptUrl: act.toll_receipt_url || null,
                        tripLogImageUrl: act.trip_log_image_url || null,
                        mileageData: act.milesTraveled || 0
                    }
                };
            });

            if (newItems.length === 0) {
                alert("No unbilled work found.");
            } else {
                setLineItems(prev => [...prev, ...newItems]);
                alert(`Imported ${activations.length} items with correct regional pricing.`);
            }
        } catch (error) {
            console.error("Import failed", error);
            alert("Failed to import activations.");
        } finally {
            setImportLoading(false);
        }
    };

    // Handle Import Sales logic - supports both brand and dispensary modes
    const handleImportSales = async () => {
        // Validate selection based on invoice type
        if (invoiceType === 'brand' && !selectedBrand) {
            alert("Please select a brand first");
            return;
        }
        if (invoiceType === 'dispensary' && !selectedDispensary) {
            alert("Please select a dispensary first");
            return;
        }

        setImportLoading(true);
        try {
            const { getSales } = await import('../../../services/firestoreService');
            const allSales = await getSales();

            let filteredSales = [];

            if (invoiceType === 'dispensary') {
                // Filter by dispensary ID or name
                const selectedDisp = dispensaries.find(d => d.id === selectedDispensary);
                const dispName = selectedDisp?.dispensaryName || '';

                filteredSales = allSales.filter(sale => {
                    // Match by dispensary ID or name
                    return sale.dispensaryId === selectedDispensary ||
                        (sale.dispensaryName && sale.dispensaryName.toLowerCase() === dispName.toLowerCase());
                });
            } else {
                // Filter by brand (original logic)
                const brandName = brandList.find(b => b.id === selectedBrand)?.name || selectedBrand;

                filteredSales = allSales.filter(sale => {
                    if (sale.items && sale.items.length > 0) {
                        return sale.items.some(item =>
                            (item.brandId === selectedBrand) ||
                            (item.brandName && item.brandName.toLowerCase().includes(brandName.toLowerCase()))
                        );
                    }
                    // Also check sale-level brand info
                    return sale.brandId === selectedBrand ||
                        (sale.brandName && sale.brandName.toLowerCase().includes(brandName.toLowerCase()));
                });
            }

            const newItems = filteredSales.map(sale => {
                const products = sale.items || sale.products || [];
                const productSummary = products.length > 0
                    ? products.map(p => `${p.name || p.productId} x${p.quantity || 1}`).join(', ')
                    : '';

                return {
                    id: `sale-${sale.id}`,
                    description: invoiceType === 'dispensary'
                        ? `Sale: ${new Date(sale.date).toLocaleDateString()} - ${products.length} items`
                        : `Wholesale: ${sale.dispensaryName} - ${new Date(sale.date).toLocaleDateString()}`,
                    quantity: 1,
                    rate: sale.totalAmount || sale.amount || 0,
                    amount: sale.totalAmount || sale.amount || 0,
                    sourceType: 'sale',
                    sourceId: sale.id,
                    attachmentUrl: null,
                    products: products, // Include full product details for expansion
                    meta: {
                        repName: 'Sales Rep',
                        date: sale.date,
                        dispensaryName: sale.dispensaryName,
                        productSummary: productSummary
                    }
                };
            });

            if (newItems.length === 0) {
                alert(invoiceType === 'dispensary'
                    ? "No sales found for this dispensary."
                    : "No sales found for this brand.");
            } else {
                setLineItems(prev => [...prev, ...newItems]);
                alert(`Imported ${filteredSales.length} sales records.`);
            }

        } catch (error) {
            console.error("Import Sales failed", error);
            alert("Failed to import sales.");
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
                    <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Invoice Generator</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create itemized invoices for brands</p>
                </div>
            </div>

            {!showPreview && (
                <div className="themed-card rounded-2xl p-6 shadow-sm space-y-6">
                    {/* Invoice Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invoice Type</label>
                                <div className="flex p-1 rounded-lg w-fit" style={{ background: 'var(--bg-secondary)' }}>
                                    <button
                                        onClick={() => setInvoiceType('brand')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${invoiceType === 'brand' ? 'shadow' : ''}`}
                                        style={{
                                            background: invoiceType === 'brand' ? 'var(--bg-card)' : 'transparent',
                                            color: invoiceType === 'brand' ? 'var(--text-primary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        Brand Invoice
                                    </button>
                                    <button
                                        onClick={() => setInvoiceType('dispensary')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${invoiceType === 'dispensary' ? 'shadow' : ''}`}
                                        style={{
                                            background: invoiceType === 'dispensary' ? 'var(--bg-card)' : 'transparent',
                                            color: invoiceType === 'dispensary' ? 'var(--text-primary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        Dispensary Invoice
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    {invoiceType === 'brand' ? 'Select Brand' : 'Select Dispensary'}
                                </label>
                                {invoiceType === 'brand' ? (
                                    <select
                                        className="w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        value={selectedBrand}
                                        onChange={(e) => handleEntitySelect(e.target.value)}
                                    >
                                        <option value="">-- Choose Brand --</option>
                                        {brandList.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        className="w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        value={selectedDispensary}
                                        onChange={(e) => handleEntitySelect(e.target.value)}
                                    >
                                        <option value="">-- Choose Dispensary --</option>
                                        {dispensaries.sort((a, b) => a.dispensaryName.localeCompare(b.dispensaryName)).map(disp => (
                                            <option key={disp.id} value={disp.id}>{disp.dispensaryName}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Bill To (Email)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="email"
                                        className="w-full pl-10 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        placeholder="billing@company.com"
                                        value={selectedRecipient}
                                        onChange={(e) => setSelectedRecipient(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Invoice Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Subtotal</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Tax (0%)</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="pt-3 flex justify-between font-bold text-lg" style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <span>Total Due</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePreview}
                                disabled={lineItems.length === 0}
                                className="w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'var(--text-primary)', color: 'var(--bg-card)' }}
                            >
                                <FileText size={18} />
                                Generate Invoice PDF
                            </button>
                            {/* Send Email Button placeholder */}
                        </div>
                    </div>
                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Line Items</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={addManualItem}
                                    className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                                <button
                                    onClick={handleImportUnbilled}
                                    disabled={!selectedBrand || importLoading}
                                    className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                    {importLoading ? <RefreshCw className="animate-spin" size={16} /> : <Import size={16} />}
                                    Import Unbilled Work
                                </button>
                                <button
                                    onClick={handleImportSales}
                                    disabled={(invoiceType === 'brand' ? !selectedBrand : !selectedDispensary) || importLoading}
                                    className="px-3 py-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                    {importLoading ? <RefreshCw className="animate-spin" size={16} /> : <Import size={16} />}
                                    Import Sales
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>
                            <table className="w-full text-sm">
                                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold" style={{ color: 'var(--text-secondary)' }}>Description</th>
                                        <th className="px-4 py-3 text-right font-bold w-24" style={{ color: 'var(--text-secondary)' }}>Qty</th>
                                        <th className="px-4 py-3 text-right font-bold w-24" style={{ color: 'var(--text-secondary)' }}>Rate</th>
                                        <th className="px-4 py-3 text-right font-bold w-32" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                                        <th className="px-4 py-3 text-center font-bold w-16" style={{ color: 'var(--text-secondary)' }}>Evid.</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody style={{ borderColor: 'var(--border-primary)' }}>
                                    {lineItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center italic" style={{ color: 'var(--text-tertiary)' }}>
                                                No items added. Import work or add manually.
                                            </td>
                                        </tr>
                                    ) : (
                                        lineItems.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <tr className="hover:bg-slate-50 group">
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {/* Expand button for items with products */}
                                                            {item.products && item.products.length > 0 && (
                                                                <button
                                                                    onClick={() => toggleRowExpand(idx)}
                                                                    className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                                                                    title="View products"
                                                                >
                                                                    {expandedRows[idx] ? (
                                                                        <ChevronDown size={14} />
                                                                    ) : (
                                                                        <ChevronRight size={14} />
                                                                    )}
                                                                </button>
                                                            )}
                                                            <input
                                                                className="w-full bg-transparent outline-none"
                                                                value={item.description}
                                                                onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                                                                placeholder="Item description"
                                                            />
                                                        </div>
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
                                                    <td className="px-4 py-2 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
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
                                                {/* Expanded product details row */}
                                                {expandedRows[idx] && item.products && item.products.length > 0 && (
                                                    <tr className="bg-slate-50">
                                                        <td colSpan="6" className="px-6 py-3">
                                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                                Products Purchased
                                                            </div>
                                                            <div className="space-y-1">
                                                                {item.products.map((product, pIdx) => (
                                                                    <div key={pIdx} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                                                                        <div>
                                                                            <span className="font-medium text-slate-700">{product.name || product.productId || 'Unknown'}</span>
                                                                            {product.brandName && (
                                                                                <span className="text-slate-400 ml-2 text-xs">({product.brandName})</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm">
                                                                            <span className="text-slate-500">{product.quantity || 1}x @ ${(product.price || 0).toFixed(2)}</span>
                                                                            <span className="font-bold text-slate-700 ml-3">
                                                                                ${((product.quantity || 1) * (product.price || 0)).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                                {lineItems.length > 0 && (
                                    <tfoot className="font-bold" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>Total:</td>
                                            <td className="px-4 py-3 text-right" style={{ color: 'var(--success)' }}>
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
                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            className="w-full p-3 rounded-xl text-sm h-24 resize-none"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            placeholder="Payment instructions, thank you note, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handlePreview}
                            disabled={!selectedBrand || lineItems.length === 0}
                            className="px-6 py-3 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ background: 'var(--text-primary)', color: 'var(--bg-card)' }}
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
export default AdminInvoiceGenerator;
