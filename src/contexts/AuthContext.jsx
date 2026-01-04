import React, { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { logSecurityEvent } from "../services/firestoreService";

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
        const allowedEmails = ['rep@test.com', 'test-user-123', 'admin-user-id-123', 'dev-test-user']; // Dev Allowlist

        const isValidComp = allowedDomains.some(d => email.endsWith(d));
        const isAllowlisted = allowedEmails.includes(email);

        if (!isValidComp && !isAllowlisted) {
            await logSecurityEvent({
                email,
                action,
                status: 'BLOCKED',
                reason: 'Invalid Domain'
            });
            throw new Error("Access Restricted: Only @thegreentruthnyc.com emails are allowed.");
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
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await validateDomain(user.email, 'GOOGLE_LOGIN_ATTEMPT');
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
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    // Dev Helper
    function devLogin(email) {
        const isAdmin = ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com'].includes(email);
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
