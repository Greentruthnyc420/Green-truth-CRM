import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Plus, Minus, X, ArrowRight, Loader, CheckCircle2, Tag, CreditCard, Banknote, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { useAuth } from '../../contexts/AuthContext';
import { addSale, getUserProfile, getLead, updateUserProfile, updateLead } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { sendAdminNotification, createOrderEmail } from '../../services/adminNotifications';
import { calculateApplicableDeals } from '../../services/dealService';
import { motion, AnimatePresence } from 'framer-motion';

export default function DispensaryOrder() {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('invoice');
    const [dealInfo, setDealInfo] = useState({ appliedDeals: [], totalDiscount: 0, finalTotal: 0 });

    // License verification modal state
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [licenseInput, setLicenseInput] = useState('');
    const [licenseType, setLicenseType] = useState('OCM');
    const [savingLicense, setSavingLicense] = useState(false);

    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            if (currentUser) {
                const p = await getUserProfile(currentUser.uid);
                setProfile(p);
            }
        }
        load();
    }, [currentUser]);

    const allProducts = PRODUCT_CATALOG.flatMap(brand =>
        brand.products.map(p => ({ ...p, brandName: brand.name, brandId: brand.id }))
    );

    const filteredProducts = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brandName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === productId);
            if (existing.quantity === 1) {
                return prev.filter(item => item.id !== productId);
            }
            return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate applicable deals when cart or payment method changes
    useEffect(() => {
        async function calcDeals() {
            if (cart.length === 0) {
                setDealInfo({ appliedDeals: [], totalDiscount: 0, originalTotal: 0, finalTotal: 0 });
                return;
            }
            const cartItems = cart.map(item => ({
                productId: item.id,
                brandId: item.brandId,
                quantity: item.quantity,
                price: item.price,
                category: item.category,
                caseSize: item.caseSize || 1 // Include caseSize for tiered discount calculation
            }));
            const result = await calculateApplicableDeals(cartItems, paymentMethod);
            setDealInfo(result);
        }
        calcDeals();
    }, [cart, paymentMethod]);

    // Check if license is missing or pending
    const needsLicense = () => {
        const license = profile?.licenseNumber;
        // No license at all, or marked as pending/provisional
        return !license ||
            license === '' ||
            license.toLowerCase().includes('pending') ||
            license.toLowerCase().includes('provisional') ||
            profile?.licensePending === true;
    };

    // Save the license and update profile/lead
    const handleSaveLicense = async () => {
        if (!licenseInput.trim()) {
            showNotification('Please enter your license number', 'error');
            return;
        }

        setSavingLicense(true);
        try {
            const fullLicense = `${licenseType}-${licenseInput.trim().toUpperCase()}`;

            // Update user profile
            await updateUserProfile(currentUser.uid, {
                licenseNumber: fullLicense,
                licensePending: false,
                licenseType: licenseType
            });

            // If there's a linked lead/dispensary, update that too
            if (profile?.dispensaryId || profile?.leadId) {
                const leadId = profile.dispensaryId || profile.leadId;
                await updateLead(leadId, {
                    licenseNumber: fullLicense,
                    license_number: fullLicense // DB column name
                });
            }

            // Update local profile state
            setProfile(prev => ({
                ...prev,
                licenseNumber: fullLicense,
                licensePending: false
            }));

            setShowLicenseModal(false);
            showNotification('License saved successfully!', 'success');

            // Now proceed with order
            await processOrder(fullLicense);
        } catch (error) {
            console.error('Failed to save license:', error);
            showNotification('Failed to save license. Please try again.', 'error');
        } finally {
            setSavingLicense(false);
        }
    };

    const handlePlaceOrder = async () => {
        // Check if license is required before placing order
        if (needsLicense()) {
            setShowLicenseModal(true);
            return;
        }

        await processOrder(profile.licenseNumber);
    };

    const processOrder = async (licenseNumber) => {
        setSubmitting(true);
        try {
            // Map cart to the format expected by addSale
            // addSale usually expects brands: { brandId: { productId: { quantity, ... } } }
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

            const salePayload = {
                dispensaryId: profile.dispensaryId,
                dispensaryName: profile.dispensaryName,
                licenseNumber: licenseNumber, // Use passed license (either existing or newly entered)
                totalAmount: dealInfo.finalTotal || cartTotal,
                subtotal: cartTotal,
                discount: dealInfo.totalDiscount || 0,
                appliedDeals: dealInfo.appliedDeals || [],
                brands: productsByBrand,
                paymentTerms: paymentMethod === 'cod' ? 'COD' : 'Invoice',
                status: 'pending',
                orderSource: 'Dispensary Portal',
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            // Attribution logic: Lookup the assigned rep from the Lead/Account doc
            if (profile.dispensaryId) {
                const lead = await getLead(profile.dispensaryId);
                if (lead && lead.repAssigned) {
                    salePayload.representativeName = lead.repAssigned;
                    // Note: If we had a repId field in leads, we'd use it here too.
                    // For now, names are used for brand coordination.
                }
            }

            await addSale(salePayload);

            // Send admin notification
            try {
                // Formatting product list for email
                const productSummary = cart.map(item => `${item.name} (${item.quantity} units)`).join(', ');

                // Since an order can contain multiple brands, we'll list the main brand or "Multi-Brand"
                const brandNames = [...new Set(cart.map(item => item.brandName))].join(', ');

                const { html, text } = createOrderEmail({
                    dispensaryName: profile.dispensaryName,
                    brandName: brandNames,
                    products: productSummary,
                    total: cartTotal,
                    orderDate: new Date().toLocaleDateString()
                });

                await sendAdminNotification({
                    subject: `🛒 New Order: ${profile.dispensaryName} ($${cartTotal.toFixed(2)})`,
                    html,
                    text
                });
            } catch (emailErr) {
                console.warn("Order email notification failed:", emailErr);
            }

            showNotification('Order placed successfully!', 'success');
            setCart([]);
            navigate('/dispensary');
        } catch (error) {
            showNotification('Failed to place order.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const categories = ['All', ...new Set(allProducts.map(p => p.category))];

    return (
        <>
            <div className="pb-32">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Place Order</h1>
                        <p className="mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Select products from our full catalog.</p>
                    </div>
                    <div className="hidden md:flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white' : ''}`}
                                style={selectedCategory !== cat ? { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' } : {}}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Catalog Section */}
                    <div className="flex-1 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-emerald-600" style={{ color: 'var(--text-tertiary)' }} size={20} />
                            <input
                                type="text"
                                placeholder="Search products or brands..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl shadow-sm focus:border-emerald-500 outline-none transition-all"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{product.brandName}</span>
                                            <h3 className="font-bold group-hover:text-emerald-700 transition-colors" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{product.unit || 'Unit'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="w-full py-3 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                    >
                                        <Plus size={18} /> Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="rounded-[2rem] shadow-xl sticky top-24 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                                <h3 className="font-bold">Your Cart</h3>
                                <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">{cart.length}</div>
                            </div>

                            <div className="p-4 max-h-[40vh] overflow-y-auto min-h-[200px]">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                                        <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-medium">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>${item.price} x {item.quantity}</p>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-lg p-1 opacity-100" style={{ background: 'var(--bg-secondary)' }}>
                                                    <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-red-500"><Minus size={14} /></button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => addToCart(item)} className="p-1 hover:text-emerald-600"><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-4" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                                {/* Payment Method Selector */}
                                <div>
                                    <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Payment Method</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPaymentMethod('invoice')}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'invoice' ? 'bg-emerald-600 text-white' : ''}`}
                                            style={paymentMethod !== 'invoice' ? { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' } : {}}
                                        >
                                            <CreditCard size={16} /> Invoice
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('cod')}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'cod' ? 'bg-emerald-600 text-white' : ''}`}
                                            style={paymentMethod !== 'cod' ? { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' } : {}}
                                        >
                                            <Banknote size={16} /> COD
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${cartTotal.toFixed(2)}</span>
                                </div>

                                {/* Applied Deals */}
                                {dealInfo.appliedDeals.length > 0 && (
                                    <div className="space-y-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                                        {dealInfo.appliedDeals.map((deal, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                                    <Tag size={14} />
                                                    <span>
                                                        {deal.name}
                                                        {deal._tierApplied && (
                                                            <span className="ml-1 text-xs opacity-75">
                                                                ({deal._tierApplied.minCases}-{deal._tierApplied.maxCases || '+'} cases)
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="font-bold text-emerald-600">-${deal.discountAmount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Discount Line */}
                                {dealInfo.totalDiscount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-emerald-600">Total Savings</span>
                                        <span className="font-bold text-emerald-600">-${dealInfo.totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Final Total */}
                                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    <span className="text-sm font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Total</span>
                                    <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                                        ${(dealInfo.finalTotal || cartTotal).toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={cart.length === 0 || submitting}
                                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                                >
                                    {submitting ? <Loader className="animate-spin" /> : <>Complete Order <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* License Verification Modal */}
            <AnimatePresence>
                {showLicenseModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLicenseModal(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">License Required</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        To place an order, we need your NY cannabis retail license number. This will appear on your invoice.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">License Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['OCM', 'CAURD', 'RETL'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setLicenseType(type)}
                                                className={`py-2 rounded-xl text-sm font-bold transition-all ${licenseType === type
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">License Number</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="e.g. AUCP-2023-000001"
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 font-mono uppercase focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                            value={licenseInput}
                                            onChange={(e) => setLicenseInput(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Enter the number portion only. Prefix will be added automatically.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t flex gap-3">
                                <button
                                    onClick={() => setShowLicenseModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveLicense}
                                    disabled={savingLicense || !licenseInput.trim()}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingLicense ? <Loader className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Save & Order</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
