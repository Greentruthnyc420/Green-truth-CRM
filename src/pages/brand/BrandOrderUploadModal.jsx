import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, AlertCircle, Check, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { addSale } from '../../services/firestoreService';

export default function BrandOrderUploadModal({ isOpen, onClose, brandId, onOrderCreated }) {
    const { showNotification } = useNotification();
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('upload'); // upload, preview, processing

    // Column Mapping State
    const [columnMapping, setColumnMapping] = useState({
        productName: '',
        quantity: '',
        price: '', // Optional: if provided, overrides catalog price
        dispensary: '' // Optional: if provided per row, otherwise global selector could be added
    });

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);

        Papa.parse(uploadedFile, {
            header: true,
            preview: 5, // Just preview first few rows
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setPreviewData(results.data);
                    setHeaders(Object.keys(results.data[0]));
                    // Auto-guess mappings
                    const keys = Object.keys(results.data[0]).map(k => k.toLowerCase());
                    const mapping = { ...columnMapping };

                    if (!mapping.productName) mapping.productName = Object.keys(results.data[0]).find(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('item') || k.toLowerCase().includes('name')) || '';
                    if (!mapping.quantity) mapping.quantity = Object.keys(results.data[0]).find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('count')) || '';
                    if (!mapping.price) mapping.price = Object.keys(results.data[0]).find(k => k.toLowerCase().includes('price') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('amount')) || '';
                    if (!mapping.dispensary) mapping.dispensary = Object.keys(results.data[0]).find(k => k.toLowerCase().includes('customer') || k.toLowerCase().includes('dispensary') || k.toLowerCase().includes('shop')) || '';

                    setColumnMapping(mapping);
                    setStep('preview');
                }
            },
            error: (err) => {
                showNotification("Failed to parse CSV", "error");
                console.error(err);
            }
        });
    };

    const handleProcess = async () => {
        if (!columnMapping.productName || !columnMapping.quantity) {
            showNotification("Please map Product Name and Quantity columns", "warning");
            return;
        }

        setLoading(true);
        // Full Parse
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                try {
                    const orders = results.data.filter(row => row[columnMapping.productName]);
                    let successCount = 0;

                    // Group by dispensary if possible, or just create individual sales?
                    // For simplicity, we'll assume we create 1 sale entry per row or group them?
                    // The 'addSale' function takes a single sale object.
                    // Let's create one order (Sale) per distinct Dispensary found, OR if dispensary is not in CSV, prompts user?
                    // For V1: Let's assume we create generic "CSV Imported" sales.

                    // Better approach: Group items by DispensaryName -> Create 1 Sale per Dispensary
                    const ordersByDispensary = {};

                    orders.forEach(row => {
                        const dispensaryName = row[columnMapping.dispensary] || "Unknown Dispensary (CSV)";
                        if (!ordersByDispensary[dispensaryName]) {
                            ordersByDispensary[dispensaryName] = [];
                        }

                        const qty = parseFloat(row[columnMapping.quantity]) || 0;
                        const price = parseFloat(row[columnMapping.price]) || 0;

                        if (qty > 0) {
                            ordersByDispensary[dispensaryName].push({
                                productId: `csv-prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Placeholder ID
                                name: row[columnMapping.productName],
                                quantity: qty,
                                price: price,
                                subtotal: qty * price
                            });
                        }
                    });

                    // Create Sales in Firestore
                    for (const [dispensaryName, items] of Object.entries(ordersByDispensary)) {
                        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

                        const saleData = {
                            brandId: brandId,
                            dispensaryName: dispensaryName,
                            items: items,
                            totalAmount: totalAmount,
                            status: 'Pending', // Default status for imported orders
                            orderDate: new Date(), // Now
                            source: 'csv_upload'
                        };

                        await addSale(saleData);
                        successCount++;
                    }

                    showNotification(`Successfully imported orders for ${successCount} dispensaries`, "success");
                    onOrderCreated(); // Refresh parent
                    handleClose();

                } catch (error) {
                    console.error("Import failed", error);
                    showNotification("Failed to import orders", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleClose = () => {
        setFile(null);
        setPreviewData([]);
        setStep('upload');
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-600" />
                        Import Orders from CSV
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'upload' && (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Upload size={32} className="text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Click to upload CSV</h3>
                            <p className="text-slate-500 text-sm">Supported columns: Product Name, Quantity, Price, Dispensary</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Map Columns</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Product Name *</label>
                                        <select
                                            value={columnMapping.productName}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, productName: e.target.value }))}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Select Column</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Quantity *</label>
                                        <select
                                            value={columnMapping.quantity}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, quantity: e.target.value }))}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Select Column</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Price / Cost (Optional)</label>
                                        <select
                                            value={columnMapping.price}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Use Catalog Price</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Dispensary (Optional)</label>
                                        <select
                                            value={columnMapping.dispensary}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, dispensary: e.target.value }))}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Unknown / Default</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 mb-2 text-sm">Preview ({previewData.length} rows)</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                {Object.values(columnMapping).filter(Boolean).map(col => (
                                                    <th key={col} className="px-4 py-2">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.slice(0, 3).map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(columnMapping).filter(Boolean).map(col => (
                                                        <td key={col} className="px-4 py-2 text-slate-700">{row[col]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    {step === 'preview' && (
                        <button
                            onClick={handleProcess}
                            className="px-4 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    Import Orders
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
