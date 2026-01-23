import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAdminStats } from '../../services/dataService';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalLeads: 0,
        totalSales: 0,
        totalActivations: 0,
        totalRevenue: 0,
        monthRevenue: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getAdminStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading admin stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatCurrency = (amount) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toFixed(0)}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text style={styles.loadingText}>Loading admin data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.greeting}>Admin Portal 🔐</Text>
                    <Text style={styles.title}>Dashboard Overview</Text>
                </View>

                {/* Key Metrics */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <Ionicons name="people" size={24} color="#ffffff" />
                        <Text style={[styles.statValue, styles.statValueLight]}>{stats.totalUsers}</Text>
                        <Text style={[styles.statLabel, styles.statLabelLight]}>Total Reps</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="storefront" size={24} color="#10b981" />
                        <Text style={styles.statValue}>{stats.totalLeads}</Text>
                        <Text style={styles.statLabel}>Leads</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="cart" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>{stats.totalSales}</Text>
                        <Text style={styles.statLabel}>Sales</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color="#8b5cf6" />
                        <Text style={styles.statValue}>{stats.totalActivations}</Text>
                        <Text style={styles.statLabel}>Activations</Text>
                    </View>
                </View>

                {/* Revenue Cards */}
                <Text style={styles.sectionTitle}>Revenue</Text>
                <View style={styles.revenueContainer}>
                    <View style={styles.revenueCard}>
                        <Ionicons name="trending-up" size={28} color="#10b981" />
                        <View style={styles.revenueContent}>
                            <Text style={styles.revenueValue}>{formatCurrency(stats.monthRevenue)}</Text>
                            <Text style={styles.revenueLabel}>This Month</Text>
                        </View>
                    </View>
                    <View style={styles.revenueCard}>
                        <Ionicons name="wallet" size={28} color="#3b82f6" />
                        <View style={styles.revenueContent}>
                            <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
                            <Text style={styles.revenueLabel}>All Time</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Management</Text>
                <View style={styles.actionsList}>
                    <ActionRow icon="people" label="Team Members" count={stats.totalUsers} color="#ef4444" />
                    <ActionRow icon="business" label="Pipeline" count={stats.totalLeads} color="#f59e0b" />
                    <ActionRow icon="receipt" label="Invoices" count={stats.totalSales} color="#10b981" />
                    <ActionRow icon="analytics" label="Analytics" color="#3b82f6" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function ActionRow({ icon, label, count, color }) {
    return (
        <View style={styles.actionRow}>
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
            {count !== undefined && (
                <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{count}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fef2f2',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
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
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'flex-start',
    },
    statCardPrimary: {
        backgroundColor: '#ef4444',
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
        color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 12,
    },
    revenueContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    revenueCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    revenueContent: {
        flex: 1,
    },
    revenueValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    revenueLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    actionsList: {
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginLeft: 12,
    },
    actionBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    actionBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
});
