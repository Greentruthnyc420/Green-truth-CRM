import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect, // Added
    getRedirectResult, // Added
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { logSecurityEvent } from "../services/firestoreService";
import { sendAdminNotification, createUserRegistrationEmail } from '../services/adminNotifications';

export const ADMIN_EMAILS = [
    'omar@thegreentruthnyc.com',
    'amber@thegreentruthnyc.com'
];

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Domain Validation Helper
    const validateDomain = async (email, action) => {
        if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
        // Strictly enforce @thegreentruthnyc.com for Sales Ambassadors/Staff
        // const isOrgEmail = email.toLowerCase().endsWith('@thegreentruthnyc.com');
        return true;
    };

    // Handle Redirect Result (for when Popup fails and we use Redirect instead)
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
                }
            })
            .catch((error) => {
                console.error("Redirect Login Error:", error);
            });
    }, []);

    async function signup(email, password) {
        await validateDomain(email, 'SIGNUP_ATTEMPT');
        return createUserWithEmailAndPassword(auth, email, password);
    }

    async function login(email, password) {
        await validateDomain(email, 'LOGIN_ATTEMPT');
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Configure Google Provider Scopes (Global Configuration)
    // We add the scope once here to avoid accumulation or re-configuration issues.
    // TEMPORARILY DISABLED: Testing if sensitive scope is causing desktop popup block
    // googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    // Ensure we force account selection to prevent auto-login loops with wrong accounts, 
    // but ONLY DO THIS if it's not causing the popup-closed issue. 
    // Re-enabling standard prompt just in case.
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            await validateDomain(user.email, 'GOOGLE_LOGIN_ATTEMPT');

            // Store token in session storage for persistence across reloads
            if (token) {
                sessionStorage.setItem('googleAccessToken', token);
            }

            user.accessToken = token;
            setCurrentUser(user);

            return result;
        } catch (error) {
            console.error("Google Sign-In Error (Popup):", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);

            // Fallback to Redirect if Popup is blocked or closed
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
                console.warn("Popup failed, falling back to Redirect method...");
                try {
                    await signInWithRedirect(auth, googleProvider);
                    // execution stops here as page redirects
                    return;
                } catch (redirectError) {
                    console.error("Redirect Fallback failed:", redirectError);
                }
            }

            // Checks failed, ensure signed out
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
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        const mockUser = {
            uid: isAdmin ? 'admin-user-id-123' : 'dev-test-user',
            email: email,
            displayName: isAdmin ? 'Omar' : 'Dev Tester',
            emailVerified: true
        };
        setCurrentUser(mockUser);
        return Promise.resolve(mockUser);
    }

    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted) {
                // If we are still loading after 3 seconds, force load.
                // But check if we are in a redirect operation first? 
                // Creating a small delay helps avoid race conditions with RedirectResult.
                console.warn("Auth check timeout safety trigger.");
                setLoading(false);
            }
        }, 3000); // Increased to 3s to allow redirect resolution

        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (mounted) {
                    if (user) {
                        const token = sessionStorage.getItem('googleAccessToken');
                        if (token) {
                            user.accessToken = token;
                        }

                        // Auto-create Supabase profile if it doesn't exist
                        try {
                            const { createUserProfile } = await import('../services/firestoreService');
                            await createUserProfile(user.uid, {
                                email: user.email,
                                name: user.displayName || user.email?.split('@')[0],
                                role: 'rep', // Default role
                                created_at: new Date().toISOString()
                            });

                            // Send admin notification
                            try {
                                const { html, text } = createUserRegistrationEmail({
                                    userEmail: user.email,
                                    role: 'Sales Representative',
                                    timestamp: new Date().toLocaleString()
                                });

                                await sendAdminNotification({
                                    subject: `👤 New Rep Registered: ${user.email}`,
                                    html,
                                    text
                                });
                            } catch (emailErr) {
                                console.warn("New user email notification failed:", emailErr);
                            }
                        } catch (err) {
                            console.warn("Failed to sync user profile to Supabase:", err);
                        }
                    }
                    setCurrentUser(user);
                    setLoading(false);
                    clearTimeout(timeout);
                }
            });
            return () => {
                mounted = false;
                clearTimeout(timeout);
                unsubscribe();
            };
        } catch (error) {
            console.warn("Firebase Auth listener failed (likely missing keys).", error);
            if (mounted) {
                setTimeout(() => setLoading(false), 0);
                clearTimeout(timeout);
            }
        }
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        devLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
