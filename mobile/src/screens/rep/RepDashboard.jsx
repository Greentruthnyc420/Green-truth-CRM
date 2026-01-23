import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RepDashboard() {
    // Mock data - will be replaced with real data from shared services
    const stats = {
        lifetimePoints: 2450,
        monthPoints: 320,
        pendingCommission: 156.50,
        upcomingActivations: 3,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome back! 👋</Text>
                    <Text style={styles.title}>Rep Dashboard</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <Ionicons name="star" size={24} color="#fbbf24" />
                        <Text style={[styles.statValue, styles.statValueLight]}>{stats.lifetimePoints}</Text>
                        <Text style={[styles.statLabel, styles.statLabelLight]}>Lifetime Points</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up" size={24} color="#10b981" />
                        <Text style={styles.statValue}>{stats.monthPoints}</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="cash" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>${stats.pendingCommission}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color="#8b5cf6" />
                        <Text style={styles.statValue}>{stats.upcomingActivations}</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsContainer}>
                    <ActionButton icon="add-circle" label="Log Sale" color="#10b981" onPress={() => Alert.alert('Log Sale', 'Navigate to Log Sale screen')} />
                    <ActionButton icon="scan" label="Check In" color="#3b82f6" onPress={() => Alert.alert('Check In', 'Navigate to Check In screen')} />
                    <ActionButton icon="document-text" label="Submit Hours" color="#8b5cf6" onPress={() => Alert.alert('Submit Hours', 'Navigate to Submit Hours screen')} />
                </View>

                {/* Recent Activity */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: '#10b981' }]} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>Sale logged at Green Leaf Dispensary</Text>
                            <Text style={styles.activityTime}>2 hours ago • $245.00</Text>
                        </View>
                    </View>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: '#3b82f6' }]} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>Activation completed</Text>
                            <Text style={styles.activityTime}>Yesterday • 4 hours</Text>
                        </View>
                    </View>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: '#fbbf24' }]} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>+50 points earned</Text>
                            <Text style={styles.activityTime}>2 days ago</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function ActionButton({ icon, label, color, onPress }) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
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
    greeting: {
        fontSize: 14,
        color: '#6b7280',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 10,
    },
    statCard: {
        width: '47%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statCardPrimary: {
        backgroundColor: '#111827',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statValueLight: {
        color: '#ffffff',
    },
    statLabelLight: {
        color: '#9ca3af',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 12,
        color: '#374151',
        marginTop: 8,
        fontWeight: '500',
    },
    activityCard: {
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    activityTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
});
