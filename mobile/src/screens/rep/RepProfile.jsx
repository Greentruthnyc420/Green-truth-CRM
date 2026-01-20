import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function RepProfile({ navigation }) {
    const { user, logout } = useAuth();

    const profileItems = [
        { icon: 'person-outline', label: 'Personal Info', route: null },
        { icon: 'card-outline', label: 'Payment Settings', route: null },
        { icon: 'document-text-outline', label: 'Tax Documents', route: null },
        { icon: 'notifications-outline', label: 'Notifications', route: null },
        { icon: 'help-circle-outline', label: 'Help & Support', route: null },
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
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'JD'}</Text>
                    </View>
                    <Text style={styles.name}>{user?.name || 'John Doe'}</Text>
                    <Text style={styles.role}>Sales Ambassador</Text>
                    <View style={styles.badge}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.badgeText}>Gold Tier • 2,450 pts</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    {profileItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem}>
                            <Ionicons name={item.icon} size={22} color="#374151" />
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
        backgroundColor: 'white',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 28, fontWeight: 'bold', color: 'white' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 12 },
    role: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
    section: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuLabel: { flex: 1, fontSize: 15, color: '#111827', marginLeft: 12 },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fef2f2',
        gap: 8,
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
    devInfo: {
        alignItems: 'center',
        padding: 12,
        marginBottom: 40,
    },
    devInfoText: { fontSize: 12, color: '#9ca3af' },
});
