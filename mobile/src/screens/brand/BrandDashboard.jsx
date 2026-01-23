import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BrandDashboard() {
    const stats = {
        totalOrders: 47,
        monthlyRevenue: 12450,
        activeDeals: 3,
        upcomingActivations: 8,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.brandName}>🌿 JUSBUD</Text>
                    <Text style={styles.title}>Brand Dashboard</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.primaryCard]}>
                        <Ionicons name="receipt" size={24} color="#8b5cf6" />
                        <Text style={[styles.statValue, { color: 'white' }]}>{stats.totalOrders}</Text>
                        <Text style={[styles.statLabel, { color: '#e5e7eb' }]}>Total Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up" size={24} color="#10b981" />
                        <Text style={styles.statValue}>${(stats.monthlyRevenue / 1000).toFixed(1)}K</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="pricetag" size={24} color="#f59e0b" />
                        <Text style={styles.statValue}>{stats.activeDeals}</Text>
                        <Text style={styles.statLabel}>Active Deals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>{stats.upcomingActivations}</Text>
                        <Text style={styles.statLabel}>Activations</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Recent Orders</Text>
                <View style={styles.ordersList}>
                    {[
                        { dispensary: 'The Green Truth NYC', amount: 850, products: 3, status: 'confirmed' },
                        { dispensary: 'Canna Corner', amount: 620, products: 2, status: 'pending' },
                        { dispensary: 'NYC Wellness', amount: 1200, products: 4, status: 'shipped' },
                    ].map((order, i) => (
                        <View key={i} style={styles.orderItem}>
                            <View>
                                <Text style={styles.orderDispensary}>{order.dispensary}</Text>
                                <Text style={styles.orderMeta}>{order.products} products</Text>
                            </View>
                            <View style={styles.orderRight}>
                                <Text style={styles.orderAmount}>${order.amount}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: order.status === 'pending' ? '#fef3c7' : order.status === 'shipped' ? '#dbeafe' : '#d1fae5' }]}>
                                    <Text style={[styles.statusText, { color: order.status === 'pending' ? '#92400e' : order.status === 'shipped' ? '#1d4ed8' : '#047857' }]}>
                                        {order.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { padding: 20, paddingTop: 10 },
    brandName: { fontSize: 14, color: '#8b5cf6', fontWeight: '600' },
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
    primaryCard: { backgroundColor: '#8b5cf6' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
    ordersList: { marginHorizontal: 20, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    orderDispensary: { fontSize: 15, fontWeight: '600', color: '#111827' },
    orderMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    orderRight: { alignItems: 'flex-end' },
    orderAmount: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 4 },
    statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
});
