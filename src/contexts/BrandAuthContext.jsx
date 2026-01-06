import React, { createContext, useContext, useState } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth, ADMIN_EMAILS } from "./AuthContext";

// Placeholder licenses for all 8 brands
export const BRAND_LICENSES = {
    'OCM-AUCP-2024-000101': { brandId: 'wanders', brandName: 'Wanders New York' },
    'OCM-AUCP-2024-000102': { brandId: 'honey-king', brandName: 'Honey King' },
    'OCM-AUCP-2024-000103': { brandId: 'bud-cracker', brandName: 'Bud Cracker Boulevard' },
    'OCM-AUCP-2024-000104': { brandId: 'canna-dots', brandName: 'Canna Dots' },
    'OCM-AUCP-2024-000105': { brandId: 'space-poppers', brandName: 'Space Poppers' },
    'OCM-AUCP-2024-000106': { brandId: 'smoothie-bar', brandName: 'Smoothie Bar' },
    'OCM-AUCP-2024-000107': { brandId: 'waferz', brandName: 'Waferz NY' },
    'OCM-AUCP-2024-000108': { brandId: 'pines', brandName: 'Pines' },
};

const BrandAuthContext = createContext();

export function useBrandAuth() {
    return useContext(BrandAuthContext);
}

export function BrandAuthProvider({ children }) {
    const [brandUser, setBrandUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser: authUser } = useAuth(); // renamed for clarity

    // Sync brandUser with Firebase Auth state
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Check if this user is a brand user
                    const docRef = doc(db, "brand_users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const mapping = docSnap.data();
                        const brandInfo = BRAND_LICENSES[mapping.licenseNumber];
                        setBrandUser({
                            ...brandInfo,
                            email: user.email,
                            uid: user.uid,
                            licenseNumber: mapping.licenseNumber
                        });
                    } else if (brandUser && !brandUser.isImpersonating) {
                        // User logged in but no brand mapping found
                        setBrandUser(null);
                    }
                } catch (err) {
                    console.error("Error fetching brand user mapping:", err);
                    setBrandUser(null);
                }
            } else {
                setBrandUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Validate license number and return brand info if valid
    function validateLicense(licenseNumber) {
        const normalized = licenseNumber?.toUpperCase().trim();
        return BRAND_LICENSES[normalized] || null;
    }

    // Signup with license verification
    async function signupBrand(email, password, licenseNumber) {
        setLoading(true);
        try {
            const brandInfo = validateLicense(licenseNumber);
            if (!brandInfo) {
                throw new Error('Invalid license number. Please check your brand license.');
            }

            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create Mapping in Firestore
            const license = licenseNumber.toUpperCase().trim();
            await setDoc(doc(db, "brand_users", user.uid), {
                uid: user.uid,
                email: email,
                licenseNumber: license,
                brandId: brandInfo.brandId,
                createdAt: new Date().toISOString()
            });

            // State will be updated by onAuthStateChanged
            return user;
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Login with license verification
    async function loginBrand(email, password, licenseNumber) {
        setLoading(true);
        try {
            const brandInfo = validateLicense(licenseNumber);
            if (!brandInfo) {
                throw new Error('Invalid license number. Please check your brand license.');
            }

            // 1. Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Verification of mapping (optional as listener will catch it, but good for immediate feedback)
            const docRef = doc(db, "brand_users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // If it's a new login or mapping missing, we might need to handle it
                // For now, if license was provided and valid, we could auto-create mapping if we want
                // But normally signup handles this. If they login with different license, what happens?
                // Let's enforce that the mapping must match the provided license for standard login.
                throw new Error('Account exists but not linked to this brand license. Please contact support.');
            }

            const mapping = docSnap.data();
            if (mapping.licenseNumber.toUpperCase().trim() !== licenseNumber.toUpperCase().trim()) {
                throw new Error("This account is linked to a different brand license.");
            }

            return user;
        } catch (error) {
            console.error("Login error:", error);
            let msg = error.message;
            if (msg.includes("auth/invalid-credential")) msg = "Invalid email or password.";
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }

    // Dev test login - bypasses license verification
    function devBrandLogin(brandId) {
        // Find brand info by brandId
        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);

        if (!licenseKey) {
            console.error('Unknown brand ID for dev login');
            return null;
        }

        const brandInfo = BRAND_LICENSES[licenseKey];

        const mockBrandUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: `${brandId}@example.com`,
            displayName: brandInfo.brandName,
            uid: `brand-${brandId}`
        };

        setBrandUser(mockBrandUser);
        return mockBrandUser;
    }

    // Mock Google Login for Brand Portal - Updated to real logic
    async function loginWithGoogle(licenseNumber) {
        setLoading(true);
        try {
            const googleProvider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check for existing mapping
            const docRef = doc(db, "brand_users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                if (!licenseNumber) {
                    // Force them to provide a license if they haven't linked yet
                    await auth.signOut();
                    throw new Error("This Google account is not linked to a brand. Please sign in with your brand license first.");
                }

                const brandInfo = validateLicense(licenseNumber);
                if (!brandInfo) throw new Error('Invalid license number.');

                // Create the mapping
                await setDoc(doc(db, "brand_users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    licenseNumber: licenseNumber.toUpperCase().trim(),
                    brandId: brandInfo.brandId,
                    createdAt: new Date().toISOString()
                });
            }

            return user;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Admin Backdoor: Impersonate a brand
    function impersonateBrand(brandId) {
        // Verify Admin via AuthContext
        const isAuthorized = authUser && ADMIN_EMAILS.includes(authUser.email?.toLowerCase());

        if (!isAuthorized) {
            console.error("Unauthorized attempt to impersonate brand.");
            throw new Error("Access Denied: You are not an authorized administrator.");
        }

        // Find brand info by brandId
        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);
        if (!licenseKey) throw new Error("Brand not found.");

        const brandInfo = BRAND_LICENSES[licenseKey];

        const ghostUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: authUser.email, // Use admin email
            displayName: `👻 ${brandInfo.brandName} (Admin)`,
            uid: `ghost-${brandId}`,
            isImpersonating: true
        };

        setBrandUser(ghostUser);
        return ghostUser;
    }

    // Real Password reset functionality
    async function resetPassword(email) {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset link sent to your email.' };
        } catch (error) {
            console.error("Password reset error:", error);
            let msg = error.message;
            if (msg.includes("user-not-found")) msg = "No user found with this email.";
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function logoutBrand() {
        await auth.signOut();
        setBrandUser(null);
    }

    const value = {
        brandUser,
        loading,
        validateLicense,
        loginBrand,
        signupBrand,
        loginWithGoogle,
        devBrandLogin,
        impersonateBrand,
        resetPassword,
        logoutBrand
    };

    return (
        <BrandAuthContext.Provider value={value}>
            {!loading && children}
        </BrandAuthContext.Provider>
    );
}
