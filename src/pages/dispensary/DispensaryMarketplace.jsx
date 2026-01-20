import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingBag, Search, Plus, Minus, X, ArrowRight, Loader, Store, CheckCircle2, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { addSale, getUserProfile, getLead } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { calculateApplicableDeals } from '../../services/dealService';

export default function DispensaryMarketplace() {
    const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState('COD'); // New state for payment terms
    const [editingQuantity, setEditingQuantity] = useState({}); // Track values while user is editing
    const [dealCalculation, setDealCalculation] = useState(null); // Store calculated deals
    const [calculatingDeals, setCalculatingDeals] = useState(false);

    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // Track selected order type (unit or case) for each product card
    const [productSelection, setProductSelection] = useState({});

    const getSelectedType = (productId) => productSelection[productId] || 'case';
    const toggleOrderType = (productId) => {
        setProductSelection(prev => ({
            ...prev,
            [productId]: prev[productId] === 'unit' ? 'case' : 'unit'
        }));
    };

    // Load User Profile for Attribution
    useEffect(() => {
        async function loadProfile() {
            if (currentUser) {
                try {
                    const p = await getUserProfile(currentUser.uid);
                    setProfile(p);
                } catch (err) {
                    console.error("Failed to load profile", err);
                }
            }
        }
        loadProfile();
    }, [currentUser]);

    // Flatten Catalog
    const allProducts = useMemo(() => {
        return PRODUCT_CATALOG.flatMap(brand =>
            brand.products.map(product => ({
                ...product,
                brandName: brand.name,
                brandId: brand.id,
                brandLogo: brand.logo
            }))
        );
    }, []);

    // Extract Brands for Filter
    const brands = useMemo(() => {
        return PRODUCT_CATALOG.map(b => ({ id: b.id, name: b.name }));
    }, []);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.brandName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBrand = selectedBrand === 'All' || p.brandName === selectedBrand;
            return matchesSearch && matchesBrand;
        });
    }, [allProducts, searchTerm, selectedBrand]);

    const commissionFee = cartTotal * 0.05; // 5% Commission for GreenTruth

    // Calculate applicable deals when checkout opens or payment method changes
    useEffect(() => {
        async function calculateDeals() {
            if (!isCheckoutOpen || cart.length === 0) {
                setDealCalculation(null);
                return;
            }

            setCalculatingDeals(true);
            try {
                // Prepare cart items for deal calculation
                const cartItemsForDeals = cart.map(item => ({
                    productId: item.id,
                    brandId: item.brandId,
                    quantity: item.quantity,
                    price: item.orderType === 'case' ? item.price * (item.caseSize || 1) : item.price,
                    caseSize: item.caseSize || 1,
                    category: item.category
                }));

                // Map payment terms to deal service format
                const paymentMethodMap = { 'COD': 'cod', 'Net 14': 'invoice', 'Net 30': 'invoice' };
                const paymentMethod = paymentMethodMap[paymentTerms] || 'invoice';

                const result = await calculateApplicableDeals(cartItemsForDeals, paymentMethod);
                setDealCalculation(result);
            } catch (error) {
                console.error('Error calculating deals:', error);
                setDealCalculation(null);
            } finally {
                setCalculatingDeals(false);
            }
        }

        calculateDeals();
    }, [isCheckoutOpen, cart, paymentTerms]);

    // Calculate final totals with discounts
    const discount = dealCalculation?.totalDiscount || 0;
    const finalTotal = dealCalculation?.finalTotal || cartTotal;
    const appliedDeals = dealCalculation?.appliedDeals || [];


    const handleConfirmOrder = async () => {
        if (!profile) {
            showNotification('Unable to verify account details. Please refresh.', 'error');
            return;
        }

        // Minimum Order Validation
        const brandTotals = {};
        const brandCases = {};

        cart.forEach(item => {
            const brandId = item.brandId;
            const itemPrice = item.orderType === 'case'
                ? item.price * (item.caseSize || 1)
                : item.price;

            // Track total amount per brand
            if (!brandTotals[brandId]) brandTotals[brandId] = 0;
            brandTotals[brandId] += itemPrice * item.quantity;

            // Track total cases per brand (for Space Poppers)
            if (item.orderType === 'case') {
                if (!brandCases[brandId]) brandCases[brandId] = 0;
                brandCases[brandId] += item.quantity;
            }
        });

        // Check minimums for each brand in the cart
        const failedMinimums = [];
        for (const item of cart) {
            const brand = PRODUCT_CATALOG.find(b => b.id === item.brandId);
            if (!brand?.minimumOrder) continue;

            // Skip if we've already checked this brand
            if (failedMinimums.some(f => f.brandId === item.brandId)) continue;

            const minimum = brand.minimumOrder;

            if (minimum.type === 'cases') {
                // Case-based minimum (Space Poppers)
                const totalCases = brandCases[item.brandId] || 0;
                if (totalCases < minimum.value) {
                    failedMinimums.push({
                        brandId: item.brandId,
                        brandName: brand.name,
                        type: 'cases',
                        required: minimum.value,
                        current: totalCases
                    });
                }
            } else if (minimum.type === 'amount') {
                // Amount-based minimum ($1,000)
                const totalAmount = brandTotals[item.brandId] || 0;
                if (totalAmount < minimum.value) {
                    failedMinimums.push({
                        brandId: item.brandId,
                        brandName: brand.name,
                        type: 'amount',
                        required: minimum.value,
                        current: totalAmount
                    });
                }
            }
        }

        if (failedMinimums.length > 0) {
            // Build error message
            const messages = failedMinimums.map(f => {
                if (f.type === 'cases') {
                    return `${f.brandName}: Requires ${f.required} cases minimum (you have ${f.current})`;
                } else {
                    return `${f.brandName}: Requires $${f.required.toLocaleString()} minimum (you have $${f.current.toFixed(2)})`;
                }
            });
            showNotification(`Order does not meet minimum requirements:\n${messages.join('\n')}`, 'error');
            return;
        }

        // Validate Space Poppers Restriction (payment terms)
        const hasSpacePoppers = cart.some(item => item.brandId === 'space-poppers');
        if (hasSpacePoppers && paymentTerms === 'Net 30') {
            showNotification('Space Poppers products are restricted to COD or Net 14.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const productsByBrand = {};
            cart.forEach(item => {
                if (!productsByBrand[item.brandId]) {
                    productsByBrand[item.brandId] = {};
                }
                const itemPrice = item.orderType === 'case'
                    ? item.price * (item.caseSize || 1)
                    : item.price;
                productsByBrand[item.brandId][item.cartItemId] = {
                    name: item.name,
                    quantity: item.quantity,
                    price: itemPrice,
                    orderType: item.orderType,
                    total: itemPrice * item.quantity
                };
            });

            // Prepare Sale Payload with discounts applied
            const salePayload = {
                dispensaryId: profile.dispensaryId || currentUser.uid,
                dispensaryName: profile.dispensaryName || profile.name || 'Unknown Dispensary',
                dispensaryAddress: profile.address || '',
                licenseNumber: profile.licenseNumber || '',
                subtotal: cartTotal,
                discountAmount: discount,
                totalAmount: finalTotal,
                appliedDeals: appliedDeals.map(d => ({ name: d.name, type: d.type, discountValue: d.discountValue, discountAmount: d.discountAmount })),
                brands: productsByBrand, // Structure compatible with Order processing
                paymentTerms: paymentTerms,
                status: 'Pending Approval',
                orderSource: 'Dispensary Portal',
                commissionEarned: finalTotal * 0.05,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            // Attribution Logic
            if (profile.dispensaryId) {
                try {
                    const lead = await getLead(profile.dispensaryId);
                    if (lead && lead.repAssigned) {
                        salePayload.representativeName = lead.repAssigned;
                        // Optional Rep Commission calculation (on discounted total)
                        salePayload.repCommission = finalTotal * 0.02;
                    }
                } catch (err) {
                    console.warn("Failed to fetch lead for attribution", err);
                }
            }

            await addSale(salePayload);

            showNotification('Order placed successfully! Pending confirmation.', 'success');
            clearCart();
            setIsCheckoutOpen(false);
            // Optionally navigate to dashboard or order history
            navigate('/dispensary');
        } catch (error) {
            console.error(error);
            showNotification('Failed to place order. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getQuantity = (productId, type) => {
        const item = cart.find(i => i.id === productId && i.orderType === type);
        return item ? item.quantity : 0;
    };

    return (
        <div className="pb-32 relative animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Marketplace</h1>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Browse verified brands and order directly.</p>
                </div>

                {/* Brand Filters */}
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide no-scrollbar">
                    <button
                        onClick={() => setSelectedBrand('All')}
                        className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedBrand === 'All' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                        style={selectedBrand !== 'All' ? { background: 'var(--bg-card)' } : {}}
                    >
                        All Brands
                    </button>
                    {brands.map(brand => (
                        <button
                            key={brand.id}
                            onClick={() => setSelectedBrand(brand.name)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedBrand === brand.name ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                            style={selectedBrand !== brand.name ? { background: 'var(--bg-card)' } : {}}
                        >
                            {brand.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search products or brands..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border shadow-sm focus:border-emerald-500 outline-none transition-all"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 rounded-[2rem] border border-dashed" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <Store className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} size={48} />
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>No products found</h3>
                            <p style={{ color: 'var(--text-tertiary)' }}>Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProducts.map(product => {
                                const selectedType = getSelectedType(product.id);
                                const qty = getQuantity(product.id, selectedType);
                                const casePrice = product.price * (product.caseSize || 1);
                                const displayPrice = selectedType === 'case' ? casePrice : product.price;

                                return (
                                    <div key={product.id} className="p-5 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                                        <div>
                                            {product.imageUrl && (
                                                <div className="w-full h-40 mb-4 rounded-xl overflow-hidden bg-slate-50 border border-slate-50">
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">{product.brandName}</span>
                                                {product.thc && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{product.thc}</span>}
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-emerald-700 transition-colors" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                                            <p className="text-sm font-medium mb-4 line-clamp-2" style={{ color: 'var(--text-tertiary)' }} title={product.description}>{product.description}</p>

                                            {/* Order Type Toggle */}
                                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                                                <button
                                                    onClick={() => setProductSelection(prev => ({ ...prev, [product.id]: 'case' }))}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedType === 'case' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Case
                                                </button>
                                                <button
                                                    onClick={() => setProductSelection(prev => ({ ...prev, [product.id]: 'unit' }))}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${selectedType === 'unit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Unit
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div>
                                                <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>${displayPrice.toFixed(2)}</p>
                                                <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                                                    PER {selectedType === 'case' ? `CASE (${product.caseSize || 1} units)` : 'UNIT'}
                                                </p>
                                                {selectedType === 'case' && (
                                                    <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>${product.price.toFixed(2)}/unit</p>
                                                )}
                                            </div>

                                            {qty > 0 ? (
                                                <div className="flex items-center gap-2 bg-slate-900 text-white p-1.5 rounded-xl shadow-lg shadow-slate-200">
                                                    <button onClick={() => removeFromCart(`${product.id}-${selectedType}`)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Minus size={16} /></button>
                                                    <span className="font-bold text-sm min-w-[20px] text-center">{qty}</span>
                                                    <button onClick={() => addToCart(product, selectedType)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Plus size={16} /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(product, selectedType)}
                                                    className="bg-slate-100 text-slate-900 p-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart Sidebar (Desktop Sticky) */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="rounded-[2rem] border shadow-xl shadow-slate-200/50 sticky top-24 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2"><ShoppingBag size={20} /> Cart</h3>
                            <span className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} items</span>
                        </div>

                        <div className="p-4 max-h-[50vh] overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Add items to start</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => {
                                        const itemPrice = item.orderType === 'case'
                                            ? item.price * (item.caseSize || 1)
                                            : item.price;
                                        return (
                                            <div key={item.cartItemId} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                                        ${itemPrice.toFixed(2)}/{item.orderType} • {item.brandName}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-100">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity > 1) {
                                                                updateQuantity(item.cartItemId, item.quantity - 1);
                                                            } else {
                                                                removeFromCart(item.cartItemId);
                                                            }
                                                        }}
                                                        className="p-1 hover:text-red-500"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={editingQuantity[item.cartItemId] !== undefined ? editingQuantity[item.cartItemId] : item.quantity}
                                                        onFocus={() => {
                                                            // Start editing with current value
                                                            setEditingQuantity(prev => ({ ...prev, [item.cartItemId]: String(item.quantity) }));
                                                        }}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            // Allow empty string or numbers only while typing
                                                            if (value === '' || /^\d+$/.test(value)) {
                                                                setEditingQuantity(prev => ({ ...prev, [item.cartItemId]: value }));
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            const value = e.target.value;
                                                            const numValue = parseInt(value, 10);
                                                            // Clear editing state
                                                            setEditingQuantity(prev => {
                                                                const newState = { ...prev };
                                                                delete newState[item.cartItemId];
                                                                return newState;
                                                            });
                                                            // Update cart with valid value or default to 1
                                                            if (value === '' || isNaN(numValue) || numValue < 1) {
                                                                updateQuantity(item.cartItemId, 1);
                                                            } else {
                                                                updateQuantity(item.cartItemId, numValue);
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.target.blur();
                                                            }
                                                        }}
                                                        className="text-xs font-bold w-8 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
                                                    />
                                                    <button onClick={() => addToCart(item, item.orderType)} className="p-1 hover:text-emerald-600"><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-3" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${cartTotal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={() => setIsCheckoutOpen(true)}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Checkout <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ background: 'var(--bg-card)' }}>
                        <div className="p-8 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Confirm Order</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-6 rounded-3xl space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                {/* Subtotal */}
                                <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Subtotal</span>
                                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                                </div>

                                {/* Applied Deals */}
                                {calculatingDeals ? (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                                        <Loader size={14} className="animate-spin" />
                                        <span>Calculating deals...</span>
                                    </div>
                                ) : appliedDeals.length > 0 && (
                                    <div className="space-y-2">
                                        {appliedDeals.map((deal, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm text-emerald-600">
                                                <span className="flex items-center gap-1">
                                                    <Tag size={14} />
                                                    {deal.name} ({deal.discountValue}% off)
                                                </span>
                                                <span className="font-bold">-${deal.discountAmount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="h-px w-full" style={{ background: 'var(--border-primary)' }} />

                                {/* Final Order Total */}
                                <div className="flex justify-between items-center">
                                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Order Total</span>
                                    <div className="text-right">
                                        {discount > 0 && (
                                            <span className="text-sm line-through mr-2" style={{ color: 'var(--text-tertiary)' }}>
                                                ${cartTotal.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-3xl font-black" style={{ color: discount > 0 ? '#059669' : 'var(--text-primary)' }}>
                                            ${finalTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {discount > 0 && (
                                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-2 rounded-xl text-center">
                                        🎉 You're saving ${discount.toFixed(2)} with this order!
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Items Count</span>
                                    <span className="font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-emerald-600">
                                    <span>Status</span>
                                    <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-xs uppercase tracking-wide">Pending Approval</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                    <span>Platform Fee (Included)</span>
                                    <span>${(finalTotal * 0.05).toFixed(2)} (5%)</span>
                                </div>
                            </div>

                            {/* Important Notices */}
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 text-sm">
                                <p className="font-bold mb-1">Standard Terms Apply</p>
                                <p className="opacity-80 leading-snug">
                                    All self-service orders are subject to a standard 5% platform commission fee, included in the total.
                                </p>
                            </div>

                            {/* Payment Terms Selection */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Select Payment Terms</label>
                                <select
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    className="w-full p-4 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all appearance-none font-medium"
                                    style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="COD">COD (Cash on Delivery)</option>
                                    <option value="Net 14">Net 14</option>
                                    <option value="Net 30" disabled={cart.some(i => i.brandId === 'space-poppers')}>
                                        Net 30 {cart.some(i => i.brandId === 'space-poppers') ? '(Not available for Space Poppers)' : ''}
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm leading-relaxed text-center px-4" style={{ color: 'var(--text-secondary)' }}>
                                    By confirming, you agree to pay the total amount upon delivery via <strong>{paymentTerms}</strong>.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsCheckoutOpen(false)}
                                    className="flex-1 py-4 font-bold rounded-2xl transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={submitting}
                                    className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader className="animate-spin" /> : <>Confirm Order <CheckCircle2 size={20} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
