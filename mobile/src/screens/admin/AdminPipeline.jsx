import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllLeads } from '../../services/dataService';

export default function AdminPipeline() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getAllLeads();
            setLeads(data);
        } catch (error) {
            console.error('Error loading leads:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'prospect': return '#f59e0b';
            case 'samples_requested': return '#3b82f6';
            case 'samples_delivered': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const renderLead = ({ item }) => (
        <View style={styles.leadCard}>
            <View style={styles.leadHeader}>
                <Text style={styles.leadName}>{item.dispensaryName}</Text>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.leadStatus) }]} />
            </View>
            <Text style={styles.leadAddress} numberOfLines={1}>{item.address || 'No address'}</Text>
            <View style={styles.leadFooter}>
                <View style={styles.repInfo}>
                    <Ionicons name="person-outline" size={14} color="#6b7280" />
                    <Text style={styles.repName}>{item.repAssigned || 'Unassigned'}</Text>
                </View>
                <Text style={styles.leadStatus}>{item.leadStatus || 'prospect'}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text style={styles.loadingText}>Loading pipeline...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sales Pipeline</Text>
                <Text style={styles.subtitle}>{leads.length} leads in pipeline</Text>
            </View>

            <FlatList
                data={leads}
                keyExtractor={(item) => item.id}
                renderItem={renderLead}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="business-outline" size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>No leads in pipeline</Text>
                    </View>
                }
            />
        </SafeAreaView>
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
        paddingBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    leadCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    leadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leadName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    leadAddress: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    leadFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    repInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    repName: {
        fontSize: 12,
        color: '#6b7280',
    },
    leadStatus: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
    },
});
