import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DispensaryDashboard() {
    const stats = {
        pendingOrders: 2,
        totalSpend: 24500,
        savedThisMonth: 450,
        favoriteBrands: 5,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.storeName}>🏪 The Green Truth NYC</Text>
                    <Text style={styles.title}>Dashboard</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.primaryCard]}>
                        <Ionicons name="time" size={24} color="#fbbf24" />
                        <Text style={styles.statValueLight}>{stats.pendingOrders}</Text>
                        <Text style={styles.statLabelLight}>Pending Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="wallet" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>${(stats.totalSpend / 1000).toFixed(1)}K</Text>
                        <Text style={styles.statLabel}>Total Spend</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="cash" size={24} color="#10b981" />
                        <Text style={styles.statValue}>${stats.savedThisMonth}</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="heart" size={24} color="#ec4899" />
                        <Text style={styles.statValue}>{stats.favoriteBrands}</Text>
                        <Text style={styles.statLabel}>Favorite Brands</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Quick Order</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandsScroll}>
                    {['JUSBUD', 'Silly Nice', 'Helios', 'Canna', 'Greencraft'].map((brand, i) => (
                        <TouchableOpacity key={i} style={styles.brandChip}>
                            <Text style={styles.brandChipText}>{brand}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Recent Orders</Text>
                <View style={styles.ordersList}>
                    {[
                        { brand: 'JUSBUD', items: 3, amount: 850, status: 'Shipped' },
                        { brand: 'Silly Nice', items: 2, amount: 420, status: 'Delivered' },
                        { brand: 'Helios', items: 5, amount: 1200, status: 'Processing' },
                    ].map((order, i) => (
                        <TouchableOpacity key={i} style={styles.orderItem}>
                            <View style={styles.orderLeft}>
                                <Text style={styles.orderBrand}>{order.brand}</Text>
                                <Text style={styles.orderMeta}>{order.items} items</Text>
                            </View>
                            <View style={styles.orderRight}>
                                <Text style={styles.orderAmount}>${order.amount}</Text>
                                <Text style={styles.orderStatus}>{order.status}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { padding: 20, paddingTop: 10 },
    storeName: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginTop: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
    statCard: {
        width: '47%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    primaryCard: { backgroundColor: '#3b82f6' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 8 },
    statValueLight: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    statLabelLight: { fontSize: 12, color: '#e5e7eb', marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
    brandsScroll: { paddingLeft: 20 },
    brandChip: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    brandChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
    ordersList: { marginHorizontal: 20, backgroundColor: 'white', borderRadius: 16, marginBottom: 20 },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    orderLeft: { flex: 1 },
    orderBrand: { fontSize: 15, fontWeight: '600', color: '#111827' },
    orderMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    orderRight: { alignItems: 'flex-end', marginRight: 8 },
    orderAmount: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    orderStatus: { fontSize: 11, color: '#3b82f6', marginTop: 2 },
});
