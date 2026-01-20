import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DispensaryOrders() {
    const orders = [
        { id: 'ORD-2024', brand: 'JUSBUD', items: 3, amount: 850, date: 'Jan 18', status: 'shipped', eta: 'Jan 20' },
        { id: 'ORD-2023', brand: 'Silly Nice', items: 2, amount: 420, date: 'Jan 15', status: 'delivered', eta: null },
        { id: 'ORD-2022', brand: 'Helios', items: 5, amount: 1200, date: 'Jan 12', status: 'delivered', eta: null },
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'processing': return { icon: 'time', color: '#f59e0b' };
            case 'shipped': return { icon: 'airplane', color: '#3b82f6' };
            case 'delivered': return { icon: 'checkmark-circle', color: '#10b981' };
            default: return { icon: 'ellipse', color: '#9ca3af' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
            </View>

            <View style={styles.tabs}>
                {['All', 'Active', 'Completed'].map((tab, i) => (
                    <TouchableOpacity key={i} style={[styles.tab, i === 0 && styles.activeTab]}>
                        <Text style={[styles.tabText, i === 0 && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {orders.map((order) => {
                    const { icon, color } = getStatusIcon(order.status);
                    return (
                        <TouchableOpacity key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>{order.id}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                                    <Ionicons name={icon} size={12} color={color} />
                                    <Text style={[styles.statusText, { color }]}>{order.status}</Text>
                                </View>
                            </View>

                            <View style={styles.orderBody}>
                                <View style={styles.brandIcon}>
                                    <Ionicons name="leaf" size={24} color="#10b981" />
                                </View>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.brandName}>{order.brand}</Text>
                                    <Text style={styles.orderMeta}>{order.items} items • {order.date}</Text>
                                </View>
                                <Text style={styles.orderAmount}>${order.amount}</Text>
                            </View>

                            {order.eta && (
                                <View style={styles.etaRow}>
                                    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                    <Text style={styles.etaText}>Expected: {order.eta}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'white' },
    activeTab: { backgroundColor: '#3b82f6' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    activeTabText: { color: 'white' },
    orderCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    orderBody: { flexDirection: 'row', alignItems: 'center' },
    brandIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderInfo: { flex: 1, marginLeft: 12 },
    brandName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    orderMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    orderAmount: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    etaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 6 },
    etaText: { fontSize: 12, color: '#6b7280' },
});
