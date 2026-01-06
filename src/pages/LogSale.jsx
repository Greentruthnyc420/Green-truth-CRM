import React, { useState, useEffect } from 'react';
import { DollarSign, Store, Calendar, CheckCircle, Plus, Trash2, Package, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { addSale, getAvailableLeads, getMyDispensaries, getBrandProducts } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { awardOrderPoints } from '../services/pointsService';
import confetti from 'canvas-confetti';

import { PRODUCT_CATALOG } from '../data/productCatalog';

export default function LogSale() {
    const navigate = useNavigate();
    // location removed
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();


    // State management
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [availableStores, setAvailableStores] = useState({ active: [], myLeads: [], openLeads: [] });
    const [basicInfo, setBasicInfo] = useState({ dispensaryName: '', dispensaryId: '', licenseNumber: '', date: new Date().toISOString().split('T')[0], paymentTerms: 'COD' });
    const [selectedBrandIds, setSelectedBrandIds] = useState([]);
    const [brandProductsMap, setBrandProductsMap] = useState({}); // Map<brandId, Product[]>
    const [cart, setCart] = useState({});
    const [pricingModes, setPricingModes] = useState({}); // Map<productId, 'unit' | 'case'>

    // Helper to get mode
    const getMode = (productId) => pricingModes[productId] || 'unit';

    // Voice Integration Logic - REMOVED

    // Fetch Stores on Mount
    useEffect(() => {
        async function fetchStores() {
            const uid = currentUser?.uid || 'test-user-123';
            const [activeData, leadsData] = await Promise.all([
                getMyDispensaries(uid),
                getAvailableLeads(uid)
            ]);

            // Set of Active Store Names for easy lookup
            const activeNames = new Set(activeData.map(s => s.name));

            // Categorize
            const myLeads = [];
            const openLeads = [];

            leadsData.forEach(lead => {
                // If already active, skip (it's in Active Accounts)
                if (activeNames.has(lead.dispensaryName)) return;

                if (lead.userId === uid) {
                    myLeads.push(lead);
                } else {
                    openLeads.push(lead);
                }
            });

            setAvailableStores({
                active: activeData,
                myLeads,
                openLeads
            });
        }
        fetchStores();
    }, [currentUser]);

    // Fetch Dynamic Products when Brands are Selected
    useEffect(() => {
        async function fetchSelectedBrandProducts() {
            const newProductMap = { ...brandProductsMap };
            let hasUpdates = false;

            for (const brandId of selectedBrandIds) {
                // If not already fetched or empty
                if (!newProductMap[brandId]) {
                    const dynamicProducts = await getBrandProducts(brandId);
                    if (dynamicProducts && dynamicProducts.length > 0) {
                        newProductMap[brandId] = dynamicProducts;
                    } else {
                        // Fallback to static catalog
                        const staticBrand = PRODUCT_CATALOG.find(b => b.id === brandId);
                        newProductMap[brandId] = staticBrand ? staticBrand.products : [];
                    }
                    hasUpdates = true;
                }
            }

            if (hasUpdates) {
                setBrandProductsMap(newProductMap);
            }
        }

        if (selectedBrandIds.length > 0) {
            fetchSelectedBrandProducts();
        }
    }, [selectedBrandIds]);

    // Helpers
    const steps = ['Store Details', 'Select Brands', ...selectedBrandIds.map(id => {
        const brand = PRODUCT_CATALOG.find(b => b.id === id);
        return brand ? brand.name : 'Brand';
    }), 'Review & Submit'];

    // Total Calculation
    const calculateTotal = () => {
        let total = 0;
        Object.entries(cart).forEach(([brandId, products]) => {
            // Use dynamic map instead of static catalog
            const productsList = brandProductsMap[brandId] || [];

            Object.entries(products).forEach(([productId, qty]) => {
                const product = productsList.find(p => p.id === productId);
                if (product) {
                    total += (product.price * qty);
                }
            });
        });
        return total;
    };

    const handleNext = () => {
        if (step === 0) {
            if (!basicInfo.dispensaryName) {
                showNotification("Please select a dispensary", 'warning');
                return;
            }
            // Enforce OCM License for Sales
            if (!basicInfo.licenseNumber || basicInfo.licenseNumber.trim().length === 0) {
                showNotification("OCM License Number is required to log a sale.", 'warning');
                return;
            }
        }
        if (step === 1 && selectedBrandIds.length === 0) {
            showNotification("Please select at least one brand", 'warning');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => Math.max(0, prev - 1));
    };

    const updateCart = (brandId, productId, qty) => {
        setCart(prev => {
            const brandCart = prev[brandId] || {};
            if (qty <= 0) {
                const { [productId]: _, ...rest } = brandCart;
                return { ...prev, [brandId]: rest };
            }
            return {
                ...prev,
                [brandId]: { ...brandCart, [productId]: qty }
            };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const totalAmount = calculateTotal();
            const commission = totalAmount * 0.02; // 2% Commission

            // Flatten cart for storage
            const flatItems = [];
            Object.entries(cart).forEach(([brandId, products]) => {
                const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
                const productsList = brandProductsMap[brandId] || []; // Use dynamic list

                Object.entries(products).forEach(([productId, qty]) => {
                    const product = productsList.find(p => p.id === productId);
                    if (product) {
                        flatItems.push({
                            brandId: brand.id,
                            brandName: brand.name,
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: qty,
                            unit: product.unit
                        });
                    }
                });
            });

            await addSale({
                dispensaryName: basicInfo.dispensaryName,
                licenseNumber: basicInfo.licenseNumber, // Included in Sale Record and auto-updates Lead
                date: new Date(basicInfo.date),
                paymentTerms: basicInfo.paymentTerms,
                amount: totalAmount,
                items: flatItems,
                commissionEarned: commission,
                userId: currentUser?.uid || 'test-user-123',
                userName: currentUser?.displayName || currentUser?.email || 'Unknown User',
                activeBrands: selectedBrandIds.map(id => {
                    const b = PRODUCT_CATALOG.find(cat => cat.id === id);
                    return b ? b.name : null;
                }).filter(Boolean)
            });

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            try {
                // Award High-Precision Points
                if (basicInfo.dispensaryId) {
                    await awardOrderPoints(
                        currentUser?.uid || 'test-user-123',
                        basicInfo.dispensaryId,
                        totalAmount,
                        selectedBrandIds
                    );
                }
            } catch (pErr) {
                console.warn("Points awarding failed, but sale was logged.", pErr);
            }

            showNotification(`Sale logged! Commission: $${commission.toFixed(2)}`, 'success', 5000);
            navigate('/app');
        } catch (error) {
            console.error('Error logging sale:', error);
            showNotification('Failed to log sale: ' + (error.message || 'Unknown error'), 'error', 10000);
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStepContent = () => {
        // Step 0: Basic Info
        if (step === 0) {
            return (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-800">Who are you selling to?</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Dispensary</label>
                        <div className="relative">
                            <Store size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all bg-white appearance-none"
                                value={basicInfo.dispensaryName}
                                onChange={(e) => {
                                    if (e.target.value === 'new_store_redirect') {
                                        navigate('/app/new-lead');
                                    } else {
                                        const name = e.target.value;
                                        // Auto-find license
                                        let foundLicense = '';
                                        let foundId = '';
                                        const allStores = [...availableStores.active, ...availableStores.myLeads, ...availableStores.openLeads];
                                        const match = allStores.find(s => (s.dispensaryName === name || s.name === name));
                                        if (match) {
                                            if (match.licenseNumber) foundLicense = match.licenseNumber;
                                            foundId = match.id;
                                        }

                                        setBasicInfo({ ...basicInfo, dispensaryName: name, dispensaryId: foundId, licenseNumber: foundLicense });
                                    }
                                }}
                            >
                                <option value="">Select a store...</option>

                                {availableStores.myLeads.length > 0 && (
                                    <optgroup label="My Leads">
                                        {availableStores.myLeads.map(lead => {
                                            // Calculate countdown
                                            const createdAt = lead.createdAt ? new Date(lead.createdAt.toDate()) : new Date();
                                            const now = new Date();
                                            const diffTime = Math.abs(now - createdAt);
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            const daysRemaining = 45 - diffDays;

                                            return (
                                                <option key={lead.id} value={lead.dispensaryName}>
                                                    {lead.dispensaryName} (My Lead - {daysRemaining > 0 ? daysRemaining + ' days left' : 'Expiring'})
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                )}

                                {availableStores.active.length > 0 && (
                                    <optgroup label="Active Accounts">
                                        {availableStores.active.map((store, idx) => (
                                            <option key={`active-${idx}`} value={store.name}>
                                                {store.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}

                                {availableStores.openLeads.length > 0 && (
                                    <optgroup label="Open Leads">
                                        {availableStores.openLeads.map(lead => {
                                            // Calculate countdown
                                            const createdAt = lead.createdAt ? new Date(lead.createdAt.toDate()) : new Date();
                                            const now = new Date();
                                            const diffTime = Math.abs(now - createdAt);
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            const daysRemaining = 45 - diffDays; // Changed from 90 to 45

                                            let label = lead.dispensaryName;
                                            if (daysRemaining > 0) {
                                                label = `${lead.dispensaryName} (Open Lead - ${daysRemaining} days left)`;
                                            } else {
                                                label = `${lead.dispensaryName} (Open Lead - Expired)`;
                                            }
                                            return (
                                                <option key={lead.id} value={lead.dispensaryName}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                )}

                                <option value="new_store_redirect" className="font-bold text-brand-600">+ Register New Lead</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
                        <div className="relative">
                            <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all bg-white appearance-none"
                                value={basicInfo.paymentTerms}
                                onChange={(e) => setBasicInfo({ ...basicInfo, paymentTerms: e.target.value })}
                            >
                                <option value="COD">COD (Cash on Delivery)</option>
                                <option value="Net 30">Net 30</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Date of Sale</label>
                        <div className="relative">
                            <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                                value={basicInfo.date}
                                onChange={(e) => setBasicInfo({ ...basicInfo, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            OCM License Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            {/* Reusing CheckCircle as icon or maybe FileText? */}
                            <CheckCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="OCM-..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                                value={basicInfo.licenseNumber || ''}
                                onChange={(e) => setBasicInfo({ ...basicInfo, licenseNumber: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-1">Required for accurate payout tracking.</p>
                    </div>
                </div>
            );
        }

        // Step 1: Select Brands
        if (step === 1) {
            return (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-800">Select Brands</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {PRODUCT_CATALOG.map(brand => {
                            const isSelected = selectedBrandIds.includes(brand.id);
                            return (
                                <div
                                    key={brand.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedBrandIds(prev => prev.filter(id => id !== brand.id));
                                        } else {
                                            setSelectedBrandIds(prev => [...prev, brand.id]);
                                        }
                                    }}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {brand.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{brand.name}</h3>
                                            <p className="text-sm text-slate-500">{brand.products.length} Products Available</p>
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircle className="text-brand-600" size={24} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Product Selection Steps (2 to N)
        const brandIndex = step - 2;
        if (brandIndex >= 0 && brandIndex < selectedBrandIds.length) {
            const brandId = selectedBrandIds[brandIndex];
            const brand = PRODUCT_CATALOG.find(b => b.id === brandId); // name/logo still static
            const brandCart = cart[brandId] || {};
            // Use dynamic products
            const productsList = brandProductsMap[brandId] || [];

            // Group Products
            const groupedProducts = productsList.reduce((acc, product) => {
                const category = product.category || 'Uncategorized';
                if (!acc[category]) acc[category] = [];
                acc[category].push(product);
                return acc;
            }, {});

            const categoryOrder = ['Flower', 'Pre-Roll', 'Vape', 'Concentrate', 'Edible', 'Uncategorized'];

            return (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-800">{brand.name} Menu</h2>
                    <div className="space-y-4">
                        {productsList.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                                No products available for this brand.
                            </div>
                        ) : (
                            categoryOrder.map(category => {
                                const categoryProducts = groupedProducts[category];
                                if (!categoryProducts || categoryProducts.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2 pt-4">
                                            <h3 className="text-lg font-bold text-slate-700">{category}</h3>
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </div>

                                        {categoryProducts.map(product => {
                                            const qty = brandCart[product.id] || 0;
                                            const mode = getMode(product.id);
                                            const caseSize = product.caseSize || 1;
                                            const casePrice = product.price * caseSize;

                                            // Display logic
                                            const displayQty = mode === 'case' ? (qty / caseSize) : qty;
                                            // Determine increment step
                                            const stepSize = mode === 'case' ? caseSize : 1;

                                            return (
                                                <div key={product.id} className={`product-card bg-white border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${!product.inStock ? 'opacity-70 border-slate-100 bg-slate-50' : 'border-slate-100'}`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <h3 className="font-bold text-slate-800">
                                                                {product.name}
                                                                {!product.inStock && (
                                                                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
                                                                        Sold Out
                                                                    </span>
                                                                )}
                                                            </h3>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 my-1.5">
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
                                                        <p className="text-sm text-slate-500">{product.description}</p>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                                <span className="font-semibold text-slate-700">Unit:</span> ${product.price.toFixed(2)}
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                                <span className="font-semibold text-slate-700">Case:</span> ${casePrice.toFixed(2)} ({caseSize}u)
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {/* Toggle */}
                                                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                                            <button
                                                                onClick={() => setPricingModes(prev => ({ ...prev, [product.id]: 'unit' }))}
                                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'unit' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Unit
                                                            </button>
                                                            <button
                                                                onClick={() => setPricingModes(prev => ({ ...prev, [product.id]: 'case' }))}
                                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'case' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                Case
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => updateCart(brand.id, product.id, qty - stepSize)}
                                                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={qty <= 0}
                                                            >
                                                                -
                                                            </button>
                                                            <div className="w-20 text-center">
                                                                <input
                                                                    type="number"
                                                                    className="w-full text-center font-bold outline-none border-b-2 border-slate-200 focus:border-brand-500 bg-transparent"
                                                                    value={displayQty}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        const newQty = mode === 'case' ? val * caseSize : val;
                                                                        updateCart(brand.id, product.id, newQty);
                                                                    }}
                                                                    min="0"
                                                                    disabled={!product.inStock}
                                                                />
                                                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                                    {mode === 'case' ? 'Cases' : 'Units'}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => updateCart(brand.id, product.id, qty + stepSize)}
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${!product.inStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-100 hover:bg-brand-200 text-brand-600 active:scale-95'}`}
                                                                disabled={!product.inStock}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* Brand Total Helper */}
                    <div className="bg-brand-50 p-4 rounded-xl text-right">
                        <span className="text-brand-800 font-medium">Current Brand Total: </span>
                        <span className="text-2xl font-bold text-brand-700">
                            ${productsList.reduce((sum, p) => sum + (p.price * (brandCart[p.id] || 0)), 0).toFixed(2)}
                        </span>
                        <div className="text-xs text-brand-600/70 mt-1">
                            (Comm. Estimate: ${(productsList.reduce((sum, p) => sum + (p.price * (brandCart[p.id] || 0)), 0) * 0.02).toFixed(2)})
                        </div>
                    </div>
                </div>
            );
        }

        // Final Step: Review
        if (step === 2 + selectedBrandIds.length) {
            const total = calculateTotal();
            const flatCart = [];
            Object.entries(cart).forEach(([brandId, products]) => {
                const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
                const productsList = brandProductsMap[brandId] || []; // Use dynamic list

                if (brand) {
                    Object.entries(products).forEach(([productId, qty]) => {
                        const product = productsList.find(p => p.id === productId);
                        if (product && qty > 0) flatCart.push({ ...product, qty, brandName: brand.name });
                    });
                }
            });

            return (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-800">Review & Confirm</h2>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Dispensary:</span>
                            <span className="font-bold text-slate-800">{basicInfo.dispensaryName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Payment Terms:</span>
                            <span className="font-bold text-slate-800">{basicInfo.paymentTerms || 'COD'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-bold text-slate-800">{basicInfo.date}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Order Summary</h3>
                        {flatCart.length === 0 ? (
                            <div className="text-slate-400 text-center py-4 bg-white border border-dashed rounded-xl">No items selected</div>
                        ) : (
                            flatCart.map((item, i) => {
                                const caseSize = item.caseSize || 1;
                                const cases = Math.floor(item.qty / caseSize);
                                const remainder = item.qty % caseSize;
                                let qtyString = `${item.qty} Units`;
                                if (cases > 0) {
                                    qtyString += ` (${cases} Case${cases > 1 ? 's' : ''}${remainder > 0 ? ` + ${remainder} Units` : ''})`;
                                }

                                return (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                        <div>
                                            <p className="font-bold text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.brandName}</p>
                                            <p className="text-xs text-brand-600 mt-0.5">{qtyString} @ ${item.price.toFixed(2)}/unit</p>
                                        </div>
                                        <div className="font-bold text-slate-800">
                                            ${(item.qty * item.price).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xl font-bold">
                        <span>Total Amount</span>
                        <span className="text-emerald-600">${total.toFixed(2)}</span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="max-w-xl mx-auto pb-24">
            {/* Header / Steps Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600">Cancel</button>
                    <span className="text-sm font-bold text-slate-500">Step {step + 1} of {steps.length}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-500 transition-all duration-500 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mt-4">{steps[step]}</h1>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between">
                <div>
                    {renderStepContent()}
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-50">
                    {step > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Back
                        </button>
                    )}

                    {step < steps.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <CheckCircle size={20} />
                                    Confirm Sale
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
