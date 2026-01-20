import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { getBrandProducts, updateBrandProducts, updateBrandMenuUrl } from '../../services/firestoreService';
import { parseMenuDocument } from '../../services/geminiService';
import {
    Package, Plus, Edit2, Trash2, Save, X,
    DollarSign, Hash, AlertCircle, Check, Upload, Tag, ToggleLeft, ToggleRight, Sparkles, RefreshCw, Eye, Store
} from 'lucide-react';
import { uploadBrandMenu, uploadProductImage } from '../../services/storageService';
import { useNotification } from '../../contexts/NotificationContext';

import { exportToDutchie, exportToBlaze, exportMetrcReady } from '../../utils/csvExporters';
import Papa from 'papaparse';

// Helper to clean product names for display (remove prefixes like "Indoor Flower - ")
const cleanProductDisplayName = (name) => {
    if (!name) return name;
    // Remove common product type prefixes
    const prefixes = [
        'Indoor Flower - ', 'Outdoor Flower - ', 'Greenhouse Flower - ',
        'Indoor Flower -', 'Outdoor Flower -', 'Greenhouse Flower -',
        'Infused Pre-Roll - ', 'Diamond Pre-Roll - ', 'Live Resin Minis - ',
        '2G Royal Palm - ', '1.1G Oil - ', '1.1G Sweet - ',
        '1G Oil - ', '2G Oil - '
    ];
    for (const prefix of prefixes) {
        if (name.startsWith(prefix)) {
            return name.slice(prefix.length).trim();
        }
        // Case insensitive check
        if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
            return name.slice(prefix.length).trim();
        }
    }
    return name;
};

export default function BrandMenuEditor() {
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();

    // Selected brand for menu editing (defaults to current brand)
    const [selectedBrandId, setSelectedBrandId] = React.useState(null);
    const [selectedBrandName, setSelectedBrandName] = React.useState('');

    // Initialize selected brand when brandUser loads
    React.useEffect(() => {
        if (brandUser?.brandId && !selectedBrandId) {
            setSelectedBrandId(brandUser.brandId);
            setSelectedBrandName(brandUser.brandName);
        }
    }, [brandUser, selectedBrandId]);

    // ... existing hooks ...

    // ... existing handlers ...

    const handleExport = (type) => {
        if (!products.length) {
            showNotification("No products to export", "info");
            return;
        }
        if (type === 'dutchie') exportToDutchie(products, selectedBrandName);
        if (type === 'blaze') exportToBlaze(products, selectedBrandName);
        if (type === 'metrc') exportMetrcReady(products);
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const importedProducts = results.data.map((row, i) => ({
                    id: `${selectedBrandId}-csv-${Date.now()}-${i}`,
                    name: row.Name || row.name || 'Unknown Product',
                    category: row.Category || row.category || 'Flower',
                    price: parseFloat(row.Price || row.price || 0),
                    thc: row.THC || row.thc || '0%',
                    strainType: row.Strain || row.strainType || 'Hybrid',
                    metrcTag: row.Metrc || row.metrcTag || '',
                    riid: row.RIID || row.riid || '',
                    image: row.Image || ''
                })).filter(p => p.name && p.name !== 'Unknown Product');

                setParsedProducts(importedProducts);
                setShowReviewModal(true);
            },
            error: (err) => {
                showNotification("Failed to parse CSV", "error");
            }
        });
    };
    const [products, setProducts] = useState([]);
    // NEW: Store products per brand for FLX processors
    const [productsByBrand, setProductsByBrand] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingBrandId, setEditingBrandId] = useState(null); // Track which brand the editing product belongs to
    const [newProduct, setNewProduct] = useState(null);
    const [newProductBrandId, setNewProductBrandId] = useState(null); // Track which brand to add new product to
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
    const [imageUploading, setImageUploading] = useState(false);

    const handleProductImageUpload = async (file, targetStateSetter) => {
        if (!file || !selectedBrandId) return;

        // Limits
        if (file.size > 5 * 1024 * 1024) {
            showNotification("Image must be under 5MB", "warning");
            return;
        }

        setImageUploading(true);
        try {
            const url = await uploadProductImage(file, selectedBrandId);
            targetStateSetter(prev => ({ ...prev, imageUrl: url }));
            showNotification("Image uploaded!", "success");
        } catch (error) {
            console.error(error);
            showNotification("Failed to upload image", "error");
        } finally {
            setImageUploading(false);
        }
    };

    const handleMenuUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size limit (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification("File size must be less than 5MB", 'warning');
            return;
        }

        setUploading(scanMode === 'both' || scanMode === 'upload_only');
        setScanning(scanMode === 'both' || scanMode === 'scan_only');
        setUploadSuccess(false);

        try {
            let url = null;

            // 1. Upload to Storage (Skip if scan_only)
            if (scanMode === 'both' || scanMode === 'upload_only') {
                url = await uploadBrandMenu(file, selectedBrandId);
                // 2. Update Firestore Profile
                await updateBrandMenuUrl(selectedBrandId, url);
                setUploadSuccess(true);
            }

            // 3. AI Scanning/Parsing (Skip if upload_only)
            if (scanMode === 'both' || scanMode === 'scan_only') {
                // 4. Send to Gemini for Parsing
                console.log("Sending to Gemini for parsing...");
                const aiProducts = await parseMenuDocument(file);

                if (aiProducts && aiProducts.length > 0) {
                    // Ensure IDs are unique
                    const stampedProducts = aiProducts.map((p, i) => ({
                        ...p,
                        id: `${selectedBrandId}-parsed-${Date.now()}-${i}`
                    }));
                    setParsedProducts(stampedProducts);
                    setShowReviewModal(true);

                    // If scan_only, we set success to true so the UI shows something while scanning finishes
                    if (scanMode === 'scan_only') {
                        setUploadSuccess(true);
                    }
                } else {
                    if (scanMode === 'scan_only' || scanMode === 'both') {
                        showNotification("AI couldn't extract products automatically. You can enter them manually.", 'info');
                    }
                }
            }

            // Handle success message cleanup
            if (scanMode === 'upload_only' || scanMode === 'both' || (scanMode === 'scan_only' && !showReviewModal)) {
                setTimeout(() => setUploadSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Upload/Scan failed", error);
            showNotification("Failed to process menu. Please try again.", 'error');
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
                <div className="themed-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b flex justify-between items-center rounded-t-2xl" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Sparkles style={{ color: 'var(--accent-primary)' }} />
                                AI Extracted Products
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Found {parsedProducts.length} products. Review before saving.</p>
                        </div>
                        <button onClick={handleDiscardParsed} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                            <X size={20} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1" style={{ background: 'var(--bg-primary)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {parsedProducts.map((p, idx) => (
                                <div key={idx} className="themed-card p-4 rounded-xl shadow-sm relative group">
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
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                                        <span className="font-bold text-amber-600">${p.price}</span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] mb-2">
                                        <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{p.category}</span>
                                        {p.thc && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold uppercase tracking-wider">{p.thc} THC</span>}
                                        {p.strainType && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-bold uppercase tracking-wider">{p.strainType}</span>}
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase tracking-wider">{p.caseSize || 1} units/case</span>
                                    </div>
                                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 flex justify-end gap-3 rounded-b-2xl" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}>
                        <button
                            onClick={handleDiscardParsed}
                            className="px-4 py-2 font-medium rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
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
            if (!brandUser) return;

            setLoading(true);

            // Check if this is a processor with multiple brands
            const isProcessor = brandUser.allowedBrands && brandUser.allowedBrands.length > 0;

            if (isProcessor) {
                // Load products from ALL allowed brands (not the processor itself)
                // allowedBrands can be an array of strings (brand IDs) or objects
                const brandIds = brandUser.allowedBrands.map(b => typeof b === 'string' ? b : (b.brandId || b.id));
                const brandProductsMap = {};

                // Format brand name from ID (e.g., "smoothie-bar" -> "Smoothie Bar")
                const formatBrandName = (id) => id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                console.log('[MenuEditor] Loading products for processor with brand IDs:', brandIds);

                for (const brandId of brandIds) {
                    // Skip the processor's own ID if it's in the list
                    if (brandId === brandUser.id) {
                        console.log(`[MenuEditor] Skipping processor's own ID: ${brandId}`);
                        continue;
                    }

                    const brandName = formatBrandName(brandId);
                    console.log(`[MenuEditor] Fetching products for brand: ${brandId} (${brandName})`);

                    const dynamicProducts = await getBrandProducts(brandId);
                    console.log(`[MenuEditor] Got ${dynamicProducts?.length || 0} products for ${brandId}`);

                    if (dynamicProducts && dynamicProducts.length > 0) {
                        brandProductsMap[brandId] = {
                            brandName,
                            brandId,
                            products: dynamicProducts
                        };
                    } else {
                        // Fallback to static catalog
                        const brandData = PRODUCT_CATALOG.find(b => b.id === brandId);
                        console.log(`[MenuEditor] Static catalog fallback for ${brandId}:`, brandData ? 'found' : 'not found');
                        if (brandData) {
                            brandProductsMap[brandId] = {
                                brandName,
                                brandId,
                                products: brandData.products
                            };
                        } else {
                            // Empty brand
                            brandProductsMap[brandId] = {
                                brandName,
                                brandId,
                                products: []
                            };
                        }
                    }
                }

                setProductsByBrand(brandProductsMap);
                // Also set flat products array for compatibility
                const allProducts = Object.values(brandProductsMap).flatMap(b => b.products);
                setProducts(allProducts);
            } else {
                // Single brand - original behavior
                if (!selectedBrandId) {
                    setLoading(false);
                    return;
                }

                const dynamicProducts = await getBrandProducts(selectedBrandId);

                if (dynamicProducts && dynamicProducts.length > 0) {
                    setProducts(dynamicProducts);
                } else {
                    const brandData = PRODUCT_CATALOG.find(b => b.id === selectedBrandId);
                    if (brandData) {
                        setProducts(brandData.products);
                    }
                }
            }

            setLoading(false);
        }
        loadProducts();
    }, [brandUser, selectedBrandId]); // Re-fetch when brand changes

    const handleEdit = (product, brandId) => {
        setEditingProduct({ ...product });
        setEditingBrandId(brandId);
    };

    const handleSaveEdit = async () => {
        const brandId = editingBrandId || selectedBrandId;

        // Check if we're in multi-brand mode
        const isProcessor = brandUser?.allowedBrands && brandUser.allowedBrands.length > 0;

        if (isProcessor && productsByBrand[brandId]) {
            // Update in the multi-brand structure
            const updatedBrandProducts = productsByBrand[brandId].products.map(p =>
                p.id === editingProduct.id ? editingProduct : p
            );

            setProductsByBrand(prev => ({
                ...prev,
                [brandId]: {
                    ...prev[brandId],
                    products: updatedBrandProducts
                }
            }));

            // Save to Firestore
            await saveToFirestoreForBrand(brandId, updatedBrandProducts);
        } else {
            // Single brand mode
            const updatedProducts = products.map(p =>
                p.id === editingProduct.id ? editingProduct : p
            );
            setProducts(updatedProducts);
            await saveToFirestore(updatedProducts);
        }

        setEditingProduct(null);
        setEditingBrandId(null);
    };

    const handleDelete = (product, brandId) => {
        setProductToDelete({ ...product, _brandId: brandId });
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        const brandId = productToDelete._brandId || selectedBrandId;
        const isProcessor = brandUser?.allowedBrands && brandUser.allowedBrands.length > 0;

        if (isProcessor && productsByBrand[brandId]) {
            const updatedBrandProducts = productsByBrand[brandId].products.filter(p => p.id !== productToDelete.id);

            setProductsByBrand(prev => ({
                ...prev,
                [brandId]: {
                    ...prev[brandId],
                    products: updatedBrandProducts
                }
            }));

            await saveToFirestoreForBrand(brandId, updatedBrandProducts);
        } else {
            const updatedProducts = products.filter(p => p.id !== productToDelete.id);
            setProducts(updatedProducts);
            await saveToFirestore(updatedProducts);
        }

        setProductToDelete(null);
    };

    const cancelDelete = () => {
        setProductToDelete(null);
    };

    const handleToggleStock = async (product, brandId) => {
        const toggledProduct = { ...product, inStock: !product.inStock };
        const isProcessor = brandUser?.allowedBrands && brandUser.allowedBrands.length > 0;

        if (isProcessor && productsByBrand[brandId]) {
            const updatedBrandProducts = productsByBrand[brandId].products.map(p =>
                p.id === product.id ? toggledProduct : p
            );

            setProductsByBrand(prev => ({
                ...prev,
                [brandId]: {
                    ...prev[brandId],
                    products: updatedBrandProducts
                }
            }));

            await saveToFirestoreForBrand(brandId, updatedBrandProducts);
        } else {
            const updatedProducts = products.map(p =>
                p.id === product.id ? toggledProduct : p
            );
            setProducts(updatedProducts);
            await saveToFirestore(updatedProducts);
        }
    };

    const handleAddNew = (brandId = null) => {
        const targetBrandId = brandId || selectedBrandId;
        setNewProductBrandId(targetBrandId);
        setNewProduct({
            id: `new-${Date.now()}`,
            name: '',
            description: '',
            price: 0,
            caseSize: 1,
            unit: 'unit',
            thc: '',
            metrcTag: '',
            riid: '',
            strainType: 'Hybrid',
            category: 'Flower',
            inStock: true
        });
    };

    const handleSaveNew = async () => {
        if (!newProduct.name || newProduct.price <= 0) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        const brandId = newProductBrandId || selectedBrandId;
        const newProductWithId = { ...newProduct, id: `${brandId}-${Date.now()}` };
        const isProcessor = brandUser?.allowedBrands && brandUser.allowedBrands.length > 0;

        if (isProcessor && productsByBrand[brandId]) {
            const updatedBrandProducts = [...productsByBrand[brandId].products, newProductWithId];

            setProductsByBrand(prev => ({
                ...prev,
                [brandId]: {
                    ...prev[brandId],
                    products: updatedBrandProducts
                }
            }));

            await saveToFirestoreForBrand(brandId, updatedBrandProducts);
        } else {
            const updatedProducts = [...products, newProductWithId];
            setProducts(updatedProducts);
            await saveToFirestore(updatedProducts);
        }

        setNewProduct(null);
        setNewProductBrandId(null);
    };

    const saveToFirestore = async (currentProducts) => {
        setSaveStatus('saving');
        const success = await updateBrandProducts(selectedBrandId, currentProducts);
        if (success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } else {
            showNotification('Failed to save changes. Please try again.', 'error');
            setSaveStatus(null);
        }
    };

    // Save to Firestore for a specific brand (multi-brand mode)
    const saveToFirestoreForBrand = async (brandId, currentProducts) => {
        setSaveStatus('saving');
        const success = await updateBrandProducts(brandId, currentProducts);
        if (success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } else {
            showNotification('Failed to save changes. Please try again.', 'error');
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Menu Editor</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Manage your product catalog. Changes sync to all sales reps.</p>
                        </div>

                        {/* Brand Info for Processors - shows which brands they manage */}
                        {brandUser?.isProcessor && brandUser?.allowedBrands && brandUser.allowedBrands.length > 0 && (
                            <div className="ml-4 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Managing Menus For</span>
                                <p className="font-semibold" style={{ color: 'var(--accent-primary)' }}>
                                    {brandUser.allowedBrands.map(b => b.brandName).join(' • ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && (
                        <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
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
                    {/* Import/Export Actions */}
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors shadow-sm themed-card hover:opacity-80" style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                        <Upload size={18} />
                        Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                    </label>

                    {/* Export Dropdown */}
                    <div className="relative group">
                        <button className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 themed-card hover:opacity-80" style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                            <Upload size={18} className="rotate-180" /> {/* Download Icon */}
                            Export CSV
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden themed-card" style={{ border: '1px solid var(--border-primary)' }}>
                            <button onClick={() => handleExport('dutchie')} className="w-full text-left px-4 py-3 hover:opacity-80 text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <span>🇳🇱</span> Dutchie Format
                            </button>
                            <button onClick={() => handleExport('blaze')} className="w-full text-left px-4 py-3 hover:opacity-80 text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <span>🔥</span> Blaze Format
                            </button>
                            <button onClick={() => handleExport('metrc')} className="w-full text-left px-4 py-3 hover:opacity-80 text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span>📦</span> Metrc Ready
                            </button>
                        </div>
                    </div>

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
            <div className="themed-card rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Upload size={20} style={{ color: 'var(--accent-primary)' }} />
                            Official Menu PDF/Image
                        </h2>
                        <div className="flex gap-2 mt-3 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-secondary)' }}>
                            {[
                                { id: 'both', label: 'Upload & Scan', icon: Sparkles },
                                { id: 'upload_only', label: 'Upload Only', icon: Upload },
                                { id: 'scan_only', label: 'Scan Only', icon: Eye }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setScanMode(mode.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                                    style={{
                                        background: scanMode === mode.id ? 'var(--bg-card)' : 'transparent',
                                        color: scanMode === mode.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        boxShadow: scanMode === mode.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    <mode.icon size={14} />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {scanMode === 'both' && "Upload your menu and automatically scan/import products."}
                            {scanMode === 'upload_only' && "Just update the downloadable menu file for sales reps."}
                            {scanMode === 'scan_only' && "Scan a document to import products without changing the menu file."}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium" style={{ background: uploading || scanning ? 'var(--accent-primary-soft)' : 'var(--bg-secondary)', color: uploading || scanning ? 'var(--accent-primary)' : 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
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
                    <div className="themed-card rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <AlertCircle style={{ color: 'var(--error)' }} />
                                Confirm Delete
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{productToDelete.name}</strong>?
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                This action cannot be undone. The product will be removed from your menu and all sales reps will no longer see it.
                            </p>
                        </div>
                        <div className="p-6 flex justify-end gap-3 rounded-b-2xl" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 font-medium rounded-lg transition-colors"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <AlertCircle size={20} style={{ color: 'var(--info)' }} className="mt-0.5" />
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--info)' }}>Menu updates propagate globally</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>When you update prices or products, all sales ambassadors will see the changes immediately.</p>
                </div>
            </div>

            {/* MULTI-BRAND VIEW for Processors */}
            {brandUser?.allowedBrands && brandUser.allowedBrands.length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(productsByBrand).map(([brandId, brandData]) => {
                        const brandProducts = brandData.products || [];

                        // Group this brand's products by category
                        const brandGroupedProducts = brandProducts.reduce((acc, product) => {
                            const category = product.category || 'Uncategorized';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(product);
                            return acc;
                        }, {});

                        return (
                            <div key={brandId} className="themed-card rounded-2xl p-6" style={{ border: '2px solid var(--accent-primary)' }}>
                                {/* Brand Header */}
                                <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <div>
                                        <h2 className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                            {brandData.brandName}
                                        </h2>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAddNew(brandId)}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add Product
                                    </button>
                                </div>

                                {/* Categories within this brand */}
                                {brandProducts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package size={40} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>No products for this brand yet</p>
                                    </div>
                                ) : (
                                    categoryOrder.map(category => {
                                        const categoryProducts = brandGroupedProducts[category];
                                        if (!categoryProducts || categoryProducts.length === 0) return null;

                                        return (
                                            <div key={`${brandId}-${category}`} className="mb-6 last:mb-0">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                                        {category}
                                                    </h3>
                                                    <div className="h-px flex-1" style={{ background: 'var(--border-primary)' }}></div>
                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                                                        {categoryProducts.length}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {categoryProducts.map(product => (
                                                        <div key={product.id} className={`themed-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${!product.inStock ? 'border-red-200 dark:border-red-800' : ''}`} style={{ borderColor: product.inStock ? 'var(--border-primary)' : undefined }}>
                                                            {/* Product View Mode */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.inStock ? 'bg-amber-100' : 'bg-red-100'}`}>
                                                                    <Package size={20} className={`${product.inStock ? 'text-amber-600' : 'text-red-500'}`} />
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleStock(product, brandId);
                                                                        }}
                                                                        className="p-2 rounded-lg transition-colors"
                                                                        style={{ color: product.inStock ? 'var(--text-tertiary)' : 'var(--accent-success)' }}
                                                                        title={product.inStock ? "Mark as Sold Out" : "Mark as In Stock"}
                                                                    >
                                                                        {product.inStock ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEdit(product, brandId);
                                                                        }}
                                                                        className="p-2 rounded-lg transition-colors"
                                                                        style={{ color: 'var(--text-tertiary)' }}
                                                                        title="Edit Product"
                                                                    >
                                                                        <Edit2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(product, brandId);
                                                                        }}
                                                                        className="p-2 rounded-lg transition-colors"
                                                                        style={{ color: 'var(--text-tertiary)' }}
                                                                        title="Delete Product"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <h4 className={`font-bold mb-1 ${product.inStock ? '' : 'line-through'}`} style={{ color: product.inStock ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                                                {cleanProductDisplayName(product.name)}
                                                            </h4>
                                                            {!product.inStock && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wider">
                                                                    Sold Out
                                                                </span>
                                                            )}
                                                            <div className="flex flex-wrap gap-1 my-2">
                                                                {product.thc && (
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                        {product.thc} THC
                                                                    </span>
                                                                )}
                                                                {product.strainType && (
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${product.strainType === 'Indica' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                                        product.strainType === 'Sativa' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                            'bg-blue-50 text-blue-700 border-blue-100'
                                                                        }`}>
                                                                        {product.strainType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                                                            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                                                <span className="text-lg font-bold text-amber-600">${product.price?.toFixed(2) || '0.00'}</span>
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.caseSize || 1} per case</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}

                    {/* Empty state for processor with no products across all brands */}
                    {Object.values(productsByBrand).every(b => b.products.length === 0) && (
                        <div className="col-span-full text-center py-12 themed-card rounded-xl">
                            <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>No products across any of your brands yet</p>
                        </div>
                    )}
                </div>
            ) : (
                /* SINGLE BRAND VIEW - Original behavior */
                categoryOrder.map(category => {
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
                                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{category}</h2>
                                <div className="h-px flex-1" style={{ background: 'var(--border-primary)' }}></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* New Product Card (only show in its category or default to top if uncategorized?) 
                                Actually, checking if newProduct.category matches current section is cleaner.
                            */}
                                {newProduct && newProduct.category === category && (
                                    <div className="bg-amber-50 border-2 border-amber-300 border-dashed rounded-xl p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-amber-700 mb-3 uppercase tracking-wider">New Product</h3>
                                        <div className="space-y-3">
                                            <div className="w-full mb-3">
                                                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Product Image (Optional)</label>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden group" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                                                        {newProduct.imageUrl ? (
                                                            <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Store size={20} style={{ color: 'var(--text-tertiary)' }} />
                                                        )}
                                                        {imageUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div></div>}
                                                    </div>
                                                    <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                                                        <Upload size={14} className="inline mr-1" /> Upload
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleProductImageUpload(e.target.files[0], setNewProduct)}
                                                            disabled={imageUploading}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <input
                                                type="text"
                                                placeholder="Product name *"
                                                className="w-full p-2 rounded-lg outline-none font-medium"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    className="w-1/2 p-2 rounded-lg outline-none text-sm"
                                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                    value={newProduct.category}
                                                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                                                >
                                                    {categoryOrder.filter(c => c !== 'Uncategorized').map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <div className="w-1/2 flex items-center justify-between px-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>In Stock</span>
                                                    <button
                                                        onClick={() => setNewProduct(prev => ({ ...prev, inStock: !prev.inStock }))}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newProduct.inStock ? 'bg-emerald-500' : ''}`}
                                                        style={!newProduct.inStock ? { background: 'var(--text-tertiary)' } : {}}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${newProduct.inStock ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            <textarea
                                                placeholder="Description"
                                                className="w-full p-2 rounded-lg outline-none text-sm resize-none"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                rows={2}
                                                value={newProduct.description}
                                                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Price *</label>
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
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Case Size</label>
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
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>THC %</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 24%"
                                                        className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                        value={newProduct.thc || ''}
                                                        onChange={(e) => setNewProduct(prev => ({ ...prev, thc: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
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
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div>
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Metrc Tag (Package UID)</label>
                                                    <div className="relative">
                                                        <Tag size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="1A40..."
                                                            className="w-full pl-7 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-mono text-xs"
                                                            value={newProduct.metrcTag || ''}
                                                            onChange={(e) => setNewProduct(prev => ({ ...prev, metrcTag: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Retail Item ID (RIID)</label>
                                                    <div className="relative">
                                                        <Hash size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="POS ID"
                                                            className="w-full pl-7 p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-mono text-xs"
                                                            value={newProduct.riid || ''}
                                                            onChange={(e) => setNewProduct(prev => ({ ...prev, riid: e.target.value }))}
                                                        />
                                                    </div>
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
                                    <div key={product.id} className={`themed-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${!product.inStock ? 'border-red-200 dark:border-red-800' : ''}`} style={{ borderColor: product.inStock ? 'var(--border-primary)' : undefined }}>
                                        {editingProduct?.id === product.id ? (
                                            // Edit Mode
                                            <div className="space-y-3">
                                                <div className="w-full">
                                                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Product Image</label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {editingProduct.imageUrl ? (
                                                                <img src={editingProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Store size={20} style={{ color: 'var(--text-tertiary)' }} />
                                                            )}
                                                            {imageUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div></div>}
                                                        </div>
                                                        <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                                                            Change
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleProductImageUpload(e.target.files[0], setEditingProduct)}
                                                                disabled={imageUploading}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>

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
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Price</label>
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
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Case Size</label>
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
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>THC %</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none"
                                                            value={editingProduct.thc || ''}
                                                            onChange={(e) => setEditingProduct(prev => ({ ...prev, thc: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
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
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Metrc Tag</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-mono text-xs"
                                                            value={editingProduct.metrcTag || ''}
                                                            onChange={(e) => setEditingProduct(prev => ({ ...prev, metrcTag: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>RIID</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-mono text-xs"
                                                            value={editingProduct.riid || ''}
                                                            onChange={(e) => setEditingProduct(prev => ({ ...prev, riid: e.target.value }))}
                                                        />
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
                                                    <h3 className={`font-bold mb-1 ${product.inStock ? '' : 'line-through'}`} style={{ color: product.inStock ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{cleanProductDisplayName(product.name)}</h3>
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
                                                <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>

                                                {/* Compliance IDs */}
                                                {(product.metrcTag || product.riid) && (
                                                    <div className="flex flex-col gap-1 mb-3 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                                        {product.metrcTag && (
                                                            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                                <Tag size={10} style={{ color: 'var(--text-tertiary)' }} />
                                                                <span className="truncate" title={product.metrcTag}>{product.metrcTag}</span>
                                                            </div>
                                                        )}
                                                        {product.riid && (
                                                            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                                <Hash size={10} style={{ color: 'var(--text-tertiary)' }} />
                                                                <span className="truncate" title={product.riid}>ID: {product.riid}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                                    <span className="text-lg font-bold text-amber-600">${product.price?.toFixed(2) || '0.00'}</span>
                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.caseSize || 1} per case</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}

            {/* Empty state for single brand mode */}
            {!(brandUser?.allowedBrands && brandUser.allowedBrands.length > 0) && products.length === 0 && !newProduct && (
                <div className="col-span-full text-center py-12 themed-card rounded-xl">
                    <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>No products in your catalog yet</p>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ background: 'var(--accent-primary)', color: 'white' }}
                    >
                        Add Your First Product
                    </button>
                </div>
            )}
        </div>
    );
}
