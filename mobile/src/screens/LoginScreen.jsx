import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
    const { devLogin, pinLogin, saveRememberMe, shouldAutoLogin, navTarget, clearAutoLogin, loading: authLoading } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX

    // Auto-redirect if user chose "Keep me signed in"
    useEffect(() => {
        if (shouldAutoLogin && navTarget && !authLoading) {
            clearAutoLogin();
            navigation.replace(navTarget);
        }
    }, [shouldAutoLogin, navTarget, authLoading]);

    const roles = [
        { id: ROLES.REP, name: 'Sales Rep', icon: 'people', color: '#10b981', bgColor: '#d1fae5', navTarget: 'RepTabs' },
        { id: ROLES.BRAND, name: 'Brand Partner', icon: 'business', color: '#8b5cf6', bgColor: '#ede9fe', navTarget: 'BrandTabs' },
        { id: ROLES.DISPENSARY, name: 'Dispensary', icon: 'storefront', color: '#3b82f6', bgColor: '#dbeafe', navTarget: 'DispensaryTabs' },
        { id: ROLES.ADMIN, name: 'Admin', icon: 'shield-checkmark', color: '#ef4444', bgColor: '#fee2e2', navTarget: 'AdminTabs' },
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setShowPinInput(true);
    };

    const handleDevLogin = async (role) => {
        setLoading(true);
        try {
            const result = await devLogin(role.id, {
                brandId: role.id === ROLES.BRAND ? 'jusbud' : undefined,
            });

            if (result.success) {
                // Save remember preference
                await saveRememberMe(rememberMe, role.navTarget);
                navigation.replace(role.navTarget);
            } else {
                Alert.alert('Login Failed', result.error || 'Unknown error');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length !== 4) {
            Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
            return;
        }

        setLoading(true);
        try {
            const result = await pinLogin(selectedRole.id, pin);

            if (result.success) {
                // Save remember preference
                await saveRememberMe(rememberMe, selectedRole.navTarget);
                navigation.replace(selectedRole.navTarget);
            } else {
                Alert.alert('Login Failed', result.error || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (showPinInput && selectedRole) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => { setShowPinInput(false); setPin(''); }}>
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>

                <View style={styles.pinContainer}>
                    <View style={[styles.roleIconLarge, { backgroundColor: selectedRole.bgColor }]}>
                        <Ionicons name={selectedRole.icon} size={48} color={selectedRole.color} />
                    </View>
                    <Text style={styles.roleTitle}>{selectedRole.name}</Text>
                    <Text style={styles.pinLabel}>Enter Your PIN</Text>

                    <TextInput
                        style={styles.pinInput}
                        placeholder="••••"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        value={pin}
                        onChangeText={setPin}
                        autoFocus
                    />

                    {/* Keep me signed in checkbox */}
                    <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={() => setRememberMe(!rememberMe)}
                    >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                            {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                        <Text style={styles.rememberMeText}>Keep me signed in</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: selectedRole.color }]}
                        onPress={handlePinSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {__DEV__ && (
                        <TouchableOpacity
                            style={styles.devBypass}
                            onPress={() => handleDevLogin(selectedRole)}
                            disabled={loading}
                        >
                            <Text style={styles.devBypassText}>🔓 DEV BYPASS</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>🌿 The Green Truth NYC</Text>
                <Text style={styles.subtitle}>Cannabis B2B Platform</Text>
            </View>

            <Text style={styles.selectLabel}>Select Your Role</Text>

            <View style={styles.rolesContainer}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={styles.roleCard}
                        onPress={() => handleRoleSelect(role)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: role.bgColor }]}>
                            <Ionicons name={role.icon} size={32} color={role.color} />
                        </View>
                        <Text style={styles.roleName}>{role.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                ))}
            </View>

            {__DEV__ && (
                <View style={styles.devSection}>
                    <Text style={styles.devTitle}>Developer Quick Access</Text>
                    <View style={styles.devButtons}>
                        {roles.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                style={[styles.devButton, { borderColor: role.color }]}
                                onPress={() => handleDevLogin(role)}
                                disabled={loading}
                            >
                                <Ionicons name={role.icon} size={16} color={role.color} />
                                <Text style={[styles.devButtonText, { color: role.color }]}>{role.id}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    selectLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    rolesContainer: {
        gap: 12,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12,
    },
    roleIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    roleName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    pinContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    roleIconLarge: {
        width: 100,
        height: 100,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    roleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 32,
    },
    pinLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    pinInput: {
        width: '100%',
        height: 56,
        backgroundColor: 'white',
        borderRadius: 12,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 24,
    },
    loginButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    devBypass: {
        marginTop: 24,
        padding: 12,
    },
    devBypassText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    devSection: {
        marginTop: 'auto',
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
    },
    devTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 12,
        textAlign: 'center',
    },
    devButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    devButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'white',
    },
    devButtonText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#374151',
    },
});
