import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Minus, X, ArrowRight, Loader, Store, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { addSale, getUserProfile, getLead } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_CATALOG } from '../../data/productCatalog';

export default function DispensaryMarketplace() {
    const { cart, addToCart, removeFromCart, cartTotal, clearCart } = useCart();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState('COD'); // New state for payment terms

    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

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

    const handleConfirmOrder = async () => {
        if (!profile) {
            showNotification('Unable to verify account details. Please refresh.', 'error');
            return;
        }

        // Validate Space Poppers Restriction
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
                productsByBrand[item.brandId][item.id] = {
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                };
            });

            // Prepare Sale Payload
            const salePayload = {
                dispensaryId: profile.dispensaryId || currentUser.uid,
                dispensaryName: profile.dispensaryName || profile.name || 'Unknown Dispensary',
                licenseNumber: profile.licenseNumber || '',
                totalAmount: cartTotal,
                brands: productsByBrand, // Structure compatible with Order processing
                paymentTerms: paymentTerms,
                status: 'Pending Approval',
                orderSource: 'Dispensary Portal',
                commissionEarned: commissionFee,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            // Attribution Logic
            if (profile.dispensaryId) {
                try {
                    const lead = await getLead(profile.dispensaryId);
                    if (lead && lead.repAssigned) {
                        salePayload.representativeName = lead.repAssigned;
                        // Optional Rep Commission calculation
                        salePayload.repCommission = cartTotal * 0.02;
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

    const getQuantity = (id) => {
        const item = cart.find(i => i.id === id);
        return item ? item.quantity : 0;
    };

    return (
        <div className="pb-32 relative animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Marketplace</h1>
                    <p className="text-slate-500 mt-1 font-medium">Browse verified brands and order directly.</p>
                </div>

                {/* Brand Filters */}
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide no-scrollbar">
                    <button
                        onClick={() => setSelectedBrand('All')}
                        className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedBrand === 'All' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                    >
                        All Brands
                    </button>
                    {brands.map(brand => (
                        <button
                            key={brand.id}
                            onClick={() => setSelectedBrand(brand.name)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedBrand === brand.name ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
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
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:border-emerald-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                            <Store className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-slate-700">No products found</h3>
                            <p className="text-slate-400">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProducts.map(product => {
                                const qty = getQuantity(product.id);
                                return (
                                    <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
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
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                                            <p className="text-sm text-slate-400 font-medium mb-4 line-clamp-2" title={product.description}>{product.description}</p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div>
                                                <p className="text-xl font-black text-slate-900">${(product.price * (product.caseSize || 1)).toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">PER CASE ({product.caseSize || 1} units)</p>
                                                <p className="text-[9px] text-slate-300">${product.price.toFixed(2)}/unit</p>
                                            </div>

                                            {qty > 0 ? (
                                                <div className="flex items-center gap-2 bg-slate-900 text-white p-1.5 rounded-xl shadow-lg shadow-slate-200">
                                                    <button onClick={() => removeFromCart(product.id)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Minus size={16} /></button>
                                                    <span className="font-bold text-sm min-w-[20px] text-center">{qty}</span>
                                                    <button onClick={() => addToCart(product)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Plus size={16} /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(product)}
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
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24 overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2"><ShoppingBag size={20} /> Cart</h3>
                            <span className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} items</span>
                        </div>

                        <div className="p-4 max-h-[50vh] overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-slate-300">
                                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Add items to start</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-500">${(item.price * (item.caseSize || 1)).toFixed(2)}/case • {item.brandName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-100">
                                                <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-red-500"><Minus size={14} /></button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="p-1 hover:text-emerald-600"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-slate-500">Subtotal</span>
                                <span className="font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
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
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-slate-900">Confirm Order</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Order Total</span>
                                    <span className="text-3xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-slate-200 w-full" />
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Items Count</span>
                                    <span className="font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-emerald-600">
                                    <span>Status</span>
                                    <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-xs uppercase tracking-wide">Pending Approval</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                                    <span>Platform Fee (Included)</span>
                                    <span>${commissionFee.toFixed(2)} (5%)</span>
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
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Payment Terms</label>
                                <select
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all appearance-none font-medium text-slate-700"
                                >
                                    <option value="COD">COD (Cash on Delivery)</option>
                                    <option value="Net 14">Net 14</option>
                                    <option value="Net 30" disabled={cart.some(i => i.brandId === 'space-poppers')}>
                                        Net 30 {cart.some(i => i.brandId === 'space-poppers') ? '(Not available for Space Poppers)' : ''}
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-slate-500 leading-relaxed text-center px-4">
                                    By confirming, you agree to pay the total amount upon delivery via <strong>{paymentTerms}</strong>.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsCheckoutOpen(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
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
