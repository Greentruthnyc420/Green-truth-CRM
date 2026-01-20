import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { logSecurityEvent, getUserRole } from "../services/firestoreService";
import { sendAdminNotification, createUserRegistrationEmail } from '../services/adminNotifications';

// Super Admin fallback - Omar's emails are ALWAYS super_admin regardless of database
// This prevents accidental lockout
export const SUPER_ADMIN_EMAILS = [
    'omar@thegreentruthnyc.com'
];

// Legacy hardcoded arrays - kept for backward compatibility but database is primary source
export const ADMIN_EMAILS = [
    'omar@thegreentruthnyc.com',
    'amber@thegreentruthnyc.com',
    'admin@flx.com',
    'realtest@test.com',
    'omar@gmail.com'
];

export const SOCIAL_MANAGER_EMAILS = [
    'alyssa@thegreentruthnyc.com'
];

// Role check helper functions (updated to check database role first, fallback to hardcoded)
export const isSuperAdmin = (email) => SUPER_ADMIN_EMAILS.includes(email?.toLowerCase());
export const isAdmin = (email) => ADMIN_EMAILS.includes(email?.toLowerCase());
export const isSocialManager = (email) => SOCIAL_MANAGER_EMAILS.includes(email?.toLowerCase());
export const hasCalendarAccess = (email) => isAdmin(email) || isSocialManager(email);

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // Dynamic role from database
    const [loading, setLoading] = useState(true);

    // Check if user has a specific role (uses database first, fallback to hardcoded)
    const hasRole = (role) => {
        if (!currentUser?.email) return false;
        const email = currentUser.email.toLowerCase();

        // Super admin always has all access
        if (SUPER_ADMIN_EMAILS.includes(email)) return true;

        // Check database role first
        if (userRole?.role === role) return true;
        if (userRole?.role === 'super_admin') return true;
        if (role === 'admin' && userRole?.role === 'super_admin') return true;

        // Fallback to hardcoded arrays
        if (role === 'admin' && ADMIN_EMAILS.includes(email)) return true;
        if (role === 'social_manager' && SOCIAL_MANAGER_EMAILS.includes(email)) return true;

        return false;
    };

    // Check if current user is super admin (can manage other admins)
    const isSuperAdminUser = () => {
        if (!currentUser?.email) return false;
        const email = currentUser.email.toLowerCase();

        // Hardcoded super admins (Omar)
        if (SUPER_ADMIN_EMAILS.includes(email)) return true;

        // Database super admin
        if (userRole?.role === 'super_admin') return true;

        return false;
    };

    // Check if current user is admin (including super admin)
    const isAdminUser = () => {
        return hasRole('admin') || isSuperAdminUser();
    };

    // Check if current user is social manager
    const isSocialManagerUser = () => {
        return hasRole('social_manager');
    };

    // Check if user can view full calendar (admins + social managers)
    const canViewFullCalendar = () => {
        return isAdminUser() || isSocialManagerUser();
    };

    // Domain Validation Helper
    const validateDomain = async (email, action) => {
        if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
        return true;
    };

    // Handle Redirect Result
    useEffect(() => {
        getRedirectResult(auth)
            .then(async (result) => {
                if (result) {
                    const user = result.user;
                    console.log("Google Redirect Sign-In Successful:", user.email);
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential?.accessToken;
                    await validateDomain(user.email, 'GOOGLE_REDIRECT_LOGIN');

                    if (token) {
                        sessionStorage.setItem('googleAccessToken', token);
                    }
                    user.accessToken = token;
                    setCurrentUser(user);

                    // Load role from database
                    loadUserRole(user.email);
                }
            })
            .catch((error) => {
                console.error("Redirect Login Error:", error);
            });
    }, []);

    // Load user role from database
    const loadUserRole = async (email) => {
        if (!email) {
            setUserRole(null);
            return;
        }

        try {
            const role = await getUserRole(email);
            setUserRole(role);
        } catch (error) {
            console.error("Failed to load user role:", error);
            setUserRole(null);
        }
    };

    async function signup(email, password) {
        await validateDomain(email, 'SIGNUP_ATTEMPT');
        return createUserWithEmailAndPassword(auth, email, password);
    }

    async function login(email, password) {
        await validateDomain(email, 'LOGIN_ATTEMPT');
        return signInWithEmailAndPassword(auth, email, password);
    }

    googleProvider.setCustomParameters({ prompt: 'select_account' });

    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            await validateDomain(user.email, 'GOOGLE_LOGIN_ATTEMPT');

            if (token) {
                sessionStorage.setItem('googleAccessToken', token);
            }

            user.accessToken = token;
            setCurrentUser(user);

            // Load role from database
            await loadUserRole(user.email);

            return result;
        } catch (error) {
            console.error("Google Sign-In Error (Popup):", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);

            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
                console.warn("Popup failed, falling back to Redirect method...");
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return;
                } catch (redirectError) {
                    console.error("Redirect Fallback failed:", redirectError);
                }
            }

            if (error.message && error.message.includes("Access Restricted")) {
                await signOut(auth);
            }
            throw error;
        }
    }

    async function logout() {
        sessionStorage.removeItem('googleAccessToken');
        await signOut(auth);
        setCurrentUser(null);
        setUserRole(null);
    }

    async function resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset link sent to your email.' };
        } catch (error) {
            console.error("Password reset error:", error);
            let msg = error.message;
            if (msg.includes("user-not-found")) msg = "No user found with this email.";
            if (msg.includes("invalid-email")) msg = "Please enter a valid email address.";
            throw new Error(msg);
        }
    }

    // Dev Helper
    function devLogin(email) {
        const isSuperAdminDev = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
        const isAdminDev = ADMIN_EMAILS.includes(email.toLowerCase());
        const mockUser = {
            uid: isSuperAdminDev ? 'super-admin-user-id-123' : (isAdminDev ? 'admin-user-id-123' : 'dev-test-user'),
            email: email,
            displayName: isSuperAdminDev ? 'Omar (Super Admin)' : (isAdminDev ? 'Admin' : 'Dev Tester'),
            emailVerified: true
        };
        setCurrentUser(mockUser);

        // Load role for dev user
        loadUserRole(email);

        return Promise.resolve(mockUser);
    }

    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted) {
                console.warn("Auth check timeout safety trigger.");
                setLoading(false);
            }
        }, 3000);

        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (mounted) {
                    if (user) {
                        try {
                            const token = sessionStorage.getItem('googleAccessToken');
                            if (token) {
                                user.accessToken = token;
                            }

                            // Load user role from database
                            await loadUserRole(user.email);

                            // Auto-create Supabase profile if it doesn't exist
                            const { supabase } = await import('../services/supabaseClient');
                            const { data: profile, error: profileError } = await supabase
                                .from('users')
                                .select('role')
                                .eq('id', user.uid)
                                .single();

                            if (!profile && profileError?.code === 'PGRST116') {
                                const { createUserProfile } = await import('../services/firestoreService');

                                const referralId = sessionStorage.getItem('referralRef');
                                const signupRole = sessionStorage.getItem('signupRole');

                                await createUserProfile(user.uid, {
                                    email: user.email,
                                    name: user.displayName || user.email?.split('@')[0],
                                    role: signupRole || (referralId ? 'dispensary' : 'rep'),
                                    assigned_ambassador_id: referralId || null,
                                    created_at: new Date().toISOString()
                                });

                                sessionStorage.removeItem('referralRef');
                                sessionStorage.removeItem('signupRole');

                                try {
                                    const { html, text } = createUserRegistrationEmail({
                                        userEmail: user.email,
                                        role: signupRole || (referralId ? 'Dispensary Account' : 'Sales Representative'),
                                        timestamp: new Date().toLocaleString()
                                    });

                                    await sendAdminNotification({
                                        subject: `👤 New User Registered: ${user.email}`,
                                        html,
                                        text
                                    });
                                } catch (emailErr) {
                                    console.warn("New user email notification failed:", emailErr);
                                }
                            }
                        } catch (innerErr) {
                            console.warn("Profile sync or token handling failed:", innerErr);
                        }
                    } else {
                        setUserRole(null);
                    }
                    setCurrentUser(user);
                    setLoading(false);
                    clearTimeout(timeout);
                }
            });
            return () => {
                mounted = false;
                unsubscribe();
                clearTimeout(timeout);
            };
        } catch (error) {
            console.error("Auth listener setup failed:", error);
            if (mounted) {
                setLoading(false);
                clearTimeout(timeout);
            }
        }
    }, []);

    const value = {
        currentUser,
        userRole,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        devLogin,
        // New role check methods
        hasRole,
        isSuperAdminUser,
        isAdminUser,
        isSocialManagerUser,
        canViewFullCalendar,
        loadUserRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
