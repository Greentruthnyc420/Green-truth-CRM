import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { getBrandProducts, updateBrandProducts, updateBrandMenuUrl } from '../../services/firestoreService';
import { uploadBrandMenu } from '../../services/storageService';
import {
    Package, Plus, Edit2, Trash2, Save, X,
    DollarSign, Hash, AlertCircle, Check, Upload
} from 'lucide-react';

export default function BrandMenuEditor() {
    const { brandUser } = useBrandAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | null
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleMenuUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size limit (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        setUploadSuccess(false);

        try {
            // 1. Upload to Storage
            const url = await uploadBrandMenu(file, brandUser.brandId);

            // 2. Update Firestore Profile
            await updateBrandMenuUrl(brandUser.brandId, url);

            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload menu. Please try again.");
        } finally {
            setUploading(false);
        }
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

    const handleDelete = async (productId) => {
        if (confirm('Are you sure you want to remove this product?')) {
            const updatedProducts = products.filter(p => p.id !== productId);
            setProducts(updatedProducts);
            await saveToFirestore(updatedProducts);
        }
    };

    const handleAddNew = () => {
        setNewProduct({
            id: `new-${Date.now()}`,
            name: '',
            description: '',
            price: 0,
            caseSize: 1,
            unit: 'unit'
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
                            Official Menu PDF
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Upload your designed menu (PDF/Image). This will be downloadable by all ambassadors.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors font-medium border border-slate-200">
                            {uploading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                            ) : (
                                <Upload size={18} />
                            )}
                            {uploading ? 'Uploading...' : 'Upload New Menu'}
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={handleMenuUpload}
                                disabled={uploading}
                            />
                        </label>
                        {uploadSuccess && (
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1 justify-center animate-in fade-in">
                                <Check size={12} /> Uploaded Successfully!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-800 font-medium">Menu updates propagate globally</p>
                    <p className="text-sm text-blue-600">When you update prices or products, all sales ambassadors will see the changes immediately.</p>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* New Product Card */}
                {newProduct && (
                    <div className="bg-amber-50 border-2 border-amber-300 border-dashed rounded-xl p-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Product name *"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-medium"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            />
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
                {products.map((product) => (
                    <div key={product.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        {editingProduct?.id === product.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none font-medium"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                                />
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
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Package size={20} className="text-amber-600" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">{product.name}</h3>
                                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-lg font-bold text-amber-600">${product.price.toFixed(2)}</span>
                                    <span className="text-sm text-slate-500">{product.caseSize} per case</span>
                                </div>
                            </>
                        )}
                    </div>
                ))}

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
            </div>
        </div >
    );
}
