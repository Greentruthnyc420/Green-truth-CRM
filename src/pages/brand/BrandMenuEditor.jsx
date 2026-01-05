import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { getBrandProducts, updateBrandProducts, updateBrandMenuUrl } from '../../services/firestoreService';
import { parseMenuDocument } from '../../services/aiService';
import {
    Package, Plus, Edit2, Trash2, Save, X,
    DollarSign, Hash, AlertCircle, Check, Upload, Tag, ToggleLeft, ToggleRight, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { uploadBrandMenu } from '../../services/storageService';

export default function BrandMenuEditor() {
    const { brandUser } = useBrandAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | null
    const [uploading, setUploading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // AI Parsing State
    const [parsedProducts, setParsedProducts] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Delete Confirmation State
    const [productToDelete, setProductToDelete] = useState(null);

    // Upload Options State
    const [scanMode, setScanMode] = useState('both'); // 'both', 'upload_only', 'scan_only'

    const handleMenuUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size limit (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        setUploading(scanMode === 'both' || scanMode === 'upload_only');
        setScanning(scanMode === 'both' || scanMode === 'scan_only');
        setUploadSuccess(false);

        try {
            let url = null;

            // 1. Upload to Storage (Skip if scan_only)
            if (scanMode === 'both' || scanMode === 'upload_only') {
                url = await uploadBrandMenu(file, brandUser.brandId);
                // 2. Update Firestore Profile
                await updateBrandMenuUrl(brandUser.brandId, url);
                setUploadSuccess(true);
            }

            // 3. AI Scanning/Parsing (Skip if upload_only)
            if (scanMode === 'both' || scanMode === 'scan_only') {
                // Convert file to Base64 for AI Scanning
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(file);
                });

                // 4. Send to Gemini for Parsing
                console.log("Sending to Gemini for parsing...");
                const aiProducts = await parseMenuDocument(base64, file.type);

                if (aiProducts && aiProducts.length > 0) {
                    // Ensure IDs are unique
                    const stampedProducts = aiProducts.map((p, i) => ({
                        ...p,
                        id: `${brandUser.brandId}-parsed-${Date.now()}-${i}`
                    }));
                    setParsedProducts(stampedProducts);
                    setShowReviewModal(true);

                    // If scan_only, we set success to true so the UI shows something while scanning finishes
                    if (scanMode === 'scan_only') {
                        setUploadSuccess(true);
                    }
                } else {
                    if (scanMode === 'scan_only' || scanMode === 'both') {
                        alert("AI couldn't extract products automatically. You can enter them manually.");
                    }
                }
            }

            // Handle success message cleanup
            if (scanMode === 'upload_only' || scanMode === 'both' || (scanMode === 'scan_only' && !showReviewModal)) {
                setTimeout(() => setUploadSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Upload/Scan failed", error);
            alert("Failed to process menu. Please try again.");
        } finally {
            setUploading(false);
            setScanning(false);
        }
    };

    const handleAcceptParsed = async (mode) => {
        if (!parsedProducts) return;

        let finalProducts = [];
        if (mode === 'merge') {
            finalProducts = [...products, ...parsedProducts];
        } else {
            // Replace
            finalProducts = [...parsedProducts];
        }

        setProducts(finalProducts);
        setShowReviewModal(false);
        setParsedProducts(null);
        await saveToFirestore(finalProducts);
    };

    const handleDiscardParsed = () => {
        setParsedProducts(null);
        setShowReviewModal(false);
    };

    // Review Modal Component (Inline for simplicity)
    const ParsedReviewModal = () => {
        if (!showReviewModal || !parsedProducts) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-purple-600" />
                                AI Extracted Products
                            </h2>
                            <p className="text-slate-600 text-sm mt-1">Found {parsedProducts.length} products. Review before saving.</p>
                        </div>
                        <button onClick={handleDiscardParsed} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {parsedProducts.map((p, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                const newParsed = parsedProducts.filter((_, i) => i !== idx);
                                                setParsedProducts(newParsed);
                                            }}
                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                            title="Remove this item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800">{p.name}</h3>
                                        <span className="font-bold text-amber-600">${p.price}</span>
                                    </div>
                                    <div className="flex gap-2 text-xs mb-2">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{p.category}</span>
                                        {p.thc && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">{p.thc}</span>}
                                        {p.strainType && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{p.strainType}</span>}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                        <button
                            onClick={handleDiscardParsed}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => handleAcceptParsed('merge')}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-200 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add to Existing
                        </button>
                        <button
                            onClick={() => handleAcceptParsed('replace')}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Replace All
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        async function loadProducts() {
            if (!brandUser?.brandId) return;

            // Try fetching dynamic products first
            const dynamicProducts = await getBrandProducts(brandUser.brandId);

            if (dynamicProducts && dynamicProducts.length > 0) {
                setProducts(dynamicProducts);
            } else {
                // Fallback to static catalog if no dynamic data exists
                const brandData = PRODUCT_CATALOG.find(b => b.id === brandUser.brandId);
                if (brandData) {
                    setProducts(brandData.products);
                    // Optional: Auto-seed Firestore so future edits work on top of this?
                    // Let's not auto-save on load to avoid unintended writes, 
                    // but the first manual save will persist this list to Firestore.
                }
            }
            setLoading(false);
        }
        loadProducts();
    }, [brandUser]);

    const handleEdit = (product) => {
        setEditingProduct({ ...product });
    };

    const handleSaveEdit = async () => {
        const updatedProducts = products.map(p =>
            p.id === editingProduct.id ? editingProduct : p
        );
        setProducts(updatedProducts);
        setEditingProduct(null);
        await saveToFirestore(updatedProducts);
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        const updatedProducts = products.filter(p => p.id !== productToDelete.id);
        setProducts(updatedProducts);
        setProductToDelete(null);
        await saveToFirestore(updatedProducts);
    };

    const cancelDelete = () => {
        setProductToDelete(null);
    };

    const handleToggleStock = async (product) => {
        const updatedProducts = products.map(p =>
            p.id === product.id ? { ...p, inStock: !p.inStock } : p
        );
        setProducts(updatedProducts);
        await saveToFirestore(updatedProducts);
    };

    const handleAddNew = () => {
        setNewProduct({
            id: `new-${Date.now()}`,
            name: '',
            description: '',
            price: 0,
            caseSize: 1,
            unit: 'unit',
            thc: '',
            strainType: 'Hybrid',
            category: 'Flower',
            inStock: true
        });
    };

    const handleSaveNew = async () => {
        if (!newProduct.name || newProduct.price <= 0) {
            alert('Please fill in all required fields');
            return;
        }
        const updatedProducts = [...products, { ...newProduct, id: `${brandUser?.brandId}-${Date.now()}` }];
        setProducts(updatedProducts);
        setNewProduct(null);
        await saveToFirestore(updatedProducts);
    };

    const saveToFirestore = async (currentProducts) => {
        setSaveStatus('saving');
        const success = await updateBrandProducts(brandUser.brandId, currentProducts);
        if (success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } else {
            alert('Failed to save changes. Please try again.');
            setSaveStatus(null);
        }
    };

    // Group Products by Category
    const groupedProducts = products.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    // Ordered categories
    const categoryOrder = ['Flower', 'Pre-Roll', 'Vape', 'Concentrate', 'Edible', 'Uncategorized'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Menu Editor</h1>
                    <p className="text-slate-500">Manage your product catalog. Changes sync to all sales reps.</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && (
                        <span className="text-sm text-slate-500 flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                            Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-sm text-amber-700 flex items-center gap-2">
                            <Check size={16} />
                            Saved!
                        </span>
                    )}
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>



            {/* PDF Menu Upload Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Upload size={20} className="text-brand-600" />
                            Official Menu PDF/Image
                        </h2>
                        <div className="flex gap-2 mt-3 p-1 bg-slate-100 rounded-lg w-fit">
                            {[
                                { id: 'both', label: 'Upload & Scan', icon: Sparkles },
                                { id: 'upload_only', label: 'Upload Only', icon: Upload },
                                { id: 'scan_only', label: 'Scan Only', icon: Eye }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setScanMode(mode.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${scanMode === mode.id
                                        ? 'bg-white text-brand-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <mode.icon size={14} />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                            {scanMode === 'both' && "Upload your menu and automatically scan/import products."}
                            {scanMode === 'upload_only' && "Just update the downloadable menu file for sales reps."}
                            {scanMode === 'scan_only' && "Scan a document to import products without changing the menu file."}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <label className={`flex items-center justify-center gap-2 px-4 py-2 text-slate-700 rounded-lg cursor-pointer transition-colors font-medium border border-slate-200 ${uploading || scanning ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
                            {uploading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            ) : scanning ? (
                                <Sparkles size={18} className="animate-pulse text-indigo-600" />
                            ) : (
                                <Upload size={18} />
                            )}

                            {uploading ? 'Uploading...' : scanning ? 'Scanning with AI...' :
                                scanMode === 'both' ? 'Upload & Scan Menu' :
                                    scanMode === 'upload_only' ? 'Upload Menu Only' : 'Scan Menu Only'}

                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={handleMenuUpload}
                                disabled={uploading || scanning}
                            />
                        </label>
                        {uploadSuccess && !scanning && !uploading && (
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1 justify-center animate-in fade-in">
                                <Check size={12} />
                                {scanMode === 'both' ? 'Upload & Scan Complete!' :
                                    scanMode === 'upload_only' ? 'Menu Uploaded Successfully!' :
                                        'Scan Complete!'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Render Modal */}
            <ParsedReviewModal />

            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="text-red-600" />
                                Confirm Delete
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to delete <strong>{productToDelete.name}</strong>?
                            </p>
                            <p className="text-sm text-slate-500">
                                This action cannot be undone. The product will be removed from your menu and all sales reps will no longer see it.
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-200 flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-800 font-medium">Menu updates propagate globally</p>
                    <p className="text-sm text-blue-600">When you update prices or products, all sales ambassadors will see the changes immediately.</p>
                </div>
            </div>

            {/* Products Grid by Category */}
            {categoryOrder.map(category => {
                const categoryProducts = groupedProducts[category];
                const isNewProductInCategory = newProduct && newProduct.category === category;

                // Don't skip if we are adding a new product in this category
                if (!isNewProductInCategory) {
                    if (!categoryProducts && category !== 'Uncategorized') return null;
                    if (!categoryProducts && category === 'Uncategorized' && Object.keys(groupedProducts).length > 0) return null;
                    if (!categoryProducts || categoryProducts.length === 0) return null;
                }


                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pt-4">
                            <h2 className="text-lg font-bold text-slate-700">{category}</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* New Product Card (only show in its category or default to top if uncategorized?) 
                                Actually, checking if newProduct.category matches current section is cleaner.
                            */}
                            {newProduct && newProduct.category === category && (
                                <div className="bg-amber-50 border-2 border-amber-300 border-dashed rounded-xl p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-amber-700 mb-3 uppercase tracking-wider">New Product</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Product name *"
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-medium"
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                className="w-1/2 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none bg-white text-sm"
                                                value={newProduct.category}
                                                onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                                            >
                                                {categoryOrder.filter(c => c !== 'Uncategorized').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="w-1/2 flex items-center justify-between px-2 bg-white rounded-lg border border-slate-200">
                                                <span className="text-xs text-slate-500">In Stock</span>
                                                <button
                                                    onClick={() => setNewProduct(prev => ({ ...prev, inStock: !prev.inStock }))}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newProduct.inStock ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${newProduct.inStock ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            placeholder="Description"
                                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none text-sm resize-none"
                                            rows={2}
                                            value={newProduct.description}
                                            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Price *</label>
                                                <div className="relative">
                                                    <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full pl-7 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                        value={newProduct.price}
                                                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Case Size</label>
                                                <div className="relative">
                                                    <Hash size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        className="w-full pl-7 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                        value={newProduct.caseSize}
                                                        onChange={(e) => setNewProduct(prev => ({ ...prev, caseSize: parseInt(e.target.value) || 1 }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">THC %</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 24%"
                                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                    value={newProduct.thc || ''}
                                                    onChange={(e) => setNewProduct(prev => ({ ...prev, thc: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Type</label>
                                                <select
                                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none bg-white"
                                                    value={newProduct.strainType || 'Hybrid'}
                                                    onChange={(e) => setNewProduct(prev => ({ ...prev, strainType: e.target.value }))}
                                                >
                                                    <option value="Indica">Indica</option>
                                                    <option value="Sativa">Sativa</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleSaveNew}
                                                className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save size={16} />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setNewProduct(null)}
                                                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Existing Products */}
                            {categoryProducts && categoryProducts.map((product) => (
                                <div key={product.id} className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${!product.inStock ? 'border-red-100 bg-red-50/10' : 'border-slate-100'}`}>
                                    {editingProduct?.id === product.id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-medium"
                                                value={editingProduct.name}
                                                onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    className="w-1/2 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none bg-white text-sm"
                                                    value={editingProduct.category || 'Uncategorized'}
                                                    onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                                                >
                                                    {categoryOrder.filter(c => c !== 'Uncategorized').map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <div className="w-1/2 flex items-center justify-between px-2 bg-white rounded-lg border border-slate-200">
                                                    <span className="text-xs text-slate-500">In Stock</span>
                                                    <button
                                                        onClick={() => setEditingProduct(prev => ({ ...prev, inStock: !prev.inStock }))}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editingProduct.inStock ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${editingProduct.inStock ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            <textarea
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none text-sm resize-none"
                                                rows={2}
                                                value={editingProduct.description}
                                                onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Price</label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full pl-7 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                            value={editingProduct.price}
                                                            onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Case Size</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                        value={editingProduct.caseSize}
                                                        onChange={(e) => setEditingProduct(prev => ({ ...prev, caseSize: parseInt(e.target.value) || 1 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">THC %</label>
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                        value={editingProduct.thc || ''}
                                                        onChange={(e) => setEditingProduct(prev => ({ ...prev, thc: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Type</label>
                                                    <select
                                                        className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none bg-white"
                                                        value={editingProduct.strainType || 'Hybrid'}
                                                        onChange={(e) => setEditingProduct(prev => ({ ...prev, strainType: e.target.value }))}
                                                    >
                                                        <option value="Indica">Indica</option>
                                                        <option value="Sativa">Sativa</option>
                                                        <option value="Hybrid">Hybrid</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Save size={16} />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingProduct(null)}
                                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.inStock ? 'bg-amber-100' : 'bg-red-100'}`}>
                                                    <Package size={20} className={`${product.inStock ? 'text-amber-600' : 'text-red-500'}`} />
                                                </div>
                                                <div className="flex gap-1">
                                                    {/* Quick Stock Toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStock(product);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${product.inStock ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-red-600 bg-red-50 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                                        title={product.inStock ? "Mark as Sold Out" : "Mark as In Stock"}
                                                    >
                                                        {product.inStock ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(product);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(product);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <h3 className={`font-bold mb-1 ${product.inStock ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{product.name}</h3>
                                                {!product.inStock && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wider">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {product.thc && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                                                        {product.thc} THC
                                                    </span>
                                                )}
                                                {product.strainType && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${product.strainType === 'Indica' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        product.strainType === 'Sativa' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                        {product.strainType}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <span className="text-lg font-bold text-amber-600">${product.price.toFixed(2)}</span>
                                                <span className="text-sm text-slate-500">{product.caseSize} per case</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {products.length === 0 && !newProduct && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-4">No products in your catalog yet</p>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                    >
                        Add Your First Product
                    </button>
                </div>
            )}
        </div >
    );
}
