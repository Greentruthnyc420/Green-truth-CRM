import React, { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { logSecurityEvent } from "../services/firestoreService";

export const ADMIN_EMAILS = [
    'omar@thegreentruthnyc.com',
    'amber@thegreentruthnyc.com',
    'realtest@test.com',
    'omar@gmail.com'
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
        const allowedDomains = ['@thegreentruthnyc.com'];
        const isOrgEmail = allowedDomains.some(d => email.endsWith(d));

        if (!isOrgEmail) {
            await logSecurityEvent({
                email,
                action,
                status: 'BLOCKED',
                reason: 'Invalid Domain'
            });
            throw new Error("Access Restricted: Only @thegreentruthnyc.com emails are allowed for Sales Ambassadors.");
        }
        return true;
    };

    async function signup(email, password) {
        await validateDomain(email, 'SIGNUP_ATTEMPT');
        return createUserWithEmailAndPassword(auth, email, password);
    }

    async function login(email, password) {
        await validateDomain(email, 'LOGIN_ATTEMPT');
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function loginWithGoogle() {
        try {
            googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
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
            // Checks failed, ensure signed out
            if (error.message.includes("Access Restricted")) {
                await signOut(auth);
            }
            throw error;
        }
    }

    function logout() {
        sessionStorage.removeItem('googleAccessToken');
        return signOut(auth);
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
        const isAdmin = ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com', 'amber@thegreentruthnyc.com'].includes(email);
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
                console.warn("Auth check timed out, forcing load.");
                setLoading(false);
            }
        }, 2000);

        try {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (mounted) {
                    if (user) {
                        const token = sessionStorage.getItem('googleAccessToken');
                        if (token) {
                            user.accessToken = token;
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
