import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BrandOrders() {
    const orders = [
        { id: 'ORD-1234', dispensary: 'Green Leaf NYC', amount: 850, date: 'Jan 18', status: 'confirmed', paymentMethod: 'COD' },
        { id: 'ORD-1233', dispensary: 'Canna Corner', amount: 620, date: 'Jan 16', status: 'shipped', paymentMethod: 'Invoice' },
        { id: 'ORD-1232', dispensary: 'NYC Wellness', amount: 1200, date: 'Jan 14', status: 'delivered', paymentMethod: 'COD' },
    ];

    const getStatusStyle = (status) => {
        const styles = {
            pending: { bg: '#fef3c7', text: '#92400e' },
            confirmed: { bg: '#d1fae5', text: '#047857' },
            shipped: { bg: '#dbeafe', text: '#1d4ed8' },
            delivered: { bg: '#f3f4f6', text: '#374151' },
        };
        return styles[status] || styles.pending;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter" size={18} color="#374151" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {orders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    return (
                        <TouchableOpacity key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>{order.id}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.dispensaryName}>{order.dispensary}</Text>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderDate}>{order.date}</Text>
                                <View style={styles.paymentBadge}>
                                    <Ionicons name={order.paymentMethod === 'COD' ? 'cash' : 'document-text'} size={12} color="#6b7280" />
                                    <Text style={styles.paymentText}>{order.paymentMethod}</Text>
                                </View>
                                <Text style={styles.orderAmount}>${order.amount}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    filterBtn: { padding: 10, backgroundColor: 'white', borderRadius: 10 },
    orderCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    dispensaryName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    orderFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
    orderDate: { fontSize: 12, color: '#9ca3af' },
    paymentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    paymentText: { fontSize: 11, color: '#6b7280' },
    orderAmount: { marginLeft: 'auto', fontSize: 16, fontWeight: 'bold', color: '#111827' },
});
