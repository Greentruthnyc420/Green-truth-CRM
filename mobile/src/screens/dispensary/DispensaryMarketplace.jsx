import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllProducts } from '../../data/productCatalog';
import { calculateApplicableDeals } from '../../services/supabaseService';

export default function DispensaryMarketplace() {
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [appliedDeals, setAppliedDeals] = useState([]);

    const products = useMemo(() => getAllProducts(), []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brandName.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (product) => {
        const existing = cart.find(c => c.id === product.id);
        if (existing) {
            setCart(cart.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        const existing = cart.find(c => c.id === productId);
        if (existing && existing.quantity > 1) {
            setCart(cart.map(c => c.id === productId ? { ...c, quantity: c.quantity - 1 } : c));
        } else {
            setCart(cart.filter(c => c.id !== productId));
        }
    };

    // Calculate deals when cart or payment method changes
    React.useEffect(() => {
        const checkDeals = async () => {
            if (cart.length === 0) {
                setAppliedDeals([]);
                return;
            }

            // Group cart by brand and check deals
            const brandIds = [...new Set(cart.map(c => c.brandId))];
            const allDeals = [];

            for (const brandId of brandIds) {
                const brandItems = cart.filter(c => c.brandId === brandId);
                const deals = await calculateApplicableDeals(brandId, brandItems, paymentMethod);
                allDeals.push(...deals);
            }

            setAppliedDeals(allDeals);
        };

        checkDeals();
    }, [cart, paymentMethod]);

    const subtotal = cart.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);
    const discountAmount = appliedDeals.reduce((sum, deal) => {
        const brandItems = cart.filter(c => c.brandId === deal.brand_id);
        const brandSubtotal = brandItems.reduce((s, i) => s + i.wholesalePrice * i.quantity, 0);
        return sum + (brandSubtotal * deal.appliedDiscount / 100);
    }, 0);
    const total = subtotal - discountAmount;
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Marketplace</Text>
                <TouchableOpacity style={styles.cartBtn}>
                    <Ionicons name="cart" size={24} color="#3b82f6" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products or brands..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Payment Method Toggle */}
            <View style={styles.paymentToggle}>
                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentActive]}
                    onPress={() => setPaymentMethod('cod')}
                >
                    <Ionicons name="cash" size={16} color={paymentMethod === 'cod' ? 'white' : '#6b7280'} />
                    <Text style={[styles.paymentText, paymentMethod === 'cod' && styles.paymentTextActive]}>COD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'invoice' && styles.paymentActive]}
                    onPress={() => setPaymentMethod('invoice')}
                >
                    <Ionicons name="document-text" size={16} color={paymentMethod === 'invoice' ? 'white' : '#6b7280'} />
                    <Text style={[styles.paymentText, paymentMethod === 'invoice' && styles.paymentTextActive]}>Invoice</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.productsScroll}>
                <View style={styles.productsGrid}>
                    {filteredProducts.map((product) => {
                        const inCart = cart.find(c => c.id === product.id);
                        return (
                            <View key={product.id} style={styles.productCard}>
                                <View style={styles.productImage}>
                                    <Ionicons name="leaf" size={32} color="#10b981" />
                                </View>
                                <Text style={styles.productBrand}>{product.brandName}</Text>
                                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.wholesalePrice}>${product.wholesalePrice}</Text>
                                    <Text style={styles.retailPrice}>${product.retailPrice}</Text>
                                </View>
                                <Text style={styles.caseSize}>Case: {product.caseSize} units</Text>

                                {inCart ? (
                                    <View style={styles.quantityControl}>
                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(product.id)}>
                                            <Ionicons name="remove" size={16} color="#3b82f6" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{inCart.quantity}</Text>
                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(product)}>
                                            <Ionicons name="add" size={16} color="#3b82f6" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(product)}>
                                        <Ionicons name="add" size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {cart.length > 0 && (
                <View style={styles.cartFooter}>
                    <View>
                        <View style={styles.totalRow}>
                            <Text style={styles.cartTotal}>${total.toFixed(2)}</Text>
                            {discountAmount > 0 && (
                                <View style={styles.savingsBadge}>
                                    <Text style={styles.savingsText}>-${discountAmount.toFixed(2)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.cartItems}>{cartCount} items</Text>
                        {appliedDeals.length > 0 && (
                            <Text style={styles.dealApplied}>
                                {appliedDeals[0].appliedTier?.minCases}-{appliedDeals[0].appliedTier?.maxCases || '∞'} cases: {appliedDeals[0].appliedDiscount}% off
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn}>
                        <Text style={styles.checkoutText}>Checkout</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    cartBtn: { position: 'relative', padding: 8 },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15, color: '#111827' },
    paymentToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, gap: 8 },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        gap: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    paymentActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    paymentText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    paymentTextActive: { color: 'white' },
    productsScroll: { flex: 1 },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 10, paddingBottom: 100 },
    productCard: {
        width: '47%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    productImage: {
        height: 80,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    productBrand: { fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
    productName: { fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 2, height: 36 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    wholesalePrice: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
    retailPrice: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
    caseSize: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
    addBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#3b82f6',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityControl: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 16,
        paddingHorizontal: 4,
    },
    qtyBtn: { padding: 6 },
    qtyText: { fontSize: 14, fontWeight: '600', color: '#3b82f6', minWidth: 20, textAlign: 'center' },
    cartFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cartTotal: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    savingsBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    savingsText: { fontSize: 12, fontWeight: '600', color: '#047857' },
    cartItems: { fontSize: 12, color: '#6b7280' },
    dealApplied: { fontSize: 11, color: '#10b981', fontWeight: '500', marginTop: 2 },
    checkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    checkoutText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
