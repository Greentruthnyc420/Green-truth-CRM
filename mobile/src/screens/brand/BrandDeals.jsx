import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDealRules } from '../../services/supabaseService';

export default function BrandDeals() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const brandId = 'jusbud'; // TODO: Get from auth context

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        setLoading(true);
        try {
            const rules = await getDealRules(brandId);
            setDeals(rules);
        } catch (error) {
            console.error('Error loading deals:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Loading deals...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Deals</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {deals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetag-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>No active deals</Text>
                        <Text style={styles.emptySubtext}>Create your first deal to attract more orders</Text>
                    </View>
                ) : (
                    deals.map((deal) => (
                        <View key={deal.id} style={styles.dealCard}>
                            <View style={styles.dealHeader}>
                                <View style={styles.dealInfo}>
                                    <Text style={styles.dealName}>{deal.name}</Text>
                                    <View style={[styles.typeBadge, { backgroundColor: deal.rule_type?.includes('cod') ? '#ede9fe' : '#dbeafe' }]}>
                                        <Text style={[styles.typeBadgeText, { color: deal.rule_type?.includes('cod') ? '#7c3aed' : '#2563eb' }]}>
                                            {(deal.rule_type || '').replace(/_/g, ' ')}
                                        </Text>
                                    </View>
                                </View>
                                <Switch value={deal.is_active} trackColor={{ false: '#d1d5db', true: '#10b981' }} />
                            </View>

                            {deal.tiers ? (
                                <View style={styles.tiersContainer}>
                                    <Text style={styles.tiersTitle}>Tiered Discounts</Text>
                                    {deal.tiers.map((tier, i) => (
                                        <View key={i} style={styles.tierRow}>
                                            <View style={styles.tierInfo}>
                                                <Ionicons name="cube-outline" size={16} color="#6b7280" />
                                                <Text style={styles.tierRange}>
                                                    {tier.minCases}-{tier.maxCases || '∞'} cases
                                                </Text>
                                            </View>
                                            <View style={styles.discountBadge}>
                                                <Text style={styles.tierDiscount}>{tier.discountPercent}% off</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.simpleDiscount}>
                                    <Ionicons name="pricetag" size={16} color="#10b981" />
                                    <Text style={styles.discountText}>{deal.discount_value}% discount</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    addBtn: { backgroundColor: '#8b5cf6', padding: 10, borderRadius: 12 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
    dealCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    dealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dealInfo: { flex: 1 },
    dealName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6 },
    typeBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    tiersContainer: { marginTop: 16, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
    tiersTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tierInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tierRange: { fontSize: 14, color: '#374151' },
    discountBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tierDiscount: { fontSize: 13, fontWeight: '600', color: '#047857' },
    simpleDiscount: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    discountText: { fontSize: 14, fontWeight: '600', color: '#10b981' },
});
