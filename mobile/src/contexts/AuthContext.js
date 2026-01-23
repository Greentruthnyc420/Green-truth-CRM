import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseService';

const AuthContext = createContext(null);

export const ROLES = {
    REP: 'rep',
    BRAND: 'brand',
    DISPENSARY: 'dispensary',
    ADMIN: 'admin',
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [brandId, setBrandId] = useState(null);
    const [shouldAutoLogin, setShouldAutoLogin] = useState(false);
    const [navTarget, setNavTarget] = useState(null);

    useEffect(() => {
        // Check for stored session on mount
        checkStoredSession();
    }, []);

    const checkStoredSession = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('@greentruth_user');
            const storedRole = await AsyncStorage.getItem('@greentruth_role');
            const storedBrandId = await AsyncStorage.getItem('@greentruth_brand_id');
            const rememberMe = await AsyncStorage.getItem('@greentruth_remember_me');
            const storedNavTarget = await AsyncStorage.getItem('@greentruth_nav_target');

            if (storedUser && storedRole && rememberMe === 'true') {
                setUser(JSON.parse(storedUser));
                setRole(storedRole);
                if (storedBrandId) setBrandId(storedBrandId);
                if (storedNavTarget) {
                    setShouldAutoLogin(true);
                    setNavTarget(storedNavTarget);
                }
            }
        } catch (error) {
            console.error('Error checking stored session:', error);
        } finally {
            setLoading(false);
        }
    };

    // Development bypass login
    const devLogin = async (selectedRole, extraData = {}) => {
        try {
            const devUser = {
                id: `dev-${selectedRole}-${Date.now()}`,
                email: `dev-${selectedRole}@greentruth.com`,
                name: selectedRole === ROLES.REP ? 'John Doe' :
                    selectedRole === ROLES.BRAND ? 'JUSBUD' : 'The Green Truth NYC',
                isDev: true,
                ...extraData,
            };

            await AsyncStorage.setItem('@greentruth_user', JSON.stringify(devUser));
            await AsyncStorage.setItem('@greentruth_role', selectedRole);

            if (selectedRole === ROLES.BRAND) {
                const brandIdToStore = extraData.brandId || 'jusbud';
                await AsyncStorage.setItem('@greentruth_brand_id', brandIdToStore);
                setBrandId(brandIdToStore);
            }

            setUser(devUser);
            setRole(selectedRole);

            return { success: true, role: selectedRole };
        } catch (error) {
            console.error('Dev login error:', error);
            return { success: false, error: error.message };
        }
    };

    // PIN-based login (for production)
    const pinLogin = async (selectedRole, pin) => {
        try {
            // For production, verify PIN against backend
            // This is a placeholder - implement actual PIN verification
            if (pin.length === 4) {
                // Simulate API call
                const devUser = {
                    id: `pin-${selectedRole}-${Date.now()}`,
                    email: `user-${selectedRole}@greentruth.com`,
                    name: 'Verified User',
                };

                await AsyncStorage.setItem('@greentruth_user', JSON.stringify(devUser));
                await AsyncStorage.setItem('@greentruth_role', selectedRole);

                setUser(devUser);
                setRole(selectedRole);

                return { success: true, role: selectedRole };
            }

            return { success: false, error: 'Invalid PIN' };
        } catch (error) {
            console.error('PIN login error:', error);
            return { success: false, error: error.message };
        }
    };

    // Supabase email login (optional)
    const emailLogin = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Determine role from user metadata or database
            const userRole = data.user?.user_metadata?.role || ROLES.DISPENSARY;

            await AsyncStorage.setItem('@greentruth_user', JSON.stringify(data.user));
            await AsyncStorage.setItem('@greentruth_role', userRole);

            setUser(data.user);
            setRole(userRole);

            return { success: true, role: userRole };
        } catch (error) {
            console.error('Email login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                '@greentruth_user',
                '@greentruth_role',
                '@greentruth_brand_id',
                '@greentruth_remember_me',
                '@greentruth_nav_target'
            ]);
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            setBrandId(null);
            setShouldAutoLogin(false);
            setNavTarget(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Save remember me preference
    const saveRememberMe = async (remember, target) => {
        try {
            if (remember) {
                await AsyncStorage.setItem('@greentruth_remember_me', 'true');
                await AsyncStorage.setItem('@greentruth_nav_target', target);
            } else {
                await AsyncStorage.multiRemove(['@greentruth_remember_me', '@greentruth_nav_target']);
            }
        } catch (error) {
            console.error('Error saving remember preference:', error);
        }
    };

    // Clear auto login after navigation
    const clearAutoLogin = () => {
        setShouldAutoLogin(false);
    };

    const value = {
        user,
        role,
        brandId,
        loading,
        shouldAutoLogin,
        navTarget,
        isAuthenticated: !!user,
        isRep: role === ROLES.REP,
        isBrand: role === ROLES.BRAND,
        isDispensary: role === ROLES.DISPENSARY,
        devLogin,
        pinLogin,
        emailLogin,
        logout,
        saveRememberMe,
        clearAutoLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
