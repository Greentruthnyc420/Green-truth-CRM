import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Plus, Minus, X, ArrowRight, Loader, CheckCircle2 } from 'lucide-react';
import { PRODUCT_CATALOG } from '../../data/productCatalog';
import { useAuth } from '../../contexts/AuthContext';
import { addSale, getUserProfile, getLead } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { sendAdminNotification, createOrderEmail } from '../../services/adminNotifications';

export default function DispensaryOrder() {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState(null);

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

    const handlePlaceOrder = async () => {
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
                licenseNumber: profile.licenseNumber,
                totalAmount: cartTotal,
                brands: productsByBrand,
                paymentTerms: 'COD', // Default for self-service
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
        <div className="pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Place Order</h1>
                    <p className="text-slate-500 mt-1 font-medium">Select products from our full catalog.</p>
                </div>
                <div className="hidden md:flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-100'
                                }`}
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search products or brands..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:border-emerald-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{product.brandName}</span>
                                        <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{product.unit || 'Unit'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24 overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <h3 className="font-bold">Your Cart</h3>
                            <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">{cart.length}</div>
                        </div>

                        <div className="p-4 max-h-[40vh] overflow-y-auto min-h-[200px]">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-slate-300">
                                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">${item.price} x {item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 opacity-100">
                                                <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-red-500"><Minus size={14} /></button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="p-1 hover:text-emerald-600"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500 uppercase">Subtotal</span>
                                <span className="text-xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
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
    );
}
