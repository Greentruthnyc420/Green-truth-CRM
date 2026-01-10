import React, { createContext, useContext, useState } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { useAuth, ADMIN_EMAILS } from "./AuthContext";

// Reserved System IDs
export const INTERNAL_BRAND_ID = 'greentruth';

// Available brands for signup - users select from dropdown and enter their REAL license
// No fake license validation - license is stored as-is
export const AVAILABLE_BRANDS = {
    'honey-king': { brandId: 'honey-king', brandName: 'Honey King' },
    'bud-cracker': { brandId: 'bud-cracker', brandName: 'Bud Cracker Boulevard' },
    'canna-dots': { brandId: 'canna-dots', brandName: 'Canna Dots' },
    'space-poppers': { brandId: 'space-poppers', brandName: 'Space Poppers' },
    'smoothie-bar': { brandId: 'smoothie-bar', brandName: 'Smoothie Bar' },
    'waferz': { brandId: 'waferz', brandName: 'Waferz NY' },
    'pines': { brandId: 'pines', brandName: 'Pines' },
    'flx-extracts': { brandId: 'flx-extracts', brandName: 'FLX Extracts', isProcessor: true }
};

// Legacy support: Map old license numbers to brands (for existing users)
// New users should not use these - they select brand from dropdown
export const BRAND_LICENSES = {
    ...Object.fromEntries(
        Object.entries(AVAILABLE_BRANDS).map(([id, brand]) => [id, brand])
    ),
    'greentruth': { brandId: 'greentruth', brandName: 'Green Truth NYC' }
};

// Users who manage multiple brands (email -> brandIds)
const MULTI_BRAND_USERS = {
    'paripatelny@gmail.com': ['pines', 'smoothie-bar', 'waferz']
};

// FLX Processor users get access to all FLX sub-brands
const FLX_SUB_BRANDS = ['pines', 'smoothie-bar', 'waferz'];



const BrandAuthContext = createContext();

export function useBrandAuth() {
    return useContext(BrandAuthContext);
}

import { supabase } from '../services/supabaseClient';

export function BrandAuthProvider({ children }) {
    const [brandUser, setBrandUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser: authUser } = useAuth(); // renamed for clarity

    // Sync brandUser with Firebase Auth state
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Check if this user is a brand user (Supabase)
                    const { data: mapping, error } = await supabase
                        .from('brand_users')
                        .select('*')
                        .eq('uid', user.uid)
                        .single();

                    if (mapping) {
                        const brandInfo = BRAND_LICENSES[mapping.licenseNumber];

                        if (!brandInfo) {
                            console.warn("Brand license not found for user:", mapping.licenseNumber);
                            setBrandUser(null);
                        } else {
                            // Support for multi-brand
                            let extraBrands = [];
                            const multiBrandConfig = MULTI_BRAND_USERS[user.email?.toLowerCase()];
                            if (multiBrandConfig && Array.isArray(multiBrandConfig)) {
                                extraBrands = multiBrandConfig.map(bid => {
                                    const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                                    return key ? { ...BRAND_LICENSES[key], license: key } : null;
                                }).filter(Boolean);
                            } else if (mapping.allowedBrands && Array.isArray(mapping.allowedBrands)) {
                                extraBrands = mapping.allowedBrands.filter(Boolean); // Assuming migrated JSON structure matches
                            }

                            setBrandUser({
                                ...brandInfo,
                                email: user.email,
                                uid: user.uid,
                                licenseNumber: mapping.licenseNumber,
                                allowedBrands: extraBrands.length > 0 ? extraBrands : [{ ...brandInfo, license: mapping.licenseNumber }]
                            });
                        }
                    } else if (brandUser && !brandUser.isImpersonating) {
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

            // 2. Create Mapping in Supabase
            const license = licenseNumber.toUpperCase().trim();
            const { error } = await supabase.from('brand_users').insert([{
                uid: user.uid,
                email: email,
                licenseNumber: license,
                brandId: brandInfo.brandId,
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

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

            // 2. Verification of mapping (Supabase)
            const { data: mapping, error } = await supabase
                .from('brand_users')
                .select('*')
                .eq('uid', user.uid)
                .single();

            if (!mapping) {
                throw new Error('Account exists but not linked to this brand license. Please contact support.');
            }

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

            // Check for existing mapping (Supabase)
            const { data: mapping } = await supabase
                .from('brand_users')
                .select('*')
                .eq('uid', user.uid)
                .single();

            if (!mapping) {
                if (!licenseNumber) {
                    await auth.signOut();
                    throw new Error("This Google account is not linked to a brand. Please sign in with your brand license first.");
                }

                const brandInfo = validateLicense(licenseNumber);
                if (!brandInfo) throw new Error('Invalid license number.');

                // Create the mapping (Supabase)
                const { error } = await supabase.from('brand_users').insert([{
                    uid: user.uid,
                    email: user.email,
                    licenseNumber: licenseNumber.toUpperCase().trim(),
                    brandId: brandInfo.brandId,
                    created_at: new Date().toISOString()
                }]);
                if (error) throw error;
            }

            return user;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Switch context for multi-brand users (Processors)
    function switchBrand(targetBrandId) {
        if (!brandUser || !brandUser.allowedBrands) return;

        const targetBrand = brandUser.allowedBrands.find(b => b.brandId === targetBrandId);
        // Also allow switching back to the "Root" brand if it's not in the array (usually the license holder)
        const isRoot = brandUser.licenseNumber && BRAND_LICENSES[brandUser.licenseNumber]?.brandId === targetBrandId;

        if (targetBrand || isRoot) {
            const newBrandInfo = targetBrand || BRAND_LICENSES[brandUser.licenseNumber];
            setBrandUser(prev => ({
                ...prev,
                ...newBrandInfo,
                // Keep the root license/email/uid same, just swap permission context
                // But we might want to flag that we are "viewing as" someone else?
                // For now, simple swap is enough as the UI uses brandId
            }));
        } else {
            console.warn("Attempted to switch to unauthorized brand:", targetBrandId);
        }
    }

    // Admin Backdoor: Impersonate a brand
    function impersonateBrand(brandId, returnUrl = null) {
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

        // Processor Logic: If impersonating a processor, give them their sub-brands
        let extraBrands = [];
        if (brandInfo.isProcessor && brandId === 'flx-extracts') {
            extraBrands = FLX_SUB_BRANDS.map(bid => {
                const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                return key ? { ...BRAND_LICENSES[key], license: key } : null;
            }).filter(Boolean);
        }

        const ghostUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: authUser.email, // Use admin email
            displayName: `👻 ${brandInfo.brandName} (Admin)`,
            uid: `ghost-${brandId}`,
            isImpersonating: true,
            returnUrl: returnUrl, // Store the URL to return to
            allowedBrands: extraBrands
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
        try {
            await auth.signOut();
        } catch (err) {
            console.error("Error during brand sign out:", err);
        } finally {
            setBrandUser(null);
        }
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
        switchBrand,
        resetPassword,
        logoutBrand
    };

    return (
        <BrandAuthContext.Provider value={value}>
            {!loading && children}
        </BrandAuthContext.Provider>
    );
}
