import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RepActivations() {
    // Mock data - will be replaced with real data
    const activations = [
        { id: 1, dispensary: 'The Green Truth NYC', brand: 'JUSBUD', date: 'Jan 22, 2025', time: '2:00 PM', status: 'upcoming' },
        { id: 2, dispensary: 'Canna Corner', brand: 'Silly Nice', date: 'Jan 24, 2025', time: '11:00 AM', status: 'upcoming' },
        { id: 3, dispensary: 'NYC Wellness', brand: 'Helios', date: 'Jan 26, 2025', time: '3:00 PM', status: 'pending' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'completed': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activations</Text>
                <Text style={styles.subtitle}>{activations.length} upcoming events</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {activations.map((activation) => (
                    <TouchableOpacity key={activation.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activation.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(activation.status) }]}>
                                    {activation.status.toUpperCase()}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </View>

                        <Text style={styles.dispensaryName}>{activation.dispensary}</Text>
                        <Text style={styles.brandName}>{activation.brand}</Text>

                        <View style={styles.cardFooter}>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                <Text style={styles.infoText}>{activation.date}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={16} color="#6b7280" />
                                <Text style={styles.infoText}>{activation.time}</Text>
                            </View>
                        </View>

                        {activation.status === 'upcoming' && (
                            <TouchableOpacity style={styles.checkInButton}>
                                <Ionicons name="scan" size={18} color="white" />
                                <Text style={styles.checkInText}>Check In</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    dispensaryName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    brandName: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#6b7280',
    },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    checkInText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});
