import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RepOrders() {
    const orders = [
        { id: 1, dispensary: 'Green Leaf NYC', amount: 450, commission: 9.00, status: 'paid', date: 'Jan 18' },
        { id: 2, dispensary: 'Canna Corner', amount: 280, commission: 5.60, status: 'pending', date: 'Jan 16' },
        { id: 3, dispensary: 'NYC Wellness', amount: 620, commission: 12.40, status: 'pending', date: 'Jan 14' },
    ];

    const totalPending = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.commission, 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders</Text>
                <Text style={styles.subtitle}>Commission tracking</Text>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={styles.summaryValue}>${totalPending.toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>This Month</Text>
                    <Text style={styles.summaryValue}>$156.80</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {orders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderDispensary}>{order.dispensary}</Text>
                            <Text style={styles.orderDate}>{order.date}</Text>
                        </View>
                        <View style={styles.orderDetails}>
                            <View>
                                <Text style={styles.orderAmount}>${order.amount.toFixed(2)}</Text>
                                <Text style={styles.orderLabel}>Sale Amount</Text>
                            </View>
                            <View style={styles.commissionBox}>
                                <Text style={styles.commissionValue}>+${order.commission.toFixed(2)}</Text>
                                <View style={[styles.statusDot, { backgroundColor: order.status === 'paid' ? '#10b981' : '#f59e0b' }]} />
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: '#9ca3af' },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 4 },
    divider: { width: 1, backgroundColor: '#374151', marginHorizontal: 16 },
    orderCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    orderDispensary: { fontSize: 16, fontWeight: '600', color: '#111827' },
    orderDate: { fontSize: 12, color: '#9ca3af' },
    orderDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderAmount: { fontSize: 18, fontWeight: '600', color: '#374151' },
    orderLabel: { fontSize: 11, color: '#9ca3af' },
    commissionBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commissionValue: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
});
