import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function DispensaryProfile({ navigation }) {
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: 'storefront-outline', label: 'Store Information' },
        { icon: 'location-outline', label: 'Delivery Address' },
        { icon: 'card-outline', label: 'Payment Methods' },
        { icon: 'document-text-outline', label: 'Licenses & Docs' },
        { icon: 'notifications-outline', label: 'Notifications' },
        { icon: 'help-circle-outline', label: 'Support' },
    ];

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.replace('Login');
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.storeIcon}>
                        <Ionicons name="storefront" size={40} color="#3b82f6" />
                    </View>
                    <Text style={styles.storeName}>{user?.name || 'Green Leaf NYC'}</Text>
                    <Text style={styles.storeAddress}>123 Cannabis Ave, New York, NY</Text>
                    <View style={styles.licenseBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                        <Text style={styles.licenseText}>License #NY-DIS-12345</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>$24.5K</Text>
                        <Text style={styles.statLabel}>Lifetime Orders</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>47</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity key={i} style={styles.menuItem}>
                            <Ionicons name={item.icon} size={22} color="#374151" />
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {user?.isDev && (
                    <View style={styles.devInfo}>
                        <Text style={styles.devInfoText}>🔧 Dev Mode Active</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#3b82f6',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    storeIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    storeName: { fontSize: 22, fontWeight: 'bold', color: 'white', marginTop: 12 },
    storeAddress: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
    licenseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    licenseText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    divider: { width: 1, backgroundColor: '#e5e7eb' },
    menuSection: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuLabel: { flex: 1, fontSize: 15, color: '#111827', marginLeft: 12 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginVertical: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fef2f2',
        gap: 8,
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
    devInfo: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    devInfoText: { fontSize: 12, color: '#9ca3af' },
});
