import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettings() {
    const { logout, user } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="shield-checkmark" size={32} color="white" />
                    </View>
                    <Text style={styles.profileName}>{user?.name || 'Admin User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || 'admin@greentruth.com'}</Text>
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Administrator</Text>
                    </View>
                </View>

                {/* Settings List */}
                <View style={styles.settingsList}>
                    <SettingRow icon="notifications" label="Notifications" />
                    <SettingRow icon="people" label="Team Permissions" />
                    <SettingRow icon="card" label="Billing Settings" />
                    <SettingRow icon="document-text" label="Invoice Templates" />
                    <SettingRow icon="analytics" label="Reports & Analytics" />
                </View>

                <View style={[styles.settingsList, { marginTop: 20 }]}>
                    <SettingRow icon="help-circle" label="Help Center" />
                    <SettingRow icon="information-circle" label="About" />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingRow({ icon, label, onPress }) {
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            Alert.alert(label, 'This feature is coming soon!');
        }
    };

    return (
        <TouchableOpacity style={styles.settingRow} onPress={handlePress}>
            <Ionicons name={icon} size={22} color="#374151" />
            <Text style={styles.settingLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fef2f2',
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
    profileCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    adminBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    adminBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#b45309',
    },
    settingsList: {
        marginHorizontal: 20,
        marginTop: 24,
        backgroundColor: 'white',
        borderRadius: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 24,
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 24,
        marginBottom: 40,
    },
});
